-- 좋아요/통계 카운터 원자적 갱신 RPC

CREATE OR REPLACE FUNCTION increment_post_like_count(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_like_count(target_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = target_post_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_comment_like_count(target_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE comments
  SET like_count = COALESCE(like_count, 0) + 1
  WHERE id = target_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_comment_like_count(target_comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE comments
  SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1)
  WHERE id = target_comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_user_stat(target_auth_id uuid, stat_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
AS $$
BEGIN
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
