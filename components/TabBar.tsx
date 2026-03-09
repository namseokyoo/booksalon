import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={
            tab.id === activeTab
              ? 'bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex items-center gap-1'
              : 'bg-transparent text-muted-foreground rounded-full px-4 py-2 text-sm font-medium hover:bg-muted transition-colors duration-200 whitespace-nowrap flex items-center gap-1'
          }
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && <span>({tab.count})</span>}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
