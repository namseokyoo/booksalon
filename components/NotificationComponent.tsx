import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types';
import NotificationCard from './NotificationCard';
import NotificationSkeleton from './NotificationSkeleton';

const NotificationComponent: React.FC = () => {
    const navigate = useNavigate();
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

    if (isLoading) {
        return <NotificationSkeleton />;
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                            <Bell size={24} aria-hidden="true" />
                            알림
                        </h1>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="shrink-0 whitespace-nowrap px-4 py-2 bg-cta text-cta-foreground rounded-lg hover:bg-cta-700 transition-colors text-sm"
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
                        <Bell className="mx-auto mb-4 text-muted-foreground" size={64} aria-hidden="true" strokeWidth={1} />
                        <h3 className="text-lg font-semibold mb-2">알림이 없습니다</h3>
                        <p>새로운 활동이 있으면 여기에 알림이 표시됩니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3" role="list">
                        {notifications.map((notification) => {
                            const targetType = notification.metadata?.postId
                                ? 'post'
                                : notification.metadata?.commentId
                                ? 'comment'
                                : notification.metadata?.forumId
                                ? 'forum'
                                : null;
                            const targetId = notification.metadata?.postId
                                || notification.metadata?.commentId
                                || notification.metadata?.forumId
                                || null;
                            const isClickable = !!targetType && !!targetId;

                            return (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                    onDelete={handleDeleteNotification}
                                    onClick={isClickable ? async () => {
                                        if (!notification.isRead) {
                                            await handleMarkAsRead(notification.id);
                                        }
                                        const metadata = notification.metadata;
                                        if (targetType === 'post' || targetType === 'comment') {
                                            navigate(`/forum/${metadata?.forumId}?post=${metadata?.postId}`);
                                        } else if (targetType === 'forum') {
                                            navigate(`/forum/${metadata?.forumId}`);
                                        } else {
                                            navigate('/');
                                        }
                                    } : undefined}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationComponent;
