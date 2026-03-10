import React from 'react';
import { BookmarkIcon } from './icons/BookmarkIcon';
import type { Forum } from '../types';

interface SalonCardProps {
  forum: Forum;
  isBookmarked?: boolean;
  onToggleBookmark?: (isbn: string, e: React.MouseEvent) => void;
  onClick?: () => void;
  showBorderAccent?: boolean;
}

const SalonCard: React.FC<SalonCardProps> = ({
  forum,
  isBookmarked = false,
  onToggleBookmark,
  onClick,
  showBorderAccent = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-surface border border-border/60 rounded-xl shadow-sm hover:shadow-lg hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-300 flex flex-row items-center gap-3 p-3 ${
        showBorderAccent ? 'border-l-4 border-l-cta' : ''
      }`}
    >
      <div className="flex-shrink-0 w-12 overflow-hidden rounded-md bg-muted/30">
        <img
          src={forum.book.thumbnail}
          alt={forum.book.title}
          className="w-full h-auto object-contain"
          loading="lazy"
          decoding="async"
          width={48}
          height={72}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground truncate">{forum.book.title}</h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{forum.book.authors.join(', ')}</p>
        <p className="text-xs text-muted-foreground">{forum.book.publisher}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {forum.memberCount && (
            <span aria-label="참여자 수">
              {forum.memberCount}명
            </span>
          )}
          {forum.postCount === 0 && (
            <span className="text-primary-600 font-medium">첫 토론을 시작해보세요</span>
          )}
        </div>
      </div>
      <span className="flex-shrink-0 text-sm font-bold text-foreground pr-1" aria-label="글 수">
        {forum.postCount ?? 0}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleBookmark?.(forum.isbn, e);
        }}
        className="flex-shrink-0 p-2 rounded-full hover:bg-primary-50 transition-colors duration-200 active:scale-90"
        title={isBookmarked ? '북마크 해제' : '북마크 추가'}
      >
        <BookmarkIcon className="h-4 w-4 text-amber-500" filled={isBookmarked} />
      </button>
    </div>
  );
};

export default SalonCard;
