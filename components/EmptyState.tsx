import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, message, action }) => {
  return (
    <div className="flex flex-col items-center py-8">
      <div className="text-primary opacity-30 mb-3 w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-muted-foreground text-center">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 text-sm text-primary hover:text-primary-700 font-medium"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
