# 북살롱 v0.3.0 개발 플랜 - 핵심 기능 강화

## 문서 정보

| 항목 | 내용 |
|------|------|
| **버전** | 0.3.0 |
| **작성일** | 2026-02-05 |
| **작성자** | Fullstack Dev |
| **기간** | 3주 (개발 2주 + QA/버퍼 1주) |
| **상태** | 예정 |

---

## 1. 개요

### 1.1 버전 목표

v0.3.0은 북살롱의 **핵심 기능 강화** 버전으로, PRD에서 정의한 P0 우선순위 기능들을 구현합니다.

**핵심 가치**: 사용자가 원하는 콘텐츠를 빠르게 찾고, 더 풍부한 방식으로 참여할 수 있도록 합니다.

### 1.2 주요 기능

| 기능 | 우선순위 | 설명 |
|------|----------|------|
| **태그 시스템** | P0 | 살롱/게시물에 태그 추가, 태그 기반 검색 |
| **검색 개선** | P0 | 자동완성, 검색어 하이라이트, 검색 히스토리 |
| **이미지 업로드** | P0 | 게시물/프로필에 이미지 첨부 |
| **평점 시스템** | P0 | 책/살롱에 별점 평가 (UI 완성) |

### 1.3 현재 상태 분석

**기존 구현 현황**:
- `filterService.ts`: 카테고리/태그 필터링 로직 일부 존재
- `searchService.ts`: 기본 검색 MVP 구현 (클라이언트 사이드 필터링)
- `profileImageService.ts`: 프로필 이미지 업로드 구현 완료
- `ratingService.ts`: 평점 서비스 백엔드 로직 구현 완료
- `types.ts`: Forum 타입에 tags, averageRating 필드 정의됨

**필요한 작업**:
- 태그 시스템 UI 및 사용자 태그 입력 기능
- searchText 필드 도입 및 검색 성능 개선
- 게시물 이미지 업로드 기능 추가
- 평점 UI 컴포넌트 및 연동

---

## 2. 기능별 상세 명세

### 2.1 태그 시스템

#### 2.1.1 요구사항 상세

**기능 요구사항**:
- FR-TAG-01: 살롱 생성 시 태그 추가 가능 (최대 5개)
- FR-TAG-02: 게시물 작성 시 태그 추가 가능 (최대 3개)
- FR-TAG-03: 태그 클릭 시 해당 태그가 포함된 콘텐츠 목록 표시
- FR-TAG-04: 인기 태그 목록 표시 (상위 10개)
- FR-TAG-05: 태그 입력 시 자동완성 제안

**비기능 요구사항**:
- NFR-TAG-01: 태그 자동완성 응답 시간 < 200ms
- NFR-TAG-02: 태그 1개당 최대 20자 제한

#### 2.1.2 UI/UX 설계

```
[ 태그 입력 UI ]
┌──────────────────────────────────────────┐
│ 태그:                                    │
│ ┌──────────────────────────────────────┐ │
│ │ [독서토론] [베스트셀러] [+]           │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ 추천 태그:                               │
│ [고전] [신작] [추천도서] [서평] [분석]  │
└──────────────────────────────────────────┘

[ 태그 표시 UI - 살롱 카드 ]
┌──────────────────────────────────────────┐
│ 📚 데미안                                │
│ 헤르만 헤세 저                           │
│                                          │
│ [고전] [문학] [성장소설]                 │
│                                          │
│ ⭐ 4.5 (23) · 💬 45개 게시물             │
└──────────────────────────────────────────┘
```

#### 2.1.3 데이터 모델 (Firestore)

**컬렉션 구조**:
```
forums/{isbn}
├── tags: string[]              // 살롱 태그 (최대 5개)
├── book: { ... }
└── posts/{postId}
    └── tags: string[]          // 게시물 태그 (최대 3개)

tags (새 컬렉션)
└── {tagName}
    ├── name: string            // 태그 이름
    ├── count: number           // 사용 횟수
    ├── type: 'forum' | 'post'  // 태그 타입
    └── lastUsedAt: Timestamp   // 마지막 사용 시간
```

**types.ts 확장**:
```typescript
// 기존 Forum 타입에 이미 tags?: string[] 존재

// Post 타입 확장
export interface Post {
  // ... 기존 필드
  tags?: string[];              // 추가
  searchText?: string;          // 추가 (검색 최적화)
}

// 태그 통계 타입 추가
export interface TagStats {
  name: string;
  count: number;
  type: 'forum' | 'post';
  lastUsedAt: any;
}
```

#### 2.1.4 구현 방안

**1. 서비스 레이어** (`services/tagService.ts` 신규)
```typescript
export class TagService {
  // 인기 태그 조회 (캐싱 적용)
  static async getPopularTags(type: 'forum' | 'post', limit: number): Promise<string[]>

  // 태그 자동완성 (prefix 검색)
  static async searchTags(prefix: string, type: 'forum' | 'post'): Promise<string[]>

  // 태그 사용 횟수 업데이트
  static async incrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void>

  // 태그로 살롱/게시물 검색
  static async getForumsByTag(tagName: string): Promise<Forum[]>
  static async getPostsByTag(tagName: string): Promise<Post[]>
}
```

**2. UI 컴포넌트** (`components/TagInput.tsx` 신규)
- 태그 입력 인풋 (칩 형태)
- 자동완성 드롭다운
- 추천 태그 표시
- 태그 제거 기능

**3. 기존 컴포넌트 수정**:
- `CreateForumModal.tsx`: 태그 입력 UI 추가
- `CreatePostModal.tsx`: 태그 입력 UI 추가
- `ForumList.tsx`: 태그 필터 UI 강화
- `PostItem.tsx`: 태그 표시 추가

---

### 2.2 검색 개선

#### 2.2.1 요구사항 상세

**기능 요구사항**:
- FR-SEARCH-01: searchText 필드 기반 전체 텍스트 검색
- FR-SEARCH-02: 검색어 입력 시 자동완성 (최근 검색어 + 인기 검색어)
- FR-SEARCH-03: 검색 결과에서 검색어 하이라이트
- FR-SEARCH-04: 검색 히스토리 저장 및 관리 (최근 10개)
- FR-SEARCH-05: 검색 결과 섹션별 "더 보기" 기능

**비기능 요구사항**:
- NFR-SEARCH-01: 검색 응답 시간 < 500ms
- NFR-SEARCH-02: 자동완성 응답 시간 < 200ms
- NFR-SEARCH-03: 검색 히스토리는 로컬 스토리지 저장

#### 2.2.2 UI/UX 설계

```
[ 검색 자동완성 ]
┌──────────────────────────────────────────┐
│ 🔍 데미안                                │
├──────────────────────────────────────────┤
│ 최근 검색                                │
│   데미안 헤세                            │
│   노르웨이의 숲                          │
│                                          │
│ 추천 검색어                              │
│   데미안 독후감                          │
│   데미안 줄거리                          │
│   데미안 명언                            │
└──────────────────────────────────────────┘

[ 검색 결과 하이라이트 ]
┌──────────────────────────────────────────┐
│ 📚 살롱 (3)                              │
│ ┌────────────────────────────────────┐   │
│ │ **데미안** - 헤르만 헤세            │   │
│ │ 성장 소설의 고전, **데미안**을 함께 │   │
│ └────────────────────────────────────┘   │
│                                          │
│ 📝 게시물 (12)                           │
│ ┌────────────────────────────────────┐   │
│ │ "**데미안**을 읽고 느낀 점"         │   │
│ │ 싱클레어의 성장 과정이 인상적...    │   │
│ └────────────────────────────────────┘   │
│                             [더 보기 →] │
└──────────────────────────────────────────┘
```

#### 2.2.3 데이터 모델

**searchText 필드 추가**:
```
forums/{isbn}/posts/{postId}
├── title: string
├── content: string
├── searchText: string    // 신규: title + content + author.email (소문자)
└── ...

forums/{isbn}/posts/{postId}/comments/{commentId}
├── content: string
├── searchText: string    // 신규: content + author.email (소문자)
└── ...
```

**로컬 스토리지 구조**:
```typescript
interface SearchHistory {
  term: string;
  timestamp: number;
}

// localStorage key: 'booksalon_search_history'
// 값: SearchHistory[] (최대 10개)
```

#### 2.2.4 구현 방안

**1. 서비스 레이어 확장** (`services/searchService.ts` 수정)
```typescript
export class SearchService {
  // 기존 메서드 개선
  static async searchAll(term: string): Promise<CommunitySearchResult>

  // 신규 메서드
  static async getPopularSearchTerms(): Promise<string[]>
  static highlightText(text: string, term: string): string

  // searchText 필드 생성 유틸
  static generateSearchText(title: string, content: string, authorEmail: string): string
}

// 검색 히스토리 관리 (로컬)
export class SearchHistoryService {
  static getHistory(): SearchHistory[]
  static addToHistory(term: string): void
  static clearHistory(): void
  static removeFromHistory(term: string): void
}
```

**2. UI 컴포넌트** (`components/SearchModal.tsx` 수정)
- 자동완성 드롭다운 추가
- 검색 결과 하이라이트 적용
- 섹션별 "더 보기" 버튼
- 검색 히스토리 표시/관리

**3. Migration Script** (기존 데이터 업데이트)
- 기존 게시물/댓글에 searchText 필드 추가
- Cloud Functions 또는 일회성 스크립트로 실행

---

### 2.3 이미지 업로드

#### 2.3.1 요구사항 상세

**기능 요구사항**:
- FR-IMG-01: 게시물 작성 시 이미지 첨부 가능 (최대 3장)
- FR-IMG-02: 이미지 미리보기 및 삭제
- FR-IMG-03: 이미지 클릭 시 라이트박스 뷰어
- FR-IMG-04: 이미지 자동 최적화 (리사이즈, 압축)

**비기능 요구사항**:
- NFR-IMG-01: 이미지 당 최대 5MB
- NFR-IMG-02: 지원 포맷: JPG, PNG, GIF, WebP
- NFR-IMG-03: 업로드 후 이미지 크기 최대 1200px (긴 변 기준)
- NFR-IMG-04: 업로드 진행률 표시

#### 2.3.2 UI/UX 설계

```
[ 게시물 작성 - 이미지 업로드 ]
┌──────────────────────────────────────────┐
│ 이미지 (최대 3장)                        │
│                                          │
│ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │  📷  │ │  📷  │ │  ➕  │              │
│ │ img1 │ │ img2 │ │ 추가  │              │
│ │  ❌  │ │  ❌  │ │      │              │
│ └──────┘ └──────┘ └──────┘              │
│                                          │
│ 업로드 중... [████████░░] 80%           │
└──────────────────────────────────────────┘

[ 게시물 상세 - 이미지 갤러리 ]
┌──────────────────────────────────────────┐
│ ┌────────────────────────────────────┐   │
│ │                                    │   │
│ │           [메인 이미지]            │   │
│ │                                    │   │
│ └────────────────────────────────────┘   │
│                                          │
│    [썸네일1] [썸네일2] [썸네일3]         │
└──────────────────────────────────────────┘
```

#### 2.3.3 데이터 모델

**Post 타입 확장**:
```typescript
export interface Post {
  // ... 기존 필드
  images?: PostImage[];     // 추가
}

export interface PostImage {
  id: string;               // 고유 ID
  url: string;              // Firebase Storage URL
  thumbnailUrl?: string;    // 썸네일 URL (선택)
  width: number;            // 원본 너비
  height: number;           // 원본 높이
  order: number;            // 표시 순서
}
```

**Firebase Storage 구조**:
```
post-images/
└── {forumId}/
    └── {postId}/
        └── {imageId}.jpg
```

#### 2.3.4 구현 방안

**1. 서비스 레이어** (`services/postImageService.ts` 신규)
```typescript
export class PostImageService {
  // 이미지 업로드 (최적화 포함)
  static async uploadImage(
    forumId: string,
    postId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<PostImage>

  // 이미지 삭제
  static async deleteImage(imageUrl: string): Promise<void>

  // 이미지 최적화 (기존 profileImageService 로직 재사용)
  static async optimizeImage(file: File): Promise<File>
}
```

**2. UI 컴포넌트**
- `components/ImageUploader.tsx` (신규): 이미지 업로드 UI
- `components/ImageGallery.tsx` (신규): 이미지 갤러리/라이트박스
- `components/CreatePostModal.tsx` 수정: ImageUploader 통합
- `components/PostDetail.tsx` 수정: ImageGallery 통합

**3. Storage Rules 업데이트** (`storage.rules`)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 기존 프로필 이미지 규칙
    match /profile-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 게시물 이미지 규칙 (신규)
    match /post-images/{forumId}/{postId}/{imageId} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

### 2.4 평점 시스템

#### 2.4.1 요구사항 상세

**기능 요구사항**:
- FR-RATE-01: 살롱(책)에 1-5점 별점 평가
- FR-RATE-02: 본인 평점 수정/삭제 가능
- FR-RATE-03: 평균 평점 및 평가자 수 표시
- FR-RATE-04: 별점 분포 차트 표시 (선택)

**비기능 요구사항**:
- NFR-RATE-01: 평점 저장/조회 응답 시간 < 200ms
- NFR-RATE-02: 평균 평점은 소수점 1자리까지 표시

#### 2.4.2 UI/UX 설계

```
[ 평점 입력 UI ]
┌──────────────────────────────────────────┐
│ 이 책을 평가해주세요                     │
│                                          │
│     ☆  ☆  ★  ★  ★                       │
│           3 / 5                          │
│                                          │
│ [평가하기]                               │
└──────────────────────────────────────────┘

[ 평점 표시 UI - 살롱 헤더 ]
┌──────────────────────────────────────────┐
│ 📚 데미안                                │
│ 헤르만 헤세 저                           │
│                                          │
│ ★★★★☆ 4.2 (156명 평가)                  │
│                                          │
│ 5점 ████████████████ 80                  │
│ 4점 ████████░░░░░░░░ 42                  │
│ 3점 ████░░░░░░░░░░░░ 20                  │
│ 2점 ██░░░░░░░░░░░░░░ 10                  │
│ 1점 █░░░░░░░░░░░░░░░ 4                   │
└──────────────────────────────────────────┘
```

#### 2.4.3 데이터 모델

**기존 구현 확인** (ratingService.ts):
- `ratings` 컬렉션에 `{bookIsbn}_{userId}` 형태로 저장
- Forum의 `averageRating`, `totalRatings` 필드 업데이트
- 기본 로직 구현 완료

**추가 필요 사항**:
```typescript
// 평점 분포 조회를 위한 캐시 (선택적)
export interface RatingDistribution {
  [rating: number]: number;  // 1-5점별 개수
}
```

#### 2.4.4 구현 방안

**1. 서비스 레이어 확장** (`services/ratingService.ts` 수정)
```typescript
export class RatingService {
  // 기존 메서드 (이미 구현됨)
  static async setUserRating(bookIsbn: string, userId: string, rating: number): Promise<void>
  static async getUserRating(bookIsbn: string, userId: string): Promise<number | null>
  static async getAverageRating(bookIsbn: string): Promise<{ average: number; total: number }>

  // 신규 메서드
  static async getRatingDistribution(bookIsbn: string): Promise<RatingDistribution>
}
```

**2. UI 컴포넌트**
- `components/StarRating.tsx` (신규): 별점 입력/표시 컴포넌트
- `components/RatingDistribution.tsx` (신규): 평점 분포 차트
- `components/ForumView.tsx` 수정: 평점 UI 통합
- `components/ForumList.tsx` 수정: 평점 표시 추가

---

## 3. 주차별 일정

### Week 1: 태그 시스템 + 검색 개선

| 일차 | 작업 내용 | 산출물 |
|------|----------|--------|
| Day 1 | 태그 시스템 설계 및 DB 스키마 | tagService.ts, types.ts 확장 |
| Day 2 | TagInput 컴포넌트 구현 | TagInput.tsx |
| Day 3 | 살롱/게시물 생성 모달에 태그 통합 | CreateForumModal, CreatePostModal 수정 |
| Day 4 | 검색 개선 - searchText 필드 도입 | searchService.ts 확장 |
| Day 5 | 검색 자동완성 및 히스토리 구현 | SearchHistoryService, SearchModal 수정 |

### Week 2: 이미지 업로드 + 평점 시스템

| 일차 | 작업 내용 | 산출물 |
|------|----------|--------|
| Day 1 | 이미지 업로드 서비스 구현 | postImageService.ts |
| Day 2 | ImageUploader 컴포넌트 구현 | ImageUploader.tsx |
| Day 3 | ImageGallery/라이트박스 구현 | ImageGallery.tsx |
| Day 4 | 평점 UI 컴포넌트 구현 | StarRating.tsx, RatingDistribution.tsx |
| Day 5 | 평점 시스템 통합 및 테스트 | ForumView, ForumList 수정 |

### Week 3: 통합 테스트 + QA + 버그 수정

| 일차 | 작업 내용 | 산출물 |
|------|----------|--------|
| Day 1-2 | 전체 기능 통합 테스트 | 테스트 시나리오, 버그 리포트 |
| Day 3-4 | QA Engineer 검증 | QA 리포트 |
| Day 5 | 버그 수정 및 최종 확인 | 수정 완료 |

---

## 4. 작업 목록 (Tasks)

### 4.1 태그 시스템

- [ ] `types.ts`에 TagStats 타입 추가
- [ ] `services/tagService.ts` 신규 생성
  - [ ] getPopularTags() 구현
  - [ ] searchTags() 자동완성 구현
  - [ ] incrementTagCount() 구현
  - [ ] getForumsByTag() 구현
  - [ ] getPostsByTag() 구현
- [ ] `components/TagInput.tsx` 신규 생성
  - [ ] 태그 입력 칩 UI
  - [ ] 자동완성 드롭다운
  - [ ] 추천 태그 표시
  - [ ] 태그 제거 기능
- [ ] `components/CreateForumModal.tsx` 수정
  - [ ] TagInput 컴포넌트 통합
  - [ ] 태그 저장 로직 추가
- [ ] `components/CreatePostModal.tsx` 수정
  - [ ] TagInput 컴포넌트 통합
  - [ ] 태그 저장 로직 추가
- [ ] `components/ForumList.tsx` 수정
  - [ ] 태그 필터 UI 강화
  - [ ] 인기 태그 표시
- [ ] `components/PostItem.tsx` 수정
  - [ ] 태그 표시 추가
- [ ] Firestore 인덱스 설정 (태그 쿼리용)

### 4.2 검색 개선

- [ ] `types.ts`에 SearchHistory 타입 추가
- [ ] `services/searchService.ts` 확장
  - [ ] generateSearchText() 유틸 구현
  - [ ] highlightText() 구현
  - [ ] getPopularSearchTerms() 구현
- [ ] `services/searchHistoryService.ts` 신규 생성
  - [ ] getHistory() 구현
  - [ ] addToHistory() 구현
  - [ ] clearHistory() 구현
  - [ ] removeFromHistory() 구현
- [ ] `components/SearchModal.tsx` 수정
  - [ ] 자동완성 드롭다운 추가
  - [ ] 검색 히스토리 표시
  - [ ] 검색 결과 하이라이트 적용
  - [ ] 섹션별 "더 보기" 버튼
- [ ] 기존 게시물/댓글 searchText 마이그레이션 스크립트

### 4.3 이미지 업로드

- [ ] `types.ts`에 PostImage 타입 추가
- [ ] `services/postImageService.ts` 신규 생성
  - [ ] uploadImage() 구현 (진행률 콜백 포함)
  - [ ] deleteImage() 구현
  - [ ] optimizeImage() 구현 (profileImageService 참조)
- [ ] `components/ImageUploader.tsx` 신규 생성
  - [ ] 드래그 앤 드롭 지원
  - [ ] 이미지 미리보기
  - [ ] 업로드 진행률 표시
  - [ ] 이미지 삭제 기능
- [ ] `components/ImageGallery.tsx` 신규 생성
  - [ ] 이미지 갤러리 표시
  - [ ] 라이트박스 뷰어
  - [ ] 썸네일 네비게이션
- [ ] `components/CreatePostModal.tsx` 수정
  - [ ] ImageUploader 통합
  - [ ] 이미지 URL 저장 로직
- [ ] `components/PostDetail.tsx` 수정
  - [ ] ImageGallery 통합
- [ ] `storage.rules` 업데이트

### 4.4 평점 시스템

- [ ] `types.ts`에 RatingDistribution 타입 추가
- [ ] `services/ratingService.ts` 확장
  - [ ] getRatingDistribution() 구현
- [ ] `components/StarRating.tsx` 신규 생성
  - [ ] 별점 입력 UI
  - [ ] 별점 표시 UI
  - [ ] 호버 효과
- [ ] `components/RatingDistribution.tsx` 신규 생성
  - [ ] 평점 분포 차트
- [ ] `components/ForumView.tsx` 수정
  - [ ] StarRating 통합
  - [ ] RatingDistribution 통합
- [ ] `components/ForumList.tsx` 수정
  - [ ] 살롱 카드에 평점 표시

### 4.5 공통

- [ ] 전체 기능 통합 테스트
- [ ] QA 검증 요청
- [ ] 버그 수정
- [ ] 문서 업데이트 (CHANGELOG.md)

---

## 5. 기술적 고려사항

### 5.1 Firebase Storage 설정

**이미지 업로드 규칙**:
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 이미지
    match /profile-images/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // 게시물 이미지
    match /post-images/{forumId}/{postId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 5.2 Firestore 인덱스

**필요한 복합 인덱스**:
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "searchText", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "forums",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "lastActivityAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ratings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "bookIsbn", "order": "ASCENDING" },
        { "fieldPath": "rating", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 5.3 성능 최적화

**이미지 최적화**:
- 클라이언트 사이드 리사이즈 (최대 1200px)
- JPEG 품질 80% 압축
- WebP 포맷 지원 (브라우저 지원 시)

**검색 최적화**:
- searchText 필드로 서버 사이드 필터링
- 결과 캐싱 (React Query 도입 검토)
- 디바운스 적용 (300ms)

**태그 최적화**:
- 인기 태그 캐싱 (5분)
- 자동완성 결과 캐싱

### 5.4 의존성 추가 (선택)

```json
// package.json 추가 검토
{
  "dependencies": {
    "react-image-lightbox": "^5.1.4",  // 라이트박스 (또는 자체 구현)
  }
}
```

---

## 6. 완료 기준 (Definition of Done)

### 6.1 태그 시스템

- [ ] 살롱 생성 시 최대 5개 태그 추가 가능
- [ ] 게시물 작성 시 최대 3개 태그 추가 가능
- [ ] 태그 클릭 시 해당 태그 포함 콘텐츠 필터링
- [ ] 인기 태그 10개 표시
- [ ] 태그 자동완성 동작 (200ms 이내 응답)

### 6.2 검색 개선

- [ ] searchText 기반 검색 동작
- [ ] 자동완성 동작 (최근 검색어 + 인기 검색어)
- [ ] 검색 결과 하이라이트 표시
- [ ] 검색 히스토리 저장/삭제 동작
- [ ] 검색 응답 시간 500ms 이내

### 6.3 이미지 업로드

- [ ] 게시물당 최대 3장 이미지 업로드 가능
- [ ] 이미지 미리보기 동작
- [ ] 이미지 삭제 동작
- [ ] 라이트박스 뷰어 동작
- [ ] 이미지 자동 최적화 (1200px 이하)

### 6.4 평점 시스템

- [ ] 1-5점 별점 입력 가능
- [ ] 본인 평점 수정/삭제 가능
- [ ] 평균 평점 및 평가자 수 표시
- [ ] 평점 분포 차트 표시

### 6.5 공통

- [ ] 모든 기능 모바일 반응형 동작
- [ ] 빌드 성공 (npm run build)
- [ ] 타입 에러 없음
- [ ] 콘솔 에러 없음
- [ ] QA 승인

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 가능성 | 대응 방안 |
|--------|------|--------|----------|
| 이미지 업로드 용량 초과 | 높음 | 중간 | Storage 사용량 모니터링, 용량 제한 강화 |
| 검색 성능 저하 | 중간 | 중간 | 인덱스 최적화, 결과 제한, 캐싱 |
| 태그 스팸 | 낮음 | 낮음 | 태그 개수 제한, 관리자 모니터링 |
| 일정 지연 | 중간 | 중간 | 버퍼 기간 활용, 기능 우선순위 조정 |

---

## 8. 참고 문서

- PRD: `/docs/PRD.md`
- 경쟁사 분석: `/COMPETITIVE_ANALYSIS.md`
- 기존 개발 가이드: `/CONTINUATION_GUIDE.md`
- 향후 개선사항: `/FUTURE_IMPROVEMENTS.md`

---

*작성: Fullstack Dev | 2026-02-05*
