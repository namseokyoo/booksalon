-- Keep posts.comment_count in sync with TOP-LEVEL comments only
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_id IS NULL THEN
      UPDATE posts
      SET comment_count = COALESCE(comment_count, 0) + 1
      WHERE id = NEW.post_id;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_id IS NULL THEN
      UPDATE posts
      SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1)
      WHERE id = OLD.post_id;
    END IF;

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
    AND parent_id IS NULL
);
