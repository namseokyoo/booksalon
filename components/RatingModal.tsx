import React, { useState } from 'react';
import StarRating from './StarRating';

interface RatingModalProps {
  /** 현재 평점 (수정 시) */
  currentRating?: number | null;
  /** 책 제목 (표시용) */
  bookTitle?: string;
  /** 제출 핸들러 */
  onSubmit: (rating: number, comment?: string) => void;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

const RatingModal: React.FC<RatingModalProps> = ({
  currentRating,
  bookTitle,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const [rating, setRating] = useState<number>(currentRating || 0);
  const [comment, setComment] = useState<string>('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string>('');

  const handleSubmit = () => {
    if (rating === 0) {
      setSubmitError('평점을 선택해주세요.');
      return;
    }
    setSubmitError('');
    onSubmit(rating, comment.trim() || undefined);
  };

  // 별점 선택 UI (큰 버튼 형태)
  const renderRatingSelector = () => {
    const displayRating = hoverRating !== null ? hoverRating : rating;

    return (
      <div className="flex flex-col items-center gap-4">
        {/* 별점 표시 */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="transition-transform hover:scale-110"
              aria-label={`${star}점`}
            >
              <svg
                className={`w-12 h-12 ${
                  star <= displayRating ? 'text-amber-400' : 'text-gray-300'
                } transition-colors`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>

        {/* 선택한 점수 표시 */}
        <div className="text-center">
          <span className="text-3xl font-bold text-foreground">
            {displayRating > 0 ? displayRating : '-'}
          </span>
          <span className="text-lg text-muted-foreground"> / 5</span>
        </div>

        {/* 점수별 설명 */}
        {displayRating > 0 && (
          <span className="text-sm text-muted-foreground">
            {displayRating === 1 && '별로예요'}
            {displayRating === 2 && '그저 그래요'}
            {displayRating === 3 && '보통이에요'}
            {displayRating === 4 && '좋아요'}
            {displayRating === 5 && '최고예요!'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-xl shadow-xl max-w-md w-full p-6">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {currentRating ? '평점 수정' : '평점 남기기'}
          </h2>
          {bookTitle && (
            <p className="mt-1 text-sm text-muted-foreground truncate">{bookTitle}</p>
          )}
        </div>

        {/* 별점 선택 */}
        <div className="mb-6">
          {renderRatingSelector()}
          {submitError && (
            <p className="text-sm text-destructive text-center mt-2">{submitError}</p>
          )}
        </div>

        {/* 한줄 코멘트 (선택) */}
        <div className="mb-6">
          <label
            htmlFor="rating-comment"
            className="block text-sm font-medium text-surface-foreground mb-2"
          >
            한줄 코멘트 (선택)
          </label>
          <input
            type="text"
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 책에 대한 한마디를 남겨주세요"
            maxLength={100}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted-foreground text-right">
            {comment.length}/100
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-surface-foreground bg-muted rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="flex-1 px-4 py-3 text-cta-foreground bg-cta rounded-lg hover:bg-cta-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                저장 중...
              </span>
            ) : (
              '평점 저장'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
