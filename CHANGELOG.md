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

## [Unreleased]

### Planned
- 검색 섹션별 페이지네이션 (살롱/게시글/댓글)
- 다크 모드 토글 기능
- 반응형 디자인 개선
- 성능 최적화
- 추가 기능 개발
