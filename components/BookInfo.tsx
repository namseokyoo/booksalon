import React, { useState, useEffect } from 'react';
import type { Book, Forum, RatingDistribution as RatingDistributionType } from '../types';
import { RatingService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import StarRating from './StarRating';
import RatingDistribution from './RatingDistribution';
import RatingModal from './RatingModal';

interface BookInfoProps {
  book: Book;
  forum?: Forum;
}

const BookInfo: React.FC<BookInfoProps> = ({ book, forum }) => {
  const [myRating, setMyRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [distribution, setDistribution] = useState<RatingDistributionType>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });
  const [showDistribution, setShowDistribution] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    const loadRatings = async () => {
      if (!forum?.isbn) return;

      try {
        // 평균 평점과 총 평가 수 로드
        const avg = await RatingService.getAverageRating(forum.isbn);
        setAverageRating(avg.average);
        setTotalRatings(avg.total);

        // 평점 분포 로드
        const dist = await RatingService.getRatingDistribution(forum.isbn);
        setDistribution(dist);

        // 로그인한 사용자의 평점 로드
        if (currentUser) {
          const userRating = await RatingService.getUserRating(
            forum.isbn,
            userProfile?.id || ''
          );
          setMyRating(userRating);
        }
      } catch (error) {
        console.error('평점 로딩 실패:', error);
      }
    };

    loadRatings();
  }, [forum?.isbn, currentUser]);

  const handleRatingSubmit = async (rating: number, comment?: string) => {
    if (!currentUser || !forum?.isbn) {
      alert('평점을 주시려면 로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await RatingService.setUserRating(forum.isbn, userProfile?.id || '', rating);
      setMyRating(rating);
      setShowRatingModal(false);

      // 평균 평점과 분포 다시 로드
      const avg = await RatingService.getAverageRating(forum.isbn);
      setAverageRating(avg.average);
      setTotalRatings(avg.total);

      const dist = await RatingService.getRatingDistribution(forum.isbn);
      setDistribution(dist);
    } catch (error) {
      console.error('평점 저장 실패:', error);
      alert('평점 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
        <img
          src={book.thumbnail || 'https://picsum.photos/120/174'}
          alt={`${book.title} 표지`}
          className="w-20 h-auto sm:w-24 sm:h-auto lg:w-32 lg:h-auto rounded-lg shadow-md flex-shrink-0 mx-auto sm:mx-0"
        />
        <div className="flex-grow text-center sm:text-left w-full">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            {book.title}
          </h2>
          <p className="text-sm sm:text-md text-gray-600 mt-1">
            {book.authors.join(', ')}
          </p>
          <p className="text-xs sm:text-sm text-gray-500">{book.publisher}</p>

          {/* 평점 요약 (클릭하면 분포 토글) */}
          {totalRatings > 0 && (
            <button
              type="button"
              onClick={() => setShowDistribution(!showDistribution)}
              className="mt-2 flex items-center gap-2 text-sm text-gray-700 hover:text-cyan-600 transition-colors mx-auto sm:mx-0"
            >
              <StarRating
                value={averageRating}
                readonly
                size="sm"
                allowHalf
              />
              <span className="font-semibold">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-gray-500">({totalRatings}명 평가)</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showDistribution ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}

          {/* 평점 분포 차트 (토글) */}
          {showDistribution && totalRatings > 0 && (
            <div className="mt-3">
              <RatingDistribution
                distribution={distribution}
                averageRating={averageRating}
                totalRatings={totalRatings}
              />
            </div>
          )}

          <p className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 line-clamp-2 sm:line-clamp-3">
            {book.contents}
          </p>
        </div>
      </div>

      {/* 내 평점 섹션 */}
      {currentUser && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {myRating ? (
            // 이미 평점을 준 경우
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-sm text-gray-700 font-medium">
                    내 평점
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating value={myRating} readonly size="sm" />
                    <span className="text-2xl font-bold text-gray-900">
                      {myRating}.0
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="px-3 py-1.5 text-sm text-cyan-600 hover:text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 transition-colors"
              >
                수정
              </button>
            </div>
          ) : (
            // 아직 평점을 주지 않은 경우
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-700 mb-3">
                이 책은 어떠셨나요?
              </p>
              <button
                type="button"
                onClick={() => setShowRatingModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                평점 남기기
              </button>
            </div>
          )}
        </div>
      )}

      {/* 비로그인 사용자 */}
      {!currentUser && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            로그인하면 평점을 남길 수 있습니다.
          </p>
        </div>
      )}

      {/* 평점 입력 모달 */}
      {showRatingModal && (
        <RatingModal
          currentRating={myRating}
          bookTitle={book.title}
          onSubmit={handleRatingSubmit}
          onClose={() => setShowRatingModal(false)}
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
};

export default BookInfo;
