-- =====================================================
-- RLS 정책 수정 Phase 2 마이그레이션
--
-- 문제: activities SELECT 정책이 본인 활동만 조회 가능하여
--       팔로잉 피드(getFollowingActivityFeed)에서
--       다른 사용자의 활동을 볼 수 없음
--
-- 수정 전략:
--   activities SELECT: "본인만 조회" → "인증된 사용자 전체 조회"
--   (활동 피드는 소셜 기능이므로 모든 인증 사용자가 조회 가능해야 함)
--   INSERT 정책은 기존 유지 (본인 활동만 생성 가능)
-- =====================================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view own activities" ON activities;

-- 새 SELECT 정책: 인증된 사용자는 모든 활동 조회 가능
CREATE POLICY "Authenticated users can view all activities"
ON activities FOR SELECT
USING (auth.role() = 'authenticated');

-- INSERT 정책은 기존 유지 (20260222100000_fix_rls_policies.sql에서 생성됨)
-- "Authenticated users can create activities" - 유지

-- =====================================================
-- 마이그레이션 완료
--
-- 변경 요약:
-- - activities SELECT: user_id 기반 본인만 → 인증 사용자 전체 조회
-- - activities INSERT: 변경 없음 (본인 활동만 생성 가능)
-- =====================================================
