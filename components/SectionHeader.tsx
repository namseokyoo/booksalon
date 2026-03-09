import React from 'react';

interface SectionHeaderProps {
  title: string;
  onMore?: () => void;
  moreLabel?: string;
  rightElement?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onMore,
  moreLabel = '더보기 >',
  rightElement,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {rightElement ? (
        rightElement
      ) : onMore ? (
        <button
          type="button"
          onClick={onMore}
          className="text-sm text-primary hover:text-primary-700 cursor-pointer"
        >
          {moreLabel}
        </button>
      ) : null}
    </div>
  );
};

export default SectionHeader;
