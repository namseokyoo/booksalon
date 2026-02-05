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
