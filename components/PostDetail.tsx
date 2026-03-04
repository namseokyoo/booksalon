import React, { useState, useEffect } from 'react';
import type { Post, Comment, UserProfile } from '../types';
import CommentItem from './CommentItem';
import UserProfilePreview from './UserProfilePreview';
import ImageGallery from './ImageGallery';
import { ArrowLeftIcon, MessageCircleIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserService, PostImageService, SocialService, ViewCountService } from '../lib/services';
import { NotificationService } from '../lib/services/notificationService';
import { LikeIcon } from './icons/LikeIcon';

interface PostDetailProps {
    post: Post;
    isbn: string;
    onBack: () => void;
    onUserClick: (user: UserProfile) => void;
    onSendMessage?: (userId: string) => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, isbn, onBack, onUserClick, onSendMessage }) => {
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content);
    const [viewCount, setViewCount] = useState(post.viewCount || 0);
    const [showMentionList, setShowMentionList] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const { currentUser } = useAuth();

    useEffect(() => {
        const loadAuthorProfile = async () => {
            try {
                const profile = await UserService.getUserProfileByAuthId(post.author.uid);
                setAuthorProfile(profile);
            } catch (error) {
                console.error('작성자 프로필 로딩 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadAuthorProfile();
    }, [post.author.uid]);

    // 조회수 증가 (마운트 시 1회)
    useEffect(() => {
        ViewCountService.incrementViewCount(post.id).then(() => {
            // 증가 후 최신 조회수 반영
            ViewCountService.getViewCount(post.id).then(setViewCount);
        });
    }, [post.id]);

    useEffect(() => {
        const checkLikeStatus = async () => {
            if (currentUser) {
                try {
                    // 사용자 ID 조회
                    const { data: userData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_id', currentUser.uid)
                        .single();

                    if (userData) {
                        const liked = await SocialService.isLiked((userData as { id: string }).id, 'post', post.id);
                        setIsLiked(liked);
                    }
                } catch (error) {
                    console.error('좋아요 상태 확인 실패:', error);
                }
            }
        };
        checkLikeStatus();
    }, [currentUser, post.id]);

    useEffect(() => {
        const loadComments = async () => {
            const { data: commentsData, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    content,
                    author_id,
                    created_at,
                    updated_at,
                    like_count
                `)
                .eq('post_id', post.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('댓글 로드 실패:', error);
                return;
            }

            // 작성자 정보 조회
            const authorIds = [...new Set((commentsData || []).map((c: { author_id: string }) => c.author_id))];
            const { data: authors } = await supabase
                .from('users')
                .select('id, auth_id, email, display_name, nickname')
                .in('id', authorIds);

            const authorMap = new Map((authors || []).map((a: { id: string; auth_id: string; email: string; display_name: string | null; nickname: string | null }) => [a.id, a]));

            // 좋아요 조회
            const commentIds = (commentsData || []).map((c: { id: string }) => c.id);
            const { data: commentLikes } = await supabase
                .from('comment_likes')
                .select('comment_id, user_id')
                .in('comment_id', commentIds);

            const likesByComment = new Map<string, string[]>();
            commentLikes?.forEach((cl: { comment_id: string; user_id: string }) => {
                const likes = likesByComment.get(cl.comment_id) || [];
                likes.push(cl.user_id);
                likesByComment.set(cl.comment_id, likes);
            });

            const comments: Comment[] = (commentsData || []).map((comment: {
                id: string;
                content: string;
                author_id: string;
                created_at: string;
                updated_at: string | null;
                like_count: number;
            }) => {
                const author = authorMap.get(comment.author_id);
                return {
                    id: comment.id,
                    content: comment.content,
                    author: {
                        uid: author?.auth_id || comment.author_id,
                        email: author?.email || '',
                    },
                    createdAt: comment.created_at ? new Date(comment.created_at) : new Date(),
                    updatedAt: comment.updated_at ? new Date(comment.updated_at) : undefined,
                    likeCount: comment.like_count,
                    likes: likesByComment.get(comment.id) || [],
                };
            });

            setComments(comments);
        };

        loadComments();

        // 실시간 구독
        const subscription = supabase
            .channel(`comments_${post.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, () => {
                loadComments();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [post.id]);

    const handleUserClick = (user: UserProfile) => {
        setSelectedUser(user);
    };

    const handleCloseUserProfile = () => {
        setSelectedUser(null);
    };

    const handleToggleLike = async () => {
        if (!currentUser) {
            alert('좋아요하려면 로그인이 필요합니다.');
            return;
        }

        try {
            // 사용자 ID 조회
            const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('auth_id', currentUser.uid)
                .single();

            if (!userData) {
                throw new Error('사용자 정보를 찾을 수 없습니다.');
            }

            const newIsLiked = await SocialService.toggleLike(
                (userData as { id: string }).id,
                'post',
                post.id
            );

            setIsLiked(newIsLiked);
            setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('좋아요 처리 실패:', error);
        }
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // '@' 기호로 멘션 리스트 보이기
        const atIndex = value.lastIndexOf('@');
        if (atIndex !== -1) {
            const searchTerm = value.substring(atIndex + 1).toLowerCase();
            const spaceIndex = searchTerm.indexOf(' ');
            if (spaceIndex === -1) {
                setMentionSearch(searchTerm);
                setShowMentionList(true);
            } else {
                setShowMentionList(false);
            }
        } else {
            setShowMentionList(false);
        }
    };

    const [mentionableUsers, setMentionableUsers] = useState<{ uid: string; email: string }[]>([]);

    useEffect(() => {
        // 댓글 작성자들의 고유 ID 수집
        const commentAuthorIds = comments.map(c => c.author.uid);
        const uniqueAuthors = Array.from(new Set(commentAuthorIds));

        // 게시물 작성자 포함
        if (post.author.uid && !uniqueAuthors.includes(post.author.uid)) {
            uniqueAuthors.unshift(post.author.uid);
        }

        const users = uniqueAuthors.map(uid => {
            const comment = comments.find(c => c.author.uid === uid);
            return {
                uid,
                email: comment ? comment.author.email : post.author.email
            };
        }).filter(user => user.email);

        setMentionableUsers(users);
    }, [comments, post.author]);

    const getMentionUsers = () => {
        if (!mentionSearch) return mentionableUsers;

        return mentionableUsers.filter(user =>
            user.email?.toLowerCase().includes(mentionSearch)
        );
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || newComment.trim() === '') return;

        try {
            // 사용자 ID 조회
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('auth_id', currentUser.uid)
                .single();

            if (userError || !userData) {
                throw new Error('사용자 정보를 찾을 수 없습니다.');
            }

            const typedUserData = userData as { id: string };

            // 댓글 생성
            const { data: insertedComment, error: commentError } = await supabase
                .from('comments')
                .insert({
                    content: newComment,
                    author_id: typedUserData.id,
                    post_id: post.id,
                    like_count: 0,
                })
                .select('id')
                .single();

            if (commentError) {
                throw commentError;
            }

            // 게시물의 댓글 수 업데이트
            const { data: postData } = await supabase
                .from('posts')
                .select('comment_count')
                .eq('id', post.id)
                .single();

            await supabase
                .from('posts')
                .update({ comment_count: ((postData as { comment_count: number } | null)?.comment_count || 0) + 1 })
                .eq('id', post.id);

            // 사용자 통계 업데이트
            await UserService.incrementStat(currentUser.uid, 'comment_count');

            // 댓글 알림 트리거 (자기 자신 제외)
            if (authorProfile?.id && authorProfile.id !== typedUserData.id && insertedComment) {
                const senderProfile = await UserService.getUserProfileById(typedUserData.id);
                const senderName = senderProfile?.nickname || senderProfile?.displayName || senderProfile?.email?.split('@')[0] || '누군가';
                const insertedCommentId = (insertedComment as { id: string }).id;
                NotificationService.createCommentNotification(
                    authorProfile.id,
                    typedUserData.id,
                    senderName,
                    post.title,
                    insertedCommentId,
                    post.id,
                    isbn
                ).catch(console.error);
            }

            // 로컬 댓글 목록 즉시 갱신 (Realtime 의존하지 않음)
            const newCommentObj: Comment = {
                id: crypto.randomUUID(),
                content: newComment,
                author: {
                    uid: currentUser.uid,
                    email: currentUser.email || '',
                },
                createdAt: new Date(),
                likeCount: 0,
                likes: [],
            };
            setComments(prev => [...prev, newCommentObj]);

            setNewComment('');
            setShowMentionList(false);
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        }
    };

    const handleEditPost = async () => {
        if (!currentUser || currentUser.uid !== post.author.uid) {
            alert('본인의 게시물만 수정할 수 있습니다.');
            return;
        }

        if (editTitle.trim() === '' || editContent.trim() === '') {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        try {
            const { error } = await supabase
                .from('posts')
                .update({
                    title: editTitle,
                    content: editContent,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', post.id);

            if (error) {
                throw error;
            }

            setIsEditing(false);
        } catch (error) {
            console.error('게시물 수정 실패:', error);
        }
    };

    const handleDeletePost = async () => {
        if (!currentUser || currentUser.uid !== post.author.uid) {
            alert('본인의 게시물만 삭제할 수 있습니다.');
            return;
        }

        if (window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
            try {
                // 이미지가 있으면 먼저 삭제
                if (post.images && post.images.length > 0) {
                    const imageUrls = post.images.map(img => img.url);
                    await PostImageService.deleteImages(imageUrls);
                }

                // 게시물 삭제
                const { error: deleteError } = await supabase
                    .from('posts')
                    .delete()
                    .eq('id', post.id);

                if (deleteError) {
                    throw deleteError;
                }

                // 포럼의 게시물 수 업데이트
                const { data: forumData } = await supabase
                    .from('forums')
                    .select('post_count')
                    .eq('isbn', isbn)
                    .single();

                await supabase
                    .from('forums')
                    .update({ post_count: Math.max(0, ((forumData as { post_count: number } | null)?.post_count || 1) - 1) })
                    .eq('isbn', isbn);

                // 사용자 통계 업데이트
                await UserService.decrementStat(currentUser.uid, 'post_count');

                onBack();
            } catch (error) {
                console.error('게시물 삭제 실패:', error);
            }
        }
    };

    const formatTime = (timestamp: string | Date | { toDate: () => Date } | null | undefined) => {
        if (!timestamp) return '';
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

    const getDisplayName = () => {
        if (isLoading) return '로딩 중...';
        return authorProfile?.nickname || authorProfile?.displayName || post.author.email?.split('@')[0] || '익명';
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="p-3 sm:p-6 lg:p-8 sticky top-[65px] bg-surface border-b border-border z-10 shadow-sm">
                <button onClick={onBack} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-3 sm:mb-4 transition-colors duration-200">
                    <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>목록으로 돌아가기</span>
                </button>
            </div>

            <div className="px-3 sm:px-6 lg:px-8 pb-20">
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="text-2xl font-bold text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none w-full"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold font-serif text-foreground">{post.title}</h1>
                        )}
                        {currentUser && currentUser.uid === post.author.uid && (
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleEditPost}
                                            className="text-success hover:text-success text-sm font-medium"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditTitle(post.title);
                                                setEditContent(post.content);
                                            }}
                                            className="text-muted-foreground hover:text-foreground text-sm"
                                        >
                                            취소
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="text-primary hover:text-primary-700 text-sm font-medium"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={handleDeletePost}
                                            className="text-destructive hover:text-destructive text-sm font-medium"
                                        >
                                            삭제
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                        <button
                            onClick={() => {
                                if (authorProfile) {
                                    handleUserClick(authorProfile);
                                }
                            }}
                            className="hover:text-primary transition-colors font-medium"
                        >
                            {getDisplayName()}
                        </button>
                        <span className="text-muted-foreground">{formatTime(post.createdAt)}</span>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleToggleLike}
                                className={`flex items-center space-x-1 p-2 -m-2 transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                                    }`}
                            >
                                <LikeIcon className="w-4 h-4" />
                                <span>{likeCount}</span>
                            </button>
                            <span className="flex items-center space-x-1 text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span>{comments.length}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-muted-foreground">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>{viewCount}</span>
                            </span>
                        </div>
                    </div>

                    <div className="prose max-w-none">
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-64 p-3 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
                                placeholder="내용을 입력하세요..."
                            />
                        ) : (
                            <p className="text-surface-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        )}
                    </div>

                    {/* 이미지 갤러리 */}
                    {!isEditing && post.images && post.images.length > 0 && (
                        <div className="mt-6">
                            <ImageGallery images={post.images} />
                        </div>
                    )}
                </div>

                {/* 댓글 섹션 */}
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-foreground mb-4">댓글 ({comments.length})</h3>

                    {comments.length > 0 ? (
                        <div className="space-y-4 mb-6">
                            {comments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    postId={post.id}
                                    isbn={isbn}
                                    onUserClick={handleUserClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-4 mb-6">
                            <MessageCircleIcon className="w-12 h-12 text-primary opacity-30 mb-3" />
                            <p className="text-muted-foreground text-sm text-center">아직 이 글에 대한 이야기가 시작되지 않았네요. 첫 번째 생각을 남겨보는 건 어떨까요.</p>
                        </div>
                    )}

                    {currentUser ? (
                        <div className="relative">
                            <form onSubmit={handleAddComment} className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        placeholder="떠오른 생각을 남겨보세요"
                                        className="w-full p-3 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-foreground"
                                    />
                                    {showMentionList && getMentionUsers().length > 0 && (
                                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-surface rounded-lg shadow-lg border border-border max-h-60 overflow-y-auto z-10">
                                            {getMentionUsers().map((user) => (
                                                <button
                                                    key={user.uid}
                                                    type="button"
                                                    onClick={() => {
                                                        // 간단한 멘션 처리
                                                        const atIndex = newComment.lastIndexOf('@');
                                                        if (atIndex !== -1) {
                                                            const beforeAt = newComment.substring(0, atIndex);
                                                            const nickname = user.email?.split('@')[0] || '';
                                                            setNewComment(beforeAt + '@' + nickname + ' ');
                                                            setShowMentionList(false);
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-muted text-surface-foreground text-sm"
                                                >
                                                    @{user.email?.split('@')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="px-4 py-3 bg-cta text-cta-foreground rounded-lg hover:bg-cta-700 transition-colors font-medium"
                                >
                                    등록
                                </button>
                            </form>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">로그인 후 댓글을 작성할 수 있습니다.</p>
                    )}
                </div>
            </div>

            {selectedUser && (
                <UserProfilePreview
                    user={selectedUser}
                    onClose={handleCloseUserProfile}
                    onSendMessage={onSendMessage ? () => onSendMessage(selectedUser.id) : undefined}
                />
            )}
        </div>
    );
};

export default PostDetail;
