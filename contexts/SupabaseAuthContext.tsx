/**
 * Supabase Auth Context
 *
 * 북살롱 v0.4.0 - Firebase → Supabase 마이그레이션
 *
 * @description
 * Supabase 기반 인증 컨텍스트 제공.
 * Firebase Auth Context와 동일한 인터페이스를 유지하여 마이그레이션 영향 최소화.
 *
 * 지원하는 인증 방식:
 * - 카카오 OAuth (oidc.kakao → Supabase kakao)
 * - 구글 OAuth
 * - 이메일/비밀번호 (선택)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react'
import { supabase, onAuthStateChange, getCurrentAuthId } from '../lib/supabase'
import { UserService, type UserProfile } from '../lib/services/userService'
import type { User, Session, AuthError, Provider } from '@supabase/supabase-js'

/**
 * Firebase 호환 User 인터페이스
 * Supabase User에 uid 프로퍼티 추가 (기존 코드 호환)
 */
export interface CompatibleUser extends User {
  uid: string  // Firebase 호환성: id와 동일
}

/**
 * Supabase User를 Firebase 호환 User로 변환
 */
function toCompatibleUser(user: User): CompatibleUser {
  return {
    ...user,
    uid: user.id,  // Firebase의 uid = Supabase의 id
  }
}

/**
 * Auth Context 타입 (기존 Firebase AuthContext와 호환)
 */
export interface SupabaseAuthContextType {
  // 현재 사용자 (Firebase 호환 User 객체, uid 포함)
  currentUser: CompatibleUser | null
  // 사용자 프로필 (DB users 테이블 데이터)
  userProfile: UserProfile | null
  // 로딩 상태
  loading: boolean
  // 이메일/비밀번호 회원가입
  signup: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  // 이메일/비밀번호 로그인
  login: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>
  // 구글 로그인
  loginWithGoogle: () => Promise<void>
  // 카카오 로그인
  loginWithKakao: () => Promise<void>
  // 로그아웃
  logout: () => Promise<void>
  // 계정 삭제
  deleteAccount: () => Promise<void>
  // 프로필 새로고침
  refreshProfile: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null)

/**
 * Supabase Auth 훅
 *
 * @throws AuthProvider 외부에서 사용 시 에러
 */
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider')
  }
  return context
}

/**
 * Supabase Auth Provider
 */
export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CompatibleUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * 사용자 프로필 로드/생성
   */
  const loadOrCreateProfile = useCallback(async (user: User) => {
    try {
      // 기존 프로필 조회
      let profile = await UserService.getUserProfileByAuthId(user.id)

      // 없으면 새로 생성
      if (!profile) {
        const displayName = user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          '사용자'
        const nickname = user.user_metadata?.nickname || displayName

        profile = await UserService.createOrUpdateProfile(
          user.id,
          user.email || '',
          displayName,
          nickname
        )
      } else {
        // 마지막 로그인 시간 업데이트
        await UserService.createOrUpdateProfile(
          user.id,
          user.email || ''
        )
      }

      setUserProfile(profile)
    } catch (error) {
      console.error('프로필 로드/생성 실패:', error)
    }
  }, [])

  /**
   * 이메일/비밀번호 회원가입
   */
  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (data.user && !error) {
      await loadOrCreateProfile(data.user)
    }

    return { user: data.user, error }
  }

  /**
   * 이메일/비밀번호 로그인
   */
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { user: data.user, error }
  }

  /**
   * OAuth 로그인 공통 로직
   */
  const loginWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      console.error(`${provider} 로그인 실패:`, error)
      throw new Error(error.message)
    }
  }

  /**
   * 구글 로그인
   */
  const loginWithGoogle = async () => {
    await loginWithOAuth('google')
  }

  /**
   * 카카오 로그인
   */
  const loginWithKakao = async () => {
    await loginWithOAuth('kakao')
  }

  /**
   * 로그아웃
   */
  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('로그아웃 실패:', error)
      throw error
    }
    setCurrentUser(null)
    setUserProfile(null)
  }

  /**
   * 계정 삭제
   *
   * 주의: Supabase에서 사용자 삭제는 서버 사이드에서만 가능
   * 클라이언트에서는 비활성화 처리
   */
  const deleteAccount = async () => {
    const authId = await getCurrentAuthId()
    if (!authId) {
      throw new Error('로그인된 사용자가 없습니다.')
    }

    // 프로필 비활성화
    if (userProfile) {
      await UserService.deactivateUser(userProfile.id, 'user_deletion_request')
    }

    // 로그아웃 처리
    await logout()

    // 참고: 실제 auth.users 삭제는 Supabase Dashboard 또는
    // Edge Function에서 admin API로 처리해야 함
    console.warn('계정 삭제 요청됨. 완전한 삭제는 관리자에게 문의하세요.')
  }

  /**
   * 프로필 새로고침
   */
  const refreshProfile = async () => {
    if (currentUser) {
      await loadOrCreateProfile(currentUser)
    }
  }

  /**
   * 인증 상태 변경 구독
   */
  useEffect(() => {
    // 초기 세션 확인 (OAuth 콜백 감지 후 타임아웃 조정)
    const initializeAuth = async () => {
      try {
        // OAuth 콜백 처리 중인지 감지 (네트워크 왕복이 추가되므로 더 긴 타임아웃 필요)
        const isOAuthCallback = window.location.hash.includes('access_token') ||
                                window.location.search.includes('code=')
        const timeoutMs = isOAuthCallback ? 20000 : 15000

        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => {
            console.warn(`Auth 초기화 타임아웃 (${timeoutMs / 1000}초). 미인증 상태로 진행합니다.`)
            resolve({ data: { session: null } })
          }, timeoutMs)
        )

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])

        if (session?.user) {
          setCurrentUser(toCompatibleUser(session.user))
          await loadOrCreateProfile(session.user)
        }
      } catch (error) {
        console.error('초기 인증 확인 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      try {
        if (event === 'INITIAL_SESSION') {
          // Supabase v2: 등록 즉시 발생하는 초기 세션 이벤트
          if (session?.user) {
            setCurrentUser(toCompatibleUser(session.user))
            await loadOrCreateProfile(session.user)
          } else {
            setCurrentUser(null)
            setUserProfile(null)
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          setCurrentUser(toCompatibleUser(session.user))
          await loadOrCreateProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null)
          setUserProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setCurrentUser(toCompatibleUser(session.user))
        } else if (event === 'USER_UPDATED' && session?.user) {
          setCurrentUser(toCompatibleUser(session.user))
          await loadOrCreateProfile(session.user)
        }
      } catch (error) {
        console.error('인증 상태 변경 처리 실패:', error)
      } finally {
        setLoading(false)
      }
    })

    // 클린업
    return () => {
      subscription.unsubscribe()
    }
  }, [loadOrCreateProfile])

  const value: SupabaseAuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    loginWithKakao,
    logout,
    deleteAccount,
    refreshProfile,
  }

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

export default SupabaseAuthProvider
