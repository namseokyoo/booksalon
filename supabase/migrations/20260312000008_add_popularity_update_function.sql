-- forums.popularity 자동 갱신 함수 (BL-164)
-- popularity = post_count * 3 + total_ratings * 2 + CASE WHEN 최근 7일 활동 THEN 10 ELSE 0 END
CREATE OR REPLACE FUNCTION update_forum_popularity(target_isbn text)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  recent_bonus int;
BEGIN
  SELECT CASE
    WHEN last_activity_at > NOW() - INTERVAL '7 days' THEN 10
    ELSE 0
  END INTO recent_bonus
  FROM forums WHERE isbn = target_isbn;

  UPDATE forums
  SET popularity = (COALESCE(post_count, 0) * 3) + (COALESCE(total_ratings, 0) * 2) + COALESCE(recent_bonus, 0)
  WHERE isbn = target_isbn;
END;
$$;

-- 기존 데이터 일괄 갱신
DO $$
DECLARE
  f RECORD;
BEGIN
  FOR f IN SELECT isbn FROM forums LOOP
    PERFORM update_forum_popularity(f.isbn);
  END LOOP;
END;
$$;
