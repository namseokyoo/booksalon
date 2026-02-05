import React from 'react';

interface SearchSuggestionsProps {
  recentSearches: string[];
  popularSearches: string[];
  suggestions: string[];
  searchTerm: string;
  isLoading: boolean;
  onSelectSuggestion: (term: string) => void;
  onRemoveHistory: (term: string) => void;
  onClearHistory: () => void;
}

/**
 * 검색 자동완성 및 추천 검색어 드롭다운 컴포넌트
 */
const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  recentSearches,
  popularSearches,
  suggestions,
  searchTerm,
  isLoading,
  onSelectSuggestion,
  onRemoveHistory,
  onClearHistory,
}) => {
  // 검색어가 있으면 자동완성 결과 표시, 없으면 최근/인기 검색어 표시
  const showAutoComplete = searchTerm.trim().length > 0;

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
          <span className="ml-2 text-sm text-gray-500">검색 중...</span>
        </div>
      </div>
    );
  }

  if (showAutoComplete) {
    // 자동완성 결과
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`suggestion-${index}`}
              type="button"
              onClick={() => onSelectSuggestion(suggestion)}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="truncate">{suggestion}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 최근 검색어 + 인기 검색어
  const hasRecentSearches = recentSearches.length > 0;
  const hasPopularSearches = popularSearches.length > 0;

  if (!hasRecentSearches && !hasPopularSearches) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="max-h-80 overflow-y-auto">
        {/* 최근 검색어 */}
        {hasRecentSearches && (
          <div className="border-b border-gray-100 last:border-b-0">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
              <span className="text-xs font-medium text-gray-500">최근 검색</span>
              <button
                type="button"
                onClick={onClearHistory}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                전체 삭제
              </button>
            </div>
            <div>
              {recentSearches.map((term, index) => (
                <div
                  key={`recent-${index}`}
                  className="flex items-center hover:bg-gray-50 group"
                >
                  <button
                    type="button"
                    onClick={() => onSelectSuggestion(term)}
                    className="flex-1 px-4 py-2.5 text-left text-sm text-gray-700 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="truncate">{term}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveHistory(term);
                    }}
                    className="p-2 mr-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`${term} 삭제`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 인기 검색어 */}
        {hasPopularSearches && (
          <div>
            <div className="px-4 py-2 bg-gray-50">
              <span className="text-xs font-medium text-gray-500">인기 검색어</span>
            </div>
            <div>
              {popularSearches.map((term, index) => (
                <button
                  key={`popular-${index}`}
                  type="button"
                  onClick={() => onSelectSuggestion(term)}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-2"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-cyan-600 bg-cyan-50 rounded-full flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="truncate">{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchSuggestions;
