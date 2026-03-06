import React, { useState } from 'react';

interface StarRatingProps {
  /** 현재 평점 값 (0-5, 0.5 단위 지원) */
  value: number;
  /** 평점 변경 핸들러 (없으면 읽기 전용) */
  onChange?: (rating: number) => void;
  /** 별 크기 (sm, md, lg) */
  size?: 'sm' | 'md' | 'lg';
  /** 읽기 전용 모드 */
  readonly?: boolean;
  /** 반점 표시 지원 (읽기 전용 모드에서만) */
  allowHalf?: boolean;
  /** 평점 수 표시 텍스트 */
  countText?: string;
  /** 커스텀 클래스 */
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 'md',
  readonly = false,
  allowHalf = true,
  countText,
  className = '',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  // 사이즈별 클래스
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const starSize = sizeClasses[size];

  // 현재 표시할 값 (호버 중이면 호버 값, 아니면 실제 값)
  const displayValue = hoverValue !== null ? hoverValue : value;

  // 별 하나 렌더링 (채움 비율에 따라)
  const renderStar = (index: number) => {
    const starValue = index + 1;
    const fillRatio = Math.min(Math.max(displayValue - index, 0), 1);

    // 읽기 전용일 때 반점 표시
    const showHalf = readonly && allowHalf && fillRatio > 0 && fillRatio < 1;

    return (
      <button
        key={index}
        type="button"
        disabled={readonly}
        onClick={() => !readonly && onChange?.(starValue)}
        onMouseEnter={() => !readonly && setHoverValue(starValue)}
        onMouseLeave={() => !readonly && setHoverValue(null)}
        className={`relative transition-transform ${
          readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
        }`}
        aria-label={`${starValue}점`}
      >
        {/* 배경 별 (회색) */}
        <svg
          className={`${starSize} text-rating-muted`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>

        {/* 채워진 별 (클리핑 사용) */}
        {fillRatio > 0 && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: showHalf ? '50%' : fillRatio >= 1 ? '100%' : '0%' }}
          >
            <svg
              className={`${starSize} text-rating`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>
      {countText && (
        <span className="ml-2 text-sm text-muted-foreground">{countText}</span>
      )}
    </div>
  );
};

export default StarRating;
