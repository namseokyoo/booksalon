# 북살롱 Auth 아키텍처 문서

> **최종 업데이트**: 2026-03-03
> **작성 배경**: Auth/ForumList Timeout 버그 6번 수정 끝에 확립된 최종 아키텍처. 다시는 이 삽질을 반복하지 않기 위한 강력한 기록.
> **관련 커밋**: f502e86, e1b6e1d, e7bed08, 416d670, 12d31f1

---

## 1. 개요

북살롱은 Supabase Auth를 사용하며, 2026-03-03 기준으로 아래 아키텍처가 확립되었다.

### 핵심 원칙

1. **Auth 초기화 경로는 단일화** — `INITIAL_SESSION` 이벤트 하나만 사용
2. **공개 데이터는 Auth와 완전 분리** — `supabaseAnon` 클라이언트 사용
3. **Navigator Lock 비활성화** — hang 방지
4. **Context userProfile을 직접 사용** — 컴포넌트 자체 로드 금지

---

## 2. 클라이언트 구조 (`lib/supabase.ts`)

```
supabase (인증 클라이언트)
├── autoRefreshToken: true
├── persistSession: true
├── detectSessionInUrl: true
└── lock: async (_n, _t, fn) => fn()  ← Navigator Lock 비활성화 (중요!)

supabaseAnon (공개 데이터 전용 클라이언트)
├── persistSession: false
├── autoRefreshToken: false
└── detectSessionInUrl: false
```

### 어떤 클라이언트를 언제 사용하는가

| 상황 | 클라이언트 | 이유 |
|------|-----------|------|
| 포럼 목록 조회 (공개) | `supabaseAnon` | Auth hang과 독립 |
| 포럼 글 목록 조회 (공개) | `supabaseAnon` | Auth hang과 독립 |
| 책 정보 조회 (공개) | `supabaseAnon` | Auth hang과 독립 |
| 로그인 / 로그아웃 | `supabase` | Auth 클라이언트 필수 |
| 사용자 프로필 조회 | `supabase` | 세션 필요 |
| 글 작성 / 수정 / 삭제 | `supabase` | 인증 필요 |
| 좋아요 / 북마크 | `supabase` | 인증 필요 |

**규칙**: 로그인 없이 볼 수 있는 데이터는 무조건 `supabaseAnon` 사용.

---

## 3. Auth 초기화 흐름 (`contexts/SupabaseAuthContext.tsx`)

### 현재 구조 (올바름)

```
앱 시작
    ↓
SupabaseAuthProvider 마운트
    ↓
safetyTimeout 30초 설정
    ↓
onAuthStateChange 구독 등록
    ↓
[즉시] INITIAL_SESSION 이벤트 발화 (Supabase v2 보장)
    ↓
session 있음? → setCurrentUser → loadOrCreateProfile → setLoading(false)
session 없음? → setCurrentUser(null) → setLoading(false)
```

### 이벤트 처리 테이블

| 이벤트 | 처리 내용 |
|--------|----------|
| `INITIAL_SESSION` | 초기화 완료 — `loading: false` 설정. 세션 있으면 user + profile 세팅 |
| `SIGNED_IN` | user + profile 세팅 (로그인 성공 시) |
| `SIGNED_OUT` | user, profile null로 초기화 |
| `TOKEN_REFRESHED` | user 업데이트 (profile 불필요) |
| `USER_UPDATED` | user + profile 재로드 |

### Safety Timeout

- 30초 후 `INITIAL_SESSION`이 발화하지 않는 극단적 경우 대비
- `setLoading(false)` 강제 실행으로 앱이 무한 로딩 상태에 빠지지 않음
- **절대 줄이지 말 것** — 5초로 줄였다가 무한 스핀 발생한 이력이 있음 (커밋 617888b 참조)

---

## 4. Navigator Lock 비활성화 이유

Supabase SDK는 기본적으로 `initialize()` 실행 시 Web Locks API로 Navigator Lock을 획득한다.

**문제**:
- 만료된 토큰 리프레시 HTTP 요청이 hang하면 (Supabase cold start 등)
- Lock이 해제되지 않음
- 이후 **모든 Supabase 쿼리가 `initializePromise` 대기로 블로킹**
- 로그아웃 버튼조차 작동 안 하는 완전 freeze 발생

**해결** (`lib/supabase.ts`):
```typescript
auth: {
  lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<unknown>) => fn(),
}
```

**이 설정을 제거하지 말 것.** 단일 사용자 앱에서 multi-tab lock은 불필요하다.

---

## 5. Context 구조

```typescript
interface SupabaseAuthContextType {
  currentUser: CompatibleUser | null    // Supabase User + uid (Firebase 호환)
  userProfile: UserProfile | null       // DB users 테이블 데이터
  loading: boolean                      // Auth 초기화 완료 여부
  signup: (email, password) => ...
  login: (email, password) => ...
  loginWithGoogle: () => ...
  loginWithKakao: () => ...
  logout: () => ...
  deleteAccount: () => ...
  refreshProfile: () => ...
}
```

### `currentUser` vs `userProfile`

| 필드 | 출처 | 내용 |
|------|------|------|
| `currentUser` | Supabase `auth.users` | 인증 정보 (email, uid, provider 등) |
| `userProfile` | `public.users` DB 테이블 | 앱 프로필 (nickname, avatar, 포인트 등) |

---

## 6. 컴포넌트에서 사용 방법

### Auth 정보 접근

```typescript
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext'

function MyComponent() {
  const { currentUser, userProfile, loading } = useSupabaseAuth()

  // loading 중에는 렌더링 지연
  if (loading) return <Spinner />

  // 로그인 여부 확인
  if (!currentUser) return <LoginPrompt />

  // 프로필 사용
  return <div>{userProfile?.nickname}</div>
}
```

### 공개 데이터 쿼리

```typescript
import { supabaseAnon } from '../lib/supabase'

// ForumList, BookList 등 공개 목록
const { data, error } = await supabaseAnon
  .from('forums')
  .select('*')
  .order('created_at', { ascending: false })
```

### 인증 필요 데이터 쿼리

```typescript
import { supabase } from '../lib/supabase'

// 글 작성, 좋아요 등 인증 필요
const { data, error } = await supabase
  .from('posts')
  .insert({ ... })
```

---

## 7. 수정 금지 패턴 (하지 말아야 할 것)

### 절대 금지 1: `initializeAuth()` 함수 부활

```typescript
// 절대 하지 말 것
async function initializeAuth() {
  const { data } = await supabase.auth.getSession()  // 이중 초기화 경로
  setCurrentUser(data.session?.user ?? null)
  setLoading(false)
}

useEffect(() => {
  initializeAuth()                    // 경로 A
  onAuthStateChange(...)              // 경로 B — Race Condition 발생!
}, [])
```

**이유**: 두 경로가 병렬 실행되면 `setCurrentUser`가 최대 3회 호출된다. timeout이 INITIAL_SESSION보다 먼저 발동하면 인증된 사용자가 미인증으로 렌더링된다.

### 절대 금지 2: 공개 쿼리에 `supabase` 클라이언트 사용

```typescript
// 하지 말 것 — Auth hang 시 공개 데이터도 블로킹됨
const { data } = await supabase.from('forums').select('*')

// 올바름
const { data } = await supabaseAnon.from('forums').select('*')
```

### 절대 금지 3: 컴포넌트 자체에서 userProfile 비동기 로드

```typescript
// 하지 말 것 — Header.tsx의 실수였음
function Header() {
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    // 자체 프로필 로드 → currentUser 세팅 후 profile null 구간 → 깜빡임
    UserService.getUserProfile(userId).then(setProfile)
  }, [userId])
}

// 올바름 — Context에서 직접 사용
function Header() {
  const { userProfile } = useSupabaseAuth()  // 이미 로드되어 있음
  return <div>{userProfile?.nickname}</div>
}
```

### 절대 금지 4: Navigator Lock 설정 제거

```typescript
// 제거하지 말 것
export const supabase = createClient(url, key, {
  auth: {
    // 이 설정 제거하면 cold start 상황에서 freeze 재발
    lock: async (_name, _acquireTimeout, fn) => fn(),
  }
})
```

### 절대 금지 5: Safety Timeout 단축

```typescript
// 30초 미만으로 줄이지 말 것
const safetyTimeout = setTimeout(() => {
  setLoading(false)
}, 30000)  // 5초로 줄였다가 무한 스핀 발생한 이력 있음 (커밋 617888b)
```

### 절대 금지 6: hang 중인 Promise를 await

```typescript
// 하지 말 것 — hang이 UI로 전파됨
const safetyTimer = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
const result = await Promise.race([supabase.auth.getSession(), safetyTimer])
// → safetyTimer가 먼저 reject해도 getSession()의 hang은 계속 진행 중
// → 이후 INITIAL_SESSION 이벤트와 충돌
```

---

## 8. 버그 이력 (2026-03-03)

| 커밋 | 변경 내용 | 결과 | 교훈 |
|------|----------|------|------|
| `f502e86` | ForumList `authLoading` 가드 추가 | 효과 미미 | 증상 가림, 근본 미해결 |
| `617888b` | Auth timeout 시 `await sessionPromise` 추가 | 무한 스핀 → 즉시 롤백 | hang Promise를 await하면 hang 전파 |
| `6a98d67` | 617888b revert | — | 잘못된 방향 즉시 롤백 올바름 |
| `e1b6e1d` | Navigator Lock 비활성화 | 부분 개선 | Lock 해제만으로는 이중 초기화 미해결 |
| `e7bed08` | 이중 초기화 제거 (INITIAL_SESSION 단일화) | 주요 개선 | 핵심, 단 Anon 분리 미완 |
| `416d670` | Header.tsx 자체 로드 제거 → Context 직접 사용 | 이름 깜빡임 해결 | 마이그레이션 누락 컴포넌트 발견 |
| `12d31f1` | ForumList 공개 쿼리 `supabaseAnon` 분리 | **최종 해결** | 공개 데이터는 Auth와 독립 필수 |

---

## 9. 향후 수정 시 체크리스트

새로운 컴포넌트/기능 추가 시 반드시 확인:

```
Auth 관련:
[ ] 공개 데이터 쿼리는 supabaseAnon을 사용하는가?
[ ] 인증이 필요한 쿼리만 supabase를 사용하는가?
[ ] 컴포넌트가 userProfile을 자체 로드하지 않고 Context에서 가져오는가?
[ ] initializeAuth() 같은 별도 초기화 함수를 추가하지 않는가?

SupabaseAuthContext.tsx 수정 시:
[ ] INITIAL_SESSION 단일 경로를 유지하는가?
[ ] onAuthStateChange 외에 별도 초기화 경로를 추가하지 않는가?
[ ] Safety timeout을 30초 미만으로 줄이지 않는가?

lib/supabase.ts 수정 시:
[ ] Navigator Lock 설정(lock: async)이 유지되는가?
[ ] supabaseAnon 클라이언트가 유지되는가?
```
