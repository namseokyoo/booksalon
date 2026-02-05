import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SocialService } from '../services/socialService';
import type { Activity } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ActivityFeedProps {
    onBack: () => void;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ onBack }) => {
    const { currentUser } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'following' | 'my'>('following');

    useEffect(() => {
        if (currentUser) {
            loadActivities();
        }
    }, [currentUser, activeTab]);

    const loadActivities = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            let activitiesData: Activity[] = [];

            if (activeTab === 'following') {
                activitiesData = await SocialService.getFollowingActivityFeed(currentUser.uid);
            } else {
                activitiesData = await SocialService.getUserActivityFeed(currentUser.uid);
            }

            setActivities(activitiesData);
        } catch (error) {
            console.error('활동 피드 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ko });
        }
        return '방금 전';
    };

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'post':
                return '📝';
            case 'comment':
                return '💬';
            case 'like':
                return '❤️';
            case 'follow':
                return '👥';
            case 'bookmark':
                return '⭐';
            default:
                return '📌';
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
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="text-center py-8">
                        <p className="text-gray-400">로그인이 필요합니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>돌아가기</span>
                    </button>
                    <h1 className="text-2xl font-bold text-white">활동 피드</h1>
                    <div></div>
                </div>

                {/* 탭 */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setActiveTab('following')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'following'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        팔로잉 활동
                    </button>
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'my'
                                ? 'bg-cyan-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        내 활동
                    </button>
                </div>

                {/* 활동 목록 */}
                <div className="bg-gray-800 rounded-lg p-6">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
                            <p className="text-gray-400 mt-2">활동을 불러오는 중...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">
                                {activeTab === 'following'
                                    ? '팔로잉 중인 사용자의 활동이 없습니다.'
                                    : '아직 활동 기록이 없습니다.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activities.map((activity) => (
                                <div key={activity.id} className="bg-gray-700 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                                        <div className="flex-grow">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-semibold text-white">{activity.userName}</span>
                                                <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                                            </div>
                                            <p className="text-gray-300 text-sm">{getActivityText(activity)}</p>
                                            {activity.forumTitle && (
                                                <p className="text-xs text-gray-500 mt-1">살롱: {activity.forumTitle}</p>
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
