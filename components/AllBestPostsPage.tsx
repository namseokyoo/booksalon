
import React, { useState, useEffect } from 'react';
import { supabaseAnon } from '../lib/supabase';
import { ArrowLeftIcon } from './icons';

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
}

interface AllBestPostsPageProps {
  onBack: () => void;
  onSelectForumWithPost: (forumIsbn: string, postId: string) => void;
}

const AllBestPostsPage: React.FC<AllBestPostsPageProps> = ({ onBack, onSelectForumWithPost }) => {
  const [posts, setPosts] = useState<BestPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBestPosts = async () => {
      try {
        setIsLoading(true);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error: postsError } = await supabaseAnon
          .from('posts')
          .select('id, title, author_id, forum_isbn, like_count, comment_count, view_count, created_at')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('like_count', { ascending: false })
          .limit(100);

        if (postsError || !data) {
          setError('인기 게시물을 불러오지 못했습니다.');
          return;
        }

        const scored = data
          .map(p => ({
            ...p,
            like_count: p.like_count || 0,
            comment_count: p.comment_count || 0,
            view_count: p.view_count || 0,
            score: (p.like_count || 0) * 2 + (p.comment_count || 0) * 1.5 + (p.view_count || 0) * 0.1,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 50);

        const authorIds = [...new Set(scored.map(p => p.author_id))];
        const { data: usersData } = await supabaseAnon
          .from('users')
          .select('id, display_name, nickname')
          .in('id', authorIds);

        const userMap = new Map<string, string>();
        usersData?.forEach((u: { id: string; display_name: string | null; nickname: string | null }) => {
          userMap.set(u.id, u.nickname || u.display_name || '익명');
        });

        const forumIsbns = [...new Set(scored.map(p => p.forum_isbn))];
        const { data: booksData } = await supabaseAnon
          .from('books')
          .select('isbn, title')
          .in('isbn', forumIsbns);

        const bookMap = new Map<string, string>();
        booksData?.forEach((b: { isbn: string; title: string }) => {
          bookMap.set(b.isbn, b.title);
        });

        const result: BestPost[] = scored.map(p => ({
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
        }));

        setPosts(result);
      } catch (err) {
        console.error('인기 게시물 전체 로드 실패:', err);
        setError('인기 게시물을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBestPosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          뒤로
        </button>
        <h1 className="font-serif text-xl font-semibold text-foreground">인기 게시물</h1>
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
        <p className="text-center text-sm text-muted-foreground py-8">인기 게시물이 없습니다.</p>
      )}

      {!isLoading && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectForumWithPost(post.forum_isbn, post.id)}
              className="bg-surface rounded-xl shadow-sm border border-border py-2 px-3 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all duration-200 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{post.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{post.book_title}</p>
              </div>
              <div className="flex-shrink-0 flex gap-2 text-xs text-muted-foreground">
                <span aria-label={`좋아요 ${post.like_count}개`}>❤️ {post.like_count}</span>
                <span aria-label={`댓글 ${post.comment_count}개`}>💬 {post.comment_count}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllBestPostsPage;
