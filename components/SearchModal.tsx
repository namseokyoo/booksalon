import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Forum, Book } from '../types';
import {
    searchBookByIsbn,
    searchBookByTitle,
    SearchService,
    SearchHistoryService,
    type CommunitySearchResult,
} from '../lib/services';
import { SearchIcon } from './icons';
import SearchSuggestions from './SearchSuggestions';
import HighlightText from './HighlightText';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectForum: (forum: Forum) => void;
    onCreateForum: (book: Book) => void;
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

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectForum, onCreateForum }) => {
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

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // 디바운스된 검색어 (자동완성용)
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // 초기 데이터 로드
    useEffect(() => {
        if (isOpen) {
            loadInitialData();
            inputRef.current?.focus();
        }
    }, [isOpen]);

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
                    const books = await searchBookByTitle(term);
                    if (books.length > 0) {
                        setBookResults(books);
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
        } catch (error: any) {
            console.error('검색 실패:', error);
            setError(error.message || '검색 중 오류가 발생했습니다. 다시 시도해주세요.');
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

    const handleBookClick = (book: Book) => {
        onCreateForum(book);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const resetSearch = () => {
        setSearchTerm('');
        setError(null);
        setBookResults([]);
        setCommunityResults({ forums: [], posts: [], comments: [] });
        setSearchedTerm('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">통합 검색</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 검색 타입 선택 */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => {
                            setSearchType('book');
                            resetSearch();
                        }}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${searchType === 'book'
                            ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                            ? 'text-cyan-600 border-b-2 border-cyan-600 bg-cyan-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        커뮤니티 검색
                    </button>
                </div>

                {/* 검색 입력 */}
                <form onSubmit={handleSearch} className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="relative" ref={suggestionsRef}>
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder={searchType === 'book' ? 'ISBN 또는 책 제목을 입력하세요' : '살롱, 게시글, 댓글을 검색하세요'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={handleInputFocus}
                                onKeyDown={handleKeyDown}
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:opacity-50"
                                disabled={isLoading || !searchTerm.trim()}
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                        </div>
                    ) : searchType === 'book' ? (
                        // 책 검색 결과
                        <div className="space-y-3">
                            {bookResults.length > 0 ? (
                                bookResults.map((book, index) => (
                                    <div
                                        key={`${book.isbn}-${index}`}
                                        onClick={() => handleBookClick(book)}
                                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:border-cyan-300 hover:shadow-sm cursor-pointer transition-all"
                                    >
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={book.thumbnail}
                                                alt={book.title}
                                                className="w-16 h-auto rounded flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    <HighlightText text={book.title} highlight={searchedTerm} />
                                                </h3>
                                                <p className="text-sm text-gray-600 truncate mt-1">
                                                    <HighlightText text={book.authors.join(', ')} highlight={searchedTerm} />
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">{book.publisher}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : searchedTerm ? (
                                <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
                            ) : (
                                <p className="text-center text-gray-400 py-8">검색어를 입력하세요.</p>
                            )}
                        </div>
                    ) : (
                        // 커뮤니티 검색 결과
                        <div className="space-y-6">
                            {communityResults.forums.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        살롱 ({communityResults.forums.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {communityResults.forums.map(forum => (
                                            <div
                                                key={forum.isbn}
                                                onClick={() => {
                                                    onSelectForum(forum);
                                                    onClose();
                                                }}
                                                className="p-3 border border-gray-200 rounded-lg bg-gray-50 hover:border-cyan-300 hover:shadow-sm cursor-pointer transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        <HighlightText text={forum.book.title} highlight={searchedTerm} />
                                                    </p>
                                                    {forum.category && (
                                                        <span className="text-xs text-cyan-700 bg-cyan-50 border border-cyan-200 rounded-full px-2 py-0.5 ml-2">
                                                            {forum.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 truncate mt-1">
                                                    <HighlightText text={forum.book.authors.join(', ')} highlight={searchedTerm} />
                                                </p>
                                                {forum.tags && forum.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {forum.tags.slice(0, 3).map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs text-gray-500 bg-gray-100 rounded px-1.5 py-0.5"
                                                            >
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {communityResults.posts.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        게시글 ({communityResults.posts.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {communityResults.posts.map(post => (
                                            <div
                                                key={post.id}
                                                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                                            >
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    <HighlightText text={post.title} highlight={searchedTerm} />
                                                </p>
                                                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                                    <HighlightText text={post.content} highlight={searchedTerm} />
                                                </p>
                                                {post.forumTitle && (
                                                    <p className="text-xs text-cyan-600 mt-2">
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
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                        댓글 ({communityResults.comments.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {communityResults.comments.map(comment => (
                                            <div
                                                key={comment.id}
                                                className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                                            >
                                                <p className="text-xs text-gray-600 line-clamp-2">
                                                    <HighlightText text={comment.content} highlight={searchedTerm} />
                                                </p>
                                                {comment.forumTitle && (
                                                    <p className="text-xs text-cyan-600 mt-2">
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
                                    <p className="text-center text-gray-500 py-8">검색 결과가 없습니다.</p>
                                )}
                            {!searchedTerm && (
                                <p className="text-center text-gray-400 py-8">검색어를 입력하세요.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
