-- Add parent_id column to comments table for nested comments (depth 1 only)
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES comments(id) ON DELETE CASCADE;

-- Index for fast reply lookup
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- Trigger function: enforce depth limit (max 1 level)
CREATE OR REPLACE FUNCTION enforce_comment_depth()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM comments WHERE id = NEW.parent_id AND parent_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Comment depth limit exceeded: cannot reply to a reply';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_comment_depth
  BEFORE INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION enforce_comment_depth();
