/**
 * Post Image Service - Supabase Storage
 *
 * 북살롱 v0.4.0 - Firebase → Supabase 마이그레이션
 *
 * @description
 * 게시물 이미지 업로드, 삭제, 최적화 기능을 Supabase Storage로 제공합니다.
 * 기존 Firebase Storage 서비스의 인터페이스를 유지하여 마이그레이션 영향 최소화.
 *
 * Storage 버킷: post-images
 * 파일 경로: {auth_uid}/{forum_isbn}/{post_id}/{image_id}.{ext}
 */

import { supabase, getCurrentAuthId } from '../supabase'

// PostImage 타입 정의 (기존 types 폴더의 타입과 호환)
export interface PostImage {
  id: string
  url: string
  width: number
  height: number
  order: number
  thumbnailUrl?: string
}

// 지원하는 이미지 포맷
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
// 최대 파일 크기 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024
// 최대 이미지 크기 (긴 변 기준)
const MAX_IMAGE_DIMENSION = 1200
// 압축 품질
const COMPRESSION_QUALITY = 0.8
// 버킷 이름
const BUCKET_NAME = 'post-images'

export class PostImageService {
  /**
   * 이미지 업로드 (최적화 포함)
   *
   * @param userId - 사용자 ID (auth.uid())
   * @param forumIsbn - 포럼(책) ISBN
   * @param postId - 게시물 ID
   * @param file - 업로드할 이미지 파일
   * @param order - 이미지 순서
   * @param onProgress - 업로드 진행률 콜백 (Supabase는 직접 지원하지 않아 100%로 고정)
   * @returns PostImage 객체
   */
  static async uploadImage(
    userId: string,
    forumIsbn: string,
    postId: string,
    file: File,
    order: number,
    onProgress?: (progress: number) => void
  ): Promise<PostImage> {
    try {
      // 인증 확인
      const authId = await getCurrentAuthId()
      if (!authId || authId !== userId) {
        throw new Error('인증되지 않은 사용자입니다.')
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.')
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('파일 크기는 10MB를 초과할 수 없습니다.')
      }

      // 파일 확장자 검증
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
        throw new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)')
      }

      // 이미지 최적화
      const { optimizedFile, width, height } = await this.optimizeImage(file)

      // 고유 ID 생성
      const imageId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

      // Supabase Storage 파일 경로
      // RLS 정책: post-images/{auth_uid}/{forum_isbn}/{post_id}/{image_id}.jpg
      const filePath = `${userId}/${forumIsbn}/${postId}/${imageId}.jpg`

      // 진행률 시작 (Supabase는 네이티브 진행률 미지원)
      onProgress?.(10)

      // 파일 업로드
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, optimizedFile, {
          contentType: 'image/jpeg',
        })

      if (error) {
        console.error('이미지 업로드 실패:', error)
        throw new Error('이미지 업로드에 실패했습니다.')
      }

      // 진행률 완료
      onProgress?.(100)

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      const postImage: PostImage = {
        id: imageId,
        url: publicUrl,
        width,
        height,
        order,
      }

      return postImage
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      throw error
    }
  }

  /**
   * 이미지 삭제 (URL 기반)
   *
   * @param imageUrl - 삭제할 이미지의 공개 URL
   */
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      if (!imageUrl) return

      // URL에서 파일 경로 추출
      const filePath = this.extractPathFromUrl(imageUrl)
      if (!filePath) {
        console.warn('유효하지 않은 이미지 URL:', imageUrl)
        return
      }

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (error) {
        console.error('이미지 삭제 실패:', error)
        // 삭제 실패해도 계속 진행 (이미지가 이미 삭제되었을 수 있음)
      }
    } catch (error) {
      console.error('이미지 삭제 실패:', error)
    }
  }

  /**
   * 여러 이미지 삭제 (URL 배열)
   *
   * @param imageUrls - 삭제할 이미지 URL 배열
   */
  static async deleteImages(imageUrls: string[]): Promise<void> {
    if (!imageUrls || imageUrls.length === 0) return

    const filePaths = imageUrls
      .map(url => this.extractPathFromUrl(url))
      .filter((path): path is string => path !== null)

    if (filePaths.length === 0) return

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filePaths)

      if (error) {
        console.error('이미지 일괄 삭제 실패:', error)
      }
    } catch (error) {
      console.error('이미지 일괄 삭제 실패:', error)
    }
  }

  /**
   * 게시물의 모든 이미지 삭제 (폴더 기반)
   *
   * @param userId - 사용자 ID
   * @param forumIsbn - 포럼 ISBN
   * @param postId - 게시물 ID
   */
  static async deletePostImages(
    userId: string,
    forumIsbn: string,
    postId: string
  ): Promise<void> {
    try {
      const folderPath = `${userId}/${forumIsbn}/${postId}`

      // 폴더 내 모든 파일 나열
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folderPath)

      if (listError) {
        console.warn('이미지 목록 조회 실패:', listError)
        return
      }

      if (files && files.length > 0) {
        const filesToDelete = files.map(file => `${folderPath}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filesToDelete)

        if (deleteError) {
          console.error('이미지 삭제 실패:', deleteError)
        }
      }
    } catch (error) {
      console.error('게시물 이미지 삭제 실패:', error)
    }
  }

  /**
   * URL에서 Storage 파일 경로 추출
   */
  private static extractPathFromUrl(url: string): string | null {
    try {
      // Supabase Storage 공개 URL 형식:
      // {supabase_url}/storage/v1/object/public/{bucket}/{path}
      const urlObj = new URL(url)
      const pathname = urlObj.pathname

      const bucketPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`
      if (pathname.startsWith(bucketPrefix)) {
        return decodeURIComponent(pathname.substring(bucketPrefix.length))
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * 이미지 최적화 (리사이즈 및 압축)
   *
   * @param file - 원본 파일
   * @returns 최적화된 파일과 크기 정보
   */
  static async optimizeImage(file: File): Promise<{
    optimizedFile: File
    width: number
    height: number
  }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // 긴 변을 기준으로 리사이즈
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width)
            width = MAX_IMAGE_DIMENSION
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height)
            height = MAX_IMAGE_DIMENSION
          }
        }

        canvas.width = width
        canvas.height = height

        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, width, height)

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }
              )
              resolve({ optimizedFile, width, height })
            } else {
              reject(new Error('이미지 최적화 실패'))
            }
          },
          'image/jpeg',
          COMPRESSION_QUALITY
        )
      }

      img.onerror = () => reject(new Error('이미지 로드 실패'))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 파일 유효성 검사
   *
   * @param file - 검사할 파일
   * @returns 유효성 검사 결과
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: '이미지 파일만 업로드 가능합니다.' }
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다.' }
    }

    // 파일 확장자 검증
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      return { valid: false, error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)' }
    }

    return { valid: true }
  }

  /**
   * 이미지 미리보기 URL 생성
   *
   * @param file - 미리보기할 파일
   * @returns 미리보기 URL (Blob URL)
   */
  static createPreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  /**
   * 미리보기 URL 해제
   *
   * @param url - 해제할 Blob URL
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}
