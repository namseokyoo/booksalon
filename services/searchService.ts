import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  limit,
  orderBy,
  where,
} from 'firebase/firestore';
import type { Forum } from '../types';

export interface CommunitySearchResult {
  forums: Forum[];
  posts: any[];
  comments: any[];
}

// 인기 검색어 (하드코딩 - 추후 Firestore 기반으로 변경 가능)
const POPULAR_SEARCH_TERMS = [
  '데미안',
  '어린왕자',
  '1984',
  '해리포터',
  '삼체',
  '도리안 그레이',
  '죄와 벌',
  '노르웨이의 숲',
  '호밀밭의 파수꾼',
  '위대한 개츠비',
];

export class SearchService {
  /**
   * searchText 필드 생성 유틸
   * 제목, 내용, 작성자 이메일을 조합하여 검색용 텍스트 생성
   */
  static generateSearchText(title: string, content: string, authorEmail?: string): string {
    const parts = [
      title.toLowerCase().trim(),
      content.toLowerCase().trim(),
    ];

    if (authorEmail) {
      // 이메일에서 @ 앞부분만 추출
      const emailPrefix = authorEmail.split('@')[0].toLowerCase();
      parts.push(emailPrefix);
    }

    return parts.filter(Boolean).join(' ');
  }

  /**
   * 검색어 하이라이트 유틸
   * 텍스트에서 검색어를 <mark> 태그로 감쌈
   */
  static highlightText(text: string, term: string): string {
    if (!term.trim() || !text) {
      return text;
    }

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');

    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 font-medium">$1</mark>');
  }

  /**
   * 인기 검색어 조회
   * 추후 Firestore에서 실제 검색 통계 기반으로 변경 가능
   */
  static async getPopularSearchTerms(maxCount: number = 5): Promise<string[]> {
    // TODO: Firestore에서 검색 통계 기반 인기 검색어 조회
    return POPULAR_SEARCH_TERMS.slice(0, maxCount);
  }

  /**
   * 검색어 자동완성 (포럼/게시물 제목 기반)
   */
  static async getSuggestions(term: string, maxCount: number = 5): Promise<string[]> {
    if (!term.trim()) {
      return [];
    }

    const normalized = term.toLowerCase();
    const suggestions: string[] = [];

    try {
      // 포럼(책) 제목에서 제안
      const forumsSnap = await getDocs(
        query(collection(db, 'forums'), limit(50))
      );

      forumsSnap.docs.forEach(doc => {
        const forum = doc.data() as Forum;
        const title = forum.book?.title || '';
        if (title.toLowerCase().includes(normalized) && !suggestions.includes(title)) {
          suggestions.push(title);
        }
      });

      // 인기 검색어에서 매칭되는 것 추가
      POPULAR_SEARCH_TERMS.forEach(popular => {
        if (
          popular.toLowerCase().includes(normalized) &&
          !suggestions.includes(popular)
        ) {
          suggestions.push(popular);
        }
      });

      return suggestions.slice(0, maxCount);
    } catch (error) {
      console.error('자동완성 검색 실패:', error);
      return [];
    }
  }

  /**
   * 통합 검색 (포럼, 게시물, 댓글)
   * searchText 필드가 있으면 우선 활용, 없으면 title/content 직접 검색
   *
   * @param term - 검색어
   * @param options - 검색 옵션 (페이지네이션, 제한 등)
   */
  static async searchAll(
    term: string,
    options: {
      forumLimit?: number;      // 검색할 포럼 수 제한 (기본값: 100)
      postsPerForum?: number;   // 포럼당 검색할 게시물 수 (기본값: 30)
      maxResults?: number;      // 각 카테고리별 최대 결과 수 (기본값: 50)
    } = {}
  ): Promise<CommunitySearchResult> {
    const {
      forumLimit = 100,        // 기존 10개에서 100개로 증가
      postsPerForum = 30,
      maxResults = 50
    } = options;

    const normalized = term.toLowerCase();

    // 포럼 검색 - 전체 조회 후 클라이언트 필터링
    // (Firestore는 LIKE 검색을 지원하지 않아 클라이언트 사이드 필터링 필요)
    const forumsSnap = await getDocs(
      query(collection(db, 'forums'), limit(forumLimit))
    );
    const forums = forumsSnap.docs
      .map(doc => ({ isbn: doc.id, ...doc.data() } as Forum))
      .filter(forum => {
        // searchText 필드가 있으면 우선 사용
        const searchText = (forum as any).searchText?.toLowerCase() || '';
        if (searchText && searchText.includes(normalized)) {
          return true;
        }

        // searchText가 없으면 개별 필드 검색
        const title = forum.book.title.toLowerCase();
        const authors = forum.book.authors.join(' ').toLowerCase();
        const publisher = forum.book.publisher.toLowerCase();
        const tags = (forum.tags || []).join(' ').toLowerCase();
        return (
          title.includes(normalized) ||
          authors.includes(normalized) ||
          publisher.includes(normalized) ||
          tags.includes(normalized)
        );
      });

    // 각 포럼의 게시물과 댓글 검색
    // 매칭된 포럼 우선, 나머지 포럼은 활동 순으로 검색
    const posts: any[] = [];
    const comments: any[] = [];

    // 매칭된 포럼의 ISBN 목록
    const matchedForumIds = new Set(forums.map(f => f.isbn));

    // 검색 대상 포럼: 매칭된 포럼 + 나머지 포럼 (최대 forumLimit개)
    const forumsToSearch = [
      ...forumsSnap.docs.filter(doc => matchedForumIds.has(doc.id)),
      ...forumsSnap.docs.filter(doc => !matchedForumIds.has(doc.id))
    ].slice(0, forumLimit);

    const commentPromises: Promise<void>[] = [];

    for (const forumDoc of forumsToSearch) {
      const forumId = forumDoc.id;
      const forumData = forumDoc.data() as Forum;

      // 이미 충분한 결과를 찾았으면 조기 종료
      if (posts.length >= maxResults && comments.length >= maxResults) {
        break;
      }

      try {
        // 게시물 검색
        const postsSnap = await getDocs(
          query(collection(db, 'forums', forumId, 'posts'), limit(postsPerForum))
        );

        for (const postDoc of postsSnap.docs) {
          const postData = postDoc.data();

          // searchText 필드가 있으면 우선 사용, 없으면 title/content 검색
          const searchText = postData.searchText?.toLowerCase() || '';
          const title = (postData.title || '').toString().toLowerCase();
          const content = (postData.content || '').toString().toLowerCase();

          const isMatch = searchText
            ? searchText.includes(normalized)
            : title.includes(normalized) || content.includes(normalized);

          if (isMatch && posts.length < maxResults) {
            posts.push({
              id: postDoc.id,
              ...postData,
              forumId,
              forumTitle: forumData.book?.title || '',
            });
          }

          // 댓글 검색 (각 게시물의 댓글) - 비동기로 수집
          if (comments.length < maxResults) {
            const commentsRef = collection(db, 'forums', forumId, 'posts', postDoc.id, 'comments');
            commentPromises.push(
              getDocs(query(commentsRef, limit(10))).then(commentsSnap => {
                commentsSnap.docs.forEach(commentDoc => {
                  const commentData = commentDoc.data();

                  // searchText 필드가 있으면 우선 사용
                  const searchText = commentData.searchText?.toLowerCase() || '';
                  const commentContent = (commentData.content || '').toString().toLowerCase();

                  const isMatch = searchText
                    ? searchText.includes(normalized)
                    : commentContent.includes(normalized);

                  if (isMatch && comments.length < maxResults) {
                    comments.push({
                      id: commentDoc.id,
                      ...commentData,
                      forumId,
                      forumTitle: forumData.book?.title || '',
                      postId: postDoc.id,
                      postTitle: postData.title || '',
                    });
                  }
                });
              }).catch(err => {
                console.error(`댓글 검색 실패 (포럼: ${forumId}, 게시물: ${postDoc.id}):`, err);
              })
            );
          }
        }
      } catch (err) {
        console.error(`게시물 검색 실패 (포럼: ${forumId}):`, err);
      }
    }

    // 모든 댓글 검색이 완료될 때까지 대기
    await Promise.all(commentPromises);

    return {
      forums: forums.slice(0, maxResults),
      posts: posts.slice(0, maxResults),
      comments: comments.slice(0, maxResults)
    };
  }
}
