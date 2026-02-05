import React, { useState, useEffect } from 'react';
import type { Forum, Post, UserProfile, PostImage } from '../types';
import BookInfo from './BookInfo';
import PostList from './PostList';
import PostDetail from './PostDetail';
import UserMenu from './UserMenu';
import UserProfilePreview from './UserProfilePreview';
import CreatePostModal from './CreatePostModal';
import type { ImagePreview } from './ImageUploader';
import { ArrowLeftIcon, PlusIcon } from './icons';
import { db } from '../services/firebase';
import { doc, updateDoc, collection, addDoc, orderBy, serverTimestamp, increment, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService } from '../services/userProfile';
import { PostImageService } from '../services/postImageService';

interface ForumViewProps {
  forum: Forum;
  onBack: () => void;
  onNavigateToMessaging?: (userId: string) => void;
}

const ForumView: React.FC<ForumViewProps> = ({ forum, onBack, onNavigateToMessaging }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!forum.isbn) return;
    const unsubscribe = onSnapshot(
      collection(db, 'forums', forum.isbn, 'posts'),
      { includeMetadataChanges: false },
      snapshot => {
        const postsData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          }) as Post[];
        setPosts(postsData);
      }
    );
    return () => unsubscribe();
  }, [forum.isbn]);

  const handleAddPost = async (title: string, content: string, tags?: string[], imagePreviews?: ImagePreview[]) => {
    if (!currentUser) {
      alert("글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const forumRef = doc(db, 'forums', forum.isbn);
      const postsRef = collection(db, 'forums', forum.isbn, 'posts');

      // 먼저 게시물 문서를 생성하여 ID를 얻음
      const newPost: Record<string, any> = {
        title,
        content,
        author: {
          uid: currentUser.uid,
          email: currentUser.email,
        },
        createdAt: serverTimestamp(),
        commentCount: 0,
        likeCount: 0,
        likes: [],
        searchText: `${title} ${content} ${currentUser.email}`.toLowerCase(),
      };

      // 태그가 있으면 추가
      if (tags && tags.length > 0) {
        newPost.tags = tags;
      }

      const docRef = await addDoc(postsRef, newPost);
      const postId = docRef.id;

      // 이미지가 있으면 업로드
      if (imagePreviews && imagePreviews.length > 0) {
        const uploadedImages: PostImage[] = [];

        for (let i = 0; i < imagePreviews.length; i++) {
          const imagePreview = imagePreviews[i];
          try {
            const uploadedImage = await PostImageService.uploadImage(
              forum.isbn,
              postId,
              imagePreview.file,
              i
            );
            uploadedImages.push(uploadedImage);
          } catch (error) {
            console.error(`이미지 ${i + 1} 업로드 실패:`, error);
          }
        }

        // 업로드된 이미지가 있으면 게시물 업데이트
        if (uploadedImages.length > 0) {
          await updateDoc(docRef, { images: uploadedImages });
        }
      }

      await updateDoc(forumRef, {
        postCount: increment(1),
        lastActivityAt: serverTimestamp()
      });

      // 태그 통계 업데이트
      if (tags && tags.length > 0) {
        const { TagService } = await import('../services/tagService');
        for (const tag of tags) {
          await TagService.incrementTagCount(tag, 'post');
        }
      }

      // 사용자 통계 업데이트
      await UserProfileService.updateUserStats(currentUser.uid, 'post', true);

      setIsModalOpen(false);
    } catch (error) {
      console.error('게시물 작성 실패:', error);
      alert('게시물 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleUserClick = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserMenu(true);
  };

  const handleShowProfile = () => {
    setShowUserMenu(false);
    setShowUserProfile(true);
  };

  const handleCloseUserMenu = () => {
    setShowUserMenu(false);
    setSelectedUser(null);
  };

  const handleCloseUserProfile = () => {
    setShowUserProfile(false);
    setSelectedUser(null);
  };

  const handleSendMessage = (userId: string) => {
    if (onNavigateToMessaging) {
      onNavigateToMessaging(userId);
    } else {
      console.log('Send message to user:', userId);
    }
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        isbn={forum.isbn}
        onBack={handleBackToList}
        onUserClick={handleUserClick}
        onSendMessage={handleSendMessage}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-3 sm:p-6 lg:p-8 sticky top-[65px] bg-white border-b border-gray-200 z-10 shadow-sm">
        <button onClick={onBack} className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors duration-200">
          <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>목록으로 돌아가기</span>
        </button>
        <BookInfo book={forum.book} forum={forum} />
      </div>

      <div className="px-3 sm:px-6 lg:px-8 pb-20">
        <PostList
          posts={posts}
          onPostClick={handlePostClick}
          onUserClick={handleUserClick}
        />
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-cyan-600 text-white rounded-full p-3 sm:p-4 shadow-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 z-30 transition-colors duration-200"
        aria-label="Write a new post"
        disabled={!currentUser}
        title={!currentUser ? "로그인이 필요합니다" : "새로운 글 작성"}
      >
        <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {isModalOpen && (
        <CreatePostModal
          onClose={() => !isSubmitting && setIsModalOpen(false)}
          onSubmit={handleAddPost}
          isSubmitting={isSubmitting}
        />
      )}

      {showUserMenu && selectedUser && (
        <div className="fixed inset-0 z-40" onClick={handleCloseUserMenu}>
          <div className="absolute top-20 left-4" onClick={(e) => e.stopPropagation()}>
            <UserMenu
              user={selectedUser}
              onClose={handleCloseUserMenu}
              onShowProfile={handleShowProfile}
            />
          </div>
        </div>
      )}

      {showUserProfile && selectedUser && (
        <UserProfilePreview
          user={selectedUser}
          onClose={handleCloseUserProfile}
        />
      )}
    </div>
  );
};

export default ForumView;
