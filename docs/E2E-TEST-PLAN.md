# 북살롱 E2E 테스트 플랜 (v1.0 출시 준비)

## 문서 정보

| 항목 | 내용 |
|------|------|
| **문서 버전** | 1.0.0 |
| **작성일** | 2026-03-09 |
| **작성자** | QA Engineer (해밀턴) |
| **대상 버전** | 북살롱 v0.5.1 → v1.0.0 |
| **테스트 도구** | Playwright (chromium) |
| **베이스 URL** | https://booksalon-nine.vercel.app |
| **테스트 경로** | `projects/booksalon/tests/e2e/` |

---

## 1. 테스트 전략

### 1.1 목적

북살롱 v1.0.0 정식 출시 전 전체 기능을 체계적으로 검증하여 프로덕션 서비스 품질을 보장한다. 개별 PR 단위의 부분 검증에서 벗어나 전체 기능 흐름(End-to-End)을 통합적으로 커버하는 테스트 기반을 구축한다.

### 1.2 테스트 범위

| 범위 | 포함 여부 | 비고 |
|------|----------|------|
| 비인증 사용자 플로우 | 포함 | 랜딩, 살롱 조회, 검색 |
| 인증 플로우 | 포함 | 이메일+비밀번호, Google OAuth UI |
| 핵심 CRUD 기능 | 포함 | 살롱/게시물/댓글 생성·조회·수정·삭제 |
| 소셜 기능 | 포함 | 좋아요, 북마크, 팔로우, 활동 피드 |
| 검색 및 필터링 | 포함 | 통합 검색, 카테고리 필터, 정렬 |
| 태그 시스템 | 포함 | 입력, 자동완성, 태그 기반 필터 |
| 이미지 업로드 | 포함 | 업로드, 라이트박스 |
| 평점 시스템 | 포함 | 입력, 분포 차트 |
| 독서 로그·배지 | 포함 | 상태 변경, 배지 표시 |
| 프로필 시스템 | 포함 | 조회, 수정, 이미지 업로드 |
| 메시징·알림 | 포함 | 메시지 목록, 알림 목록 접근 |
| 관리자 대시보드 | 포함 | 접근 권한 검증 |
| 반응형 (모바일) | 포함 | 375px 뷰포트 |
| 접근성 | 포함 | 키보드 네비게이션, ARIA |
| 성능 | 부분 포함 | 초기 로딩, 콘솔 에러 |
| Google OAuth 실제 인증 | 제외 | 외부 서비스 의존성 |
| 이메일 발송 | 제외 | 외부 서비스 의존성 |
| Supabase 내부 동작 | 제외 | DB 직접 검증은 별도 |

### 1.3 우선순위 정의

| 등급 | 정의 | 출시 판단 |
|------|------|----------|
| **P0 (Critical)** | 서비스의 핵심 플로우. 실패 시 배포 불가 | 100% 통과 필수 |
| **P1 (Major)** | 중요 기능. 실패 시 조건부 배포 검토 | 90% 이상 통과 |
| **P2 (Minor)** | 부가 기능. 실패 시 후속 수정으로 대응 가능 | 80% 이상 통과 |

### 1.4 접근법

1. **실환경 테스트 우선**: `https://booksalon-nine.vercel.app` 프로덕션 환경 대상
2. **비인증 → 인증 순서**: 비로그인 상태 검증 후 로그인 상태 검증
3. **happy path → edge case 순서**: 정상 플로우 검증 후 에러 케이스 검증
4. **코드 기반 정적 검증 병행**: 실제 DOM 조작이 어려운 로직은 코드 분석 검증 허용

---

## 2. 기존 테스트 커버리지 분석 및 갭 식별

### 2.1 기존 7개 스펙 분석

| 파일명 | 대상 기능 | 커버리지 수준 | 주요 이슈 |
|--------|----------|-------------|----------|
| `pr11-landing-ui.spec.ts` | 랜딩 UI (인기 게시물, 살롱 목록) | 충분 (17 TC) | 프로덕션 URL 대상, 양호 |
| `pr12-category-filter-backbutton.spec.ts` | 카테고리 필터, 뒤로가기 버튼 | 충분 (11 TC) | 프로덕션 URL 대상, 양호 |
| `pr14-nested-comments-qa.spec.ts` | 대댓글 시스템 | 부분 (20 TC, 절반 정적) | **로컬 localhost:4000 대상** — 재작성 필요 |
| `login-error.spec.ts` | 로그인 실패 에러 메시지 | 충분 (2 TC) | shared-state.json 의존성 |
| `delete-account.spec.ts` | 계정 삭제 | 불명 (파일 미열람) | shared-state.json 의존성 |
| `delete-account-reverify.spec.ts` | 계정 삭제 재검증 | 불명 (파일 미열람) | shared-state.json 의존성 |
| `ui-changes-qa.spec.ts` | CTA 색상, 검색 탭, 히어로 텍스트 | 충분 (4 TC) | 프로덕션 URL 대상, 양호 |

### 2.2 커버리지 갭 (기존 테스트에서 누락된 기능)

| 기능 영역 | 갭 설명 | 우선순위 |
|----------|--------|----------|
| **살롱 생성 CRUD** | 살롱 생성·조회 E2E 없음 | P0 |
| **게시물 CRUD** | 게시물 작성·수정·삭제 E2E 없음 | P0 |
| **댓글 CRUD (최상위)** | 댓글 작성·삭제 E2E 없음 (대댓글은 로컬 환경) | P0 |
| **이메일 회원가입** | 회원가입 플로우 E2E 없음 | P0 |
| **태그 시스템** | 태그 입력·자동완성 E2E 없음 | P0 |
| **이미지 업로드** | 업로드·라이트박스 E2E 없음 | P0 |
| **평점 시스템** | 별점 입력·분포 차트 E2E 없음 | P0 |
| **검색 (통합)** | 검색 모달 동작 E2E 없음 | P0 |
| **소셜 기능** | 좋아요·북마크·팔로우 E2E 없음 | P1 |
| **프로필 페이지** | 프로필 조회·수정 E2E 없음 | P1 |
| **독서 로그** | 읽는중/읽음/읽고싶음 상태 변경 E2E 없음 | P1 |
| **배지 시스템** | 배지 표시 E2E 없음 | P2 |
| **활동 피드** | 피드 표시 E2E 없음 | P1 |
| **메시징** | 메시지 목록 접근 E2E 없음 | P1 |
| **알림** | 알림 목록 접근 E2E 없음 | P2 |
| **관리자 대시보드** | 접근 권한 E2E 없음 | P1 |
| **비로그인 접근 제한** | 인증 필요 기능 리다이렉트 E2E 없음 | P0 |
| **페이지네이션** | 게시물 목록 페이지네이션 E2E 없음 | P1 |
| **스모크 테스트** | 전체 뷰 접근 가능성 통합 스모크 없음 | P0 |

### 2.3 기존 테스트 처리 방안

| 파일 | 처리 방안 | 이유 |
|------|----------|------|
| `pr11-landing-ui.spec.ts` | **유지** | 프로덕션 대상, 양호, 랜딩 UI 커버 |
| `pr12-category-filter-backbutton.spec.ts` | **유지** | 프로덕션 대상, 양호, 필터/네비게이션 커버 |
| `pr14-nested-comments-qa.spec.ts` | **리팩토링 필요** | localhost:4000 하드코딩 → 프로덕션 URL로 교체 필요 |
| `login-error.spec.ts` | **유지 + 통합 가능** | 로그인 에러 시나리오 커버, smoke 스위트에 통합 고려 |
| `delete-account.spec.ts` | **유지** | 계정 삭제 기능 전용 |
| `delete-account-reverify.spec.ts` | **유지** | 계정 삭제 재검증 전용 |
| `ui-changes-qa.spec.ts` | **유지** | UI 변경사항 회귀 검증 |

---

## 3. 테스트 스위트 구조 설계

### 3.1 파일 구조

```
tests/e2e/
├── smoke/
│   └── smoke.spec.ts                  # P0: 전체 뷰 접근·기본 렌더링 스모크
├── auth/
│   ├── login.spec.ts                  # P0: 로그인 성공·실패·소셜 UI
│   ├── signup.spec.ts                 # P0: 이메일 회원가입 플로우
│   └── account-management.spec.ts    # P1: 프로필 수정, 계정 삭제 통합
├── core/
│   ├── salon-crud.spec.ts             # P0: 살롱 생성·조회·목록
│   ├── post-crud.spec.ts              # P0: 게시물 작성·수정·삭제
│   └── comment-crud.spec.ts          # P0: 댓글·대댓글 CRUD (프로덕션 URL)
├── features/
│   ├── search.spec.ts                 # P0: 통합 검색 모달, 자동완성, 히스토리
│   ├── tag-system.spec.ts             # P0: 태그 입력, 자동완성, 필터링
│   ├── image-upload.spec.ts           # P0: 업로드, 미리보기, 라이트박스
│   ├── rating-system.spec.ts          # P0: 별점 입력, 분포 차트
│   ├── reading-log.spec.ts            # P1: 독서 로그 상태 변경, 배지
│   └── social.spec.ts                 # P1: 좋아요, 북마크, 팔로우, 활동 피드
├── navigation/
│   ├── views.spec.ts                  # P0: 뷰 전환 (list/forum/profile/etc.)
│   └── access-control.spec.ts        # P0: 비로그인 접근 제한 검증
├── profile/
│   └── profile.spec.ts               # P1: 프로필 조회·수정·이미지
├── messaging/
│   └── messaging-notifications.spec.ts  # P1: 메시지·알림 목록 접근
├── admin/
│   └── admin-access.spec.ts          # P1: 관리자 대시보드 접근 권한
├── responsive/
│   └── mobile.spec.ts                # P0: 375px 뷰포트 레이아웃 검증
├── accessibility/
│   └── keyboard-navigation.spec.ts   # P1: 키보드 네비게이션, 포커스 트랩
│
│ (기존 유지 파일)
├── pr11-landing-ui.spec.ts            # 유지 (랜딩 UI)
├── pr12-category-filter-backbutton.spec.ts  # 유지 (필터/뒤로가기)
├── pr14-nested-comments-qa.spec.ts    # 리팩토링 대상 (URL 수정)
├── login-error.spec.ts                # 유지
├── delete-account.spec.ts             # 유지
├── delete-account-reverify.spec.ts    # 유지
├── ui-changes-qa.spec.ts              # 유지
├── results/
│   └── test-results.json
└── screenshots/
```

### 3.2 스위트 그룹핑 및 실행 전략

| 그룹 | 포함 스위트 | 실행 조건 | 소요 시간 (예상) |
|------|-----------|----------|---------------|
| **Smoke** | smoke/ | 모든 배포 후 필수 | ~3분 |
| **Core** | auth/ + core/ | PR 머지 전 | ~10분 |
| **Features** | features/ + navigation/ | 정기 QA | ~15분 |
| **Full** | 전체 스위트 | v1.0 릴리즈 전 | ~30분 |

---

## 4. 테스트 시나리오 목록

> 형식: ID | 우선순위 | Given-When-Then

---

### 4.1 스모크 테스트 (`smoke/smoke.spec.ts`)

#### SC-SMOKE-01 | P0 | 랜딩 페이지 정상 로딩

```
Given: 브라우저가 https://booksalon-nine.vercel.app에 접속한다
When:  페이지가 로드된다
Then:
  - HTTP 200 응답
  - [data-testid="forum-list-loaded"] 요소 표시
  - console.error 0건 (네트워크 에러 제외)
  - 375px 뷰포트에서 가로 스크롤 없음
```

#### SC-SMOKE-02 | P0 | 모든 뷰(View) 접근 가능성 확인

```
Given: 랜딩 페이지가 로드된 상태
When:  각 네비게이션 요소를 통해 뷰를 전환한다
Then:
  - ForumList(list) → 살롱 목록 표시
  - ForumView(forum) → 살롱 카드 클릭 시 살롱 상세 표시
  - SearchModal(search) → 검색 아이콘 클릭 시 검색 모달 표시
  - 각 뷰 전환 후 콘솔 에러 0건
```

#### SC-SMOKE-03 | P0 | 핵심 UI 요소 렌더링 확인

```
Given: 랜딩 페이지 로드 완료 상태
When:  페이지 구성 요소를 확인한다
Then:
  - 헤더 (로고, 검색 버튼, 로그인/회원가입 버튼) 표시
  - 인기 게시물 섹션 표시 (데이터 있을 경우)
  - 최근 개설된 살롱 섹션 표시
  - 푸터 또는 페이지 하단 요소 표시
```

---

### 4.2 인증 테스트 (`auth/`)

#### SC-AUTH-01 | P0 | 이메일 로그인 성공

```
Given: 비로그인 상태로 랜딩 페이지에 접속
When:  헤더 "로그인" 버튼 클릭 → 유효한 이메일/비밀번호 입력 → 제출
Then:
  - 로그인 모달이 닫힘
  - 헤더에 프로필 아이콘 또는 사용자 메뉴 표시
  - "로그인"/"회원가입" 버튼이 사라짐
  - 콘솔 에러 0건
```

#### SC-AUTH-02 | P0 | 로그인 실패 에러 메시지

```
Given: 비로그인 상태로 로그인 모달이 열려 있음
When:  잘못된 이메일/비밀번호 입력 후 제출
Then:
  - 에러 메시지 "로그인에 실패했습니다" 포함 텍스트 표시
  - 로그인 모달이 닫히지 않고 유지
  - 입력 필드 초기화 없음 (또는 패스워드만 초기화)
```

#### SC-AUTH-03 | P0 | 로그아웃

```
Given: 로그인된 상태
When:  프로필 메뉴에서 "로그아웃" 클릭
Then:
  - 헤더에 "로그인"/"회원가입" 버튼 복귀
  - 로그인 필요 기능 비활성화
  - 랜딩 페이지 유지 (리다이렉트 없음)
```

#### SC-AUTH-04 | P0 | 회원가입 플로우

```
Given: 비로그인 상태로 랜딩 페이지에 접속
When:  헤더 "회원가입" 버튼 클릭 → 이메일/비밀번호/닉네임 입력 → "가입하기" 제출
Then:
  - 회원가입 성공 메시지 또는 자동 로그인
  - 성공 시 모달 닫힘
  - bg-cta 클래스 버튼으로 제출 가능
```

#### SC-AUTH-05 | P0 | 비로그인 접근 제한

```
Given: 비로그인 상태
When:  로그인 필요 기능(게시물 작성 버튼, 좋아요 버튼 클릭)을 시도
Then:
  - 로그인 모달이 표시되거나 로그인 요구 메시지 표시
  - 해당 작업이 수행되지 않음
```

#### SC-AUTH-06 | P1 | Google OAuth UI 표시

```
Given: 비로그인 상태로 로그인 모달이 열려 있음
When:  모달 내 구성 요소를 확인
Then:
  - "Google로 로그인" 버튼 표시
  - 버튼 클릭 시 외부 OAuth URL로 리다이렉트 시도 (실제 인증 미진행)
```

---

### 4.3 살롱 CRUD (`core/salon-crud.spec.ts`)

#### SC-SALON-01 | P0 | 살롱 목록 조회

```
Given: 랜딩 페이지 접속 상태
When:  페이지가 로드됨
Then:
  - 살롱 카드 목록 표시 (최소 1개 이상)
  - 각 카드에 책 제목, 게시물 수 표시
  - 북마크 버튼 표시 (비로그인 시 비활성 또는 로그인 유도)
```

#### SC-SALON-02 | P0 | 살롱 상세 진입

```
Given: 살롱 목록이 표시된 상태
When:  살롱 카드 클릭
Then:
  - ForumView로 전환
  - 책 제목, 살롱 정보 표시
  - 게시물 목록 표시 (없으면 빈 상태 메시지)
  - 평점 영역 표시
```

#### SC-SALON-03 | P0 | 살롱 생성 (로그인 필요)

```
Given: 로그인된 상태, 랜딩 페이지
When:  "새 살롱 만들기" 또는 상응하는 버튼 클릭
       → 도서 검색 → 책 선택 → 살롱 설명 입력 → 생성 제출
Then:
  - 새 살롱이 목록에 표시
  - 생성한 살롱으로 이동 또는 성공 메시지
```

#### SC-SALON-04 | P1 | 살롱 정렬 및 필터

```
Given: 모든 게시물 페이지 또는 살롱 목록
When:  정렬 드롭다운에서 "인기순", "최신순" 등 변경
Then:
  - 정렬 옵션에 따라 목록 순서 변경
  - 카테고리 필터 칩 클릭 시 해당 카테고리 게시물만 표시
```

---

### 4.4 게시물 CRUD (`core/post-crud.spec.ts`)

#### SC-POST-01 | P0 | 게시물 작성

```
Given: 로그인된 상태, 살롱 상세(ForumView) 진입
When:  "게시물 작성" 버튼 클릭 → 제목/내용 입력 → 제출
Then:
  - 새 게시물이 목록에 표시
  - 작성자 정보, 작성 시간 표시
  - 콘솔 에러 0건
```

#### SC-POST-02 | P0 | 게시물 상세 조회

```
Given: 살롱 내 게시물 목록이 표시된 상태
When:  게시물 클릭
Then:
  - PostDetail 뷰로 전환
  - 제목, 본문, 작성자, 작성 시간 표시
  - 조회수 증가 (즉시 또는 재진입 시)
  - 댓글 섹션 표시
```

#### SC-POST-03 | P0 | 게시물 수정

```
Given: 로그인된 상태, 본인 게시물 상세 페이지
When:  수정 버튼 클릭 → 내용 변경 → 저장
Then:
  - 수정된 내용이 즉시 반영
  - "수정됨" 표시 또는 업데이트 시간 표시
```

#### SC-POST-04 | P0 | 게시물 삭제

```
Given: 로그인된 상태, 본인 게시물 상세 페이지
When:  삭제 버튼 클릭 → 확인 다이얼로그 승인
Then:
  - 게시물이 목록에서 제거
  - 살롱 상세 페이지로 복귀
```

#### SC-POST-05 | P1 | 타인 게시물 수정/삭제 버튼 미표시

```
Given: 로그인된 상태, 타인의 게시물 상세 페이지
When:  게시물 상세를 조회
Then:
  - 수정/삭제 버튼이 표시되지 않음
  - 신고 버튼은 표시될 수 있음
```

---

### 4.5 댓글 시스템 (`core/comment-crud.spec.ts`)

#### SC-COMMENT-01 | P0 | 댓글 작성 (로그인 필요)

```
Given: 로그인된 상태, 게시물 상세(PostDetail) 진입
When:  댓글 입력창에 내용 입력 → 제출
Then:
  - 새 댓글이 목록에 즉시 표시
  - 작성자 이름, 작성 시간 표시
```

#### SC-COMMENT-02 | P0 | 비로그인 시 댓글 입력창 미표시

```
Given: 비로그인 상태, 게시물 상세 진입
When:  댓글 섹션을 확인
Then:
  - 댓글 목록은 표시 (읽기 가능)
  - 댓글 입력창 미표시 또는 로그인 유도 메시지 표시
```

#### SC-COMMENT-03 | P0 | 대댓글 작성

```
Given: 로그인된 상태, 댓글이 있는 게시물 상세
When:  최상위 댓글의 "답글" 버튼 클릭 → 내용 입력 → 등록
Then:
  - 대댓글이 해당 댓글 아래 인덴트(ml-4, border-l-2)로 표시
  - 대댓글에는 "답글" 버튼 미표시 (depth 1 강제)
```

#### SC-COMMENT-04 | P0 | 비로그인 시 답글 버튼 미표시

```
Given: 비로그인 상태, 댓글이 있는 게시물 상세
When:  댓글 목록을 확인
Then:
  - "답글" 버튼이 전혀 표시되지 않음
```

#### SC-COMMENT-05 | P1 | 댓글 삭제

```
Given: 로그인된 상태, 본인 댓글이 있는 게시물 상세
When:  댓글 삭제 버튼 클릭
Then:
  - 댓글이 목록에서 제거
  - 대댓글이 있는 경우 처리 방식 확인 (함께 삭제 또는 "삭제된 댓글" 표시)
```

---

### 4.6 검색 (`features/search.spec.ts`)

#### SC-SEARCH-01 | P0 | 통합 검색 모달 열기

```
Given: 랜딩 페이지 접속 상태
When:  헤더 검색 버튼(아이콘) 클릭
Then:
  - 검색 모달이 표시
  - "살롱 검색" 탭이 기본 선택 상태
  - "커뮤니티 검색" 탭이 아닌 "살롱 검색" 탭 표시
  - 검색 입력창에 포커스
```

#### SC-SEARCH-02 | P0 | 살롱 검색 결과 표시

```
Given: 검색 모달이 열린 상태
When:  검색어 입력 (예: "데미안")
Then:
  - 살롱 검색 결과 목록 표시
  - 검색어가 결과 텍스트에 하이라이트 표시
  - 결과 클릭 시 해당 살롱으로 이동
```

#### SC-SEARCH-03 | P0 | 검색 모달 닫기

```
Given: 검색 모달이 열린 상태
When:  ESC 키 입력 또는 X 버튼 클릭 또는 배경 클릭
Then:
  - 검색 모달이 닫힘
  - 이전 뷰(랜딩 페이지)가 표시
```

#### SC-SEARCH-04 | P1 | 검색 히스토리

```
Given: 이전에 검색한 기록이 있는 상태
When:  검색 모달을 다시 열고 빈 입력 상태 확인
Then:
  - "최근 검색" 섹션에 이전 검색어 표시
  - 개별 삭제(X 버튼) 동작
  - 전체 삭제 동작
```

#### SC-SEARCH-05 | P1 | 자동완성

```
Given: 검색 모달이 열린 상태
When:  검색어를 일부 입력
Then:
  - 300ms 이내 자동완성 드롭다운 표시
  - 드롭다운 항목 클릭 시 검색 실행
```

---

### 4.7 태그 시스템 (`features/tag-system.spec.ts`)

#### SC-TAG-01 | P0 | 게시물 작성 시 태그 입력

```
Given: 로그인된 상태, 게시물 작성 모달 열림
When:  태그 입력란에 텍스트 입력 후 Enter
Then:
  - 태그가 칩(chip) 형태로 표시
  - 최대 3개 제한 동작 (3개 초과 시 경고)
  - 칩의 X 버튼으로 태그 삭제 가능
```

#### SC-TAG-02 | P0 | 태그 자동완성

```
Given: 태그 입력란에 텍스트 입력 중
When:  기존 태그와 매칭되는 텍스트 입력
Then:
  - 자동완성 드롭다운 표시 (200ms 이내)
  - 드롭다운 항목 클릭 시 태그 추가
```

#### SC-TAG-03 | P1 | 태그 기반 필터링

```
Given: 살롱 목록 또는 게시물 목록 표시 상태
When:  태그 칩 클릭
Then:
  - 해당 태그를 가진 항목만 필터링
  - 필터 초기화 가능
```

---

### 4.8 이미지 업로드 (`features/image-upload.spec.ts`)

#### SC-IMG-01 | P0 | 이미지 업로드 (파일 선택)

```
Given: 로그인된 상태, 게시물 작성 모달 열림
When:  이미지 추가 버튼 클릭 → 이미지 파일 선택
Then:
  - 이미지 미리보기 표시
  - 삭제 버튼(X) 표시
  - 최대 3장 제한 동작
```

#### SC-IMG-02 | P0 | 이미지 라이트박스

```
Given: 이미지가 포함된 게시물 상세 페이지
When:  이미지 클릭
Then:
  - 전체 화면 라이트박스 표시
  - 좌우 화살표 또는 키보드 방향키로 이미지 탐색
  - ESC 키 또는 X 버튼으로 닫기
```

#### SC-IMG-03 | P1 | 잘못된 파일 형식 거부

```
Given: 게시물 작성 모달에서 이미지 추가 시도
When:  지원하지 않는 파일 형식(PDF 등) 선택
Then:
  - 에러 메시지 표시 (JPG/PNG/GIF/WebP만 지원)
  - 파일 업로드되지 않음
```

#### SC-IMG-04 | P1 | 5MB 초과 파일 거부

```
Given: 게시물 작성 모달에서 이미지 추가 시도
When:  5MB 초과 이미지 파일 선택
Then:
  - 파일 크기 제한 에러 메시지 표시
  - 파일 업로드되지 않음
```

---

### 4.9 평점 시스템 (`features/rating-system.spec.ts`)

#### SC-RATE-01 | P0 | 별점 입력

```
Given: 로그인된 상태, 살롱 상세(ForumView) 진입
When:  별점 영역에서 특정 별 클릭 (예: 4번째 별)
Then:
  - 해당 별점(4점)으로 저장
  - 평균 평점 업데이트
  - 총 평가자 수 증가
  - "평점이 저장되었습니다" 또는 유사 피드백
```

#### SC-RATE-02 | P0 | 비로그인 시 평점 입력 불가

```
Given: 비로그인 상태, 살롱 상세 진입
When:  별점 영역을 클릭 시도
Then:
  - 로그인 유도 모달 표시 또는 평점 저장되지 않음
```

#### SC-RATE-03 | P1 | 평점 수정

```
Given: 로그인된 상태, 이미 평점을 부여한 살롱
When:  다른 별 클릭
Then:
  - 평점이 새로운 값으로 업데이트
  - 평균 재계산 반영
```

#### SC-RATE-04 | P1 | 평점 분포 차트

```
Given: 여러 사용자가 평점을 부여한 살롱 상세
When:  평점 분포 차트 영역 확인
Then:
  - 1~5점 각 별점별 막대 또는 분포 표시
  - 평균 평점(소수점 1자리) 표시
  - 총 평가자 수 표시
```

---

### 4.10 독서 로그 및 배지 (`features/reading-log.spec.ts`)

#### SC-READING-01 | P1 | 독서 상태 변경

```
Given: 로그인된 상태, 살롱 상세(ForumView) 진입
When:  독서 상태 버튼 클릭 (읽는 중 / 읽음 / 읽고 싶음)
Then:
  - 선택한 상태로 버튼 UI 업데이트
  - 로그인 상태 유지 시 상태 지속
```

#### SC-READING-02 | P0 | 비로그인 시 독서 상태 변경 불가

```
Given: 비로그인 상태, 살롱 상세 진입
When:  독서 상태 버튼 클릭 시도
Then:
  - 로그인 유도 또는 버튼 비활성화
```

#### SC-READING-03 | P2 | 배지 목록 표시

```
Given: 독서 기록이 있는 사용자 프로필 페이지
When:  배지 섹션 확인
Then:
  - 획득한 배지 목록 표시
  - 배지 이름 및 조건 표시
```

---

### 4.11 소셜 기능 (`features/social.spec.ts`)

#### SC-SOCIAL-01 | P1 | 게시물 좋아요

```
Given: 로그인된 상태, 게시물 상세(PostDetail) 진입
When:  좋아요 버튼 클릭
Then:
  - 좋아요 수 증가 (또는 이미 좋아요 시 감소)
  - 버튼 상태 토글 (활성/비활성)
```

#### SC-SOCIAL-02 | P1 | 살롱 북마크

```
Given: 로그인된 상태, 살롱 목록 또는 살롱 상세
When:  북마크 버튼 클릭
Then:
  - 북마크 추가/제거 토글
  - 버튼 상태 변경 (채워진 아이콘 / 빈 아이콘)
```

#### SC-SOCIAL-03 | P1 | 사용자 팔로우

```
Given: 로그인된 상태, 타인 프로필 페이지
When:  "팔로우" 버튼 클릭
Then:
  - "팔로잉" 상태로 버튼 변경
  - 팔로워/팔로잉 수 업데이트
```

#### SC-SOCIAL-04 | P1 | 활동 피드 접근

```
Given: 로그인된 상태
When:  활동 피드 뷰로 전환
Then:
  - 활동 피드 목록 표시 (팔로우한 사용자의 활동 또는 빈 상태 메시지)
  - 콘솔 에러 0건
```

---

### 4.12 프로필 (`profile/profile.spec.ts`)

#### SC-PROFILE-01 | P1 | 프로필 페이지 조회

```
Given: 로그인된 상태
When:  헤더 프로필 아이콘 클릭 → 내 프로필 이동
Then:
  - 닉네임, 가입일, 활동 통계 표시
  - 작성 게시물 목록 또는 활동 통계 표시
```

#### SC-PROFILE-02 | P1 | 프로필 정보 수정

```
Given: 로그인된 상태, 내 프로필 페이지
When:  편집 버튼 클릭 → 닉네임/소개 등 수정 → 저장
Then:
  - 수정된 정보가 즉시 반영
  - 성공 메시지 표시
```

#### SC-PROFILE-03 | P2 | 타인 프로필 조회

```
Given: 로그인된 상태
When:  다른 사용자의 프로필 페이지 접근 (게시물 작성자 클릭 등)
Then:
  - 해당 사용자 프로필 정보 표시
  - 팔로우 버튼 표시
  - 내 수정 버튼 미표시
```

---

### 4.13 뷰 네비게이션 (`navigation/views.spec.ts`)

#### SC-NAV-01 | P0 | SPA 뷰 전환 및 복귀

```
Given: 랜딩 페이지(list 뷰) 상태
When:  살롱 카드 클릭 → ForumView 진입 → 뒤로가기 버튼(모바일) 또는 홈 클릭
Then:
  - 살롱 상세로 전환
  - 복귀 시 살롱 목록으로 돌아옴
  - 스크롤 위치 복원 (가능한 경우)
```

#### SC-NAV-02 | P0 | 모바일 뒤로가기 버튼

```
Given: 390px 뷰포트, ForumView 또는 AllBestPostsPage
When:  "← 뒤로" 또는 "목록으로 돌아가기" 버튼 클릭
Then:
  - 이전 뷰로 복귀
  - 버튼이 모바일(390px)에서만 표시됨 (md:hidden)
```

#### SC-NAV-03 | P0 | 데스크탑에서 뒤로가기 버튼 숨김

```
Given: 1280px 뷰포트
When:  ForumView, AllBestPostsPage, PostDetail 확인
Then:
  - "목록으로 돌아가기" / "뒤로" 버튼이 보이지 않음 (CSS md:hidden)
```

---

### 4.14 접근 제어 (`navigation/access-control.spec.ts`)

#### SC-ACCESS-01 | P0 | 비로그인 시 글쓰기 접근 제한

```
Given: 비로그인 상태
When:  게시물 작성 버튼, 댓글 작성 시도
Then:  로그인 모달 표시 또는 작업 차단
```

#### SC-ACCESS-02 | P1 | 관리자 대시보드 비관리자 접근 제한

```
Given: 일반 사용자(비관리자) 로그인 상태
When:  관리자 대시보드 뷰 접근 시도 (URL 직접 또는 상태 조작)
Then:  접근 거부 메시지 또는 리다이렉트
```

---

### 4.15 반응형 테스트 (`responsive/mobile.spec.ts`)

#### SC-MOBILE-01 | P0 | 375px 뷰포트 레이아웃

```
Given: 375px × 812px 뷰포트 설정
When:  랜딩 페이지, 살롱 상세, 검색 모달, 로그인 모달 순서로 접근
Then:
  - 각 페이지에서 가로 스크롤 없음 (bodyScrollWidth ≤ 375 + 10px)
  - 콘솔 에러 0건
  - 주요 버튼(CTA, 로그인, 검색) 클릭 가능 상태
```

#### SC-MOBILE-02 | P0 | 모바일 터치 타겟 크기

```
Given: 375px 뷰포트
When:  주요 버튼 영역 확인
Then:
  - 핵심 버튼(로그인, 검색, 북마크 등)이 44px × 44px 이상 터치 영역
```

---

### 4.16 접근성 (`accessibility/keyboard-navigation.spec.ts`)

#### SC-A11Y-01 | P1 | 모달 포커스 트랩

```
Given: 로그인 모달 또는 게시물 작성 모달이 열린 상태
When:  Tab 키를 연속으로 입력
Then:
  - 포커스가 모달 내부에만 순환 (배경 요소로 이탈하지 않음)
  - Shift+Tab으로 역방향 순환 가능
  - ESC 키로 모달 닫힘
```

#### SC-A11Y-02 | P1 | 라이트박스 키보드 네비게이션

```
Given: 이미지 라이트박스가 열린 상태
When:  좌/우 방향키 입력
Then:  이미지 이동 (여러 이미지인 경우)
When:  ESC 키 입력
Then:  라이트박스 닫힘
```

#### SC-A11Y-03 | P2 | 주요 버튼 aria-label

```
Given: 랜딩 페이지 로드
When:  게시물 수, 북마크, 좋아요 등 버튼 확인
Then:
  - span[aria-label="게시물 수"] 존재
  - 북마크 버튼에 title 또는 aria-label 존재
  - 좋아요 버튼에 aria-label 존재
```

---

### 4.17 메시징·알림 (`messaging/messaging-notifications.spec.ts`)

#### SC-MSG-01 | P1 | 메시징 뷰 접근

```
Given: 로그인된 상태
When:  메시징 아이콘 또는 메뉴 클릭
Then:
  - 메시징 뷰(MessagingPage) 표시
  - 메시지 목록 또는 빈 상태 메시지 표시
  - 콘솔 에러 0건
```

#### SC-MSG-02 | P2 | 알림 목록 접근

```
Given: 로그인된 상태
When:  알림 아이콘 클릭
Then:
  - 알림 목록 뷰 표시
  - 읽지 않은 알림 수 배지 표시 (있는 경우)
```

---

### 4.18 관리자 (`admin/admin-access.spec.ts`)

#### SC-ADMIN-01 | P1 | 관리자 대시보드 접근 (관리자 계정)

```
Given: 관리자 계정으로 로그인
When:  관리자 대시보드 메뉴 접근
Then:
  - AdminDashboard 뷰 표시
  - 사용자/살롱/신고 관리 탭 표시
```

#### SC-ADMIN-02 | P1 | 일반 사용자 관리자 메뉴 미표시

```
Given: 일반 사용자로 로그인
When:  헤더 또는 메뉴 확인
Then:
  - 관리자 대시보드 메뉴가 표시되지 않음
```

---

## 5. 테스트 데이터 전략

### 5.1 테스트 계정

| 계정 유형 | 이메일 | 용도 | 관리 방식 |
|----------|--------|------|----------|
| **일반 사용자 A** | qa-user-a@booksalon.test | 기본 기능 검증 (게시물 작성/수정/삭제) | `.env.local`에 `E2E_USER_A_EMAIL`, `E2E_USER_A_PASSWORD` |
| **일반 사용자 B** | qa-user-b@booksalon.test | 소셜 기능 검증 (팔로우 대상) | `.env.local`에 `E2E_USER_B_EMAIL`, `E2E_USER_B_PASSWORD` |
| **관리자 계정** | qa-admin@booksalon.test | 관리자 대시보드 검증 | `.env.local`에 `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD` |

> 주의: 모든 테스트 계정 자격증명은 `.env.local`에서 관리. spec 파일에 하드코딩 절대 금지.

```typescript
// playwright.config.ts 또는 tests/e2e/helpers/auth.ts
const E2E_USER_A_EMAIL = process.env.E2E_USER_A_EMAIL ?? '';
const E2E_USER_A_PASSWORD = process.env.E2E_USER_A_PASSWORD ?? '';
```

### 5.2 시드 데이터 요건

| 데이터 | 최소 요건 | 용도 |
|--------|----------|------|
| 살롱 | 5개 이상 | 목록, 필터, 정렬 테스트 |
| 살롱별 게시물 | 살롱당 3개 이상 | PostDetail, 댓글, 좋아요 테스트 |
| 게시물별 댓글 | 게시물당 2개 이상 | 댓글 CRUD, 대댓글 테스트 |
| 게시물별 이미지 | 이미지 있는 게시물 최소 1개 | 라이트박스 테스트 |
| 평점이 있는 살롱 | 3개 이상 | 평점 시스템, 분포 차트 |
| 카테고리 다양성 | 3개 이상 카테고리 | 카테고리 필터 테스트 |

### 5.3 테스트 데이터 정리 원칙

- **자동 정리**: 테스트에서 생성한 살롱/게시물/댓글은 `test.afterEach` 또는 `test.afterAll`에서 삭제
- **격리 원칙**: 각 spec 파일은 독립적으로 실행 가능해야 함 (다른 테스트 결과에 의존하지 않음)
- **고유 식별자**: 테스트 생성 데이터는 `[E2E-TEST]` 접두어 사용으로 식별

---

## 6. 환경 설정

### 6.1 로컬 실행 환경

```bash
# 의존성 설치 (최초 1회)
cd projects/booksalon
npm install
npx playwright install chromium

# 전체 E2E 실행
npx playwright test --reporter=line

# 특정 스위트 실행
npx playwright test tests/e2e/smoke/ --reporter=line

# 특정 파일 실행
npx playwright test tests/e2e/smoke/smoke.spec.ts --reporter=line

# JSON 리포트 생성
npx playwright test --reporter=json

# 스크린샷 모드 (실패 시 자동 캡처 — playwright.config.ts 기본 설정)
npx playwright test
```

### 6.2 playwright.config.ts 설정 현황

```typescript
// 현재 설정 요약 (projects/booksalon/playwright.config.ts)
{
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,   // 병렬 실행 비활성 (SPA 상태 충돌 방지)
  retries: 0,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'tests/e2e/results/test-results.json' }]],
  use: {
    baseURL: 'https://booksalon-nine.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
    locale: 'ko-KR',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
}
```

### 6.3 로컬 개발 서버 대상 테스트 (선택적)

일부 테스트(대댓글 등 로컬 환경 필요 시):

```bash
# 개발 서버 실행
npm run dev -- --port 4000

# 로컬 대상으로 실행 (baseURL 오버라이드)
npx playwright test --reporter=line tests/e2e/core/comment-crud.spec.ts \
  --config playwright.config.ts
# 또는 환경변수로 URL 오버라이드:
BASE_URL=http://localhost:4000 npx playwright test
```

> playwright.config.ts에 `baseURL: process.env.BASE_URL ?? 'https://booksalon-nine.vercel.app'` 형태로 환경변수 주입을 권장.

### 6.4 CI/CD 연동 (GitHub Actions)

```yaml
# .github/workflows/e2e-test.yml (DevOps와 협업하여 설정)
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd projects/booksalon && npm ci
      - name: Install Playwright browsers
        run: cd projects/booksalon && npx playwright install chromium --with-deps
      - name: Run smoke tests
        run: cd projects/booksalon && npx playwright test tests/e2e/smoke/ --reporter=line
        env:
          E2E_USER_A_EMAIL: ${{ secrets.E2E_USER_A_EMAIL }}
          E2E_USER_A_PASSWORD: ${{ secrets.E2E_USER_A_PASSWORD }}
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: projects/booksalon/tests/e2e/results/
```

---

## 7. 성공/실패 기준

### 7.1 v1.0 출시 승인 기준

| 기준 | 조건 |
|------|------|
| **P0 시나리오** | 100% Pass (0건 Fail) |
| **P1 시나리오** | 90% 이상 Pass |
| **P2 시나리오** | 80% 이상 Pass |
| **Blocker 이슈** | 0건 |
| **Critical 이슈** | 0건 |
| **Major 이슈** | 3건 이하 (수정 계획 명시 시 허용) |
| **빌드 성공** | `npm run build` 에러 0건 |
| **타입 에러** | `npx tsc --noEmit` 에러 0건 |
| **콘솔 에러** | 프로덕션 페이지 console.error 0건 |
| **모바일 레이아웃** | 375px에서 가로 스크롤 0건 |
| **Lighthouse** | Performance 70+ (PRD 목표 90+는 v1.0 이후 지속 개선) |

### 7.2 조건부 승인 기준

아래 조건을 모두 충족하면 Minor 이슈 포함 조건부 배포 가능:

- P0 시나리오 100% Pass
- Blocker/Critical 이슈 0건
- Major 이슈 3건 이하 (이슈별 수정 백로그 등록 필수)

### 7.3 배포 반려 기준

| 조건 | 판정 |
|------|------|
| P0 시나리오 1건 이상 Fail | 반려 |
| Blocker 이슈 존재 | 반려 |
| Critical 이슈 존재 | 반려 |
| 빌드 실패 | 반려 |
| 타입 에러 존재 | 반려 |

### 7.4 이슈 심각도 정의

| 심각도 | 정의 | 예시 |
|--------|------|------|
| **Blocker** | 서비스 접근 불가, 데이터 손실 위험 | 랜딩 페이지 로딩 실패, DB 저장 불가 |
| **Critical** | 핵심 기능 완전 장애, 우회 불가 | 로그인 불가, 게시물 작성 불가 |
| **Major** | 중요 기능 일부 장애, 우회 가능 | 이미지 업로드 간헐적 실패, 태그 저장 지연 |
| **Minor** | 경미한 UI/UX 이슈 | 버튼 여백 불일치, 폰트 크기 미세 차이 |

---

## 8. 기존 테스트와의 관계 정리

### 8.1 유지 (변경 없이 계속 사용)

| 파일 | 이유 |
|------|------|
| `pr11-landing-ui.spec.ts` | 랜딩 UI(인기 게시물, 살롱 목록 구조) 커버, 양호 |
| `pr12-category-filter-backbutton.spec.ts` | 카테고리 필터 및 반응형 뒤로가기 커버, 양호 |
| `login-error.spec.ts` | 로그인 에러 케이스 커버, SC-AUTH-02와 중복이나 독립 유지 |
| `delete-account.spec.ts` | 계정 삭제 플로우 전용 |
| `delete-account-reverify.spec.ts` | 계정 삭제 재검증 전용 |
| `ui-changes-qa.spec.ts` | UI 변경사항 회귀 검증, 신규 브랜딩과 일치 확인 |

### 8.2 리팩토링 필요

| 파일 | 수정 사항 | 우선순위 |
|------|----------|----------|
| `pr14-nested-comments-qa.spec.ts` | `LOCAL_URL = 'http://localhost:4000'` → `process.env.BASE_URL ?? 'https://booksalon-nine.vercel.app'` 로 교체. 정적 검증 코드(TC-03~06, TC-09~11, TC-15~16) 제거 또는 별도 unit test로 이관 | P1 |

### 8.3 신규 추가 필요 (본 플랜 기준)

| 스위트 | 신규 파일 |
|--------|----------|
| 스모크 | `smoke/smoke.spec.ts` |
| 인증 | `auth/login.spec.ts`, `auth/signup.spec.ts` |
| 살롱 | `core/salon-crud.spec.ts` |
| 게시물 | `core/post-crud.spec.ts` |
| 댓글 (리팩토링 포함) | `core/comment-crud.spec.ts` |
| 검색 | `features/search.spec.ts` |
| 태그 | `features/tag-system.spec.ts` |
| 이미지 | `features/image-upload.spec.ts` |
| 평점 | `features/rating-system.spec.ts` |
| 독서 로그 | `features/reading-log.spec.ts` |
| 소셜 | `features/social.spec.ts` |
| 뷰 네비게이션 | `navigation/views.spec.ts`, `navigation/access-control.spec.ts` |
| 프로필 | `profile/profile.spec.ts` |
| 메시징/알림 | `messaging/messaging-notifications.spec.ts` |
| 관리자 | `admin/admin-access.spec.ts` |
| 반응형 | `responsive/mobile.spec.ts` |
| 접근성 | `accessibility/keyboard-navigation.spec.ts` |

---

## 9. 시나리오 요약 매트릭스

| 스위트 | P0 시나리오 수 | P1 시나리오 수 | P2 시나리오 수 | 합계 |
|--------|-------------|-------------|-------------|------|
| 스모크 | 3 | 0 | 0 | 3 |
| 인증 | 5 | 1 | 0 | 6 |
| 살롱 CRUD | 3 | 1 | 0 | 4 |
| 게시물 CRUD | 4 | 1 | 0 | 5 |
| 댓글 시스템 | 4 | 1 | 0 | 5 |
| 검색 | 3 | 2 | 0 | 5 |
| 태그 시스템 | 2 | 1 | 0 | 3 |
| 이미지 업로드 | 2 | 2 | 0 | 4 |
| 평점 시스템 | 2 | 2 | 0 | 4 |
| 독서 로그·배지 | 1 | 1 | 1 | 3 |
| 소셜 기능 | 0 | 4 | 0 | 4 |
| 뷰 네비게이션 | 3 | 0 | 0 | 3 |
| 접근 제어 | 1 | 1 | 0 | 2 |
| 반응형 | 2 | 0 | 0 | 2 |
| 접근성 | 0 | 2 | 1 | 3 |
| 프로필 | 0 | 2 | 1 | 3 |
| 메시징·알림 | 0 | 1 | 1 | 2 |
| 관리자 | 0 | 2 | 0 | 2 |
| **합계** | **35** | **24** | **4** | **63** |

---

## 10. 실행 로드맵 (v1.0 출시 전)

### Phase 1: 스모크 + 인증 (즉시 실행 가능)

기존 `login-error.spec.ts` 활용 + `smoke/smoke.spec.ts` 신규 작성

```bash
# 즉시 실행 가능
npx playwright test tests/e2e/login-error.spec.ts --reporter=line
npx playwright test tests/e2e/pr11-landing-ui.spec.ts --reporter=line
npx playwright test tests/e2e/pr12-category-filter-backbutton.spec.ts --reporter=line
npx playwright test tests/e2e/ui-changes-qa.spec.ts --reporter=line
```

### Phase 2: 핵심 CRUD (신규 스펙 작성 필요)

`core/salon-crud.spec.ts`, `core/post-crud.spec.ts`, `core/comment-crud.spec.ts`

### Phase 3: 기능 검증 (신규 스펙 작성 필요)

`features/` 하위 전체 스펙

### Phase 4: 전체 통합 실행 (v1.0 출시 전 최종 QA)

```bash
npx playwright test --reporter=json
# → tests/e2e/results/test-results.json 생성
```

---

## 11. 부록

### 11.1 data-testid 인벤토리 (기존 확인된 것)

| selector | 위치 | 용도 |
|----------|------|------|
| `[data-testid="forum-list-loaded"]` | ForumList 컴포넌트 | 살롱 목록 로드 완료 확인 |

> 신규 스펙 작성 시 `data-testid` 추가가 필요한 경우 Fullstack Dev에게 요청.

### 11.2 공통 헬퍼 패턴

```typescript
// tests/e2e/helpers/navigation.ts (신규 작성 권장)

import { Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://booksalon-nine.vercel.app';

export async function loadLandingPage(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForSelector('[data-testid="forum-list-loaded"]', { timeout: 30000 });
  await page.waitForTimeout(1000);
}

export async function loginWithTestAccount(page: Page, email: string, password: string) {
  const loginBtn = page.getByRole('button', { name: '로그인' });
  await loginBtn.click();
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.locator('button[type="submit"]').filter({ hasText: '로그인' }).click();
  await page.waitForTimeout(2000);
}

export async function navigateToFirstForum(page: Page) {
  await loadLandingPage(page);
  const salonCard = page.locator('[data-testid="forum-list-loaded"] div.space-y-2 > div').first();
  await salonCard.click();
  await page.waitForTimeout(2000);
}
```

### 11.3 알려진 제약 사항

| 제약 | 내용 | 대응 방안 |
|------|------|----------|
| Google OAuth | 실제 인증 자동화 불가 | UI 표시 여부만 검증 |
| 이미지 업로드 | CI에서 실제 파일 업로드 테스트 어려움 | 로컬 실행 시만 수행 |
| Supabase RLS | DB 직접 검증 불가 | 응답 결과(UI 반영)로 간접 검증 |
| 메일 발송 | 실제 이메일 검증 불가 | 가입 성공 UI 메시지로 대체 |
| 공유 상태 | 테스트 계정 데이터가 테스트 간 공유됨 | afterEach 정리 또는 고유 식별자 사용 |

---

*작성: QA Engineer (해밀턴) | 2026-03-09 | 북살롱 v1.0 출시 준비*
