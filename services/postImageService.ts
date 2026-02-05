import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import type { PostImage } from '../types';

// 지원하는 이미지 포맷
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// 최대 이미지 크기 (긴 변 기준)
const MAX_IMAGE_DIMENSION = 1200;
// 압축 품질
const COMPRESSION_QUALITY = 0.8;

export class PostImageService {
  /**
   * 이미지 업로드 (최적화 포함)
   */
  static async uploadImage(
    forumId: string,
    postId: string,
    file: File,
    order: number,
    onProgress?: (progress: number) => void
  ): Promise<PostImage> {
    try {
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
      }

      // 파일 확장자 검증
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
        throw new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)');
      }

      // 이미지 최적화
      const { optimizedFile, width, height } = await this.optimizeImage(file);

      // 고유 ID 생성
      const imageId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Firebase Storage 경로 설정
      const fileName = `${imageId}.jpg`;
      const storageRef = ref(storage, `posts/${forumId}/${postId}/images/${fileName}`);

      // 파일 업로드 (진행률 콜백 지원)
      const uploadTask = uploadBytesResumable(storageRef, optimizedFile);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('이미지 업로드 실패:', error);
            reject(new Error('이미지 업로드에 실패했습니다.'));
          },
          async () => {
            try {
              // 다운로드 URL 가져오기
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const postImage: PostImage = {
                id: imageId,
                url: downloadURL,
                width,
                height,
                order,
              };

              resolve(postImage);
            } catch (error) {
              reject(new Error('이미지 URL을 가져오는데 실패했습니다.'));
            }
          }
        );
      });
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      throw error;
    }
  }

  /**
   * 이미지 삭제
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl) return;

      // URL에서 Storage 참조 생성
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      // 삭제 실패해도 계속 진행 (이미지가 이미 삭제되었을 수 있음)
    }
  }

  /**
   * 여러 이미지 삭제
   */
  static async deleteImages(imageUrls: string[]): Promise<void> {
    await Promise.all(imageUrls.map(url => this.deleteImage(url)));
  }

  /**
   * 이미지 최적화 (리사이즈 및 압축)
   */
  static async optimizeImage(file: File): Promise<{ optimizedFile: File; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // 긴 변을 기준으로 리사이즈
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve({ optimizedFile, width, height });
            } else {
              reject(new Error('이미지 최적화 실패'));
            }
          },
          'image/jpeg',
          COMPRESSION_QUALITY
        );
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 파일 유효성 검사
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: '이미지 파일만 업로드 가능합니다.' };
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' };
    }

    // 파일 확장자 검증
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      return { valid: false, error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)' };
    }

    return { valid: true };
  }

  /**
   * 이미지 미리보기 URL 생성
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * 미리보기 URL 해제
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
