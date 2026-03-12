-- 평균 평점 DB 계산 RPC (BL-164)
CREATE OR REPLACE FUNCTION get_book_average_rating(target_book_isbn text)
RETURNS TABLE(avg_rating numeric, total_count bigint)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS avg_rating,
    COUNT(*) AS total_count
  FROM ratings
  WHERE book_isbn = target_book_isbn;
END;
$$;
