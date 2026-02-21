/**
 * View Count Service - 조회수 관리
 *
 * 북살롱 - 게시물 조회수 추적 및 중복 방지
 *
 * @description
 * sessionStorage를 이용한 세션 내 중복 조회 방지.
 * Supabase RPC 함수(increment_view_count)를 통한 원자적 카운트 증가.
 */

import { supabase } from '../supabase'

export const ViewCountService = {
  async incrementViewCount(postId: string): Promise<void> {
    // sessionStorage로 중복 방지
    const storageKey = 'booksalon_viewed_posts'
    const viewed = JSON.parse(sessionStorage.getItem(storageKey) || '[]')
    if (viewed.includes(postId)) return

    try {
      await supabase.rpc('increment_view_count', { post_id: postId })
      viewed.push(postId)
      sessionStorage.setItem(storageKey, JSON.stringify(viewed))
    } catch (error) {
      console.error('Failed to increment view count:', error)
    }
  },

  async getViewCount(postId: string): Promise<number> {
    const { data } = await supabase
      .from('posts')
      .select('view_count')
      .eq('id', postId)
      .single()
    return data?.view_count ?? 0
  },
}
