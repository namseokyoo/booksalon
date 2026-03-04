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

## [1.0.x] - 2026-03-04 (PR #4~#6: UI/UX 긴급 개선)

### Fixed (PR #4 — U01~U20, 커밋 05b10ea, DEC-116)
- **U01 LoginModal**: visible 레이블 추가, 제목 "로그인", disabled 패턴 적용
- **U02 SignUpModal**: 4개 visible 레이블, disabled 패턴
- **U03 SearchModal**: 게시글/댓글 클릭 시 포럼 이동 핵심 버그 수정, max-h dvh 적용
- **U04 PostDetail**: 댓글 입력창 sticky 하단 고정, 삭제 인라인 확인 UI
- **U05 PostItem**: 이메일 원문 노출 → split('@')[0] 마스킹
- **U06 Header**: 벨 아이콘 헤더 직접 노출, 검색 터치 영역 확대
- **U07 BookInfo**: text-base 적용, 비로그인 로그인 버튼 추가
- **U08 CommentItem**: 터치 영역 확대, bg-cta 토큰, 아이콘 크기 조정
- **U09 FilterPanel**: bg-primary 토큰, 패딩 개선
- **U10 ActivityFeed**: 이모지 aria-hidden+sr-only 접근성 처리, 탭 패딩
- **U11 ForumView**: FAB 비로그인 → 로그인 유도로 전환
- **U12 ChatComponent**: text-muted-foreground 적용, 이메일 제거
- **U13 RatingModal**: 인라인 에러 UI, rounded-xl, 별 48dp 터치 영역
- **U14 ImageGallery**: 닫기 버튼 48dp, alt 한국어 변경
- **U15 CreateForumModal**: 제목 "새 살롱 만들기"로 변경
- **U16 NotificationComponent**: 알림 클릭 → 콘텐츠 이동 기능, SVG 벨 아이콘
- **U17 ChatList**: border-surface 토큰, Supabase realtime 구독 적용
- **U18 UserProfilePreview**: 이메일 제거, 팔로우 버튼 구현
- **U19 ProfilePage**: 탭 그라데이션 힌트, 다크모드, 계정삭제 2단계 확인
- **U20 CreatePostModal**: visible 레이블, resize-y textarea

### Fixed (PR #5 — alert() 전체 교체, 커밋 ab539a5, DEC-117)
- alert() 0건 달성: 10개 컴포넌트 전체 alert()/window.confirm() → 인라인 에러/성공/확인 UI 교체
  - PostDetail(4건), ForumView(2건), PostItem(3건), CommentItem(3건+confirm), ForumList(2건)
  - ReportModal(2건), ImageUploader(2건), UserMenu(3건), BookInfo(2건), ProfilePage(1건)

### Fixed (PR #6 — 살롱 화면 레이아웃 긴급 수정, DEC-118)
- ForumView: sticky 완전 제거 → 전체 페이지 스크롤 방식
- BookInfo: "평점 남기기" 숨김, 독서상태 카드 하단 배치, gap-4 이미지 간격
- 도서 정보/글 목록 너비 통일

## [Unreleased]

### Planned
- 검색 섹션별 페이지네이션 (살롱/게시글/댓글)
- 반응형 디자인 고도화
- 성능 최적화
