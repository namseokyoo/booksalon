import React, { useState, useEffect } from 'react';
import type { Comment, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserService, SocialService } from '../lib/services';
import { LikeIcon } from './icons/LikeIcon';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  isbn: string;
  onUserClick?: (user: UserProfile) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, isbn, onUserClick }) => {
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
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

      setIsEditing(false);
    } catch (error) {
      console.error('댓글 수정 실패:', error);
    }
  };

  const handleDeleteComment = async () => {
    if (!currentUser || currentUser.uid !== comment.author.uid) {
      alert('본인의 댓글만 삭제할 수 있습니다.');
      return;
    }

    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', comment.id);

        if (error) {
          throw error;
        }

        // 게시물 댓글 수 감소 처리는 DB trigger 또는 별도 로직으로
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
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
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="min-h-[36px] px-3 text-xs text-primary hover:text-primary-700 font-medium"
                >
                  수정
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="min-h-[36px] px-3 text-xs text-destructive hover:text-red-700 font-medium"
                >
                  삭제
                </button>
              </>
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
                setEditContent(comment.content);
                setEditError(null);
              }}
              className="px-3 py-1 bg-muted text-surface-foreground rounded-lg text-sm hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-surface-foreground whitespace-pre-wrap mb-2 leading-relaxed">{comment.content}</p>
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
      </div>
      {likeError && (
        <p className="text-red-500 text-xs mt-1">{likeError}</p>
      )}
    </div>
  );
};

export default CommentItem;
