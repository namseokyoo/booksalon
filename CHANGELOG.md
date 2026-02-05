# Changelog

모든 주요 변경사항은 이 파일에 기록됩니다.

형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.0.0/)를 따르며,
이 프로젝트는 [Semantic Versioning](https://semver.org/lang/ko/)을 준수합니다.

## [0.1.0] - 2026-01-21

### Added
- 라이트 테마 UI 시스템 구축
- Stitch를 활용한 디자인 시스템 정의
- 북커뮤니티 느낌의 세련된 UI 디자인
- 주요 컴포넌트 라이트 테마 전환:
  - Header, ForumList, ForumView, PostDetail
  - MessagingPage, ProfilePage
  - LoginModal, SignUpModal, CreatePostModal, CreateForumModal
  - AdminDashboard

### Changed
- 다크 모드에서 라이트 테마로 전체 전환
- 디자인 시스템 통일 (cyan-600 primary, gray-50 배경)
- 카드 스타일 개선 (rounded-xl, shadow-sm)
- 타이포그래피 및 간격 시스템 정리

### Fixed
- UI 일관성 개선
- 접근성 향상 (색상 대비, 포커스 상태)

## [0.2.0] - 2026-01-22

### Added
- 통합 검색 모달 컴포넌트 (`SearchModal.tsx`)
  - 책 검색 및 커뮤니티 검색 통합
  - 헤더에 검색 버튼 추가
  - 검색 결과 타입별 분리 표시 (살롱/게시글/댓글)
- 필터 UI 개선
  - 접을 수 있는 형태로 변경 (모바일 최적화)
  - 활성 필터 표시 및 초기화 기능
  - 카테고리, 태그, 정렬 섹션별 구분
- 향후 개선 사항 문서 (`FUTURE_IMPROVEMENTS.md`)
  - 검색 기능 개선 계획
  - 필터 UX 개선 계획
  - 성능 최적화 계획

### Changed
- 필터 UI를 컴팩트한 접기/펼치기 형태로 변경
- ForumList에서 커뮤니티 검색 섹션 제거 (모달로 통합)
- 검색 서비스 개선
  - collectionGroup 대신 각 포럼 순회 방식으로 변경 (권한 문제 해결)
  - 성능 최적화 (최대 10개 포럼, 각 30개 게시물 검색)

### Fixed
- Firestore collectionGroup 쿼리 권한 문제 해결
- 검색 모달에서 스피닝 무한 로딩 문제 수정
- 정의되지 않은 변수 제거 (`setExistingForums`, `existingForums`)

## [0.3.0] - 2026-02-05

### Added
- 태그 시스템: 살롱/게시물에 태그 추가, 태그 기반 검색
- 검색 개선: 자동완성, 검색어 하이라이트, 검색 히스토리
- 이미지 업로드: 게시물에 최대 3장 이미지 첨부, 라이트박스 뷰어
- 평점 시스템: 별점 입력/표시, 평점 분포 차트

### Changed
- 검색 성능 개선: 포럼 검색 범위 확대 (10→100), searchText 필드 최적화
- 태그 DB 관리 개선: 미사용 태그 자동 정리

### New Components
- TagInput, TagList, TagBadge
- ImageUploader, ImageGallery
- SearchSuggestions, HighlightText
- StarRating, RatingModal, RatingDistribution

## [0.4.0] - 2026-02-06

### Changed - Major Migration (Firebase → Supabase)
이번 버전은 백엔드를 Firebase에서 Supabase로 마이그레이션하는 메이저 업데이트입니다.

#### Authentication
- Firebase Auth → Supabase Auth로 전환
- `AuthContext.tsx`를 Supabase 브릿지로 변경 (기존 호환성 유지)
- `SupabaseAuthContext.tsx` 신규 추가 (권장 사용 방식)
- 카카오/구글 OAuth 지원 유지
- Firebase 호환 User 인터페이스 (`uid` 프로퍼티) 추가

#### Database Services
- PostgreSQL 스키마 설계 및 타입 정의 (`lib/database.types.ts`)
- Supabase 클라이언트 설정 (`lib/supabase.ts`)
- 서비스 레이어 Supabase 마이그레이션:
  - UserService (사용자 프로필)
  - BookmarkService (북마크)
  - RatingService (평점)
  - TagService (태그)
  - SearchService (검색)
  - SocialService (소셜 활동)
  - ProfileImageService (프로필 이미지)
  - PostImageService (게시물 이미지)

#### Configuration
- 환경 변수 전환 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- `.env.example` 업데이트 (Supabase 우선, Firebase deprecated)
- `index.tsx` Supabase 설정 안내 화면 추가

### Added
- `lib/services/index.ts` - 통합 서비스 export
- `UserService.incrementStat()` / `decrementStat()` - 사용자 통계 업데이트

### Deprecated
- `services/firebase.ts` - 점진적 마이그레이션 완료 후 삭제 예정
- Firebase 환경 변수 (VITE_FIREBASE_*) - 주석 처리 권장

### Notes
- 일부 컴포넌트(ForumList, ForumView 등)는 아직 Firebase Firestore를 직접 사용
- 완전한 마이그레이션은 향후 버전에서 진행 예정
- Firebase 의존성은 rollback 대비로 유지

## [Unreleased]

### Planned
- 검색 섹션별 페이지네이션 (살롱/게시글/댓글)
- 다크 모드 토글 기능
- 반응형 디자인 개선
- 성능 최적화
- 컴포넌트 레벨 Supabase 완전 마이그레이션
- Firebase 의존성 완전 제거
