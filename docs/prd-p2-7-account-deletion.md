# PRD: 계정 삭제 완전 구현 (P2-7)

> 작성일: 2026-03-04
> 담당: 튜링(Fullstack Dev), 해밀턴(QA), 토발즈(DevOps)
> 백로그: BL-107
> 등급: S (보안 크리티컬)
> 브랜치: `feature/p2-7-account-deletion`

---

## 배경 및 목적

현재 계정 삭제 기능은 두 가지 진입점을 통해 호출되지만, 실제 삭제는 불완전하게 구현되어 있다.

### 현재 진입점 구조

1. **ProfilePage.tsx (줄 720~779)** — "위험 구역" 섹션 내 3단계 인라인 확인 UI
   - `deleteStep` state (0|1|2)로 단계 관리
   - Step 0: "계정 삭제" 버튼 노출
   - Step 1: 1차 경고 + "계속 진행" / "취소" 버튼
   - Step 2: `deleteConfirmText === '삭제'` 텍스트 입력 확인 후 `onDeleteClick()` 호출
   - `onDeleteClick` prop은 App.tsx에서 `() => setDeleteModalOpen(true)` 로 연결됨

2. **DeleteAccountModal.tsx** — 최종 확인 모달
   - `useAuth()`의 `deleteAccount()`를 직접 호출 (줄 12, 55)
   - "네, 탈퇴합니다." / "취소" 버튼
   - 오류 발생 시 에러 메시지 표시

### 현재 deleteAccount() 구현 (SupabaseAuthContext.tsx 줄 209~226)

```typescript
const deleteAccount = async () => {
  const authId = await getCurrentAuthId()
  if (!authId) {
    throw new Error('로그인된 사용자가 없습니다.')
  }

  // 프로필 비활성화 (is_active: false, deactivated_by: 'user_deletion_request')
  if (userProfile) {
    await UserService.deactivateUser(userProfile.id, 'user_deletion_request')
  }

  // 로그아웃 처리
  await logout()

  // 실제 auth.users 삭제는 이루어지지 않음
  console.warn('계정 삭제 요청됨. 완전한 삭제는 관리자에게 문의하세요.')
}
```

### 문제점

| 항목 | 현재 상태 | 목표 상태 |
|------|----------|----------|
| auth.users 삭제 | 미수행 (비활성화만) | 완전 삭제 |
| GDPR 준수 | 미충족 | 충족 |
| 재가입 가능 여부 | 불가 (auth 레코드 잔존) | 가능 |
| 데이터 처리 | is_active=false만 | CASCADE + 완전 제거 |

---

## 요구사항 (FR)

### FR-1: auth.users 완전 삭제
- Supabase Admin API(`supabase.auth.admin.deleteUser(authId)`)를 사용하여 `auth.users` 레코드를 삭제해야 한다.
- 이 API는 `SERVICE_ROLE_KEY`가 필요하므로, **반드시 서버 사이드(Edge Function)에서만 실행**해야 한다.
- 클라이언트(브라우저)에서 직접 호출 불가.

### FR-2: 연관 데이터 처리
- `auth.users` 삭제 시 `users` 테이블의 `auth_id` 컬럼이 `ON DELETE CASCADE` (스키마 확인 완료: `20260206071841_initial_schema.sql` 줄 18)로 설정되어 있으므로, `users` 테이블 레코드는 자동 삭제됨.
- `users` 테이블 삭제 시 `ON DELETE CASCADE`로 연결된 하위 테이블은 자동 삭제됨:
  - `user_social_links` (줄 49)
  - `user_notification_settings` (줄 62)
  - `user_favorite_genres` (줄 79)
  - `posts` (줄 147)
  - `comments` (줄 207)
  - `post_likes` (줄 194)
  - `comment_likes` (줄 222)
  - `ratings` (줄 242)
  - `bookmarks` (줄 272)
  - `follows` — follower_id, following_id 양방향 (줄 286)
  - `activities` (줄 306)
  - `notifications` (줄 320)
  - `chat_room_participants` (줄 350)
  - `messages` — sender_id, receiver_id (줄 364)
  - `admins` (줄 384)
  - `reports` — reporter_id CASCADE (줄 400)
- `reports.reported_user_id`는 `ON DELETE SET NULL`이므로 수동 삭제 불필요 (데이터 보전).

### FR-3: 삭제 원자성
- Edge Function 내에서 `auth.users` 삭제 실패 시 에러를 반환하고, 클라이언트는 사용자에게 실패를 안내해야 한다.
- `users.is_active = false` 사전 처리는 폐기하고, auth 삭제 → CASCADE 단일 흐름으로 통일한다.

### FR-4: UX — 삭제 완료 후 처리
- 삭제 성공 시 즉시 로그아웃 상태로 전환되고 홈(포럼 목록)으로 이동해야 한다.
- DeleteAccountModal이 닫히면서 App.tsx의 `currentView`가 기본값으로 복귀해야 한다.

### FR-5: UX — 진입점 중복 문제 해결
- 현재 ProfilePage의 인라인 3단계 확인(deleteStep)과 DeleteAccountModal이 중복으로 존재한다.
- 두 경로 모두 최종적으로 동일한 Edge Function을 호출하도록 통일한다.
- 단, UI 변경은 이번 P2-7 범위에서 최소화하여 기존 2단계 확인 흐름(ProfilePage 줄 720~779 → DeleteAccountModal)을 유지한다.

---

## 비기능 요구사항 (NFR)

| 항목 | 요구사항 |
|------|---------|
| 보안 | `SERVICE_ROLE_KEY`는 Edge Function 환경변수로만 사용. 클라이언트 번들에 절대 포함 금지 |
| 보안 | Edge Function 호출 시 현재 사용자의 JWT를 검증하여 본인만 삭제 가능하도록 강제 |
| 원자성 | auth.users 삭제 실패 시 롤백(CASCADE 미발생). 에러 반환 필수 |
| 응답 속도 | Edge Function 응답 5초 이내 |
| UX | 삭제 처리 중 로딩 표시 (DeleteAccountModal의 기존 loading state 활용) |
| UX | 삭제 완료 후 즉시 로그아웃 + 홈으로 이동 |
| GDPR | 사용자 요청 시 auth.users까지 완전 삭제하여 개인정보 완전 제거 보장 |

---

## 기술 설계

### Supabase Edge Function

**엔드포인트**: `POST /functions/v1/delete-account`

**인증 방식**:
- `Authorization: Bearer <user_jwt>` 헤더 필수
- Edge Function 내에서 `supabase.auth.getUser(jwt)`로 호출자 검증
- 검증된 `user.id`(auth_id)만 삭제 대상으로 사용 (요청 바디의 user_id 신뢰 금지)

**처리 흐름**:
```
1. JWT에서 auth_id 추출 및 검증
2. supabase.auth.admin.deleteUser(auth_id) 호출
   → auth.users 레코드 삭제
   → CASCADE: users 테이블 삭제
   → CASCADE: 하위 모든 테이블 연쇄 삭제
3. 성공 시 { success: true } 반환
4. 실패 시 { error: "삭제 실패 사유" } + HTTP 500 반환
```

**환경변수 (Edge Function)**:
- `SUPABASE_URL` — 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY` — Admin API 접근용 (서비스 롤 키)

### 클라이언트 변경

**SupabaseAuthContext.tsx — `deleteAccount()` 함수 (줄 209~226) 수정**

현재 구현 대신:
1. 현재 세션에서 JWT 토큰 가져오기 (`supabase.auth.getSession()`)
2. `fetch('/functions/v1/delete-account', { method: 'POST', headers: { Authorization: Bearer <jwt> } })` 호출
3. 응답 확인: 성공이면 `logout()` 호출, 실패이면 에러 throw

변경 후 `UserService.deactivateUser()` 호출 제거 (is_active 처리 불필요).

**DeleteAccountModal.tsx (줄 51~62) — 변경 없음**
- `deleteAccount()` 호출 및 에러 처리 로직은 그대로 유지
- 에러 메시지 문구는 그대로 유지 ("계정 삭제에 실패했습니다. 다시 로그인한 후 시도해주세요.")

**ProfilePage.tsx — 변경 없음**
- 인라인 3단계 UI(줄 720~779)는 그대로 유지
- `onDeleteClick` prop 연결 방식 변경 없음

### 새로 생성할 파일

```
supabase/functions/delete-account/index.ts   # Edge Function 본체
```

---

## 환경변수

| 변수명 | 위치 | 용도 |
|--------|------|------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API | Edge Function에서 Admin API 사용 |
| `SUPABASE_URL` | Supabase Dashboard > Project Settings > API | Edge Function 내 Supabase 클라이언트 초기화 |

> 참고: 클라이언트의 `.env.local`에는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 유지. `SERVICE_ROLE_KEY`는 클라이언트 환경변수에 절대 추가 금지.

---

## 완료 기준 (DoD)

### 개발 (튜링)
- [ ] `supabase/functions/delete-account/index.ts` Edge Function 구현 완료
- [ ] JWT 검증 로직 포함 (본인만 삭제 가능)
- [ ] `SupabaseAuthContext.tsx`의 `deleteAccount()` 함수 Edge Function 호출로 교체
- [ ] `UserService.deactivateUser()` 호출 제거
- [ ] 로컬 `supabase functions serve`로 Edge Function 동작 확인

### QA (해밀턴)
- [ ] 정상 흐름: 로그인 상태에서 계정 삭제 → auth.users 레코드 사라짐 확인 (Supabase Dashboard)
- [ ] 정상 흐름: 삭제 후 홈으로 이동 + 로그아웃 상태 확인
- [ ] 정상 흐름: 삭제된 이메일로 재가입 가능 여부 확인
- [ ] 보안: 다른 user_id를 직접 요청 바디에 넣어도 본인 auth_id로만 삭제되는지 확인
- [ ] 보안: JWT 없이 Edge Function 직접 호출 시 401 반환 확인
- [ ] 실패 케이스: Edge Function 에러 시 DeleteAccountModal에 에러 메시지 표시 확인
- [ ] CASCADE 검증: users 테이블의 posts, comments, bookmarks 등 하위 데이터도 삭제됨 확인

### 배포 (토발즈)
- [ ] Supabase Edge Function 배포: `supabase functions deploy delete-account`
- [ ] Supabase Dashboard에서 `SUPABASE_SERVICE_ROLE_KEY` 환경변수 설정 확인
- [ ] 배포 환경에서 계정 삭제 E2E 테스트 1회 실행
- [ ] Vercel 재배포 (클라이언트 코드 변경 반영)

---

## 위험 요소

| 위험 | 수준 | 대응 |
|------|------|------|
| 삭제 후 롤백 불가 | 매우 높음 | DeleteAccountModal의 기존 확인 단계 유지. ProfilePage 3단계 확인 유지. |
| auth.users 삭제 성공 + 클라이언트 logout 실패 | 중간 | logout 실패해도 세션 만료로 자동 처리됨. 사용자 안내 메시지 표시. |
| Edge Function cold start 지연 | 낮음 | 로딩 표시(loading state) 기존 구현으로 대응 |
| CASCADE로 의도치 않은 데이터 삭제 | 낮음 | 현재 스키마 CASCADE 정책은 설계 의도와 일치. `reports.reported_user_id`는 SET NULL이므로 신고 이력 보전됨. |
| SERVICE_ROLE_KEY 노출 | 매우 높음 | Edge Function 환경변수에만 보관. 코드 하드코딩 및 클라이언트 번들 포함 절대 금지. |

---

## 참고 파일

| 파일 | 용도 |
|------|------|
| `contexts/SupabaseAuthContext.tsx` | `deleteAccount()` 수정 대상 (줄 209~226) |
| `components/DeleteAccountModal.tsx` | 최종 확인 모달 (변경 없음) |
| `components/ProfilePage.tsx` | 3단계 인라인 확인 UI (줄 720~779, 변경 없음) |
| `App.tsx` | deleteModalOpen state 및 DeleteAccountModal 렌더링 (줄 91, 304) |
| `supabase/migrations/20260206071841_initial_schema.sql` | CASCADE 정책 확인 (줄 18) |
| `supabase/functions/delete-account/index.ts` | 신규 생성 대상 |
