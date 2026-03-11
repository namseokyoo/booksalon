/**
 * Comment Service
 *
 * 북살롱 대댓글 시스템 (BL-117)
 *
 * @description
 * 댓글 및 대댓글 관련 Supabase 쿼리를 서비스 레이어로 분리.
 * flat 배열을 클라이언트에서 parent_id 기준 트리 구조로 변환.
 * Depth 1 고정 (댓글 → 대댓글, 대댓글에 대댓글 불가).
 */

import { supabaseAnon, supabase } from '../supabase'
import { NotificationService } from './notificationService'
import { UserService } from './userService'

export interface CommentAuthor {
  uid: string
  email: string
  nickname?: string
  displayName?: string
}

export interface CommentWithReplies {
  id: string
  postId: string
  content: string
  author: CommentAuthor
  parentId: string | null
  createdAt: Date
  updatedAt?: Date
  likeCount: number
  likes: string[] // user ids who liked
  replies: CommentWithReplies[] // 항상 최대 1레벨
}

// DB row 타입 (Supabase 쿼리 결과)
interface CommentRow {
  id: string
  content: string
  author_id: string
  parent_id: string | null
  post_id: string
  created_at: string | null
  updated_at: string | null
  like_count: number | null
}

interface UserRow {
  id: string
  auth_id: string
  email: string
  display_name: string | null
  nickname: string | null
}

interface CommentLikeRow {
  comment_id: string
  user_id: string
}

interface CommentNotificationPostRow {
  author_id: string | null
  title: string | null
  forum_isbn: string | null
}

interface ParentCommentAuthorRow {
  author_id: string | null
}

export class CommentService {
  /**
   * 게시물의 모든 댓글(대댓글 포함)을 flat으로 가져와
   * 클라이언트에서 parent_id 기준 트리 구조로 변환.
   *
   * @returns 최상위 댓글만 반환 (각 replies 배열에 대댓글 포함)
   */
  static async getCommentsByPostId(postId: string): Promise<CommentWithReplies[]> {
    // 1. comments 테이블에서 해당 게시물 전체 댓글 조회 (parent_id 포함)
    const { data: commentsData, error: commentsError } = await supabaseAnon
      .from('comments')
      .select(`
        id,
        content,
        author_id,
        parent_id,
        post_id,
        created_at,
        updated_at,
        like_count
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (commentsError) {
      console.error('댓글 로드 실패:', commentsError)
      throw commentsError
    }

    const rows = (commentsData || []) as CommentRow[]

    if (rows.length === 0) {
      return []
    }

    // 2. 작성자 정보 조회 (author_id in [...])
    const authorIds = [...new Set(rows.map((c) => c.author_id))]
    const { data: authors } = await supabaseAnon
      .from('users')
      .select('id, auth_id, email, display_name, nickname')
      .in('id', authorIds)

    const authorMap = new Map<string, UserRow>(
      ((authors || []) as UserRow[]).map((a) => [a.id, a])
    )

    // 3. comment_likes 테이블에서 해당 댓글들의 좋아요 조회
    const commentIds = rows.map((c) => c.id)
    const { data: commentLikes } = await supabaseAnon
      .from('comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds)

    const likesByComment = new Map<string, string[]>()
    ;((commentLikes || []) as CommentLikeRow[]).forEach((cl) => {
      const likes = likesByComment.get(cl.comment_id) || []
      likes.push(cl.user_id)
      likesByComment.set(cl.comment_id, likes)
    })

    // 4. flat 배열 → CommentWithReplies 변환
    const toCommentWithReplies = (row: CommentRow): CommentWithReplies => {
      const author = authorMap.get(row.author_id)
      return {
        id: row.id,
        postId: row.post_id,
        content: row.content,
        author: {
          uid: author?.auth_id || row.author_id,
          email: author?.email || '',
          nickname: author?.nickname || undefined,
          displayName: author?.display_name || undefined,
        },
        parentId: row.parent_id,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        likeCount: row.like_count || 0,
        likes: likesByComment.get(row.id) || [],
        replies: [],
      }
    }

    // 5. parent_id 기준 그룹핑: parent_id === null → 최상위, 나머지 → replies
    const topLevel = rows
      .filter((c) => c.parent_id === null)
      .map(toCommentWithReplies)

    const replyRows = rows.filter((c) => c.parent_id !== null)

    // 각 최상위 댓글에 대댓글 연결
    const topLevelMap = new Map<string, CommentWithReplies>(
      topLevel.map((c) => [c.id, c])
    )

    replyRows.forEach((row) => {
      const parent = topLevelMap.get(row.parent_id!)
      if (parent) {
        parent.replies.push(toCommentWithReplies(row))
      }
    })

    return topLevel
  }

  /**
   * 댓글 또는 대댓글 작성.
   * parentId 있으면 대댓글, 없으면 최상위 댓글.
   *
   * @returns 생성된 댓글 id
   */
  static async createComment(params: {
    postId: string
    authorId: string
    content: string
    parentId?: string | null
  }): Promise<{ id: string }> {
    const { postId, authorId, content, parentId } = params

    const { data, error } = await supabase
      .from('comments')
      .insert({
        content,
        author_id: authorId,
        post_id: postId,
        like_count: 0,
        parent_id: parentId || null,
      })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    const commentId = (data as { id: string }).id

    void (async () => {
      try {
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('author_id, title, forum_isbn')
          .eq('id', postId)
          .single()

        if (postError) {
          throw postError
        }

        const postData = post as CommentNotificationPostRow | null
        const postAuthorId = postData?.author_id

        if (!postData || !postAuthorId) {
          return
        }

        const senderProfile = await UserService.getUserProfileById(authorId)
        const senderName = senderProfile?.nickname
          || senderProfile?.displayName
          || senderProfile?.email?.split('@')[0]
          || '누군가'
        const postTitle = postData.title || ''
        const forumId = postData.forum_isbn || ''

        if (authorId !== postAuthorId) {
          NotificationService.createCommentNotification(
            postAuthorId,
            authorId,
            senderName,
            postTitle,
            commentId,
            postId,
            forumId
          ).catch(console.error)
        }

        if (parentId) {
          const { data: parentComment, error: parentCommentError } = await supabase
            .from('comments')
            .select('author_id')
            .eq('id', parentId)
            .maybeSingle()

          if (parentCommentError) {
            throw parentCommentError
          }

          const parentCommentData = parentComment as ParentCommentAuthorRow | null
          const parentAuthorId = parentCommentData?.author_id

          if (
            parentAuthorId
            && parentAuthorId !== postAuthorId
            && parentAuthorId !== authorId
          ) {
            NotificationService.createCommentNotification(
              parentAuthorId,
              authorId,
              senderName,
              postTitle,
              commentId,
              postId,
              forumId
            ).catch(console.error)
          }
        }
      } catch (notificationError) {
        console.error(notificationError)
      }
    })()

    return { id: commentId }
  }

  /**
   * 댓글/대댓글 수정.
   */
  static async updateComment(commentId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)

    if (error) {
      throw error
    }
  }

  /**
   * 댓글/대댓글 삭제.
   * 최상위 댓글 삭제 시 자식 대댓글도 DB CASCADE로 삭제됨.
   */
  static async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      throw error
    }
  }
}
