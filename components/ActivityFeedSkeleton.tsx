import React from 'react';

const ActivityFeedSkeleton: React.FC = () => {
  return (
    <div data-testid="activity-feed-skeleton" className="bg-surface rounded-lg p-6">
      <div className="flex gap-2 mb-4 animate-pulse">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted-foreground/15 rounded-md" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-start gap-3 py-3 border-b border-border last:border-0"
          >
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-grow">
              <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
              <div className="h-3 w-1/2 bg-muted-foreground/15 rounded" />
            </div>
            <div className="h-3 w-16 bg-muted-foreground/10 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeedSkeleton;
