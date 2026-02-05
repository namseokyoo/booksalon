# 북살롱 v0.4.0 Supabase 마이그레이션 상세 계획서

> **작성일**: 2026-02-05
> **작성자**: Fullstack Dev
> **상태**: 계획 수립 완료

---

## 1. 마이그레이션 개요

### 1.1 목적
- **Firebase → Supabase 전환**: 비용 효율성 및 PostgreSQL 기반의 확장성 확보
- **오픈소스 기반 인프라**: 벤더 종속성 감소, 셀프 호스팅 옵션 확보
- **RLS 기반 보안**: Row Level Security로 데이터 접근 제어 강화
- **실시간 기능 유지**: Supabase Realtime으로 기존 실시간 기능 지원

### 1.2 범위
| 영역 | Firebase | Supabase |
|------|----------|----------|
| **Auth** | Firebase Auth (카카오, 구글) | Supabase Auth (OAuth) |
| **Database** | Firestore (NoSQL) | PostgreSQL (RDB) |
| **Storage** | Firebase Storage | Supabase Storage |
| **Realtime** | Firestore onSnapshot | Supabase Realtime |

### 1.3 기간
- **총 기간**: 4주 (20 영업일) - 버퍼 포함
- **시작일**: TBD (회장님 승인 후)
- **완료 예정일**: 시작일 + 4주

> **변경 이력**: Board Advisor 검토 후 예비일 버퍼 추가 (3주 → 4주)

### 1.4 담당
- **개발**: Fullstack Dev
- **QA**: QA Engineer
- **배포**: DevOps Engineer
- **승인**: CEO Agent → 회장님

---

## 2. 현재 상태 분석 (As-Is)

### 2.1 Firebase 서비스 목록

| 서비스 파일 | 역할 | 주요 의존성 |
|-------------|------|-------------|
| `firebase.ts` | Firebase 초기화 | auth, db, storage |
| `userProfile.ts` | 사용자 프로필 CRUD | db, ProfileImageService |
| `bookmarkService.ts` | 포럼 북마크 관리 | db |
| `profileImageService.ts` | 프로필 이미지 업로드 | storage |
| `postImageService.ts` | 게시물 이미지 업로드 | storage |
| `ratingService.ts` | 책 평점 관리 | db |
| `tagService.ts` | 태그 CRUD 및 통계 | db |
| `searchService.ts` | 통합 검색 | db |
| `socialService.ts` | 팔로우, 좋아요 | db |
| `filterService.ts` | 포럼 필터링 (클라이언트) | - |
| `notificationService.ts` | 알림 관리 | db, onSnapshot |
| `messagingService.ts` | 채팅 메시지 | db, onSnapshot |
| `adminService.ts` | 관리자 기능 | db |
| `searchHistoryService.ts` | 검색 히스토리 | localStorage |
| `kakaoApi.ts` | 카카오 책 검색 | 외부 API |

### 2.2 Firestore 컬렉션 구조

```
Firestore Database
│
├── users/{uid}                    # 사용자 프로필
│   ├── uid: string
│   ├── email: string
│   ├── displayName: string
│   ├── nickname: string
│   ├── bio: string
│   ├── profileImageUrl: string
│   ├── createdAt: timestamp
│   ├── lastLoginAt: timestamp
│   ├── postCount: number
│   ├── commentCount: number
│   ├── forumCount: number
│   ├── bookmarkedForums: string[]
│   ├── following: string[]
│   ├── followers: string[]
│   ├── favoriteGenres: string[]
│   ├── readingGoal: number
│   ├── location: string
│   ├── website: string
│   ├── socialLinks: object
│   └── notificationSettings: object
│
├── forums/{isbn}                  # 책 포럼 (살롱)
│   ├── isbn: string
│   ├── book: object               # Book 타입
│   │   ├── isbn: string
│   │   ├── title: string
│   │   ├── authors: string[]
│   │   ├── publisher: string
│   │   ├── thumbnail: string
│   │   └── contents: string
│   ├── postCount: number
│   ├── lastActivityAt: timestamp
│   ├── category: string
│   ├── tags: string[]
│   ├── popularity: number
│   ├── averageRating: number
│   └── totalRatings: number
│   │
│   └── posts/{postId}             # 서브컬렉션: 게시물
│       ├── id: string
│       ├── title: string
│       ├── content: string
│       ├── author: object         # { uid, email }
│       ├── createdAt: timestamp
│       ├── commentCount: number
│       ├── likes: string[]
│       ├── likeCount: number
│       ├── tags: string[]
│       ├── searchText: string
│       └── images: PostImage[]
│       │
│       └── comments/{commentId}   # 서브-서브컬렉션: 댓글
│           ├── id: string
│           ├── content: string
│           ├── author: object
│           ├── createdAt: timestamp
│           ├── likes: string[]
│           └── likeCount: number
│
├── ratings/{bookIsbn_userId}      # 책 평점
│   ├── bookIsbn: string
│   ├── userId: string
│   ├── rating: number (1-5)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── tags/{tagName_type}            # 태그 통계
│   ├── name: string
│   ├── count: number
│   ├── type: 'forum' | 'post'
│   └── lastUsedAt: timestamp
│
├── activities/{activityId}        # 활동 로그
│   ├── type: string
│   ├── userId: string
│   ├── userName: string
│   ├── userEmail: string
│   ├── targetId: string
│   ├── targetTitle: string
│   ├── forumIsbn: string
│   ├── forumTitle: string
│   ├── createdAt: timestamp
│   └── metadata: object
│
├── notifications/{notificationId} # 알림
│   ├── userId: string
│   ├── type: string
│   ├── title: string
│   ├── content: string
│   ├── isRead: boolean
│   ├── createdAt: timestamp
│   ├── readAt: timestamp
│   └── metadata: object
│
├── chatRooms/{chatRoomId}         # 채팅방
│   ├── participants: string[]
│   ├── lastMessage: object
│   ├── lastMessageAt: timestamp
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── unreadCount: object
│   │
│   └── messages/{messageId}       # 서브컬렉션: 메시지
│       ├── senderId: string
│       ├── receiverId: string
│       ├── content: string
│       ├── messageType: string
│       ├── createdAt: timestamp
│       ├── readAt: timestamp
│       └── metadata: object
│
├── admins/{userId}                # 관리자
│   ├── role: string
│   └── updatedAt: timestamp
│
└── reports/{reportId}             # 신고
    ├── reporterId: string
    ├── reportedUserId: string
    ├── reportedPostId: string
    ├── reportedCommentId: string
    ├── reportedForumId: string
    ├── type: string
    ├── reason: string
    ├── description: string
    ├── status: string
    ├── createdAt: timestamp
    ├── resolvedAt: timestamp
    ├── resolvedBy: string
    └── resolution: string
```

### 2.3 Firebase Auth 사용 현황

| 인증 방식 | 현재 상태 |
|-----------|----------|
| 카카오 로그인 | ✅ 사용 중 |
| 구글 로그인 | ✅ 사용 중 |
| 이메일/비밀번호 | ❌ 미사용 |

### 2.4 Firebase Storage 사용 현황

```
Firebase Storage
│
├── profile-images/
│   └── profile_{uid}_{timestamp}.{ext}
│
└── posts/{forumId}/{postId}/images/
    └── {imageId}.jpg
```

---

## 3. 목표 상태 설계 (To-Be)

### 3.1 Supabase ERD (PostgreSQL 스키마)

#### 3.1.1 users 테이블

```sql
-- 사용자 프로필 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    nickname VARCHAR(50),
    bio TEXT,
    profile_image_url TEXT,
    location VARCHAR(100),
    website VARCHAR(255),
    reading_goal INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    forum_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMPTZ,
    deactivated_by VARCHAR(50),

    CONSTRAINT users_email_unique UNIQUE (email)
);

-- 인덱스
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### 3.1.2 user_social_links 테이블

```sql
-- 사용자 소셜 링크
CREATE TABLE user_social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'twitter', 'instagram', 'blog'
    url VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT user_social_links_unique UNIQUE (user_id, platform)
);

CREATE INDEX idx_user_social_links_user_id ON user_social_links(user_id);
```

#### 3.1.3 user_notification_settings 테이블

```sql
-- 사용자 알림 설정
CREATE TABLE user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    new_posts BOOLEAN DEFAULT true,
    new_comments BOOLEAN DEFAULT true,
    forum_updates BOOLEAN DEFAULT true,
    follows BOOLEAN DEFAULT true,
    likes BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT user_notification_settings_unique UNIQUE (user_id)
);

CREATE INDEX idx_user_notification_settings_user_id ON user_notification_settings(user_id);
```

#### 3.1.4 user_favorite_genres 테이블

```sql
-- 사용자 선호 장르
CREATE TABLE user_favorite_genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT user_favorite_genres_unique UNIQUE (user_id, genre)
);

CREATE INDEX idx_user_favorite_genres_user_id ON user_favorite_genres(user_id);
```

#### 3.1.5 books 테이블

```sql
-- 책 정보 테이블
CREATE TABLE books (
    isbn VARCHAR(20) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    authors TEXT[] NOT NULL DEFAULT '{}',
    publisher VARCHAR(200),
    thumbnail TEXT,
    contents TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('korean', title));
CREATE INDEX idx_books_authors ON books USING gin(authors);
```

#### 3.1.6 forums 테이블

```sql
-- 포럼 (살롱) 테이블
CREATE TABLE forums (
    isbn VARCHAR(20) PRIMARY KEY REFERENCES books(isbn) ON DELETE CASCADE,
    category VARCHAR(50),
    popularity INTEGER DEFAULT 0,
    post_count INTEGER DEFAULT 0,
    average_rating DECIMAL(2, 1) DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_forums_category ON forums(category);
CREATE INDEX idx_forums_popularity ON forums(popularity DESC);
CREATE INDEX idx_forums_last_activity ON forums(last_activity_at DESC);
CREATE INDEX idx_forums_average_rating ON forums(average_rating DESC);
```

#### 3.1.7 forum_tags 테이블

```sql
-- 포럼 태그 연결 테이블 (다대다)
CREATE TABLE forum_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_isbn VARCHAR(20) NOT NULL REFERENCES forums(isbn) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT forum_tags_unique UNIQUE (forum_isbn, tag_name)
);

CREATE INDEX idx_forum_tags_forum_isbn ON forum_tags(forum_isbn);
CREATE INDEX idx_forum_tags_tag_name ON forum_tags(tag_name);
```

#### 3.1.8 posts 테이블

```sql
-- 게시물 테이블
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_isbn VARCHAR(20) NOT NULL REFERENCES forums(isbn) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    comment_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    search_text TEXT, -- 검색 최적화용
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_posts_forum_isbn ON posts(forum_isbn);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('korean', title || ' ' || content));
```

#### 3.1.9 post_tags 테이블

```sql
-- 게시물 태그 연결 테이블
CREATE TABLE post_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT post_tags_unique UNIQUE (post_id, tag_name)
);

CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_name ON post_tags(tag_name);
```

#### 3.1.10 post_images 테이블

```sql
-- 게시물 이미지 테이블
CREATE TABLE post_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_images_post_id ON post_images(post_id);
```

#### 3.1.11 post_likes 테이블

```sql
-- 게시물 좋아요 테이블
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
```

#### 3.1.12 comments 테이블

```sql
-- 댓글 테이블
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

#### 3.1.13 comment_likes 테이블

```sql
-- 댓글 좋아요 테이블
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
```

#### 3.1.14 ratings 테이블

```sql
-- 책 평점 테이블
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_isbn VARCHAR(20) NOT NULL REFERENCES books(isbn) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT ratings_unique UNIQUE (book_isbn, user_id)
);

CREATE INDEX idx_ratings_book_isbn ON ratings(book_isbn);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
```

#### 3.1.15 tags 테이블 (태그 통계)

```sql
-- 태그 통계 테이블
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    tag_type VARCHAR(10) NOT NULL CHECK (tag_type IN ('forum', 'post')),
    count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT tags_unique UNIQUE (name, tag_type)
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_type ON tags(tag_type);
CREATE INDEX idx_tags_count ON tags(count DESC);
```

#### 3.1.16 bookmarks 테이블

```sql
-- 북마크 테이블
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    forum_isbn VARCHAR(20) NOT NULL REFERENCES forums(isbn) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT bookmarks_unique UNIQUE (user_id, forum_isbn)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_forum_isbn ON bookmarks(forum_isbn);
```

#### 3.1.17 follows 테이블

```sql
-- 팔로우 테이블
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
    CONSTRAINT follows_no_self CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
```

#### 3.1.18 activities 테이블

```sql
-- 활동 로그 테이블
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('post', 'comment', 'like', 'follow', 'bookmark')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id VARCHAR(255) NOT NULL, -- 대상 ID (게시물, 댓글, 사용자 등)
    target_title VARCHAR(200),
    forum_isbn VARCHAR(20) REFERENCES forums(isbn) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
```

#### 3.1.19 notifications 테이블

```sql
-- 알림 테이블
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('message', 'like', 'comment', 'follow', 'forum_invite', 'system')),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

#### 3.1.20 chat_rooms 테이블

```sql
-- 채팅방 테이블
CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ
);

-- 채팅방 참여자 테이블
CREATE TABLE chat_room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chat_room_participants_unique UNIQUE (chat_room_id, user_id)
);

CREATE INDEX idx_chat_room_participants_room ON chat_room_participants(chat_room_id);
CREATE INDEX idx_chat_room_participants_user ON chat_room_participants(user_id);
```

#### 3.1.21 messages 테이블

```sql
-- 메시지 테이블
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(10) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    metadata JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_room ON messages(chat_room_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

#### 3.1.22 admins 테이블

```sql
-- 관리자 테이블
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'moderator')),
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT admins_user_unique UNIQUE (user_id)
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_role ON admins(role);
```

#### 3.1.23 reports 테이블

```sql
-- 신고 테이블
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    reported_comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
    reported_forum_isbn VARCHAR(20) REFERENCES forums(isbn) ON DELETE SET NULL,
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN ('spam', 'harassment', 'inappropriate_content', 'fake_news', 'other')),
    reason VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

### 3.2 Supabase Auth 설계

#### 3.2.1 소셜 로그인 설정

```typescript
// Supabase Auth Provider 설정
const providers = ['kakao', 'google'];

// 카카오 로그인
await supabase.auth.signInWithOAuth({
  provider: 'kakao',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});

// 구글 로그인
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

#### 3.2.2 RLS (Row Level Security) 정책

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_participants ENABLE ROW LEVEL SECURITY;

-- Users 테이블 정책
CREATE POLICY "Users can view all profiles"
ON users FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
WITH CHECK (auth.uid() = auth_id);

-- Posts 테이블 정책
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = author_id)
);

CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = author_id)
);

CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = author_id)
);

-- Comments 테이블 정책
CREATE POLICY "Anyone can view comments"
ON comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = author_id)
);

CREATE POLICY "Authors can update own comments"
ON comments FOR UPDATE
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = author_id)
);

CREATE POLICY "Authors can delete own comments"
ON comments FOR DELETE
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = author_id)
);

-- Notifications 테이블 정책
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

-- Messages 테이블 정책
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
USING (
  auth.uid() IN (
    SELECT auth_id FROM users
    WHERE id = sender_id OR id = receiver_id
  )
);

CREATE POLICY "Users can send messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = sender_id)
);

-- Bookmarks 테이블 정책
CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

CREATE POLICY "Users can manage own bookmarks"
ON bookmarks FOR ALL
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

-- Follows 테이블 정책
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
USING (true);

CREATE POLICY "Users can manage own follows"
ON follows FOR ALL
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = follower_id)
);
```

#### 3.2.3 관리자 RLS 정책 (Board Advisor 검토 추가)

> **추가 배경**: 관리자는 일반 사용자와 다른 권한이 필요하며, 콘텐츠 관리/신고 처리 등을 위해 확장된 접근 권한 필요

```sql
-- =====================================================
-- 관리자 헬퍼 함수
-- =====================================================

-- is_admin(): 현재 사용자가 활성화된 관리자인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a
    JOIN users u ON a.user_id = u.id
    WHERE u.auth_id = auth.uid()
      AND a.role IN ('admin', 'moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- is_super_admin(): 최고 관리자 권한 확인
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins a
    JOIN users u ON a.user_id = u.id
    WHERE u.auth_id = auth.uid()
      AND a.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- 관리자 권한 RLS 정책 (각 테이블별)
-- =====================================================

-- Posts: 관리자는 모든 게시물 삭제/수정 가능
CREATE POLICY "Admins can delete any post"
ON posts FOR DELETE
USING (is_admin());

CREATE POLICY "Admins can update any post"
ON posts FOR UPDATE
USING (is_admin());

-- Comments: 관리자는 모든 댓글 삭제/수정 가능
CREATE POLICY "Admins can delete any comment"
ON comments FOR DELETE
USING (is_admin());

CREATE POLICY "Admins can update any comment"
ON comments FOR UPDATE
USING (is_admin());

-- Users: 관리자는 사용자 정보 수정 가능 (계정 비활성화 등)
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
USING (is_admin());

-- Reports: 관리자만 신고 조회/처리 가능
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE
USING (is_admin());

-- Admins 테이블: 최고 관리자만 관리자 추가/수정 가능
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage admins"
ON admins FOR ALL
USING (is_super_admin());

CREATE POLICY "Users can view own admin status"
ON admins FOR SELECT
USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

-- Forums: 관리자는 포럼 삭제 가능
CREATE POLICY "Admins can delete forums"
ON forums FOR DELETE
USING (is_admin());

-- Notifications: 관리자는 시스템 알림 생성 가능
CREATE POLICY "Admins can create system notifications"
ON notifications FOR INSERT
WITH CHECK (
  is_admin() AND notification_type = 'system'
);
```

**관리자 권한 매트릭스:**

| 기능 | 일반 사용자 | Moderator | Admin |
|------|-------------|-----------|-------|
| 게시물 삭제 (본인) | ✅ | ✅ | ✅ |
| 게시물 삭제 (타인) | ❌ | ✅ | ✅ |
| 댓글 삭제 (타인) | ❌ | ✅ | ✅ |
| 사용자 비활성화 | ❌ | ❌ | ✅ |
| 신고 처리 | ❌ | ✅ | ✅ |
| 관리자 추가/삭제 | ❌ | ❌ | ✅ |
| 포럼 삭제 | ❌ | ❌ | ✅ |
| 시스템 알림 발송 | ❌ | ❌ | ✅ |

### 3.3 Supabase Storage 설계

#### 3.3.1 버킷 구조

```sql
-- 버킷 생성
INSERT INTO storage.buckets (id, name, public) VALUES
  ('profile-images', 'profile-images', true),
  ('post-images', 'post-images', true);
```

#### 3.3.2 Storage 정책

```sql
-- profile-images 버킷 정책
CREATE POLICY "Anyone can view profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-images');

CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- post-images 버킷 정책
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  auth.role() = 'authenticated'
);
```

---

## 4. 서비스별 마이그레이션 가이드

### 4.1 firebase.ts → supabase.ts

#### 현재 코드 (Firebase)
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = { ... };
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

#### 변환 후 (Supabase)
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Auth 헬퍼
export const auth = supabase.auth;

// Database 헬퍼
export const db = supabase;

// Storage 헬퍼
export const storage = supabase.storage;
```

#### 주의사항
- Supabase CLI로 `database.types.ts` 자동 생성 필요
- 환경 변수 이름 변경 (VITE_FIREBASE_* → VITE_SUPABASE_*)

---

### 4.2 userProfile.ts → userService.ts

#### 현재 코드 (Firebase)
```typescript
static async createOrUpdateProfile(uid: string, email: string, ...): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        await updateDoc(userRef, { ... });
    } else {
        await setDoc(userRef, { ... });
    }
}
```

#### 변환 후 (Supabase)
```typescript
static async createOrUpdateProfile(authId: string, email: string, ...): Promise<void> {
    // 기존 사용자 확인
    const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

    if (existingUser) {
        // 업데이트
        const { error } = await supabase
            .from('users')
            .update({
                display_name: displayName,
                nickname: nickname,
                bio: bio,
                last_login_at: new Date().toISOString()
            })
            .eq('auth_id', authId);

        if (error) throw error;
    } else {
        // 새 사용자 생성
        const { error } = await supabase
            .from('users')
            .insert({
                auth_id: authId,
                email: email,
                display_name: displayName || email.split('@')[0],
                nickname: nickname || email.split('@')[0],
                bio: bio || '',
                post_count: 0,
                comment_count: 0,
                forum_count: 0
            });

        if (error) throw error;

        // 기본 알림 설정 생성
        await supabase
            .from('user_notification_settings')
            .insert({ user_id: newUserId });
    }
}

static async getUserProfile(authId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select(`
            *,
            user_social_links(*),
            user_notification_settings(*),
            user_favorite_genres(*)
        `)
        .eq('auth_id', authId)
        .single();

    if (error || !data) return null;
    return transformToUserProfile(data);
}

static async getUserPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            post_tags(tag_name),
            post_images(*),
            forums!inner(isbn, books(*))
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
```

#### 주요 변경사항
- `doc(db, 'users', uid)` → `.from('users').eq('auth_id', authId)`
- `getDoc` → `.select().single()`
- `setDoc` → `.insert()`
- `updateDoc` → `.update()`
- 서브컬렉션 → JOIN 쿼리 (`.select('*, related_table(*)')`)
- 배열 필드 → 별도 테이블 + JOIN

---

### 4.3 bookmarkService.ts

#### 현재 코드 (Firebase)
```typescript
static async toggleBookmark(uid: string, isbn: string): Promise<boolean> {
    const userRef = doc(db, 'users', uid);
    const userData = userDoc.data();
    const bookmarkedForums = userData?.bookmarkedForums || [];
    const isBookmarked = bookmarkedForums.includes(isbn);

    if (isBookmarked) {
        await updateDoc(userRef, { bookmarkedForums: arrayRemove(isbn) });
    } else {
        await updateDoc(userRef, { bookmarkedForums: arrayUnion(isbn) });
    }
}
```

#### 변환 후 (Supabase)
```typescript
static async toggleBookmark(userId: string, forumIsbn: string): Promise<boolean> {
    // 기존 북마크 확인
    const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId)
        .eq('forum_isbn', forumIsbn)
        .single();

    if (existing) {
        // 북마크 제거
        await supabase
            .from('bookmarks')
            .delete()
            .eq('id', existing.id);
        return false;
    } else {
        // 북마크 추가
        await supabase
            .from('bookmarks')
            .insert({ user_id: userId, forum_isbn: forumIsbn });
        return true;
    }
}

static async getBookmarkedForums(userId: string): Promise<Forum[]> {
    const { data, error } = await supabase
        .from('bookmarks')
        .select(`
            forum_isbn,
            forums(*, books(*))
        `)
        .eq('user_id', userId);

    if (error) throw error;
    return data?.map(b => b.forums) || [];
}
```

#### 주요 변경사항
- 배열 필드 → 별도 `bookmarks` 테이블
- `arrayUnion/arrayRemove` → `insert/delete`

---

### 4.4 ratingService.ts

#### 현재 코드 (Firebase)
```typescript
static async setUserRating(bookIsbn: string, userId: string, rating: number): Promise<void> {
    const ratingDocId = `${bookIsbn}_${userId}`;
    const ratingRef = doc(db, 'ratings', ratingDocId);

    if (existingRating.exists()) {
        await updateDoc(ratingRef, { rating, updatedAt: serverTimestamp() });
    } else {
        await setDoc(ratingRef, { bookIsbn, userId, rating, ... });
    }

    await this.updateForumRating(bookIsbn);
}
```

#### 변환 후 (Supabase)
```typescript
static async setUserRating(bookIsbn: string, userId: string, rating: number): Promise<void> {
    // Upsert 사용 (INSERT ... ON CONFLICT UPDATE)
    const { error } = await supabase
        .from('ratings')
        .upsert({
            book_isbn: bookIsbn,
            user_id: userId,
            rating: rating,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'book_isbn,user_id'
        });

    if (error) throw error;

    // 포럼 평균 평점 업데이트 (PostgreSQL 함수 호출)
    await supabase.rpc('update_forum_rating', { p_book_isbn: bookIsbn });
}

// PostgreSQL 함수
/*
CREATE OR REPLACE FUNCTION update_forum_rating(p_book_isbn VARCHAR(20))
RETURNS void AS $$
DECLARE
    v_avg DECIMAL(2,1);
    v_total INTEGER;
BEGIN
    SELECT AVG(rating)::DECIMAL(2,1), COUNT(*)
    INTO v_avg, v_total
    FROM ratings
    WHERE book_isbn = p_book_isbn;

    UPDATE forums
    SET average_rating = COALESCE(v_avg, 0),
        total_ratings = COALESCE(v_total, 0)
    WHERE isbn = p_book_isbn;
END;
$$ LANGUAGE plpgsql;
*/

static async getAverageRating(bookIsbn: string): Promise<{ average: number; total: number }> {
    const { data, error } = await supabase
        .from('ratings')
        .select('rating')
        .eq('book_isbn', bookIsbn);

    if (error || !data || data.length === 0) {
        return { average: 0, total: 0 };
    }

    const sum = data.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / data.length) * 10) / 10;

    return { average, total: data.length };
}
```

#### 주요 변경사항
- 복합 키 Document ID → `UNIQUE CONSTRAINT` + `upsert`
- 집계 로직 → PostgreSQL 함수 또는 실시간 계산

---

### 4.5 tagService.ts

#### 현재 코드 (Firebase)
```typescript
static async incrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void> {
    const tagRef = doc(db, 'tags', `${normalizedTag}_${type}`);

    if (tagSnap.exists()) {
        await updateDoc(tagRef, { count: increment(1), lastUsedAt: serverTimestamp() });
    } else {
        await setDoc(tagRef, { name: tagName, count: 1, type, lastUsedAt: serverTimestamp() });
    }
}
```

#### 변환 후 (Supabase)
```typescript
static async incrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void> {
    const normalizedTag = this.normalizeTag(tagName);

    // Upsert with increment
    const { error } = await supabase.rpc('increment_tag_count', {
        p_tag_name: tagName.trim(),
        p_tag_type: type
    });

    if (error) throw error;
}

// PostgreSQL 함수
/*
CREATE OR REPLACE FUNCTION increment_tag_count(
    p_tag_name VARCHAR(50),
    p_tag_type VARCHAR(10)
)
RETURNS void AS $$
BEGIN
    INSERT INTO tags (name, tag_type, count, last_used_at)
    VALUES (p_tag_name, p_tag_type, 1, NOW())
    ON CONFLICT (name, tag_type)
    DO UPDATE SET
        count = tags.count + 1,
        last_used_at = NOW();
END;
$$ LANGUAGE plpgsql;
*/

static async getPopularTags(type: 'forum' | 'post', maxCount: number = 10): Promise<string[]> {
    const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('tag_type', type)
        .order('count', { ascending: false })
        .limit(maxCount);

    if (error) return [];
    return data?.map(t => t.name) || [];
}

static async getForumsByTag(tagName: string): Promise<Forum[]> {
    const { data, error } = await supabase
        .from('forum_tags')
        .select(`
            forums(*, books(*))
        `)
        .eq('tag_name', tagName)
        .order('forums(last_activity_at)', { ascending: false })
        .limit(50);

    if (error) return [];
    return data?.map(ft => ft.forums) || [];
}
```

#### 주요 변경사항
- Race condition 방지 → PostgreSQL 함수로 원자적 연산
- `collectionGroup` 쿼리 → JOIN 쿼리

---

### 4.6 searchService.ts

#### 변환 후 (Supabase)
```typescript
static async searchAll(term: string, options = {}): Promise<CommunitySearchResult> {
    const normalized = term.toLowerCase();

    // 포럼 검색 (Full-text search)
    const { data: forums } = await supabase
        .from('forums')
        .select(`
            *,
            books!inner(*)
        `)
        .or(`books.title.ilike.%${normalized}%,books.authors.cs.{${normalized}}`)
        .order('last_activity_at', { ascending: false })
        .limit(50);

    // 게시물 검색
    const { data: posts } = await supabase
        .from('posts')
        .select(`
            *,
            forums!inner(isbn, books!inner(title))
        `)
        .or(`title.ilike.%${normalized}%,content.ilike.%${normalized}%`)
        .order('created_at', { ascending: false })
        .limit(50);

    // 댓글 검색
    const { data: comments } = await supabase
        .from('comments')
        .select(`
            *,
            posts!inner(id, title, forum_isbn)
        `)
        .ilike('content', `%${normalized}%`)
        .order('created_at', { ascending: false })
        .limit(50);

    return {
        forums: forums || [],
        posts: posts || [],
        comments: comments || []
    };
}
```

#### 주요 변경사항
- 클라이언트 필터링 → PostgreSQL `ilike` 검색
- Full-text search 지원 (`to_tsvector`)
- 향후 Algolia 연동 시 별도 인덱스 서비스 추가

---

### 4.7 socialService.ts

#### 변환 후 (Supabase)
```typescript
static async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    // 기존 팔로우 확인
    const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();

    if (existing) {
        // 언팔로우
        await supabase
            .from('follows')
            .delete()
            .eq('id', existing.id);

        await this.createActivity('follow', currentUserId, targetUserId, { action: 'unfollow' });
        return false;
    } else {
        // 팔로우
        await supabase
            .from('follows')
            .insert({
                follower_id: currentUserId,
                following_id: targetUserId
            });

        await this.createActivity('follow', currentUserId, targetUserId, { action: 'follow' });
        return true;
    }
}

static async getFollowers(userId: string): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('follows')
        .select(`
            follower:users!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId);

    if (error) return [];
    return data?.map(f => f.follower) || [];
}

static async toggleLike(
    currentUserId: string,
    targetType: 'post' | 'comment',
    targetId: string
): Promise<boolean> {
    const table = targetType === 'post' ? 'post_likes' : 'comment_likes';
    const fkColumn = targetType === 'post' ? 'post_id' : 'comment_id';

    const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq(fkColumn, targetId)
        .eq('user_id', currentUserId)
        .single();

    if (existing) {
        await supabase.from(table).delete().eq('id', existing.id);
        // like_count 감소는 트리거로 처리
        return false;
    } else {
        await supabase.from(table).insert({ [fkColumn]: targetId, user_id: currentUserId });
        // like_count 증가는 트리거로 처리
        return true;
    }
}
```

---

### 4.8 profileImageService.ts

#### 변환 후 (Supabase)
```typescript
static async uploadProfileImage(userId: string, file: File): Promise<string> {
    // 파일 검증
    if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
    }
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    // 이미지 최적화
    const optimizedFile = await this.optimizeImage(file);

    // 파일명 생성
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;

    // Supabase Storage 업로드
    const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, optimizedFile, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) throw error;

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

static async deleteProfileImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.includes('profile-images')) return;

    // URL에서 경로 추출
    const path = imageUrl.split('profile-images/')[1];
    if (!path) return;

    const { error } = await supabase.storage
        .from('profile-images')
        .remove([path]);

    if (error) console.error('프로필 이미지 삭제 실패:', error);
}
```

---

### 4.9 postImageService.ts

#### 변환 후 (Supabase)
```typescript
static async uploadImage(
    forumId: string,
    postId: string,
    file: File,
    order: number,
    onProgress?: (progress: number) => void
): Promise<PostImage> {
    // 파일 검증
    this.validateFile(file);

    // 이미지 최적화
    const { optimizedFile, width, height } = await this.optimizeImage(file);

    // 파일명 생성
    const imageId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `${forumId}/${postId}/${imageId}.jpg`;

    // Supabase Storage 업로드
    const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, optimizedFile, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw new Error('이미지 업로드에 실패했습니다.');

    // 진행률 콜백 (Supabase는 현재 진행률 콜백 미지원, 완료 시 100%)
    onProgress?.(100);

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(data.path);

    return {
        id: imageId,
        url: urlData.publicUrl,
        width,
        height,
        order
    };
}

static async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl || !imageUrl.includes('post-images')) return;

    const path = imageUrl.split('post-images/')[1];
    if (!path) return;

    await supabase.storage.from('post-images').remove([path]);
}
```

#### 주의사항
- Supabase Storage는 업로드 진행률 콜백을 기본 지원하지 않음
- 대용량 파일 업로드 시 `tus` 프로토콜 사용 고려

---

### 4.10 notificationService.ts

#### 변환 후 (Supabase)
```typescript
static async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    content: string,
    metadata?: any
): Promise<string> {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            notification_type: type,
            title,
            content,
            metadata
        })
        .select('id')
        .single();

    if (error) throw error;
    return data.id;
}

// 실시간 알림 구독
static subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
): () => void {
    // 초기 데이터 로드
    this.getUserNotifications(userId).then(callback);

    // Realtime 구독
    const subscription = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            async () => {
                // 변경 시 전체 목록 재조회
                const notifications = await this.getUserNotifications(userId);
                callback(notifications);
            }
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}

static async markAsRead(notificationId: string): Promise<void> {
    await supabase
        .from('notifications')
        .update({
            is_read: true,
            read_at: new Date().toISOString()
        })
        .eq('id', notificationId);
}
```

---

### 4.11 messagingService.ts

#### 변환 후 (Supabase)
```typescript
static async getOrCreateChatRoom(userId1: string, userId2: string): Promise<ChatRoom> {
    // 기존 채팅방 찾기
    const { data: rooms } = await supabase
        .from('chat_room_participants')
        .select(`
            chat_room_id,
            chat_rooms(*)
        `)
        .eq('user_id', userId1);

    // 두 사용자가 모두 참여한 1:1 채팅방 찾기
    for (const room of rooms || []) {
        const { data: participants } = await supabase
            .from('chat_room_participants')
            .select('user_id')
            .eq('chat_room_id', room.chat_room_id);

        const participantIds = participants?.map(p => p.user_id) || [];
        if (participantIds.length === 2 && participantIds.includes(userId2)) {
            return room.chat_rooms as ChatRoom;
        }
    }

    // 새 채팅방 생성
    const { data: newRoom, error } = await supabase
        .from('chat_rooms')
        .insert({})
        .select()
        .single();

    if (error) throw error;

    // 참여자 추가
    await supabase.from('chat_room_participants').insert([
        { chat_room_id: newRoom.id, user_id: userId1 },
        { chat_room_id: newRoom.id, user_id: userId2 }
    ]);

    return newRoom;
}

static async sendMessage(
    chatRoomId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    metadata?: any
): Promise<string> {
    // 메시지 저장
    const { data: message, error } = await supabase
        .from('messages')
        .insert({
            chat_room_id: chatRoomId,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            message_type: messageType,
            metadata
        })
        .select()
        .single();

    if (error) throw error;

    // 채팅방 업데이트 및 읽지 않은 메시지 수 증가
    await supabase
        .from('chat_rooms')
        .update({
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', chatRoomId);

    await supabase.rpc('increment_unread_count', {
        p_chat_room_id: chatRoomId,
        p_user_id: receiverId
    });

    return message.id;
}

// 실시간 메시지 구독
static subscribeToMessages(
    chatRoomId: string,
    callback: (messages: Message[]) => void
): () => void {
    // 초기 데이터 로드
    this.getMessages(chatRoomId).then(callback);

    // Realtime 구독
    const subscription = supabase
        .channel(`messages:${chatRoomId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `chat_room_id=eq.${chatRoomId}`
            },
            async () => {
                const messages = await this.getMessages(chatRoomId);
                callback(messages);
            }
        )
        .subscribe();

    return () => {
        subscription.unsubscribe();
    };
}
```

---

### 4.12 adminService.ts

#### 변환 후 (Supabase)
```typescript
static async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', userId)
        .single();

    return !error && data?.role === 'admin';
}

static async getStats(): Promise<Stats> {
    const [
        { count: totalUsers },
        { count: totalForums },
        { count: totalPosts },
        { count: totalReports },
        { count: pendingReports }
    ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('forums').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return {
        totalUsers: totalUsers || 0,
        totalForums: totalForums || 0,
        totalPosts: totalPosts || 0,
        totalReports: totalReports || 0,
        pendingReports: pendingReports || 0
    };
}
```

---

### 4.13 변경 불필요 서비스

| 서비스 | 이유 |
|--------|------|
| `filterService.ts` | 클라이언트 사이드 로직, 변경 불필요 |
| `searchHistoryService.ts` | localStorage 기반, 변경 불필요 |
| `kakaoApi.ts` | 외부 API 호출, 변경 불필요 |

---

## 5. 데이터 마이그레이션 계획

### 5.0 Auth UID 매핑 전략 (Board Advisor 검토 추가)

> **핵심 이슈**: Firebase Auth UID와 Supabase Auth UUID는 다른 체계를 사용함. 기존 사용자의 데이터 연속성 보장 필요.

#### 5.0.1 옵션 비교

| 옵션 | 방식 | 장점 | 단점 |
|------|------|------|------|
| **A. Firebase UID 보존** | `supabase.auth.admin.createUser`로 Firebase UID를 Supabase UUID로 설정 | 코드 변경 최소화, 데이터 참조 무결성 유지 | Supabase 제약 가능성, 관리 복잡 |
| **B. 매핑 테이블** | `firebase_uid ↔ supabase_uuid` 매핑 테이블 생성 | 유연성, 양측 시스템 독립 유지 | 모든 쿼리에서 매핑 필요, 성능 부담 |
| **C. 최초 로그인 연결** | 이메일 기반 기존 계정 자동 연결 | 사용자 경험 자연스러움, 구현 단순 | 이메일 변경 시 문제, 동일 이메일 중복 계정 처리 |

#### 5.0.2 선택한 방안: 옵션 C (이메일 기반 계정 연결)

**선택 이유:**
1. **단순성**: 별도 매핑 테이블 불필요, 코드 복잡도 낮음
2. **사용자 경험**: 기존 사용자는 동일 소셜 로그인으로 자연스럽게 연결
3. **Supabase 권장 패턴**: OAuth 재인증 시 이메일 기반 매칭이 표준 패턴

**구현 방안:**

```typescript
// auth/callback 핸들러
async function handleAuthCallback() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new Error('인증 실패');
  }

  // 1. 마이그레이션된 기존 사용자 확인 (이메일 기반)
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single();

  if (existingUser) {
    // 2. 기존 사용자: auth_id 업데이트 (최초 로그인 시 1회)
    if (!existingUser.auth_id || existingUser.auth_id !== user.id) {
      await supabase
        .from('users')
        .update({
          auth_id: user.id,
          last_login_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      console.log(`기존 사용자 연결 완료: ${user.email}`);
    }
    return existingUser;
  } else {
    // 3. 신규 사용자: 새 프로필 생성
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email.split('@')[0],
        nickname: user.email.split('@')[0],
        profile_image_url: user.user_metadata?.avatar_url
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return newUser;
  }
}
```

#### 5.0.3 기존 사용자 로그인 시나리오

```
┌─────────────────────────────────────────────────────────────────────┐
│                     기존 사용자 A 로그인 흐름                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [마이그레이션 전]                                                    │
│  Firebase Auth: uid = "firebase_abc123"                             │
│  Firestore users/firebase_abc123: { email: "user@example.com" }     │
│                                                                     │
│  [마이그레이션 후 - Supabase 상태]                                    │
│  users 테이블:                                                       │
│    id: "uuid-migrated-123"                                          │
│    auth_id: NULL (아직 미연결)                                        │
│    email: "user@example.com"                                        │
│                                                                     │
│  [사용자 A가 카카오 로그인 시도]                                       │
│  1. Supabase Auth → 새 UUID 발급: "supabase_xyz789"                 │
│  2. 콜백에서 이메일 확인: "user@example.com"                          │
│  3. users 테이블에서 이메일 매칭 → 기존 레코드 발견                     │
│  4. auth_id 업데이트: NULL → "supabase_xyz789"                      │
│  5. 기존 데이터(게시물, 댓글, 북마크 등) 그대로 사용                    │
│                                                                     │
│  [결과]                                                              │
│  users 테이블:                                                       │
│    id: "uuid-migrated-123" (변경 없음)                               │
│    auth_id: "supabase_xyz789" (신규 연결)                            │
│    email: "user@example.com"                                        │
│                                                                     │
│  → 기존 모든 데이터와 연결 유지 ✅                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 5.0.4 마이그레이션 시 users 테이블 초기 상태

```sql
-- 마이그레이션 시 auth_id는 NULL로 설정
-- 사용자가 최초 로그인할 때 연결됨

INSERT INTO users (id, auth_id, email, display_name, ...)
VALUES (
  gen_random_uuid(),  -- 새로운 Supabase user ID
  NULL,               -- auth_id는 NULL (최초 로그인 시 업데이트)
  'user@example.com',
  '사용자닉네임',
  ...
);
```

#### 5.0.5 엣지 케이스 처리

| 케이스 | 처리 방안 |
|--------|----------|
| **동일 이메일, 다른 소셜 로그인** | Supabase는 이메일 기준으로 계정 통합. 설정에서 `GOTRUE_DISABLE_SIGNUP` 활용 |
| **이메일 변경된 사용자** | 마이그레이션 전 Firebase에서 현재 이메일 확인 필수 |
| **이메일 없는 계정** | 카카오/구글 OAuth는 항상 이메일 제공, 해당 없음 |
| **사용자가 로그인 안 함** | auth_id = NULL 상태 유지, RLS에서 인증 필요 기능 사용 불가 |

### 5.1 Firebase 데이터 추출 방법

#### 5.1.1 Node.js 마이그레이션 스크립트

```typescript
// scripts/export-firebase-data.ts
import admin from 'firebase-admin';
import fs from 'fs';

// Firebase Admin 초기화
admin.initializeApp({
    credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();

async function exportCollection(collectionName: string) {
    const snapshot = await db.collection(collectionName).get();
    const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    fs.writeFileSync(
        `./export/${collectionName}.json`,
        JSON.stringify(data, null, 2)
    );
    console.log(`Exported ${data.length} documents from ${collectionName}`);
}

async function exportSubcollection(
    parentCollection: string,
    subCollection: string
) {
    const parentSnapshot = await db.collection(parentCollection).get();
    const allData: any[] = [];

    for (const parentDoc of parentSnapshot.docs) {
        const subSnapshot = await db
            .collection(parentCollection)
            .doc(parentDoc.id)
            .collection(subCollection)
            .get();

        const subData = subSnapshot.docs.map(doc => ({
            id: doc.id,
            parentId: parentDoc.id,
            ...doc.data()
        }));

        allData.push(...subData);
    }

    fs.writeFileSync(
        `./export/${parentCollection}_${subCollection}.json`,
        JSON.stringify(allData, null, 2)
    );
    console.log(`Exported ${allData.length} documents from ${parentCollection}/${subCollection}`);
}

async function main() {
    // 컬렉션 내보내기
    await exportCollection('users');
    await exportCollection('forums');
    await exportCollection('ratings');
    await exportCollection('tags');
    await exportCollection('activities');
    await exportCollection('notifications');
    await exportCollection('chatRooms');
    await exportCollection('admins');
    await exportCollection('reports');

    // 서브컬렉션 내보내기
    await exportSubcollection('forums', 'posts');

    // 댓글은 posts의 서브컬렉션이므로 별도 처리
    const forumsSnapshot = await db.collection('forums').get();
    const allComments: any[] = [];

    for (const forumDoc of forumsSnapshot.docs) {
        const postsSnapshot = await db
            .collection('forums')
            .doc(forumDoc.id)
            .collection('posts')
            .get();

        for (const postDoc of postsSnapshot.docs) {
            const commentsSnapshot = await db
                .collection('forums')
                .doc(forumDoc.id)
                .collection('posts')
                .doc(postDoc.id)
                .collection('comments')
                .get();

            const comments = commentsSnapshot.docs.map(doc => ({
                id: doc.id,
                forumIsbn: forumDoc.id,
                postId: postDoc.id,
                ...doc.data()
            }));

            allComments.push(...comments);
        }
    }

    fs.writeFileSync(
        './export/comments.json',
        JSON.stringify(allComments, null, 2)
    );

    // 메시지 서브컬렉션
    await exportSubcollection('chatRooms', 'messages');

    console.log('Export completed!');
}

main().catch(console.error);
```

### 5.2 상세 데이터 마이그레이션 시나리오 (Board Advisor 검토 추가)

#### 5.2.0 마이그레이션 스크립트 상세 로직

> **파일 위치**: `scripts/migrate-firebase-to-supabase.ts`

##### 단계별 마이그레이션 순서 (의존성 고려)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    마이그레이션 실행 순서                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: 독립 엔티티 (의존성 없음)                                   │
│  ├── Step 1: users (기본 정보만)                                     │
│  ├── Step 2: books                                                  │
│  └── Step 3: tags (통계)                                            │
│                                                                     │
│  Phase 2: 1차 의존 엔티티                                            │
│  ├── Step 4: user_social_links (→ users)                           │
│  ├── Step 5: user_notification_settings (→ users)                  │
│  ├── Step 6: user_favorite_genres (→ users)                        │
│  ├── Step 7: forums (→ books)                                      │
│  ├── Step 8: follows (→ users)                                     │
│  ├── Step 9: admins (→ users)                                      │
│  └── Step 10: chat_rooms                                           │
│                                                                     │
│  Phase 3: 2차 의존 엔티티                                            │
│  ├── Step 11: forum_tags (→ forums)                                │
│  ├── Step 12: bookmarks (→ users, forums)                          │
│  ├── Step 13: ratings (→ users, books)                             │
│  ├── Step 14: posts (→ users, forums)                              │
│  ├── Step 15: chat_room_participants (→ users, chat_rooms)         │
│  └── Step 16: activities (→ users, forums)                         │
│                                                                     │
│  Phase 4: 3차 의존 엔티티                                            │
│  ├── Step 17: post_tags (→ posts)                                  │
│  ├── Step 18: post_images (→ posts)                                │
│  ├── Step 19: post_likes (→ posts, users)                          │
│  ├── Step 20: comments (→ posts, users)                            │
│  ├── Step 21: messages (→ chat_rooms, users)                       │
│  ├── Step 22: notifications (→ users)                              │
│  └── Step 23: reports (→ users, posts, comments, forums)           │
│                                                                     │
│  Phase 5: 4차 의존 엔티티                                            │
│  └── Step 24: comment_likes (→ comments, users)                    │
│                                                                     │
│  Phase 6: 통계 재계산 및 검증                                        │
│  ├── Step 25: update_all_counts() - 카운트 필드 재계산               │
│  └── Step 26: verify_migration() - 데이터 무결성 검증                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

##### 각 컬렉션별 변환 로직 Pseudo Code

```typescript
// =====================================================
// 핵심 변환 로직 Pseudo Code
// =====================================================

/**
 * Users 변환 로직
 * Firebase: users/{uid} → Supabase: users 테이블
 */
function transformUser(firebaseUser: FirebaseUser): SupabaseUser {
  return {
    id: generateUUID(),           // 새 UUID 생성
    auth_id: null,                // 최초 로그인 시 연결 (5.0 참조)
    email: firebaseUser.email,
    display_name: firebaseUser.displayName,
    nickname: firebaseUser.nickname,
    bio: firebaseUser.bio || '',
    profile_image_url: firebaseUser.profileImageUrl,
    location: firebaseUser.location,
    website: firebaseUser.website,
    reading_goal: firebaseUser.readingGoal || 0,
    post_count: firebaseUser.postCount || 0,      // Phase 6에서 재계산
    comment_count: firebaseUser.commentCount || 0,
    forum_count: firebaseUser.forumCount || 0,
    created_at: convertTimestamp(firebaseUser.createdAt),
    last_login_at: convertTimestamp(firebaseUser.lastLoginAt),
    is_active: true,
    // Firebase UID 보존 (매핑용 - 메타데이터로 저장)
    _firebase_uid: firebaseUser.uid  // 임시 필드, 마이그레이션 후 삭제 가능
  };
}

/**
 * Posts 변환 로직
 * Firebase: forums/{isbn}/posts/{postId} → Supabase: posts 테이블
 */
function transformPost(
  firebasePost: FirebasePost,
  forumIsbn: string,
  userIdMap: Map<string, string>  // Firebase UID → Supabase user ID
): SupabasePost | null {
  const authorId = userIdMap.get(firebasePost.author?.uid);

  if (!authorId) {
    logWarning(`Author not found: ${firebasePost.author?.uid}`);
    return null;  // 작성자 없으면 스킵
  }

  return {
    id: firebasePost.id || generateUUID(),
    forum_isbn: forumIsbn,
    author_id: authorId,
    title: firebasePost.title,
    content: firebasePost.content,
    comment_count: firebasePost.commentCount || 0,
    like_count: firebasePost.likeCount || 0,
    search_text: firebasePost.searchText || generateSearchText(firebasePost),
    created_at: convertTimestamp(firebasePost.createdAt),
    updated_at: convertTimestamp(firebasePost.updatedAt) || convertTimestamp(firebasePost.createdAt)
  };
}

/**
 * 배열 필드 → 별도 테이블 변환 로직
 * Firebase: users.bookmarkedForums[] → Supabase: bookmarks 테이블
 */
function transformArrayToTable(
  firebaseUsers: FirebaseUser[],
  userIdMap: Map<string, string>
): SupabaseBookmark[] {
  const bookmarks: SupabaseBookmark[] = [];

  for (const user of firebaseUsers) {
    if (!user.bookmarkedForums) continue;

    const supabaseUserId = userIdMap.get(user.uid);
    if (!supabaseUserId) continue;

    for (const forumIsbn of user.bookmarkedForums) {
      bookmarks.push({
        id: generateUUID(),
        user_id: supabaseUserId,
        forum_isbn: forumIsbn,
        created_at: new Date().toISOString()  // 원본에 생성일 없음
      });
    }
  }

  return bookmarks;
}

/**
 * 중첩 객체 → 별도 테이블 변환 로직
 * Firebase: users.socialLinks.{platform} → Supabase: user_social_links 테이블
 */
function transformNestedObjectToTable(
  firebaseUsers: FirebaseUser[],
  userIdMap: Map<string, string>
): SupabaseSocialLink[] {
  const socialLinks: SupabaseSocialLink[] = [];

  for (const user of firebaseUsers) {
    if (!user.socialLinks) continue;

    const supabaseUserId = userIdMap.get(user.uid);
    if (!supabaseUserId) continue;

    for (const [platform, url] of Object.entries(user.socialLinks)) {
      if (url && typeof url === 'string') {
        socialLinks.push({
          id: generateUUID(),
          user_id: supabaseUserId,
          platform: platform,
          url: url,
          created_at: new Date().toISOString()
        });
      }
    }
  }

  return socialLinks;
}
```

##### 에러 처리 및 재시도 로직

```typescript
// =====================================================
// 에러 처리 및 재시도 로직
// =====================================================

interface MigrationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  failedItems: FailedItem[];
  duration: number;
}

interface FailedItem {
  id: string;
  table: string;
  error: string;
  data: any;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const BATCH_SIZE = 100;

async function migrateWithRetry<T>(
  items: T[],
  tableName: string,
  transformFn: (item: T) => any,
  insertFn: (data: any) => Promise<void>
): Promise<MigrationResult> {
  const startTime = Date.now();
  const failedItems: FailedItem[] = [];
  let processedCount = 0;

  // 배치 처리
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      let retryCount = 0;
      let success = false;

      while (retryCount < MAX_RETRIES && !success) {
        try {
          const transformed = transformFn(item);
          if (transformed) {
            await insertFn(transformed);
            processedCount++;
            success = true;
          } else {
            // 변환 실패 (예: 작성자 없음) - 재시도하지 않음
            failedItems.push({
              id: (item as any).id || 'unknown',
              table: tableName,
              error: 'Transform returned null',
              data: item,
              retryCount: 0
            });
            break;
          }
        } catch (error) {
          retryCount++;

          if (retryCount >= MAX_RETRIES) {
            failedItems.push({
              id: (item as any).id || 'unknown',
              table: tableName,
              error: error instanceof Error ? error.message : String(error),
              data: item,
              retryCount
            });
          } else {
            // 지수 백오프
            await sleep(RETRY_DELAY_MS * Math.pow(2, retryCount - 1));
          }
        }
      }
    }

    // 진행률 로깅
    console.log(`[${tableName}] Progress: ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }

  return {
    success: failedItems.length === 0,
    processedCount,
    failedCount: failedItems.length,
    failedItems,
    duration: Date.now() - startTime
  };
}

// 실패 항목 재처리 함수
async function retryFailedItems(failedItems: FailedItem[]): Promise<MigrationResult> {
  console.log(`\n=== Retrying ${failedItems.length} failed items ===\n`);

  // 실패 항목별로 원인 분석 후 재시도
  // ... 구현
}

// 마이그레이션 체크포인트 저장
async function saveCheckpoint(phase: number, step: number, result: MigrationResult) {
  const checkpoint = {
    phase,
    step,
    timestamp: new Date().toISOString(),
    result
  };

  fs.writeFileSync(
    `./migration-checkpoint-${phase}-${step}.json`,
    JSON.stringify(checkpoint, null, 2)
  );
}

// 체크포인트에서 재개
async function resumeFromCheckpoint(): Promise<{ phase: number; step: number } | null> {
  const files = fs.readdirSync('.').filter(f => f.startsWith('migration-checkpoint-'));

  if (files.length === 0) return null;

  const latest = files.sort().pop()!;
  const checkpoint = JSON.parse(fs.readFileSync(latest, 'utf-8'));

  return {
    phase: checkpoint.phase,
    step: checkpoint.step + 1  // 다음 단계부터 시작
  };
}
```

#### 5.2.1 데이터 변환 및 Import 스크립트

```typescript
// scripts/import-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Service Role Key 사용
);

// 타임스탬프 변환 헬퍼
function convertTimestamp(firebaseTimestamp: any): string | null {
    if (!firebaseTimestamp) return null;
    if (firebaseTimestamp._seconds) {
        return new Date(firebaseTimestamp._seconds * 1000).toISOString();
    }
    return firebaseTimestamp;
}

async function importUsers() {
    const users = JSON.parse(fs.readFileSync('./export/users.json', 'utf-8'));

    for (const user of users) {
        // 메인 사용자 데이터
        const { error: userError } = await supabase.from('users').insert({
            id: user.id, // Firebase UID를 Supabase user ID로 사용
            auth_id: user.uid, // Auth 연결은 별도 처리 필요
            email: user.email,
            display_name: user.displayName,
            nickname: user.nickname,
            bio: user.bio,
            profile_image_url: user.profileImageUrl,
            location: user.location,
            website: user.website,
            reading_goal: user.readingGoal || 0,
            post_count: user.postCount || 0,
            comment_count: user.commentCount || 0,
            forum_count: user.forumCount || 0,
            created_at: convertTimestamp(user.createdAt),
            last_login_at: convertTimestamp(user.lastLoginAt)
        });

        if (userError) console.error('User import error:', userError);

        // 소셜 링크
        if (user.socialLinks) {
            for (const [platform, url] of Object.entries(user.socialLinks)) {
                if (url) {
                    await supabase.from('user_social_links').insert({
                        user_id: user.id,
                        platform,
                        url: url as string
                    });
                }
            }
        }

        // 알림 설정
        if (user.notificationSettings) {
            await supabase.from('user_notification_settings').insert({
                user_id: user.id,
                new_posts: user.notificationSettings.newPosts ?? true,
                new_comments: user.notificationSettings.newComments ?? true,
                forum_updates: user.notificationSettings.forumUpdates ?? true,
                follows: user.notificationSettings.follows ?? true,
                likes: user.notificationSettings.likes ?? true,
                email_notifications: user.notificationSettings.emailNotifications ?? false
            });
        }

        // 선호 장르
        if (user.favoriteGenres) {
            for (const genre of user.favoriteGenres) {
                await supabase.from('user_favorite_genres').insert({
                    user_id: user.id,
                    genre
                });
            }
        }
    }

    console.log(`Imported ${users.length} users`);
}

async function importForums() {
    const forums = JSON.parse(fs.readFileSync('./export/forums.json', 'utf-8'));

    for (const forum of forums) {
        // 책 정보 먼저 저장
        await supabase.from('books').upsert({
            isbn: forum.isbn,
            title: forum.book.title,
            authors: forum.book.authors,
            publisher: forum.book.publisher,
            thumbnail: forum.book.thumbnail,
            contents: forum.book.contents
        });

        // 포럼 저장
        await supabase.from('forums').insert({
            isbn: forum.isbn,
            category: forum.category,
            popularity: forum.popularity || 0,
            post_count: forum.postCount || 0,
            average_rating: forum.averageRating || 0,
            total_ratings: forum.totalRatings || 0,
            last_activity_at: convertTimestamp(forum.lastActivityAt),
            created_at: convertTimestamp(forum.createdAt) || new Date().toISOString()
        });

        // 태그 저장
        if (forum.tags) {
            for (const tag of forum.tags) {
                await supabase.from('forum_tags').insert({
                    forum_isbn: forum.isbn,
                    tag_name: tag
                });
            }
        }
    }

    console.log(`Imported ${forums.length} forums`);
}

async function importPosts() {
    const posts = JSON.parse(fs.readFileSync('./export/forums_posts.json', 'utf-8'));
    const userIdMap = await getUserIdMap(); // Firebase UID -> Supabase user ID

    for (const post of posts) {
        const authorId = userIdMap.get(post.author?.uid);
        if (!authorId) {
            console.warn(`Author not found for post: ${post.id}`);
            continue;
        }

        const { data: insertedPost, error } = await supabase.from('posts').insert({
            id: post.id,
            forum_isbn: post.parentId, // parentId = forum ISBN
            author_id: authorId,
            title: post.title,
            content: post.content,
            comment_count: post.commentCount || 0,
            like_count: post.likeCount || 0,
            search_text: post.searchText,
            created_at: convertTimestamp(post.createdAt)
        }).select().single();

        if (error) {
            console.error('Post import error:', error);
            continue;
        }

        // 태그
        if (post.tags) {
            for (const tag of post.tags) {
                await supabase.from('post_tags').insert({
                    post_id: insertedPost.id,
                    tag_name: tag
                });
            }
        }

        // 이미지
        if (post.images) {
            for (const img of post.images) {
                await supabase.from('post_images').insert({
                    id: img.id,
                    post_id: insertedPost.id,
                    url: img.url,
                    thumbnail_url: img.thumbnailUrl,
                    width: img.width,
                    height: img.height,
                    display_order: img.order
                });
            }
        }

        // 좋아요
        if (post.likes) {
            for (const likerUid of post.likes) {
                const likerId = userIdMap.get(likerUid);
                if (likerId) {
                    await supabase.from('post_likes').insert({
                        post_id: insertedPost.id,
                        user_id: likerId
                    });
                }
            }
        }
    }

    console.log(`Imported ${posts.length} posts`);
}

// ... 나머지 import 함수들 (comments, ratings, tags, etc.)

async function main() {
    console.log('Starting data migration...');

    await importUsers();
    await importForums();
    await importPosts();
    // await importComments();
    // await importRatings();
    // await importBookmarks();
    // await importFollows();
    // await importActivities();
    // await importNotifications();
    // await importChatRooms();
    // await importMessages();
    // await importAdmins();
    // await importReports();

    console.log('Migration completed!');
}

main().catch(console.error);
```

### 5.3 데이터 검증 방법

```sql
-- 검증 쿼리

-- 1. 사용자 수 비교
SELECT COUNT(*) as supabase_users FROM users;
-- Firebase에서 내보낸 users.json의 length와 비교

-- 2. 포럼 수 비교
SELECT COUNT(*) as supabase_forums FROM forums;

-- 3. 게시물 수 비교
SELECT COUNT(*) as supabase_posts FROM posts;

-- 4. 댓글 수 비교
SELECT COUNT(*) as supabase_comments FROM comments;

-- 5. 데이터 무결성 검증
-- 고아 게시물 (포럼 없음)
SELECT COUNT(*) FROM posts p
LEFT JOIN forums f ON p.forum_isbn = f.isbn
WHERE f.isbn IS NULL;

-- 고아 댓글 (게시물 없음)
SELECT COUNT(*) FROM comments c
LEFT JOIN posts p ON c.post_id = p.id
WHERE p.id IS NULL;

-- 6. 통계 검증
SELECT
    f.isbn,
    f.post_count as stored_post_count,
    COUNT(p.id) as actual_post_count
FROM forums f
LEFT JOIN posts p ON f.isbn = p.forum_isbn
GROUP BY f.isbn, f.post_count
HAVING f.post_count != COUNT(p.id);

-- 7. 타임존 검증 (Board Advisor 권고 추가)
-- UTC로 저장되었는지 확인
SELECT
    id,
    created_at,
    created_at AT TIME ZONE 'UTC' as utc_time,
    created_at AT TIME ZONE 'Asia/Seoul' as kst_time
FROM posts
ORDER BY created_at DESC
LIMIT 5;

-- 타임스탬프 범위 검증 (비정상적인 미래/과거 날짜)
SELECT id, created_at FROM posts
WHERE created_at > NOW() OR created_at < '2020-01-01'::timestamptz;

-- 8. 관계 무결성 종합 검증
SELECT
    'orphan_posts' as issue_type,
    COUNT(*) as count
FROM posts p
LEFT JOIN forums f ON p.forum_isbn = f.isbn
WHERE f.isbn IS NULL

UNION ALL

SELECT
    'orphan_comments',
    COUNT(*)
FROM comments c
LEFT JOIN posts p ON c.post_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT
    'orphan_post_likes',
    COUNT(*)
FROM post_likes pl
LEFT JOIN posts p ON pl.post_id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT
    'orphan_bookmarks',
    COUNT(*)
FROM bookmarks b
LEFT JOIN forums f ON b.forum_isbn = f.isbn
WHERE f.isbn IS NULL;

-- 9. 카운트 필드 재계산 및 검증
-- 게시물 좋아요 수
SELECT
    p.id,
    p.like_count as stored,
    COUNT(pl.id) as actual
FROM posts p
LEFT JOIN post_likes pl ON p.id = pl.post_id
GROUP BY p.id, p.like_count
HAVING p.like_count != COUNT(pl.id)
LIMIT 10;

-- 댓글 수
SELECT
    p.id,
    p.comment_count as stored,
    COUNT(c.id) as actual
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, p.comment_count
HAVING p.comment_count != COUNT(c.id)
LIMIT 10;
```

### 5.4 데이터 샘플링 검사 방법 (Board Advisor 권고 추가)

> **목적**: 자동화된 검증 외에 수동 샘플링으로 데이터 품질 확인

#### 5.4.1 샘플링 검사 절차

```
1. 각 테이블에서 무작위 10개 레코드 추출
2. Firebase Console에서 동일 ID의 원본 데이터 확인
3. 필드별 값 비교 (아래 체크리스트)
4. 불일치 발견 시 변환 로직 검토
```

#### 5.4.2 샘플링 SQL 쿼리

```sql
-- 사용자 샘플링
SELECT * FROM users ORDER BY RANDOM() LIMIT 10;

-- 게시물 샘플링 (관계 데이터 포함)
SELECT
    p.*,
    array_agg(DISTINCT pt.tag_name) as tags,
    array_agg(DISTINCT pi.url) as images
FROM posts p
LEFT JOIN post_tags pt ON p.id = pt.post_id
LEFT JOIN post_images pi ON p.id = pi.post_id
GROUP BY p.id
ORDER BY RANDOM()
LIMIT 10;

-- 특정 사용자의 전체 데이터 검증 (종합)
SELECT 'user' as type, * FROM users WHERE email = 'test@example.com'
UNION ALL
SELECT 'posts' as type, p.* FROM posts p
JOIN users u ON p.author_id = u.id WHERE u.email = 'test@example.com'
UNION ALL
SELECT 'comments' as type, c.* FROM comments c
JOIN users u ON c.author_id = u.id WHERE u.email = 'test@example.com';
```

#### 5.4.3 수동 검증 체크리스트

```
필드별 검증 항목:
- [ ] 텍스트 필드: 한글 인코딩 정상, 특수문자 보존
- [ ] 숫자 필드: 값 정확, 소수점 처리 정상
- [ ] 타임스탬프: UTC 변환 정확, 시간대 차이 없음
- [ ] 배열 필드 → 별도 테이블: 모든 요소 매핑됨
- [ ] 중첩 객체 → 별도 테이블: 키-값 매핑 정확
- [ ] 외래 키: 참조 무결성 유지
- [ ] NULL 값: 원본 NULL과 빈 문자열 구분 처리
```

---

## 6. 주차별 상세 일정

### Week 1: 인프라 설정 (Day 1-5)

#### Day 1-2: Supabase 프로젝트 설정
- [ ] Supabase 프로젝트 생성
- [ ] 카카오 OAuth 설정
- [ ] 구글 OAuth 설정
- [ ] 환경 변수 설정 (.env.local)
- [ ] Supabase CLI 설치 및 설정
- [ ] TypeScript 타입 생성 설정

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 타입 생성
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

#### Day 3-4: PostgreSQL 스키마 생성
- [ ] 모든 테이블 생성 SQL 실행
- [ ] 인덱스 생성
- [ ] RLS 정책 설정
- [ ] PostgreSQL 함수 생성 (increment_tag_count, update_forum_rating 등)
- [ ] 트리거 설정 (like_count 자동 업데이트 등)

```sql
-- 트리거 예시: post_likes 테이블 변경 시 posts.like_count 자동 업데이트
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();
```

#### Day 5: Storage 버킷 및 정책 설정
- [ ] profile-images 버킷 생성
- [ ] post-images 버킷 생성
- [ ] Storage 정책 설정
- [ ] CORS 설정
- [ ] 기존 Firebase Storage 이미지 URL 호환성 확인

---

### Week 2: 서비스 레이어 마이그레이션 (Day 6-10)

#### Day 6: Core Services
- [ ] `supabase.ts` 생성 (기존 firebase.ts 대체)
- [ ] `authService.ts` 마이그레이션
- [ ] `userService.ts` 마이그레이션 (기존 userProfile.ts)
- [ ] 단위 테스트 작성

#### Day 7: Forum & Post Services
- [ ] `forumService.ts` 신규 생성
- [ ] `postService.ts` 신규 생성
- [ ] `commentService.ts` 신규 생성
- [ ] 단위 테스트 작성

#### Day 8: Rating & Tag Services
- [ ] `ratingService.ts` 마이그레이션
- [ ] `tagService.ts` 마이그레이션
- [ ] PostgreSQL 함수 테스트
- [ ] 단위 테스트 작성

#### Day 9: Search & Social Services
- [ ] `searchService.ts` 마이그레이션
- [ ] `socialService.ts` 마이그레이션 (팔로우, 좋아요)
- [ ] 단위 테스트 작성

#### Day 10: Bookmark & Notification Services
- [ ] `bookmarkService.ts` 마이그레이션
- [ ] `notificationService.ts` 마이그레이션
- [ ] Supabase Realtime 테스트
- [ ] 단위 테스트 작성

---

### Week 3: 스토리지 및 데이터 마이그레이션 (Day 11-15)

#### Day 11-12: Storage Services & Messaging
- [ ] `profileImageService.ts` 마이그레이션
- [ ] `postImageService.ts` 마이그레이션
- [ ] `messagingService.ts` 마이그레이션
- [ ] `adminService.ts` 마이그레이션
- [ ] Storage 업로드/다운로드 테스트

#### Day 13-14: 데이터 마이그레이션 실행
- [ ] Firebase 데이터 내보내기 스크립트 실행
- [ ] 데이터 변환 및 Supabase Import (Phase 1~6)
- [ ] 각 단계별 체크포인트 저장
- [ ] 실패 항목 재처리

#### Day 15: 데이터 검증
- [ ] 데이터 검증 쿼리 실행
- [ ] 불일치 데이터 수정
- [ ] 타임존 검증 (아래 쿼리 참조)
- [ ] 샘플링 검사 (아래 방법 참조)

**타임존 검증 쿼리:**
```sql
-- 타임스탬프 타임존 검증
SELECT
  id,
  created_at,
  created_at AT TIME ZONE 'Asia/Seoul' as created_at_kst,
  EXTRACT(HOUR FROM created_at) as utc_hour
FROM posts
ORDER BY created_at DESC
LIMIT 10;

-- Firebase 원본과 비교할 특정 게시물 확인
SELECT * FROM posts WHERE id = 'known-post-id-from-firebase';
```

**샘플링 검사 방법:**
```sql
-- 각 테이블에서 무작위 10개 샘플링
SELECT * FROM users ORDER BY RANDOM() LIMIT 10;
SELECT * FROM posts ORDER BY RANDOM() LIMIT 10;
SELECT * FROM comments ORDER BY RANDOM() LIMIT 10;

-- 샘플 데이터를 Firebase Console과 수동 비교
-- 체크리스트:
-- [ ] 텍스트 필드 한글 인코딩 정상
-- [ ] 타임스탬프 값 일치 (UTC 기준)
-- [ ] 숫자 필드 값 정확
-- [ ] 배열/객체 → 별도 테이블 매핑 정확
```

---

### Week 4: 버퍼 + QA + 배포 (Day 16-20) - Board Advisor 권고 추가

> **추가 배경**: 예상치 못한 이슈 대응, 충분한 QA 시간 확보, 안전한 배포를 위한 버퍼 주간

#### Day 16-17: 예비일 (이슈 대응 버퍼)
- [ ] Week 1-3 미완료 작업 마무리
- [ ] 발견된 버그 수정
- [ ] 성능 최적화 (쿼리 튜닝, 인덱스 조정)
- [ ] 문서 보완

**예상 이슈 및 대응:**
| 예상 이슈 | 대응 방안 | 소요 시간 |
|----------|----------|----------|
| RLS 정책 누락 | 테스트 중 권한 오류로 발견 → 정책 추가 | 2-4시간 |
| 타임스탬프 불일치 | 변환 로직 수정 → 재마이그레이션 | 4-8시간 |
| 이미지 URL 깨짐 | Storage 경로 매핑 수정 | 2-4시간 |
| Realtime 지연 | 채널 설정 최적화 | 2-4시간 |
| 쿼리 성능 저하 | 인덱스 추가, 쿼리 최적화 | 4-8시간 |

#### Day 18-19: QA 검증
- [ ] QA Engineer에게 전체 기능 QA 요청
- [ ] QA 체크리스트 (섹션 7) 전체 항목 검증
- [ ] 발견된 버그 수정
- [ ] 재검증

**QA 요청 형식:**
```
To: QA Engineer
Subject: [QA 요청] 북살롱 v0.4.0 Supabase 마이그레이션

테스트 환경: https://booksalon-staging.vercel.app
테스트 계정: (제공 예정)

QA 범위:
- 전체 기능 (섹션 7 QA 체크리스트)
- 기존 데이터 접근 확인
- 신규 데이터 생성 확인
- 실시간 기능 확인

우선순위:
1. 인증 (카카오/구글 로그인)
2. 게시물 CRUD
3. 실시간 알림/메시지
4. 데이터 무결성

QA 완료 기한: Day 19 EOD
```

#### Day 20: 최종 검증 및 배포 준비
- [ ] QA 승인 확인
- [ ] 프로덕션 배포 체크리스트 확인
- [ ] 점검 페이지 준비
- [ ] 사용자 공지 준비
- [ ] 롤백 스크립트 최종 테스트
- [ ] **배포는 다음 주 새벽 시간대로 예약**

**배포 체크리스트:**
```
프로덕션 배포 전 최종 확인:
- [ ] QA 승인 완료 (QA Engineer 서명)
- [ ] CEO 승인 완료
- [ ] 회장님 최종 승인
- [ ] Firebase 백업 완료
- [ ] 환경 변수 준비 완료
- [ ] 롤백 절차 팀 공유
- [ ] 점검 공지 발송 완료
```

---

## 7. QA 체크리스트

### 7.1 인증 기능
- [ ] 카카오 로그인 정상 동작
- [ ] 구글 로그인 정상 동작
- [ ] 로그아웃 정상 동작
- [ ] 세션 유지 확인
- [ ] 토큰 갱신 확인

### 7.2 사용자 프로필
- [ ] 프로필 조회 정상
- [ ] 프로필 수정 정상
- [ ] 프로필 이미지 업로드 정상
- [ ] 프로필 이미지 삭제 정상
- [ ] 기본 프로필 이미지 생성 정상
- [ ] 알림 설정 변경 정상

### 7.3 살롱 (Forum) 기능
- [ ] 살롱 목록 조회 정상
- [ ] 살롱 상세 조회 정상
- [ ] 살롱 생성 정상 (책 검색 후)
- [ ] 살롱 카테고리 필터링 정상
- [ ] 살롱 태그 필터링 정상
- [ ] 살롱 정렬 (최신, 인기, 게시물 수) 정상

### 7.4 게시물 기능
- [ ] 게시물 목록 조회 정상
- [ ] 게시물 상세 조회 정상
- [ ] 게시물 작성 정상
- [ ] 게시물 수정 정상
- [ ] 게시물 삭제 정상
- [ ] 게시물 이미지 업로드 정상 (최대 3장)
- [ ] 게시물 태그 추가/수정 정상

### 7.5 댓글 기능
- [ ] 댓글 목록 조회 정상
- [ ] 댓글 작성 정상
- [ ] 댓글 수정 정상
- [ ] 댓글 삭제 정상
- [ ] 댓글 수 자동 업데이트

### 7.6 태그 기능
- [ ] 인기 태그 조회 정상
- [ ] 태그 자동완성 정상
- [ ] 태그로 살롱 검색 정상
- [ ] 태그로 게시물 검색 정상
- [ ] 태그 카운트 증가/감소 정상

### 7.7 검색 기능
- [ ] 통합 검색 (살롱, 게시물, 댓글) 정상
- [ ] 검색어 하이라이트 정상
- [ ] 검색어 자동완성 정상
- [ ] 검색 히스토리 저장/삭제 정상

### 7.8 평점 기능
- [ ] 평점 부여 정상
- [ ] 평점 수정 정상
- [ ] 평균 평점 계산 정상
- [ ] 평점 분포 조회 정상

### 7.9 북마크 기능
- [ ] 북마크 추가 정상
- [ ] 북마크 제거 정상
- [ ] 북마크 목록 조회 정상

### 7.10 팔로우 기능
- [ ] 팔로우 정상
- [ ] 언팔로우 정상
- [ ] 팔로워 목록 조회 정상
- [ ] 팔로잉 목록 조회 정상

### 7.11 좋아요 기능
- [ ] 게시물 좋아요 정상
- [ ] 댓글 좋아요 정상
- [ ] 좋아요 취소 정상
- [ ] 좋아요 수 자동 업데이트

### 7.12 알림 기능
- [ ] 알림 생성 정상
- [ ] 알림 목록 조회 정상
- [ ] 알림 읽음 처리 정상
- [ ] 실시간 알림 수신 정상 (Realtime)
- [ ] 읽지 않은 알림 카운트 정상

### 7.13 메시징 기능
- [ ] 채팅방 생성 정상
- [ ] 메시지 전송 정상
- [ ] 메시지 목록 조회 정상
- [ ] 실시간 메시지 수신 정상 (Realtime)
- [ ] 읽지 않은 메시지 카운트 정상

### 7.14 관리자 기능
- [ ] 관리자 권한 확인 정상
- [ ] 사용자 목록 조회 정상
- [ ] 사용자 계정 비활성화/활성화 정상
- [ ] 신고 목록 조회 정상
- [ ] 신고 처리 정상
- [ ] 통계 조회 정상

### 7.15 성능 테스트
- [ ] 페이지 로드 시간 < 3초
- [ ] API 응답 시간 < 500ms
- [ ] 실시간 업데이트 지연 < 1초
- [ ] 이미지 업로드 시간 < 5초 (5MB 기준)

### 7.16 데이터 무결성
- [ ] 모든 사용자 데이터 마이그레이션 완료
- [ ] 모든 게시물 데이터 마이그레이션 완료
- [ ] 모든 댓글 데이터 마이그레이션 완료
- [ ] 이미지 URL 접근 가능
- [ ] 카운트 필드 정합성 확인

---

## 8. 롤백 계획 (Board Advisor 검토 반영 - 현실적 계획)

> **변경 사항**: "역방향 동기화" 방식 삭제. 마이그레이션 중 발생하는 신규 데이터 손실을 허용하는 현실적 접근으로 변경.

### 8.1 핵심 원칙

```
⚠️ 현실적 인정:
- 마이그레이션 중 발생하는 신규 데이터는 롤백 시 손실될 수 있음
- 완벽한 역방향 동기화는 비용 대비 효과가 낮음
- 다운타임(점검 시간)을 통해 데이터 손실 최소화
```

### 8.2 롤백 시나리오별 대응 방안

| 시나리오 | 발생 시점 | 대응 방안 | 데이터 손실 |
|----------|----------|----------|------------|
| **QA 실패** | Week 4 QA 중 | 배포 취소, Firebase 유지 | 없음 |
| **마이그레이션 스크립트 실패** | Week 3 Day 13 | 실패 지점부터 재시작 | 없음 |
| **배포 직후 치명적 버그** | 배포 후 1시간 내 | 즉시 Firebase 롤백 | 최소 (점검 중 발생 데이터만) |
| **배포 후 심각한 문제 발견** | 배포 후 24시간 내 | Firebase 롤백 + 수동 복구 | 중간 (24시간 내 신규 데이터) |
| **배포 후 1주일 이후** | 안정화 후 | 롤백 불가, Supabase 유지 | 해당 없음 |

### 8.3 롤백 절차 상세

#### 시나리오 A: 마이그레이션 스크립트 부분 실패

```
┌─────────────────────────────────────────────────────────────────────┐
│  마이그레이션 중 실패 시 (예: Step 14 posts 임포트 중 에러)           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 에러 로그 확인                                                   │
│     - migration-checkpoint-3-14.json 확인                           │
│     - failedItems 목록 분석                                         │
│                                                                     │
│  2. 원인 분석 및 수정                                                │
│     - 데이터 형식 오류 → 변환 로직 수정                               │
│     - FK 위반 → 누락된 참조 데이터 확인                               │
│     - 타임아웃 → 배치 크기 조정                                      │
│                                                                     │
│  3. 실패 지점부터 재시작                                             │
│     $ npm run migrate -- --resume                                  │
│     → 체크포인트에서 자동으로 재개                                   │
│                                                                     │
│  4. 실패 항목 개별 재처리                                            │
│     $ npm run migrate:retry -- --file failed-items.json            │
│                                                                     │
│  ✅ 데이터 손실: 없음                                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### 시나리오 B: 배포 직후 치명적 버그 (1시간 내)

```
┌─────────────────────────────────────────────────────────────────────┐
│  배포 직후 롤백 (1시간 내)                                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 즉시 점검 페이지 활성화                                          │
│     $ vercel env pull && MAINTENANCE_MODE=true vercel --prod       │
│                                                                     │
│  2. Firebase 환경 변수로 전환                                        │
│     Vercel Dashboard > Settings > Environment Variables            │
│     - VITE_SUPABASE_* 제거                                         │
│     - VITE_FIREBASE_* 복원 (백업에서)                               │
│                                                                     │
│  3. Firebase 코드 브랜치로 롤백                                      │
│     $ git checkout v0.3.x-firebase                                 │
│     $ vercel --prod                                                │
│                                                                     │
│  4. 점검 페이지 해제                                                 │
│                                                                     │
│  5. 장애 보고서 작성 및 원인 분석                                    │
│                                                                     │
│  ⚠️ 데이터 손실: 점검 시간 중 발생한 데이터만 (최소)                  │
│     - 마이그레이션은 점검 시간에 수행하므로 사용자 데이터 거의 없음    │
└─────────────────────────────────────────────────────────────────────┘
```

#### 시나리오 C: 배포 후 24시간 내 심각한 문제

```
┌─────────────────────────────────────────────────────────────────────┐
│  배포 후 24시간 내 롤백                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 점검 페이지 활성화                                               │
│                                                                     │
│  2. Supabase 신규 데이터 백업                                        │
│     -- 마이그레이션 이후 생성된 데이터만 추출                        │
│     SELECT * FROM users                                            │
│       WHERE created_at > '마이그레이션_완료_시간';                   │
│     SELECT * FROM posts                                            │
│       WHERE created_at > '마이그레이션_완료_시간';                   │
│     -- ... 모든 테이블                                              │
│                                                                     │
│  3. Firebase 롤백 (시나리오 B와 동일)                                │
│                                                                     │
│  4. 신규 데이터 수동 복구 (선택)                                     │
│     - 추출한 데이터를 Firebase 형식으로 변환                         │
│     - Firebase Admin SDK로 복원                                     │
│     - ⚠️ 복잡하고 오류 가능성 있음, 중요 데이터만 선별 복구          │
│                                                                     │
│  5. 사용자 공지                                                      │
│     "서비스 점검 중 일부 데이터가 복구되지 않을 수 있습니다.         │
│      불편을 드려 죄송합니다."                                        │
│                                                                     │
│  ⚠️ 데이터 손실: 24시간 내 신규 생성 데이터                          │
│     - 신규 가입자, 게시물, 댓글 등                                   │
│     - 수동 복구 시도하나 100% 보장 불가                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.4 다운타임 계획: "점검 중" 페이지 운영

> **핵심**: 마이그레이션 중 사용자 접근을 차단하여 데이터 불일치 방지

```typescript
// middleware.ts - 점검 모드 미들웨어
export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
    // 관리자 IP는 허용 (테스트용)
    const allowedIPs = process.env.MAINTENANCE_ALLOWED_IPS?.split(',') || [];
    const clientIP = request.ip || request.headers.get('x-forwarded-for');

    if (clientIP && allowedIPs.includes(clientIP)) {
      return NextResponse.next();
    }

    // 점검 페이지로 리다이렉트
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}
```

**점검 페이지 내용:**
```html
<!-- pages/maintenance.tsx -->
<div class="maintenance-page">
  <h1>🔧 서비스 점검 중</h1>
  <p>더 나은 서비스를 위해 시스템 업그레이드 중입니다.</p>
  <p>점검 예상 시간: 2026-XX-XX 02:00 ~ 06:00 (4시간)</p>
  <p>불편을 드려 죄송합니다.</p>
</div>
```

**점검 시간 계획:**
- **시간대**: 새벽 02:00 ~ 06:00 (사용량 최저 시간대)
- **예상 소요**: 3~4시간
- **사전 공지**: 1주일 전 앱 내 공지, 이메일 발송

### 8.5 Firebase 데이터 백업 보존 기간

| 백업 유형 | 보존 기간 | 위치 | 용도 |
|----------|----------|------|------|
| **마이그레이션 직전 스냅샷** | 90일 | GCS 버킷 | 롤백 소스 |
| **마이그레이션 JSON 덤프** | 1년 | 로컬 + GCS | 데이터 검증, 감사 |
| **Firebase 프로젝트** | 마이그레이션 후 30일 | Firebase Console | 긴급 롤백 |

```bash
# Firebase 데이터 백업 명령어
$ gcloud firestore export gs://booksalon-backup/pre-migration-$(date +%Y%m%d)

# Storage 백업
$ gsutil -m cp -r gs://booksalon.appspot.com gs://booksalon-backup/storage-$(date +%Y%m%d)
```

### 8.6 데이터 손실 허용 범위 명시

```
┌─────────────────────────────────────────────────────────────────────┐
│                    데이터 손실 허용 범위                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ 허용:                                                           │
│  - 마이그레이션 점검 시간(4시간) 중 발생 시도한 데이터               │
│    → 점검 페이지로 차단되므로 실제로는 발생하지 않음                  │
│                                                                     │
│  ⚠️ 조건부 허용 (배포 후 24시간 내 롤백 시):                          │
│  - 신규 가입자: 재가입 안내                                          │
│  - 신규 게시물/댓글: 복구 시도, 실패 시 사과 공지                    │
│  - 좋아요/북마크: 복구 안 함, 재설정 안내                            │
│                                                                     │
│  ❌ 불허용:                                                          │
│  - 마이그레이션 이전 기존 데이터 손실                                │
│  - 사용자 계정 정보 손실                                             │
│  - 결제 관련 데이터 손실 (해당 없음, 무료 서비스)                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.7 롤백 대비 체크리스트

```
마이그레이션 전:
- [ ] Firebase 프로젝트 삭제하지 않음 (최소 30일 유지)
- [ ] Firebase 환경 변수 별도 파일로 백업 (.env.firebase.backup)
- [ ] Firebase 코드 브랜치 생성 (v0.3.x-firebase)
- [ ] Firestore 전체 백업 (GCS)
- [ ] Storage 전체 백업 (GCS)
- [ ] 롤백 실행 스크립트 테스트 완료
- [ ] 점검 페이지 배포 및 테스트

마이그레이션 중:
- [ ] 마이그레이션 시작/완료 시간 기록
- [ ] 각 단계별 체크포인트 저장
- [ ] 실패 항목 로그 보관

마이그레이션 후:
- [ ] 30일간 Firebase 프로젝트 유지
- [ ] 90일간 백업 데이터 유지
- [ ] 롤백 스크립트 보관 (1년)
```

---

## 9. 환경 변수 목록

### 9.1 현재 Firebase 환경 변수 (제거 예정)

```env
# Firebase (제거 예정)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

### 9.2 신규 Supabase 환경 변수

```env
# Supabase (신규)
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase Service Role Key (서버 사이드 전용, 프론트엔드 노출 금지)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 9.3 유지할 환경 변수

```env
# Kakao API (유지)
VITE_KAKAO_API_KEY=
```

### 9.4 Vercel 환경 변수 설정

```bash
# Vercel CLI로 설정
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

---

## 10. 리스크 및 완화 방안

| 리스크 | 영향도 | 발생 확률 | 완화 방안 |
|--------|--------|----------|-----------|
| 데이터 손실 | 높음 | 낮음 | 마이그레이션 전 백업, 단계별 검증 |
| 실시간 기능 장애 | 중간 | 중간 | Supabase Realtime 사전 테스트, 폴링 폴백 |
| OAuth 연동 실패 | 높음 | 낮음 | 사전 테스트, 문서 확인 |
| 성능 저하 | 중간 | 중간 | 인덱스 최적화, 쿼리 튜닝 |
| 비용 초과 | 낮음 | 낮음 | 사용량 모니터링, 쿼리 최적화 |
| 이미지 URL 깨짐 | 중간 | 낮음 | URL 매핑 테이블 유지, 점진적 마이그레이션 |

---

## 11. 승인 및 서명

| 역할 | 이름 | 승인 | 날짜 |
|------|------|------|------|
| **작성자** | Fullstack Dev | ✅ | 2026-02-05 |
| **검토자** | CEO Agent | ⏳ | - |
| **최종 승인** | 회장님 | ⏳ | - |

---

## 부록 A: 전체 스키마 생성 SQL

별도 파일로 제공: `schema.sql`

## 부록 B: 마이그레이션 스크립트

별도 파일로 제공: `scripts/migrate-firebase-to-supabase.ts`

## 부록 C: 타입 정의

Supabase CLI로 자동 생성: `src/types/database.types.ts`

---

*본 문서는 북살롱 v0.4.0 Supabase 마이그레이션을 위한 상세 계획서입니다.*
*실제 마이그레이션 진행 시 상황에 따라 조정될 수 있습니다.*
