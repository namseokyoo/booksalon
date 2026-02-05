/**
 * Social Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase socialService.ts → Supabase socialService.ts
 *
 * @description
 * 팔로우, 좋아요, 활동 피드 등 소셜 기능 관리.
 * Firebase의 배열 필드 방식에서 별도 테이블 방식으로 변환.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'
import { UserService, type UserProfile } from './userService'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type FollowRow = Database['public']['Tables']['follows']['Row']
type FollowInsert = Database['public']['Tables']['follows']['Insert']
type UserRow = Database['public']['Tables']['users']['Row']
type PostRow = Database['public']['Tables']['posts']['Row']
type CommentRow = Database['public']['Tables']['comments']['Row']
type ActivityRow = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type PostLikeRow = Database['public']['Tables']['post_likes']['Row']
type CommentLikeRow = Database['public']['Tables']['comment_likes']['Row']

// 활동 타입 (기존 types.ts 호환)
export interface Activity {
  id: string
  type: 'post' | 'comment' | 'like' | 'follow' | 'bookmark'
  userId: string
  userName: string
  userEmail: string
  targetId: string
  targetTitle?: string
  forumIsbn?: string
  forumTitle?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

export class SocialService {
  /**
   * 사용자 팔로우/언팔로우 토글
   *
   * @param currentUserId - 현재 사용자 ID (users.id)
   * @param targetUserId - 대상 사용자 ID (users.id)
   * @returns 팔로우 시 true, 언팔로우 시 false
   */
  static async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    // 자기 자신은 팔로우 불가
    if (currentUserId === targetUserId) {
      throw new Error('자기 자신을 팔로우할 수 없습니다.')
    }

    // 기존 팔로우 확인
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single()

    const existingData = existing as Pick<FollowRow, 'id'> | null

    // 현재 사용자 정보 조회 (활동 기록용)
    const currentUser = await UserService.getUserProfileById(currentUserId)
    const targetUser = await UserService.getUserProfileById(targetUserId)

    if (existingData) {
      // 언팔로우
      const { error } = await supabase.from('follows').delete().eq('id', existingData.id)

      if (error) throw new Error(`언팔로우 실패: ${error.message}`)

      // 활동 기록 생성
      if (currentUser && targetUser) {
        await this.createActivity({
          type: 'follow',
          userId: currentUserId,
          userName: currentUser.displayName || currentUser.email.split('@')[0],
          userEmail: currentUser.email,
          targetId: targetUserId,
          targetTitle: targetUser.displayName || targetUser.email.split('@')[0],
          metadata: { action: 'unfollow' },
        })
      }

      return false
    } else {
      // 팔로우
      const insertData: FollowInsert = {
        follower_id: currentUserId,
        following_id: targetUserId,
      }
      const { error } = await supabase.from('follows').insert(insertData as never)

      if (error) throw new Error(`팔로우 실패: ${error.message}`)

      // 활동 기록 생성
      if (currentUser && targetUser) {
        await this.createActivity({
          type: 'follow',
          userId: currentUserId,
          userName: currentUser.displayName || currentUser.email.split('@')[0],
          userEmail: currentUser.email,
          targetId: targetUserId,
          targetTitle: targetUser.displayName || targetUser.email.split('@')[0],
          metadata: { action: 'follow' },
        })
      }

      return true
    }
  }

  /**
   * 팔로우 상태 확인
   */
  static async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .single()

    return !error && !!data
  }

  /**
   * 팔로워 목록 조회 (나를 팔로우하는 사람들)
   */
  static async getFollowers(userId: string): Promise<UserProfile[]> {
    // 팔로워 ID 목록 조회
    const { data: follows } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId)

    const followData = (follows || []) as Pick<FollowRow, 'follower_id'>[]

    if (followData.length === 0) {
      return []
    }

    const followerIds = followData.map((f) => f.follower_id)

    // 사용자 정보 조회
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', followerIds)

    const userData = (users || []) as UserRow[]

    return userData.map((user) => ({
      id: user.id,
      uid: user.auth_id,
      email: user.email,
      displayName: user.display_name || undefined,
      nickname: user.nickname || undefined,
      bio: user.bio || undefined,
      profileImageUrl: user.profile_image_url || undefined,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      postCount: user.post_count,
      commentCount: user.comment_count,
      forumCount: user.forum_count,
    }))
  }

  /**
   * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
   */
  static async getFollowing(userId: string): Promise<UserProfile[]> {
    // 팔로잉 ID 목록 조회
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    const followData = (follows || []) as Pick<FollowRow, 'following_id'>[]

    if (followData.length === 0) {
      return []
    }

    const followingIds = followData.map((f) => f.following_id)

    // 사용자 정보 조회
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', followingIds)

    const userData = (users || []) as UserRow[]

    return userData.map((user) => ({
      id: user.id,
      uid: user.auth_id,
      email: user.email,
      displayName: user.display_name || undefined,
      nickname: user.nickname || undefined,
      bio: user.bio || undefined,
      profileImageUrl: user.profile_image_url || undefined,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      postCount: user.post_count,
      commentCount: user.comment_count,
      forumCount: user.forum_count,
    }))
  }

  /**
   * 팔로워/팔로잉 수 조회
   */
  static async getFollowCounts(
    userId: string
  ): Promise<{ followers: number; following: number }> {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ])

    return {
      followers: followersResult.count || 0,
      following: followingResult.count || 0,
    }
  }

  /**
   * 좋아요 토글 (게시물 또는 댓글)
   *
   * @param currentUserId - 현재 사용자 ID
   * @param targetType - 'post' 또는 'comment'
   * @param targetId - 게시물 또는 댓글 ID
   * @returns 좋아요 추가 시 true, 취소 시 false
   */
  static async toggleLike(
    currentUserId: string,
    targetType: 'post' | 'comment',
    targetId: string
  ): Promise<boolean> {
    if (targetType === 'post') {
      return this.togglePostLike(currentUserId, targetId)
    } else {
      return this.toggleCommentLike(currentUserId, targetId)
    }
  }

  /**
   * 게시물 좋아요 토글
   */
  private static async togglePostLike(currentUserId: string, postId: string): Promise<boolean> {
    // 기존 좋아요 확인
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .single()

    const existingData = existing as Pick<PostLikeRow, 'id'> | null

    if (existingData) {
      // 좋아요 취소
      const { error } = await supabase.from('post_likes').delete().eq('id', existingData.id)

      if (error) throw new Error(`좋아요 취소 실패: ${error.message}`)

      // 좋아요 수 감소
      const { data: post } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single()

      const postData = post as Pick<PostRow, 'like_count'> | null
      if (postData) {
        await supabase
          .from('posts')
          .update({ like_count: Math.max(0, (postData.like_count || 1) - 1) } as never)
          .eq('id', postId)
      }

      return false
    } else {
      // 좋아요 추가
      type PostLikeInsert = { post_id: string; user_id: string }
      const insertData: PostLikeInsert = { post_id: postId, user_id: currentUserId }
      const { error } = await supabase.from('post_likes').insert(insertData as never)

      if (error) throw new Error(`좋아요 추가 실패: ${error.message}`)

      // 좋아요 수 증가
      const { data: post } = await supabase
        .from('posts')
        .select('like_count')
        .eq('id', postId)
        .single()

      const postData = post as Pick<PostRow, 'like_count'> | null
      if (postData) {
        await supabase
          .from('posts')
          .update({ like_count: (postData.like_count || 0) + 1 } as never)
          .eq('id', postId)
      }

      return true
    }
  }

  /**
   * 댓글 좋아요 토글
   */
  private static async toggleCommentLike(currentUserId: string, commentId: string): Promise<boolean> {
    // 기존 좋아요 확인
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', currentUserId)
      .single()

    const existingData = existing as Pick<CommentLikeRow, 'id'> | null

    if (existingData) {
      // 좋아요 취소
      const { error } = await supabase.from('comment_likes').delete().eq('id', existingData.id)

      if (error) throw new Error(`좋아요 취소 실패: ${error.message}`)

      // 좋아요 수 감소
      const { data: comment } = await supabase
        .from('comments')
        .select('like_count')
        .eq('id', commentId)
        .single()

      const commentData = comment as Pick<CommentRow, 'like_count'> | null
      if (commentData) {
        await supabase
          .from('comments')
          .update({ like_count: Math.max(0, (commentData.like_count || 1) - 1) } as never)
          .eq('id', commentId)
      }

      return false
    } else {
      // 좋아요 추가
      type CommentLikeInsert = { comment_id: string; user_id: string }
      const insertData: CommentLikeInsert = { comment_id: commentId, user_id: currentUserId }
      const { error } = await supabase.from('comment_likes').insert(insertData as never)

      if (error) throw new Error(`좋아요 추가 실패: ${error.message}`)

      // 좋아요 수 증가
      const { data: comment } = await supabase
        .from('comments')
        .select('like_count')
        .eq('id', commentId)
        .single()

      const commentData = comment as Pick<CommentRow, 'like_count'> | null
      if (commentData) {
        await supabase
          .from('comments')
          .update({ like_count: (commentData.like_count || 0) + 1 } as never)
          .eq('id', commentId)
      }

      return true
    }
  }

  /**
   * 좋아요 여부 확인
   */
  static async isLiked(
    currentUserId: string,
    targetType: 'post' | 'comment',
    targetId: string
  ): Promise<boolean> {
    const tableName = targetType === 'post' ? 'post_likes' : 'comment_likes'
    const foreignKey = targetType === 'post' ? 'post_id' : 'comment_id'

    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq(foreignKey, targetId)
      .eq('user_id', currentUserId)
      .single()

    return !error && !!data
  }

  /**
   * 게시물을 좋아요한 사용자 목록 조회
   */
  static async getPostLikers(postId: string, limitCount: number = 50): Promise<UserProfile[]> {
    // 좋아요한 사용자 ID 조회
    const { data: likes } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('post_id', postId)
      .limit(limitCount)

    const likeData = (likes || []) as Pick<PostLikeRow, 'user_id'>[]

    if (likeData.length === 0) {
      return []
    }

    const userIds = likeData.map((l) => l.user_id)

    // 사용자 정보 조회
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)

    const userData = (users || []) as UserRow[]

    return userData.map((user) => ({
      id: user.id,
      uid: user.auth_id,
      email: user.email,
      displayName: user.display_name || undefined,
      nickname: user.nickname || undefined,
      profileImageUrl: user.profile_image_url || undefined,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
      postCount: user.post_count,
      commentCount: user.comment_count,
      forumCount: user.forum_count,
    }))
  }

  /**
   * 활동 기록 생성
   */
  static async createActivity(
    activityData: Omit<Activity, 'id' | 'createdAt'>
  ): Promise<void> {
    const insertData: ActivityInsert = {
      activity_type: activityData.type,
      user_id: activityData.userId,
      target_id: activityData.targetId,
      target_title: activityData.targetTitle,
      forum_isbn: activityData.forumIsbn,
      metadata: activityData.metadata as Database['public']['Tables']['activities']['Insert']['metadata'],
    }
    const { error } = await supabase.from('activities').insert(insertData as never)

    if (error) {
      console.error('활동 기록 생성 실패:', error)
    }
  }

  /**
   * 사용자 활동 피드 조회
   */
  static async getUserActivityFeed(
    userId: string,
    limitCount: number = 20
  ): Promise<Activity[]> {
    // 활동 조회
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    const activityData = (activities || []) as ActivityRow[]

    if (activityData.length === 0) {
      return []
    }

    // 사용자 정보 조회
    const { data: user } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .single()

    const userData = user as Pick<UserRow, 'email' | 'display_name'> | null

    return activityData.map((activity) => ({
      id: activity.id,
      type: activity.activity_type as Activity['type'],
      userId: activity.user_id,
      userName: userData?.display_name || userData?.email?.split('@')[0] || '',
      userEmail: userData?.email || '',
      targetId: activity.target_id,
      targetTitle: activity.target_title || undefined,
      forumIsbn: activity.forum_isbn || undefined,
      createdAt: activity.created_at,
      metadata: activity.metadata as Record<string, unknown> | undefined,
    }))
  }

  /**
   * 팔로잉 사용자들의 활동 피드 조회
   */
  static async getFollowingActivityFeed(
    userId: string,
    limitCount: number = 20
  ): Promise<Activity[]> {
    // 먼저 팔로잉 목록 조회
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    const follows = (followingData || []) as Pick<FollowRow, 'following_id'>[]

    if (follows.length === 0) return []

    const followingIds = follows.map((f) => f.following_id)

    // 활동 조회
    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    const activityData = (activities || []) as ActivityRow[]

    if (activityData.length === 0) {
      return []
    }

    // 사용자 정보 조회
    const userIds = [...new Set(activityData.map((a) => a.user_id))]
    const { data: users } = await supabase
      .from('users')
      .select('id, email, display_name')
      .in('id', userIds)

    type UserInfoData = { id: string; email: string; display_name: string | null }
    const userData = (users || []) as UserInfoData[]
    const userMap = new Map(userData.map((u) => [u.id, u]))

    return activityData.map((activity) => {
      const user = userMap.get(activity.user_id)
      return {
        id: activity.id,
        type: activity.activity_type as Activity['type'],
        userId: activity.user_id,
        userName: user?.display_name || user?.email?.split('@')[0] || '',
        userEmail: user?.email || '',
        targetId: activity.target_id,
        targetTitle: activity.target_title || undefined,
        forumIsbn: activity.forum_isbn || undefined,
        createdAt: activity.created_at,
        metadata: activity.metadata as Record<string, unknown> | undefined,
      }
    })
  }

  /**
   * 사용자 검색
   */
  static async searchUsers(searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
    return UserService.searchUsers(searchTerm, limitCount)
  }

  /**
   * 여러 게시물의 좋아요 여부 일괄 확인
   */
  static async checkMultipleLikes(
    userId: string,
    postIds: string[]
  ): Promise<Record<string, boolean>> {
    if (postIds.length === 0) return {}

    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (error) return {}

    const likeData = (data || []) as Pick<PostLikeRow, 'post_id'>[]
    const likedSet = new Set(likeData.map((l) => l.post_id))
    const result: Record<string, boolean> = {}

    postIds.forEach((id) => {
      result[id] = likedSet.has(id)
    })

    return result
  }
}

export default SocialService
