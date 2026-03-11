-- posts.search_text 자동 채움 Trigger
-- P1-4: 새 포스트 INSERT/UPDATE 시 search_text 자동 갱신

-- Trigger 함수 생성
CREATE OR REPLACE FUNCTION fill_post_search_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_text := coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 등록 (기존 트리거 있으면 교체)
DROP TRIGGER IF EXISTS trg_fill_post_search_text ON posts;
CREATE TRIGGER trg_fill_post_search_text
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION fill_post_search_text();

-- 기존 데이터 backfill
UPDATE posts
  SET search_text = coalesce(title, '') || ' ' || coalesce(content, '')
  WHERE search_text IS NULL;
