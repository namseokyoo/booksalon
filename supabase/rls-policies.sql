-- =====================================================
-- 북살롱 v0.4.0 Row Level Security (RLS) 정책
-- Supabase 마이그레이션 - Week 1 인프라 설정
--
-- 실행 순서: schema.sql → rls-policies.sql → storage.sql
-- =====================================================

-- =====================================================
-- 1. 관리자 헬퍼 함수
-- =====================================================

-- is_admin(): 현재 사용자가 활성화된 관리자인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a
    JOIN users u ON a.user_id = u.id
    WHERE u.auth_id = auth.uid()
      AND a.role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- is_super_admin(): 최고 관리자 권한 확인
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a
    JOIN users u ON a.user_id = u.id
    WHERE u.auth_id = auth.uid()
      AND a.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- get_current_user_id(): 현재 인증된 사용자의 users.id 가져오기
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 2. Users 테이블 RLS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 모든 프로필은 누구나 조회 가능
CREATE POLICY "Users can view all profiles"
ON users FOR SELECT
USING (true);

-- 본인 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- 본인 프로필만 생성 가능
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- 관리자는 모든 사용자 정보 수정 가능 (계정 비활성화 등)
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
USING (is_admin());

-- =====================================================
-- 3. User 관련 테이블 RLS
-- =====================================================

-- user_social_links
ALTER TABLE user_social_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all social links"
ON user_social_links FOR SELECT
USING (true);

CREATE POLICY "Users can manage own social links"
ON user_social_links FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- user_notification_settings
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
ON user_notification_settings FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage own notification settings"
ON user_notification_settings FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- user_favorite_genres
ALTER TABLE user_favorite_genres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all favorite genres"
ON user_favorite_genres FOR SELECT
USING (true);

CREATE POLICY "Users can manage own favorite genres"
ON user_favorite_genres FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- 4. Books & Forums RLS
-- =====================================================

-- books (모두 조회 가능, 인증된 사용자 생성 가능)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view books"
ON books FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert books"
ON books FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update books"
ON books FOR UPDATE
USING (is_admin());

-- forums
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forums"
ON forums FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create forums"
ON forums FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update forums"
ON forums FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete forums"
ON forums FOR DELETE
USING (is_admin());

-- forum_tags
ALTER TABLE forum_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view forum tags"
ON forum_tags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage forum tags"
ON forum_tags FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 5. Posts RLS
-- =====================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 누구나 게시물 조회 가능
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

-- 인증된 사용자만 게시물 작성 가능
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
WITH CHECK (author_id = get_current_user_id());

-- 작성자만 게시물 수정 가능
CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE
USING (author_id = get_current_user_id())
WITH CHECK (author_id = get_current_user_id());

-- 작성자만 게시물 삭제 가능
CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE
USING (author_id = get_current_user_id());

-- 관리자는 모든 게시물 수정/삭제 가능
CREATE POLICY "Admins can update any post"
ON posts FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete any post"
ON posts FOR DELETE
USING (is_admin());

-- =====================================================
-- 6. Post 관련 테이블 RLS
-- =====================================================

-- post_tags
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post tags"
ON post_tags FOR SELECT
USING (true);

CREATE POLICY "Post authors can manage post tags"
ON post_tags FOR ALL
USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id = get_current_user_id())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id = get_current_user_id())
);

-- post_images
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post images"
ON post_images FOR SELECT
USING (true);

CREATE POLICY "Post authors can manage post images"
ON post_images FOR ALL
USING (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id = get_current_user_id())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM posts WHERE posts.id = post_id AND posts.author_id = get_current_user_id())
);

-- post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post likes"
ON post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can manage own post likes"
ON post_likes FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- 7. Comments RLS
-- =====================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 누구나 댓글 조회 가능
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (true);

-- 인증된 사용자만 댓글 작성 가능
CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (author_id = get_current_user_id());

-- 작성자만 댓글 수정 가능
CREATE POLICY "Authors can update own comments"
ON comments FOR UPDATE
USING (author_id = get_current_user_id())
WITH CHECK (author_id = get_current_user_id());

-- 작성자만 댓글 삭제 가능
CREATE POLICY "Authors can delete own comments"
ON comments FOR DELETE
USING (author_id = get_current_user_id());

-- 관리자는 모든 댓글 수정/삭제 가능
CREATE POLICY "Admins can update any comment"
ON comments FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete any comment"
ON comments FOR DELETE
USING (is_admin());

-- comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes"
ON comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can manage own comment likes"
ON comment_likes FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- =====================================================
-- 8. Ratings & Tags RLS
-- =====================================================

-- ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON ratings FOR SELECT
USING (true);

CREATE POLICY "Users can manage own ratings"
ON ratings FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tags"
ON tags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage tags"
ON tags FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 9. Social 테이블 RLS (Bookmarks, Follows)
-- =====================================================

-- bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage own bookmarks"
ON bookmarks FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
USING (true);

CREATE POLICY "Users can manage own follows"
ON follows FOR ALL
USING (follower_id = get_current_user_id())
WITH CHECK (follower_id = get_current_user_id());

-- =====================================================
-- 10. Activities & Notifications RLS
-- =====================================================

-- activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
ON activities FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "System can create activities"
ON activities FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can create system notifications"
ON notifications FOR INSERT
WITH CHECK (is_admin() AND notification_type = 'system');

-- =====================================================
-- 11. Chat 테이블 RLS
-- =====================================================

-- chat_rooms
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat rooms"
ON chat_rooms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_room_participants
    WHERE chat_room_participants.chat_room_id = chat_rooms.id
    AND chat_room_participants.user_id = get_current_user_id()
  )
);

CREATE POLICY "Authenticated users can create chat rooms"
ON chat_rooms FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- chat_room_participants
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat room participations"
ON chat_room_participants FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "Users can manage own chat room participations"
ON chat_room_participants FOR ALL
USING (user_id = get_current_user_id())
WITH CHECK (user_id = get_current_user_id());

-- messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  sender_id = get_current_user_id()
  OR receiver_id = get_current_user_id()
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (sender_id = get_current_user_id());

CREATE POLICY "Users can update own sent messages"
ON messages FOR UPDATE
USING (
  sender_id = get_current_user_id()
  OR receiver_id = get_current_user_id()
);

-- =====================================================
-- 12. Admin 테이블 RLS
-- =====================================================

-- admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own admin status"
ON admins FOR SELECT
USING (user_id = get_current_user_id());

CREATE POLICY "Super admins can manage admins"
ON admins FOR ALL
USING (is_super_admin())
WITH CHECK (is_super_admin());

-- reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON reports FOR INSERT
WITH CHECK (reporter_id = get_current_user_id());

CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
USING (reporter_id = get_current_user_id());

CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE
USING (is_admin());

-- =====================================================
-- RLS 정책 설정 완료
-- 다음 단계: storage.sql 실행
-- =====================================================
