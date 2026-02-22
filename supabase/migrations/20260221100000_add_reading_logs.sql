-- Reading Logs 테이블: 사용자 독서 활동 기록
-- Phase 3-1: 독서 로그 기능

CREATE TABLE IF NOT EXISTS reading_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forum_isbn text NOT NULL REFERENCES forums(isbn) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('reading', 'completed', 'want_to_read')),
  started_at timestamptz,
  finished_at timestamptz,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, forum_isbn)
);

-- RLS 정책
ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reading logs"
  ON reading_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading logs"
  ON reading_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading logs"
  ON reading_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading logs"
  ON reading_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_reading_logs_user_id ON reading_logs(user_id);
CREATE INDEX idx_reading_logs_status ON reading_logs(user_id, status);
