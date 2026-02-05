import React, { useState, useEffect } from 'react';
import type { Post, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UserProfileService } from '../services/userProfile';
import { useAuth } from '../contexts/AuthContext';

interface PostListProps {
    posts: Post[];
    onPostClick: (post: Post) => void;
    onUserClick: (user: UserProfile) => void;
}

interface PostListItemProps {
    post: Post;
    onPostClick: (post: Post) => void;
    onUserClick: (user: UserProfile) => void;
}

const PostListItem: React.FC<PostListItemProps> = ({ post, onPostClick, onUserClick }) => {
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadAuthorProfile = async () => {
            try {
                const profile = await UserProfileService.getUserProfile(post.author.uid);
                setAuthorProfile(profile);
            } catch (error) {
                console.error('작성자 프로필 로딩 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthorProfile();
    }, [post.author.uid]);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    const getDisplayName = () => {
        if (isLoading) return '로딩 중...';
        return authorProfile?.nickname || authorProfile?.displayName || post.author.email?.split('@')[0] || '익명';
    };

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 p-4 rounded-xl animate-pulse shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    return (
        <div
            className="bg-white border border-gray-200 p-4 rounded-xl hover:shadow-md hover:border-cyan-300 cursor-pointer transition-all duration-200 shadow-sm"
            onClick={() => onPostClick(post)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                        {post.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (authorProfile) {
                                        onUserClick(authorProfile);
                                    }
                                }}
                                className="hover:text-cyan-600 transition-colors font-medium"
                            >
                                {getDisplayName()}
                            </button>
                        </div>
                        <span className="text-gray-500">{formatTime(post.createdAt)}</span>
                        <div className="flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <span>{post.likeCount || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{post.commentCount || 0}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PostList: React.FC<PostListProps> = ({ posts, onPostClick, onUserClick }) => {
    if (posts.length === 0) {
        return (
            <div className="text-center py-8 px-4 border-2 border-dashed border-gray-700 rounded-lg">
                <p className="text-sm text-gray-400">아직 게시물이 없습니다.</p>
                <p className="text-xs text-gray-500 mt-1">첫 번째 글을 작성해보세요.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {posts.map(post => (
                <PostListItem
                    key={post.id}
                    post={post}
                    onPostClick={onPostClick}
                    onUserClick={onUserClick}
                />
            ))}
        </div>
    );
};

export default PostList;
