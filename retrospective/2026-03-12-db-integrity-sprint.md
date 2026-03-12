# 북살롱 DB 정합성 스프린트 회고

> 날짜: 2026-03-12
> 범위: DEC-149 — DB 스키마 vs 코드 정합성 전수 점검 + 수정 + BL-163/BL-164
> 작성: Company Historian (헤로도토스)

---

## 개요

| 항목 | 내용 |
|------|------|
| **기간** | 2026-03-12 (1일 스프린트) |
| **핵심 의사결정** | DEC-149 — 북살롱 DB 정합성 전수 점검 및 수정 |
| **완료 백로그** | BL-163 (PostService 추출), BL-164 (P2 잔여 정합성 수정) |
| **관련 커밋** | fe332d7, 07b8df4, 85cbfbd, 83cd842, 2c8485e (booksalon 레포) + 문서 커밋 (sidequestlab 레포) |
| **스프린트 횟수** | 5회 (Sprint 1~3, Pre-migration Safety Review, BL-163/164) |

---

## 잘한 점 (What Went Well)

### 1. 체계적 전수 감사

20개 테이블 전수 분석 후 P0/P1/P2 우선순위로 분류하고, Board Advisor 크로스체크를 거친 뒤 스프린트를 실행했다. 무작위 수정이 아닌 구조적 접근으로 이슈를 누락 없이 처리할 수 있었다.

### 2. 다층 리뷰 체계가 실제로 작동함

Board Advisor 1차 검토 → 풀스택 개발 → QA 검증 → Pre-migration Codex REJECT 리뷰까지 4단계 검증이 진행되었으며, 각 단계에서 서로 다른 이슈를 포착했다:

- **Board Advisor**: P1→P2 재분류 2건, 누락 이슈 3건 추가
- **QA Sprint 1**: double-decrement 버그 포착 (BUG-001)
- **Pre-migration REJECT**: 댓글 알림 중복, trigger scope, RPC 보안 3건 추가

### 3. Pre-migration Safety Review — 3건의 Critical 사전 차단

회장님 제안으로 프로덕션 적용 직전 독립적 재검토를 1회 추가했다. 이 단계에서 아래 3건의 Critical 이슈를 사전에 차단했다:

1. CommentService + PostDetail.tsx 양쪽에 알림 로직 존재 (중복 발송)
2. comment_count trigger가 대댓글도 카운트 (UI 표기와 불일치)
3. RPC SECURITY DEFINER에 auth.uid() 검증 미비 (인증 우회 가능)

이 단계 없었다면 프로덕션에서 3건이 모두 사용자 피해로 이어졌을 것이다.

### 4. 자동 파이프라인(DEC-028) 원활 작동

개발→QA→배포 연속 파이프라인이 중간 질문 없이 5회 연속 완주했다. 회장님 개입을 최소화하고 최종 결과만 보고하는 원칙이 안정적으로 작동했다.

### 5. 리팩터링까지 완주

긴급 수정(P0/P1)에서 멈추지 않고, BL-163 PostService 추출 + BL-164 P2 잔여 항목까지 같은 세션에서 마무리했다. 기술 부채가 축적되지 않았다.

---

## 아쉬운 점 (What Didn't Go Well)

### 1. 백로그 관리 부실

CEO가 아래 항목들의 상태를 파악하지 못한 채로 작업을 진행했고, 회장님이 직접 지적했다:

- BL-098: 이미 완료된 항목
- BL-143: 이미 구현된 다크모드 토큰
- BL-100~103: DEC-141로 폐지 결정된 봇 관련 항목 (여전히 활성 상태로 남아 있었음)

의사결정(DEC) 발생 시 관련 백로그 상태를 즉시 갱신했어야 했다.

### 2. 1차 Board Advisor 리뷰 불완전

Pre-migration 단계에서 3건의 Critical 이슈가 추가로 발견되었다. 최초 검토에서 놓친 것들이다:

- 서비스 레이어와 컴포넌트 양쪽에 알림 로직 중복 존재
- comment_count trigger가 대댓글도 포함하여 카운트
- RPC SECURITY DEFINER에 auth.uid() IS NOT NULL 검증 누락

### 3. Sprint 1 초회 반려 (BUG-001)

post_count 이중 차감 버그가 발생했다. DB Trigger 도입 시 기존 수동 카운터 코드를 제거하지 않아 Trigger와 기존 코드가 동시에 실행되었다. QA가 잡았지만, 개발 단계에서 "Trigger와 기존 코드의 중복 실행" 체크가 누락되었다.

---

## 교훈 (Lessons Learned)

### 1. 새 패턴: Pre-migration Safety Review

DB 스키마 변경은 코드 변경과 달리 롤백이 어렵다. 개발+QA 통과 후에도 프로덕션 적용 직전 독립적인 재검토를 1회 추가하는 것이 효과적이다.

이번 스프린트에서 이 단계를 통해 3건의 Critical 이슈를 사전 차단했다. 이 패턴을 정식 등록한다 (PAT-010).

**적용 방법**:
1. 마이그레이션 SQL 파일 전수 확인
2. 관련 코드와의 정합성 교차 검증 (Codex exec 또는 Board Advisor 활용)
3. SECURITY DEFINER RPC 보안 4항목 체크: search_path, auth.uid(), 입력 allowlist, REVOKE/GRANT
4. Trigger 도입 시 기존 수동 로직 grep 검색 → 중복 제거 확인

### 2. 새 패턴: Trigger 도입 시 기존 로직 제거 체크리스트

DB Trigger로 카운터를 자동화할 때, 반드시 기존 수동 로직(SELECT+UPDATE 패턴)을 전수 검색하여 제거해야 한다.

**검색 방법**: 해당 컬럼명으로 grep (예: `post_count`, `comment_count`)

이번 BUG-001에서 학습.

### 3. 새 안티패턴: SECURITY DEFINER RPC 보안 체크리스트

SECURITY DEFINER 함수는 반드시 아래 4가지를 확인해야 한다:

1. `SET search_path = public`
2. `auth.uid() IS NOT NULL` 검증
3. 입력값 allowlist
4. `REVOKE ALL` + `GRANT EXECUTE TO authenticated`

Supabase 공식 보안 가이드와 일치한다.

### 4. 새 안티패턴: 서비스와 컴포넌트 양쪽에 같은 로직

CommentService.createComment()과 PostDetail.tsx 양쪽에 알림 로직이 존재하여 동일 알림이 2회 발송되었다.

**원칙**: 비즈니스 로직(알림, 카운터, 통계)은 서비스 레이어에만 구현한다. 컴포넌트는 서비스 메서드 호출만 담당한다. 서비스에 로직을 추가할 때는 컴포넌트에서 동일 로직을 grep으로 검색하여 제거한다.

### 5. 백로그 현행화 규율

의사결정(DEC) 발생 시 관련 백로그 상태를 즉시 갱신해야 한다.

예: DEC-141(봇 폐지) 발생 시 BL-100~103을 즉시 종료 처리했어야 한다. 이 누락이 이번 세션에서 회장님 지적으로 이어졌다.

---

## 수치 요약

| 지표 | 값 |
|------|-----|
| 테이블 분석 | 20개 전수 |
| 발견 이슈 | P0: 1건, P1: 9건, P2: 7건 = 총 17건 |
| Sprint 횟수 | 5회 (Sprint 1~3 + Pre-migration + BL-163/164) |
| QA 반려 | 1회 (Sprint 1 BUG-001, 수정 후 PASS) |
| Pre-migration 추가 발견 | 3건 (Critical) |
| 마이그레이션 적용 | 8건 (000001~000008) |
| 최종 QA 결과 | 23TC / 22 PASS / 1 Minor FAIL |
| 코드 변경 | 19개 파일 수정/생성 |
| 서비스 신규 | PostService (7 메서드) |
| 신규 DB 객체 | Trigger 3개, RPC 9개, Index 1개 |

---

## Action Items

| # | 액션 | 담당 | 기한 | 상태 |
|---|------|------|------|------|
| 1 | Pre-migration Safety Review를 CLAUDE.md 마이그레이션 규칙에 추가 | CEO → Historian | 다음 세션 | ✅ 완료 |
| 2 | LESSONS.md에 PAT-010 "Pre-migration Safety Review" 등록 | Historian | 이번 커밋 | ✅ 완료 |
| 3 | LESSONS.md에 ANTI-010 "서비스+컴포넌트 로직 중복" 등록 | Historian | 이번 커밋 | ✅ 완료 |
| 4 | 백로그 현행화 체크를 모닝 브리핑 프로토콜에 추가 검토 | CEO | 다음 세션 | ✅ 완료 |
