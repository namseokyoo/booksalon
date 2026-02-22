import React from 'react';
import TagBadge from './TagBadge';

interface TagListProps {
    tags: string[];
    onTagClick?: (tag: string) => void;
    maxDisplay?: number;
    size?: 'sm' | 'md';
    variant?: 'default' | 'clickable';
    className?: string;
}

const TagList: React.FC<TagListProps> = React.memo(({
    tags,
    onTagClick,
    maxDisplay = 5,
    size = 'sm',
    variant = 'default',
    className = ''
}) => {
    if (!tags || tags.length === 0) {
        return null;
    }

    const displayTags = tags.slice(0, maxDisplay);
    const remainingCount = tags.length - maxDisplay;

    return (
        <div className={`flex flex-wrap gap-1 ${className}`}>
            {displayTags.map((tag, index) => (
                <TagBadge
                    key={`${tag}-${index}`}
                    tag={tag}
                    onClick={onTagClick}
                    variant={onTagClick ? 'clickable' : variant}
                    size={size}
                />
            ))}
            {remainingCount > 0 && (
                <span className={`inline-flex items-center rounded-full border bg-gray-100 text-gray-500 border-gray-200 ${
                    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
                }`}>
                    +{remainingCount}
                </span>
            )}
        </div>
    );
});

TagList.displayName = 'TagList';

export default TagList;
