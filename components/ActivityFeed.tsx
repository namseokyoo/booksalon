import React, { useState, useEffect, useCallback } from 'react';
import { FileText, MessageCircle, Heart, Users, Bookmark, Pin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SocialService } from '../lib/services';
import type { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ActivityFeedSkeleton from './ActivityFeedSkeleton';

const ActivityFeed: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, userProfile } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'following' | 'my'>('following');

    const loadActivities = useCallback(async () => {
        if (!currentUser || !userProfile?.id) return;

        try {
            setLoading(true);
            let activitiesData: Activity[] = [];

            if (activeTab === 'following') {
                activitiesData = await SocialService.getFollowingActivityFeed(userProfile?.id || '');
            } else {
                activitiesData = await SocialService.getUserActivityFeed(userProfile?.id || '');
            }

            setActivities(activitiesData);
        } catch (error) {
            console.error('활동 피드 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser, userProfile?.id, activeTab]);

    useEffect(() => {
        loadActivities();
    }, [loadActivities]);

    const formatDate = (timestamp: string | Date | { toDate: () => Date } | null | undefined) => {
        if (!timestamp) return '방금 전';
        let date: Date;
        if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else {
            date = new Date();
        }
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    const getActivityIcon = (type: Activity['type']): React.ReactNode => {
        switch (type) {
            case 'post':
                return <FileText className="w-4 h-4" />;
            case 'comment':
                return <MessageCircle className="w-4 h-4" />;
            case 'like':
                return <Heart className="w-4 h-4" />;
            case 'follow':
                return <Users className="w-4 h-4" />;
            case 'bookmark':
                return <Bookmark className="w-4 h-4" />;
            default:
                return <Pin className="w-4 h-4" />;
        }
    };

    const getActivityText = (activity: Activity) => {
        switch (activity.type) {
            case 'post':
                return `새로운 게시물을 작성했습니다: "${activity.targetTitle}"`;
            case 'comment':
                return `댓글을 작성했습니다: "${activity.targetTitle}"`;
            case 'like':
                return activity.metadata?.action === 'like'
                    ? `게시물을 좋아합니다: "${activity.targetTitle}"`
                    : `게시물 좋아요를 취소했습니다: "${activity.targetTitle}"`;
            case 'follow':
                return activity.metadata?.action === 'follow'
                    ? `${activity.targetTitle}님을 팔로우했습니다`
                    : `${activity.targetTitle}님을 언팔로우했습니다`;
            case 'bookmark':
                return `살롱을 북마크했습니다: "${activity.forumTitle}"`;
            default:
                return '활동이 있었습니다';
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">로그인이 필요합니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">활동 피드</h1>
                </div>

                {/* 탭 */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`px-4 py-2.5 rounded-md font-medium transition-colors ${activeTab === 'following'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-surface-foreground hover:bg-muted'
                            }`}
                    >
                        팔로잉 활동
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2.5 rounded-md font-medium transition-colors ${activeTab === 'my'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-surface-foreground hover:bg-muted'
                            }`}
                    >
                        내 활동
                    </button>
                </div>

                {/* 활동 목록 */}
                <div className="bg-surface rounded-lg p-6">
                    {loading ? (
                        <ActivityFeedSkeleton />
                    ) : activities.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                {activeTab === 'following'
                                    ? '팔로잉 중인 사용자의 활동이 없습니다.'
                                    : '아직 활동 기록이 없습니다.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`bg-muted rounded-lg p-4 ${activity.forumIsbn ? 'cursor-pointer hover:bg-muted/80 transition-colors' : ''}`}
                                    onClick={() => {
                                        if (!activity.forumIsbn) return;
                                        if (activity.type === 'post' || activity.type === 'comment' || activity.type === 'like') {
                                            navigate(`/forum/${activity.forumIsbn}?post=${activity.targetId}`);
                                        } else if (activity.type === 'bookmark') {
                                            navigate(`/forum/${activity.forumIsbn}`);
                                        }
                                    }}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex h-8 w-8 items-center justify-center" aria-hidden="true">
                                            {getActivityIcon(activity.type)}
                                            <span className="sr-only">
                                                {activity.type === 'post' && '게시물'}
                                                {activity.type === 'comment' && '댓글'}
                                                {activity.type === 'like' && '좋아요'}
                                                {activity.type === 'follow' && '팔로우'}
                                                {activity.type === 'bookmark' && '북마크'}
                                            </span>
                                        </div>
                                        <div className="flex-grow">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-foreground">{activity.userName}</span>
                                                <span className="text-xs text-muted-foreground">{formatDate(activity.createdAt)}</span>
                                            </div>
                                            <p className="text-surface-foreground text-sm">{getActivityText(activity)}</p>
                                            {activity.forumTitle && (
                                                <p className="text-xs text-muted-foreground mt-1">살롱: {activity.forumTitle}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityFeed;
