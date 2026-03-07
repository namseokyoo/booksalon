import React from 'react';

const ProfilePageSkeleton: React.FC = () => {
  return (
    <div data-testid="profile-page-skeleton" className="min-h-screen bg-background p-3 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface border border-border rounded-xl p-6 mb-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-muted-foreground/20 rounded-full flex-shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-6 w-40 bg-muted-foreground/20 rounded" />
              <div className="h-4 w-60 bg-muted-foreground/15 rounded" />
              <div className="h-4 w-48 bg-muted-foreground/10 rounded" />
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 flex-1 bg-muted-foreground/15 rounded-md" />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-surface border border-border p-4 rounded-xl animate-pulse space-y-2"
            >
              <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
              <div className="h-3 w-1/2 bg-muted-foreground/15 rounded" />
              <div className="h-3 w-2/3 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;
