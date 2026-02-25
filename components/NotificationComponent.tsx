import React, { useState, useEffect } from 'react';
import { NotificationService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const NotificationComponent: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        // 실시간 알림 리스너
        const unsubscribe = NotificationService.subscribeToNotifications(
            userProfile?.id || '',
            (newNotifications) => {
                setNotifications(newNotifications);
                setUnreadCount(newNotifications.filter(n => !n.isRead).length);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [currentUser]);

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await NotificationService.markAsRead(notificationId);
        } catch (error) {
            console.error('알림 읽음 처리 실패:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!currentUser) return;

        try {
            await NotificationService.markAllAsRead(userProfile?.id || '');
        } catch (error) {
            console.error('모든 알림 읽음 처리 실패:', error);
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await NotificationService.deleteNotification(notificationId);
        } catch (error) {
            console.error('알림 삭제 실패:', error);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'message':
                return (
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                );
            case 'like':
                return (
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                );
            case 'comment':
                return (
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                );
            case 'follow':
                return (
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                );
            case 'system':
                return (
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                    </svg>
                );
        }
    };

    const formatNotificationTime = (timestamp: string | undefined) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground mb-2">🔔 알림</h1>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-700 transition-colors text-sm"
                            >
                                모두 읽음 처리
                            </button>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다.` : '모든 알림을 확인했습니다.'}
                    </p>
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                        </svg>
                        <h3 className="text-lg font-semibold mb-2">알림이 없습니다</h3>
                        <p>새로운 활동이 있으면 여기에 알림이 표시됩니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-surface p-4 rounded-lg transition-colors ${!notification.isRead ? 'border-l-4 border-primary' : ''
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-surface-foreground'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-muted-foreground text-sm">
                                                    {formatNotificationTime(notification.createdAt)}
                                                </span>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="text-primary hover:text-primary-700 text-sm"
                                                    >
                                                        읽음
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteNotification(notification.id)}
                                                    className="text-muted-foreground hover:text-red-400 text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                        <p className={`mt-1 ${!notification.isRead ? 'text-surface-foreground' : 'text-muted-foreground'
                                            }`}>
                                            {notification.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationComponent;
