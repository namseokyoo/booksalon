/**
 * Tag Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase tagService.ts → Supabase tagService.ts
 *
 * @description
 * 태그 CRUD 및 통계 관리. PostgreSQL의 ON CONFLICT로 원자적 연산 구현.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type TagRow = Database['public']['Tables']['tags']['Row']
type TagInsert = Database['public']['Tables']['tags']['Insert']
type TagUpdate = Database['public']['Tables']['tags']['Update']
type ForumRow = Database['public']['Tables']['forums']['Row']
type BookRow = Database['public']['Tables']['books']['Row']
type PostRow = Database['public']['Tables']['posts']['Row']
type ForumTagRow = Database['public']['Tables']['forum_tags']['Row']
type ForumTagInsert = Database['public']['Tables']['forum_tags']['Insert']
type PostTagRow = Database['public']['Tables']['post_tags']['Row']
type PostTagInsert = Database['public']['Tables']['post_tags']['Insert']

// 기존 types.ts 호환
export interface TagStats {
  name: string
  count: number
  type: 'forum' | 'post'
  lastUsedAt: string
}

// 포럼 인터페이스 (간소화)
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

// 게시물 인터페이스 (간소화)
export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  forumIsbn: string
  createdAt: string
  commentCount: number
  likeCount: number
  tags?: string[]
}

export class TagService {
  /**
   * 태그 이름 정규화 (공백 제거, 소문자 변환)
   */
  static normalizeTag(tag: string): string {
    return tag.trim().toLowerCase().replace(/\s+/g, '_')
  }

  /**
   * 태그 유효성 검사
   */
  static validateTag(tag: string): { valid: boolean; error?: string } {
    const trimmed = tag.trim()
    if (trimmed.length === 0) {
      return { valid: false, error: '태그를 입력해주세요.' }
    }
    if (trimmed.length > 20) {
      return { valid: false, error: '태그는 20자 이내로 입력해주세요.' }
    }
    if (!/^[가-힣a-zA-Z0-9_\s]+$/.test(trimmed)) {
      return { valid: false, error: '태그는 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.' }
    }
    return { valid: true }
  }

  /**
   * 태그 사용 횟수 증가
   * Supabase upsert로 원자적 연산 구현
   */
  static async incrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void> {
    const normalizedTag = tagName.trim()

    // 기존 태그 확인
    const { data: existing } = await supabase
      .from('tags')
      .select('id, count')
      .eq('name', normalizedTag)
      .eq('tag_type', type)
      .single()

    const existingData = existing as Pick<TagRow, 'id' | 'count'> | null

    if (existingData) {
      // 기존 태그 업데이트
      const updateData: TagUpdate = {
        count: existingData.count + 1,
        last_used_at: new Date().toISOString(),
      }
      const { error } = await supabase
        .from('tags')
        .update(updateData as never)
        .eq('id', existingData.id)

      if (error) throw new Error(`태그 업데이트 실패: ${error.message}`)
    } else {
      // 새 태그 생성
      const insertData: TagInsert = {
        name: normalizedTag,
        tag_type: type,
        count: 1,
        last_used_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('tags').insert(insertData as never)

      if (error) throw new Error(`태그 생성 실패: ${error.message}`)
    }
  }

  /**
   * 태그 사용 횟수 감소 (count가 0이 되면 태그 삭제)
   */
  static async decrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void> {
    const normalizedTag = tagName.trim()

    const { data: existing } = await supabase
      .from('tags')
      .select('id, count')
      .eq('name', normalizedTag)
      .eq('tag_type', type)
      .single()

    const existingData = existing as Pick<TagRow, 'id' | 'count'> | null

    if (existingData) {
      if (existingData.count > 1) {
        // 카운트 감소
        const updateData: TagUpdate = { count: existingData.count - 1 }
        const { error } = await supabase
          .from('tags')
          .update(updateData as never)
          .eq('id', existingData.id)

        if (error) console.error('태그 카운트 감소 실패:', error)
      } else {
        // 태그 삭제
        const { error } = await supabase.from('tags').delete().eq('id', existingData.id)

        if (error) console.error('태그 삭제 실패:', error)
      }
    }
  }

  /**
   * 미사용 태그 정리 (count가 0 이하인 태그 일괄 삭제)
   */
  static async cleanupUnusedTags(): Promise<{ deleted: number; errors: string[] }> {
    const errors: string[] = []

    try {
      const { data, error } = await supabase
        .from('tags')
        .delete()
        .lte('count', 0)
        .select('id')

      if (error) {
        errors.push(error.message)
        return { deleted: 0, errors }
      }

      const deleted = data?.length || 0
      console.log(`미사용 태그 ${deleted}개 삭제 완료`)
      return { deleted, errors }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류'
      errors.push(errorMsg)
      return { deleted: 0, errors }
    }
  }

  /**
   * 인기 태그 조회
   */
  static async getPopularTags(type: 'forum' | 'post', maxCount: number = 10): Promise<string[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('name')
      .eq('tag_type', type)
      .order('count', { ascending: false })
      .limit(maxCount)

    if (error) {
      console.error('인기 태그 조회 실패:', error)
      return []
    }

    const tagData = (data || []) as Pick<TagRow, 'name'>[]
    return tagData.map((t) => t.name)
  }

  /**
   * 태그 자동완성 (prefix 검색)
   */
  static async searchTags(
    prefix: string,
    type: 'forum' | 'post',
    maxCount: number = 5
  ): Promise<string[]> {
    if (!prefix.trim()) {
      return this.getPopularTags(type, maxCount)
    }

    const { data, error } = await supabase
      .from('tags')
      .select('name')
      .eq('tag_type', type)
      .ilike('name', `%${prefix}%`)
      .order('count', { ascending: false })
      .limit(maxCount)

    if (error) {
      console.error('태그 검색 실패:', error)
      return []
    }

    const tagData = (data || []) as Pick<TagRow, 'name'>[]
    return tagData.map((t) => t.name)
  }

  /**
   * 태그로 포럼 검색
   */
  static async getForumsByTag(tagName: string): Promise<Forum[]> {
    // 태그로 포럼 ISBN 목록 조회
    const { data: forumTags } = await supabase
      .from('forum_tags')
      .select('forum_isbn')
      .eq('tag_name', tagName)
      .limit(50)

    const tagData = (forumTags || []) as Pick<ForumTagRow, 'forum_isbn'>[]

    if (tagData.length === 0) {
      return []
    }

    const forumIsbns = tagData.map((t) => t.forum_isbn)

    // 포럼 정보 조회
    const { data: forums } = await supabase
      .from('forums')
      .select('*')
      .in('isbn', forumIsbns)

    const forumData = (forums || []) as ForumRow[]

    // 책 정보 조회
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('isbn', forumIsbns)

    const bookData = (books || []) as BookRow[]
    const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

    return forumData.map((forum) => {
      const book = bookMap.get(forum.isbn)

      return {
        isbn: forum.isbn,
        book: {
          isbn: book?.isbn || forum.isbn,
          title: book?.title || '',
          authors: book?.authors || [],
          publisher: book?.publisher || '',
          thumbnail: book?.thumbnail || '',
          contents: book?.contents || '',
        },
        postCount: forum.post_count,
        lastActivityAt: forum.last_activity_at,
        category: forum.category || undefined,
        popularity: forum.popularity,
        averageRating: forum.average_rating,
        totalRatings: forum.total_ratings,
      }
    })
  }

  /**
   * 태그로 게시물 검색
   */
  static async getPostsByTag(
    tagName: string,
    forumIsbn?: string,
    maxCount: number = 50
  ): Promise<Post[]> {
    // 태그로 게시물 ID 목록 조회
    const { data: postTags } = await supabase
      .from('post_tags')
      .select('post_id')
      .eq('tag_name', tagName)
      .limit(maxCount)

    const tagData = (postTags || []) as Pick<PostTagRow, 'post_id'>[]

    if (tagData.length === 0) {
      return []
    }

    const postIds = tagData.map((t) => t.post_id)

    // 게시물 정보 조회
    let query = supabase
      .from('posts')
      .select('*')
      .in('id', postIds)

    if (forumIsbn) {
      query = query.eq('forum_isbn', forumIsbn)
    }

    const { data: posts } = await query

    const postData = (posts || []) as PostRow[]

    return postData.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      authorId: post.author_id,
      forumIsbn: post.forum_isbn,
      createdAt: post.created_at,
      commentCount: post.comment_count,
      likeCount: post.like_count,
    }))
  }

  /**
   * 포럼에 태그 추가 (최대 5개)
   */
  static async addTagsToForum(forumIsbn: string, tags: string[]): Promise<void> {
    if (tags.length > 5) {
      throw new Error('태그는 최대 5개까지 추가할 수 있습니다.')
    }

    // 모든 태그 유효성 검사
    for (const tag of tags) {
      const validation = this.validateTag(tag)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }

    // 기존 태그 삭제
    await supabase.from('forum_tags').delete().eq('forum_isbn', forumIsbn)

    // 새 태그 추가
    if (tags.length > 0) {
      const tagsToInsert: ForumTagInsert[] = tags.map((tag) => ({
        forum_isbn: forumIsbn,
        tag_name: tag.trim(),
      }))

      const { error } = await supabase.from('forum_tags').insert(tagsToInsert as never[])
      if (error) throw new Error(`포럼 태그 추가 실패: ${error.message}`)

      // 태그 통계 업데이트
      for (const tag of tags) {
        await this.incrementTagCount(tag, 'forum')
      }
    }
  }

  /**
   * 게시물에 태그 추가 (최대 3개)
   */
  static async addTagsToPost(postId: string, tags: string[]): Promise<void> {
    if (tags.length > 3) {
      throw new Error('게시물 태그는 최대 3개까지 추가할 수 있습니다.')
    }

    // 모든 태그 유효성 검사
    for (const tag of tags) {
      const validation = this.validateTag(tag)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
    }

    // 기존 태그 삭제
    await supabase.from('post_tags').delete().eq('post_id', postId)

    // 새 태그 추가
    if (tags.length > 0) {
      const tagsToInsert: PostTagInsert[] = tags.map((tag) => ({
        post_id: postId,
        tag_name: tag.trim(),
      }))

      const { error } = await supabase.from('post_tags').insert(tagsToInsert as never[])
      if (error) throw new Error(`게시물 태그 추가 실패: ${error.message}`)

      // 태그 통계 업데이트
      for (const tag of tags) {
        await this.incrementTagCount(tag, 'post')
      }
    }
  }

  /**
   * 포럼 태그 업데이트 (기존 태그와 비교하여 추가/삭제)
   */
  static async updateForumTags(
    forumIsbn: string,
    oldTags: string[],
    newTags: string[]
  ): Promise<void> {
    const addedTags = newTags.filter((t) => !oldTags.includes(t))
    const removedTags = oldTags.filter((t) => !newTags.includes(t))

    // 포럼 태그 전체 교체
    await supabase.from('forum_tags').delete().eq('forum_isbn', forumIsbn)

    if (newTags.length > 0) {
      const tagsToInsert: ForumTagInsert[] = newTags.map((tag) => ({
        forum_isbn: forumIsbn,
        tag_name: tag.trim(),
      }))

      await supabase.from('forum_tags').insert(tagsToInsert as never[])
    }

    // 추가된 태그 카운트 증가
    for (const tag of addedTags) {
      await this.incrementTagCount(tag, 'forum')
    }

    // 삭제된 태그 카운트 감소
    for (const tag of removedTags) {
      await this.decrementTagCount(tag, 'forum')
    }
  }

  /**
   * 게시물 태그 업데이트
   */
  static async updatePostTags(
    postId: string,
    oldTags: string[],
    newTags: string[]
  ): Promise<void> {
    const addedTags = newTags.filter((t) => !oldTags.includes(t))
    const removedTags = oldTags.filter((t) => !newTags.includes(t))

    // 게시물 태그 전체 교체
    await supabase.from('post_tags').delete().eq('post_id', postId)

    if (newTags.length > 0) {
      const tagsToInsert: PostTagInsert[] = newTags.map((tag) => ({
        post_id: postId,
        tag_name: tag.trim(),
      }))

      await supabase.from('post_tags').insert(tagsToInsert as never[])
    }

    // 추가된 태그 카운트 증가
    for (const tag of addedTags) {
      await this.incrementTagCount(tag, 'post')
    }

    // 삭제된 태그 카운트 감소
    for (const tag of removedTags) {
      await this.decrementTagCount(tag, 'post')
    }
  }

  /**
   * 모든 태그 조회 (관리용)
   */
  static async getAllTags(type?: 'forum' | 'post'): Promise<TagStats[]> {
    let query = supabase.from('tags').select('*').order('count', { ascending: false })

    if (type) {
      query = query.eq('tag_type', type)
    }

    const { data, error } = await query

    if (error) {
      console.error('태그 목록 조회 실패:', error)
      return []
    }

    const tagData = (data || []) as TagRow[]
    return tagData.map((t) => ({
      name: t.name,
      count: t.count,
      type: t.tag_type as 'forum' | 'post',
      lastUsedAt: t.last_used_at,
    }))
  }

  /**
   * 특정 포럼의 태그 목록 조회
   */
  static async getForumTags(forumIsbn: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('forum_tags')
      .select('tag_name')
      .eq('forum_isbn', forumIsbn)

    if (error) return []
    const tagData = (data || []) as Pick<ForumTagRow, 'tag_name'>[]
    return tagData.map((t) => t.tag_name)
  }

  /**
   * 특정 게시물의 태그 목록 조회
   */
  static async getPostTags(postId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('post_tags')
      .select('tag_name')
      .eq('post_id', postId)

    if (error) return []
    const tagData = (data || []) as Pick<PostTagRow, 'tag_name'>[]
    return tagData.map((t) => t.tag_name)
  }
}

export default TagService
