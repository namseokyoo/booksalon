import React, { useState, useCallback, useEffect } from 'react';
import type { PostImage } from '../types';

interface ImageGalleryProps {
  images: PostImage[];
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, className = '' }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 정렬된 이미지 목록
  const sortedImages = [...images].sort((a, b) => a.order - b.order);

  // 라이트박스 열기
  const openLightbox = useCallback((index: number) => {
    setSelectedIndex(index);
    setIsLoading(true);
  }, []);

  // 라이트박스 닫기
  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  // 이전 이미지
  const goToPrevious = useCallback(() => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      setIsLoading(true);
    }
  }, [selectedIndex]);

  // 다음 이미지
  const goToNext = useCallback(() => {
    if (selectedIndex !== null && selectedIndex < sortedImages.length - 1) {
      setSelectedIndex(selectedIndex + 1);
      setIsLoading(true);
    }
  }, [selectedIndex, sortedImages.length]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, closeLightbox, goToPrevious, goToNext]);

  // 스크롤 방지
  useEffect(() => {
    if (selectedIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedIndex]);

  if (images.length === 0) return null;

  // 이미지 레이아웃 결정
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      default:
        return 'grid-cols-2 sm:grid-cols-3';
    }
  };

  return (
    <>
      {/* 이미지 갤러리 그리드 */}
      <div className={`grid ${getGridClass()} gap-2 ${className}`}>
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className={`
              relative overflow-hidden rounded-lg cursor-pointer
              bg-muted transition-transform hover:scale-[1.02]
              ${images.length === 1 ? 'aspect-[4/3] max-h-80' : 'aspect-square'}
            `}
            onClick={() => openLightbox(index)}
          >
            <img
              src={image.url}
              alt={`${index + 1}번째 이미지`}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* 라이트박스 */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 이전 버튼 */}
          {selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors z-10"
              aria-label="이전 이미지"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* 다음 버튼 */}
          {selectedIndex < sortedImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-colors z-10"
              aria-label="다음 이미지"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* 메인 이미지 */}
          <div
            className="max-w-[90vw] max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={sortedImages[selectedIndex].url}
              alt={`${selectedIndex + 1}번째 이미지`}
              className={`max-w-full max-h-[85vh] object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
              onLoad={() => setIsLoading(false)}
              decoding="async"
            />
          </div>

          {/* 페이지 인디케이터 */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                    setIsLoading(true);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedIndex
                      ? 'bg-white'
                      : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                  }`}
                  aria-label={`이미지 ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* 이미지 카운터 */}
          <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
            {selectedIndex + 1} / {sortedImages.length}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;
