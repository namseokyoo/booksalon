
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import type { Forum, Book } from '../types';
import {
  searchBookByIsbn,
  searchBookByTitle,
  UserService,
  BookmarkService,
} from '../lib/services';
import CreateForumModal from './CreateForumModal';
import { SearchIcon, BookOpenIcon } from './icons';
import { supabase, supabaseAnon } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../contexts/ModalContext';
import { BookmarkIcon } from './icons/BookmarkIcon';
import StarRating from './StarRating';
import ForumListSkeleton from './ForumListSkeleton';
import ForumListError from './ForumListError';
import { formatRelativeDate } from '../lib/dateUtils';

// 베스트 게시물 타입
interface BestPost {
  id: string;
  title: string;
  author_id: string;
  author_name: string;
  forum_isbn: string;
  book_title: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  score: number;
  created_at: string;
}

const FORUMS_PAGE_SIZE = 20;

const ForumList: React.FC = () => {
  const navigate = useNavigate();
  const { openLogin } = useModals();
  const [forums, setForums] = useState<Forum[]>([]);
  const [bestPosts, setBestPosts] = useState<BestPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Book | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [existingForums, setExistingForums] = useState<Forum[]>([]);
  const [bookmarkedForums, setBookmarkedForums] = useState<Forum[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<Set<string>>(new Set());
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  const [filteredForums, setFilteredForums] = useState<Forum[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchIsEnd, setSearchIsEnd] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState('');
  const [forumsPage, setForumsPage] = useState(0);
  const [hasMoreForums, setHasMoreForums] = useState(true);
  const [isLoadingMoreForums, setIsLoadingMoreForums] = useState(false);
  const [visibleForumsCount, setVisibleForumsCount] = useState(5);
  const [visibleBestPostsCount, setVisibleBestPostsCount] = useState(5);
  const { currentUser, userProfile, loading: authLoading } = useAuth();

  const enrichForumsData = (
    forumsData: Array<{
      isbn: string;
      post_count: number;
      popularity: number;
      average_rating: number;
      total_ratings: number;
      last_activity_at: string | null;
      created_at: string;
      books: {
        isbn: string;
        title: string;
        authors: string[];
        publisher: string;
        thumbnail: string;
        contents: string;
      } | null;
    }>
  ): Forum[] => {
    return forumsData.map((forum) => ({
      isbn: forum.isbn,
      book: forum.books ? {
        isbn: forum.books.isbn,
        title: forum.books.title,
        authors: forum.books.authors || [],
        publisher: forum.books.publisher || '',
        thumbnail: forum.books.thumbnail || '',
        contents: forum.books.contents || '',
      } : {
        isbn: forum.isbn,
        title: '',
        authors: [],
        publisher: '',
        thumbnail: '',
        contents: '',
      },
      postCount: forum.post_count,
      popularity: forum.popularity,
      averageRating: forum.average_rating,
      totalRatings: forum.total_ratings,
      lastActivityAt: forum.last_activity_at ? new Date(forum.last_activity_at) : undefined,
      createdAt: forum.created_at ? new Date(forum.created_at) : undefined,
    }));
  };

  // 베스트 게시물 로딩
  useEffect(() => {
    const loadBestPosts = async () => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error: postsError } = await supabaseAnon
          .from('posts')
          .select('id, title, author_id, forum_isbn, like_count, comment_count, view_count, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('like_count', { ascending: false })
          .limit(20);

        if (postsError || !data || data.length === 0) {
          setBestPosts([]);
          return;
        }

        // 인기도 점수 계산 후 상위 5개 선택
        const scored = data
          .map(p => ({
            ...p,
            like_count: p.like_count || 0,
            comment_count: p.comment_count || 0,
            view_count: p.view_count || 0,
            score: (p.like_count || 0) * 2 + (p.comment_count || 0) * 1.5 + (p.view_count || 0) * 0.1,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        // 작성자 이름 조회
        const authorIds = [...new Set(scored.map(p => p.author_id))];
        const { data: usersData } = await supabaseAnon
          .from('users')
          .select('id, display_name, nickname')
          .in('id', authorIds);

        const userMap = new Map<string, string>();
        usersData?.forEach((u: { id: string; display_name: string | null; nickname: string | null }) => {
          userMap.set(u.id, u.nickname || u.display_name || '익명');
        });

        // 책 제목 조회
        const forumIsbns = [...new Set(scored.map(p => p.forum_isbn))];
        const { data: booksData } = await supabaseAnon
          .from('books')
          .select('isbn, title')
          .in('isbn', forumIsbns);

        const bookMap = new Map<string, string>();
        booksData?.forEach((b: { isbn: string; title: string }) => {
          bookMap.set(b.isbn, b.title);
        });

        const bestPostsResult: BestPost[] = scored.map(p => ({
          id: p.id,
          title: p.title,
          author_id: p.author_id,
          author_name: userMap.get(p.author_id) || '익명',
          forum_isbn: p.forum_isbn,
          book_title: bookMap.get(p.forum_isbn) || '',
          like_count: p.like_count,
          comment_count: p.comment_count,
          view_count: p.view_count,
          score: p.score,
          created_at: p.created_at,
        }));

        setBestPosts(bestPostsResult);
      } catch (err) {
        console.error('베스트 게시물 로드 실패:', err);
        setBestPosts([]);
      }
    };

    loadBestPosts();
  }, []);

  // 베스트 게시물 클릭 시 해당 포럼으로 이동 (가능하면 해당 포스트 바로 열기)
  const handleBestPostClick = (post: BestPost) => {
    const existingForum = forums.find(f => f.isbn === post.forum_isbn);
    const forum = existingForum ?? {
      isbn: post.forum_isbn,
      book: {
        isbn: post.forum_isbn,
        title: post.book_title,
        authors: [],
        publisher: '',
        thumbnail: '',
        contents: '',
      },
      postCount: 0,
    };
    navigate(`/forum/${forum.isbn}?post=${post.id}`, { state: { forum } });
  };

  const handleRetryInitialLoad = useCallback(() => {
    setInitialLoadError(null);
    setIsLoadingInitial(true);
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (authLoading) return; // Auth 초기화 중이면 대기

    let isCancelled = false;

    // 초기 데이터 로드 (첫 페이지)
    const loadForums = async (attempt = 0) => {
      const from = 0;
      const to = FORUMS_PAGE_SIZE - 1;

      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      try {
        const forumsPromise = supabaseAnon
          .from('forums')
          .select(`
            isbn,
            post_count,
            popularity,
            average_rating,
            total_ratings,
            last_activity_at,
            created_at,
            books (
              isbn,
              title,
              authors,
              publisher,
              thumbnail,
              contents
            )
          `)
          .order('created_at', { ascending: false })
          .range(from, to);

        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 20000);
        });

        const { data: forumsData, error: queryError } = await Promise.race([
          forumsPromise,
          timeoutPromise,
        ]);

        clearTimeout(timeoutId);

        if (isCancelled) return;

        if (queryError) {
          throw new Error(queryError.message || '포럼 데이터 로드 실패');
        }

        const enrichedForums = enrichForumsData(forumsData || []);

        if (isCancelled) return;

        setForums(enrichedForums);
        setForumsPage(0);
        setHasMoreForums((forumsData || []).length >= FORUMS_PAGE_SIZE);
        setIsLoadingInitial(false);

      } catch (err) {
        clearTimeout(timeoutId);
        if (isCancelled) return;

        // 자동 최대 2회 재시도 (재시도 간 1초 대기)
        if (attempt < 2) {
          console.warn(`포럼 로드 실패, 자동 재시도 중... (${attempt + 1}/2)`, err);
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (!isCancelled) loadForums(attempt + 1);
          return;
        }

        // 자동 재시도도 실패
        console.error('포럼 로드 최종 실패:', err);
        const message = err instanceof Error && err.message === 'TIMEOUT'
          ? '서버 응답이 너무 오래 걸립니다. 네트워크를 확인해주세요.'
          : '포럼 목록을 불러오는 중 오류가 발생했습니다.';
        setInitialLoadError(message);
        setIsLoadingInitial(false);
      }
    };

    loadForums();

    // cleanup
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount, authLoading]);

  // 브라우저 탭 복귀 시 데이터 재로드
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible') {
        const hiddenDuration = hiddenAt ? Date.now() - hiddenAt : 0;
        // 데이터가 없고 로딩 중이 아닌 경우 (에러/빈 상태) → 항상 재시도
        // 30초 이상 백그라운드에 있었고 로딩 중이었으면 → 리셋 후 재시도
        if (forums.length === 0 && !isLoadingInitial) {
          setRetryCount(prev => prev + 1);
        } else if (isLoadingInitial && hiddenDuration > 30000) {
          setIsLoadingInitial(true);
          setRetryCount(prev => prev + 1);
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [forums.length, isLoadingInitial]);

  useEffect(() => {
    if (authLoading) return; // Auth 초기화 중이면 대기

    // Supabase 실시간 구독 — 새 포럼 추가 시 첫 페이지만 리로드
    const subscription = supabase
      .channel('forums_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'forums' }, async (payload) => {
        // 새 포럼이 추가되면 해당 포럼 데이터를 조회하여 목록 상단에 추가
        const newIsbn = (payload.new as { isbn: string }).isbn;
        const { data: newForumData } = await supabase
          .from('forums')
          .select(`
            isbn,
            post_count,
            popularity,
            average_rating,
            total_ratings,
            last_activity_at,
            created_at,
            books (
              isbn,
              title,
              authors,
              publisher,
              thumbnail,
              contents
            )
          `)
          .eq('isbn', newIsbn)
          .single();

        if (newForumData) {
          const enriched = enrichForumsData([newForumData]);
          if (enriched.length > 0) {
            setForums(prev => {
              // 중복 방지
              const exists = prev.some(f => f.isbn === enriched[0].isbn);
              if (exists) return prev;
              return [enriched[0], ...prev];
            });
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'forums' }, async () => {
        // UPDATE 시 현재 로드된 범위만 리로드
        const currentTo = ((forumsPage + 1) * FORUMS_PAGE_SIZE) - 1;
        const { data: forumsData } = await supabaseAnon
          .from('forums')
          .select(`
            isbn,
            post_count,
            popularity,
            average_rating,
            total_ratings,
            last_activity_at,
            created_at,
            books (
              isbn,
              title,
              authors,
              publisher,
              thumbnail,
              contents
            )
          `)
          .order('created_at', { ascending: false })
          .range(0, currentTo);

        if (forumsData) {
          const enrichedForums = enrichForumsData(forumsData);
          setForums(enrichedForums);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'forums' }, async (payload) => {
        const deletedIsbn = (payload.old as { isbn: string }).isbn;
        setForums(prev => prev.filter(f => f.isbn !== deletedIsbn));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [authLoading, forumsPage]);

  const handleLoadMoreForums = async () => {
    if (!hasMoreForums || isLoadingMoreForums) return;

    setIsLoadingMoreForums(true);
    try {
      const nextPage = forumsPage + 1;
      const from = nextPage * FORUMS_PAGE_SIZE;
      const to = from + FORUMS_PAGE_SIZE - 1;

      const { data: forumsData, error } = await supabaseAnon
        .from('forums')
        .select(`
          isbn,
          post_count,
          popularity,
          average_rating,
          total_ratings,
          last_activity_at,
          created_at,
          books (
            isbn,
            title,
            authors,
            publisher,
            thumbnail,
            contents
          )
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('추가 포럼 로드 실패:', error);
        return;
      }

      if ((forumsData || []).length < FORUMS_PAGE_SIZE) {
        setHasMoreForums(false);
      }

      const enrichedForums = enrichForumsData(forumsData || []);

      setForums(prev => {
        // 중복 제거
        const existingIsbns = new Set(prev.map(f => f.isbn));
        const newForums = enrichedForums.filter(f => !existingIsbns.has(f.isbn));
        return [...prev, ...newForums];
      });
      setForumsPage(nextPage);
    } catch (error) {
      console.error('추가 포럼 로드 실패:', error);
    } finally {
      setIsLoadingMoreForums(false);
    }
  };

  // 필터링 적용
  useEffect(() => {
    setFilteredForums(forums);
  }, [forums]);

  // 북마크 데이터 로드
  useEffect(() => {
    if (currentUser && userProfile?.id) {
      loadBookmarks();
    } else if (!currentUser) {
      setBookmarkedForums([]);
      setBookmarks(new Set());
    }
  }, [currentUser, userProfile?.id]);

  const loadBookmarks = async () => {
    if (!currentUser || !userProfile?.id) return;

    try {
      const bookmarkedForumsData = await BookmarkService.getBookmarkedForums(userProfile.id);
      setBookmarkedForums(bookmarkedForumsData);

      const bookmarkSet = new Set(bookmarkedForumsData.map(forum => forum.isbn));
      setBookmarks(bookmarkSet);
    } catch (error) {
      console.error('북마크 로드 실패:', error);
    }
  };

  const handleToggleBookmark = useCallback(async (isbn: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser || !userProfile?.id) {
      openLogin();
      return;
    }

    // 중복 클릭 방지
    if (bookmarkLoading.has(isbn)) return;

    setBookmarkLoading(prev => new Set([...prev, isbn]));
    setBookmarkError(null);

    // 낙관적 업데이트: 즉시 UI 변경
    const wasBookmarked = bookmarks.has(isbn);
    if (wasBookmarked) {
      setBookmarks(prev => {
        const newSet = new Set(prev);
        newSet.delete(isbn);
        return newSet;
      });
      setBookmarkedForums(prev => prev.filter(f => f.isbn !== isbn));
    } else {
      setBookmarks(prev => new Set([...prev, isbn]));
      const forum = forums.find(f => f.isbn === isbn);
      if (forum) {
        setBookmarkedForums(prev => [...prev, forum]);
      }
    }

    try {
      await BookmarkService.toggleBookmark(userProfile.id, isbn);
    } catch (error) {
      // 실패 시 롤백
      console.error('북마크 토글 실패:', error);
      setBookmarkError('북마크 처리 중 오류가 발생했습니다.');
      if (wasBookmarked) {
        setBookmarks(prev => new Set([...prev, isbn]));
        const forum = forums.find(f => f.isbn === isbn);
        if (forum) {
          setBookmarkedForums(prev => [...prev, forum]);
        }
      } else {
        setBookmarks(prev => {
          const newSet = new Set(prev);
          newSet.delete(isbn);
          return newSet;
        });
        setBookmarkedForums(prev => prev.filter(f => f.isbn !== isbn));
      }
    } finally {
      setBookmarkLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(isbn);
        return newSet;
      });
    }
  }, [currentUser, forums, openLogin, bookmarks, bookmarkLoading]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const trimmedSearchTerm = searchTerm.trim();
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setSearchResults([]);
    setExistingForums([]);
    setSearchPage(1);
    setSearchIsEnd(true);
    setLastSearchTerm(trimmedSearchTerm);

    const matchingForums = forums.filter(forum =>
      forum.book.title.toLowerCase().includes(trimmedSearchTerm.toLowerCase()) ||
      forum.book.authors.some(author => author.toLowerCase().includes(trimmedSearchTerm.toLowerCase()))
    );

    if (matchingForums.length > 0) {
      setExistingForums(matchingForums);
    }

    const isIsbn = /^\d{10}$|^\d{13}$/.test(trimmedSearchTerm);

    if (isIsbn) {
      const book = await searchBookByIsbn(trimmedSearchTerm);
      if (book) {
        setSearchResult(book);
      } else {
        setError('해당 ISBN을 가진 책을 찾을 수 없습니다. 다른 ISBN을 시도해보세요.');
      }
    } else {
      const result = await searchBookByTitle(trimmedSearchTerm, 1, 10);
      if (result.books.length > 0) {
        setSearchResults(result.books);
        setSearchIsEnd(result.isEnd);
        setSearchPage(1);
      } else if (matchingForums.length === 0) {
        setError('해당 제목의 책을 찾을 수 없습니다. 다른 제목을 시도해보세요.');
      }
    }
    setIsLoading(false);
  };

  const handleLoadMore = async () => {
    if (searchIsEnd || isLoadingMore || !lastSearchTerm) return;

    setIsLoadingMore(true);
    try {
      const nextPage = searchPage + 1;
      const result = await searchBookByTitle(lastSearchTerm, nextPage, 10);
      if (result.books.length > 0) {
        setSearchResults(prev => [...prev, ...result.books]);
        setSearchPage(nextPage);
        setSearchIsEnd(result.isEnd);
      } else {
        setSearchIsEnd(true);
      }
    } catch (error) {
      console.error('추가 검색 실패:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreateForum = async (book: Book) => {
    // 책 정보 먼저 upsert
    const { error: bookError } = await supabase
      .from('books')
      .upsert({
        isbn: book.isbn,
        title: book.title,
        authors: book.authors,
        publisher: book.publisher,
        thumbnail: book.thumbnail,
        contents: book.contents || '',
      }, { onConflict: 'isbn' });

    if (bookError) {
      console.error('책 정보 저장 실패:', bookError);
      throw bookError;
    }

    // 포럼 생성
    const { error: forumError } = await supabase
      .from('forums')
      .insert({
        isbn: book.isbn,
        post_count: 0,
        popularity: 0,
        last_activity_at: new Date().toISOString(),
      });

    if (forumError) {
      console.error('포럼 생성 실패:', forumError);
      throw forumError;
    }

    // 사용자 통계 업데이트
    if (currentUser) {
      await UserService.incrementStat(currentUser.uid, 'forum_count');
    }

    const newForum: Forum = {
      isbn: book.isbn,
      book,
      postCount: 0,
      lastActivityAt: new Date(),
      popularity: 0,
    };

    setSearchResult(null);
    navigate(`/forum/${newForum.isbn}`, { state: { forum: newForum } });
  };

  if (isLoadingInitial) {
    return <ForumListSkeleton />;
  }
  if (initialLoadError) {
    return <ForumListError errorMessage={initialLoadError} onRetry={handleRetryInitialLoad} retryCount={retryCount} maxRetries={3} />;
  }

  return (
    <div data-testid="forum-list-loaded" className="max-w-4xl mx-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-8 safe-area-pad">
      {/* 비로그인: 통합 히어로+검색 */}
      {!currentUser ? (
        <section className="mb-6 sm:mb-8 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl px-5 py-6 sm:px-10 sm:py-10 text-center">
          <BookOpenIcon className="h-7 w-7 sm:h-9 sm:w-9 text-primary mx-auto mb-3 opacity-70" />
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-primary leading-snug">
            당신의 마침표가 누군가의 물음표와 만나는 곳
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            책을 읽고, 생각을 나누고, 다음 책을 발견하세요
          </p>
          {!currentUser && (
            <div className="mt-4">
              <button
                type="button"
                onClick={openLogin}
                className="inline-flex items-center px-6 py-2.5 rounded-full bg-cta text-cta-foreground text-sm font-medium hover:bg-cta-700 transition-colors duration-200 shadow-sm"
              >
                지금 살롱 입장하기
              </button>
            </div>
          )}
          {/* 읽은 책 검색 폼 */}
          <div className="mt-5 max-w-lg mx-auto">
            <form onSubmit={handleSearch}>
              <div className="flex rounded-full shadow-sm bg-surface border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="text"
                  name="isbn-search-hero"
                  id="isbn-search-hero"
                  className="focus:outline-none block w-full flex-1 min-w-0 border-0 bg-transparent rounded-none text-foreground pl-3 sm:pl-5 text-sm sm:text-sm py-2.5"
                  placeholder="읽은 책을 검색해보세요"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex items-center flex-shrink-0 gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 text-sm font-medium rounded-r-full text-cta-foreground bg-cta hover:bg-cta-700 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200"
                  disabled={isLoading}
                  aria-label="책 검색"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cta-foreground"></div>
                  ) : (
                    <>
                      <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      <span className="hidden sm:inline">검색</span>
                    </>
                  )}
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            </form>
          </div>
        </section>
      ) : (
        /* 로그인 사용자: 검색바 + 통합 검색 진입 */
        <div className="mb-4 sm:mb-6">
          <form onSubmit={handleSearch}>
            <div className="flex rounded-full shadow-sm bg-surface border border-border overflow-hidden focus-within:ring-2 focus-within:ring-ring">
              <input
                type="text"
                name="isbn-search"
                id="isbn-search"
                className="focus:outline-none block w-full flex-1 min-w-0 border-0 bg-transparent rounded-none text-foreground pl-3 sm:pl-5 text-sm sm:text-sm py-2.5"
                placeholder="읽은 책을 검색해보세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center flex-shrink-0 gap-1 sm:gap-2 px-3 sm:px-5 py-2.5 text-sm font-medium rounded-r-full text-cta-foreground bg-cta hover:bg-cta-700 focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200"
                disabled={isLoading}
                aria-label="책 검색"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cta-foreground"></div>
                ) : (
                  <>
                    <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    <span className="hidden sm:inline">검색</span>
                  </>
                )}
              </button>
            </div>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </form>
        </div>
      )}


      {/* 인기 게시물 섹션 — 검색 중이 아닐 때만 표시 */}
      {bestPosts.length > 0 && !(searchResults.length > 0 || existingForums.length > 0) && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-semibold text-foreground">인기 게시물</h2>
            <button
              type="button"
              onClick={() => navigate('/best-posts')}
              className="text-sm text-primary hover:text-primary-700 font-medium"
            >
              더보기 →
            </button>
          </div>
          <div className="space-y-2">
            {bestPosts.slice(0, visibleBestPostsCount).map((post) => (
              <div
                key={post.id}
                onClick={() => handleBestPostClick(post)}
                className="bg-surface rounded-xl shadow-sm border border-border py-2.5 px-3 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all duration-200"
              >
                <h3 className="font-medium text-foreground text-sm truncate">{post.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {post.book_title} · {formatRelativeDate(post.created_at)}
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground mt-1.5">
                  <span aria-label={`좋아요 ${post.like_count}개`} className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" /> {post.like_count}</span>
                  <span aria-label={`댓글 ${post.comment_count}개`} className="flex items-center gap-0.5"><MessageCircle className="w-3.5 h-3.5" /> {post.comment_count}</span>
                </div>
              </div>
            ))}
          </div>
          {visibleBestPostsCount < bestPosts.length && (
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setVisibleBestPostsCount(prev => prev + 5)}
                className="px-5 py-2 text-sm text-primary hover:text-primary-700 font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors duration-200"
              >
                더보기
              </button>
            </div>
          )}
        </section>
      )}

      {/* 북마크한 살롱 표시 — 검색 중이 아닐 때만 표시 */}
      {bookmarkedForums.length > 0 && !(searchResults.length > 0 || existingForums.length > 0) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">북마크한 살롱</h2>
              <button
                type="button"
                onClick={() => navigate(`/profile/${userProfile?.id}?tab=bookmarks`)}
                className="text-sm text-primary hover:text-primary-700 cursor-pointer"
              >
                더보기 &gt;
              </button>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {bookmarkedForums.slice(0, 5).map((forum) => (
              <div
                key={forum.isbn}
                onClick={() => navigate(`/forum/${forum.isbn}`, { state: { forum } })}
                className="relative bg-surface border border-border/60 rounded-xl shadow-sm hover:shadow-lg hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-300 flex flex-row items-center gap-3 p-3 border-l-4 border-l-cta"
              >
                <div className="flex-shrink-0 w-12 overflow-hidden rounded-md bg-muted/30">
                  <img
                    src={forum.book.thumbnail}
                    alt={forum.book.title}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                    decoding="async"
                    width={48}
                    height={72}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start md:items-center gap-1.5 md:gap-2 flex-wrap md:flex-nowrap">
                    <h3 className="font-semibold text-sm text-foreground truncate min-w-0">{forum.book.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{forum.book.authors.join(', ')}</p>
                </div>
                <span className="flex-shrink-0 font-bold text-sm text-foreground" aria-label="게시물 수">
                  {forum.postCount ?? 0}
                </span>
                <button
                  onClick={(e) => handleToggleBookmark(forum.isbn, e)}
                  className="flex-shrink-0 p-2 rounded-full hover:bg-primary-50 transition-colors duration-200 active:scale-90"
                  title="북마크 해제"
                >
                  <BookmarkIcon
                    className="h-4 w-4 text-cta"
                    filled={true}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 돌아가기 버튼 */}
      {(searchResults.length > 0 || existingForums.length > 0) && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">&ldquo;{lastSearchTerm}&rdquo;</span> 검색 결과
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchResults([]);
              setExistingForums([]);
              setSearchTerm('');
              setLastSearchTerm('');
              setError(null);
            }}
            className="text-sm text-primary hover:text-primary-700 font-medium underline underline-offset-2"
          >
            전체 목록으로 돌아가기
          </button>
        </div>
      )}

      {/* 기존 살롱 검색 결과 표시 */}
      {existingForums.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-4">최근 개설된 살롱</h2>
          <div className="space-y-1.5">
            {existingForums
              .sort((a, b) => {
                // createdAt 기준으로 정렬 (최신순)
                const aTime = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
                const bTime = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
                return bTime.getTime() - aTime.getTime();
              })
              .slice(0, 5) // 최대 5개만 표시
              .map((forum) => (
                <div
                  key={forum.isbn}
                  onClick={() => navigate(`/forum/${forum.isbn}`, { state: { forum } })}
                  className="relative bg-surface border border-border/60 rounded-xl shadow-sm hover:shadow-lg hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-300 flex flex-row items-center gap-3 p-3"
                >
                  <div className="flex-shrink-0 w-12 overflow-hidden rounded-md bg-muted/30">
                    <img
                      src={forum.book.thumbnail}
                      alt={forum.book.title}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                      width={48}
                      height={72}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{forum.book.title}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{forum.book.authors.join(', ')}</p>
                    <p className="text-xs text-muted-foreground">{forum.book.publisher}</p>
                    {forum.averageRating && forum.averageRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={forum.averageRating} readonly size="sm" allowHalf />
                        <span className="text-xs text-rating font-semibold ml-1">{forum.averageRating.toFixed(1)}</span>
                        {forum.totalRatings && (
                          <span className="text-xs text-muted-foreground">({forum.totalRatings})</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="font-bold text-base text-foreground flex-shrink-0" aria-label="게시물 수">
                        {forum.postCount ?? 0}
                      </span>
                      {forum.memberCount && (
                        <span aria-label="참여자 수">
                          {forum.memberCount}명
                        </span>
                      )}
                      {forum.postCount === 0 && (
                        <span className="text-primary-600 font-medium">첫 토론을 시작해보세요</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggleBookmark(forum.isbn, e)}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-primary-50 transition-colors duration-200 active:scale-90"
                    title={bookmarks.has(forum.isbn) ? "북마크 해제" : "북마크 추가"}
                  >
                    <BookmarkIcon
                      className="h-4 w-4"
                      filled={bookmarks.has(forum.isbn)}
                    />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 새로운 도서 검색 결과 표시 */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-lg font-semibold text-foreground mb-4">새로운 도서 검색 결과</h2>
          <div className="space-y-2">
            {searchResults.map((book, index) => {
              const existingForum = forums.find(forum => forum.isbn === book.isbn);
              const hasExistingForum = !!existingForum;

              return (
                <div
                  key={`${book.isbn}-${index}`}
                  onClick={hasExistingForum ? () => navigate(`/forum/${existingForum!.isbn}`, { state: { forum: existingForum! } }) : () => setSearchResult(book)}
                  className="relative bg-surface border border-border/60 rounded-xl shadow-sm hover:shadow-lg hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-300 flex flex-row items-center gap-3 p-3"
                >
                  <div className="flex-shrink-0 w-12 overflow-hidden rounded-md bg-muted/30">
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                      width={48}
                      height={72}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{book.title}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{book.authors.join(', ')}</p>
                    <p className="text-xs text-muted-foreground">{book.publisher}</p>
                    {hasExistingForum && existingForum!.averageRating && existingForum!.averageRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={existingForum!.averageRating} readonly size="sm" allowHalf />
                        <span className="text-xs text-rating font-semibold ml-1">{existingForum!.averageRating.toFixed(1)}</span>
                        {existingForum!.totalRatings && (
                          <span className="text-xs text-muted-foreground">({existingForum!.totalRatings})</span>
                        )}
                      </div>
                    )}
                    <div className="mt-1">
                      {hasExistingForum ? (
                        <>
                          <p className="text-xs text-primary-600 font-medium">기존 살롱 참여</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="inline-flex items-center gap-1" aria-label="게시물 수">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {existingForum!.postCount ? `${existingForum!.postCount}` : '0'}
                            </span>
                            {existingForum!.memberCount && (
                              <span className="inline-flex items-center gap-1" aria-label="참여자 수">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {existingForum!.memberCount}
                              </span>
                            )}
                            {existingForum!.postCount === 0 && (
                              <span className="text-primary-600 font-medium">첫 토론을 시작해보세요</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-primary font-medium">살롱 만들기</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleToggleBookmark(book.isbn, e)}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-primary-50 transition-colors duration-200 active:scale-90"
                    title={bookmarks.has(book.isbn) ? "북마크 해제" : "북마크 추가"}
                  >
                    <BookmarkIcon
                      className="h-4 w-4"
                      filled={bookmarks.has(book.isbn)}
                    />
                  </button>
                </div>
              );
            })}
            {!searchIsEnd && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 bg-surface border border-border text-surface-foreground rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="검색 결과 더보기"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      불러오는 중...
                    </span>
                  ) : (
                    '더보기'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 최근 개설된 살롱 */}
      {!(searchResults.length > 0 || existingForums.length > 0) && (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-lg font-semibold text-foreground">최근 개설된 살롱</h2>
        </div>
        <div className="space-y-2">
          {filteredForums.length > 0 ? (
            <>
              {filteredForums.slice(0, visibleForumsCount).map(forum => (
                <div
                  key={forum.isbn}
                  onClick={() => navigate(`/forum/${forum.isbn}`, { state: { forum } })}
                  className="relative bg-surface border border-border/60 rounded-xl shadow-sm hover:shadow-lg hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-300 flex flex-row items-center gap-3 p-3"
                >
                  <div className="flex-shrink-0 w-12 overflow-hidden rounded-md bg-muted/30">
                    <img
                      src={forum.book.thumbnail}
                      alt={forum.book.title}
                      className="w-full h-auto object-contain"
                      loading="lazy"
                      decoding="async"
                      width={48}
                      height={72}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start md:items-center gap-1.5 md:gap-2 flex-wrap md:flex-nowrap">
                      <h3 className="font-semibold text-sm text-foreground truncate min-w-0">{forum.book.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{forum.book.authors.join(', ')}</p>
                  </div>
                  <span className="flex-shrink-0 font-bold text-sm text-foreground" aria-label="게시물 수">
                    {forum.postCount ?? 0}
                  </span>
                  <button
                    onClick={(e) => handleToggleBookmark(forum.isbn, e)}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-primary-50 transition-colors duration-200 active:scale-90"
                    title={bookmarks.has(forum.isbn) ? "북마크 해제" : "북마크 추가"}
                  >
                    <BookmarkIcon
                      className={`h-4 w-4 ${bookmarks.has(forum.isbn) ? 'text-cta' : 'text-muted-foreground'} hover:text-cta`}
                      filled={bookmarks.has(forum.isbn)}
                    />
                  </button>
                </div>
              ))}
              {(visibleForumsCount < filteredForums.length || hasMoreForums) && (
                <div className="text-center pt-4">
                  <button
                    onClick={async () => {
                      const nextCount = visibleForumsCount + 5;
                      if (nextCount > filteredForums.length && hasMoreForums) {
                        await handleLoadMoreForums();
                      }
                      setVisibleForumsCount(nextCount);
                    }}
                    disabled={isLoadingMoreForums}
                    className="px-6 py-2.5 bg-surface border border-border text-surface-foreground rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="살롱 더 보기"
                  >
                    {isLoadingMoreForums ? (
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
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-8 sm:py-10 px-4 border-2 border-dashed border-border rounded-xl bg-muted">
              <BookOpenIcon className="w-12 h-12 text-primary opacity-30 mb-3" />
              <p className="text-sm sm:text-base text-surface-foreground">
                아직 열린 살롱이 없네요.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                첫 번째 살롱을 열어보는 건 어떨까요.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {searchResult && (
        <CreateForumModal book={searchResult} onClose={() => setSearchResult(null)} onCreate={handleCreateForum} />
      )}

      {bookmarkError && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-30 bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2 shadow-md">
          <p className="text-destructive text-sm">{bookmarkError}</p>
        </div>
      )}
    </div>
  );
};

export default ForumList;
