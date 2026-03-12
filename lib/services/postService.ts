/**
 * Post Service
 *
 * 북살롱 게시물 CRUD + 데이터 보강(enrich) 서비스
 * ForumView.tsx, PostDetail.tsx 등의 직접 supabase 호출을 서비스 레이어로 추출
 *
 * @description BL-163
 */

import { supabase } from '../supabase'
import type { Post, PostImage } from '../../types'

// posts 테이블 select 공통 컬럼
const POST_SELECT_COLUMNS = `
  id,
  title,
  content,
  author_id,
  forum_isbn,
  created_at,
  updated_at,
  comment_count,
  like_count,
  view_count
`

// DB raw row 타입
interface PostRow {
  id: string
  title: string
  content: string
  author_id: string
  forum_isbn: string
  created_at: string
  updated_at: string | null
  comment_count: number
  like_count: number
  view_count: number | null
}

interface AuthorRow {
  id: string
  auth_id: string
  email: string
  display_name: string | null
  nickname: string | null
}

interface PostImageRow {
  id: string
  post_id: string
  url: string
  thumbnail_url: string | null
  width: number
  height: number
  display_order: number | null
}

interface PostTagRow {
  post_id: string
  tag_name: string
}

interface PostLikeRow {
  post_id: string
  user_id: string
}

export class PostService {
  /**
   * 게시물 목록 조회 (포럼별, 페이지네이션)
   */
  static async getPostsByForum(
    forumIsbn: string,
    options: { from?: number; to?: number } = {}
  ): Promise<PostRow[]> {
    const { from = 0, to = 19 } = options

    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT_COLUMNS)
      .eq('forum_isbn', forumIsbn)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('게시물 로드 실패:', error)
      return []
    }

    return (data || []) as PostRow[]
  }

  /**
   * 게시물 단건 조회
   */
  static async getPostById(postId: string): Promise<PostRow | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT_COLUMNS)
      .eq('id', postId)
      .single()

    if (error || !data) return null
    return data as PostRow
  }

  /**
   * 게시물 생성
   */
  static async createPost(params: {
    title: string
    content: string
    authorId: string
    forumIsbn: string
  }): Promise<{ id: string }> {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: params.title,
        content: params.content,
        author_id: params.authorId,
        forum_isbn: params.forumIsbn,
        comment_count: 0,
        like_count: 0,
      })
      .select('id')
      .single()

    if (error || !data) {
      throw error || new Error('게시물 생성 실패')
    }

    return data as { id: string }
  }

  /**
   * 게시물 수정
   */
  static async updatePost(
    postId: string,
    params: { title: string; content: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .update({
        title: params.title,
        content: params.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (error) throw error
  }

  /**
   * 게시물 삭제
   */
  static async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) throw error
  }

  /**
   * 포럼 마지막 활동시각 업데이트
   */
  static async updateForumActivity(forumIsbn: string): Promise<void> {
    const { error } = await supabase
      .from('forums')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('isbn', forumIsbn)

    if (error) {
      console.error('포럼 활동시각 업데이트 실패:', error)
    }
  }

  /**
   * raw DB 데이터를 UI Post 타입으로 보강 (작성자, 이미지, 태그, 좋아요)
   * ForumView.tsx의 enrichPostsData를 서비스로 추출
   */
  static async enrichPosts(postsData: PostRow[]): Promise<Post[]> {
    if (postsData.length === 0) return []

    const postIds = postsData.map((p) => p.id)
    const authorIds = [...new Set(postsData.map((p) => p.author_id))]

    // 배치 조회: 이미지, 작성자, 태그, 좋아요
    const [postImagesResult, authorsResult, postTagsResult, postLikesResult] = await Promise.all([
      supabase
        .from('post_images')
        .select('id, post_id, url, thumbnail_url, width, height, display_order')
        .in('post_id', postIds),
      supabase
        .from('users')
        .select('id, auth_id, email, display_name, nickname')
        .in('id', authorIds),
      supabase
        .from('post_tags')
        .select('post_id, tag_name')
        .in('post_id', postIds),
      supabase
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds),
    ])

    const imagesByPost = new Map<string, PostImage[]>()
    ;((postImagesResult.data || []) as PostImageRow[]).forEach((img) => {
      const images = imagesByPost.get(img.post_id) || []
      images.push({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnail_url || undefined,
        width: img.width,
        height: img.height,
        order: img.display_order || 0,
      })
      imagesByPost.set(img.post_id, images)
    })

    const authorMap = new Map<string, AuthorRow>(
      ((authorsResult.data || []) as AuthorRow[]).map((a) => [a.id, a])
    )

    const tagsByPost = new Map<string, string[]>()
    ;((postTagsResult.data || []) as PostTagRow[]).forEach((pt) => {
      const tags = tagsByPost.get(pt.post_id) || []
      tags.push(pt.tag_name)
      tagsByPost.set(pt.post_id, tags)
    })

    const likesByPost = new Map<string, string[]>()
    ;((postLikesResult.data || []) as PostLikeRow[]).forEach((pl) => {
      const likes = likesByPost.get(pl.post_id) || []
      likes.push(pl.user_id)
      likesByPost.set(pl.post_id, likes)
    })

    return postsData.map((post) => {
      const author = authorMap.get(post.author_id)
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          uid: author?.auth_id || post.author_id,
          email: author?.email || '',
        },
        createdAt: post.created_at ? new Date(post.created_at) : new Date(),
        updatedAt: post.updated_at ? new Date(post.updated_at) : undefined,
        commentCount: post.comment_count,
        likeCount: post.like_count,
        viewCount: post.view_count || 0,
        likes: likesByPost.get(post.id) || [],
        tags: tagsByPost.get(post.id) || [],
        images: imagesByPost.get(post.id) || [],
      }
    })
  }
}

export default PostService
