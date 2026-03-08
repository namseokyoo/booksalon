-- 북살롱 DB 정리: forum_tags 테이블 + forums.category 컬럼 삭제
-- 근거: Sprint 1~2에서 코드 레벨 완전 제거 완료, DB 스키마 동기화
-- 날짜: 2026-03-09

-- Phase 1: forum_tags 테이블 완전 삭제
DROP POLICY IF EXISTS "forum_tags_select_policy" ON forum_tags;
DROP POLICY IF EXISTS "forum_tags_all_policy" ON forum_tags;
DROP INDEX IF EXISTS idx_forum_tags_forum_isbn;
DROP INDEX IF EXISTS idx_forum_tags_tag_name;
DROP TABLE IF EXISTS forum_tags;

-- Phase 2: forums.category 컬럼 삭제
DROP INDEX IF EXISTS idx_forums_category;
ALTER TABLE forums DROP COLUMN IF EXISTS category;
