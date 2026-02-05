import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import type { Message, ChatRoom, UserProfile } from '../types';

export class MessagingService {
    // 채팅방 생성 또는 기존 채팅방 찾기
    static async getOrCreateChatRoom(userId1: string, userId2: string): Promise<ChatRoom> {
        // 기존 채팅방 찾기
        const chatRoomsRef = collection(db, 'chatRooms');
        const q = query(
            chatRoomsRef,
            where('participants', 'array-contains', userId1)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const chatRoom = docSnap.data() as ChatRoom;
            if (chatRoom.participants.includes(userId2) && chatRoom.participants.length === 2) {
                return { id: docSnap.id, ...chatRoom };
            }
        }

        // 새 채팅방 생성
        const newChatRoom = {
            participants: [userId1, userId2],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            unreadCount: {
                [userId1]: 0,
                [userId2]: 0
            }
        };

        const docRef = await addDoc(chatRoomsRef, newChatRoom);
        return { id: docRef.id, ...newChatRoom } as ChatRoom;
    }

    // 메시지 전송
    static async sendMessage(
        chatRoomId: string,
        senderId: string,
        receiverId: string,
        content: string,
        messageType: 'text' | 'image' | 'file' = 'text',
        metadata?: any
    ): Promise<string> {
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');

        const message: any = {
            senderId,
            receiverId,
            content,
            messageType,
            createdAt: serverTimestamp(),
            readAt: null
        };

        if (metadata) {
            message.metadata = metadata;
        }

        const docRef = await addDoc(messagesRef, message);

        // 채팅방 업데이트
        const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
        await updateDoc(chatRoomRef, {
            lastMessage: {
                id: docRef.id,
                senderId,
                receiverId,
                content,
                createdAt: serverTimestamp()
            },
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            [`unreadCount.${receiverId}`]: increment(1)
        });

        return docRef.id;
    }

    // 채팅방 목록 조회
    static async getChatRooms(userId: string): Promise<ChatRoom[]> {
        const chatRoomsRef = collection(db, 'chatRooms');
        const q = query(
            chatRoomsRef,
            where('participants', 'array-contains', userId)
        );

        const snapshot = await getDocs(q);
        const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatRoom[];

        // 메시지가 있는 채팅방만 필터링 (lastMessage가 있는 경우만)
        const roomsWithMessages = rooms.filter(room => room.lastMessage);

        // 클라이언트에서 정렬
        return roomsWithMessages.sort((a, b) => {
            const aTime = a.lastMessageAt?.toDate?.()?.getTime() || 0;
            const bTime = b.lastMessageAt?.toDate?.()?.getTime() || 0;
            return bTime - aTime;
        });
    }

    // 메시지 목록 조회
    static async getMessages(chatRoomId: string, limitCount: number = 50): Promise<Message[]> {
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
        const q = query(
            messagesRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
    }

    // 실시간 메시지 리스너
    static subscribeToMessages(
        chatRoomId: string,
        callback: (messages: Message[]) => void
    ): () => void {
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
        const q = query(
            messagesRef,
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
            callback(messages.reverse()); // 시간순으로 정렬
        });
    }

    // 메시지 읽음 처리
    static async markAsRead(chatRoomId: string, userId: string): Promise<void> {
        const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
        await updateDoc(chatRoomRef, {
            [`unreadCount.${userId}`]: 0
        });
    }

    // 채팅방 삭제
    static async deleteChatRoom(chatRoomId: string): Promise<void> {
        const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
        await deleteDoc(chatRoomRef);
    }

    // 사용자 검색 (메시징용)
    static async searchUsersForMessaging(query: string, currentUserId: string): Promise<UserProfile[]> {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('displayName', '>=', query),
            where('displayName', '<=', query + '\uf8ff'),
            limit(10)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
            .map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile))
            .filter(user => user.uid !== currentUserId);
    }
}
