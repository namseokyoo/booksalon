import React, { useState, useEffect } from 'react';
import type { Comment, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { UserProfileService } from '../services/userProfile';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { SocialService } from '../services/socialService';
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
  const { currentUser } = useAuth();

  useEffect(() => {
    const loadAuthorProfile = async () => {
      try {
        const profile = await UserProfileService.getUserProfile(comment.author.uid);
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
    if (currentUser && comment.likes) {
      setIsLiked(comment.likes.includes(currentUser.uid));
    }
  }, [currentUser, comment.likes]);

  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ko });
    }
    return '방금 전';
  };

  const getDisplayName = () => {
    if (isLoading) return '로딩 중...';
    return authorProfile?.nickname || authorProfile?.displayName || comment.author.email?.split('@')[0] || '익명';
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      alert('좋아요하려면 로그인이 필요합니다.');
      return;
    }

    try {
      const newIsLiked = await SocialService.toggleLike(
        currentUser.uid,
        'comment',
        comment.id,
        isbn,
        postId
      );

      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('댓글 좋아요 실패:', error);
    }
  };

  const handleEditComment = async () => {
    if (!currentUser || currentUser.uid !== comment.author.uid) {
      alert('본인의 댓글만 수정할 수 있습니다.');
      return;
    }

    if (editContent.trim() === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      const commentRef = doc(db, 'forums', isbn, 'posts', postId, 'comments', comment.id);
      await updateDoc(commentRef, {
        content: editContent,
        updatedAt: serverTimestamp(),
      });

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
        const commentRef = doc(db, 'forums', isbn, 'posts', postId, 'comments', comment.id);
        await deleteDoc(commentRef);
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
      }
    }
  };

  const isOwner = currentUser && currentUser.uid === comment.author.uid;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (authorProfile && onUserClick) {
                onUserClick(authorProfile);
              }
            }}
            className="text-xs sm:text-sm font-semibold text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            {getDisplayName()}
          </button>
          <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
        </div>
        {isOwner && (
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  수정
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
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
            className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
            rows={3}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleEditComment}
              className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium"
            >
              저장
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 font-medium"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2 leading-relaxed">{comment.content}</p>
      )}

      <div className="flex items-center space-x-3 mt-2">
        <button
          onClick={handleToggleLike}
          className={`flex items-center space-x-1 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
        >
          <LikeIcon className="w-3 h-3" filled={isLiked} />
          <span>{likeCount}</span>
        </button>
      </div>
    </div>
  );
};

export default CommentItem;
