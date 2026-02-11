import React from 'react';
import type { RatingDistribution as RatingDistributionType } from '../types';
import StarRating from './StarRating';

interface RatingDistributionProps {
  /** 평점 분포 데이터 */
  distribution: RatingDistributionType;
  /** 평균 평점 */
  averageRating: number;
  /** 총 평가 수 */
  totalRatings: number;
  /** 컴팩트 모드 (작은 공간에 표시) */
  compact?: boolean;
  /** 커스텀 클래스 */
  className?: string;
}

const RatingDistribution: React.FC<RatingDistributionProps> = ({
  distribution,
  averageRating,
  totalRatings,
  compact = false,
  className = '',
}) => {
  // 최대 개수 계산 (막대 비율 계산용)
  const distributionValues = [
    distribution[1],
    distribution[2],
    distribution[3],
    distribution[4],
    distribution[5],
  ];
  const maxCount = Math.max(...distributionValues, 1);

  // 5점부터 1점 순서로 표시
  const ratingLevels = [5, 4, 3, 2, 1] as const;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-1">
          <StarRating value={averageRating} readonly size="sm" allowHalf />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({totalRatings}명)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-xl p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 왼쪽: 평균 평점 */}
        <div className="flex flex-col items-center justify-center sm:pr-4 sm:border-r sm:border-gray-200">
          <span className="text-4xl font-bold text-gray-900">
            {averageRating.toFixed(1)}
          </span>
          <StarRating value={averageRating} readonly size="sm" allowHalf />
          <span className="mt-1 text-sm text-gray-500">
            {totalRatings}명 평가
          </span>
        </div>

        {/* 오른쪽: 분포 차트 */}
        <div className="flex-1 space-y-2">
          {ratingLevels.map((rating) => {
            const count = distribution[rating];
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            const barWidth = totalRatings > 0 ? (count / maxCount) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2">
                {/* 점수 라벨 */}
                <div className="flex items-center gap-1 w-12 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700">
                    {rating}점
                  </span>
                </div>

                {/* 막대 그래프 */}
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* 개수/퍼센트 */}
                <div className="w-16 text-right flex-shrink-0">
                  <span className="text-xs text-gray-600">
                    {count}명
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingDistribution;
