/**
 * Messaging Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase messagingService.ts → Supabase messagingService.ts
 *
 * @description
 * 채팅방 생성, 메시지 전송, 실시간 구독, 읽음 처리 등 메시징 기능 관리.
 * Firebase의 중첩 컬렉션(chatRooms/{id}/messages) 구조에서
 * Supabase의 관계형 테이블(chat_rooms, chat_room_participants, messages) 구조로 변환.
 *
 * 핵심 변환:
 * - chatRooms.participants[] → chat_room_participants 테이블
 * - chatRooms.unreadCount{} → chat_room_participants.unread_count
 * - chatRooms/{id}/messages → messages 테이블 (chat_room_id FK)
 * - onSnapshot → Supabase Realtime (postgres_changes)
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'
import type { Message, ChatRoom } from '../../types'
import { UserService } from './userService'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type ChatRoomRow = Database['public']['Tables']['chat_rooms']['Row']
type ChatRoomInsert = Database['public']['Tables']['chat_rooms']['Insert']
type ChatRoomUpdate = Database['public']['Tables']['chat_rooms']['Update']
type ParticipantRow = Database['public']['Tables']['chat_room_participants']['Row']
type ParticipantInsert = Database['public']['Tables']['chat_room_participants']['Insert']
type ParticipantUpdate = Database['public']['Tables']['chat_room_participants']['Update']
type MessageRow = Database['public']['Tables']['messages']['Row']
type MessageInsert = Database['public']['Tables']['messages']['Insert']

/**
 * MessageRow → Message 인터페이스 변환 헬퍼
 */
function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    createdAt: row.created_at,
    readAt: row.read_at || undefined,
    messageType: (row.message_type || 'text') as Message['messageType'],
    metadata: row.metadata as Message['metadata'] | undefined,
  }
}

/**
 * Supabase 데이터 → ChatRoom 인터페이스 변환 헬퍼
 *
 * Firebase ChatRoom 인터페이스 호환:
 * - participants: string[] (참가자 user_id 목록)
 * - unreadCount: { [userId: string]: number }
 * - lastMessage: Message | undefined
 * - lastMessageAt: string | undefined
 */
function toChatRoom(
  room: ChatRoomRow,
  participants: ParticipantRow[],
  lastMessage?: MessageRow | null
): ChatRoom {
  const participantIds = participants.map((p) => p.user_id)
  const unreadCount: { [userId: string]: number } = {}
  participants.forEach((p) => {
    unreadCount[p.user_id] = p.unread_count
  })

  return {
    id: room.id,
    participants: participantIds,
    lastMessage: lastMessage ? toMessage(lastMessage) : undefined,
    lastMessageAt: room.last_message_at || undefined,
    createdAt: room.created_at,
    updatedAt: room.updated_at,
    unreadCount,
  }
}

export class MessagingService {
  /**
   * 채팅방 생성 또는 기존 채팅방 찾기
   *
   * Firebase: chatRooms 컬렉션에서 participants 배열 검색
   * Supabase: chat_room_participants 테이블에서 두 사용자의 공통 room 검색
   *
   * @param userId1 - 첫 번째 사용자 ID (auth uid)
   * @param userId2 - 두 번째 사용자 ID (auth uid)
   * @returns ChatRoom 호환 객체
   */
  static async getOrCreateChatRoom(userId1: string, userId2: string): Promise<ChatRoom> {
    // 1단계: userId1이 참여하는 모든 room_id 조회
    const { data: myRooms } = await supabase
      .from('chat_room_participants')
      .select('chat_room_id')
      .eq('user_id', userId1)

    const myRoomData = (myRooms || []) as Pick<ParticipantRow, 'chat_room_id'>[]

    if (myRoomData.length > 0) {
      const myRoomIds = myRoomData.map((r) => r.chat_room_id)

      // 2단계: 그 room_id 중 userId2도 참여하는 room 찾기
      const { data: commonRooms } = await supabase
        .from('chat_room_participants')
        .select('chat_room_id')
        .eq('user_id', userId2)
        .in('chat_room_id', myRoomIds)

      const commonRoomData = (commonRooms || []) as Pick<ParticipantRow, 'chat_room_id'>[]

      if (commonRoomData.length > 0) {
        // 기존 채팅방 발견 → 해당 room 정보를 조립하여 반환
        const roomId = commonRoomData[0].chat_room_id

        const [roomResult, participantsResult, lastMessageResult] = await Promise.all([
          supabase.from('chat_rooms').select('*').eq('id', roomId).single(),
          supabase.from('chat_room_participants').select('*').eq('chat_room_id', roomId),
          supabase
            .from('messages')
            .select('*')
            .eq('chat_room_id', roomId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ])

        const room = roomResult.data as ChatRoomRow | null
        const participants = (participantsResult.data || []) as ParticipantRow[]
        const lastMsg = lastMessageResult.data as MessageRow | null

        if (room) {
          return toChatRoom(room, participants, lastMsg)
        }
      }
    }

    // 새 채팅방 생성
    const now = new Date().toISOString()
    const insertData: ChatRoomInsert = {
      created_at: now,
      updated_at: now,
    }

    const { data: newRoom, error: roomError } = await supabase
      .from('chat_rooms')
      .insert(insertData )
      .select('*')
      .single()

    if (roomError || !newRoom) {
      throw new Error(`채팅방 생성 실패: ${roomError?.message}`)
    }

    const roomData = newRoom as ChatRoomRow

    // 참가자 2건 INSERT
    const participant1: ParticipantInsert = {
      chat_room_id: roomData.id,
      user_id: userId1,
      unread_count: 0,
    }
    const participant2: ParticipantInsert = {
      chat_room_id: roomData.id,
      user_id: userId2,
      unread_count: 0,
    }

    const { error: participantError } = await supabase
      .from('chat_room_participants')
      .insert([participant1, participant2] )

    if (participantError) {
      throw new Error(`참가자 등록 실패: ${participantError.message}`)
    }

    // ChatRoom 호환 객체 반환
    const participants: ParticipantRow[] = [
      { id: '', chat_room_id: roomData.id, user_id: userId1, unread_count: 0, joined_at: now },
      { id: '', chat_room_id: roomData.id, user_id: userId2, unread_count: 0, joined_at: now },
    ]

    return toChatRoom(roomData, participants)
  }

  /**
   * 메시지 전송
   *
   * Firebase: chatRooms/{id}/messages 서브컬렉션에 addDoc
   * Supabase: messages 테이블 INSERT + chat_rooms.last_message_at UPDATE + unread_count 증가
   *
   * @param chatRoomId - 채팅방 ID
   * @param senderId - 발신자 ID (auth uid)
   * @param receiverId - 수신자 ID (auth uid)
   * @param content - 메시지 내용
   * @param messageType - 메시지 타입 (기본: 'text')
   * @param metadata - 첨부파일 메타데이터
   * @returns 생성된 메시지 ID
   */
  static async sendMessage(
    chatRoomId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    metadata?: Record<string, unknown>
  ): Promise<string> {
    // 메시지 INSERT
    const insertData: MessageInsert = {
      chat_room_id: chatRoomId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      message_type: messageType,
      metadata: metadata as Database['public']['Tables']['messages']['Insert']['metadata'],
    }

    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert(insertData )
      .select('id')
      .single()

    if (msgError || !newMessage) {
      throw new Error(`메시지 전송 실패: ${msgError?.message}`)
    }

    const messageData = newMessage as Pick<MessageRow, 'id'>
    const now = new Date().toISOString()

    // chat_rooms.last_message_at UPDATE
    const roomUpdate: ChatRoomUpdate = {
      last_message_at: now,
      updated_at: now,
    }
    await supabase
      .from('chat_rooms')
      .update(roomUpdate )
      .eq('id', chatRoomId)

    // 수신자의 unread_count 증가
    // 먼저 현재 값 조회
    const { data: participantData } = await supabase
      .from('chat_room_participants')
      .select('id, unread_count')
      .eq('chat_room_id', chatRoomId)
      .eq('user_id', receiverId)
      .maybeSingle()

    const participant = participantData as Pick<ParticipantRow, 'id' | 'unread_count'> | null
    if (participant) {
      const updateData: ParticipantUpdate = {
        unread_count: (participant.unread_count || 0) + 1,
      }
      await supabase
        .from('chat_room_participants')
        .update(updateData )
        .eq('id', participant.id)
    }

    return messageData.id
  }

  /**
   * 채팅방 목록 조회
   *
   * Firebase: chatRooms에서 participants array-contains 쿼리
   * Supabase: chat_room_participants → chat_rooms → messages 조인
   *
   * @param userId - 사용자 ID (auth uid)
   * @returns ChatRoom 호환 객체 배열 (최근 메시지가 있는 것만, 시간순 정렬)
   */
  static async getChatRooms(userId: string): Promise<ChatRoom[]> {
    // 1. userId가 참여하는 room_id 목록 조회
    const { data: myParticipants } = await supabase
      .from('chat_room_participants')
      .select('chat_room_id, unread_count')
      .eq('user_id', userId)

    const myParticipantData = (myParticipants || []) as Pick<ParticipantRow, 'chat_room_id' | 'unread_count'>[]

    if (myParticipantData.length === 0) {
      return []
    }

    const roomIds = myParticipantData.map((p) => p.chat_room_id)

    // 2. chat_rooms 조회
    const { data: rooms } = await supabase
      .from('chat_rooms')
      .select('*')
      .in('id', roomIds)

    const roomData = (rooms || []) as ChatRoomRow[]

    if (roomData.length === 0) {
      return []
    }

    // 3. 모든 room의 참가자 조회
    const { data: allParticipants } = await supabase
      .from('chat_room_participants')
      .select('*')
      .in('chat_room_id', roomIds)

    const allParticipantData = (allParticipants || []) as ParticipantRow[]

    // 4. 각 room의 최근 메시지 조회
    // 모든 room의 메시지를 한 번에 가져온 뒤, room별 최신 1건만 유지
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('*')
      .in('chat_room_id', roomIds)
      .order('created_at', { ascending: false })

    const lastMessageData = (lastMessages || []) as MessageRow[]
    const lastMessageMap = new Map<string, MessageRow>()

    lastMessageData.forEach((message) => {
      if (!lastMessageMap.has(message.chat_room_id)) {
        lastMessageMap.set(message.chat_room_id, message)
      }
    })

    // 5. ChatRoom 호환 객체로 변환
    const chatRooms: ChatRoom[] = roomData
      .map((room) => {
        const roomParticipants = allParticipantData.filter((p) => p.chat_room_id === room.id)
        const lastMessage = lastMessageMap.get(room.id) || null

        return toChatRoom(room, roomParticipants, lastMessage)
      })
      // lastMessage가 있는 채팅방만 필터링 (Firebase 동작과 동일)
      .filter((room) => room.lastMessage)
      // 최근 메시지 시간 기준 내림차순 정렬
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
        return bTime - aTime
      })

    return chatRooms
  }

  /**
   * 메시지 목록 조회
   *
   * Firebase: chatRooms/{id}/messages 서브컬렉션 쿼리
   * Supabase: messages 테이블에서 chat_room_id 필터
   *
   * @param chatRoomId - 채팅방 ID
   * @param limitCount - 조회 제한 수 (기본 50)
   * @returns Message 목록 (시간순 정렬)
   */
  static async getMessages(chatRoomId: string, limitCount: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) {
      console.error('메시지 조회 실패:', error)
      return []
    }

    const rows = (data || []) as MessageRow[]
    // 시간순으로 정렬 (오래된 것 → 새로운 것)
    return rows.map(toMessage).reverse()
  }

  /**
   * 실시간 메시지 구독 (Supabase Realtime)
   *
   * Firebase: onSnapshot(messagesRef)
   * Supabase: postgres_changes 이벤트 구독
   *
   * 초기 데이터를 로드한 후 Realtime 채널을 구독하여
   * INSERT/UPDATE/DELETE 이벤트 발생 시 전체 목록을 다시 로드합니다.
   *
   * @param chatRoomId - 채팅방 ID
   * @param callback - 메시지 목록 콜백
   * @returns unsubscribe 함수
   */
  static subscribeToMessages(
    chatRoomId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    // 초기 데이터 로드
    this.getMessages(chatRoomId).then(callback)

    // Realtime 구독
    const channel = supabase
      .channel(`messages:${chatRoomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${chatRoomId}`,
        },
        () => {
          // 변경 발생 시 전체 목록 재로드
          this.getMessages(chatRoomId).then(callback)
        }
      )
      .subscribe()

    // unsubscribe 함수 반환
    return () => {
      supabase.removeChannel(channel)
    }
  }

  /**
   * 메시지 읽음 처리
   *
   * Firebase: chatRooms/{id}.unreadCount.{userId} = 0
   * Supabase: chat_room_participants.unread_count = 0 + messages.read_at 업데이트
   *
   * @param chatRoomId - 채팅방 ID
   * @param userId - 읽은 사용자 ID (auth uid)
   */
  static async markAsRead(chatRoomId: string, userId: string): Promise<void> {
    // 1. chat_room_participants unread_count = 0
    const participantUpdate: ParticipantUpdate = {
      unread_count: 0,
    }
    await supabase
      .from('chat_room_participants')
      .update(participantUpdate )
      .eq('chat_room_id', chatRoomId)
      .eq('user_id', userId)

    // 2. messages read_at 업데이트 (수신자가 userId인 미읽 메시지)
    const now = new Date().toISOString()
    await supabase
      .from('messages')
      .update({ read_at: now } )
      .eq('chat_room_id', chatRoomId)
      .eq('receiver_id', userId)
      .is('read_at', null)
  }

  /**
   * 채팅방 삭제
   *
   * @param chatRoomId - 채팅방 ID
   */
  static async deleteChatRoom(chatRoomId: string): Promise<void> {
    // 메시지 먼저 삭제 (FK 제약)
    await supabase
      .from('messages')
      .delete()
      .eq('chat_room_id', chatRoomId)

    // 참가자 삭제
    await supabase
      .from('chat_room_participants')
      .delete()
      .eq('chat_room_id', chatRoomId)

    // 채팅방 삭제
    const { error } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('id', chatRoomId)

    if (error) throw new Error(`채팅방 삭제 실패: ${error.message}`)
  }

  /**
   * 사용자 검색 (메시징용)
   *
   * Firebase: users 컬렉션에서 displayName 검색
   * Supabase: UserService.searchUsers 위임
   *
   * @param searchTerm - 검색어
   * @param currentUserId - 현재 사용자 ID (검색 결과에서 제외)
   * @returns UserProfile 배열
   */
  static async searchUsersForMessaging(
    searchTerm: string,
    currentUserId: string
  ): Promise<import('./userService').UserProfile[]> {
    const results = await UserService.searchUsers(searchTerm, 10)
    // 현재 사용자 제외
    return results.filter((user) => user.uid !== currentUserId)
  }

  /**
   * 사용자의 전체 읽지 않은 메시지 수 조회
   *
   * @param userId - 사용자 ID (auth uid)
   * @returns 총 읽지 않은 메시지 수
   */
  static async getTotalUnreadCount(userId: string): Promise<number> {
    const { data } = await supabase
      .from('chat_room_participants')
      .select('unread_count')
      .eq('user_id', userId)

    const participants = (data || []) as Pick<ParticipantRow, 'unread_count'>[]
    return participants.reduce((sum, p) => sum + (p.unread_count || 0), 0)
  }
}

export default MessagingService
