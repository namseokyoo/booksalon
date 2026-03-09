-- 게시물 조회수 컬럼 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- 조회수 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_view_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;
