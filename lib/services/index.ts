/**
 * Service Layer - Supabase 마이그레이션
 *
 * 북살롱 v0.4.0 - 모든 서비스를 통합 export
 *
 * @description
 * Firebase에서 Supabase로 마이그레이션된 서비스들.
 * 기존 인터페이스를 최대한 유지하여 호출부 변경 최소화.
 */

// User Service
export { UserService, type UserProfile } from './userService'

// Bookmark Service
export {
  BookmarkService,
  type Forum as BookmarkForum,
} from './bookmarkService'

// Rating Service
export {
  RatingService,
  type RatingDistribution,
  type BookRating,
} from './ratingService'

// Tag Service
export {
  TagService,
  type TagStats,
  type Post as TagPost,
} from './tagService'

// Search Service
export {
  SearchService,
  type CommunitySearchResult,
  type ForumSearchResult,
  type PostSearchResult,
  type CommentSearchResult,
} from './searchService'

// Social Service
export { SocialService, type Activity } from './socialService'

// Profile Image Service (Week 3 추가)
export { ProfileImageService } from './profileImageService'

// Post Image Service (Week 3 추가)
export { PostImageService, type PostImage } from './postImageService'

// Notification Service (Firebase → Supabase 마이그레이션)
export { NotificationService } from './notificationService'

// Admin Service (Firebase → Supabase 마이그레이션)
export { AdminService } from './adminService'

// Messaging Service (Firebase → Supabase 마이그레이션)
export { MessagingService } from './messagingService'

// Filter Service (Firebase 의존성 없음, services/ → lib/services/ 이동)
export { FilterService, type FilterOptions } from './filterService'

// Kakao API Service (Firebase 의존성 없음, services/ → lib/services/ 이동)
export { searchBookByIsbn, searchBookByTitle, type BookSearchResult } from './kakaoApi'

// Search History Service (localStorage 기반, Firebase 의존성 없음)
export { SearchHistoryService, type SearchHistory } from './searchHistoryService'

// View Count Service (Phase 2-2: 게시물 조회수)
export { ViewCountService } from './viewCountService'

// Reading Log Service (Phase 3-1: 독서 로그)
export {
  ReadingLogService,
  type ReadingLog,
  type ReadingStatus,
  type ReadingStats,
} from './readingLogService'

// Comment Service (BL-117: 대댓글 서비스 레이어)
export {
  CommentService,
  type CommentWithReplies,
  type CommentAuthor,
} from './commentService'

// Post Service (BL-163: 게시물 CRUD 서비스 레이어)
export { PostService } from './postService'
