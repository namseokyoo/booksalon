/**
 * View Count Service - 게시물 조회수 관리
 *
 * 북살롱 Phase 2-2 - 게시물 조회수 시스템
 *
 * @description
 * sessionStorage 기반 중복 방지와 Supabase RPC를 활용한 조회수 증가.
 */

import { supabase } from '../supabase'

const VIEWED_POSTS_KEY = 'booksalon_viewed_posts'

export class ViewCountService {
  /**
   * sessionStorage에서 이미 조회한 게시물인지 확인
   */
  private static hasViewed(postId: string): boolean {
    try {
      const viewed = JSON.parse(sessionStorage.getItem(VIEWED_POSTS_KEY) || '[]')
      return viewed.includes(postId)
    } catch {
      return false
    }
  }

  /**
   * sessionStorage에 조회한 게시물 ID 기록
   */
  private static markViewed(postId: string): void {
    try {
      const viewed = JSON.parse(sessionStorage.getItem(VIEWED_POSTS_KEY) || '[]')
      if (!viewed.includes(postId)) {
        viewed.push(postId)
        sessionStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify(viewed))
      }
    } catch {
      // sessionStorage 접근 실패 시 무시
    }
  }

  /**
   * 조회수 증가 (중복 방지 포함)
   *
   * @param postId - 게시물 ID
   */
  static async incrementViewCount(postId: string): Promise<void> {
    if (this.hasViewed(postId)) return

    try {
      const { error } = await supabase.rpc('increment_view_count', { post_id: postId })

      if (error) {
        console.error('조회수 증가 실패:', error)
        return
      }

      this.markViewed(postId)
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }

  /**
   * 특정 게시물의 조회수 조회
   *
   * @param postId - 게시물 ID
   * @returns 조회수
   */
  static async getViewCount(postId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('view_count')
        .eq('id', postId)
        .maybeSingle()

      if (error) {
        console.error('조회수 조회 실패:', error)
        return 0
      }

      return (data as { view_count: number | null })?.view_count || 0
    } catch (error) {
      console.error('조회수 조회 실패:', error)
      return 0
    }
  }
}

export default ViewCountService
