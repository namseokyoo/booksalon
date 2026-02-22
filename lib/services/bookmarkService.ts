/**
 * Bookmark Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase bookmarkService.ts → Supabase bookmarkService.ts
 *
 * @description
 * 포럼 북마크 관리. Firebase의 배열 필드 방식에서 별도 테이블 방식으로 변환.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type BookmarkRow = Database['public']['Tables']['bookmarks']['Row']
type BookmarkInsert = Database['public']['Tables']['bookmarks']['Insert']
type ForumRow = Database['public']['Tables']['forums']['Row']
type BookRow = Database['public']['Tables']['books']['Row']
type ForumTagRow = Database['public']['Tables']['forum_tags']['Row']
type NotificationSettingsRow = Database['public']['Tables']['user_notification_settings']['Row']
type NotificationSettingsInsert = Database['public']['Tables']['user_notification_settings']['Insert']
type NotificationSettingsUpdate = Database['public']['Tables']['user_notification_settings']['Update']

// 기존 types.ts Forum과 호환
export interface Forum {
  isbn: string
  book: {
    isbn: string
    title: string
    authors: string[]
    publisher: string
    thumbnail: string
    contents: string
  }
  postCount: number
  lastActivityAt?: string
  category?: string
  tags?: string[]
  popularity?: number
  averageRating?: number
  totalRatings?: number
}

// Supabase 포럼 데이터를 기존 Forum 형식으로 변환
function transformToForum(
  forum: ForumRow,
  book: BookRow,
  tags?: ForumTagRow[]
): Forum {
  return {
    isbn: forum.isbn,
    book: {
      isbn: book.isbn,
      title: book.title,
      authors: book.authors || [],
      publisher: book.publisher || '',
      thumbnail: book.thumbnail || '',
      contents: book.contents || '',
    },
    postCount: forum.post_count,
    lastActivityAt: forum.last_activity_at,
    category: forum.category || undefined,
    tags: tags?.map((t) => t.tag_name) || [],
    popularity: forum.popularity,
    averageRating: forum.average_rating,
    totalRatings: forum.total_ratings,
  }
}

export class BookmarkService {
  /**
   * 포럼 북마크 추가/제거 토글
   *
   * @param userId - users 테이블의 id (auth_id 아님)
   * @param forumIsbn - 포럼 ISBN
   * @returns 북마크 추가 시 true, 제거 시 false
   */
  static async toggleBookmark(userId: string, forumIsbn: string): Promise<boolean> {
    // 기존 북마크 확인
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('forum_isbn', forumIsbn)
      .maybeSingle()

    const existingData = existing as BookmarkRow | null

    if (existingData) {
      // 북마크 제거
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', existingData.id)

      if (error) throw new Error(`북마크 제거 실패: ${error.message}`)
      return false
    } else {
      // 북마크 추가
      const insertData: BookmarkInsert = {
        user_id: userId,
        forum_isbn: forumIsbn,
      }
      const { error } = await supabase
        .from('bookmarks')
        .insert(insertData)

      if (error) throw new Error(`북마크 추가 실패: ${error.message}`)
      return true
    }
  }

  /**
   * 사용자의 북마크한 포럼 목록 조회
   */
  static async getBookmarkedForums(userId: string): Promise<Forum[]> {
    // 북마크 목록 조회
    const { data: bookmarks, error: bookmarkError } = await supabase
      .from('bookmarks')
      .select('forum_isbn')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const bookmarkData = (bookmarks || []) as Pick<BookmarkRow, 'forum_isbn'>[]

    if (bookmarkError || bookmarkData.length === 0) {
      return []
    }

    const forumIsbns = bookmarkData.map((b) => b.forum_isbn)

    // 포럼 및 책 정보 조회
    const { data: forums } = await supabase
      .from('forums')
      .select('*')
      .in('isbn', forumIsbns)

    const forumData = (forums || []) as ForumRow[]

    if (forumData.length === 0) {
      return []
    }

    // 책 정보 조회
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('isbn', forumIsbns)

    const bookData = (books || []) as BookRow[]

    if (bookData.length === 0) {
      return []
    }

    // 태그 조회
    const { data: allTags } = await supabase
      .from('forum_tags')
      .select('*')
      .in('forum_isbn', forumIsbns)

    const tagData = (allTags || []) as ForumTagRow[]

    // 데이터 변환
    const forumMap = new Map(forumData.map((f) => [f.isbn, f]))
    const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

    return forumIsbns
      .filter((isbn) => forumMap.has(isbn) && bookMap.has(isbn))
      .map((isbn) => {
        const forum = forumMap.get(isbn)!
        const book = bookMap.get(isbn)!
        const tags = tagData.filter((t) => t.forum_isbn === isbn)
        return transformToForum(forum, book, tags)
      })
  }

  /**
   * 포럼이 북마크되어 있는지 확인
   */
  static async isBookmarked(userId: string, forumIsbn: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('forum_isbn', forumIsbn)
      .maybeSingle()

    // 데이터가 없으면 false, 있으면 true
    return !error && !!data
  }

  /**
   * 사용자의 북마크한 포럼 ISBN 목록만 조회 (가벼운 조회)
   */
  static async getBookmarkedForumIsbns(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('forum_isbn')
      .eq('user_id', userId)

    if (error || !data) return []
    const bookmarkData = data as Pick<BookmarkRow, 'forum_isbn'>[]
    return bookmarkData.map((b) => b.forum_isbn)
  }

  /**
   * 알림 설정 업데이트 (기존 BookmarkService에서 관리)
   * Note: UserService로 이동 권장, 호환성을 위해 유지
   */
  static async updateNotificationSettings(
    userId: string,
    settings: {
      newPosts?: boolean
      newComments?: boolean
      forumUpdates?: boolean
    }
  ): Promise<void> {
    // 기존 설정 확인
    const { data: existing } = await supabase
      .from('user_notification_settings')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      // 업데이트
      const updateData: NotificationSettingsUpdate = {
        new_posts: settings.newPosts,
        new_comments: settings.newComments,
        forum_updates: settings.forumUpdates,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('user_notification_settings')
        .update(updateData)
        .eq('user_id', userId)

      if (error) throw new Error(`알림 설정 업데이트 실패: ${error.message}`)
    } else {
      // 새로 생성
      const insertData: NotificationSettingsInsert = {
        user_id: userId,
        new_posts: settings.newPosts ?? true,
        new_comments: settings.newComments ?? true,
        forum_updates: settings.forumUpdates ?? true,
      }
      const { error } = await supabase
        .from('user_notification_settings')
        .insert(insertData)

      if (error) throw new Error(`알림 설정 생성 실패: ${error.message}`)
    }
  }

  /**
   * 알림 설정 조회
   */
  static async getNotificationSettings(userId: string): Promise<{
    newPosts: boolean
    newComments: boolean
    forumUpdates: boolean
  }> {
    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('new_posts, new_comments, forum_updates')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      // 기본값 반환
      return {
        newPosts: true,
        newComments: true,
        forumUpdates: true,
      }
    }

    const settings = data as Pick<NotificationSettingsRow, 'new_posts' | 'new_comments' | 'forum_updates'>
    return {
      newPosts: settings.new_posts,
      newComments: settings.new_comments,
      forumUpdates: settings.forum_updates,
    }
  }

  /**
   * 특정 포럼의 북마크 수 조회
   */
  static async getBookmarkCount(forumIsbn: string): Promise<number> {
    const { count, error } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .eq('forum_isbn', forumIsbn)

    if (error) return 0
    return count || 0
  }

  /**
   * 여러 포럼의 북마크 여부 일괄 확인
   */
  static async checkMultipleBookmarks(
    userId: string,
    forumIsbns: string[]
  ): Promise<Record<string, boolean>> {
    if (forumIsbns.length === 0) return {}

    const { data, error } = await supabase
      .from('bookmarks')
      .select('forum_isbn')
      .eq('user_id', userId)
      .in('forum_isbn', forumIsbns)

    if (error || !data) return {}

    const bookmarkData = data as Pick<BookmarkRow, 'forum_isbn'>[]
    const bookmarkedSet = new Set(bookmarkData.map((b) => b.forum_isbn))
    const result: Record<string, boolean> = {}

    forumIsbns.forEach((isbn) => {
      result[isbn] = bookmarkedSet.has(isbn)
    })

    return result
  }
}

export default BookmarkService
