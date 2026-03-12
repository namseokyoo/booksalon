-- tags.tag_type='forum' 잔재 데이터 정리 (BL-164)
-- forum 태그는 더 이상 사용되지 않음 (post 태그만 사용)
DELETE FROM tags WHERE tag_type = 'forum';
