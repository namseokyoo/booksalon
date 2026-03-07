import React, { useState } from 'react';
import { FilterService, type FilterOptions } from '../lib/services';

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
        <div className="bg-surface rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">필터 및 정렬</h3>
                <div className="flex items-center space-x-2">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground bg-muted hover:bg-muted rounded transition-colors duration-200"
                        >
                            필터 초기화
                        </button>
                    )}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="px-3 py-1 text-sm text-primary hover:text-primary-700 bg-muted hover:bg-muted rounded transition-colors duration-200"
                    >
                        {isExpanded ? '접기' : '펼치기'}
                    </button>
                </div>
            </div>

            {/* 검색 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">검색</label>
                <input
                    type="text"
                    placeholder="제목, 저자, 출판사, 태그로 검색..."
                    className="w-full px-3 py-2 bg-muted border border-border rounded-md text-surface-foreground text-sm focus:ring-ring focus:border-primary focus:outline-none"
                    value={currentOptions.searchTerm || ''}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            {/* 정렬 */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-muted-foreground mb-2">정렬</label>
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
                            className={`px-3 py-1.5 text-sm rounded transition-colors duration-200 ${currentOptions.sortBy === value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-surface-foreground hover:bg-muted'
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
                        <label className="block text-sm font-medium text-muted-foreground mb-2">카테고리</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleCategoryChange('전체')}
                                className={`px-3 py-1.5 text-sm rounded transition-colors duration-200 ${!currentOptions.category
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-surface-foreground hover:bg-muted'
                                    }`}
                            >
                                전체
                            </button>
                            {FilterService.CATEGORIES.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryChange(category)}
                                    className={`px-3 py-1.5 text-sm rounded transition-colors duration-200 ${currentOptions.category === category
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-surface-foreground hover:bg-muted'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 태그 */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">태그</label>
                        <div className="flex flex-wrap gap-2">
                            {FilterService.POPULAR_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    className={`px-3 py-1.5 text-sm rounded transition-colors duration-200 ${currentOptions.tags?.includes(tag)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-surface-foreground hover:bg-muted'
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
