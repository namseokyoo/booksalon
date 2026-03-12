-- 좋아요/통계 카운터 원자적 갱신 RPC (보안 강화)

CREATE OR REPLACE FUNCTION increment_post_like_count(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE posts
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_like_count(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE posts
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_comment_like_count(target_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE comments
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = target_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_comment_like_count(target_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE comments
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = target_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_user_stat(target_auth_id uuid, stat_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF stat_name NOT IN ('post_count', 'comment_count', 'forum_count') THEN
    RAISE EXCEPTION 'Invalid stat_name: %', stat_name;
  END IF;
  UPDATE users
  SET
    post_count = CASE
      WHEN stat_name = 'post_count' THEN COALESCE(post_count, 0) + 1
      ELSE post_count
    END,
    comment_count = CASE
      WHEN stat_name = 'comment_count' THEN COALESCE(comment_count, 0) + 1
      ELSE comment_count
    END,
    forum_count = CASE
      WHEN stat_name = 'forum_count' THEN COALESCE(forum_count, 0) + 1
      ELSE forum_count
    END
  WHERE auth_id = target_auth_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_user_stat(target_auth_id uuid, stat_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF stat_name NOT IN ('post_count', 'comment_count', 'forum_count') THEN
    RAISE EXCEPTION 'Invalid stat_name: %', stat_name;
  END IF;
  UPDATE users
  SET
    post_count = CASE
      WHEN stat_name = 'post_count' THEN GREATEST(0, COALESCE(post_count, 0) - 1)
      ELSE post_count
    END,
    comment_count = CASE
      WHEN stat_name = 'comment_count' THEN GREATEST(0, COALESCE(comment_count, 0) - 1)
      ELSE comment_count
    END,
    forum_count = CASE
      WHEN stat_name = 'forum_count' THEN GREATEST(0, COALESCE(forum_count, 0) - 1)
      ELSE forum_count
    END
  WHERE auth_id = target_auth_id;
END;
$$;

-- 권한 설정: authenticated 사용자만 실행 가능
REVOKE ALL ON FUNCTION increment_post_like_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_post_like_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION decrement_post_like_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_post_like_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION increment_comment_like_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_comment_like_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION decrement_comment_like_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_comment_like_count(uuid) TO authenticated;

REVOKE ALL ON FUNCTION increment_user_stat(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_user_stat(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION decrement_user_stat(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION decrement_user_stat(uuid, text) TO authenticated;
