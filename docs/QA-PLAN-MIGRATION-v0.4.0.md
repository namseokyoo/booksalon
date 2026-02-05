# 북살롱 v0.4.0 Supabase 마이그레이션 QA 검증 계획서

## 문서 정보

| 항목 | 내용 |
|------|------|
| **버전** | 0.4.0 |
| **작성일** | 2026-02-05 |
| **작성자** | QA Engineer |
| **검증 대상** | Firebase → Supabase 마이그레이션 |
| **검증 방식** | 마이그레이션 특화 시나리오 기반 QA |
| **참고 문서** | MIGRATION-PLAN-v0.4.0.md, QA-PLAN-v0.3.0.md |

---

## 1. 마이그레이션 QA 개요

### 1.1 목적

Firebase에서 Supabase로의 백엔드 마이그레이션이 완료된 후:
1. **기능 동등성**: 모든 기존 기능이 Supabase 환경에서 동일하게 동작하는지 검증
2. **데이터 무결성**: 마이그레이션된 데이터가 정확하고 완전한지 검증
3. **성능 유지/개선**: Firebase 대비 성능이 동등하거나 개선되었는지 검증
4. **보안 유지**: RLS 정책 및 인증 시스템이 정상 동작하는지 검증

### 1.2 검증 범위

| 영역 | Firebase (As-Is) | Supabase (To-Be) | 검증 중점 |
|------|------------------|------------------|----------|
| **인증** | Firebase Auth (카카오, 구글) | Supabase Auth (OAuth) | 소셜 로그인, 세션 관리 |
| **데이터베이스** | Firestore (NoSQL) | PostgreSQL (RDB) | CRUD 동작, 데이터 정합성 |
| **스토리지** | Firebase Storage | Supabase Storage | 파일 업로드/다운로드, URL 접근 |
| **실시간** | Firestore onSnapshot | Supabase Realtime | 알림, 메시지 실시간 수신 |

### 1.3 검증 단계

```
Phase 1: 기능 회귀 테스트 (2일)
   ↓
Phase 2: 데이터 무결성 검증 (1일)
   ↓
Phase 3: 성능 비교 테스트 (0.5일)
   ↓
Phase 4: 보안 검증 (0.5일)
   ↓
Phase 5: 통합 검증 및 최종 승인 (1일)
```

**총 예상 기간**: 5일 (개발 완료 후)

### 1.4 검증 환경

| 항목 | 내용 |
|------|------|
| **테스트 환경** | Vercel Preview / Supabase Staging |
| **브라우저** | Chrome 최신, Firefox 최신, Safari 최신 |
| **디바이스** | 데스크탑 (1920x1080), 태블릿 (768px), 모바일 (375px) |
| **테스트 계정** | 카카오 OAuth, 구글 OAuth |
| **테스트 데이터** | 마이그레이션된 실제 데이터 + 신규 테스트 데이터 |

---

## 2. 유저 페르소나 (마이그레이션 특화)

### 2.1 기존 사용자 - 마이그레이션 대상 (페르소나 M1)

| 항목 | 내용 |
|------|------|
| **이름** | 김마이그레이션 |
| **특성** | Firebase 시절부터 활동한 기존 사용자 |
| **보유 데이터** | 프로필, 게시물 10개+, 댓글 50개+, 평점 20개+, 북마크 15개 |
| **핵심 검증** | 기존 데이터 접근 가능, 세션 유지, 기능 연속성 |
| **시나리오** | 로그인 → 내 프로필 확인 → 내 게시물 확인 → 기존 기능 사용 |

### 2.2 신규 가입자 - 마이그레이션 후 (페르소나 M2)

| 항목 | 내용 |
|------|------|
| **이름** | 이뉴비 |
| **특성** | Supabase 전환 후 처음 가입하는 사용자 |
| **보유 데이터** | 없음 (신규 생성) |
| **핵심 검증** | 신규 가입 플로우, 데이터 생성, Supabase 네이티브 동작 |
| **시나리오** | 소셜 로그인 → 프로필 생성 → 첫 게시물 작성 → 평점 부여 |

### 2.3 관리자 (페르소나 M3)

| 항목 | 내용 |
|------|------|
| **이름** | 박관리자 |
| **특성** | 관리자 권한 보유, 통계 및 신고 관리 |
| **핵심 검증** | 관리자 권한 유지, 관리 기능 동작, 통계 정확성 |
| **시나리오** | 관리자 로그인 → 대시보드 → 사용자/신고 관리 → 통계 확인 |

---

## 3. 마이그레이션 특화 테스트 시나리오

### 3.1 인증 기능 시나리오

#### SC-MIG-AUTH-01: 카카오 소셜 로그인 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-AUTH-01 |
| **제목** | 카카오 소셜 로그인 (Supabase OAuth) |
| **관련 페르소나** | M1 (기존 사용자), M2 (신규 사용자) |
| **우선순위** | P0 |
| **사전 조건** | Supabase 카카오 OAuth 설정 완료 |

**Given-When-Then:**
```
Given: 사용자가 로그인 페이지에 접속했다
When: "카카오로 로그인" 버튼을 클릭한다
Then:
  - 카카오 OAuth 인증 페이지로 리다이렉트된다
  - 카카오 인증 후 /auth/callback으로 돌아온다
  - 세션이 생성되고 사용자 정보가 로드된다
  - 대시보드 또는 이전 페이지로 리다이렉트된다
```

**검증 포인트:**
- [ ] OAuth 플로우 정상 동작
- [ ] Supabase auth.users 테이블에 레코드 생성
- [ ] users 테이블에 프로필 연결
- [ ] 세션 토큰 발급 및 저장
- [ ] 기존 사용자: Firebase UID → Supabase auth_id 매핑 확인

---

#### SC-MIG-AUTH-02: 구글 소셜 로그인 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-AUTH-02 |
| **제목** | 구글 소셜 로그인 (Supabase OAuth) |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |
| **사전 조건** | Supabase 구글 OAuth 설정 완료 |

**Given-When-Then:**
```
Given: 사용자가 로그인 페이지에 접속했다
When: "구글로 로그인" 버튼을 클릭한다
Then:
  - 구글 OAuth 인증 페이지로 리다이렉트된다
  - 구글 인증 후 /auth/callback으로 돌아온다
  - 세션이 생성되고 사용자 정보가 로드된다
```

**검증 포인트:**
- [ ] 구글 OAuth 플로우 정상 동작
- [ ] 동일한 이메일로 카카오/구글 로그인 시 처리 확인

---

#### SC-MIG-AUTH-03: 로그아웃 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-AUTH-03 |
| **제목** | 로그아웃 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자가 로그인 상태이다
When: 로그아웃 버튼을 클릭한다
Then:
  - Supabase 세션이 종료된다
  - 로컬 스토리지/쿠키에서 토큰 제거
  - 로그인 페이지로 리다이렉트
  - 인증 필요 페이지 접근 시 로그인 요구
```

---

#### SC-MIG-AUTH-04: 세션 유지 및 갱신 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-AUTH-04 |
| **제목** | 세션 유지 및 토큰 갱신 |
| **관련 페르소나** | M1 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자가 로그인 후 1시간 이상 활동했다
When: 토큰 만료 시점에 API 요청을 보낸다
Then:
  - Supabase가 자동으로 토큰을 갱신한다
  - 사용자는 로그아웃되지 않는다
  - 새로고침 후에도 로그인 상태 유지
```

---

### 3.2 사용자 프로필 시나리오

#### SC-MIG-USER-01: 기존 사용자 프로필 로드 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-USER-01 |
| **제목** | 마이그레이션된 사용자 프로필 로드 |
| **관련 페르소나** | M1 (기존 사용자) |
| **우선순위** | P0 |
| **사전 조건** | Firebase에서 마이그레이션된 사용자 데이터 |

**Given-When-Then:**
```
Given: 기존 사용자가 로그인했다
When: 프로필 페이지에 접속한다
Then:
  - 마이그레이션된 프로필 정보가 정확하게 표시된다
    - 닉네임, 자기소개, 프로필 이미지
    - 게시물 수, 댓글 수, 포럼 참여 수
  - 소셜 링크, 알림 설정, 선호 장르 정보 표시
  - 프로필 이미지 URL 접근 가능
```

**검증 포인트:**
- [ ] users 테이블 데이터 정확성
- [ ] user_social_links JOIN 정상
- [ ] user_notification_settings JOIN 정상
- [ ] user_favorite_genres JOIN 정상
- [ ] Firebase Storage URL → Supabase Storage URL 접근 (또는 기존 URL 유지)

---

#### SC-MIG-USER-02: 프로필 수정 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-USER-02 |
| **제목** | 프로필 정보 수정 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자가 프로필 편집 모드에 진입했다
When: 닉네임, 자기소개를 수정하고 저장한다
Then:
  - Supabase users 테이블이 업데이트된다
  - 즉시 UI에 반영된다
  - 새로고침 후에도 변경사항 유지
```

---

#### SC-MIG-USER-03: 프로필 이미지 업로드 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-USER-03 |
| **제목** | 프로필 이미지 업로드 (Supabase Storage) |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자가 프로필 편집 모드에 진입했다
When: 새 프로필 이미지를 선택하고 업로드한다
Then:
  - 이미지가 Supabase Storage profile-images 버킷에 업로드된다
  - 이미지 URL이 users.profile_image_url에 저장된다
  - 이전 이미지가 Storage에서 삭제된다 (옵션)
  - 새 이미지가 즉시 표시된다
```

**검증 포인트:**
- [ ] Supabase Storage 업로드 정상
- [ ] Public URL 생성 및 접근 가능
- [ ] RLS 정책 동작 (본인만 업로드 가능)

---

### 3.3 살롱 (Forum) 기능 시나리오

#### SC-MIG-FORUM-01: 살롱 목록 조회 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-FORUM-01 |
| **제목** | 마이그레이션된 살롱 목록 조회 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 살롱 목록 페이지에 접속했다
When: 페이지가 로드된다
Then:
  - 마이그레이션된 모든 살롱이 표시된다
  - 각 살롱에 책 정보 (제목, 저자, 썸네일) 표시
  - 게시물 수, 평균 평점, 태그 표시
  - 정렬 (최신, 인기, 게시물 수) 정상 동작
  - 카테고리/태그 필터링 정상 동작
```

**검증 포인트:**
- [ ] forums + books JOIN 정상
- [ ] forum_tags JOIN 정상
- [ ] post_count, average_rating 정확성
- [ ] 페이지네이션/무한 스크롤 동작

---

#### SC-MIG-FORUM-02: 살롱 생성 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-FORUM-02 |
| **제목** | 새 살롱 생성 |
| **관련 페르소나** | M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 로그인한 사용자가 살롱 생성 모달을 열었다
When: 책을 검색하여 선택하고 카테고리, 태그를 입력 후 생성한다
Then:
  - books 테이블에 책 정보 저장 (또는 기존 있으면 스킵)
  - forums 테이블에 새 살롱 생성
  - forum_tags 테이블에 태그 저장
  - 사용자의 forum_count 증가
  - 새 살롱 페이지로 이동
```

---

### 3.4 게시물 기능 시나리오

#### SC-MIG-POST-01: 게시물 목록 조회 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-POST-01 |
| **제목** | 마이그레이션된 게시물 목록 조회 |
| **관련 페르소나** | M1 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 특정 살롱 상세 페이지에 접속했다
When: 게시물 탭을 확인한다
Then:
  - 마이그레이션된 모든 게시물이 표시된다
  - 각 게시물에 제목, 내용 요약, 작성자, 작성일 표시
  - 좋아요 수, 댓글 수, 태그 표시
  - 이미지 썸네일 표시 (있는 경우)
```

**검증 포인트:**
- [ ] posts + users JOIN 정상 (작성자 정보)
- [ ] post_tags, post_images JOIN 정상
- [ ] like_count, comment_count 정확성
- [ ] 작성일 정렬 정상

---

#### SC-MIG-POST-02: 게시물 작성 (이미지 포함) (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-POST-02 |
| **제목** | 이미지 포함 게시물 작성 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자가 게시물 작성 모달을 열었다
When: 제목, 내용, 태그를 입력하고 이미지 2장을 첨부 후 등록한다
Then:
  - posts 테이블에 게시물 저장
  - post_tags 테이블에 태그 저장
  - 이미지가 Supabase Storage post-images 버킷에 업로드
  - post_images 테이블에 이미지 정보 저장
  - forums.post_count 증가
  - users.post_count 증가
  - 새 게시물이 목록에 표시
```

---

#### SC-MIG-POST-03: 게시물 수정/삭제 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-POST-03 |
| **제목** | 게시물 수정 및 삭제 |
| **관련 페르소나** | M1 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자가 본인이 작성한 게시물 상세를 보고 있다
When:
  Case A: 수정 버튼 클릭 → 내용 변경 → 저장
  Case B: 삭제 버튼 클릭 → 확인
Then:
  Case A: posts 테이블 업데이트, UI 즉시 반영
  Case B:
    - posts 테이블에서 삭제 (CASCADE로 관련 데이터 삭제)
    - forums.post_count 감소
    - users.post_count 감소
    - Storage 이미지 삭제
```

**검증 포인트:**
- [ ] RLS 정책: 본인 게시물만 수정/삭제 가능
- [ ] CASCADE 삭제 동작 (댓글, 좋아요, 이미지)

---

### 3.5 댓글 기능 시나리오

#### SC-MIG-COMMENT-01: 댓글 CRUD (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-COMMENT-01 |
| **제목** | 댓글 생성/조회/수정/삭제 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 게시물 상세 페이지에서 댓글 섹션을 보고 있다
When:
  - 마이그레이션된 기존 댓글 확인
  - 새 댓글 작성
  - 본인 댓글 수정
  - 본인 댓글 삭제
Then:
  - 기존 댓글이 정확하게 표시 (작성자, 내용, 날짜, 좋아요 수)
  - 새 댓글이 comments 테이블에 저장
  - posts.comment_count 업데이트
  - users.comment_count 업데이트
  - 수정/삭제 시 RLS 정책 동작
```

---

### 3.6 좋아요/북마크/팔로우 시나리오

#### SC-MIG-SOCIAL-01: 좋아요 기능 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-SOCIAL-01 |
| **제목** | 게시물/댓글 좋아요 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 게시물 또는 댓글을 보고 있다
When: 좋아요 버튼을 클릭한다
Then:
  - post_likes 또는 comment_likes 테이블에 레코드 추가
  - posts.like_count 또는 comments.like_count 증가 (트리거)
  - UI에 좋아요 수 즉시 반영
  - 다시 클릭 시 좋아요 취소 (레코드 삭제, 카운트 감소)
```

**검증 포인트:**
- [ ] PostgreSQL 트리거로 like_count 자동 업데이트
- [ ] 중복 좋아요 방지 (UNIQUE constraint)

---

#### SC-MIG-SOCIAL-02: 북마크 기능 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-SOCIAL-02 |
| **제목** | 살롱 북마크 |
| **관련 페르소나** | M1 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 마이그레이션된 북마크 데이터가 있는 사용자가 로그인했다
When:
  - 내 북마크 페이지 접속
  - 새 살롱 북마크 추가
  - 기존 북마크 제거
Then:
  - 마이그레이션된 북마크 목록 정확하게 표시
  - bookmarks 테이블 INSERT/DELETE 정상
  - UI 즉시 반영
```

---

#### SC-MIG-SOCIAL-03: 팔로우 기능 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-SOCIAL-03 |
| **제목** | 사용자 팔로우/언팔로우 |
| **관련 페르소나** | M1 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 마이그레이션된 팔로우 관계가 있는 사용자가 로그인했다
When:
  - 다른 사용자 프로필 방문
  - 팔로워/팔로잉 목록 확인
  - 팔로우/언팔로우 버튼 클릭
Then:
  - 마이그레이션된 팔로우 관계 정확하게 표시
  - follows 테이블 INSERT/DELETE 정상
  - 팔로워/팔로잉 수 정확
```

---

### 3.7 평점 시스템 시나리오

#### SC-MIG-RATE-01: 평점 조회 및 부여 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-RATE-01 |
| **제목** | 평점 조회 및 부여 |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 살롱 상세 페이지에 접속했다
When:
  - 평균 평점과 평점 분포 확인
  - 별점 클릭하여 평점 부여/수정
Then:
  - 마이그레이션된 평균 평점 정확하게 표시
  - ratings 테이블 UPSERT 정상
  - PostgreSQL 함수로 forums.average_rating 업데이트
  - 평점 분포 차트 정확
```

---

### 3.8 검색 기능 시나리오

#### SC-MIG-SEARCH-01: 통합 검색 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-SEARCH-01 |
| **제목** | 통합 검색 (PostgreSQL) |
| **관련 페르소나** | M1, M2 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 검색 모달을 열었다
When: "데미안"을 검색한다
Then:
  - Supabase PostgreSQL ilike 검색 실행
  - 살롱, 게시물, 댓글 결과 섹션별 표시
  - 검색어 하이라이트 적용
  - 검색 응답 시간 < 500ms
```

---

### 3.9 실시간 기능 시나리오

#### SC-MIG-REALTIME-01: 실시간 알림 (P0)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-REALTIME-01 |
| **제목** | 실시간 알림 수신 (Supabase Realtime) |
| **관련 페르소나** | M1 |
| **우선순위** | P0 |

**Given-When-Then:**
```
Given: 사용자 A가 로그인 상태이다
When: 다른 사용자 B가 A의 게시물에 좋아요/댓글을 남긴다
Then:
  - A에게 실시간 알림이 전달된다 (Supabase Realtime postgres_changes)
  - 알림 아이콘에 뱃지 표시
  - 알림 목록에 새 알림 추가
```

**검증 포인트:**
- [ ] Supabase Realtime 구독 정상
- [ ] postgres_changes 이벤트 수신
- [ ] 실시간 지연 < 1초

---

#### SC-MIG-REALTIME-02: 실시간 메시징 (P1)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-REALTIME-02 |
| **제목** | 실시간 채팅 메시지 |
| **관련 페르소나** | M1 |
| **우선순위** | P1 |

**Given-When-Then:**
```
Given: 두 사용자가 1:1 채팅방에 접속해 있다
When: A가 메시지를 전송한다
Then:
  - B에게 실시간으로 메시지가 표시된다
  - 읽지 않은 메시지 카운트 업데이트
  - 메시지 읽음 처리 정상
```

---

### 3.10 관리자 기능 시나리오

#### SC-MIG-ADMIN-01: 관리자 대시보드 (P1)

| 항목 | 내용 |
|------|------|
| **시나리오 ID** | SC-MIG-ADMIN-01 |
| **제목** | 관리자 대시보드 및 통계 |
| **관련 페르소나** | M3 (관리자) |
| **우선순위** | P1 |

**Given-When-Then:**
```
Given: 관리자 권한 사용자가 로그인했다
When: 관리자 대시보드에 접속한다
Then:
  - admins 테이블에서 권한 확인
  - 통계 (총 사용자, 살롱, 게시물, 신고) 정확
  - 대기 중인 신고 목록 표시
  - 사용자 관리 기능 동작
```

---

## 4. 데이터 무결성 검증

### 4.1 데이터 마이그레이션 검증 체크리스트

#### 4.1.1 사용자 데이터

| ID | 검증 항목 | 검증 방법 | 우선순위 |
|----|----------|----------|----------|
| DATA-USER-01 | 전체 사용자 수 일치 | Firebase users 수 = Supabase users 수 | P0 |
| DATA-USER-02 | 필수 필드 누락 없음 | email, display_name NOT NULL 검증 | P0 |
| DATA-USER-03 | 프로필 이미지 URL 접근 가능 | 샘플 10개 URL 접근 테스트 | P0 |
| DATA-USER-04 | post_count 정확성 | 실제 posts 수와 비교 | P1 |
| DATA-USER-05 | comment_count 정확성 | 실제 comments 수와 비교 | P1 |
| DATA-USER-06 | 소셜 링크 마이그레이션 | user_social_links 데이터 확인 | P1 |
| DATA-USER-07 | 알림 설정 마이그레이션 | user_notification_settings 데이터 확인 | P1 |

#### 4.1.2 살롱/책 데이터

| ID | 검증 항목 | 검증 방법 | 우선순위 |
|----|----------|----------|----------|
| DATA-FORUM-01 | 전체 살롱 수 일치 | Firebase forums 수 = Supabase forums 수 | P0 |
| DATA-FORUM-02 | 책 정보 완전성 | books 테이블 ISBN, title, authors 검증 | P0 |
| DATA-FORUM-03 | 살롱-책 연결 정확 | forums.isbn → books.isbn FK 검증 | P0 |
| DATA-FORUM-04 | 태그 마이그레이션 | forum_tags 데이터 확인 | P1 |
| DATA-FORUM-05 | post_count 정확성 | 실제 posts 수와 비교 | P1 |
| DATA-FORUM-06 | average_rating 정확성 | 실제 ratings 평균과 비교 | P1 |

#### 4.1.3 게시물/댓글 데이터

| ID | 검증 항목 | 검증 방법 | 우선순위 |
|----|----------|----------|----------|
| DATA-POST-01 | 전체 게시물 수 일치 | Firebase posts 수 = Supabase posts 수 | P0 |
| DATA-POST-02 | 게시물-살롱 연결 정확 | posts.forum_isbn → forums.isbn FK 검증 | P0 |
| DATA-POST-03 | 게시물-작성자 연결 정확 | posts.author_id → users.id FK 검증 | P0 |
| DATA-POST-04 | 게시물 이미지 URL 접근 | 샘플 10개 이미지 URL 테스트 | P0 |
| DATA-POST-05 | 전체 댓글 수 일치 | Firebase comments 수 = Supabase comments 수 | P0 |
| DATA-POST-06 | 댓글-게시물 연결 정확 | comments.post_id → posts.id FK 검증 | P0 |
| DATA-POST-07 | like_count 정확성 | 실제 likes 수와 비교 | P1 |
| DATA-POST-08 | 태그 마이그레이션 | post_tags 데이터 확인 | P1 |

#### 4.1.4 관계 데이터

| ID | 검증 항목 | 검증 방법 | 우선순위 |
|----|----------|----------|----------|
| DATA-REL-01 | 전체 평점 수 일치 | Firebase ratings 수 = Supabase ratings 수 | P0 |
| DATA-REL-02 | 전체 북마크 수 일치 | Firebase bookmarks 수 = Supabase bookmarks 수 | P0 |
| DATA-REL-03 | 전체 팔로우 수 일치 | Firebase follows 수 = Supabase follows 수 | P0 |
| DATA-REL-04 | 전체 좋아요 수 일치 | Firebase likes 수 = Supabase likes 수 | P0 |
| DATA-REL-05 | 알림 데이터 마이그레이션 | notifications 테이블 데이터 확인 | P1 |
| DATA-REL-06 | 채팅 데이터 마이그레이션 | chat_rooms, messages 테이블 데이터 확인 | P1 |

### 4.2 데이터 정합성 검증 SQL

```sql
-- 1. 고아 레코드 확인 (FK 무결성)

-- 고아 게시물 (존재하지 않는 살롱 참조)
SELECT COUNT(*) as orphan_posts FROM posts p
LEFT JOIN forums f ON p.forum_isbn = f.isbn
WHERE f.isbn IS NULL;

-- 고아 댓글 (존재하지 않는 게시물 참조)
SELECT COUNT(*) as orphan_comments FROM comments c
LEFT JOIN posts p ON c.post_id = p.id
WHERE p.id IS NULL;

-- 고아 평점 (존재하지 않는 책 참조)
SELECT COUNT(*) as orphan_ratings FROM ratings r
LEFT JOIN books b ON r.book_isbn = b.isbn
WHERE b.isbn IS NULL;

-- 2. 카운트 필드 정합성 확인

-- forums.post_count vs 실제 게시물 수
SELECT f.isbn, f.post_count as stored, COUNT(p.id) as actual
FROM forums f
LEFT JOIN posts p ON f.isbn = p.forum_isbn
GROUP BY f.isbn, f.post_count
HAVING f.post_count != COUNT(p.id);

-- posts.like_count vs 실제 좋아요 수
SELECT p.id, p.like_count as stored, COUNT(pl.id) as actual
FROM posts p
LEFT JOIN post_likes pl ON p.id = pl.post_id
GROUP BY p.id, p.like_count
HAVING p.like_count != COUNT(pl.id);

-- posts.comment_count vs 실제 댓글 수
SELECT p.id, p.comment_count as stored, COUNT(c.id) as actual
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, p.comment_count
HAVING p.comment_count != COUNT(c.id);

-- 3. 평균 평점 정합성 확인
SELECT f.isbn, f.average_rating as stored_avg,
       ROUND(AVG(r.rating)::numeric, 1) as calculated_avg
FROM forums f
LEFT JOIN ratings r ON f.isbn = r.book_isbn
GROUP BY f.isbn, f.average_rating
HAVING ABS(f.average_rating - COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0)) > 0.1;
```

### 4.3 이미지 URL 접근 검증

```bash
# 프로필 이미지 URL 샘플 테스트 (10개)
# Supabase Storage URL 형식: https://<project>.supabase.co/storage/v1/object/public/profile-images/...

# 게시물 이미지 URL 샘플 테스트 (10개)
# Supabase Storage URL 형식: https://<project>.supabase.co/storage/v1/object/public/post-images/...

# 또는 기존 Firebase Storage URL이 유지되는 경우 접근 가능 여부 확인
```

---

## 5. 성능 비교 테스트

### 5.1 성능 측정 항목

| 항목 | Firebase 기준 | Supabase 목표 | 측정 방법 |
|------|--------------|--------------|----------|
| 살롱 목록 로드 (50개) | < 500ms | < 500ms | Network 탭 |
| 게시물 목록 로드 (20개) | < 300ms | < 300ms | Network 탭 |
| 검색 결과 응답 | < 500ms | < 500ms | Console 측정 |
| 자동완성 응답 | < 200ms | < 200ms | Console 측정 |
| 이미지 업로드 (1MB) | < 3s | < 3s | 측정 |
| 실시간 알림 지연 | < 2s | < 1s | 수동 측정 |
| 실시간 메시지 지연 | < 2s | < 1s | 수동 측정 |

### 5.2 성능 테스트 시나리오

#### PERF-01: 대량 데이터 조회

```
1. 게시물 100개 이상인 살롱 페이지 로드 시간 측정
2. 검색 결과 50건 이상일 때 응답 시간 측정
3. 팔로워 50명 이상인 사용자 프로필 로드 시간 측정
```

#### PERF-02: 동시 요청

```
1. 동시에 5개 탭에서 같은 살롱 페이지 로드
2. 연속으로 평점 10개 빠르게 변경
3. 이미지 3장 동시 업로드
```

#### PERF-03: 실시간 성능

```
1. 알림 발생부터 UI 표시까지 시간 측정
2. 채팅 메시지 전송부터 상대방 수신까지 시간 측정
```

---

## 6. 보안 검증 (RLS 정책)

### 6.1 RLS 정책 테스트 시나리오

#### SEC-RLS-01: 사용자 데이터 접근 제어

| 테스트 케이스 | 예상 결과 |
|--------------|----------|
| 비인증 사용자가 users 조회 | 허용 (공개 프로필) |
| 비인증 사용자가 users 수정 | 거부 |
| 인증 사용자가 타인 프로필 수정 | 거부 |
| 인증 사용자가 본인 프로필 수정 | 허용 |

#### SEC-RLS-02: 게시물/댓글 접근 제어

| 테스트 케이스 | 예상 결과 |
|--------------|----------|
| 비인증 사용자가 posts 조회 | 허용 |
| 비인증 사용자가 posts 작성 | 거부 |
| 인증 사용자가 타인 게시물 삭제 | 거부 |
| 인증 사용자가 본인 게시물 삭제 | 허용 |

#### SEC-RLS-03: 알림/메시지 접근 제어

| 테스트 케이스 | 예상 결과 |
|--------------|----------|
| 타인의 notifications 조회 | 거부 |
| 타인의 messages 조회 | 거부 |
| 본인의 notifications 조회 | 허용 |
| 참여 중인 채팅방 messages 조회 | 허용 |

### 6.2 Storage 정책 테스트

| 테스트 케이스 | 예상 결과 |
|--------------|----------|
| 비인증 사용자가 프로필 이미지 업로드 | 거부 |
| 인증 사용자가 타인 폴더에 업로드 | 거부 |
| 인증 사용자가 본인 폴더에 업로드 | 허용 |
| 누구나 public 이미지 조회 | 허용 |

---

## 7. 테스트 환경 요구사항

### 7.1 Staging 환경

| 항목 | 요구사항 |
|------|----------|
| **Supabase 프로젝트** | 별도 Staging 프로젝트 또는 Development 환경 |
| **데이터** | Firebase에서 마이그레이션된 전체 데이터 |
| **OAuth 설정** | 카카오/구글 OAuth (테스트용 redirect URI) |
| **Vercel Preview** | PR 별 자동 배포 또는 수동 배포 |

### 7.2 테스트 데이터 준비

**마이그레이션 데이터 검증용:**
- Firebase에서 export한 원본 데이터 (JSON)
- 마이그레이션 전후 카운트 비교 스프레드시트

**신규 테스트 데이터:**
- 테스트 사용자 계정 2개 (카카오, 구글)
- 테스트 살롱 3개
- 테스트 게시물 10개 (이미지 포함 5개)
- 테스트 댓글 20개

### 7.3 테스트 도구

| 도구 | 용도 |
|------|------|
| **Chrome DevTools** | 네트워크 성능, 콘솔 에러 확인 |
| **Supabase Studio** | 직접 데이터베이스 쿼리, RLS 테스트 |
| **Playwright** | E2E 자동화 테스트 (선택) |
| **Postman** | API 직접 호출 테스트 (선택) |

---

## 8. 합격 기준 (Pass Criteria)

### 8.1 기능 테스트 합격 기준

| 기준 | 조건 |
|------|------|
| **P0 시나리오** | 100% 통과 필수 |
| **P1 시나리오** | 90% 이상 통과 |
| **Blocker 이슈** | 0건 |
| **Critical 이슈** | 0건 |
| **Major 이슈** | 5건 이내 (차기 수정 가능) |

### 8.2 데이터 무결성 합격 기준

| 기준 | 조건 |
|------|------|
| **데이터 건수 일치율** | 100% (users, forums, posts, comments) |
| **필수 FK 무결성** | 고아 레코드 0건 |
| **카운트 필드 정합성** | 불일치 0건 |
| **이미지 URL 접근** | 샘플 100% 접근 가능 |

### 8.3 성능 합격 기준

| 기준 | 조건 |
|------|------|
| **API 응답 시간** | Firebase 대비 동등 또는 개선 |
| **실시간 지연** | < 1초 (알림, 메시지) |
| **이미지 업로드** | < 5초 (5MB 기준) |
| **페이지 로드** | < 3초 (초기 로딩) |

### 8.4 보안 합격 기준

| 기준 | 조건 |
|------|------|
| **RLS 정책** | 모든 테스트 케이스 통과 |
| **Storage 정책** | 모든 테스트 케이스 통과 |
| **인증 보안** | 세션 관리, 토큰 갱신 정상 |

### 8.5 최종 배포 승인 조건

```
[ ] 기능 테스트 합격 기준 충족
[ ] 데이터 무결성 합격 기준 충족
[ ] 성능 합격 기준 충족
[ ] 보안 합격 기준 충족
[ ] 롤백 계획 검토 완료
[ ] CEO 최종 승인
```

---

## 9. 일정 및 산출물

### 9.1 QA 일정 (예상)

| 단계 | 기간 | 산출물 |
|------|------|--------|
| QA 계획 수립 | 0.5일 | QA-PLAN-MIGRATION-v0.4.0.md (본 문서) |
| 기능 회귀 테스트 | 2일 | 시나리오 실행 결과 |
| 데이터 무결성 검증 | 1일 | 데이터 검증 보고서 |
| 성능 비교 테스트 | 0.5일 | 성능 측정 결과 |
| 보안 검증 | 0.5일 | RLS 테스트 결과 |
| 최종 검증 및 보고 | 0.5일 | QA-REPORT-MIGRATION-v0.4.0.md |
| **총 기간** | **5일** | |

### 9.2 산출물 목록

1. **QA-PLAN-MIGRATION-v0.4.0.md** - 본 문서
2. **QA-REPORT-MIGRATION-v0.4.0.md** - 최종 QA 보고서
3. **데이터 검증 스프레드시트** - Firebase vs Supabase 데이터 비교
4. **성능 측정 결과** - Firebase vs Supabase 성능 비교

---

## 10. 리스크 및 완화 방안

| 리스크 | 영향 | 가능성 | 완화 방안 |
|--------|------|--------|----------|
| OAuth 설정 오류 | 높음 | 중간 | 개발 단계에서 사전 테스트 |
| 데이터 마이그레이션 누락 | 높음 | 낮음 | 마이그레이션 스크립트 검토, 건수 비교 |
| RLS 정책 오류 | 높음 | 중간 | Supabase Studio에서 사전 테스트 |
| 실시간 기능 불안정 | 중간 | 중간 | 폴링 폴백 구현 여부 확인 |
| 이미지 URL 깨짐 | 중간 | 낮음 | URL 매핑 또는 마이그레이션 전략 확인 |
| 성능 저하 | 중간 | 낮음 | 인덱스 최적화, 쿼리 튜닝 |

---

## 11. 비고

### 11.1 v0.3.0 QA와의 차이점

| 구분 | v0.3.0 QA | v0.4.0 마이그레이션 QA |
|------|-----------|----------------------|
| **초점** | 신규 기능 검증 | 기존 기능 동등성 + 데이터 무결성 |
| **데이터** | 신규 테스트 데이터 | 마이그레이션 + 신규 데이터 |
| **환경** | Firebase | Supabase |
| **추가 검증** | - | RLS 보안, 성능 비교 |

### 11.2 회귀 테스트 범위

v0.3.0 QA 계획의 모든 시나리오를 Supabase 환경에서 재실행:
- 태그 시스템 (SC-TAG-01 ~ SC-TAG-03)
- 검색 개선 (SC-SEARCH-01 ~ SC-SEARCH-03)
- 이미지 업로드 (SC-IMG-01 ~ SC-IMG-04)
- 평점 시스템 (SC-RATE-01 ~ SC-RATE-03)
- 브라우저 네비게이션 (SC-NAV-01 ~ SC-NAV-02)
- 모바일 시나리오 (SC-MOBILE-01 ~ SC-MOBILE-02)
- 에러 처리 (SC-ERR-01 ~ SC-ERR-02)

---

*작성: QA Engineer | 2026-02-05*
*다음 단계: 개발 완료 후 QA 실행*
