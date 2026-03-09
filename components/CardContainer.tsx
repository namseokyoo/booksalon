import React from 'react';

interface CardContainerProps {
  children: React.ReactNode;
  variant?: 'surface' | 'muted';
  hover?: boolean;
  onClick?: () => void;
  className?: string;
}

const CardContainer: React.FC<CardContainerProps> = ({
  children,
  variant = 'surface',
  hover = false,
  onClick,
  className = '',
}) => {
  const isHoverable = hover || !!onClick;

  const baseClass =
    variant === 'surface'
      ? 'bg-surface border border-border/60 rounded-xl shadow-sm'
      : 'bg-muted border border-border rounded-xl';

  const hoverClass = isHoverable
    ? 'hover:shadow-lg hover:border-primary-300 hover:bg-primary-50/30 cursor-pointer transition-all duration-300'
    : '';

  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 ${baseClass} ${hoverClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default CardContainer;
