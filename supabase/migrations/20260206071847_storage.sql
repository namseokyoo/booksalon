-- =====================================================
-- 북살롱 v0.4.0 Supabase Storage 설정
-- Supabase 마이그레이션 - Week 1 인프라 설정
--
-- 실행 순서: schema.sql → rls-policies.sql → storage.sql
-- =====================================================

-- =====================================================
-- 1. Storage 버킷 생성
-- =====================================================

-- profile-images 버킷 (공개 접근)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,  -- 5MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- post-images 버킷 (공개 접근)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760,  -- 10MB 제한
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. Profile Images 버킷 정책
-- =====================================================

-- 누구나 프로필 이미지 조회 가능
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

-- 인증된 사용자는 자신의 폴더에만 업로드 가능
-- 파일 경로: profile-images/{auth_uid}/{filename}
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 본인 이미지만 수정 가능
CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 본인 이미지만 삭제 가능
CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- 3. Post Images 버킷 정책
-- =====================================================

-- 누구나 게시물 이미지 조회 가능
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- 인증된 사용자는 자신의 폴더에 업로드 가능
-- 파일 경로: post-images/{auth_uid}/{forum_isbn}/{post_id}/{filename}
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 본인 이미지만 수정 가능
CREATE POLICY "Users can update own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 본인 이미지만 삭제 가능
CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 관리자는 모든 게시물 이미지 삭제 가능
CREATE POLICY "Admins can delete any post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND is_admin()
);

-- =====================================================
-- Storage 설정 완료
--
-- 파일 경로 규칙:
-- - 프로필 이미지: profile-images/{auth_uid}/profile.{ext}
-- - 게시물 이미지: post-images/{auth_uid}/{forum_isbn}/{post_id}/{image_id}.{ext}
--
-- 공개 URL 형식:
-- {supabase_url}/storage/v1/object/public/{bucket}/{path}
-- =====================================================
