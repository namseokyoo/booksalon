/**
 * Reading Log Service - 독서 로그 관리
 *
 * 북살롱 Phase 3-1 - 독서 로그 기능
 *
 * @description
 * 사용자의 독서 활동(읽는 중, 완독, 읽고 싶은 책)을 기록하고 관리합니다.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

type ReadingLogRow = Database['public']['Tables']['reading_logs']['Row']
type ReadingLogInsert = Database['public']['Tables']['reading_logs']['Insert']
type ReadingLogUpdate = Database['public']['Tables']['reading_logs']['Update']

export type ReadingStatus = 'reading' | 'completed' | 'want_to_read'

export interface ReadingLog {
  id: string
  userId: string
  forumIsbn: string
  status: ReadingStatus
  startedAt: string | null
  finishedAt: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface ReadingStats {
  reading: number
  completed: number
  wantToRead: number
}

function transformToReadingLog(row: ReadingLogRow): ReadingLog {
  return {
    id: row.id,
    userId: row.user_id,
    forumIsbn: row.forum_isbn,
    status: row.status as ReadingStatus,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export class ReadingLogService {
  /**
   * 사용자의 전체 독서 로그 조회
   */
  static async getReadingLogs(userId: string): Promise<ReadingLog[]> {
    const { data, error } = await supabase
      .from('reading_logs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('독서 로그 조회 실패:', error)
      return []
    }

    const rows = (data || []) as ReadingLogRow[]
    return rows.map(transformToReadingLog)
  }

  /**
   * 특정 책의 독서 로그 조회
   */
  static async getReadingLogByIsbn(
    userId: string,
    isbn: string
  ): Promise<ReadingLog | null> {
    const { data, error } = await supabase
      .from('reading_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('forum_isbn', isbn)
      .maybeSingle()

    if (error || !data) return null

    return transformToReadingLog(data as ReadingLogRow)
  }

  /**
   * 독서 로그 추가/업데이트 (upsert)
   */
  static async upsertReadingLog(
    userId: string,
    isbn: string,
    status: ReadingStatus,
    note?: string | null,
    startedAt?: string | null,
    finishedAt?: string | null
  ): Promise<void> {
    // 기존 로그 확인
    const { data: existing } = await supabase
      .from('reading_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('forum_isbn', isbn)
      .maybeSingle()

    const now = new Date().toISOString()

    if (existing) {
      // 업데이트
      const updateData: ReadingLogUpdate = {
        status,
        updated_at: now,
      }
      if (note !== undefined) updateData.note = note
      if (startedAt !== undefined) updateData.started_at = startedAt
      if (finishedAt !== undefined) updateData.finished_at = finishedAt

      // 상태에 따른 자동 날짜 설정
      if (status === 'reading' && startedAt === undefined) {
        updateData.started_at = now
      }
      if (status === 'completed' && finishedAt === undefined) {
        updateData.finished_at = now
      }

      const { error } = await supabase
        .from('reading_logs')
        .update(updateData)
        .eq('id', (existing as { id: string }).id)

      if (error) throw new Error(`독서 로그 업데이트 실패: ${error.message}`)
    } else {
      // 새로 생성
      const insertData: ReadingLogInsert = {
        user_id: userId,
        forum_isbn: isbn,
        status,
        note: note || null,
        started_at: startedAt || (status === 'reading' ? now : null),
        finished_at: finishedAt || (status === 'completed' ? now : null),
      }

      const { error } = await supabase
        .from('reading_logs')
        .insert(insertData)

      if (error) throw new Error(`독서 로그 생성 실패: ${error.message}`)
    }
  }

  /**
   * 독서 로그 삭제
   */
  static async deleteReadingLog(
    userId: string,
    isbn: string
  ): Promise<void> {
    const { error } = await supabase
      .from('reading_logs')
      .delete()
      .eq('user_id', userId)
      .eq('forum_isbn', isbn)

    if (error) throw new Error(`독서 로그 삭제 실패: ${error.message}`)
  }

  /**
   * 독서 통계 조회
   */
  static async getReadingStats(userId: string): Promise<ReadingStats> {
    const { data, error } = await supabase
      .from('reading_logs')
      .select('status')
      .eq('user_id', userId)

    if (error || !data) {
      return { reading: 0, completed: 0, wantToRead: 0 }
    }

    const rows = data as Pick<ReadingLogRow, 'status'>[]
    const stats: ReadingStats = { reading: 0, completed: 0, wantToRead: 0 }

    rows.forEach((row) => {
      switch (row.status) {
        case 'reading':
          stats.reading++
          break
        case 'completed':
          stats.completed++
          break
        case 'want_to_read':
          stats.wantToRead++
          break
      }
    })

    return stats
  }
}

export default ReadingLogService
