/**
 * Admin Service - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - Firebase adminService.ts → Supabase adminService.ts
 *
 * @description
 * 관리자 권한 확인, 사용자/포럼 관리, 신고 처리 등 관리자 기능.
 * Firebase의 doc/collection 방식에서 Supabase 테이블 쿼리 방식으로 변환.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'
import type { Report } from '../../types'

// 테이블 타입 직접 정의 (타입 추론 문제 해결)
type AdminRow = Database['public']['Tables']['admins']['Row']
type ReportRow = Database['public']['Tables']['reports']['Row']
type ReportInsert = Database['public']['Tables']['reports']['Insert']
type UserRow = Database['public']['Tables']['users']['Row']
type ForumRow = Database['public']['Tables']['forums']['Row']

// UserProfile 호환 타입 (기존 types.ts 호환)
interface AdminUserProfile {
  uid: string
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
  isActive?: boolean
}

// Forum 호환 타입 (기존 types.ts 호환)
interface AdminForum {
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
  popularity?: number
  averageRating?: number
  totalRatings?: number
}

export class AdminService {
  /**
   * 관리자 권한 확인
   *
   * @param userId - 사용자의 auth_id (currentUser.uid)
   * @returns admin 역할인 경우 true
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (error || !data) return false

      const adminData = data as Pick<AdminRow, 'role'>
      return adminData.role === 'admin'
    } catch (error) {
      console.error('관리자 권한 확인 실패:', error)
      return false
    }
  }

  /**
   * 관리자 권한 확인 (moderator 포함)
   *
   * @param userId - 사용자의 auth_id (currentUser.uid)
   * @returns admin 또는 moderator 역할인 경우 true
   */
  static async isModerator(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single()

      if (error || !data) return false

      const adminData = data as Pick<AdminRow, 'role'>
      return adminData.role === 'admin' || adminData.role === 'moderator'
    } catch (error) {
      console.error('관리자 권한 확인 실패:', error)
      return false
    }
  }

  /**
   * 관리자 역할 설정
   *
   * @param userId - 사용자의 auth_id (currentUser.uid)
   * @param role - 설정할 역할
   */
  static async setAdmin(userId: string, role: 'admin' | 'moderator'): Promise<void> {
    const { error } = await supabase
      .from('admins')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) throw new Error(`관리자 역할 설정 실패: ${error.message}`)
  }

  /**
   * 사용자 목록 조회
   *
   * @param limitCount - 조회할 사용자 수 (기본 50)
   * @returns 사용자 프로필 목록
   */
  static async getUsers(limitCount: number = 50): Promise<AdminUserProfile[]> {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount)

    const userData = (users || []) as UserRow[]

    return userData.map((user) => ({
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
      isActive: user.is_active,
    }))
  }

  /**
   * 사용자 검색
   *
   * @param searchTerm - 검색어 (display_name 기준)
   * @returns 매칭된 사용자 목록
   */
  static async searchUsers(searchTerm: string): Promise<AdminUserProfile[]> {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .ilike('display_name', `${searchTerm}%`)
      .limit(20)

    const userData = (users || []) as UserRow[]

    return userData.map((user) => ({
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
      isActive: user.is_active,
    }))
  }

  /**
   * 사용자 계정 비활성화
   *
   * @param userId - 사용자의 auth_id (currentUser.uid)
   */
  static async deactivateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        deactivated_by: 'admin',
      })
      .eq('auth_id', userId)

    if (error) throw new Error(`사용자 비활성화 실패: ${error.message}`)
  }

  /**
   * 사용자 계정 활성화
   *
   * @param userId - 사용자의 auth_id (currentUser.uid)
   */
  static async activateUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        is_active: true,
        deactivated_at: null,
        deactivated_by: null,
      })
      .eq('auth_id', userId)

    if (error) throw new Error(`사용자 활성화 실패: ${error.message}`)
  }

  /**
   * 포럼 목록 조회 (books 테이블 JOIN)
   *
   * @param limitCount - 조회할 포럼 수 (기본 50)
   * @returns 포럼 목록
   */
  static async getForums(limitCount: number = 50): Promise<AdminForum[]> {
    // forums 테이블 조회
    const { data: forums } = await supabase
      .from('forums')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount)

    const forumData = (forums || []) as ForumRow[]

    if (forumData.length === 0) return []

    // books 테이블에서 책 정보 조회
    const isbns = forumData.map((f) => f.isbn)
    const { data: books } = await supabase
      .from('books')
      .select('*')
      .in('isbn', isbns)

    type BookRow = Database['public']['Tables']['books']['Row']
    const bookData = (books || []) as BookRow[]
    const bookMap = new Map(bookData.map((b) => [b.isbn, b]))

    return forumData.map((forum) => {
      const book = bookMap.get(forum.isbn)
      return {
        isbn: forum.isbn,
        book: {
          isbn: forum.isbn,
          title: book?.title || '알 수 없는 책',
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
   * 포럼 삭제
   *
   * @param isbn - 포럼 ISBN
   */
  static async deleteForum(isbn: string): Promise<void> {
    const { error } = await supabase
      .from('forums')
      .delete()
      .eq('isbn', isbn)

    if (error) throw new Error(`포럼 삭제 실패: ${error.message}`)
  }

  /**
   * 신고 생성
   *
   * @param reporterId - 신고자의 auth_id (currentUser.uid)
   * @param type - 신고 유형
   * @param reason - 신고 사유
   * @param description - 상세 설명
   * @param metadata - 신고 대상 정보
   * @returns 생성된 신고 ID
   */
  static async createReport(
    reporterId: string,
    type: Report['type'],
    reason: string,
    description: string,
    metadata?: {
      reportedUserId?: string
      reportedPostId?: string
      reportedCommentId?: string
      reportedForumId?: string
    }
  ): Promise<string> {
    const insertData: ReportInsert = {
      reporter_id: reporterId,
      report_type: type,
      reason,
      description,
      status: 'pending',
      reported_user_id: metadata?.reportedUserId || null,
      reported_post_id: metadata?.reportedPostId || null,
      reported_comment_id: metadata?.reportedCommentId || null,
      reported_forum_isbn: metadata?.reportedForumId || null,
    }

    const { data, error } = await supabase
      .from('reports')
      .insert(insertData)
      .select('id')
      .single()

    if (error) throw new Error(`신고 생성 실패: ${error.message}`)

    const result = data as Pick<ReportRow, 'id'>
    return result.id
  }

  /**
   * 신고 목록 조회
   *
   * @param status - 상태 필터 (선택)
   * @returns 신고 목록
   */
  static async getReports(status?: Report['status']): Promise<Report[]> {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: reports } = await query

    const reportData = (reports || []) as ReportRow[]

    return reportData.map((report) => ({
      id: report.id,
      reporterId: report.reporter_id,
      reportedUserId: report.reported_user_id || undefined,
      reportedPostId: report.reported_post_id || undefined,
      reportedCommentId: report.reported_comment_id || undefined,
      reportedForumId: report.reported_forum_isbn || undefined,
      type: report.report_type,
      reason: report.reason,
      description: report.description || '',
      status: report.status,
      createdAt: report.created_at,
      resolvedAt: report.resolved_at || undefined,
      resolvedBy: report.resolved_by || undefined,
      resolution: report.resolution || undefined,
    }))
  }

  /**
   * 신고 상태 업데이트
   *
   * @param reportId - 신고 ID
   * @param status - 변경할 상태
   * @param resolvedBy - 처리한 관리자 ID
   * @param resolution - 처리 내용 (선택)
   */
  static async updateReportStatus(
    reportId: string,
    status: Report['status'],
    resolvedBy: string,
    resolution?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        resolution: resolution || null,
      })
      .eq('id', reportId)

    if (error) throw new Error(`신고 상태 업데이트 실패: ${error.message}`)
  }

  /**
   * 통계 조회
   *
   * @returns 총 사용자, 포럼, 게시물, 신고 수 및 대기중인 신고 수
   */
  static async getStats(): Promise<{
    totalUsers: number
    totalForums: number
    totalPosts: number
    totalReports: number
    pendingReports: number
  }> {
    const [usersResult, forumsResult, postsResult, reportsResult, pendingResult] =
      await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('forums').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ])

    return {
      totalUsers: usersResult.count || 0,
      totalForums: forumsResult.count || 0,
      totalPosts: postsResult.count || 0,
      totalReports: reportsResult.count || 0,
      pendingReports: pendingResult.count || 0,
    }
  }

  /**
   * 실시간 통계 리스너
   *
   * Supabase Realtime을 사용하여 테이블 변경 시 통계를 갱신합니다.
   * Firebase의 onSnapshot 패턴에 대응합니다.
   *
   * @param callback - 통계 데이터를 받을 콜백 함수
   * @returns 구독 해제 함수
   */
  static subscribeToStats(
    callback: (stats: {
      totalUsers: number
      totalForums: number
      totalPosts: number
      totalReports: number
      pendingReports: number
    }) => void
  ): () => void {
    // 변경 감지 시 통계 갱신하는 헬퍼
    const refreshStats = () => {
      this.getStats().then(callback).catch(console.error)
    }

    // Supabase Realtime 구독 (users, forums, reports 테이블 감시)
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        refreshStats
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'forums' },
        refreshStats
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        refreshStats
      )
      .subscribe()

    // 구독 해제 함수 반환
    return () => {
      supabase.removeChannel(channel)
    }
  }
}

export default AdminService
