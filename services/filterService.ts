import type { Forum, Book } from '../types';

export interface FilterOptions {
    category?: string;
    tags?: string[];
    sortBy?: 'recent' | 'popular' | 'posts' | 'title';
    searchTerm?: string;
}

export class FilterService {
    // 카테고리 목록
    static readonly CATEGORIES = [
        '문학',
        'SF/판타지',
        '자기계발',
        '역사',
        '과학',
        '경제/경영',
        '예술',
        '철학',
        '종교',
        '기타'
    ];

    // 인기 태그 목록
    static readonly POPULAR_TAGS = [
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

    // 포럼 필터링 및 정렬
    static filterAndSortForums(forums: Forum[], options: FilterOptions): Forum[] {
        let filteredForums = [...forums];

        // 카테고리 필터링
        if (options.category && options.category !== '전체') {
            filteredForums = filteredForums.filter(forum =>
                forum.category === options.category
            );
        }

        // 태그 필터링
        if (options.tags && options.tags.length > 0) {
            filteredForums = filteredForums.filter(forum =>
                forum.tags && options.tags!.some(tag => forum.tags!.includes(tag))
            );
        }

        // 검색어 필터링
        if (options.searchTerm) {
            const searchTerm = options.searchTerm.toLowerCase();
            filteredForums = filteredForums.filter(forum =>
                forum.book.title.toLowerCase().includes(searchTerm) ||
                forum.book.authors.some(author => author.toLowerCase().includes(searchTerm)) ||
                forum.book.publisher.toLowerCase().includes(searchTerm) ||
                (forum.tags && forum.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        // 정렬
        switch (options.sortBy) {
            case 'recent':
                return filteredForums.sort((a, b) => {
                    const aTime = a.lastActivityAt?.toDate?.() || new Date(0);
                    const bTime = b.lastActivityAt?.toDate?.() || new Date(0);
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

    // 책 카테고리 자동 분류
    static categorizeBook(book: Book): string {
        const title = book.title.toLowerCase();
        const authors = book.authors.join(' ').toLowerCase();
        const publisher = book.publisher.toLowerCase();
        const contents = book.contents?.toLowerCase() || '';

        // 키워드 기반 카테고리 분류
        if (title.includes('해리포터') || title.includes('반지의 제왕') ||
            title.includes('sf') || title.includes('판타지') ||
            title.includes('우주') || title.includes('미래')) {
            return 'SF/판타지';
        }

        if (title.includes('성공') || title.includes('리더십') ||
            title.includes('경영') || title.includes('투자') ||
            title.includes('자기계발') || title.includes('습관')) {
            return '자기계발';
        }

        if (title.includes('역사') || title.includes('조선') ||
            title.includes('고려') || title.includes('삼국') ||
            title.includes('전쟁') || title.includes('문화사')) {
            return '역사';
        }

        if (title.includes('과학') || title.includes('물리') ||
            title.includes('화학') || title.includes('생물') ||
            title.includes('수학') || title.includes('기술')) {
            return '과학';
        }

        if (title.includes('경제') || title.includes('경영') ||
            title.includes('비즈니스') || title.includes('마케팅') ||
            title.includes('재무')) {
            return '경제/경영';
        }

        if (title.includes('예술') || title.includes('미술') ||
            title.includes('음악') || title.includes('디자인') ||
            title.includes('건축')) {
            return '예술';
        }

        if (title.includes('철학') || title.includes('윤리') ||
            title.includes('사상') || title.includes('종교')) {
            return '철학';
        }

        return '문학'; // 기본값
    }

    // 책 태그 자동 생성
    static generateTags(book: Book): string[] {
        const tags: string[] = [];
        const title = book.title.toLowerCase();
        const contents = book.contents?.toLowerCase() || '';

        // 베스트셀러 체크
        if (title.includes('베스트셀러') || title.includes('bestseller')) {
            tags.push('베스트셀러');
        }

        // 고전 체크
        if (title.includes('고전') || title.includes('classic') ||
            book.authors.some(author => author.includes('셰익스피어') || author.includes('톨스토이'))) {
            tags.push('고전');
        }

        // 신작 체크 (최근 출간)
        if (title.includes('신작') || title.includes('new') ||
            title.includes('2024') || title.includes('2025')) {
            tags.push('신작');
        }

        // 추천도서 체크
        if (title.includes('추천') || title.includes('recommend') ||
            contents.includes('추천')) {
            tags.push('추천도서');
        }

        // 토론 관련 체크
        if (contents.includes('토론') || contents.includes('논쟁') ||
            contents.includes('의견')) {
            tags.push('토론');
        }

        // 독서모임 체크
        if (contents.includes('독서모임') || contents.includes('독서회') ||
            contents.includes('모임')) {
            tags.push('독서모임');
        }

        // 서평 체크
        if (contents.includes('서평') || contents.includes('리뷰') ||
            contents.includes('평가')) {
            tags.push('서평');
        }

        // 분석 체크
        if (contents.includes('분석') || contents.includes('해석') ||
            contents.includes('연구')) {
            tags.push('분석');
        }

        // 비교 체크
        if (contents.includes('비교') || contents.includes('대조') ||
            contents.includes('차이')) {
            tags.push('비교');
        }

        // 실용서 체크
        if (contents.includes('실용') || contents.includes('활용') ||
            contents.includes('방법') || contents.includes('기법')) {
            tags.push('실용서');
        }

        return tags;
    }

    // 인기도 점수 계산
    static calculatePopularity(forum: Forum): number {
        const postCount = forum.postCount || 0;
        const daysSinceCreation = forum.lastActivityAt ?
            Math.max(1, Math.floor((Date.now() - forum.lastActivityAt.toDate().getTime()) / (1000 * 60 * 60 * 24))) : 1;

        // 게시물 수와 최근 활동을 고려한 인기도 점수
        return postCount * 10 - daysSinceCreation;
    }
}
