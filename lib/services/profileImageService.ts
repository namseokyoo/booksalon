/**
 * Profile Image Service - Supabase Storage
 *
 * 북살롱 v0.4.0 - Firebase → Supabase 마이그레이션
 *
 * @description
 * 프로필 이미지 업로드, 삭제, 최적화 기능을 Supabase Storage로 제공합니다.
 * 기존 Firebase Storage 서비스의 인터페이스를 유지하여 마이그레이션 영향 최소화.
 *
 * Storage 버킷: profile-images
 * 파일 경로: {auth_uid}/profile.{ext}
 */

import { supabase, getCurrentAuthId } from '../supabase'

// 지원하는 이미지 포맷
const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024
// 프로필 이미지 최대 크기 (픽셀)
const MAX_IMAGE_DIMENSION = 400
// 압축 품질
const COMPRESSION_QUALITY = 0.8
// 버킷 이름
const BUCKET_NAME = 'profile-images'

export class ProfileImageService {
  /**
   * 프로필 이미지 업로드
   *
   * @param userId - 사용자 ID (auth.uid())
   * @param file - 업로드할 이미지 파일
   * @returns 공개 URL
   */
  static async uploadProfileImage(userId: string, file: File): Promise<string> {
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
        throw new Error('파일 크기는 5MB를 초과할 수 없습니다.')
      }

      // 파일 확장자 검증
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
        throw new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)')
      }

      // 이미지 최적화
      const optimizedFile = await this.optimizeImage(file, MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, COMPRESSION_QUALITY)

      // Supabase Storage 파일 경로
      // RLS 정책: profile-images/{auth_uid}/{filename}
      const filePath = `${userId}/profile.${fileExtension}`

      // 기존 이미지 삭제 (있으면)
      await this.deleteProfileImageByPath(userId)

      // 파일 업로드 (upsert로 덮어쓰기)
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: 'image/jpeg',
        })

      if (error) {
        console.error('프로필 이미지 업로드 실패:', error)
        throw new Error('프로필 이미지 업로드에 실패했습니다.')
      }

      // 공개 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error)
      throw error
    }
  }

  /**
   * 프로필 이미지 삭제 (URL 기반)
   *
   * @param imageUrl - 삭제할 이미지의 공개 URL
   */
  static async deleteProfileImage(imageUrl: string): Promise<void> {
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
        console.error('프로필 이미지 삭제 실패:', error)
        // 삭제 실패해도 계속 진행 (이미지가 없을 수도 있음)
      }
    } catch (error) {
      console.error('프로필 이미지 삭제 실패:', error)
    }
  }

  /**
   * 프로필 이미지 삭제 (경로 기반 - 내부 사용)
   *
   * @param userId - 사용자 ID
   */
  private static async deleteProfileImageByPath(userId: string): Promise<void> {
    try {
      // 사용자 폴더 내 모든 파일 나열
      const { data: files, error: listError } = await supabase.storage
        .from(BUCKET_NAME)
        .list(userId)

      if (listError) {
        console.warn('기존 이미지 목록 조회 실패:', listError)
        return
      }

      if (files && files.length > 0) {
        const filesToDelete = files.map(file => `${userId}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove(filesToDelete)

        if (deleteError) {
          console.warn('기존 이미지 삭제 실패:', deleteError)
        }
      }
    } catch (error) {
      console.warn('기존 프로필 이미지 삭제 중 오류:', error)
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
   * 기본 프로필 이미지 URL 생성 (이니셜 기반 SVG)
   *
   * @param nickname - 사용자 닉네임
   * @returns 데이터 URL (SVG)
   */
  static generateDefaultProfileImageUrl(nickname: string): string {
    const safeName = (nickname || 'U').trim()
    const initial = safeName.charAt(0).toUpperCase() || 'U'

    // WCAG 대비 양호 색상 팔레트
    const colorHexList = [
      'EF4444', // red-500
      '3B82F6', // blue-500
      '10B981', // green-500
      'F59E0B', // yellow-500
      '8B5CF6', // violet-500
      'EC4899', // pink-500
      '6366F1', // indigo-500
      '14B8A6', // teal-500
    ]

    const code = initial.charCodeAt(0) || 65
    const colorHex = colorHexList[code % colorHexList.length]

    // SVG 데이터 URL 생성
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="#${colorHex}" />
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
      </svg>
    `

    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  /**
   * 이미지 최적화 (리사이즈 및 압축)
   *
   * @param file - 원본 파일
   * @param maxWidth - 최대 너비
   * @param maxHeight - 최대 높이
   * @param quality - 압축 품질 (0-1)
   * @returns 최적화된 파일
   */
  static async optimizeImage(
    file: File,
    maxWidth: number = MAX_IMAGE_DIMENSION,
    maxHeight: number = MAX_IMAGE_DIMENSION,
    quality: number = COMPRESSION_QUALITY
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // 원본 비율 유지하면서 크기 조정
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
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
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(optimizedFile)
            } else {
              reject(new Error('이미지 최적화 실패'))
            }
          },
          'image/jpeg',
          quality
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
      return { valid: false, error: '파일 크기는 5MB를 초과할 수 없습니다.' }
    }

    // 파일 확장자 검증
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !SUPPORTED_FORMATS.includes(fileExtension)) {
      return { valid: false, error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)' }
    }

    return { valid: true }
  }
}
