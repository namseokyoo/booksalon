import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Book, Forum } from '../types';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';

export function useCreateForum() {
  const navigate = useNavigate();
  const { currentUser } = useSupabaseAuth();

  const createForum = useCallback(async (book: Book) => {
    const { supabase } = await import('../lib/supabase');
    const { UserService } = await import('../lib/services');

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

    // 3. 사용자 통계 업데이트
    if (currentUser) {
      try {
        await UserService.incrementStat(currentUser.id, 'forum_count');
      } catch (e) {
        console.warn('사용자 통계 업데이트 실패:', e);
      }
    }

    // 4. Forum 객체 생성 후 navigate
    const newForum: Forum = {
      isbn: book.isbn,
      book,
      postCount: 0,
      lastActivityAt: new Date(),
      popularity: 0,
    };

    navigate(`/forum/${book.isbn}`, { state: { forum: newForum } });
  }, [currentUser, navigate]);

  return createForum;
}
