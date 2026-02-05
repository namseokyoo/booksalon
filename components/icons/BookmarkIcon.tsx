import React from 'react';

interface BookmarkIconProps {
    className?: string;
    filled?: boolean;
}

export const BookmarkIcon: React.FC<BookmarkIconProps> = ({ className = "h-5 w-5", filled = false }) => {
    if (filled) {
        return (
            <svg className={className} fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
        );
    }

    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
    );
};
