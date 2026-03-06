import React, { useState, useEffect } from 'react';
import type { Post, Comment, UserProfile } from '../types';
import CommentItem from './CommentItem';
import UserProfilePreview from './UserProfilePreview';
import ImageGallery from './ImageGallery';
import { MessageCircleIcon } from './icons';
import { formatRelativeDate } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserService, PostImageService, SocialService, ViewCountService, CommentService } from '../lib/services';
import type { CommentWithReplies } from '../lib/services';
import { NotificationService } from '../lib/services/notificationService';
import { LikeIcon } from './icons/LikeIcon';

interface PostDetailProps {
    post: Post;
    isbn: string;
    onBack: () => void;
    onUserClick: (user: UserProfile) => void;
    onSendMessage?: (userId: string) => void;
    onShowToast?: (message: string, type?: 'info' | 'error') => void;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, isbn, onBack, onUserClick, onSendMessage, onShowToast }) => {
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState<CommentWithReplies[]>([]);
    const [confirmDeletePost, setConfirmDeletePost] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content);
    const [editError, setEditError] = useState<string | null>(null);
    const [localTitle, setLocalTitle] = useState(post.title);
    const [localContent, setLocalContent] = useState(post.content);
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
            try {
                const commentTree = await CommentService.getCommentsByPostId(post.id);
                setComments(commentTree);
            } catch (error) {
                console.error('댓글 로드 실패:', error);
            }
        };

        loadComments();

        // 실시간 구독 (기존 유지: post_id 필터로 모든 댓글/대댓글 변경 감지)
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
            onShowToast?.('좋아요를 누르려면 로그인이 필요합니다', 'info');
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
            onShowToast?.('좋아요 처리 중 오류가 발생했습니다', 'error');
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

    const handleAddCommentWithContent = async (content: string, parentId?: string | null) => {
        if (!currentUser || content.trim() === '') return;

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

            // 댓글 또는 대댓글 생성 (CommentService 사용)
            const insertedComment = await CommentService.createComment({
                postId: post.id,
                authorId: typedUserData.id,
                content,
                parentId: parentId || null,
            });

            // 최상위 댓글일 때만 게시물 댓글 수 업데이트
            if (!parentId) {
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
            }

            // 댓글 알림 트리거 (자기 자신 제외)
            // 대댓글인 경우: 원댓글 작성자에게 알림
            // 최상위 댓글인 경우: 게시물 작성자에게 알림
            if (parentId) {
                // 원댓글 작성자 찾기
                const parentComment = comments.find(c => c.id === parentId);
                if (parentComment && parentComment.author.uid !== currentUser.uid) {
                    const { data: parentAuthorData } = await supabase
                        .from('users')
                        .select('id')
                        .eq('auth_id', parentComment.author.uid)
                        .single();
                    if (parentAuthorData) {
                        const senderProfile = await UserService.getUserProfileById(typedUserData.id);
                        const senderName = senderProfile?.nickname || senderProfile?.displayName || senderProfile?.email?.split('@')[0] || '누군가';
                        NotificationService.createCommentNotification(
                            (parentAuthorData as { id: string }).id,
                            typedUserData.id,
                            senderName,
                            post.title,
                            insertedComment.id,
                            post.id,
                            isbn
                        ).catch(console.error);
                    }
                }
            } else if (authorProfile?.id && authorProfile.id !== typedUserData.id) {
                const senderProfile = await UserService.getUserProfileById(typedUserData.id);
                const senderName = senderProfile?.nickname || senderProfile?.displayName || senderProfile?.email?.split('@')[0] || '누군가';
                NotificationService.createCommentNotification(
                    authorProfile.id,
                    typedUserData.id,
                    senderName,
                    post.title,
                    insertedComment.id,
                    post.id,
                    isbn
                ).catch(console.error);
            }

            // Realtime 구독이 loadComments를 재호출하므로 로컬 즉시 갱신은 생략.
            // 단, Realtime 지연을 커버하기 위해 낙관적 업데이트 적용.
            if (!parentId) {
                const newCommentObj: CommentWithReplies = {
                    id: insertedComment.id,
                    postId: post.id,
                    content,
                    author: {
                        uid: currentUser.uid,
                        email: currentUser.email || '',
                    },
                    parentId: null,
                    createdAt: new Date(),
                    likeCount: 0,
                    likes: [],
                    replies: [],
                };
                setComments(prev => [...prev, newCommentObj]);
            }
        } catch (error) {
            console.error('댓글 작성 실패:', error);
        }
    };

    const handleReply = async (parentId: string, content: string) => {
        await handleAddCommentWithContent(content, parentId);
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || newComment.trim() === '') return;
        await handleAddCommentWithContent(newComment);
        setNewComment('');
        setShowMentionList(false);
    };

    const handleEditPost = async () => {
        if (!currentUser || currentUser.uid !== post.author.uid) {
            setEditError('본인의 게시물만 수정할 수 있습니다.');
            return;
        }

        if (editTitle.trim() === '' || editContent.trim() === '') {
            setEditError('제목과 내용을 입력해주세요.');
            return;
        }

        setEditError(null);

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

            // 낙관적 업데이트: 저장 성공 즉시 로컬 표시값 갱신 (Realtime 이벤트 대기 없이)
            setLocalTitle(editTitle);
            setLocalContent(editContent);
            setIsEditing(false);
        } catch (error) {
            console.error('게시물 수정 실패:', error);
        }
    };

    const handleDeletePost = async () => {
        if (!currentUser || currentUser.uid !== post.author.uid) {
            setEditError('본인의 게시물만 삭제할 수 있습니다.');
            return;
        }

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
    };

    const getDisplayName = () => {
        if (isLoading) return '로딩 중...';
        return authorProfile?.nickname || authorProfile?.displayName || post.author.email?.split('@')[0] || '익명';
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="px-3 sm:px-6 lg:px-8 pb-20 pt-3 sm:pt-6 lg:pt-8">
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
                            <h1 className="text-2xl font-bold font-serif text-foreground break-words">{localTitle}</h1>
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
                                                setEditTitle(localTitle);
                                                setEditContent(localContent);
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
                                            className="min-h-[40px] px-3 rounded-md text-primary hover:text-primary-700 text-sm font-medium"
                                        >
                                            수정
                                        </button>
                                        {confirmDeletePost ? (
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-destructive">정말 삭제하시겠습니까?</span>
                                                <button
                                                    onClick={handleDeletePost}
                                                    className="min-h-[40px] px-3 rounded-md text-destructive hover:text-destructive text-sm font-medium"
                                                >
                                                    확인
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeletePost(false)}
                                                    className="min-h-[40px] px-3 rounded-md text-muted-foreground hover:text-foreground text-sm"
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeletePost(true)}
                                                className="min-h-[40px] px-3 rounded-md text-destructive hover:text-destructive text-sm font-medium"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {editError && (
                        <p className="text-destructive text-sm mb-2">{editError}</p>
                    )}

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
                        <span className="text-muted-foreground">{formatRelativeDate(post.createdAt)}</span>
                        <div className="flex items-center space-x-4">
                            <div>
                            <button
                                onClick={handleToggleLike}
                                className={`flex items-center space-x-1 p-2 -m-2 transition-colors ${isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                                    }`}
                            >
                                <LikeIcon className="w-4 h-4" />
                                <span>{likeCount}</span>
                            </button>
                            </div>
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
                            <p className="text-surface-foreground whitespace-pre-wrap leading-relaxed">{localContent}</p>
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
                                    comment={comment as unknown as Comment}
                                    postId={post.id}
                                    isbn={isbn}
                                    onUserClick={handleUserClick}
                                    replies={comment.replies ?? []}
                                    onReply={handleReply}
                                    currentUserId={currentUser?.uid}
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
                        <div className="relative sticky bottom-0 bg-surface border-t border-border z-10 pt-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
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
