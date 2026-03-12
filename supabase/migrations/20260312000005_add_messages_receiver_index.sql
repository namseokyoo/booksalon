-- messages.receiver_id 인덱스 추가 (BL-164)
-- sender_id에는 idx_messages_sender가 있지만 receiver_id에는 없음
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
