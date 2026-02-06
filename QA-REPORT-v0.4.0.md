# QA 검증 보고서: BookSalon v0.4.0

## 1. 검증 요약
- **프로젝트**: BookSalon
- **버전**: v0.4.0 (Supabase Migration)
- **검증일**: 2026-02-06
- **검증자**: QA Engineer
- **판정**: ❌ **반려 (Blocker 이슈)**

---

## 2. 시나리오 실행 결과

### 요약
| 우선순위 | 총 시나리오 | Pass | Fail | Blocked | 통과율 |
|---------|-----------|------|------|---------|--------|
| P0 | 7 | 0 | 0 | 7 | 0% |
| P1 | 6 | 0 | 0 | 6 | 0% |
| P2 | 4 | 0 | 0 | 4 | 0% |
| **전체** | **17** | **0** | **0** | **17** | **0%** |

### 상세 결과

| 시나리오 ID | 시나리오명 | 페르소나 | 우선순위 | 결과 | 비고 |
|------------|-----------|---------|---------|------|------|
| SC-001 | 회원가입 | 신규 방문자 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-002 | 로그인 | 활성 사용자 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-003 | 프로필 조회 | 활성 사용자 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-004 | 게시물 작성 | 활성 사용자 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-005 | 게시물 조회 | 모바일 사용자 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-006 | 평점 등록 | 활성 사용자 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-007 | 북마크 추가 | 소셜 활동 중심 | P0 | 🚧 Blocked | BLOCKER-001 |
| SC-008 ~ SC-017 | (P1/P2 시나리오) | - | P1/P2 | 🚧 Blocked | BLOCKER-001 |

---

## 3. 발견된 이슈

### Blocker 이슈

#### BLOCKER-001: Vercel 프로덕션 환경 변수 미설정

| 항목 | 내용 |
|------|------|
| **심각도** | 🔴 Blocker |
| **영향 범위** | 전체 서비스 사용 불가 |
| **발견 시나리오** | SC-001 (회원가입) |
| **재현 방법** | 1. https://booksalon-nine.vercel.app 접속<br>2. 회원가입 시도<br>3. 폼 제출 시 무반응 |
| **원인** | Vercel 프로덕션 환경에 Supabase 환경 변수 미설정 |
| **상세 설명** | `vercel env ls` 실행 결과 "No Environment Variables found" 출력.<br>필수 환경 변수 누락:<br>- `VITE_SUPABASE_URL`<br>- `VITE_SUPABASE_ANON_KEY`<br>- `VITE_KAKAO_API_KEY` (도서 검색용) |
| **예상 영향** | - 인증 불가 (회원가입/로그인)<br>- DB 연결 불가 (프로필, 게시물, 북마크 등 전체 기능)<br>- 도서 검색 불가 |
| **즉시 조치 필요** | ✅ Yes |
| **수정 방법** | 1. Vercel 대시보드 → booksalon 프로젝트<br>2. Settings → Environment Variables<br>3. 필수 변수 추가:<br>   - `VITE_SUPABASE_URL`<br>   - `VITE_SUPABASE_ANON_KEY`<br>   - `VITE_KAKAO_API_KEY`<br>4. 재배포 실행 |

#### 스크린샷 증거
- `05_signup_form_filled.png`: 회원가입 폼 작성 완료
- `06_after_signup_submit.png`: 제출 후 무반응 (버튼만 disabled)
- `07_signup_wait_longer.png`: 10초 대기 후에도 진행 없음

#### 콘솔 로그 증거
```
[log] ⚠️ No user, skipping Socket.IO connection
[error] Failed to load resource: the server responded with a status of 404 ()
```

---

## 4. 테스트 커버리지

### 실행 결과
- **기능 테스트**: 0개 케이스 중 0개 통과 (0%) - 환경 문제로 실행 불가
- **회귀 테스트**: 0개 케이스 중 0개 통과 (0%) - 환경 문제로 실행 불가
- **자동화 테스트**: 실행 불가

### 검증한 영역
- ✅ 랜딩 페이지 접속 가능
- ✅ 역할 선택 페이지 정상 표시
- ✅ 회원가입 폼 UI 정상 표시
- ❌ 회원가입 기능 동작 - **Blocker**
- ❌ 인증 기능 전체 - **Blocker**
- ❌ 데이터베이스 연동 - **Blocker**

---

## 5. 판정

### 릴리즈 판단

| 기준 | 결과 | 상태 |
|------|------|------|
| **P0 시나리오** | 0/7 Pass (0%) | ❌ 미달성 |
| **Blocker 이슈** | 1건 존재 | ❌ |
| **Critical 이슈** | 0건 | ✅ |

### ❌ 반려 (Reject)

**반려 사유**:
1. **Blocker 이슈 존재**: BLOCKER-001 (환경 변수 미설정)
2. **P0 시나리오 전체 실패**: 모든 핵심 기능 동작 불가
3. **서비스 사용 불가 상태**: 사용자가 어떤 기능도 사용할 수 없음

**필수 조치**:
- [ ] Vercel 환경 변수 설정 (BLOCKER-001 수정)
- [ ] 재배포 실행
- [ ] 프로덕션 환경에서 재검증

---

## 6. 권장 사항

### 즉시 조치 (배포 전 필수)
1. **환경 변수 설정**
   - Vercel 대시보드에서 Supabase 환경 변수 추가
   - 카카오 API 키 설정
   - 재배포 후 검증

2. **배포 전 체크리스트 보완**
   - 환경 변수 검증 단계 추가
   - 프로덕션 스모크 테스트 필수화

### 장기 개선 사항
1. **CI/CD 환경 변수 검증**
   - 배포 전 필수 환경 변수 존재 여부 자동 확인
   - 환경 변수 누락 시 배포 차단

2. **프로덕션 헬스 체크**
   - `/health` 엔드포인트 추가
   - Supabase 연결 상태 확인 API

3. **모니터링 강화**
   - Sentry 또는 Firebase Crashlytics 연동
   - 환경 변수 누락 시 즉시 알림

---

## 7. 첨부 자료

### 스크린샷
- `01_homepage_initial.png`: 랜딩 페이지 정상 로드
- `02_signup_button_clicked.png`: "Get Started Free" 클릭
- `03_role_selection_page.png`: 역할 선택 페이지 (정상)
- `04_signup_modal.png`: Customer 선택 후
- `05_signup_form_filled.png`: 회원가입 폼 작성 완료
- `06_after_signup_submit.png`: 제출 후 무반응
- `07_signup_wait_longer.png`: 10초 대기 후에도 진행 없음

모든 스크린샷은 `~/Downloads/` 폴더에 저장됨.

### 환경 정보
- **테스트 URL**: https://booksalon-nine.vercel.app
- **테스트 브라우저**: Chrome (Playwright Headful Mode)
- **테스트 해상도**: 1280x720
- **테스트 계정 (생성 시도)**: qa_test_v040@test.com

### 검증 커맨드 로그
```bash
$ vercel env ls
Vercel CLI 48.8.2
Retrieving project…
> No Environment Variables found for namseoks-projects/booksalon [192ms]
```

---

## 8. 다음 단계

### DevOps 팀에게 요청
1. Vercel 환경 변수 설정
2. 재배포 실행
3. 배포 완료 후 QA 팀에 알림

### QA 재검증 계획
환경 변수 설정 및 재배포 완료 후:
1. 프로덕션 URL 접속 확인
2. 배포된 커밋 해시 확인
3. 모든 P0 시나리오 재실행
4. 회귀 테스트 수행
5. 최종 QA 보고서 작성

---

**작성자**: QA Engineer
**작성일**: 2026-02-06
**검증 소요 시간**: 약 1.5시간 (환경 문제 조사 포함)

---

## 부록: v0.4.0 마이그레이션 체크리스트 (참고)

| 항목 | 상태 | 비고 |
|------|------|------|
| ✅ 코드 마이그레이션 | 완료 | Supabase 서비스 레이어 구현 |
| ✅ 타입 정의 | 완료 | `lib/database.types.ts` |
| ✅ 환경 변수 예시 | 완료 | `.env.example` 업데이트 |
| ❌ 프로덕션 환경 변수 설정 | **미완료** | **Blocker** |
| ❓ Supabase 테이블 생성 | 미확인 | 환경 변수 없어 확인 불가 |
| ❓ 데이터 마이그레이션 | 미확인 | Firebase → Supabase |

---

**QA 최종 결론**: v0.4.0은 현재 상태에서 **배포 불가**. 환경 변수 설정 후 재검증 필요.
