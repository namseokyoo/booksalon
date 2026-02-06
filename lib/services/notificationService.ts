/**
 * Notification Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase notificationService.ts → Supabase notificationService.ts
 *
 * @description
 * 알림 생성, 조회, 읽음 처리, 삭제 및 실시간 구독 기능.
 * Firebase onSnapshot → Supabase Realtime (postgres_changes) 패턴 확립.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'
import type { Notification } from '../../types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

/**
 * Row → Notification 인터페이스 변환 헬퍼
 */
function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.notification_type,
    title: row.title,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at || undefined,
    metadata: row.metadata as Notification['metadata'] | undefined,
  }
}

export class NotificationService {
  /**
   * 알림 생성
   *
   * @param userId - 알림을 받을 사용자 ID (users.id)
   * @param type - 알림 타입
   * @param title - 알림 제목
   * @param content - 알림 내용
   * @param metadata - 추가 메타데이터
   * @returns 생성된 알림 ID
   */
  static async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    content: string,
    metadata?: Notification['metadata']
  ): Promise<string> {
    const insertData: NotificationInsert = {
      user_id: userId,
      notification_type: type,
      title,
      content,
      is_read: false,
      metadata: metadata as Database['public']['Tables']['notifications']['Insert']['metadata'],
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(insertData as never)
      .select('id')
      .single()

    if (error) throw new Error(`알림 생성 실패: ${error.message}`)

    const result = data as Pick<NotificationRow, 'id'> | null
    return result?.id || ''
  }

  /**
   * 사용자 알림 목록 조회
   *
   * @param userId - 사용자 ID
   * @param limitCount - 조회 제한 수 (기본 50)
   * @returns 알림 목록 (최신순)
   */
  static async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) {
      console.error('알림 조회 실패:', error)
      return []
    }

    const rows = (data || []) as NotificationRow[]
    return rows.map(toNotification)
  }

  /**
   * 실시간 알림 구독 (Supabase Realtime)
   *
   * Firebase onSnapshot → Supabase postgres_changes 패턴.
   * 초기 데이터를 로드한 후 Realtime 채널을 구독하여
   * INSERT/UPDATE/DELETE 이벤트 발생 시 전체 목록을 다시 로드합니다.
   *
   * @param userId - 사용자 ID
   * @param callback - 알림 목록 콜백
   * @returns unsubscribe 함수
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    // 초기 데이터 로드
    this.getUserNotifications(userId).then(callback)

    // Realtime 구독
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // 변경 발생 시 전체 목록 재로드
          this.getUserNotifications(userId).then(callback)
        }
      )
      .subscribe()

    // unsubscribe 함수 반환
    return () => {
      supabase.removeChannel(channel)
    }
  }

  /**
   * 알림 읽음 처리
   *
   * @param notificationId - 알림 ID
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const updateData: NotificationUpdate = {
      is_read: true,
      read_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('notifications')
      .update(updateData as never)
      .eq('id', notificationId)

    if (error) throw new Error(`알림 읽음 처리 실패: ${error.message}`)
  }

  /**
   * 모든 알림 읽음 처리
   *
   * @param userId - 사용자 ID
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const updateData: NotificationUpdate = {
      is_read: true,
      read_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('notifications')
      .update(updateData as never)
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw new Error(`모든 알림 읽음 처리 실패: ${error.message}`)
  }

  /**
   * 읽지 않은 알림 수 조회
   *
   * @param userId - 사용자 ID
   * @returns 읽지 않은 알림 수
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('읽지 않은 알림 수 조회 실패:', error)
      return 0
    }

    return count || 0
  }

  /**
   * 알림 삭제
   *
   * @param notificationId - 알림 ID
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw new Error(`알림 삭제 실패: ${error.message}`)
  }

  // =====================================================
  // 특정 타입의 알림 생성 헬퍼 메서드들
  // =====================================================

  /**
   * 메시지 알림 생성
   */
  static async createMessageNotification(
    receiverId: string,
    senderName: string,
    chatRoomId: string
  ): Promise<string> {
    return this.createNotification(
      receiverId,
      'message',
      '새 메시지',
      `${senderName}님이 메시지를 보냈습니다.`,
      { chatRoomId }
    )
  }

  /**
   * 좋아요 알림 생성
   */
  static async createLikeNotification(
    receiverId: string,
    senderName: string,
    postTitle: string,
    postId: string,
    forumId: string
  ): Promise<string> {
    return this.createNotification(
      receiverId,
      'like',
      '좋아요',
      `${senderName}님이 "${postTitle}" 게시물에 좋아요를 눌렀습니다.`,
      { senderId: receiverId, postId, forumId }
    )
  }

  /**
   * 댓글 알림 생성
   */
  static async createCommentNotification(
    receiverId: string,
    senderName: string,
    postTitle: string,
    commentId: string,
    postId: string,
    forumId: string
  ): Promise<string> {
    return this.createNotification(
      receiverId,
      'comment',
      '새 댓글',
      `${senderName}님이 "${postTitle}" 게시물에 댓글을 남겼습니다.`,
      { senderId: receiverId, commentId, postId, forumId }
    )
  }

  /**
   * 팔로우 알림 생성
   */
  static async createFollowNotification(
    receiverId: string,
    senderName: string
  ): Promise<string> {
    return this.createNotification(
      receiverId,
      'follow',
      '새 팔로워',
      `${senderName}님이 당신을 팔로우하기 시작했습니다.`,
      { senderId: receiverId }
    )
  }

  /**
   * 시스템 알림 생성
   */
  static async createSystemNotification(
    userId: string,
    title: string,
    content: string
  ): Promise<string> {
    return this.createNotification(
      userId,
      'system',
      title,
      content
    )
  }
}

export default NotificationService
