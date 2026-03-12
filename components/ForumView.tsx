import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import type { Forum, Post, UserProfile } from '../types';
import BookInfo from './BookInfo';
import PostList from './PostList';
import PostDetail from './PostDetail';
import UserMenu from './UserMenu';
import UserProfilePreview from './UserProfilePreview';
import CreatePostModal from './CreatePostModal';
import ForumViewSkeleton from './ForumViewSkeleton';
import LoginRequiredPopup from './LoginRequiredPopup';
import type { ImagePreview } from './ImageUploader';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { useForumLoader } from '../hooks/useForumLoader';
import { UserService, TagService, PostImageService, PostService } from '../lib/services';

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
  const [showWriteLoginPopup, setShowWriteLoginPopup] = useState(false);
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

  useEffect(() => {
    if (!forum?.isbn) return;

    const loadPosts = async () => {
      const from = 0;
      const to = POSTS_PAGE_SIZE - 1;

      const postsData = await PostService.getPostsByForum(forum.isbn, { from, to });

      const enrichedPosts = await PostService.enrichPosts(postsData);
      setPosts(enrichedPosts);
      setPostsPage(0);
      setHasMorePosts(postsData.length >= POSTS_PAGE_SIZE);

      // initialPostId가 있으면 해당 포스트 자동 열기
      if (initialPostId) {
        const targetPost = enrichedPosts.find(p => p.id === initialPostId);
        if (targetPost) {
          setSelectedPost(targetPost);
          setInitialPostLoading(false);
        } else {
          // 첫 페이지에 없을 수 있으므로 단건 조회
          const singlePostData = await PostService.getPostById(initialPostId);
          if (singlePostData) {
            const enrichedSingle = await PostService.enrichPosts([singlePostData]);
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
        const newPostData = await PostService.getPostById(newPostId);

        if (newPostData) {
          const enriched = await PostService.enrichPosts([newPostData]);
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
        const postsData = await PostService.getPostsByForum(forum.isbn, { from: 0, to: currentTo });

        if (postsData.length > 0) {
          const enrichedPosts = await PostService.enrichPosts(postsData);
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

      const postsData = await PostService.getPostsByForum(forum.isbn, { from, to });

      if (postsData.length < POSTS_PAGE_SIZE) {
        setHasMorePosts(false);
      }

      const enrichedPosts = await PostService.enrichPosts(postsData);

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
      const userId = await UserService.getUserIdByAuthId(currentUser.uid);

      // 게시물 생성
      const { id: postId } = await PostService.createPost({
        title,
        content,
        authorId: userId,
        forumIsbn: forum.isbn,
      });

      // 이미지가 있으면 업로드
      if (imagePreviews && imagePreviews.length > 0) {
        for (let i = 0; i < imagePreviews.length; i++) {
          const imagePreview = imagePreviews[i];
          try {
            await PostImageService.uploadImage(
              currentUser.uid,
              forum.isbn,
              postId,
              imagePreview.file,
              i
            );
          } catch (error) {
            console.error(`이미지 ${i + 1} 업로드 실패:`, error);
          }
        }
      }

      // 포럼 마지막 활동 시각 업데이트 (post_count는 Trigger가 자동 처리)
      await PostService.updateForumActivity(forum.isbn);

      // 태그 통계 업데이트
      if (tags && tags.length > 0) {
        await TagService.addTagsToPost(postId, tags);
      }

      // 사용자 통계 업데이트
      await UserService.incrementStat(currentUser.uid, 'post_count');

      // 로컬 state에 새 글 즉시 추가 (Realtime 지연 대비)
      const newPostFull = await PostService.getPostById(postId);

      if (newPostFull) {
        const enriched = await PostService.enrichPosts([newPostFull]);
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
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('post', post.id);
    navigate(`?${newSearchParams.toString()}`, { replace: false });
  }, [navigate, searchParams]);

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
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete('post');
    const newSearch = newSearchParams.toString();
    navigate(newSearch ? `?${newSearch}` : '.', { replace: true });
  }, [navigate, searchParams]);

  // 브라우저 뒤로가기 시 ?post= 파라미터 사라지면 selectedPost 해제
  useEffect(() => {
    const postParam = searchParams.get('post');
    if (!postParam && selectedPost) {
      setSelectedPost(null);
    }
  }, [searchParams]);

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
        <BookInfo
          book={forum.book}
          forum={forum}
          isbn={forum.isbn}
          onLoginRequired={openLogin}
          onWriteClick={() => {
            if (!currentUser) {
              setShowWriteLoginPopup(true);
            } else {
              setIsModalOpen(true);
            }
          }}
        />
      </div>

      <div className="px-3 sm:px-6 lg:px-8 pb-6">
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
                  <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
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

      <LoginRequiredPopup
        message="글을 쓰려면 로그인이 필요합니다."
        isOpen={showWriteLoginPopup}
        onClose={() => setShowWriteLoginPopup(false)}
        onLogin={openLogin}
      />
    </div>
  );
};

export default ForumView;
