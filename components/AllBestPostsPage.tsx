
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabaseAnon } from '../lib/supabase';
import { ArrowLeftIcon } from './icons';
import { Heart, MessageCircle } from 'lucide-react';
import { FilterService } from '../lib/services';

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

type SortType = 'popular' | 'recent' | 'likes' | 'comments';

const sortOptions: { value: SortType; label: string }[] = [
  { value: 'popular',  label: '인기순' },
  { value: 'recent',   label: '최신순' },
  { value: 'likes',    label: '좋아요순' },
  { value: 'comments', label: '댓글많은순' },
];

interface AllBestPostsPageProps {
  onBack: () => void;
  onSelectForumWithPost: (forumIsbn: string, postId: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

const PAGE_SIZE = 20;

const AllBestPostsPage: React.FC<AllBestPostsPageProps> = ({ onBack, onSelectForumWithPost }) => {
  const [posts, setPosts] = useState<BestPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (pageIndex: number, currentSortBy: SortType, currentCategory: string) => {
    if (pageIndex === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabaseAnon
        .from('posts')
        .select('id, title, author_id, forum_isbn, like_count, comment_count, view_count, created_at')
        .range(from, to);

      if (currentSortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (currentSortBy === 'comments') {
        query = query.order('comment_count', { ascending: false });
      } else {
        // popular, likes 모두 like_count 기준
        query = query.order('like_count', { ascending: false });
      }

      // 카테고리 필터: forum_isbn 기준으로 forums.category JOIN하여 필터링
      if (currentCategory !== '전체') {
        const { data: forumsData } = await supabaseAnon
          .from('forums')
          .select('isbn')
          .eq('category', currentCategory);
        const filteredIsbns = forumsData?.map((f: { isbn: string }) => f.isbn) ?? [];
        if (filteredIsbns.length === 0) {
          setPosts(prev => pageIndex === 0 ? [] : prev);
          setHasMore(false);
          if (pageIndex === 0) setIsLoading(false); else setIsLoadingMore(false);
          return;
        }
        query = query.in('forum_isbn', filteredIsbns);
      }

      const { data, error: postsError } = await query;

      if (postsError || !data) {
        if (pageIndex === 0) setError('인기 게시물을 불러오지 못했습니다.');
        return;
      }

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (data.length === 0) {
        return;
      }

      const normalized = data.map(p => ({
        ...p,
        like_count: p.like_count || 0,
        comment_count: p.comment_count || 0,
        view_count: p.view_count || 0,
      }));

      const authorIds = [...new Set(normalized.map(p => p.author_id))];
      const { data: usersData } = await supabaseAnon
        .from('users')
        .select('id, display_name, nickname')
        .in('id', authorIds);

      const userMap = new Map<string, string>();
      usersData?.forEach((u: { id: string; display_name: string | null; nickname: string | null }) => {
        userMap.set(u.id, u.nickname || u.display_name || '익명');
      });

      const forumIsbns = [...new Set(normalized.map(p => p.forum_isbn))];
      const { data: booksData } = await supabaseAnon
        .from('books')
        .select('isbn, title')
        .in('isbn', forumIsbns);

      const bookMap = new Map<string, string>();
      booksData?.forEach((b: { isbn: string; title: string }) => {
        bookMap.set(b.isbn, b.title);
      });

      const result: BestPost[] = normalized.map(p => ({
        id: p.id,
        title: p.title,
        author_id: p.author_id,
        author_name: userMap.get(p.author_id) || '익명',
        forum_isbn: p.forum_isbn,
        book_title: bookMap.get(p.forum_isbn) || '',
        like_count: p.like_count,
        comment_count: p.comment_count,
        view_count: p.view_count,
        score: p.like_count * 2 + p.comment_count * 1.5 + p.view_count * 0.1,
        created_at: p.created_at,
      }));

      setPosts(prev => pageIndex === 0 ? result : [...prev, ...result]);
    } catch (err) {
      console.error('인기 게시물 전체 로드 실패:', err);
      if (pageIndex === 0) setError('인기 게시물을 불러오지 못했습니다.');
    } finally {
      if (pageIndex === 0) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []);

  // sortBy 또는 selectedCategory 변경 시 리셋
  useEffect(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setError(null);
  }, [sortBy, selectedCategory]);

  // 페이지 변경 시 fetch
  useEffect(() => {
    loadPage(page, sortBy, selectedCategory);
  }, [page, sortBy, selectedCategory, loadPage]);

  // IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        setPage(prev => prev + 1);
      }
    }, { threshold: 0.5 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="md:hidden flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          뒤로
        </button>
      </div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-xl font-bold text-foreground">모든 게시물</h1>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
          className="text-sm border border-border rounded-lg px-2 py-1.5 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {sortOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 카테고리 필터 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
        {['전체', ...FilterService.CATEGORIES].map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selectedCategory === cat
                ? 'border-primary bg-primary-50 text-primary-700 font-semibold'
                : 'border-border bg-muted text-surface-foreground hover:border-primary-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-muted-foreground py-8">{error}</p>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">게시물이 없습니다.</p>
      )}

      {!isLoading && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectForumWithPost(post.forum_isbn, post.id)}
              className="bg-surface rounded-xl shadow-sm border border-border py-2.5 px-3 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all duration-200"
            >
              <h3 className="font-medium text-foreground text-sm truncate">{post.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {post.book_title} · {formatRelativeTime(post.created_at)}
              </p>
              <div className="flex gap-2 text-xs text-muted-foreground mt-1.5">
                <span aria-label={`좋아요 ${post.like_count}개`} className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5" /> {post.like_count}</span>
                <span aria-label={`댓글 ${post.comment_count}개`} className="flex items-center gap-0.5"><MessageCircle className="w-3.5 h-3.5" /> {post.comment_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoadingMore && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      )}

      {/* 무한 스크롤 sentinel */}
      {hasMore && !isLoading && (
        <div ref={sentinelRef} className="h-4" />
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">모든 게시물을 불러왔습니다.</p>
      )}
    </div>
  );
};

export default AllBestPostsPage;
