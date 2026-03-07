import React from 'react';

const MessagingPageSkeleton: React.FC = () => {
  return (
    <div data-testid="messaging-page-skeleton" className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 p-4">
          <div className="w-12 h-12 bg-muted-foreground/20 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-grow">
            <div className="h-4 w-1/3 bg-muted-foreground/20 rounded" />
            <div className="h-3 w-2/3 bg-muted-foreground/15 rounded" />
          </div>
          <div className="h-3 w-10 bg-muted-foreground/10 rounded" />
        </div>
      ))}
    </div>
  );
};

export default MessagingPageSkeleton;
