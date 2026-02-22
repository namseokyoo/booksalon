/**
 * User Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase userProfile.ts → Supabase userService.ts
 *
 * @description
 * 사용자 프로필 CRUD, 관련 데이터(소셜 링크, 알림 설정, 선호 장르) 관리
 */

import { supabase, getCurrentAuthId } from '../supabase'
import type { Database } from '../database.types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type User = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']
type UserInsert = Database['public']['Tables']['users']['Insert']
type SocialLinkRow = Database['public']['Tables']['user_social_links']['Row']
type SocialLinkInsert = Database['public']['Tables']['user_social_links']['Insert']
type NotificationSettingsRow = Database['public']['Tables']['user_notification_settings']['Row']
type FavoriteGenreRow = Database['public']['Tables']['user_favorite_genres']['Row']

// 기존 types.ts와 호환을 위한 인터페이스
export interface UserProfile {
  id: string
  uid: string // 기존 호환성 (auth_id를 uid로 매핑)
  email: string
  displayName?: string
  nickname?: string
  bio?: string
  profileImageUrl?: string
  createdAt: string
  lastLoginAt: string
  postCount: number
  commentCount: number
  forumCount: number
  bookmarkedForums?: string[]
  following?: string[]
  followers?: string[]
  favoriteGenres?: string[]
  readingGoal?: number
  location?: string
  website?: string
  socialLinks?: {
    twitter?: string
    instagram?: string
    blog?: string
  }
  notificationSettings?: {
    newPosts: boolean
    newComments: boolean
    forumUpdates: boolean
    follows: boolean
    likes: boolean
    emailNotifications: boolean
  }
}

// Supabase 데이터를 기존 UserProfile 형식으로 변환
function transformToUserProfile(
  user: User,
  socialLinks?: SocialLinkRow[],
  notificationSettings?: NotificationSettingsRow,
  favoriteGenres?: FavoriteGenreRow[]
): UserProfile {
  // 소셜 링크 변환
  const socialLinksObj: UserProfile['socialLinks'] = {}
  if (socialLinks) {
    socialLinks.forEach((link) => {
      if (link.platform === 'twitter') socialLinksObj.twitter = link.url
      if (link.platform === 'instagram') socialLinksObj.instagram = link.url
      if (link.platform === 'blog') socialLinksObj.blog = link.url
    })
  }

  return {
    id: user.id,
    uid: user.auth_id, // 기존 호환성
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
    readingGoal: user.reading_goal || undefined,
    location: user.location || undefined,
    website: user.website || undefined,
    favoriteGenres: favoriteGenres?.map((g) => g.genre) || [],
    socialLinks: Object.keys(socialLinksObj).length > 0 ? socialLinksObj : undefined,
    notificationSettings: notificationSettings
      ? {
          newPosts: notificationSettings.new_posts,
          newComments: notificationSettings.new_comments,
          forumUpdates: notificationSettings.forum_updates,
          follows: notificationSettings.follows,
          likes: notificationSettings.likes,
          emailNotifications: notificationSettings.email_notifications,
        }
      : undefined,
  }
}

export class UserService {
  /**
   * 사용자 프로필 생성 또는 업데이트
   * Firebase의 createOrUpdateProfile에 해당
   */
  static async createOrUpdateProfile(
    authId: string,
    email: string,
    displayName?: string,
    nickname?: string,
    bio?: string,
    profileImageUrl?: string
  ): Promise<UserProfile> {
    // 기존 사용자 확인
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .single()

    const existingData = existingUser as User | null

    if (existingData) {
      // 기존 사용자 업데이트
      const updateData: UserUpdate = {
        display_name: displayName || existingData.display_name,
        nickname: nickname || existingData.nickname,
        bio: bio !== undefined ? bio : existingData.bio,
        profile_image_url: profileImageUrl || existingData.profile_image_url,
        last_login_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('users')
        .update(updateData )
        .eq('auth_id', authId)
        .select()
        .single()

      if (error) throw new Error(`프로필 업데이트 실패: ${error.message}`)
      return transformToUserProfile(data as User)
    } else {
      // 새 사용자 생성
      const defaultDisplayName = displayName || email.split('@')[0]
      const defaultNickname = nickname || email.split('@')[0]

      const insertData: UserInsert = {
        auth_id: authId,
        email: email,
        display_name: defaultDisplayName,
        nickname: defaultNickname,
        bio: bio || '',
        profile_image_url: profileImageUrl || null,
        post_count: 0,
        comment_count: 0,
        forum_count: 0,
        reading_goal: 0,
      }
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(insertData )
        .select()
        .single()

      if (insertError) throw new Error(`프로필 생성 실패: ${insertError.message}`)

      const newUserData = newUser as User

      // 기본 알림 설정 생성
      await supabase.from('user_notification_settings').insert({
        user_id: newUserData.id,
      } )

      return transformToUserProfile(newUserData)
    }
  }

  /**
   * auth_id로 사용자 프로필 조회 (전체 데이터 포함)
   */
  static async getUserProfileByAuthId(authId: string): Promise<UserProfile | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle()

    if (error || !user) return null

    const userData = user as User

    // 관련 데이터 조회
    const [socialLinks, notificationSettings, favoriteGenres] = await Promise.all([
      supabase.from('user_social_links').select('*').eq('user_id', userData.id),
      supabase.from('user_notification_settings').select('*').eq('user_id', userData.id).maybeSingle(),
      supabase.from('user_favorite_genres').select('*').eq('user_id', userData.id),
    ])

    return transformToUserProfile(
      userData,
      (socialLinks.data || []) as SocialLinkRow[],
      (notificationSettings.data || undefined) as NotificationSettingsRow | undefined,
      (favoriteGenres.data || []) as FavoriteGenreRow[]
    )
  }

  /**
   * user_id로 사용자 프로필 조회
   */
  static async getUserProfileById(userId: string): Promise<UserProfile | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !user) return null

    const userData = user as User

    // 관련 데이터 조회
    const [socialLinks, notificationSettings, favoriteGenres] = await Promise.all([
      supabase.from('user_social_links').select('*').eq('user_id', userData.id),
      supabase.from('user_notification_settings').select('*').eq('user_id', userData.id).maybeSingle(),
      supabase.from('user_favorite_genres').select('*').eq('user_id', userData.id),
    ])

    return transformToUserProfile(
      userData,
      (socialLinks.data || []) as SocialLinkRow[],
      (notificationSettings.data || undefined) as NotificationSettingsRow | undefined,
      (favoriteGenres.data || []) as FavoriteGenreRow[]
    )
  }

  /**
   * 사용자 프로필 업데이트 (부분 업데이트)
   */
  static async updateProfile(
    userId: string,
    updates: {
      displayName?: string
      nickname?: string
      bio?: string
      profileImageUrl?: string
      location?: string
      website?: string
      readingGoal?: number
    }
  ): Promise<UserProfile> {
    const updateData: UserUpdate = {}

    if (updates.displayName !== undefined) updateData.display_name = updates.displayName
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname
    if (updates.bio !== undefined) updateData.bio = updates.bio
    if (updates.profileImageUrl !== undefined) updateData.profile_image_url = updates.profileImageUrl
    if (updates.location !== undefined) updateData.location = updates.location
    if (updates.website !== undefined) updateData.website = updates.website
    if (updates.readingGoal !== undefined) updateData.reading_goal = updates.readingGoal

    const { data, error } = await supabase
      .from('users')
      .update(updateData )
      .eq('id', userId)
      .select()
      .single()

    if (error) throw new Error(`프로필 업데이트 실패: ${error.message}`)
    return transformToUserProfile(data as User)
  }

  /**
   * 소셜 링크 업데이트
   */
  static async updateSocialLinks(
    userId: string,
    socialLinks: { twitter?: string; instagram?: string; blog?: string }
  ): Promise<void> {
    // 기존 링크 삭제 후 새로 추가 (upsert 대신)
    await supabase.from('user_social_links').delete().eq('user_id', userId)

    const linksToInsert: SocialLinkInsert[] = []
    if (socialLinks.twitter) {
      linksToInsert.push({ user_id: userId, platform: 'twitter', url: socialLinks.twitter })
    }
    if (socialLinks.instagram) {
      linksToInsert.push({ user_id: userId, platform: 'instagram', url: socialLinks.instagram })
    }
    if (socialLinks.blog) {
      linksToInsert.push({ user_id: userId, platform: 'blog', url: socialLinks.blog })
    }

    if (linksToInsert.length > 0) {
      const { error } = await supabase.from('user_social_links').insert(linksToInsert )
      if (error) throw new Error(`소셜 링크 업데이트 실패: ${error.message}`)
    }
  }

  /**
   * 알림 설정 업데이트
   */
  static async updateNotificationSettings(
    userId: string,
    settings: {
      newPosts?: boolean
      newComments?: boolean
      forumUpdates?: boolean
      follows?: boolean
      likes?: boolean
      emailNotifications?: boolean
    }
  ): Promise<void> {
    const upsertData = {
      user_id: userId,
      new_posts: settings.newPosts,
      new_comments: settings.newComments,
      forum_updates: settings.forumUpdates,
      follows: settings.follows,
      likes: settings.likes,
      email_notifications: settings.emailNotifications,
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase
      .from('user_notification_settings')
      .upsert(upsertData )

    if (error) throw new Error(`알림 설정 업데이트 실패: ${error.message}`)
  }

  /**
   * 선호 장르 업데이트
   */
  static async updateFavoriteGenres(userId: string, genres: string[]): Promise<void> {
    // 기존 장르 삭제
    await supabase.from('user_favorite_genres').delete().eq('user_id', userId)

    // 새 장르 추가
    if (genres.length > 0) {
      const genresToInsert = genres.map((genre) => ({
        user_id: userId,
        genre: genre,
      }))

      const { error } = await supabase.from('user_favorite_genres').insert(genresToInsert )
      if (error) throw new Error(`선호 장르 업데이트 실패: ${error.message}`)
    }
  }

  /**
   * 사용자의 게시물 조회
   */
  static async getUserPosts(userId: string, limitCount: number = 50) {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        post_tags(tag_name),
        post_images(*)
      `
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) throw new Error(`게시물 조회 실패: ${error.message}`)
    return data || []
  }

  /**
   * 사용자의 댓글 조회
   */
  static async getUserComments(userId: string, limitCount: number = 50) {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        *,
        posts!inner(id, title, forum_isbn)
      `
      )
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) throw new Error(`댓글 조회 실패: ${error.message}`)
    return data || []
  }

  /**
   * 사용자 비활성화
   */
  static async deactivateUser(userId: string, reason?: string): Promise<void> {
    const updateData: UserUpdate = {
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: reason || 'user_request',
    }
    const { error } = await supabase
      .from('users')
      .update(updateData )
      .eq('id', userId)

    if (error) throw new Error(`사용자 비활성화 실패: ${error.message}`)
  }

  /**
   * 현재 로그인한 사용자의 프로필 조회
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    const authId = await getCurrentAuthId()
    if (!authId) return null
    return this.getUserProfileByAuthId(authId)
  }

  /**
   * 사용자 검색 (닉네임, 이름, 이메일)
   */
  static async searchUsers(searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
    const normalizedTerm = searchTerm.toLowerCase()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(
        `display_name.ilike.%${normalizedTerm}%,nickname.ilike.%${normalizedTerm}%,email.ilike.%${normalizedTerm}%`
      )
      .eq('is_active', true)
      .limit(limitCount)

    if (error) return []
    return data?.map((user) => transformToUserProfile(user)) || []
  }

  /**
   * 사용자 통계 증가 (게시물, 댓글, 포럼 카운트)
   * Firebase의 updateUserStats에 해당
   *
   * @param authId - 사용자의 auth_id (Supabase Auth UID)
   * @param statField - 증가시킬 필드 ('post_count' | 'comment_count' | 'forum_count')
   * @param increment - 증가량 (기본값: 1)
   */
  static async incrementStat(
    authId: string,
    statField: 'post_count' | 'comment_count' | 'forum_count',
    increment: number = 1
  ): Promise<void> {
    // 먼저 현재 사용자 정보 조회
    const { data: user, error: selectError } = await supabase
      .from('users')
      .select('id, post_count, comment_count, forum_count')
      .eq('auth_id', authId)
      .single()

    if (selectError || !user) {
      throw new Error(`사용자 조회 실패: ${selectError?.message || '사용자를 찾을 수 없습니다'}`)
    }

    // 통계 업데이트
    const currentValue = (user as User)[statField] || 0
    const newValue = currentValue + increment

    const updateData: UserUpdate = {
      [statField]: newValue,
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData )
      .eq('auth_id', authId)

    if (updateError) {
      throw new Error(`통계 업데이트 실패: ${updateError.message}`)
    }
  }

  /**
   * 사용자 통계 감소
   */
  static async decrementStat(
    authId: string,
    statField: 'post_count' | 'comment_count' | 'forum_count',
    decrement: number = 1
  ): Promise<void> {
    await this.incrementStat(authId, statField, -decrement)
  }
}

export default UserService
