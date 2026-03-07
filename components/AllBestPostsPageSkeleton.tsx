import React from 'react';

const AllBestPostsPageSkeleton: React.FC = () => {
  return (
    <div
      data-testid="all-best-posts-page-skeleton"
      className="max-w-4xl mx-auto p-3 sm:p-6 lg:p-8"
    >
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-48 bg-muted-foreground/20 rounded" />
      </div>

      <div className="flex gap-2 mb-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted-foreground/15 rounded-full" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border p-4 rounded-xl animate-pulse">
            <div className="flex gap-3">
              <div className="flex-grow space-y-2">
                <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-1/2 bg-muted-foreground/15 rounded" />
                <div className="h-3 w-1/3 bg-muted-foreground/10 rounded" />
                <div className="flex gap-3">
                  <div className="h-4 w-12 bg-muted-foreground/10 rounded" />
                  <div className="h-4 w-12 bg-muted-foreground/10 rounded" />
                </div>
              </div>
              <div className="h-3 w-16 bg-muted-foreground/10 rounded flex-shrink-0 mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllBestPostsPageSkeleton;
