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
  type Forum as TagForum,
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
