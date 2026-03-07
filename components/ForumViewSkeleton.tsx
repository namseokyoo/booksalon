import React from 'react';

const ForumViewSkeleton: React.FC = () => {
  return (
    <div data-testid="forum-view-skeleton" className="max-w-4xl mx-auto p-3 sm:p-6 lg:p-8">
      <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex gap-4 animate-pulse">
        <div className="w-16 h-22 bg-muted-foreground/20 rounded-lg flex-shrink-0" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-5 w-3/4 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-1/2 bg-muted-foreground/15 rounded" />
          <div className="h-4 w-2/3 bg-muted-foreground/10 rounded" />
        </div>
      </div>

      <div className="flex gap-2 mb-6 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted-foreground/20 rounded-full" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface border border-border p-3 sm:p-4 rounded-xl animate-pulse space-y-2"
          >
            <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
            <div className="h-3 w-1/2 bg-muted-foreground/15 rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-10 bg-muted-foreground/10 rounded-full" />
              <div className="h-5 w-16 bg-muted-foreground/10 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForumViewSkeleton;
