
import React, { useState, useEffect } from 'react';
import type { Forum, Book } from '../types';
import {
  searchBookByIsbn,
  searchBookByTitle,
  UserService,
  BookmarkService,
  TagService,
  FilterService,
  type FilterOptions,
} from '../lib/services';
import CreateForumModal from './CreateForumModal';
import { SearchIcon } from './icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookmarkIcon } from './icons/BookmarkIcon';
import StarRating from './StarRating';

interface ForumListProps {
  onSelectForum: (forum: Forum) => void;
}

const ForumList: React.FC<ForumListProps> = ({ onSelectForum }) => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<Book | null>(null);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [existingForums, setExistingForums] = useState<Forum[]>([]);
  const [bookmarkedForums, setBookmarkedForums] = useState<Forum[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [filteredForums, setFilteredForums] = useState<Forum[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const { currentUser } = useAuth();

  const sortOptions = [
    { value: 'recent', label: '최신순' },
    { value: 'popular', label: '인기순' },
    { value: 'posts', label: '게시물순' },
    { value: 'title', label: '제목순' },
  ];

  useEffect(() => {
    // 초기 데이터 로드
    const loadForums = async () => {
      const { data: forumsData, error } = await supabase
        .from('forums')
        .select(`
          isbn,
          post_count,
          category,
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('포럼 로드 실패:', error);
        return;
      }

      // 포럼 태그 조회
      const { data: forumTags } = await supabase
        .from('forum_tags')
        .select('forum_isbn, tag_name');

      const tagsByForum = new Map<string, string[]>();
      forumTags?.forEach((ft: { forum_isbn: string; tag_name: string }) => {
        const tags = tagsByForum.get(ft.forum_isbn) || [];
        tags.push(ft.tag_name);
        tagsByForum.set(ft.forum_isbn, tags);
      });

      const enrichedForums: Forum[] = (forumsData || []).map((forum: {
        isbn: string;
        post_count: number;
        category: string | null;
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
      }) => ({
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
        category: forum.category || undefined,
        tags: tagsByForum.get(forum.isbn) || [],
        popularity: forum.popularity,
        averageRating: forum.average_rating,
        totalRatings: forum.total_ratings,
        lastActivityAt: forum.last_activity_at ? new Date(forum.last_activity_at) : undefined,
        createdAt: forum.created_at ? new Date(forum.created_at) : undefined,
      }));

      setForums(enrichedForums);
    };

    loadForums();

    // Supabase 실시간 구독
    const subscription = supabase
      .channel('forums_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forums' }, () => {
        loadForums();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 필터링 적용
  useEffect(() => {
    const filtered = FilterService.filterAndSortForums(forums, filterOptions);
    setFilteredForums(filtered);
  }, [forums, filterOptions]);

  // 북마크 데이터 로드
  useEffect(() => {
    if (currentUser) {
      loadBookmarks();
    } else {
      setBookmarkedForums([]);
      setBookmarks(new Set());
    }
  }, [currentUser]);

  const loadBookmarks = async () => {
    if (!currentUser) return;

    try {
      const bookmarkedForumsData = await BookmarkService.getBookmarkedForums(currentUser.uid);
      setBookmarkedForums(bookmarkedForumsData);

      const bookmarkSet = new Set(bookmarkedForumsData.map(forum => forum.isbn));
      setBookmarks(bookmarkSet);
    } catch (error) {
      console.error('북마크 로드 실패:', error);
    }
  };

  const handleToggleBookmark = async (isbn: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 포럼 클릭 이벤트 방지

    if (!currentUser) {
      alert('북마크하려면 로그인이 필요합니다.');
      return;
    }

    try {
      const isBookmarked = await BookmarkService.toggleBookmark(currentUser.uid, isbn);

      if (isBookmarked) {
        setBookmarks(prev => new Set([...prev, isbn]));
        // 북마크한 포럼 목록에 추가
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
    } catch (error) {
      console.error('북마크 토글 실패:', error);
      alert('북마크 처리 중 오류가 발생했습니다.');
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const trimmedSearchTerm = searchTerm.trim();
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setSearchResults([]);
    setExistingForums([]);

    // Firebase 체크를 임시로 비활성화하고 카카오 API만 테스트
    console.log('🔍 검색 시작:', trimmedSearchTerm);

    // 먼저 기존 살롱에서 비슷한 제목 검색
    const matchingForums = forums.filter(forum =>
      forum.book.title.toLowerCase().includes(trimmedSearchTerm.toLowerCase()) ||
      forum.book.authors.some(author => author.toLowerCase().includes(trimmedSearchTerm.toLowerCase()))
    );

    if (matchingForums.length > 0) {
      setExistingForums(matchingForums);
      console.log('🏛️ 기존 살롱 발견:', matchingForums.length, '개');
    }

    // ISBN인지 확인 (숫자로만 구성된 10자리 또는 13자리)
    const isIsbn = /^\d{10}$|^\d{13}$/.test(trimmedSearchTerm);

    if (isIsbn) {
      // ISBN으로 검색
      const book = await searchBookByIsbn(trimmedSearchTerm);
      if (book) {
        setSearchResult(book);
      } else {
        setError('해당 ISBN을 가진 책을 찾을 수 없습니다. 다른 ISBN을 시도해보세요.');
      }
    } else {
      // 제목으로 검색
      const books = await searchBookByTitle(trimmedSearchTerm);
      if (books.length > 0) {
        setSearchResults(books);
      } else if (matchingForums.length === 0) {
        setError('해당 제목의 책을 찾을 수 없습니다. 다른 제목을 시도해보세요.');
      }
    }
    setIsLoading(false);
  };

  const handleCreateForum = async (book: Book, customTags?: string[]) => {
    const category = FilterService.categorizeBook(book);
    // 사용자 지정 태그가 있으면 사용, 없으면 자동 생성
    const tags = customTags && customTags.length > 0
      ? customTags
      : FilterService.generateTags(book);

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
        category,
        popularity: 0,
        last_activity_at: new Date().toISOString(),
      });

    if (forumError) {
      console.error('포럼 생성 실패:', forumError);
      throw forumError;
    }

    // 태그 통계 업데이트
    if (tags && tags.length > 0) {
      await TagService.addTagsToForum(book.isbn, tags);
    }

    // 사용자 통계 업데이트
    if (currentUser) {
      await UserService.incrementStat(currentUser.uid, 'forum_count');
    }

    const newForum: Forum = {
      isbn: book.isbn,
      book,
      postCount: 0,
      category,
      tags,
      lastActivityAt: new Date(),
      popularity: 0,
    };

    setSearchResult(null);
    onSelectForum(newForum);
  };

  const handleSelectCategory = (category?: string) => {
    setFilterOptions(prev => ({
      ...prev,
      category: category === '전체' ? undefined : category,
    }));
  };

  const handleToggleTag = (tag: string) => {
    setFilterOptions(prev => {
      const current = prev.tags || [];
      const exists = current.includes(tag);
      return {
        ...prev,
        tags: exists ? current.filter(t => t !== tag) : [...current, tag],
      };
    });
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    setFilterOptions(prev => ({
      ...prev,
      sortBy,
    }));
  };

  const handleResetFilters = () => {
    setFilterOptions({});
  };

  const hasActiveFilters = () => {
    return !!(filterOptions.category || (filterOptions.tags && filterOptions.tags.length > 0) || filterOptions.sortBy);
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 lg:p-8">
      <form onSubmit={handleSearch} className="mb-4 sm:mb-6 sticky top-[65px] z-10 bg-white border-b border-gray-200 py-3 sm:py-4 rounded-lg shadow-sm">
        <label htmlFor="isbn-search" className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
          ISBN 또는 책 제목으로 검색
        </label>
        <div className="mt-1 flex rounded-lg shadow-sm">
          <div className="relative flex items-stretch flex-grow focus-within:z-10">
            <input
              type="text"
              name="isbn-search"
              id="isbn-search"
              className="focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 block w-full rounded-none rounded-l-lg bg-white border border-gray-300 text-gray-900 pl-3 sm:pl-4 text-sm sm:text-sm"
              placeholder="ISBN 번호 또는 책 제목을 입력하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="-ml-px relative inline-flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 border border-l-0 border-gray-300 text-xs sm:text-sm font-medium rounded-r-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                <span className="hidden sm:inline">검색</span>
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-2 text-xs sm:text-sm text-red-500">{error}</p>}
      </form>

      {/* 컴팩트 필터 바 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        {/* 필터 헤더 (항상 표시) */}
        <button
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">필터</span>
            {hasActiveFilters() && (
              <span className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-700 rounded-full font-medium">
                활성
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetFilters();
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                초기화
              </button>
            )}
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* 필터 내용 (접기/펼치기) */}
        {isFilterExpanded && (
          <div className="border-t border-gray-200 p-3 sm:p-4 space-y-4">
            {/* 카테고리 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {['전체', ...FilterService.CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleSelectCategory(cat)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                      (filterOptions.category || '전체') === cat
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-cyan-200 hover:text-cyan-700'
                    }`}
                    type="button"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">태그</label>
              <div className="flex flex-wrap gap-2">
                {FilterService.POPULAR_TAGS.map(tag => {
                  const active = (filterOptions.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      type="button"
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        active
                          ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold'
                          : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-cyan-200 hover:text-cyan-700'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 정렬 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">정렬</label>
              <select
                value={filterOptions.sortBy || 'recent'}
                onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'])}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 북마크한 살롱 표시 */}
      {bookmarkedForums.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⭐ 북마크한 살롱</h2>
          <div className="space-y-3 sm:space-y-4">
            {bookmarkedForums.map((forum) => (
              <div
                key={forum.isbn}
                onClick={() => onSelectForum(forum)}
                className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md hover:border-cyan-300 cursor-pointer transition-all duration-200 flex items-start sm:items-center space-x-3 sm:space-x-4 border-l-4 border-l-amber-400"
              >
                <img
                  src={forum.book.thumbnail}
                  alt={forum.book.title}
                  className="w-10 h-auto sm:w-12 sm:h-auto rounded-lg flex-shrink-0 shadow-sm"
                />
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{forum.book.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">{forum.book.authors.join(', ')}</p>
                  <p className="text-xs text-gray-500 mt-1">{forum.book.publisher}</p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col items-end space-y-2">
                  <button
                    onClick={(e) => handleToggleBookmark(forum.isbn, e)}
                    className="p-1 hover:bg-amber-50 rounded transition-colors duration-200"
                    title="북마크 해제"
                  >
                    <BookmarkIcon
                      className="h-4 w-4 text-amber-500"
                      filled={true}
                    />
                  </button>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">게시물</p>
                    <p className="text-base sm:text-lg font-bold text-amber-500">{forum.postCount || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 기존 살롱 검색 결과 표시 */}
      {existingForums.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 최근 개설된 살롱</h2>
          <div className="space-y-3 sm:space-y-4">
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
                  onClick={() => onSelectForum(forum)}
                  className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md hover:border-cyan-300 cursor-pointer transition-all duration-200 flex items-start sm:items-center space-x-3 sm:space-x-4 border-l-4 border-l-cyan-500"
                >
                  <img
                    src={forum.book.thumbnail}
                    alt={forum.book.title}
                    className="w-10 h-auto sm:w-12 sm:h-auto rounded flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{forum.book.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">{forum.book.authors.join(', ')}</p>
                    <p className="text-xs text-gray-500 mt-1">{forum.book.publisher}</p>
                    {forum.averageRating && forum.averageRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={forum.averageRating} readonly size="sm" allowHalf />
                        <span className="text-xs text-amber-500 font-semibold ml-1">{forum.averageRating.toFixed(1)}</span>
                        {forum.totalRatings && (
                          <span className="text-xs text-gray-500">({forum.totalRatings})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end space-y-2">
                    <button
                      onClick={(e) => handleToggleBookmark(forum.isbn, e)}
                      className="p-1 hover:bg-cyan-50 rounded transition-colors duration-200"
                      title={bookmarks.has(forum.isbn) ? "북마크 해제" : "북마크 추가"}
                    >
                      <BookmarkIcon
                        className="h-4 w-4"
                        filled={bookmarks.has(forum.isbn)}
                      />
                    </button>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">게시물</p>
                      <p className="text-base sm:text-lg font-bold text-cyan-400">{forum.postCount || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 새로운 도서 검색 결과 표시 */}
      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 새로운 도서 검색 결과</h2>
          <div className="space-y-3 sm:space-y-4">
            {searchResults.map((book, index) => {
              // 기존 살롱에 같은 ISBN이 있는지 확인
              const existingForum = forums.find(forum => forum.isbn === book.isbn);
              const hasExistingForum = !!existingForum;

              return (
                <div
                  key={`${book.isbn}-${index}`}
                  onClick={hasExistingForum ? () => onSelectForum(existingForum!) : () => setSearchResult(book)}
                  className={`bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md hover:border-cyan-300 cursor-pointer transition-all duration-200 flex items-start sm:items-center space-x-3 sm:space-x-4 ${hasExistingForum ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-cyan-500'
                    }`}
                >
                  <img
                    src={book.thumbnail}
                    alt={book.title}
                    className="w-10 h-auto sm:w-12 sm:h-auto rounded flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{book.title}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">{book.authors.join(', ')}</p>
                    <p className="text-xs text-gray-500 mt-1">{book.publisher}</p>
                    {hasExistingForum && existingForum!.averageRating && existingForum!.averageRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={existingForum!.averageRating} readonly size="sm" allowHalf />
                        <span className="text-xs text-amber-500 font-semibold ml-1">{existingForum!.averageRating.toFixed(1)}</span>
                        {existingForum!.totalRatings && (
                          <span className="text-xs text-gray-500">({existingForum!.totalRatings})</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end space-y-2">
                    <button
                      onClick={(e) => handleToggleBookmark(book.isbn, e)}
                      className="p-1 hover:bg-cyan-50 rounded transition-colors duration-200"
                      title={bookmarks.has(book.isbn) ? "북마크 해제" : "북마크 추가"}
                    >
                      <BookmarkIcon
                        className="h-4 w-4"
                        filled={bookmarks.has(book.isbn)}
                      />
                    </button>
                    <div>
                      {hasExistingForum ? (
                        <>
                          <p className="text-xs sm:text-sm text-amber-600 font-medium">기존 살롱 참여</p>
                          <p className="text-xs text-gray-500">게시물 {existingForum!.postCount || 0}개</p>
                        </>
                      ) : (
                        <p className="text-xs sm:text-sm text-cyan-600 font-medium">살롱 만들기</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 최근 개설된 살롱 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 최근 개설된 살롱</h2>
        <div className="space-y-3 sm:space-y-4">
          {filteredForums.length > 0 ? (
            filteredForums
              .sort((a, b) => {
                // createdAt 기준으로 정렬 (최신순)
                const aTime = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
                const bTime = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
                return bTime.getTime() - aTime.getTime();
              })
              .slice(0, 5) // 최대 5개만 표시
              .map(forum => (
                <div
                  key={forum.isbn}
                  onClick={() => onSelectForum(forum)}
                  className="bg-white border border-gray-200 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md hover:border-cyan-300 cursor-pointer transition-all duration-200 flex items-start sm:items-center space-x-3 sm:space-x-4"
                >
                  <img
                    src={forum.book.thumbnail}
                    alt={forum.book.title}
                    className="w-10 h-auto sm:w-12 sm:h-auto rounded flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{forum.book.title}</h3>
                      {forum.category && (
                        <span className="px-2 py-1 text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full font-medium">
                          {forum.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">{forum.book.authors.join(', ')}</p>
                    {forum.averageRating && forum.averageRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={forum.averageRating} readonly size="sm" allowHalf />
                        <span className="text-xs text-amber-500 font-semibold ml-1">{forum.averageRating.toFixed(1)}</span>
                        {forum.totalRatings && (
                          <span className="text-xs text-gray-500">({forum.totalRatings})</span>
                        )}
                      </div>
                    )}
                    {forum.tags && forum.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {forum.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-full">
                            #{tag}
                          </span>
                        ))}
                        {forum.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 border border-gray-200 rounded-full">
                            +{forum.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end space-y-2">
                    <button
                      onClick={(e) => handleToggleBookmark(forum.isbn, e)}
                      className="p-1 hover:bg-cyan-50 rounded transition-colors duration-200"
                      title={bookmarks.has(forum.isbn) ? "북마크 해제" : "북마크 추가"}
                    >
                      <BookmarkIcon
                        className={`h-4 w-4 ${bookmarks.has(forum.isbn) ? 'text-amber-500' : 'text-gray-400'} hover:text-amber-500`}
                        filled={bookmarks.has(forum.isbn)}
                      />
                    </button>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">게시물</p>
                      <p className="text-base sm:text-lg font-bold text-cyan-400">{forum.postCount || 0}</p>
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-8 sm:py-10 px-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <p className="text-sm sm:text-base text-gray-700">
                {Object.keys(filterOptions).length > 0
                  ? '필터 조건에 맞는 살롱이 없습니다.'
                  : '아직 만들어진 살롱이 없습니다.'
                }
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {Object.keys(filterOptions).length > 0
                  ? '다른 필터 조건을 시도해보세요.'
                  : 'ISBN 또는 책 제목으로 검색하여 첫 번째 살롱을 만들어보세요.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {searchResult && (
        <CreateForumModal book={searchResult} onClose={() => setSearchResult(null)} onCreate={handleCreateForum} />
      )}
    </div>
  );
};

export default ForumList;
