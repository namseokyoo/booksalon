import React, { useState, useEffect } from 'react';
import type { Post, UserProfile } from '../types';
import { UserService } from '../lib/services';
import { formatRelativeDate } from '../lib/dateUtils';
import PostCard from './PostCard';
import { FileTextIcon } from './icons';

interface PostListProps {
    posts: Post[];
    onPostClick: (post: Post) => void;
    onUserClick: (user: UserProfile) => void;
}

const PostList: React.FC<PostListProps> = ({ posts, onPostClick, onUserClick: _onUserClick }) => {
    const [authorMap, setAuthorMap] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        if (posts.length === 0) {
            setAuthorMap(new Map());
            return;
        }

        const uids: string[] = [];
        for (const post of posts) {
            const uid = String(post.author.uid);
            if (!uids.includes(uid)) {
                uids.push(uid);
            }
        }

        Promise.all(uids.map((uid: string) => UserService.getUserProfileByAuthId(uid)))
            .then(profiles => {
                const map = new Map<string, string>();
                profiles.forEach((profile, i) => {
                    const uid = uids[i];
                    if (profile && uid) {
                        map.set(
                            uid,
                            profile.nickname || profile.displayName || profile.email?.split('@')[0] || '익명',
                        );
                    }
                });
                setAuthorMap(map);
            })
            .catch(err => console.error('작성자 배치 조회 실패:', err));
    }, [posts]);

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center text-center py-8 px-4 border-2 border-dashed border-border rounded-lg">
                <FileTextIcon className="w-12 h-12 text-primary opacity-30 mb-3" />
                <p className="text-sm text-muted-foreground">아직 이 책에 대한 이야기는 시작되지 않았네요.</p>
                <p className="text-xs text-muted-foreground mt-1">첫 번째 질문을 남겨보는 건 어떨까요.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            {posts.map(post => (
                <PostCard
                    key={post.id}
                    title={post.title}
                    authorName={authorMap.get(post.author.uid) || post.author.email?.split('@')[0] || '익명'}
                    likeCount={post.likeCount || 0}
                    commentCount={post.commentCount || 0}
                    formattedDate={formatRelativeDate(post.createdAt)}
                    onClick={() => onPostClick(post)}
                />
            ))}
        </div>
    );
};

export default PostList;
