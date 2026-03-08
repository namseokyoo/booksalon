// Timestamp 타입 정의 (Supabase에서는 ISO 문자열 또는 Date 객체)
export type Timestamp = string | Date;

export interface Book {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  contents: string;
}

export interface Author {
  uid: string;
  email: string;
}

export interface UserProfile {
  id: string; // users 테이블 PK (내부 DB ID)
  uid: string; // auth_id (Supabase Auth UID) - 기존 호환성
  email: string;
  displayName?: string;
  nickname?: string; // 사용자 닉네임
  bio?: string;
  profileImageUrl?: string; // 프로필 사진 URL
  profileImageFile?: File; // 업로드용 파일 객체
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  postCount: number;
  commentCount: number;
  forumCount: number;
  bookmarkedForums?: string[]; // 북마크한 포럼 ISBN 목록
  following?: string[]; // 팔로우하는 사용자 UID 목록
  followers?: string[]; // 팔로워 UID 목록
  favoriteGenres?: string[]; // 선호 장르
  readingGoal?: number; // 연간 독서 목표
  location?: string; // 지역
  website?: string; // 개인 웹사이트
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    blog?: string;
  };
  notificationSettings?: {
    newPosts: boolean;
    newComments: boolean;
    forumUpdates: boolean;
    follows: boolean;
    likes: boolean;
    emailNotifications: boolean;
  };
}

export interface Comment {
  id: string;
  content: string;
  author: Author;
  createdAt: Timestamp;
  updatedAt?: Timestamp; // 수정 일시 (BL-117)
  likes?: string[]; // 좋아요한 사용자 UID 목록
  likeCount?: number; // 좋아요 수
  parentId?: string | null; // 대댓글 지원 (BL-117): null이면 최상위 댓글
  replies?: Comment[]; // 대댓글 목록 (BL-117): 최대 1레벨
}

// 게시물 이미지 타입
export interface PostImage {
  id: string;               // 고유 ID
  url: string;              // Firebase Storage URL
  thumbnailUrl?: string;    // 썸네일 URL (선택)
  width: number;            // 원본 너비
  height: number;           // 원본 높이
  order: number;            // 표시 순서
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: Author;
  createdAt: Timestamp;
  commentCount: number;
  likes?: string[]; // 좋아요한 사용자 UID 목록
  likeCount?: number; // 좋아요 수
  viewCount?: number; // 조회수
  tags?: string[]; // 태그 목록 (최대 3개)
  searchText?: string; // 검색 최적화용 필드
  images?: PostImage[]; // 이미지 목록 (최대 3장)
}

// Activity 메타데이터 타입
export interface ActivityMetadata {
  action?: string;
  [key: string]: unknown;
}

export interface Activity {
  id: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'bookmark';
  userId: string;
  userName: string;
  userEmail: string;
  targetId: string; // 게시물/댓글 ID 또는 사용자 UID
  targetTitle?: string; // 게시물 제목 또는 사용자명
  forumIsbn?: string; // 관련 포럼 ISBN
  forumTitle?: string; // 관련 포럼 제목
  createdAt: Timestamp;
  metadata?: ActivityMetadata; // 추가 메타데이터
}

export interface Forum {
  isbn: string;
  book: Book;
  postCount: number;
  lastActivityAt?: Timestamp;
  popularity?: number; // 인기도 점수
  averageRating?: number; // 평균 평점 (1-5)
  totalRatings?: number; // 평가 수
}

// 책 평점 타입
export interface BookRating {
  id: string;
  bookIsbn: string;
  userId: string;
  rating: number; // 1-5점
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// 평점 분포 타입
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

// 메시지 타입
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Timestamp;
  readAt?: Timestamp;
  messageType: 'text' | 'image' | 'file';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  };
}

// 채팅방 타입
export interface ChatRoom {
  id: string;
  participants: string[]; // 사용자 ID 배열
  lastMessage?: Message;
  lastMessageAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  unreadCount?: { [userId: string]: number }; // 사용자별 읽지 않은 메시지 수
}

// 알림 타입
export interface Notification {
  id: string;
  userId: string; // 알림을 받을 사용자 ID
  type: 'message' | 'like' | 'comment' | 'follow' | 'forum_invite' | 'system';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  metadata?: {
    senderId?: string;
    forumId?: string;
    postId?: string;
    commentId?: string;
    chatRoomId?: string;
  };
}

// 관리자 타입
export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'moderator' | 'user';
  permissions: string[];
  createdAt: Timestamp;
}

// 태그 통계 타입
export interface TagStats {
  name: string;
  count: number;
  type: 'forum' | 'post';
  lastUsedAt: Timestamp;
}

// 신고 타입
export interface Report {
  id: string;
  reporterId: string; // 신고한 사용자 ID
  reportedUserId?: string; // 신고당한 사용자 ID
  reportedPostId?: string; // 신고당한 게시물 ID
  reportedCommentId?: string; // 신고당한 댓글 ID
  reportedForumId?: string; // 신고당한 포럼 ID
  type: 'spam' | 'harassment' | 'inappropriate_content' | 'fake_news' | 'other';
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string; // 해결한 관리자 ID
  resolution?: string; // 해결 내용
}
