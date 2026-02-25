import React from 'react';

interface TagBadgeProps {
    tag: string;
    onClick?: (tag: string) => void;
    onRemove?: (tag: string) => void;
    variant?: 'default' | 'clickable' | 'removable';
    size?: 'sm' | 'md';
    className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = React.memo(({
    tag,
    onClick,
    onRemove,
    variant = 'default',
    size = 'sm',
    className = ''
}) => {
    const baseClasses = `inline-flex items-center rounded-full border transition-colors duration-200`;

    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-3 py-1 text-sm';

    const variantClasses = {
        default: 'bg-muted text-surface-foreground border-border',
        clickable: 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100 hover:border-primary-300 cursor-pointer',
        removable: 'bg-primary-50 text-primary-700 border-primary-200 pr-1'
    };

    const handleClick = () => {
        if (variant === 'clickable' && onClick) {
            onClick(tag);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRemove) {
            onRemove(tag);
        }
    };

    return (
        <span
            className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}
            onClick={handleClick}
            role={variant === 'clickable' ? 'button' : undefined}
            tabIndex={variant === 'clickable' ? 0 : undefined}
        >
            <span className="font-medium">#{tag}</span>
            {variant === 'removable' && onRemove && (
                <button
                    type="button"
                    onClick={handleRemove}
                    className="ml-1 p-0.5 rounded-full hover:bg-primary-200 transition-colors"
                    aria-label={`${tag} 태그 삭제`}
                >
                    <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            )}
        </span>
    );
});

TagBadge.displayName = 'TagBadge';

export default TagBadge;
