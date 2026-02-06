import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TagService } from '../lib/services';
import { FilterService } from '../lib/services';
import TagBadge from './TagBadge';

interface TagInputProps {
    tags: string[];
    onChange: (tags: string[]) => void;
    maxTags: number;
    type: 'forum' | 'post';
    placeholder?: string;
    className?: string;
}

const TagInput: React.FC<TagInputProps> = ({
    tags,
    onChange,
    maxTags,
    type,
    placeholder = '태그 입력 후 Enter',
    className = ''
}) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);
    const [popularTags, setPopularTags] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    // 인기 태그 로드
    useEffect(() => {
        const loadPopularTags = async () => {
            try {
                // 먼저 DB에서 인기 태그 조회 시도
                const dbTags = await TagService.getPopularTags(type, 10);
                if (dbTags.length > 0) {
                    setPopularTags(dbTags);
                } else {
                    // DB에 태그가 없으면 기본 태그 사용
                    setPopularTags(FilterService.POPULAR_TAGS.slice(0, 10));
                }
            } catch (error) {
                // 오류 시 기본 태그 사용
                setPopularTags(FilterService.POPULAR_TAGS.slice(0, 10));
            }
        };
        loadPopularTags();
    }, [type]);

    // 자동완성 검색 (디바운스 적용)
    const searchTags = useCallback(async (prefix: string) => {
        if (!prefix.trim()) {
            setSuggestions([]);
            return;
        }

        setIsLoadingSuggestions(true);
        try {
            const results = await TagService.searchTags(prefix, type, 5);
            // 이미 추가된 태그 제외
            const filteredResults = results.filter(tag => !tags.includes(tag));
            setSuggestions(filteredResults);
        } catch (error) {
            console.error('태그 검색 실패:', error);
            // 로컬 필터링 fallback
            const localResults = FilterService.POPULAR_TAGS
                .filter(tag =>
                    tag.toLowerCase().includes(prefix.toLowerCase()) &&
                    !tags.includes(tag)
                )
                .slice(0, 5);
            setSuggestions(localResults);
        } finally {
            setIsLoadingSuggestions(false);
        }
    }, [type, tags]);

    // 입력값 변경 처리 (디바운스)
    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (inputValue.trim()) {
            debounceTimeoutRef.current = setTimeout(() => {
                searchTags(inputValue);
            }, 200);
        } else {
            setSuggestions([]);
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [inputValue, searchTags]);

    // 태그 추가
    const addTag = (tag: string) => {
        const trimmedTag = tag.trim();

        // 유효성 검사
        const validation = TagService.validateTag(trimmedTag);
        if (!validation.valid) {
            setError(validation.error || '유효하지 않은 태그입니다.');
            return;
        }

        // 최대 개수 체크
        if (tags.length >= maxTags) {
            setError(`태그는 최대 ${maxTags}개까지 추가할 수 있습니다.`);
            return;
        }

        // 중복 체크
        if (tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase())) {
            setError('이미 추가된 태그입니다.');
            return;
        }

        onChange([...tags, trimmedTag]);
        setInputValue('');
        setSuggestions([]);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        setError(null);
    };

    // 태그 삭제
    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
        setError(null);
    };

    // 키보드 이벤트 처리
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
                addTag(suggestions[selectedSuggestionIndex]);
            } else if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev =>
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            // 입력값이 없을 때 Backspace 누르면 마지막 태그 삭제
            removeTag(tags[tags.length - 1]);
        }
    };

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

    // 추천 태그 클릭
    const handleRecommendedTagClick = (tag: string) => {
        if (!tags.includes(tag) && tags.length < maxTags) {
            addTag(tag);
        }
    };

    // 추천 태그 필터링 (이미 추가된 태그 제외)
    const availableRecommendedTags = popularTags.filter(tag => !tags.includes(tag));

    return (
        <div className={`space-y-3 ${className}`}>
            {/* 태그 입력 영역 */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    태그 ({tags.length}/{maxTags})
                </label>

                {/* 입력된 태그와 입력 필드 */}
                <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-cyan-500 min-h-[42px]">
                    {/* 추가된 태그들 */}
                    {tags.map((tag, index) => (
                        <TagBadge
                            key={`${tag}-${index}`}
                            tag={tag}
                            variant="removable"
                            onRemove={removeTag}
                        />
                    ))}

                    {/* 입력 필드 */}
                    {tags.length < maxTags && (
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                setError(null);
                            }}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder={tags.length === 0 ? placeholder : ''}
                            className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                            maxLength={20}
                        />
                    )}
                </div>

                {/* 자동완성 드롭다운 */}
                {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
                    <div
                        ref={suggestionsRef}
                        className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                    >
                        {isLoadingSuggestions ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                검색 중...
                            </div>
                        ) : (
                            suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => addTag(suggestion)}
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-cyan-50 transition-colors ${
                                        index === selectedSuggestionIndex ? 'bg-cyan-50 text-cyan-700' : 'text-gray-700'
                                    }`}
                                >
                                    #{suggestion}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* 에러 메시지 */}
                {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                )}
            </div>

            {/* 추천 태그 */}
            {availableRecommendedTags.length > 0 && tags.length < maxTags && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">추천 태그</p>
                    <div className="flex flex-wrap gap-2">
                        {availableRecommendedTags.slice(0, 8).map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleRecommendedTagClick(tag)}
                                className="px-2 py-1 text-xs rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50 transition-colors"
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagInput;
