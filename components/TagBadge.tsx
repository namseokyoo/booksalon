import React from 'react';

interface TagBadgeProps {
    tag: string;
    onClick?: (tag: string) => void;
    onRemove?: (tag: string) => void;
    variant?: 'default' | 'clickable' | 'removable';
    size?: 'sm' | 'md';
    className?: string;
}

const TagBadge: React.FC<TagBadgeProps> = ({
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
        default: 'bg-gray-100 text-gray-700 border-gray-200',
        clickable: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300 cursor-pointer',
        removable: 'bg-cyan-50 text-cyan-700 border-cyan-200 pr-1'
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
                    className="ml-1 p-0.5 rounded-full hover:bg-cyan-200 transition-colors"
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
};

export default TagBadge;
