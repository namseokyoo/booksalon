import React, { useState, useEffect } from 'react';
import type { Comment, UserProfile } from '../types';
import type { CommentWithReplies } from '../lib/services/commentService';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserService, SocialService } from '../lib/services';
import { LikeIcon } from './icons/LikeIcon';
import ReplyInput from './ReplyInput';
import ReplyItem from './ReplyItem';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isbn: string;
  onUserClick?: (user: UserProfile) => void;
  replies?: CommentWithReplies[];
  onReply?: (parentId: string, content: string) => Promise<void>;
  currentUserId?: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, isbn, onUserClick, replies, onReply, currentUserId }) => {
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [displayContent, setDisplayContent] = useState(comment.content);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadAuthorProfile = async () => {
      try {
        const profile = await UserService.getUserProfileByAuthId(comment.author.uid);
        setAuthorProfile(profile);
      } catch (error) {
        console.error('작성자 프로필 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthorProfile();
  }, [comment.author.uid]);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (currentUser) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', currentUser.uid)
            .single();

          if (userData) {
            const liked = await SocialService.isLiked((userData as { id: string }).id, 'comment', comment.id);
            setIsLiked(liked);
          }
        } catch (error) {
          console.error('좋아요 상태 확인 실패:', error);
        }
      }
    };
    checkLikeStatus();
  }, [currentUser, comment.id]);

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

  const getDisplayName = () => {
    if (isLoading) return '로딩 중...';
    return authorProfile?.nickname || authorProfile?.displayName || comment.author.email?.split('@')[0] || '익명';
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      setLikeError('좋아요하려면 로그인이 필요합니다.');
      return;
    }

    setLikeError(null);
    try {
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
        'comment',
        comment.id
      );

      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('댓글 좋아요 실패:', error);
    }
  };

  const handleEditComment = async () => {
    if (!currentUser || currentUser.uid !== comment.author.uid) {
      setEditError('본인의 댓글만 수정할 수 있습니다.');
      return;
    }

    if (editContent.trim() === '') {
      setEditError('내용을 입력해주세요.');
      return;
    }

    setEditError(null);
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', comment.id);

      if (error) {
        throw error;
      }

      // 낙관적 업데이트: 저장 성공 즉시 로컬 표시값 갱신
      setDisplayContent(editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    }
  };

  const handleDeleteComment = async () => {
    if (!currentUser || currentUser.uid !== comment.author.uid) {
      setDeleteError('본인의 댓글만 삭제할 수 있습니다.');
      return;
    }

    setDeleteError(null);
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) {
        throw error;
      }

      setShowDeleteConfirm(false);
      // 게시물 댓글 수 감소 처리는 DB trigger 또는 별도 로직으로
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      setDeleteError('댓글 삭제에 실패했습니다.');
    }
  };

  const isOwner = currentUser && currentUser.uid === comment.author.uid;

  return (
    <div className="bg-muted border border-border rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (authorProfile && onUserClick) {
                onUserClick(authorProfile);
              }
            }}
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
          >
            {getDisplayName()}
          </button>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            {!isEditing && !showDeleteConfirm && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="min-h-[36px] px-3 text-xs text-primary hover:text-primary-700 font-medium"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="min-h-[36px] px-3 text-xs text-destructive hover:text-red-700 font-medium"
                >
                  삭제
                </button>
              </>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-surface-foreground">삭제할까요?</span>
                <button
                  onClick={handleDeleteComment}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  확인
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  className="px-2 py-1 text-xs bg-muted text-surface-foreground rounded hover:bg-muted/80"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 bg-surface border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
            rows={3}
          />
          {editError && (
            <p className="text-red-500 text-xs">{editError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleEditComment}
              className="px-3 py-1 bg-cta text-cta-foreground rounded-lg text-sm hover:bg-cta-700 font-medium"
            >
              저장
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(displayContent);
                setEditError(null);
              }}
              className="px-3 py-1 bg-muted text-surface-foreground rounded-lg text-sm hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-surface-foreground whitespace-pre-wrap mb-2 leading-relaxed">{displayContent}</p>
      )}

      <div className="flex items-center space-x-3 mt-2">
        <button
          onClick={handleToggleLike}
          className={`flex items-center space-x-1 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
        >
          <LikeIcon className="w-4 h-4" filled={isLiked} />
          <span>{likeCount}</span>
        </button>
        {currentUserId && !comment.parentId && onReply && (
          <button
            onClick={() => setShowReplyInput(prev => !prev)}
            className="min-h-[36px] px-2 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            답글
          </button>
        )}
      </div>
      {likeError && (
        <p className="text-red-500 text-xs mt-1">{likeError}</p>
      )}
      {deleteError && (
        <p className="text-red-500 text-xs mt-1">{deleteError}</p>
      )}

      {showReplyInput && onReply && (
        <ReplyInput
          parentId={comment.id}
          onSubmit={async (content, parentId) => {
            setIsSubmittingReply(true);
            try {
              await onReply(parentId, content);
              setShowReplyInput(false);
            } finally {
              setIsSubmittingReply(false);
            }
          }}
          onCancel={() => setShowReplyInput(false)}
          isSubmitting={isSubmittingReply}
        />
      )}

      {replies && replies.length > 0 && (
        <div className="ml-4 sm:ml-6 border-l-2 border-border pl-3 space-y-2 mt-2">
          {replies.map(reply => (
            <ReplyItem
              key={reply.id}
              comment={reply}
              onEdit={async (id, content) => {
                const { error } = await supabase
                  .from('comments')
                  .update({ content, updated_at: new Date().toISOString() })
                  .eq('id', id);
                if (error) throw error;
              }}
              onDelete={async (id) => {
                const { error } = await supabase.from('comments').delete().eq('id', id);
                if (error) throw error;
              }}
              onLike={async (id) => {
                if (!currentUserId) return;
                const { data: userData } = await supabase
                  .from('users')
                  .select('id')
                  .eq('auth_id', currentUserId)
                  .single();
                if (userData) {
                  await SocialService.toggleLike((userData as { id: string }).id, 'comment', id);
                }
              }}
              onUserClick={onUserClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
