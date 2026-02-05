import React, { useState, useRef, useCallback } from 'react';
import { PostImageService } from '../lib/services';

interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  uploaded: boolean;
  error?: string;
}

interface ImageUploaderProps {
  images: ImagePreview[];
  onChange: (images: ImagePreview[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 3,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxImages - images.length;

    if (remainingSlots <= 0) {
      alert(`최대 ${maxImages}장까지 업로드 가능합니다.`);
      return;
    }

    const filesToAdd = fileArray.slice(0, remainingSlots);
    const newImages: ImagePreview[] = [];

    for (const file of filesToAdd) {
      const validation = PostImageService.validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = PostImageService.createPreviewUrl(file);

      newImages.push({
        id,
        file,
        previewUrl,
        progress: 0,
        uploaded: false,
      });
    }

    if (newImages.length > 0) {
      onChange([...images, ...newImages]);
    }
  }, [images, maxImages, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled, handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleRemoveImage = useCallback((id: string) => {
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      PostImageService.revokePreviewUrl(imageToRemove.previewUrl);
    }
    onChange(images.filter(img => img.id !== id));
  }, [images, onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        이미지 (최대 {maxImages}장)
      </label>

      {/* 이미지 미리보기 그리드 */}
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
          >
            <img
              src={image.previewUrl}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* 진행률 오버레이 */}
            {!image.uploaded && image.progress > 0 && image.progress < 100 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-xs font-medium">
                  {Math.round(image.progress)}%
                </div>
              </div>
            )}

            {/* 에러 표시 */}
            {image.error && (
              <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center p-2">
                <span className="text-white text-xs text-center">{image.error}</span>
              </div>
            )}

            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => handleRemoveImage(image.id)}
              className="absolute top-1 right-1 w-6 h-6 bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="이미지 삭제"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 순서 표시 */}
            <div className="absolute bottom-1 left-1 w-5 h-5 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {index + 1}
            </div>
          </div>
        ))}

        {/* 이미지 추가 버튼 */}
        {canAddMore && (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              w-24 h-24 sm:w-28 sm:h-28 rounded-lg border-2 border-dashed
              flex flex-col items-center justify-center cursor-pointer
              transition-colors
              ${isDragOver
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-gray-300 hover:border-cyan-400 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <svg
              className={`w-8 h-8 ${isDragOver ? 'text-cyan-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className={`text-xs mt-1 ${isDragOver ? 'text-cyan-500' : 'text-gray-500'}`}>
              추가
            </span>
          </div>
        )}
      </div>

      {/* 파일 입력 (숨김) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* 안내 텍스트 */}
      <p className="text-xs text-gray-500">
        JPG, PNG, GIF, WebP / 최대 5MB / 드래그 앤 드롭 가능
      </p>
    </div>
  );
};

export default ImageUploader;

// 헬퍼 타입 export
export type { ImagePreview };
