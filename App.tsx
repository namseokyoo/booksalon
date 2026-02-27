
import React, { useState, Suspense } from 'react';
import Header from './components/Header';
import type { Forum, Book } from './types';
import { useSupabaseAuth } from './contexts/SupabaseAuthContext';

// React.lazy: 페이지 레벨 코드 스플리팅
const ForumList = React.lazy(() => import('./components/ForumList'));
const ForumView = React.lazy(() => import('./components/ForumView'));
const ProfilePage = React.lazy(() => import('./components/ProfilePage'));
const ActivityFeed = React.lazy(() => import('./components/ActivityFeed'));
const UserSearch = React.lazy(() => import('./components/UserSearch'));
const MessagingPage = React.lazy(() => import('./components/MessagingPage'));
const NotificationComponent = React.lazy(() => import('./components/NotificationComponent'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

// React.lazy: 모달 코드 스플리팅
const LoginModal = React.lazy(() => import('./components/LoginModal'));
const SignUpModal = React.lazy(() => import('./components/SignUpModal'));
const DeleteAccountModal = React.lazy(() => import('./components/DeleteAccountModal'));
const SearchModal = React.lazy(() => import('./components/SearchModal'));

const App = () => {
  const [currentView, setCurrentView] = useState<'list' | 'forum' | 'profile' | 'activity' | 'search' | 'messaging' | 'notifications' | 'admin'>('list');
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [messagingTargetUserId, setMessagingTargetUserId] = useState<string | null>(null);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { loading, currentUser } = useSupabaseAuth();

  const handleSelectForum = (forum: Forum) => {
    setSelectedForum(forum);
    setCurrentView('forum');
  };

  const handleHomeClick = () => {
    setCurrentView('list');
    setSelectedForum(null);
  };

  const handleShowProfile = () => {
    setCurrentView('profile');
  };

  const handleShowActivity = () => {
    setCurrentView('activity');
    setSelectedForum(null);
  };

  const handleShowSearch = () => {
    setSearchModalOpen(true);
  };

  const handleCreateForumFromSearch = async (book: Book) => {
    const { supabase } = await import('./lib/supabase');
    const { FilterService, UserService } = await import('./lib/services');

    const category = FilterService.categorizeBook(book);
    const tags = FilterService.generateTags(book);

    // 1. books 테이블에 도서 정보 upsert
    const { error: bookError } = await supabase
      .from('books')
      .upsert({
        isbn: book.isbn,
        title: book.title,
        authors: book.authors || [],
        publisher: book.publisher || null,
        thumbnail: book.thumbnail || null,
        contents: book.contents || null,
      }, { onConflict: 'isbn' });

    if (bookError) {
      console.error('책 정보 저장 실패:', bookError);
      return;
    }

    // 2. forums 테이블에 포럼 생성
    const { error: forumError } = await supabase
      .from('forums')
      .upsert({
        isbn: book.isbn,
        category: category,
        popularity: 0,
        post_count: 0,
        average_rating: 0,
        total_ratings: 0,
        last_activity_at: new Date().toISOString(),
      }, { onConflict: 'isbn' });

    if (forumError) {
      console.error('포럼 생성 실패:', forumError);
      return;
    }

    // 3. forum_tags 테이블에 태그 저장
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        forum_isbn: book.isbn,
        tag_name: tag,
      }));
      await supabase.from('forum_tags').upsert(tagInserts , { onConflict: 'forum_isbn,tag_name' });
    }

    // 4. 사용자 통계 업데이트
    if (currentUser) {
      try {
        await UserService.incrementStat(currentUser.id, 'forum_count');
      } catch (e) {
        console.warn('사용자 통계 업데이트 실패:', e);
      }
    }

    // 5. 프론트엔드용 Forum 객체 생성
    const newForum: Forum = {
      isbn: book.isbn,
      book,
      postCount: 0,
      category,
      tags,
      lastActivityAt: new Date(),
      popularity: 0,
    };

    setSelectedForum(newForum);
    setCurrentView('forum');
  };

  const handleShowMessaging = () => {
    setMessagingTargetUserId(null); // 일반 메시징 페이지로 이동
    setCurrentView('messaging');
    setSelectedForum(null);
  };

  const handleShowNotifications = () => {
    setCurrentView('notifications');
    setSelectedForum(null);
  };

  const handleShowAdmin = () => {
    setCurrentView('admin');
    setSelectedForum(null);
  };

  const handleBackToList = () => {
    setSelectedForum(null);
    setCurrentView('list');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  // OIDC로 전환: 별도 콜백 페이지 불필요

  return (
    <div className="min-h-screen bg-background">
      <Header
        onLoginClick={() => setLoginModalOpen(true)}
        onSignUpClick={() => setSignupModalOpen(true)}
        onDeleteClick={() => setDeleteModalOpen(true)}
        onProfileClick={handleShowProfile}
        onActivityClick={handleShowActivity}
        onSearchClick={handleShowSearch}
        onMessagingClick={handleShowMessaging}
        onNotificationsClick={handleShowNotifications}
        onAdminClick={handleShowAdmin}
        onHomeClick={handleHomeClick}
      />
      <main aria-label="메인 콘텐츠">
        <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
          {currentView === 'list' ? (
            <ForumList onSelectForum={handleSelectForum} onLoginClick={() => setLoginModalOpen(true)} />
          ) : currentView === 'profile' ? (
            <ProfilePage onBack={handleBackToList} />
          ) : currentView === 'activity' ? (
            <ActivityFeed onBack={handleBackToList} />
          ) : currentView === 'search' ? (
            <UserSearch onBack={handleBackToList} />
          ) : currentView === 'messaging' ? (
            <MessagingPage targetUserId={messagingTargetUserId || undefined} />
          ) : currentView === 'notifications' ? (
            <NotificationComponent />
          ) : currentView === 'admin' ? (
            <AdminDashboard />
          ) : selectedForum ? (
            <ForumView
              forum={selectedForum}
              onBack={handleBackToList}
              onNavigateToMessaging={(userId) => {
                setMessagingTargetUserId(userId);
                setCurrentView('messaging');
              }}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-foreground">오류: 해당 살롱을 찾을 수 없습니다.</p>
              <button onClick={handleBackToList} className="mt-4 px-4 py-2 bg-cta text-cta-foreground rounded-lg hover:bg-cta-700 transition-colors">
                목록으로 돌아가기
              </button>
            </div>
          )}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        {loginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} />}
        {signupModalOpen && <SignUpModal onClose={() => setSignupModalOpen(false)} />}
        {deleteModalOpen && <DeleteAccountModal onClose={() => setDeleteModalOpen(false)} />}
        {searchModalOpen && (
          <SearchModal
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            onSelectForum={handleSelectForum}
            onCreateForum={handleCreateForumFromSearch}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;