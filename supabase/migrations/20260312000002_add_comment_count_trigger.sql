-- Keep posts.comment_count in sync with comments inserts and deletes
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.post_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1)
    WHERE id = OLD.post_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_comment_count ON comments;

CREATE TRIGGER trg_comments_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

UPDATE posts
SET comment_count = (
  SELECT COUNT(*)
  FROM comments
  WHERE post_id = posts.id
);
