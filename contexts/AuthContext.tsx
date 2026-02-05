/**
 * Auth Context - Supabase 마이그레이션 브릿지
 *
 * 북살롱 v0.4.0 - Firebase → Supabase 마이그레이션
 *
 * @description
 * 기존 컴포넌트들의 import 경로를 변경하지 않고 Supabase Auth를 사용할 수 있도록
 * SupabaseAuthContext를 re-export하는 브릿지 파일입니다.
 *
 * 이 파일은 마이그레이션 완료 후 제거할 수 있습니다.
 *
 * @deprecated 새로운 코드에서는 직접 SupabaseAuthContext를 import하세요.
 */

export {
  SupabaseAuthProvider as AuthProvider,
  useSupabaseAuth as useAuth,
  type SupabaseAuthContextType as AuthContextType,
} from './SupabaseAuthContext'
