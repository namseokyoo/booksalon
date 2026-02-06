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
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UserService, TagService, PostImageService } from '../lib/services';

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

    const loadPosts = async () => {
      // 게시물 로드
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          author_id,
          forum_isbn,
          created_at,
          updated_at,
          comment_count,
          like_count,
          images
        `)
        .eq('forum_isbn', forum.isbn)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('게시물 로드 실패:', error);
        return;
      }

      // 작성자 정보 조회
      const authorIds = [...new Set((postsData || []).map((p: { author_id: string }) => p.author_id))];
      const { data: authors } = await supabase
        .from('users')
        .select('id, auth_id, email, display_name, nickname')
        .in('id', authorIds);

      const authorMap = new Map((authors || []).map((a: { id: string; auth_id: string; email: string; display_name: string | null; nickname: string | null }) => [a.id, a]));

      // 게시물 태그 조회
      const postIds = (postsData || []).map((p: { id: string }) => p.id);
      const { data: postTags } = await supabase
        .from('post_tags')
        .select('post_id, tag_name')
        .in('post_id', postIds);

      const tagsByPost = new Map<string, string[]>();
      postTags?.forEach((pt: { post_id: string; tag_name: string }) => {
        const tags = tagsByPost.get(pt.post_id) || [];
        tags.push(pt.tag_name);
        tagsByPost.set(pt.post_id, tags);
      });

      // 좋아요한 사용자 목록 조회
      const { data: postLikes } = await supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      const likesByPost = new Map<string, string[]>();
      postLikes?.forEach((pl: { post_id: string; user_id: string }) => {
        const likes = likesByPost.get(pl.post_id) || [];
        likes.push(pl.user_id);
        likesByPost.set(pl.post_id, likes);
      });

      const posts: Post[] = (postsData || []).map((post: {
        id: string;
        title: string;
        content: string;
        author_id: string;
        forum_isbn: string;
        created_at: string;
        updated_at: string | null;
        comment_count: number;
        like_count: number;
        images: PostImage[] | null;
      }) => {
        const author = authorMap.get(post.author_id);
        return {
          id: post.id,
          title: post.title,
          content: post.content,
          author: {
            uid: author?.auth_id || post.author_id,
            email: author?.email || '',
          },
          createdAt: post.created_at ? new Date(post.created_at) : new Date(),
          updatedAt: post.updated_at ? new Date(post.updated_at) : undefined,
          commentCount: post.comment_count,
          likeCount: post.like_count,
          likes: likesByPost.get(post.id) || [],
          tags: tagsByPost.get(post.id) || [],
          images: post.images || [],
        };
      });

      setPosts(posts);
    };

    loadPosts();

    // Supabase 실시간 구독
    const subscription = supabase
      .channel(`posts_${forum.isbn}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `forum_isbn=eq.${forum.isbn}` }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [forum.isbn]);

  const handleAddPost = async (title: string, content: string, tags?: string[], imagePreviews?: ImagePreview[]) => {
    if (!currentUser) {
      alert("글을 작성하려면 로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 사용자 ID 조회 (auth_id로 users 테이블에서)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', currentUser.uid)
        .single();

      if (userError || !userData) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const typedUserData = userData as { id: string };

      // 게시물 생성
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          title,
          content,
          author_id: typedUserData.id,
          forum_isbn: forum.isbn,
          comment_count: 0,
          like_count: 0,
        } as never)
        .select('id')
        .single();

      if (postError || !newPost) {
        throw postError || new Error('게시물 생성 실패');
      }

      const postId = (newPost as { id: string }).id;

      // 이미지가 있으면 업로드
      if (imagePreviews && imagePreviews.length > 0) {
        const uploadedImages: PostImage[] = [];

        for (let i = 0; i < imagePreviews.length; i++) {
          const imagePreview = imagePreviews[i];
          try {
            const uploadedImage = await PostImageService.uploadImage(
              currentUser.uid,
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
          await supabase
            .from('posts')
            .update({ images: uploadedImages } as never)
            .eq('id', postId);
        }
      }

      // 포럼 게시물 수 업데이트
      const { data: forumData } = await supabase
        .from('forums')
        .select('post_count')
        .eq('isbn', forum.isbn)
        .single();

      await supabase
        .from('forums')
        .update({
          post_count: ((forumData as { post_count: number } | null)?.post_count || 0) + 1,
          last_activity_at: new Date().toISOString(),
        } as never)
        .eq('isbn', forum.isbn);

      // 태그 통계 업데이트
      if (tags && tags.length > 0) {
        await TagService.addTagsToPost(postId, tags);
      }

      // 사용자 통계 업데이트
      await UserService.incrementStat(currentUser.uid, 'post_count');

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
