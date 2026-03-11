-- Keep forums.post_count in sync with posts inserts and deletes
CREATE OR REPLACE FUNCTION update_forum_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forums
    SET post_count = COALESCE(post_count, 0) + 1
    WHERE isbn = NEW.forum_isbn;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forums
    SET post_count = GREATEST(0, COALESCE(post_count, 0) - 1)
    WHERE isbn = OLD.forum_isbn;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_post_count ON posts;

CREATE TRIGGER trg_posts_post_count
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_post_count();

UPDATE forums
SET post_count = (
  SELECT COUNT(*)
  FROM posts
  WHERE forum_isbn = forums.isbn
);
