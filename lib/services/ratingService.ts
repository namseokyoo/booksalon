/**
 * Rating Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase ratingService.ts → Supabase ratingService.ts
 *
 * @description
 * 책 평점 관리. upsert 및 PostgreSQL 집계 쿼리 활용.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type RatingRow = Database['public']['Tables']['ratings']['Row']
type RatingInsert = Database['public']['Tables']['ratings']['Insert']
type RatingUpdate = Database['public']['Tables']['ratings']['Update']
type ForumUpdate = Database['public']['Tables']['forums']['Update']

// 평점 분포 타입 (기존 types.ts 호환)
export interface RatingDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

// 책 평점 타입 (기존 types.ts 호환)
export interface BookRating {
  id: string
  bookIsbn: string
  userId: string
  rating: number
  createdAt: string
  updatedAt?: string
}

export class RatingService {
  /**
   * 사용자 평점 저장/업데이트
   * Supabase의 upsert를 활용하여 생성/업데이트 통합 처리
   *
   * @param bookIsbn - 책 ISBN
   * @param userId - users 테이블의 id
   * @param rating - 평점 (1-5)
   */
  static async setUserRating(
    bookIsbn: string,
    userId: string,
    rating: number
  ): Promise<void> {
    // 평점 유효성 검사
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error('평점은 1-5 사이의 정수여야 합니다.')
    }

    // 기존 평점 확인
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('book_isbn', bookIsbn)
      .eq('user_id', userId)
      .maybeSingle()

    const existingData = existing as Pick<RatingRow, 'id'> | null

    if (existingData) {
      // 기존 평점 업데이트
      const updateData: RatingUpdate = {
        rating: rating,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('ratings')
        .update(updateData)
        .eq('id', existingData.id)

      if (error) throw new Error(`평점 업데이트 실패: ${error.message}`)
    } else {
      // 새 평점 생성
      const insertData: RatingInsert = {
        book_isbn: bookIsbn,
        user_id: userId,
        rating: rating,
      }
      const { error } = await supabase
        .from('ratings')
        .insert(insertData)

      if (error) throw new Error(`평점 저장 실패: ${error.message}`)
    }

    // 포럼의 평균 평점 업데이트
    await this.updateForumRating(bookIsbn)
  }

  /**
   * 사용자의 특정 책 평점 조회
   */
  static async getUserRating(bookIsbn: string, userId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('book_isbn', bookIsbn)
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    const ratingData = data as Pick<RatingRow, 'rating'>
    return ratingData.rating
  }

  /**
   * 평균 평점 조회
   * PostgreSQL 집계 함수 활용
   */
  static async getAverageRating(bookIsbn: string): Promise<{ average: number; total: number }> {
    const { data, error } = await supabase.rpc('get_book_average_rating', {
      target_book_isbn: bookIsbn,
    })

    if (error || !data || data.length === 0) {
      return { average: 0, total: 0 }
    }

    const result = data[0] as { avg_rating: number; total_count: number }
    return {
      average: Number(result.avg_rating) || 0,
      total: Number(result.total_count) || 0,
    }
  }

  /**
   * 포럼의 평균 평점 업데이트
   * 책에 대한 평점이 변경될 때마다 호출
   */
  static async updateForumRating(bookIsbn: string): Promise<void> {
    const { average, total } = await this.getAverageRating(bookIsbn)

    const updateData: ForumUpdate = {
      average_rating: average,
      total_ratings: total,
    }
    const { error } = await supabase
      .from('forums')
      .update(updateData)
      .eq('isbn', bookIsbn)

    if (error) {
      console.error('포럼 평점 업데이트 실패:', error)
    }

    // popularity 갱신
    await supabase.rpc('update_forum_popularity', { target_isbn: bookIsbn })
  }

  /**
   * 평점 삭제
   */
  static async deleteRating(bookIsbn: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('book_isbn', bookIsbn)
      .eq('user_id', userId)

    if (error) throw new Error(`평점 삭제 실패: ${error.message}`)

    // 포럼의 평균 평점 업데이트
    await this.updateForumRating(bookIsbn)
  }

  /**
   * 평점 분포 조회
   * 각 별점(1-5)별 개수 반환
   */
  static async getRatingDistribution(bookIsbn: string): Promise<RatingDistribution> {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('book_isbn', bookIsbn)

    // 초기값 설정
    const distribution: RatingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    if (error || !data || data.length === 0) {
      return distribution
    }

    // 각 평점별 개수 계산
    const ratings = data as Pick<RatingRow, 'rating'>[]
    ratings.forEach((item) => {
      const rating = item.rating as 1 | 2 | 3 | 4 | 5
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++
      }
    })

    return distribution
  }

  /**
   * 특정 책의 모든 평점 조회 (페이지네이션 지원)
   */
  static async getBookRatings(
    bookIsbn: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<BookRating[]> {
    const { limit = 50, offset = 0 } = options

    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('book_isbn', bookIsbn)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('평점 목록 조회 실패:', error)
      return []
    }

    const ratings = (data || []) as RatingRow[]
    return ratings.map((r) => ({
      id: r.id,
      bookIsbn: r.book_isbn,
      userId: r.user_id,
      rating: r.rating,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  /**
   * 사용자의 모든 평점 조회
   */
  static async getUserRatings(userId: string): Promise<BookRating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('사용자 평점 조회 실패:', error)
      return []
    }

    const ratings = (data || []) as RatingRow[]
    return ratings.map((r) => ({
      id: r.id,
      bookIsbn: r.book_isbn,
      userId: r.user_id,
      rating: r.rating,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }))
  }

  /**
   * 최근 평점이 매겨진 책 목록 조회
   */
  static async getRecentlyRatedBooks(limitCount: number = 10): Promise<string[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('book_isbn')
      .order('updated_at', { ascending: false })
      .limit(limitCount)

    if (error) return []

    // 중복 제거
    const ratings = (data || []) as Pick<RatingRow, 'book_isbn'>[]
    const isbns = ratings.map((r) => r.book_isbn)
    const uniqueIsbns: string[] = [...new Set(isbns)]
    return uniqueIsbns.slice(0, limitCount)
  }

  /**
   * 높은 평점 순 책 목록 조회
   */
  static async getTopRatedBooks(
    limitCount: number = 10
  ): Promise<Array<{ isbn: string; average: number; total: number }>> {
    const { data, error } = await supabase
      .from('forums')
      .select('isbn, average_rating, total_ratings')
      .gte('total_ratings', 1) // 최소 1개 이상의 평점이 있는 책만
      .order('average_rating', { ascending: false })
      .order('total_ratings', { ascending: false })
      .limit(limitCount)

    if (error) return []

    type ForumRatingData = { isbn: string; average_rating: number; total_ratings: number }
    const forums = (data || []) as ForumRatingData[]
    return forums.map((f) => ({
      isbn: f.isbn,
      average: f.average_rating,
      total: f.total_ratings,
    }))
  }
}

export default RatingService
