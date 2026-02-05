/**
 * Supabase Client Configuration
 *
 * 북살롱 v0.4.0 - Firebase → Supabase 마이그레이션
 *
 * @description
 * Supabase 클라이언트를 초기화하고 타입 안전한 API를 제공합니다.
 * 환경 변수에서 URL과 API 키를 가져옵니다.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// 테이블 이름 타입
export type TableName = keyof Database['public']['Tables']

// 타입 안전한 Supabase 클라이언트 타입
export type TypedSupabaseClient = SupabaseClient<Database>

// 환경 변수 검증 (줄바꿈 문자 제거를 위한 trim 적용)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY')
}

/**
 * Supabase 클라이언트 인스턴스
 *
 * @example
 * ```typescript
 * // 데이터 조회
 * const { data, error } = await supabase
 *   .from('users')
 *   .select('*')
 *   .eq('id', userId)
 *
 * // 인증
 * const { data, error } = await supabase.auth.signInWithOAuth({
 *   provider: 'kakao'
 * })
 * ```
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 자동 토큰 갱신
    autoRefreshToken: true,
    // 세션 유지
    persistSession: true,
    // 브라우저 탭 간 세션 동기화
    detectSessionInUrl: true,
  },
  // 실시간 구독 설정
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * 현재 인증된 사용자 ID 가져오기 (auth.uid())
 *
 * @returns 인증된 사용자의 UUID 또는 null
 */
export async function getCurrentAuthId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * 현재 세션 가져오기
 */
export async function getCurrentSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Supabase Auth 이벤트 리스너 타입
 */
export type AuthChangeEvent =
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

/**
 * 인증 상태 변경 구독
 *
 * @example
 * ```typescript
 * const { data: { subscription } } = onAuthStateChange((event, session) => {
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user)
 *   }
 * })
 *
 * // 구독 해제
 * subscription.unsubscribe()
 * ```
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Awaited<ReturnType<typeof getCurrentSession>>) => void
) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * 타입 안전한 테이블 쿼리 헬퍼
 * Supabase v2의 타입 추론 문제를 우회하기 위한 유틸리티
 */
export function typedTable<T extends TableName>(tableName: T) {
  return supabase.from(tableName)
}

export default supabase
