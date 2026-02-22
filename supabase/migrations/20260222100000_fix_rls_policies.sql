-- =====================================================
-- RLS 정책 수정 마이그레이션
--
-- 문제: 신규 가입 사용자의 INSERT가 차단됨
-- 근본 원인: get_current_user_id() 함수가 users 테이블에 레코드가
--           없는 신규 사용자에 대해 NULL을 반환하여,
--           FOR ALL 정책의 WITH CHECK 조건이 실패함
--
-- 수정 전략:
--   1. FOR ALL 정책에서 INSERT를 분리하여 별도 INSERT 정책 생성
--   2. INSERT 정책은 auth.uid() 기반으로 검증 (users 테이블 미참조)
--   3. SELECT/UPDATE/DELETE는 기존 get_current_user_id() 기반 유지
--   4. reading_logs 테이블의 user_id FK 참조 수정 (auth.users → public.users)
--
-- 영향 테이블: user_notification_settings, user_social_links,
--   user_favorite_genres, ratings, bookmarks, post_likes,
--   comment_likes, follows, reading_logs
-- =====================================================

-- =====================================================
-- 헬퍼: auth.uid() → users.id 매핑 (INSERT 정책용)
-- get_current_user_id()와 동일하지만 명시적 이름으로 구분
-- =====================================================

-- =====================================================
-- 1. user_notification_settings - INSERT 정책 분리
-- 문제: FOR ALL 정책이 get_current_user_id()에 의존하여
--       users 레코드 생성 직후 notification_settings INSERT 실패
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own notification settings" ON user_notification_settings;

-- SELECT 정책은 이미 존재 (유지)
-- "Users can view own notification settings" - 유지

-- INSERT 정책: 인증된 사용자가 자신의 설정 생성 가능
-- users 테이블의 id를 사용하되, auth.uid() 기반 검증
CREATE POLICY "Users can insert own notification settings"
ON user_notification_settings FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책: 기존과 동일하게 get_current_user_id() 사용
CREATE POLICY "Users can update own notification settings"
ON user_notification_settings FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own notification settings"
ON user_notification_settings FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 2. user_social_links - INSERT 정책 분리
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own social links" ON user_social_links;

-- INSERT 정책
CREATE POLICY "Users can insert own social links"
ON user_social_links FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책
CREATE POLICY "Users can update own social links"
ON user_social_links FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own social links"
ON user_social_links FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 3. user_favorite_genres - INSERT 정책 분리
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own favorite genres" ON user_favorite_genres;

-- INSERT 정책
CREATE POLICY "Users can insert own favorite genres"
ON user_favorite_genres FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책
CREATE POLICY "Users can update own favorite genres"
ON user_favorite_genres FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own favorite genres"
ON user_favorite_genres FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 4. ratings - INSERT 정책 분리
-- 문제: BUG-002 - 평점 저장 실패 (403)
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own ratings" ON ratings;

-- INSERT 정책
CREATE POLICY "Users can insert own ratings"
ON ratings FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책
CREATE POLICY "Users can update own ratings"
ON ratings FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own ratings"
ON ratings FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 5. bookmarks - INSERT 정책 분리
-- 문제: BUG-003 - 북마크 추가 실패 (403)
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON bookmarks;

-- SELECT 정책은 이미 존재 ("Users can view own bookmarks" - 유지)

-- INSERT 정책
CREATE POLICY "Users can insert own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책 (북마크는 업데이트할 일이 없지만 안전을 위해)
CREATE POLICY "Users can update own bookmarks"
ON bookmarks FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 6. post_likes - INSERT 정책 분리
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own post likes" ON post_likes;

-- INSERT 정책
CREATE POLICY "Users can insert own post likes"
ON post_likes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책 (좋아요는 업데이트할 일이 없지만 안전을 위해)
CREATE POLICY "Users can update own post likes"
ON post_likes FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own post likes"
ON post_likes FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 7. comment_likes - INSERT 정책 분리
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own comment likes" ON comment_likes;

-- INSERT 정책
CREATE POLICY "Users can insert own comment likes"
ON comment_likes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책
CREATE POLICY "Users can update own comment likes"
ON comment_likes FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own comment likes"
ON comment_likes FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 8. follows - INSERT 정책 분리
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own follows" ON follows;

-- INSERT 정책
CREATE POLICY "Users can insert own follows"
ON follows FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = follower_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책
CREATE POLICY "Users can update own follows"
ON follows FOR UPDATE
USING (follower_id = get_current_user_id())
WITH CHECK (follower_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own follows"
ON follows FOR DELETE
USING (follower_id = get_current_user_id());

-- =====================================================
-- 9. chat_room_participants - INSERT 정책 분리
-- =====================================================

-- 기존 FOR ALL 정책 삭제
DROP POLICY IF EXISTS "Users can manage own chat room participations" ON chat_room_participants;

-- INSERT 정책
CREATE POLICY "Users can insert own chat room participations"
ON chat_room_participants FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- UPDATE 정책
CREATE POLICY "Users can update own chat room participations"
ON chat_room_participants FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- DELETE 정책
CREATE POLICY "Users can delete own chat room participations"
ON chat_room_participants FOR DELETE
USING (user_id = get_current_user_id());

-- =====================================================
-- 10. reading_logs - FK 참조 수정 + RLS 정책 수정
-- 문제: BUG-004 - user_id가 auth.users(id)를 참조하지만,
--       서비스 코드에서는 users 테이블의 id를 전달함
--
-- 수정: user_id FK를 public.users(id)로 변경하고,
--       RLS 정책도 users 테이블 JOIN 기반으로 변경
-- =====================================================

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can read own reading logs" ON reading_logs;
DROP POLICY IF EXISTS "Users can insert own reading logs" ON reading_logs;
DROP POLICY IF EXISTS "Users can update own reading logs" ON reading_logs;
DROP POLICY IF EXISTS "Users can delete own reading logs" ON reading_logs;

-- FK 제약 조건 변경: auth.users(id) → public.users(id)
ALTER TABLE reading_logs DROP CONSTRAINT IF EXISTS reading_logs_user_id_fkey;
ALTER TABLE reading_logs ADD CONSTRAINT reading_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 새 RLS 정책 (users 테이블 JOIN 기반)
CREATE POLICY "Users can read own reading logs"
ON reading_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

CREATE POLICY "Users can insert own reading logs"
ON reading_logs FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

CREATE POLICY "Users can update own reading logs"
ON reading_logs FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

CREATE POLICY "Users can delete own reading logs"
ON reading_logs FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- =====================================================
-- 11. bookmarks SELECT 정책 수정
-- 기존: user_id = get_current_user_id()
-- 신규 사용자도 자신의 (빈) 북마크 목록을 조회할 수 있도록 수정
-- =====================================================

DROP POLICY IF EXISTS "Users can view own bookmarks" ON bookmarks;

CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- =====================================================
-- 12. activities SELECT/INSERT 정책 수정
-- 기존 SELECT: user_id = get_current_user_id()
-- 기존 INSERT: auth.role() = 'authenticated'
-- activities의 user_id도 users.id를 참조하므로 일관성 유지
-- =====================================================

DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "System can create activities" ON activities;

CREATE POLICY "Users can view own activities"
ON activities FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

CREATE POLICY "Authenticated users can create activities"
ON activities FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_id AND users.auth_id = auth.uid())
);

-- =====================================================
-- 마이그레이션 완료
--
-- 변경 요약:
-- - 9개 테이블의 FOR ALL 정책을 INSERT/UPDATE/DELETE로 분리
-- - INSERT 정책: EXISTS(users WHERE id=user_id AND auth_id=auth.uid()) 사용
-- - UPDATE/DELETE: 기존 get_current_user_id() 유지
-- - reading_logs: FK를 auth.users → public.users로 변경
-- - bookmarks/activities: SELECT 정책도 일관성 있게 수정
-- =====================================================
