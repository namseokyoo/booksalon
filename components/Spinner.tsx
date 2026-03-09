import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${sizeMap[size]}`}
    />
  );
};

export default Spinner;
