import React from 'react';

const NotificationSkeleton: React.FC = () => {
  return (
    <div data-testid="notification-skeleton" className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 animate-pulse">
          <div className="h-7 w-24 bg-muted-foreground/20 rounded" />
        </div>

        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border p-4 rounded-xl animate-pulse flex items-start gap-3"
            >
              <div className="w-10 h-10 bg-muted-foreground/20 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-2 flex-grow">
                <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
                <div className="h-3 w-1/2 bg-muted-foreground/15 rounded" />
                <div className="h-3 w-20 bg-muted-foreground/10 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSkeleton;
