import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Forum, Book } from '../types';
import {
    searchBookByIsbn,
    searchBookByTitle,
    SearchService,
    SearchHistoryService,
    type CommunitySearchResult,
} from '../lib/services';
import { SearchIcon, BookOpenIcon } from './icons';
import SearchSuggestions from './SearchSuggestions';
import HighlightText from './HighlightText';
import { useCreateForum } from '../hooks/useCreateForum';

interface SearchModalProps {
    onClose: () => void;
}

// 디바운스 훅
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const createForum = useCreateForum();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchType, setSearchType] = useState<'book' | 'community'>('book');
    const [bookResults, setBookResults] = useState<Book[]>([]);
    const [communityResults, setCommunityResults] = useState<CommunitySearchResult>({
        forums: [],
        posts: [],
        comments: [],
    });

    // 검색 제안 관련 상태
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [popularSearches, setPopularSearches] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // 검색된 검색어 (하이라이트용)
    const [searchedTerm, setSearchedTerm] = useState('');

    // 페이지네이션
    const [bookSearchPage, setBookSearchPage] = useState(1);
    const [bookSearchIsEnd, setBookSearchIsEnd] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastBookSearchTerm, setLastBookSearchTerm] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // 디바운스된 검색어 (자동완성용)
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // ESC 키로 모달 닫기 + 포커스 트래핑
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'input, button, select, [tabindex]:not([tabindex="-1"])'
                );
                const firstEl = focusableElements[0];
                const lastEl = focusableElements[focusableElements.length - 1];
                if (e.shiftKey) {
                    if (document.activeElement === firstEl) {
                        e.preventDefault();
                        lastEl?.focus();
                    }
                } else {
                    if (document.activeElement === lastEl) {
                        e.preventDefault();
                        firstEl?.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 초기 데이터 로드
    useEffect(() => {
        loadInitialData();
        inputRef.current?.focus();
    }, []);

    // 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 자동완성 업데이트
    useEffect(() => {
        if (debouncedSearchTerm.trim() && showSuggestions) {
            loadSuggestions(debouncedSearchTerm);
        } else {
            setSuggestions([]);
        }
    }, [debouncedSearchTerm, showSuggestions]);

    const loadInitialData = async () => {
        // 최근 검색어 로드
        const history = SearchHistoryService.getHistoryTerms();
        setRecentSearches(history.slice(0, 5));

        // 인기 검색어 로드
        try {
            const popular = await SearchService.getPopularSearchTerms(5);
            setPopularSearches(popular);
        } catch (error) {
            console.error('인기 검색어 로드 실패:', error);
        }
    };

    const loadSuggestions = async (term: string) => {
        if (!term.trim()) return;

        setIsSuggestionsLoading(true);
        try {
            // 검색 히스토리에서 매칭
            const historyMatches = SearchHistoryService.filterHistory(term).slice(0, 3);

            // 자동완성 제안 가져오기
            const autoSuggestions = await SearchService.getSuggestions(term, 5);

            // 중복 제거 후 병합
            const combined = [...new Set([...historyMatches, ...autoSuggestions])].slice(0, 7);
            setSuggestions(combined);
        } catch (error) {
            console.error('자동완성 로드 실패:', error);
        } finally {
            setIsSuggestionsLoading(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent, termOverride?: string) => {
        e?.preventDefault();
        const term = (termOverride || searchTerm).trim();
        if (!term) return;

        setShowSuggestions(false);
        setIsLoading(true);
        setError(null);
        setBookResults([]);
        setCommunityResults({ forums: [], posts: [], comments: [] });
        setSearchedTerm(term);

        // 검색 히스토리에 추가
        SearchHistoryService.addToHistory(term);
        setRecentSearches(SearchHistoryService.getHistoryTerms().slice(0, 5));

        try {
            if (searchType === 'book') {
                // 책 검색
                const isIsbn = /^\d{10}$|^\d{13}$/.test(term);
                if (isIsbn) {
                    const book = await searchBookByIsbn(term);
                    if (book) {
                        setBookResults([book]);
                    } else {
                        setError('해당 ISBN을 가진 책을 찾을 수 없습니다.');
                    }
                } else {
                    const result = await searchBookByTitle(term, 1, 10);
                    if (result.books.length > 0) {
                        setBookResults(result.books);
                        setBookSearchIsEnd(result.isEnd);
                        setBookSearchPage(1);
                        setLastBookSearchTerm(term);
                    } else {
                        setError('해당 제목의 책을 찾을 수 없습니다.');
                    }
                }
            } else {
                // 커뮤니티 검색
                const results = await SearchService.searchAll(term);
                setCommunityResults(results);

                if (
                    results.forums.length === 0 &&
                    results.posts.length === 0 &&
                    results.comments.length === 0
                ) {
                    setError('검색 결과가 없습니다.');
                }
            }
        } catch (error: unknown) {
            console.error('검색 실패:', error);
            const errorMessage = error instanceof Error ? error.message : '검색 중 오류가 발생했습니다. 다시 시도해주세요.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSuggestion = (term: string) => {
        setSearchTerm(term);
        setShowSuggestions(false);
        handleSearch(undefined, term);
    };

    const handleRemoveHistory = (term: string) => {
        SearchHistoryService.removeFromHistory(term);
        setRecentSearches(SearchHistoryService.getHistoryTerms().slice(0, 5));
    };

    const handleClearHistory = () => {
        SearchHistoryService.clearHistory();
        setRecentSearches([]);
    };

    const handleInputFocus = () => {
        setShowSuggestions(true);
    };

    const handleBookClick = async (book: Book) => {
        onClose();
        await createForum(book);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && showSuggestions) {
            e.stopPropagation();
            setShowSuggestions(false);
        }
    };

    const handleBookLoadMore = useCallback(async () => {
        if (bookSearchIsEnd || isLoadingMore || !lastBookSearchTerm) return;

        setIsLoadingMore(true);
        try {
            const nextPage = bookSearchPage + 1;
            const result = await searchBookByTitle(lastBookSearchTerm, nextPage, 10);
            if (result.books.length > 0) {
                setBookResults(prev => [...prev, ...result.books]);
                setBookSearchPage(nextPage);
                setBookSearchIsEnd(result.isEnd);
            } else {
                setBookSearchIsEnd(true);
            }
        } catch (error) {
            console.error('추가 검색 실패:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [bookSearchIsEnd, isLoadingMore, lastBookSearchTerm, bookSearchPage]);

    const resetSearch = () => {
        setSearchTerm('');
        setError(null);
        setBookResults([]);
        setCommunityResults({ forums: [], posts: [], comments: [] });
        setSearchedTerm('');
        setBookSearchPage(1);
        setBookSearchIsEnd(true);
        setLastBookSearchTerm('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="search-modal-title" ref={modalRef}>
            <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
                    <h2 id="search-modal-title" className="text-lg sm:text-xl font-semibold text-foreground">통합 검색</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-muted-foreground transition-colors"
                        aria-label="검색 모달 닫기"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 검색 타입 선택 */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => {
                            setSearchType('book');
                            resetSearch();
                        }}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${searchType === 'book'
                            ? 'text-primary border-b-2 border-primary bg-primary-50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        책 검색
                    </button>
                    <button
                        onClick={() => {
                            setSearchType('community');
                            resetSearch();
                        }}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${searchType === 'community'
                            ? 'text-primary border-b-2 border-primary bg-primary-50'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        살롱 검색
                    </button>
                </div>

                {/* 검색 입력 */}
                <form onSubmit={handleSearch} className="p-4 sm:p-6 border-b border-border">
                    <div className="relative" ref={suggestionsRef}>
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                className="flex-1 bg-surface border border-border rounded-lg px-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                                placeholder={searchType === 'book' ? '어떤 책이 궁금하세요?' : '살롱, 게시글, 댓글을 검색하세요'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={handleInputFocus}
                                onKeyDown={handleKeyDown}
                                aria-label={searchType === 'book' ? 'ISBN 또는 책 제목 검색' : '커뮤니티 검색'}
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-cta text-cta-foreground rounded-lg text-sm font-medium hover:bg-cta-700 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
                                disabled={isLoading || !searchTerm.trim()}
                                aria-label="검색 실행"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                ) : (
                                    <SearchIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        {/* 검색 제안 드롭다운 */}
                        {showSuggestions && !isLoading && (
                            <SearchSuggestions
                                recentSearches={recentSearches}
                                popularSearches={popularSearches}
                                suggestions={suggestions}
                                searchTerm={searchTerm}
                                isLoading={isSuggestionsLoading}
                                onSelectSuggestion={handleSelectSuggestion}
                                onRemoveHistory={handleRemoveHistory}
                                onClearHistory={handleClearHistory}
                            />
                        )}
                    </div>
                </form>

                {/* 검색 결과 */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : searchType === 'book' ? (
                        // 책 검색 결과
                        <div className="space-y-3">
                            {bookResults.length > 0 ? (
                                <>
                                    {bookResults.map((book, index) => (
                                        <div
                                            key={`${book.isbn}-${index}`}
                                            onClick={() => handleBookClick(book)}
                                            className="p-3 border border-border rounded-lg bg-muted hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all"
                                        >
                                            <div className="flex items-start gap-3">
                                                <img
                                                    src={book.thumbnail}
                                                    alt={`${book.title} 표지`}
                                                    className="w-12 h-auto rounded flex-shrink-0"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">
                                                        <HighlightText text={book.title} highlight={searchedTerm} />
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground truncate mt-1">
                                                        <HighlightText text={book.authors.join(', ')} highlight={searchedTerm} />
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-1">{book.publisher}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {!bookSearchIsEnd && (
                                        <div className="text-center pt-4">
                                            <button
                                                onClick={handleBookLoadMore}
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
                                </>
                            ) : searchedTerm ? (
                                <div className="flex flex-col items-center py-8">
                                    <BookOpenIcon className="w-12 h-12 text-primary opacity-30 mb-3" />
                                    <p className="text-center text-muted-foreground">아직 이 책에 대한 이야기는 도착하지 않았네요.</p>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">어떤 책이 궁금하세요?</p>
                            )}
                        </div>
                    ) : (
                        // 커뮤니티 검색 결과
                        <div className="space-y-6">
                            {communityResults.forums.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">
                                        살롱 ({communityResults.forums.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {communityResults.forums.map(forum => (
                                            <div
                                                key={forum.isbn}
                                                onClick={() => {
                                                    navigate(`/forum/${forum.isbn}`, { state: { forum } });
                                                    onClose();
                                                }}
                                                className="p-3 border border-border rounded-lg bg-muted hover:border-primary-300 hover:shadow-sm cursor-pointer transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                        <HighlightText text={forum.book.title} highlight={searchedTerm} />
                                                    </p>
                                                    {forum.category && (
                                                        <span className="text-xs text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5 ml-2">
                                                            {forum.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate mt-1">
                                                    <HighlightText text={forum.book.authors.join(', ')} highlight={searchedTerm} />
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {communityResults.posts.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">
                                        게시글 ({communityResults.posts.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {communityResults.posts.map(post => (
                                            <div
                                                key={post.id}
                                                className="p-3 border border-border rounded-lg bg-muted cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                                                onClick={() => {
                                                    const forum = communityResults.forums.find(f => f.isbn === post.forumIsbn);
                                                    if (forum) {
                                                        navigate(`/forum/${forum.isbn}`, { state: { forum } });
                                                        onClose();
                                                    }
                                                }}
                                            >
                                                <p className="text-sm font-semibold text-foreground truncate">
                                                    <HighlightText text={post.title} highlight={searchedTerm} />
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                    <HighlightText text={post.content} highlight={searchedTerm} />
                                                </p>
                                                {post.forumTitle && (
                                                    <p className="text-xs text-primary mt-2">
                                                        살롱: {post.forumTitle}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {communityResults.comments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-3">
                                        댓글 ({communityResults.comments.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {communityResults.comments.map(comment => (
                                            <div
                                                key={comment.id}
                                                className="p-3 border border-border rounded-lg bg-muted cursor-pointer hover:border-primary-300 hover:shadow-sm transition-all"
                                                onClick={() => {
                                                    const forum = communityResults.forums.find(f => f.isbn === comment.forumIsbn);
                                                    if (forum) {
                                                        navigate(`/forum/${forum.isbn}`, { state: { forum } });
                                                        onClose();
                                                    }
                                                }}
                                            >
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    <HighlightText text={comment.content} highlight={searchedTerm} />
                                                </p>
                                                {comment.forumTitle && (
                                                    <p className="text-xs text-primary mt-2">
                                                        살롱: {comment.forumTitle}
                                                        {comment.postTitle && ` > ${comment.postTitle}`}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {searchedTerm &&
                                communityResults.forums.length === 0 &&
                                communityResults.posts.length === 0 &&
                                communityResults.comments.length === 0 && (
                                    <div className="flex flex-col items-center py-8">
                                        <SearchIcon className="w-12 h-12 text-primary opacity-30 mb-3" />
                                        <p className="text-center text-muted-foreground">검색 결과가 없습니다.</p>
                                    </div>
                                )}
                            {!searchedTerm && (
                                <p className="text-center text-muted-foreground py-8">어떤 책이 궁금하세요?</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
