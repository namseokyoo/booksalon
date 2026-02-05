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
    serverTimestamp
} from 'firebase/firestore';
import type { Notification } from '../types';

export class NotificationService {
    // 알림 생성
    static async createNotification(
        userId: string,
        type: Notification['type'],
        title: string,
        content: string,
        metadata?: Notification['metadata']
    ): Promise<string> {
        const notificationsRef = collection(db, 'notifications');

        const notification = {
            userId,
            type,
            title,
            content,
            isRead: false,
            createdAt: serverTimestamp(),
            metadata
        };

        const docRef = await addDoc(notificationsRef, notification);
        return docRef.id;
    }

    // 사용자 알림 목록 조회
    static async getUserNotifications(userId: string, limitCount: number = 50): Promise<Notification[]> {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
    }

    // 실시간 알림 리스너
    static subscribeToNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ): () => void {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
            callback(notifications);
        });
    }

    // 알림 읽음 처리
    static async markAsRead(notificationId: string): Promise<void> {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
            isRead: true,
            readAt: serverTimestamp()
        });
    }

    // 모든 알림 읽음 처리
    static async markAllAsRead(userId: string): Promise<void> {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            where('isRead', '==', false)
        );

        const snapshot = await getDocs(q);
        const batch = snapshot.docs.map(doc =>
            updateDoc(doc.ref, {
                isRead: true,
                readAt: serverTimestamp()
            })
        );

        await Promise.all(batch);
    }

    // 읽지 않은 알림 수 조회
    static async getUnreadCount(userId: string): Promise<number> {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', userId),
            where('isRead', '==', false)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    // 알림 삭제
    static async deleteNotification(notificationId: string): Promise<void> {
        const notificationRef = doc(db, 'notifications', notificationId);
        await deleteDoc(notificationRef);
    }

    // 특정 타입의 알림 생성 헬퍼 메서드들
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
        );
    }

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
        );
    }

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
        );
    }

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
        );
    }

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
        );
    }
}
