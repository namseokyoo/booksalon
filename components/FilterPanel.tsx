import React, { useState } from 'react';
import type { FilterOptions } from '../services/filterService';
import { FilterService } from '../services/filterService';

interface FilterPanelProps {
    onFilterChange: (options: FilterOptions) => void;
    currentOptions: FilterOptions;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange, currentOptions }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleCategoryChange = (category: string) => {
        onFilterChange({
            ...currentOptions,
            category: category === '전체' ? undefined : category
        });
    };

    const handleTagToggle = (tag: string) => {
        const currentTags = currentOptions.tags || [];
        const newTags = currentTags.includes(tag)
            ? currentTags.filter(t => t !== tag)
            : [...currentTags, tag];

        onFilterChange({
            ...currentOptions,
            tags: newTags.length > 0 ? newTags : undefined
        });
    };

    const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
        onFilterChange({
            ...currentOptions,
            sortBy
        });
    };

    const handleSearchChange = (searchTerm: string) => {
        onFilterChange({
            ...currentOptions,
            searchTerm: searchTerm.trim() || undefined
        });
    };

    const clearFilters = () => {
        onFilterChange({});
    };

    const hasActiveFilters = currentOptions.category ||
        (currentOptions.tags && currentOptions.tags.length > 0) ||
        currentOptions.sortBy ||
        currentOptions.searchTerm;

    return (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">필터 및 정렬</h3>
                <div className="flex items-center space-x-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
                        >
                            필터 초기화
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-3 py-1 text-xs text-cyan-400 hover:text-cyan-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                        {isExpanded ? '접기' : '펼치기'}
                    </button>
                </div>
            </div>

            {/* 검색 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">검색</label>
                <input
                    type="text"
                    placeholder="제목, 저자, 출판사, 태그로 검색..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-200 text-sm focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                    value={currentOptions.searchTerm || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            {/* 정렬 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">정렬</label>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'recent', label: '최근 활동' },
                        { value: 'popular', label: '인기순' },
                        { value: 'posts', label: '게시물 많은 순' },
                        { value: 'title', label: '제목순' }
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            onClick={() => handleSortChange(value as FilterOptions['sortBy'])}
                            className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${currentOptions.sortBy === value
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* 카테고리 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">카테고리</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleCategoryChange('전체')}
                                className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${!currentOptions.category
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                전체
                            </button>
                            {FilterService.CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${currentOptions.category === category
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 태그 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">태그</label>
                        <div className="flex flex-wrap gap-2">
                            {FilterService.POPULAR_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${currentOptions.tags?.includes(tag)
                                            ? 'bg-yellow-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default FilterPanel;
