import React, { useState, useEffect } from 'react';
import type { Post, Comment } from '../types';
import CommentItem from './CommentItem';
import TagList from './TagList';
import ImageGallery from './ImageGallery';
import { ChatBubbleIcon } from './icons';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, increment, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService } from '../services/userProfile';
import { SocialService } from '../services/socialService';
import { LikeIcon } from './icons/LikeIcon';

interface PostItemProps {
  post: Post;
  isbn: string;
}

const PostItem: React.FC<PostItemProps> = ({ post, isbn }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser && post.likes) {
      setIsLiked(post.likes.includes(currentUser.uid));
    }
  }, [currentUser, post.likes]);

  const handleToggleLike = async () => {
    if (!currentUser) {
      alert('좋아요하려면 로그인이 필요합니다.');
      return;
    }

    try {
      const newIsLiked = await SocialService.toggleLike(
        currentUser.uid,
        'post',
        post.id,
        isbn,
        '' // 포럼 제목은 부모 컴포넌트에서 전달받아야 함
      );

      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!isExpanded) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'forums', isbn, 'posts', post.id, 'comments'),
        orderBy('createdAt', 'asc')
      ),
      snapshot => {
        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
        setComments(commentsData);
      }
    );

    return () => unsubscribe();
  }, [isExpanded, isbn, post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && currentUser) {
      const postRef = doc(db, 'forums', isbn, 'posts', post.id);
      const commentsRef = collection(db, 'forums', isbn, 'posts', post.id, 'comments');

      const commentData = {
        content: newComment.trim(),
        author: {
          uid: currentUser.uid,
          email: currentUser.email,
        },
        createdAt: serverTimestamp(),
      };

      await addDoc(commentsRef, commentData);
      await updateDoc(postRef, {
        commentCount: increment(1)
      });

      // 사용자 통계 업데이트
      await UserProfileService.updateUserStats(currentUser.uid, 'comment', true);

      setNewComment('');
    } else if (!currentUser) {
      alert("댓글을 작성하려면 로그인이 필요합니다.")
    }
  };

  const formatDate = (timestamp: any) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: ko });
    }
    return '방금 전';
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-3 sm:p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="font-semibold text-base sm:text-lg text-white">{post.title}</h3>
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500 mt-2">
          <span className="font-medium text-cyan-400 truncate">{post.author.email}</span>
          <span className="hidden sm:inline">{formatDate(post.createdAt)}</span>
          <div className="flex items-center space-x-1">
            <ChatBubbleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{post.commentCount || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLike();
              }}
              className="flex items-center space-x-1 hover:text-red-400 transition-colors duration-200"
            >
              <LikeIcon
                className="h-3 w-3 sm:h-4 sm:w-4"
                filled={isLiked}
              />
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
        <div className="sm:hidden text-xs text-gray-500 mt-1">
          {formatDate(post.createdAt)}
        </div>
        {/* 태그 표시 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-2">
            <TagList
              tags={post.tags}
              maxDisplay={3}
              size="sm"
            />
          </div>
        )}
        {/* 이미지 썸네일 표시 (접힌 상태) */}
        {!isExpanded && post.images && post.images.length > 0 && (
          <div className="mt-2 flex items-center space-x-2">
            <div className="flex -space-x-2">
              {post.images.slice(0, 3).map((image, idx) => (
                <div
                  key={image.id}
                  className="w-12 h-12 rounded-md overflow-hidden border-2 border-gray-700 bg-gray-600"
                >
                  <img
                    src={image.url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {post.images.length === 1 ? '이미지 1장' : `이미지 ${post.images.length}장`}
            </span>
          </div>
        )}
        {!isExpanded && (
          <p className="text-xs sm:text-sm text-gray-300 mt-2 sm:mt-3 line-clamp-2 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <p className="text-xs sm:text-sm text-gray-200 mt-1 mb-3 sm:mb-4 whitespace-pre-wrap">{post.content}</p>
          {/* 이미지 갤러리 (펼친 상태) */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4" onClick={(e) => e.stopPropagation()}>
              <ImageGallery images={post.images} />
            </div>
          )}
          <div className="border-t border-gray-700 pt-2">
            <h4 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2">댓글</h4>
            <div className="space-y-2 divide-y divide-gray-700/50">
              {comments.length > 0 ? (
                comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 py-2 sm:py-3">아직 댓글이 없습니다.</p>
              )}
            </div>
            <form onSubmit={handleAddComment} className="mt-3 sm:mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-xs sm:text-sm text-gray-200 focus:ring-cyan-500 focus:border-cyan-500"
                disabled={!currentUser}
              />
              <button
                type="submit"
                className="bg-cyan-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={!currentUser}
              >
                등록
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;
