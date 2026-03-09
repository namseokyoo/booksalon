import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { CommentWithReplies } from '../lib/services/commentService';
import { formatRelativeDate } from '../lib/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../contexts/ModalContext';
import { UserService, SocialService } from '../lib/services';
import { LikeIcon } from './icons/LikeIcon';
import type { UserProfile } from '../types';
import LoginRequiredPopup from './LoginRequiredPopup';

interface ReplyItemProps {
  comment: CommentWithReplies;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLike: (id: string) => Promise<void>;
  onUserClick?: (user: UserProfile) => void;
}

const ReplyItem: React.FC<ReplyItemProps> = ({ comment, onEdit, onDelete, onLike, onUserClick }) => {
  const [authorProfile, setAuthorProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [displayContent, setDisplayContent] = useState(comment.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const { currentUser } = useAuth();
  const { openLogin } = useModals();

  useEffect(() => {
    const loadAuthorProfile = async () => {
      try {
        const profile = await UserService.getUserProfileByAuthId(comment.author.uid);
        setAuthorProfile(profile);
      } catch (error) {
        console.error('대댓글 작성자 프로필 로딩 실패:', error);
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
          console.error('대댓글 좋아요 상태 확인 실패:', error);
        }
      }
    };
    checkLikeStatus();
  }, [currentUser, comment.id]);

  const getDisplayName = () => {
    if (isLoading) return '로딩 중...';
    return authorProfile?.nickname || authorProfile?.displayName || comment.author.email?.split('@')[0] || '익명';
  };

  const isOwner = currentUser && currentUser.uid === comment.author.uid;

  const handleToggleLike = async () => {
    if (!currentUser) {
      setShowLoginPopup(true);
      return;
    }
    setLikeError(null);
    try {
      await onLike(comment.id);
      setIsLiked(prev => !prev);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('대댓글 좋아요 실패:', error);
    }
  };

  const handleEditSubmit = async () => {
    if (editContent.trim() === '') {
      setEditError('내용을 입력해주세요.');
      return;
    }
    setEditError(null);
    try {
      await onEdit(comment.id, editContent);
      // 낙관적 업데이트: 저장 성공 즉시 로컬 표시값 갱신
      setDisplayContent(editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('대댓글 수정 실패:', error);
      setEditError('수정에 실패했습니다.');
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteError(null);
    try {
      await onDelete(comment.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('대댓글 삭제 실패:', error);
      setDeleteError('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="bg-muted border border-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Link
            to={`/profile/${authorProfile?.uid || comment.author.uid}`}
            className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
          >
            {getDisplayName()}
          </Link>
          <span className="text-xs text-muted-foreground">{formatRelativeDate(comment.createdAt)}</span>
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
                  className="min-h-[36px] px-3 text-xs text-destructive hover:text-destructive/80 font-medium"
                >
                  삭제
                </button>
              </>
            )}
            {showDeleteConfirm && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-surface-foreground">삭제할까요?</span>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-2 py-1 text-xs bg-destructive text-white rounded hover:bg-destructive/90"
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
            rows={2}
          />
          {editError && <p className="text-destructive text-xs">{editError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleEditSubmit}
              className="shrink-0 px-3 py-1 bg-cta text-cta-foreground rounded-lg text-sm hover:bg-cta-700 font-medium"
            >
              저장
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(displayContent);
                setEditError(null);
              }}
              className="shrink-0 px-3 py-1 bg-muted text-surface-foreground rounded-lg text-sm hover:bg-muted font-medium"
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
          className={`flex items-center space-x-1 text-xs transition-colors ${isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
        >
          <LikeIcon className="w-4 h-4" filled={isLiked} />
          <span>{likeCount}</span>
        </button>
      </div>
      {likeError && <p className="text-destructive text-xs mt-1">{likeError}</p>}
      {deleteError && <p className="text-destructive text-xs mt-1">{deleteError}</p>}
      <LoginRequiredPopup
        message="좋아요를 누르려면 로그인이 필요합니다."
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={openLogin}
      />
    </div>
  );
};

export default ReplyItem;
