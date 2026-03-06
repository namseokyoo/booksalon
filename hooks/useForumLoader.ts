import { useState, useEffect } from 'react';
import type { Forum } from '../types';
import { supabase } from '../lib/supabase';

interface UseForumLoaderResult {
  forum: Forum | null;
  loading: boolean;
  error: string | null;
}

export function useForumLoader(isbn: string | undefined): UseForumLoaderResult {
  const [forum, setForum] = useState<Forum | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isbn) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function loadForum() {
      try {
        // books 테이블에서 책 정보 조회
        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('isbn, title, authors, publisher, thumbnail, contents')
          .eq('isbn', isbn)
          .single();

        if (bookError || !bookData) {
          if (!cancelled) {
            setError('해당 살롱을 찾을 수 없습니다.');
            setLoading(false);
          }
          return;
        }

        // forums 테이블에서 포럼 메타데이터 조회
        const { data: forumData } = await supabase
          .from('forums')
          .select('isbn, category, popularity, post_count, average_rating, total_ratings, last_activity_at')
          .eq('isbn', isbn)
          .single();

        // forum_tags 조회
        const { data: tagsData } = await supabase
          .from('forum_tags')
          .select('tag_name')
          .eq('forum_isbn', isbn);

        if (!cancelled) {
          const forum: Forum = {
            isbn: bookData.isbn,
            book: {
              isbn: bookData.isbn,
              title: bookData.title,
              authors: bookData.authors || [],
              publisher: bookData.publisher || '',
              thumbnail: bookData.thumbnail || '',
              contents: bookData.contents || '',
            },
            postCount: forumData?.post_count || 0,
            category: forumData?.category || undefined,
            tags: tagsData?.map(t => t.tag_name) || [],
            lastActivityAt: forumData?.last_activity_at || undefined,
            popularity: forumData?.popularity || 0,
            averageRating: forumData?.average_rating || undefined,
            totalRatings: forumData?.total_ratings || undefined,
          };
          setForum(forum);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError('살롱 정보를 불러오는 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    }

    loadForum();
    return () => { cancelled = true; };
  }, [isbn]);

  return { forum, loading, error };
}
