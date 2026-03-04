import React from 'react';

const ForumListSkeleton: React.FC = () => {
  return (
    <div data-testid="forum-list-skeleton" className="max-w-4xl mx-auto p-3 sm:p-6 lg:p-8">
      {/* 히어로 섹션 스켈레톤 */}
      <div className="mb-6 sm:mb-8 bg-muted rounded-2xl px-6 py-10 sm:px-10 sm:py-14 animate-pulse">
        <div className="flex justify-center mb-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-muted-foreground/20 rounded-full" />
        </div>
        <div className="h-7 sm:h-9 bg-muted-foreground/20 rounded-lg mx-auto max-w-xs mb-3" />
        <div className="h-5 bg-muted-foreground/15 rounded-lg mx-auto max-w-sm mb-2" />
        <div className="h-5 bg-muted-foreground/15 rounded-lg mx-auto max-w-[280px] mb-6" />
        <div className="h-11 w-36 bg-muted-foreground/20 rounded-full mx-auto" />
      </div>

      {/* 검색바 스켈레톤 */}
      <div className="mb-4 sm:mb-6 py-3 sm:py-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-2" />
        <div className="h-10 bg-muted rounded-lg" />
      </div>

      {/* 필터 바 스켈레톤 */}
      <div className="bg-muted rounded-lg mb-6 animate-pulse">
        <div className="p-3 sm:p-4 flex items-center justify-between">
          <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-4 bg-muted-foreground/20 rounded" />
        </div>
      </div>

      {/* 카드 5장 스켈레톤 */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border p-3 sm:p-4 rounded-xl flex items-start sm:items-center space-x-3 sm:space-x-4 animate-pulse"
          >
            {/* 좌측 썸네일 — 실제 카드와 동일한 크기 */}
            <div className="flex-shrink-0 w-10 h-14 sm:w-12 sm:h-16 bg-muted-foreground/20 rounded-lg" />

            {/* 중앙 텍스트 라인 */}
            <div className="flex-grow min-w-0 space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
              <div className="h-3.5 bg-muted-foreground/15 rounded w-1/2" />
              <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-muted-foreground/15 rounded-full" />
                <div className="h-5 w-14 bg-muted-foreground/15 rounded-full" />
              </div>
            </div>

            {/* 우측 액션 영역 */}
            <div className="flex-shrink-0 flex flex-col items-end space-y-2">
              <div className="h-3 w-16 bg-muted-foreground/15 rounded" />
              <div className="h-8 w-8 bg-muted-foreground/15 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumListSkeleton;
