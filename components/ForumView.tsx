import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import type { Forum, Post, UserProfile, PostImage } from '../types';
import BookInfo from './BookInfo';
import PostList from './PostList';
import PostDetail from './PostDetail';
import UserMenu from './UserMenu';
import UserProfilePreview from './UserProfilePreview';
import CreatePostModal from './CreatePostModal';
import ForumViewSkeleton from './ForumViewSkeleton';
import type { ImagePreview } from './ImageUploader';
import { PlusIcon } from './icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { useForumLoader } from '../hooks/useForumLoader';
import { UserService, TagService, PostImageService } from '../lib/services';

const POSTS_PAGE_SIZE = 20;

const ForumView: React.FC = () => {
  const { isbn } = useParams<{ isbn: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { openLogin } = useModals();
  const { showToast } = useToast();

  const stateForum = (location.state as { forum?: Forum } | null)?.forum;
  const { forum: loadedForum, loading: forumLoading, error: forumError } = useForumLoader(
    stateForum ? undefined : isbn
  );
  const forum = stateForum || loadedForum;
  const initialPostId = searchParams.get('post') || undefined;
  const [initialPostLoading, setInitialPostLoading] = useState(!!initialPostId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [postsPage, setPostsPage] = useState(0);
  const postsPageRef = useRef(postsPage);
  postsPageRef.current = postsPage;
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const { currentUser } = useAuth();

  const enrichPostsData = async (postsData: Array<{
    id: string;
    title: string;
    content: string;
    author_id: string;
    forum_isbn: string;
    created_at: string;
    updated_at: string | null;
    comment_count: number;
    like_count: number;
    view_count: number | null;
  }>): Promise<Post[]> => {
    if (postsData.length === 0) return [];

    const postIds = postsData.map(p => p.id);

    // 배치 조회: 이미지, 작성자, 태그, 좋아요
    const [postImagesResult, authorsResult, postTagsResult, postLikesResult] = await Promise.all([
      supabase
        .from('post_images')
        .select('id, post_id, url, thumbnail_url, width, height, display_order')
        .in('post_id', postIds),
      supabase
        .from('users')
        .select('id, auth_id, email, display_name, nickname')
        .in('id', [...new Set(postsData.map(p => p.author_id))]),
      supabase
        .from('post_tags')
        .select('post_id, tag_name')
        .in('post_id', postIds),
      supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds),
    ]);

    const imagesByPost = new Map<string, PostImage[]>();
    (postImagesResult.data || []).forEach((img: { id: string; post_id: string; url: string; thumbnail_url: string | null; width: number; height: number; display_order: number | null }) => {
      const images = imagesByPost.get(img.post_id) || [];
      images.push({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnail_url || undefined,
        width: img.width,
        height: img.height,
        order: img.display_order || 0,
      });
      imagesByPost.set(img.post_id, images);
    });

    const authorMap = new Map((authorsResult.data || []).map((a: { id: string; auth_id: string; email: string; display_name: string | null; nickname: string | null }) => [a.id, a]));

    const tagsByPost = new Map<string, string[]>();
    (postTagsResult.data || []).forEach((pt: { post_id: string; tag_name: string }) => {
      const tags = tagsByPost.get(pt.post_id) || [];
      tags.push(pt.tag_name);
      tagsByPost.set(pt.post_id, tags);
    });

    const likesByPost = new Map<string, string[]>();
    (postLikesResult.data || []).forEach((pl: { post_id: string; user_id: string }) => {
      const likes = likesByPost.get(pl.post_id) || [];
      likes.push(pl.user_id);
      likesByPost.set(pl.post_id, likes);
    });

    return postsData.map((post) => {
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
        viewCount: post.view_count || 0,
        likes: likesByPost.get(post.id) || [],
        tags: tagsByPost.get(post.id) || [],
        images: imagesByPost.get(post.id) || [],
      };
    });
  };

  useEffect(() => {
    if (!forum?.isbn) return;

    const loadPosts = async () => {
      const from = 0;
      const to = POSTS_PAGE_SIZE - 1;

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
          view_count
        `)
        .eq('forum_isbn', forum.isbn)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('게시물 로드 실패:', error);
        return;
      }

      const enrichedPosts = await enrichPostsData(postsData || []);
      setPosts(enrichedPosts);
      setPostsPage(0);
      setHasMorePosts((postsData || []).length >= POSTS_PAGE_SIZE);

      // initialPostId가 있으면 해당 포스트 자동 열기
      if (initialPostId) {
        const targetPost = enrichedPosts.find(p => p.id === initialPostId);
        if (targetPost) {
          setSelectedPost(targetPost);
          setInitialPostLoading(false);
        } else {
          // 첫 페이지에 없을 수 있으므로 단건 조회
          const { data: singlePostData } = await supabase
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
              view_count
            `)
            .eq('id', initialPostId)
            .single();
          if (singlePostData) {
            const enrichedSingle = await enrichPostsData([singlePostData]);
            if (enrichedSingle.length > 0) {
              setSelectedPost(enrichedSingle[0]);
            }
          }
          setInitialPostLoading(false);
        }
      }
    };

    loadPosts();

    // Supabase 실시간 구독 — 새 게시물 추가 시 첫 페이지 리로드
    const subscription = supabase
      .channel(`posts_${forum.isbn}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts', filter: `forum_isbn=eq.${forum.isbn}` }, async (payload) => {
        // 새 게시물을 조회하여 목록 상단에 추가
        const newPostId = (payload.new as { id: string }).id;
        const { data: newPostData } = await supabase
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
            view_count
          `)
          .eq('id', newPostId)
          .single();

        if (newPostData) {
          const enriched = await enrichPostsData([newPostData]);
          if (enriched.length > 0) {
            setPosts(prev => {
              const exists = prev.some(p => p.id === enriched[0].id);
              if (exists) return prev;
              return [enriched[0], ...prev];
            });
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts', filter: `forum_isbn=eq.${forum.isbn}` }, async () => {
        // UPDATE 시 현재 로드된 범위만 리로드
        const currentTo = ((postsPageRef.current + 1) * POSTS_PAGE_SIZE) - 1;
        const { data: postsData } = await supabase
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
            view_count
          `)
          .eq('forum_isbn', forum.isbn)
          .order('created_at', { ascending: false })
          .range(0, currentTo);

        if (postsData) {
          const enrichedPosts = await enrichPostsData(postsData);
          setPosts(enrichedPosts);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts', filter: `forum_isbn=eq.${forum.isbn}` }, (payload) => {
        const deletedId = (payload.old as { id: string }).id;
        setPosts(prev => prev.filter(p => p.id !== deletedId));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [forum?.isbn, initialPostId]);

  const handleLoadMorePosts = async () => {
    if (!forum) return;
    if (!hasMorePosts || isLoadingMorePosts) return;

    setIsLoadingMorePosts(true);
    try {
      const nextPage = postsPage + 1;
      const from = nextPage * POSTS_PAGE_SIZE;
      const to = from + POSTS_PAGE_SIZE - 1;

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
          view_count
        `)
        .eq('forum_isbn', forum.isbn)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('추가 게시물 로드 실패:', error);
        return;
      }

      if ((postsData || []).length < POSTS_PAGE_SIZE) {
        setHasMorePosts(false);
      }

      const enrichedPosts = await enrichPostsData(postsData || []);

      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = enrichedPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      setPostsPage(nextPage);
    } catch (error) {
      console.error('추가 게시물 로드 실패:', error);
    } finally {
      setIsLoadingMorePosts(false);
    }
  };

  const handleAddPost = async (title: string, content: string, tags?: string[], imagePreviews?: ImagePreview[]) => {
    if (!forum) return;
    if (!currentUser) {
      setSubmitError('글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    setSubmitError(null);
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
        })
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

        // 업로드된 이미지가 있으면 post_images 테이블에 저장
        if (uploadedImages.length > 0) {
          const imageInserts = uploadedImages.map((img, index) => ({
            post_id: postId,
            url: img.url,
            thumbnail_url: img.thumbnailUrl || null,
            width: img.width,
            height: img.height,
            display_order: index,
          }));
          await supabase.from('post_images').insert(imageInserts);
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
        })
        .eq('isbn', forum.isbn);

      // 태그 통계 업데이트
      if (tags && tags.length > 0) {
        await TagService.addTagsToPost(postId, tags);
      }

      // 사용자 통계 업데이트
      await UserService.incrementStat(currentUser.uid, 'post_count');

      // 로컬 state에 새 글 즉시 추가 (Realtime 지연 대비)
      const { data: newPostFull } = await supabase
        .from('posts')
        .select(`
          id, title, content, author_id, forum_isbn,
          created_at, updated_at, comment_count, like_count, view_count
        `)
        .eq('id', postId)
        .single();

      if (newPostFull) {
        const enriched = await enrichPostsData([newPostFull]);
        if (enriched.length > 0) {
          setPosts(prev => {
            const exists = prev.some(p => p.id === enriched[0].id);
            if (exists) return prev;
            return [enriched[0], ...prev];
          });
        }
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error('게시물 작성 실패:', error);
      setSubmitError('게시물 작성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleUserClick = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setShowUserMenu(true);
  }, []);

  const handleShowProfile = useCallback(() => {
    setShowUserMenu(false);
    setShowUserProfile(true);
  }, []);

  const handleCloseUserMenu = useCallback(() => {
    setShowUserMenu(false);
    setSelectedUser(null);
  }, []);

  const handleCloseUserProfile = useCallback(() => {
    setShowUserProfile(false);
    setSelectedUser(null);
  }, []);

  const handleSendMessage = useCallback((userId: string) => {
    navigate(`/messages/${userId}`);
  }, [navigate]);

  const handleBackToList = useCallback(() => {
    setSelectedPost(null);
  }, []);

  // 딥링크: forum 데이터 로딩 중
  if (!forum && forumLoading) {
    return <ForumViewSkeleton />;
  }

  // 딥링크: forum 데이터 로드 실패
  if (!forum) {
    return (
      <div className="text-center p-8">
        <p className="text-foreground">{forumError || '해당 살롱을 찾을 수 없습니다.'}</p>
      </div>
    );
  }

  // 포스트 직접 진입 로딩 중 (살롱 화면 깜빡임 방지)
  if (initialPostId && initialPostLoading) {
    return <ForumViewSkeleton />;
  }

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        isbn={forum.isbn}
        onBack={handleBackToList}
        onUserClick={handleUserClick}
        onSendMessage={handleSendMessage}
        onShowToast={showToast}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="p-3 sm:p-6 lg:p-8">
        <BookInfo book={forum.book} forum={forum} isbn={forum.isbn} />
      </div>

      <div className="px-3 sm:px-6 lg:px-8 pb-20">
        <PostList
          posts={posts}
          onPostClick={handlePostClick}
          onUserClick={handleUserClick}
        />
        {hasMorePosts && posts.length > 0 && (
          <div className="text-center pt-4">
            <button
              onClick={handleLoadMorePosts}
              disabled={isLoadingMorePosts}
              className="px-6 py-2.5 bg-surface border border-border text-surface-foreground rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="게시물 더 보기"
            >
              {isLoadingMorePosts ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  불러오는 중...
                </span>
              ) : (
                '더 보기'
              )}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (!currentUser) {
            openLogin();
          } else {
            setIsModalOpen(true);
          }
        }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-cta text-cta-foreground rounded-full p-3 sm:p-4 shadow-lg hover:bg-cta-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-ring z-30 transition-colors duration-200"
        aria-label={!currentUser ? "로그인이 필요합니다" : "새로운 글 작성"}
      >
        <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {submitError && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-30 bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2 shadow-md">
          <p className="text-destructive text-sm">{submitError}</p>
        </div>
      )}

      {isModalOpen && (
        <CreatePostModal
          onClose={() => { if (!isSubmitting) { setIsModalOpen(false); setSubmitError(null); } }}
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
