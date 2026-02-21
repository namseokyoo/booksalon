/**
 * Reading Log Service - 독서 로그 관리
 *
 * 북살롱 - 사용자의 독서 상태 추적 (읽는 중, 완독, 읽고 싶음)
 *
 * @description
 * bookmarkService.ts 패턴을 참조하여 작성.
 * reading_logs 테이블을 통한 독서 상태 관리.
 */

import { supabase } from '../supabase'
import type { Database } from '../database.types'

type ReadingLogRow = Database['public']['Tables']['reading_logs']['Row']
type ReadingLogInsert = Database['public']['Tables']['reading_logs']['Insert']

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
   * 사용자의 모든 독서 로그 조회
   */
  static async getReadingLogs(userId: string): Promise<ReadingLog[]> {
    const { data, error } = await supabase
      .from('reading_logs')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error || !data) return []
    return (data as ReadingLogRow[]).map(transformToReadingLog)
  }

  /**
   * 특정 책의 독서 상태 조회
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
      .single()

    if (error || !data) return null
    return transformToReadingLog(data as ReadingLogRow)
  }

  /**
   * 독서 로그 upsert (생성 또는 업데이트)
   *
   * - reading 상태로 변경 시 started_at 자동 설정
   * - completed 상태로 변경 시 finished_at 자동 설정
   */
  static async upsertReadingLog(
    userId: string,
    isbn: string,
    status: ReadingStatus,
    note?: string,
    startedAt?: string,
    finishedAt?: string
  ): Promise<ReadingLog> {
    const now = new Date().toISOString()

    // 기존 로그 확인
    const { data: existing } = await supabase
      .from('reading_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('forum_isbn', isbn)
      .single()

    const existingData = existing as ReadingLogRow | null

    // 자동 타임스탬프 설정
    let resolvedStartedAt = startedAt || existingData?.started_at || null
    let resolvedFinishedAt = finishedAt || existingData?.finished_at || null

    if (status === 'reading' && !resolvedStartedAt) {
      resolvedStartedAt = now
    }
    if (status === 'completed' && !resolvedFinishedAt) {
      resolvedFinishedAt = now
      if (!resolvedStartedAt) {
        resolvedStartedAt = now
      }
    }

    if (existingData) {
      // 업데이트
      const { data, error } = await supabase
        .from('reading_logs')
        .update({
          status,
          started_at: resolvedStartedAt,
          finished_at: resolvedFinishedAt,
          note: note !== undefined ? note : existingData.note,
          updated_at: now,
        })
        .eq('id', existingData.id)
        .select()
        .single()

      if (error) throw new Error(`독서 로그 업데이트 실패: ${error.message}`)
      return transformToReadingLog(data as ReadingLogRow)
    } else {
      // 생성
      const insertData: ReadingLogInsert = {
        user_id: userId,
        forum_isbn: isbn,
        status,
        started_at: resolvedStartedAt,
        finished_at: resolvedFinishedAt,
        note: note || null,
        created_at: now,
        updated_at: now,
      }

      const { data, error } = await supabase
        .from('reading_logs')
        .insert(insertData)
        .select()
        .single()

      if (error) throw new Error(`독서 로그 생성 실패: ${error.message}`)
      return transformToReadingLog(data as ReadingLogRow)
    }
  }

  /**
   * 독서 로그 삭제
   */
  static async deleteReadingLog(userId: string, isbn: string): Promise<void> {
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

    const logs = data as Pick<ReadingLogRow, 'status'>[]
    return {
      reading: logs.filter((l) => l.status === 'reading').length,
      completed: logs.filter((l) => l.status === 'completed').length,
      wantToRead: logs.filter((l) => l.status === 'want_to_read').length,
    }
  }
}

export default ReadingLogService
