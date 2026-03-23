import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Bell, BookOpen, Heart, Info, MessageCircle, MessageSquare, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Notification } from '../types';

interface NotificationCardProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
    onClick?: () => void;
}

const getNotificationIcon = (
    type: Notification['type'],
    isRead: boolean
): {
    Icon: LucideIcon;
    iconBgClass: string;
    iconClassName: string;
    fillCurrentColor?: boolean;
} => {
    if (isRead) {
        switch (type) {
            case 'like':
                return {
                    Icon: Heart,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                    fillCurrentColor: true,
                };
            case 'comment':
                return {
                    Icon: MessageSquare,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                };
            case 'system':
                return {
                    Icon: Info,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                };
            case 'message':
                return {
                    Icon: MessageCircle,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                };
            case 'follow':
                return {
                    Icon: UserPlus,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                };
            case 'forum_invite':
                return {
                    Icon: BookOpen,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                };
            default:
                return {
                    Icon: Bell,
                    iconBgClass: 'bg-[var(--color-notification-icon-bg-read)]',
                    iconClassName: 'text-muted-foreground',
                };
        }
    }

    switch (type) {
        case 'comment':
            return {
                Icon: MessageSquare,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-comment)]',
                iconClassName: 'text-primary',
            };
        case 'like':
            return {
                Icon: Heart,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-like)]',
                iconClassName: 'text-destructive',
                fillCurrentColor: true,
            };
        case 'system':
            return {
                Icon: Info,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-system)]',
                iconClassName: 'text-warning',
            };
        case 'message':
            return {
                Icon: MessageCircle,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-message)]',
                iconClassName: 'text-primary',
            };
        case 'follow':
            return {
                Icon: UserPlus,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-follow)]',
                iconClassName: 'text-accent',
            };
        case 'forum_invite':
            return {
                Icon: BookOpen,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-invite)]',
                iconClassName: 'text-primary',
            };
        default:
            return {
                Icon: Bell,
                iconBgClass: 'bg-[var(--color-notification-icon-bg-comment)]',
                iconClassName: 'text-primary',
            };
    }
};

const formatNotificationTime = (timestamp: Notification['createdAt']) => {
    const date = timestamp instanceof Date ? timestamp : new Date(String(timestamp));
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
};

const NotificationCard: React.FC<NotificationCardProps> = ({
    notification,
    onMarkAsRead,
    onDelete,
    onClick,
}) => {
    const { Icon, iconBgClass, iconClassName, fillCurrentColor } = getNotificationIcon(
        notification.type,
        notification.isRead
    );

    return (
        <div
            onClick={onClick}
            role="listitem"
            tabIndex={0}
            className={`bg-surface rounded-lg transition-colors ${
                notification.isRead
                    ? 'p-3 sm:p-4 shadow-[var(--shadow-notification-read)]'
                    : 'border-l-[3px] border-[var(--color-notification-unread-bar)] pl-[calc(var(--spacing-card-padding)-3px)] pr-3 pt-3 pb-3 sm:pl-[calc(var(--spacing-card-padding-sm)-3px)] sm:pr-4 sm:pt-4 sm:pb-4 shadow-[var(--shadow-notification-unread)]'
            } ${onClick ? 'cursor-pointer hover:bg-muted' : ''}`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBgClass}`}>
                        <Icon
                            size={20}
                            aria-hidden="true"
                            strokeWidth={1.5}
                            className={iconClassName}
                            fill={fillCurrentColor ? 'currentColor' : undefined}
                        />
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center min-w-0">
                                <h3
                                    className={`truncate text-sm font-semibold ${
                                        notification.isRead ? 'text-muted-foreground' : 'text-foreground'
                                    }`}
                                >
                                    {notification.title}
                                </h3>
                                {!notification.isRead && (
                                    <span
                                        className="inline-block w-2 h-2 rounded-full bg-[var(--color-notification-unread-dot)] ml-1.5 flex-shrink-0"
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                            <p
                                className={`mt-1 line-clamp-2 text-sm ${
                                    notification.isRead ? 'text-muted-foreground' : 'text-surface-foreground'
                                }`}
                            >
                                {notification.content}
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <span className="text-xs text-muted-foreground">
                                {formatNotificationTime(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkAsRead(notification.id);
                                    }}
                                    className="min-h-[44px] px-2 py-1 text-sm text-primary hover:text-primary-700"
                                >
                                    읽음
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(notification.id);
                                }}
                                className="min-h-[44px] px-2 py-1 text-sm text-muted-foreground hover:text-destructive"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationCard;
