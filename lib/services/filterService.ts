import type { Forum } from '../../types';

export interface FilterOptions {
    sortBy?: 'recent' | 'popular' | 'posts' | 'title';
    searchTerm?: string;
}

export class FilterService {
    // 포럼 필터링 및 정렬
    static filterAndSortForums(forums: Forum[], options: FilterOptions): Forum[] {
        let filteredForums = [...forums];

        // 검색어 필터링
        if (options.searchTerm) {
            const searchTerm = options.searchTerm.toLowerCase();
            filteredForums = filteredForums.filter(forum =>
                forum.book.title.toLowerCase().includes(searchTerm) ||
                forum.book.authors.some(author => author.toLowerCase().includes(searchTerm)) ||
                forum.book.publisher.toLowerCase().includes(searchTerm)
            );
        }

        // 정렬
        switch (options.sortBy) {
            case 'recent':
                return filteredForums.sort((a, b) => {
                    const aTime = a.lastActivityAt instanceof Date
                        ? a.lastActivityAt
                        : new Date(a.lastActivityAt || 0);
                    const bTime = b.lastActivityAt instanceof Date
                        ? b.lastActivityAt
                        : new Date(b.lastActivityAt || 0);
                    return bTime.getTime() - aTime.getTime();
                });

            case 'popular':
                return filteredForums.sort((a, b) => {
                    const aPopularity = a.popularity || 0;
                    const bPopularity = b.popularity || 0;
                    return bPopularity - aPopularity;
                });

            case 'posts':
                return filteredForums.sort((a, b) => b.postCount - a.postCount);

            case 'title':
                return filteredForums.sort((a, b) =>
                    a.book.title.localeCompare(b.book.title)
                );

            default:
                return filteredForums;
        }
    }

    // 인기도 점수 계산
    static calculatePopularity(forum: Forum): number {
        const postCount = forum.postCount || 0;
        const lastActivity = forum.lastActivityAt instanceof Date
            ? forum.lastActivityAt
            : new Date(forum.lastActivityAt || 0);
        const daysSinceCreation = forum.lastActivityAt ?
            Math.max(1, Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))) : 1;

        // 게시물 수와 최근 활동을 고려한 인기도 점수
        return postCount * 10 - daysSinceCreation;
    }
}

export namespace FilterService {
    // Post 태그 입력 fallback 용도만 유지한다.
    export const POPULAR_TAGS = [
        '베스트셀러',
        '고전',
        '신작',
        '추천도서',
        '토론',
        '독서모임',
        '서평',
        '분석',
        '비교',
        '실용서'
    ];
}
