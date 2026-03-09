# 북살롱 디자인 시스템 v2.0 -- "다정한 도서관"

> 버전: 2.0.0
> 생성일: 2026-03-06
> 근거: Phase 1~7 브랜딩 워크숍 결과 + index.css 실 구현값 통합
> 소스: `02-phase1-brand-essence.md`, `06-phase4-brand-personality.md`, `08-phase6-visual-identity.md`, `09-phase7-brand-guidelines.md`, `index.css`
> 색상 공간: OKLCH (Tailwind v4) | 색상 이론: Split-Complementary

---

## 1. 브랜드 본질

### 미션 (Why we exist)
> **"마침표로 끝나던 독서를 물음표로 이어지게 합니다"**

### 태그라인 (Brand Slogan)
> **"당신의 마침표가 누군가의 물음표와 만나는 곳"**

### 비전 (Where we go)
> "모든 책에 살롱이 열리고, 그 살롱에서 만난 사람들이 언젠가 한자리에 모이는 세상"

### 핵심 믿음 (Brand Belief)
> "독서는 혼자의 행위가 아니다. 나눌 때 비로소 완성된다"

### 핵심 가치 위계 (Core Values)

```
1. 연결 (Connection)       -- 최상위. 북살롱의 존재 이유
   +-- 2. 환대 (Hospitality)   -- 연결의 응답
   +-- 3. 깊이 (Depth)         -- 연결의 질
   +-- 4. 즐거움 (Joy)         -- 연결의 결과
   +-- 5. 영속성 (Timelessness) -- 연결의 시간적 확장
```

| 순위 | 가치 | 의미 | 연결과의 관계 |
|------|------|------|-------------|
| 1 | **연결 (Connection)** | 같은 책을 읽은 사람들 사이의 진정한 만남 | 최상위 가치 |
| 2 | **환대 (Hospitality)** | 질문에 따뜻하게 답하는 문화, 새 참여자를 반기는 태도 | 연결의 응답 |
| 3 | **깊이 (Depth)** | 피상적 리뷰가 아닌, 질문과 대화를 통한 깊은 이해 | 연결의 질 |
| 4 | **즐거움 (Joy)** | 나누는 것 자체가 주는 지적 기쁨 | 연결의 결과 |
| 5 | **영속성 (Timelessness)** | 오래된 책도, 오래된 질문도 가치가 있다 | 연결의 시간적 확장 |

### 브랜드 아키타입: "다정한 현자"

| 아키타입 | 비중 | 역할 |
|---------|------|------|
| **현자 (The Sage)** | 60% | 질문, 지혜, 깊이, 진실 추구 |
| **돌봄이 (The Caregiver)** | 30% | 환대, 포용, 따뜻함, 수용 |
| **탐험가 (The Explorer)** | 10% | 우연한 발견, 쪽지의 세렌디피티 |

### 브랜드 핵심 이미지
> "도서관에서 빌린 책에 있던 궁금함을 적은 쪽지를 발견한 느낌"

### 기능 판단 원칙
> **"이 기능이 사람과 사람 사이의 연결을 만드는가?"**

---

## 2. 색상 시스템

### 색상 이론: Split-Complementary (분할 보색)

```
색상 휠:
        155 (Primary: 블루-세이지)
         ^
    /--------\
   /          \
  65 (CTA)    35 (Accent)
  앰버          테라코타
```

- Hue 155 <-> Hue 65: 90도 차이
- Hue 155 <-> Hue 35: 120도 차이
- Hue 155의 보색(335도) 양쪽에 35도와 65도가 위치 -> Split-Complementary

### 색상 공간: OKLCH (Tailwind v4)

OKLCH는 인간의 인지에 기반한 색상 공간으로, Lightness(명도) / Chroma(채도) / Hue(색상) 세 축으로 구성된다. Tailwind CSS v4에서 기본 채택.

### 아키타입 <-> 색상 매핑

| 아키타입 | 비중 | 대응 색상 | 근거 |
|---------|------|----------|------|
| 현자 (Sage) | 60% | 블루-세이지 (Hue 155) | 지성, 깊이, 도서관 |
| 돌봄이 (Caregiver) | 30% | 앰버 (Hue 65) + 양피지 BG | 환대, 따뜻함 |
| 탐험가 (Explorer) | 10% | 테라코타 (Hue 35) | 발견, 세렌디피티 |

### 채도 철학

> "채도의 절제가 Sage 아키타입의 '알지만 내세우지 않는' 성격을 색상 레벨에서 표현한다."
> -- Board Advisor 크로스체크 중 도출

Primary Chroma 0.06, Accent Chroma 0.12로 전반적으로 낮은 채도를 유지.
"매너 있지만 편안한, 조용하지만 따뜻한" 톤앤매너와 정확히 일치.

### 라이트 모드 전체 토큰 테이블

> 소스: `index.css` @theme 블록

#### 배경/표면

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-background` | `oklch(0.97 0.008 80)` | 페이지 배경 (양피지) |
| `--color-foreground` | `oklch(0.22 0.02 60)` | 본문 텍스트 (다크 브라운) |
| `--color-surface` | `oklch(0.99 0.004 80)` | 카드/표면 배경 (크림) |
| `--color-surface-foreground` | `oklch(0.22 0.02 60)` | 카드/표면 텍스트 |

#### 뮤트 (비활성, 보조)

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-muted` | `oklch(0.94 0.006 80)` | 비활성 배경 |
| `--color-muted-foreground` | `oklch(0.45 0.015 60)` | 보조 텍스트 |

#### Primary -- 블루-세이지 (Sage 60%)

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-primary` | `oklch(0.42 0.06 155)` | 상단바, 히어로 배경, 포커스 링 |
| `--color-primary-foreground` | `oklch(1.0 0 0)` | Primary 위 텍스트 (흰색) |
| `--color-primary-light` | `oklch(0.54 0.06 155)` | 히어로 배경 (밝은 변형) |

#### CTA -- 딥 허니 앰버 (Caregiver 30%)

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-cta` | `oklch(0.75 0.14 65)` | CTA 버튼 배경 |
| `--color-cta-foreground` | `oklch(0.20 0.03 60)` | CTA 버튼 텍스트 (다크) |

#### Secondary (보조 버튼)

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-secondary` | `oklch(0.94 0.006 80)` | 보조 버튼 배경 |
| `--color-secondary-foreground` | `oklch(0.22 0.02 60)` | 보조 버튼 텍스트 |

#### Accent -- 테라코타 (Explorer 10%)

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-accent` | `oklch(0.58 0.12 35)` | 배지, 태그 |
| `--color-accent-foreground` | `oklch(1.0 0 0)` | 액센트 위 텍스트 (흰색) |

#### 상태 색상

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-destructive` | `oklch(0.577 0.245 27)` | 삭제, 위험 액션 |
| `--color-destructive-foreground` | `oklch(1.0 0 0)` | 위험 텍스트 |
| `--color-success` | `oklch(0.627 0.194 149)` | 성공 상태 |
| `--color-success-foreground` | `oklch(1.0 0 0)` | 성공 텍스트 |
| `--color-warning` | `oklch(0.769 0.188 70)` | 경고 상태 |
| `--color-warning-foreground` | `oklch(0.22 0.02 60)` | 경고 텍스트 |

#### 별점/평가

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-rating` | `oklch(0.75 0.14 65)` | 별점 활성 |
| `--color-rating-muted` | `oklch(0.90 0.02 65)` | 별점 비활성 |

#### 독서 상태 3종

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-status-wishlist` | `oklch(0.75 0.14 65)` | 읽고 싶은 책 |
| `--color-status-reading` | `oklch(0.55 0.15 250)` | 읽는 중 |
| `--color-status-complete` | `oklch(0.627 0.194 149)` | 읽기 완료 |

#### 검색 하이라이트

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-highlight` | `oklch(0.92 0.12 90)` | 검색 하이라이트 배경 |
| `--color-highlight-foreground` | `oklch(0.25 0.05 60)` | 검색 하이라이트 텍스트 |

#### UI 요소

| 토큰명 | OKLCH 값 | 역할 |
|--------|----------|------|
| `--color-border` | `oklch(0.90 0.008 80)` | 구분선, 카드 테두리 |
| `--color-input` | `oklch(0.90 0.008 80)` | 입력 필드 테두리 |
| `--color-ring` | `oklch(0.42 0.06 155)` | 포커스 링 |

### Primary 스케일 (블루-세이지 Hue 155)

| 토큰명 | OKLCH 값 (라이트) | OKLCH 값 (다크) |
|--------|-------------------|-----------------|
| `--color-primary-50` | `oklch(0.97 0.01 155)` | `oklch(0.20 0.02 155)` |
| `--color-primary-100` | `oklch(0.92 0.02 155)` | `oklch(0.25 0.03 155)` |
| `--color-primary-200` | `oklch(0.84 0.04 155)` | `oklch(0.32 0.04 155)` |
| `--color-primary-300` | `oklch(0.72 0.05 155)` | `oklch(0.42 0.06 155)` |
| `--color-primary-500` | `oklch(0.48 0.06 155)` | `oklch(0.60 0.07 155)` |
| `--color-primary-600` | `oklch(0.42 0.06 155)` | `oklch(0.75 0.08 155)` |
| `--color-primary-700` | `oklch(0.35 0.05 155)` | `oklch(0.82 0.06 155)` |

### 다크 모드 전체 토큰 테이블

> 소스: `index.css` `.dark` 블록
> 원칙: Material Design 3 반전 원칙 적용

#### 배경/표면

| 토큰명 | OKLCH 값 | 비고 |
|--------|----------|------|
| `--color-background` | `oklch(0.15 0.01 155)` | 순수 검정 회피, 세이지 톤 유지 |
| `--color-foreground` | `oklch(0.92 0.01 80)` | 밝은 크림 |
| `--color-surface` | `oklch(0.22 0.01 155)` | 배경보다 밝게 (계층 구분) |
| `--color-surface-foreground` | `oklch(0.92 0.01 80)` | 밝은 크림 |

#### 뮤트

| 토큰명 | OKLCH 값 | 비고 |
|--------|----------|------|
| `--color-muted` | `oklch(0.28 0.01 155)` | |
| `--color-muted-foreground` | `oklch(0.65 0.01 80)` | |

#### Primary

| 토큰명 | OKLCH 값 | 비고 |
|--------|----------|------|
| `--color-primary` | `oklch(0.75 0.08 155)` | M3 반전: 밝은 민트-세이지 |
| `--color-primary-foreground` | `oklch(0.15 0.01 155)` | 어두운 세이지 |
| `--color-primary-light` | `oklch(0.65 0.06 155)` | |

#### CTA

| 토큰명 | OKLCH 값 | 비고 |
|--------|----------|------|
| `--color-cta` | `oklch(0.75 0.08 155)` | 다크에서 Primary와 동일 |
| `--color-cta-foreground` | `oklch(0.15 0.01 155)` | 매우 어두운 세이지 |

#### Secondary / Accent

| 토큰명 | OKLCH 값 | 비고 |
|--------|----------|------|
| `--color-secondary` | `oklch(0.28 0.01 155)` | |
| `--color-secondary-foreground` | `oklch(0.92 0.01 80)` | |
| `--color-accent` | `oklch(0.60 0.09 40)` | 소프트 테라코타 |
| `--color-accent-foreground` | `oklch(1.0 0 0)` | |

#### 상태 색상 (다크)

| 토큰명 | OKLCH 값 |
|--------|----------|
| `--color-destructive` | `oklch(0.600 0.220 27)` |
| `--color-destructive-foreground` | `oklch(1.0 0 0)` |
| `--color-success` | `oklch(0.660 0.180 149)` |
| `--color-success-foreground` | `oklch(1.0 0 0)` |
| `--color-warning` | `oklch(0.800 0.170 70)` |
| `--color-warning-foreground` | `oklch(0.15 0.01 155)` |

#### 별점/평가 (다크)

| 토큰명 | OKLCH 값 |
|--------|----------|
| `--color-rating` | `oklch(0.75 0.14 65)` |
| `--color-rating-muted` | `oklch(0.35 0.02 65)` |

#### 독서 상태 3종 (다크)

| 토큰명 | OKLCH 값 |
|--------|----------|
| `--color-status-wishlist` | `oklch(0.75 0.14 65)` |
| `--color-status-reading` | `oklch(0.70 0.15 250)` |
| `--color-status-complete` | `oklch(0.660 0.180 149)` |

#### 검색 하이라이트 (다크)

| 토큰명 | OKLCH 값 |
|--------|----------|
| `--color-highlight` | `oklch(0.35 0.08 90)` |
| `--color-highlight-foreground` | `oklch(0.90 0.05 60)` |

#### UI 요소 (다크)

| 토큰명 | OKLCH 값 |
|--------|----------|
| `--color-border` | `oklch(0.30 0.01 155)` |
| `--color-input` | `oklch(0.30 0.01 155)` |
| `--color-ring` | `oklch(0.75 0.08 155)` |

### 시맨틱 토큰 -> 역할 매핑 요약

| 시맨틱 역할 | 토큰 | 라이트 | 다크 |
|-------------|------|--------|------|
| **Primary (주요 브랜드)** | `--color-primary` | `oklch(0.42 0.06 155)` | `oklch(0.75 0.08 155)` |
| **CTA (행동 유도)** | `--color-cta` | `oklch(0.75 0.14 65)` | `oklch(0.75 0.08 155)` |
| **Accent (강조)** | `--color-accent` | `oklch(0.58 0.12 35)` | `oklch(0.60 0.09 40)` |
| **Rating (별점)** | `--color-rating` | `oklch(0.75 0.14 65)` | `oklch(0.75 0.14 65)` |
| **Status-Wishlist** | `--color-status-wishlist` | `oklch(0.75 0.14 65)` | `oklch(0.75 0.14 65)` |
| **Status-Reading** | `--color-status-reading` | `oklch(0.55 0.15 250)` | `oklch(0.70 0.15 250)` |
| **Status-Complete** | `--color-status-complete` | `oklch(0.627 0.194 149)` | `oklch(0.660 0.180 149)` |
| **Destructive** | `--color-destructive` | `oklch(0.577 0.245 27)` | `oklch(0.600 0.220 27)` |
| **Success** | `--color-success` | `oklch(0.627 0.194 149)` | `oklch(0.660 0.180 149)` |
| **Warning** | `--color-warning` | `oklch(0.769 0.188 70)` | `oklch(0.800 0.170 70)` |
| **Highlight** | `--color-highlight` | `oklch(0.92 0.12 90)` | `oklch(0.35 0.08 90)` |

---

## 3. 타이포그래피

### 이중 서체 전략 (Dual Typography)

| 구분 | 서체 | 용도 |
|------|------|------|
| **브랜드 세리프** | 마루 부리 (Maru Buri) | 히어로 제목, 인용문, 빈 살롱 안내 |
| **UI 산세리프** | Pretendard Variable | 네비게이션, 버튼, 본문, 모든 UI 요소 |

### 마루 부리 (Maru Buri) 상세

| 항목 | 내용 |
|------|------|
| 제작 | 네이버 AG (마루 프로젝트) |
| 설계 철학 | "화면에 따뜻함을 주는 부리체" |
| 라이선스 | SIL Open Font License 1.1 |
| 굵기 | ExtraLight(200) / Light(300) / Regular(400) / SemiBold(600) / Bold(700) |
| 가변폰트 | 미지원 (불필요 -- 2개 굵기 사용 시 정적이 더 효율적) |
| Google Fonts | 미등록 |
| 폴백 | `font-family: 'MaruBuri', 'Noto Serif KR', serif` |

#### CDN 소스 (index.css에 등록된 실제 경로)

```
https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2
https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-SemiBold.woff2
https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.woff2
```

#### FOUT 방지 전략

`font-display: optional` 적용. 폰트 로드 대기 없이 즉시 폴백 폰트 사용하고, 폰트가 준비되면 다음 페이지 로드부터 적용하여 레이아웃 재흐름(reflow)을 방지한다.

#### 적용 범위

```
[세리프 -- 마루 부리]
+-- 히어로 섹션 제목 (h1) -- SemiBold(600) 또는 Bold(700)
+-- 인용문 (blockquote) -- Regular(400)
+-- 빈 살롱 안내 문구 -- Regular(400)

[산세리프 -- Pretendard Variable]
+-- 네비게이션, 버튼, 탭
+-- 살롱 카드 제목/본문
+-- 질문 목록
+-- 모든 UI 요소
+-- 본문 텍스트
```

#### 세리프 가이드라인

| 규칙 | 내용 |
|------|------|
| letter-spacing | -0.01em ~ -0.02em (세리프 자간 좁히기) |
| line-height | 1.6 ~ 1.75 (여유로운 행간) |
| 다크모드 주의 | 가는 획 halation(번짐) 방지: font-weight 400 이상 사용 |
| 양피지+세리프 과잉 방지 | 적용 범위를 히어로/인용문으로 제한하여 "고풍 과부하" 회피 |

### Pretendard Variable (UI 산세리프)

| 항목 | 내용 |
|------|------|
| 제작 | 길형진 |
| 라이선스 | SIL Open Font License 1.1 |
| 가변폰트 | 지원 (weight axis) |
| 용도 | 모든 UI 요소, 본문 텍스트, 네비게이션, 버튼 |

#### Tailwind 등록 (index.css @theme 블록)

```css
--font-sans: "Pretendard Variable", Pretendard, -apple-system,
  BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI",
  "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic",
  "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;
--font-serif: "MaruBuri", "Noto Serif KR", Georgia, "Times New Roman", serif;
```

### Line-height 계층 (한글 최적화)

> 소스: `index.css` @theme 블록

| 토큰 | Line-height | 용도 |
|------|-------------|------|
| `--text-xs--line-height` | 1.5 | 캡션, 라벨 |
| `--text-sm--line-height` | 1.6 | 보조 텍스트 |
| `--text-base--line-height` | 1.7 | 본문 |
| `--text-lg--line-height` | 1.7 | 강조 본문 |
| `--text-xl--line-height` | 1.6 | 소제목 |
| `--text-2xl--line-height` | 1.5 | 제목 |
| `--text-3xl--line-height` | 1.4 | 히어로 제목 |

한글은 영문 대비 글리프 높이가 높으므로, Tailwind 기본값(1.25~1.5)보다 넉넉한 행간을 적용.

### Tracking 설정

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--tracking-tight` | -0.01em | 세리프 제목, 히어로 텍스트 |
| `--tracking-normal` | 0em | 본문, UI 요소 |

### 아키타입 <-> 서체 매핑

| 아키타입 | 대응 서체 | 근거 |
|---------|----------|------|
| 현자 (Sage) 60% | 마루 부리 -- 명조 구조의 지적 깊이 | 세리프 = 지성, 전통, 신뢰 |
| 돌봄이 (Caregiver) 30% | 마루 부리 -- 둥근 획 마감의 따뜻함 + Pretendard의 친근함 | 둥근 곡선 = 부드러움, 환대 |
| 탐험가 (Explorer) 10% | Pretendard Variable -- UI의 현대적 활력 | 산세리프 = 현대, 탐색, 발견 |

---

## 4. 간격 & 레이아웃

### 시맨틱 간격 토큰

> 소스: `index.css` @theme 블록

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--spacing-page-x` | `0.75rem` (12px) | 페이지 좌우 패딩 (모바일) |
| `--spacing-page-x-sm` | `1.5rem` (24px) | 페이지 좌우 패딩 (태블릿) |
| `--spacing-page-x-lg` | `2rem` (32px) | 페이지 좌우 패딩 (데스크톱) |
| `--spacing-section-gap` | `1.5rem` (24px) | 섹션 간 간격 |
| `--spacing-card-padding` | `0.75rem` (12px) | 카드 내부 패딩 (모바일) |
| `--spacing-card-padding-sm` | `1rem` (16px) | 카드 내부 패딩 (태블릿+) |
| `--spacing-card-gap` | `0.75rem` (12px) | 카드 간 간격 (모바일) |
| `--spacing-card-gap-sm` | `1rem` (16px) | 카드 간 간격 (태블릿+) |
| `--spacing-modal-padding` | `1rem` (16px) | 모달 내부 패딩 (모바일) |
| `--spacing-modal-padding-sm` | `1.5rem` (24px) | 모달 내부 패딩 (태블릿+) |
| `--spacing-element-gap` | `0.5rem` (8px) | 요소 간 기본 간격 |
| `--spacing-inline-gap` | `0.5rem` (8px) | 인라인 요소 간격 |

### 반응형 Breakpoint 규칙

Tailwind v4 기본 breakpoint 사용:

| Breakpoint | 최소 너비 | 접미사 예시 |
|------------|-----------|------------|
| (default) | 0px | `spacing-page-x` (모바일 우선) |
| `sm` | 640px | `spacing-page-x-sm` |
| `lg` | 1024px | `spacing-page-x-lg` |

### Safe Area 지원

> 소스: `index.css` @supports 블록

iOS 기기의 노치/홈 인디케이터 영역을 고려한 Safe Area 패딩:

```css
@supports (padding: env(safe-area-inset-top)) {
  .safe-area-pad {
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
```

---

## 5. 컴포넌트 패턴

### 모서리 (Radius 토큰)

> 소스: `index.css` @theme 블록

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--radius-sm` | `0.375rem` (6px) | 작은 요소 (태그, 배지) |
| `--radius-md` | `0.5rem` (8px) | 기본 요소 (버튼, 입력 필드) |
| `--radius-lg` | `0.75rem` (12px) | 카드 |
| `--radius-xl` | `1rem` (16px) | 모달 |
| `--radius-2xl` | `1.5rem` (24px) | 큰 컨테이너 |
| `--radius-full` | `9999px` | 아바타, 칩 |

### 그림자 (레이어드 Shadow 토큰)

> 소스: `index.css` @theme 블록 (라이트) + `.dark` 블록 (다크)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.04)` | `0 1px 2px oklch(0 0 0 / 0.15)` |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)` | `0 1px 3px oklch(0 0 0 / 0.25), 0 1px 2px oklch(0 0 0 / 0.15)` |
| `--shadow-md` | `0 4px 6px -1px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.04)` | `0 4px 6px -1px oklch(0 0 0 / 0.25), 0 2px 4px -2px oklch(0 0 0 / 0.15)` |
| `--shadow-lg` | `0 10px 15px -3px oklch(0 0 0 / 0.06), 0 4px 6px -4px oklch(0 0 0 / 0.04)` | `0 10px 15px -3px oklch(0 0 0 / 0.25), 0 4px 6px -4px oklch(0 0 0 / 0.15)` |
| `--shadow-xl` | `0 20px 25px -5px oklch(0 0 0 / 0.06), 0 8px 10px -6px oklch(0 0 0 / 0.04)` | `0 20px 25px -5px oklch(0 0 0 / 0.25), 0 8px 10px -6px oklch(0 0 0 / 0.15)` |

다크 모드에서 그림자 불투명도를 강화(0.04-0.06 -> 0.15-0.25)하여 어두운 배경에서도 계층 구분이 가능하도록 함.

### 아이콘: Lucide Icons + 커스텀 4종

#### Lucide Icons 스타일 규격

| 속성 | 값 |
|------|-----|
| 라이브러리 | Lucide Icons |
| Stroke width | 2px |
| Stroke linecap | round |
| Stroke linejoin | round |
| 기본 크기 | 24x24px (`w-6 h-6`) |
| 색상 | 시맨틱 토큰 (`currentColor` 기반) |

#### 시맨틱 아이콘 색상 토큰

| 상태 | 토큰 | 용도 |
|------|------|------|
| 기본 | `--icon-default` | 네비게이션, 일반 UI |
| 비활성 | `--icon-muted` | 비활성 탭, 보조 |
| 강조 | `--icon-primary` | 선택된 탭, 활성 상태 |
| CTA | `--icon-cta` | CTA 내부 아이콘 |

#### 커스텀 아이콘 4종 (제작 필요)

| 아이콘 | 용도 | 설명 |
|--------|------|------|
| 살롱 (Salon) | 살롱 탭/카드 | 책 + 대화 모티프 |
| 토론 프롬프트 (Discussion) | 질문 카드 | 말풍선 + 물음표 |
| 공감 (Empathy) | 리액션 | 따뜻한 하트/손 변형 |
| 읽기 상태 (Reading Status) | 진행률 | 펼친 책 + 프로그레스 |

> 커스텀 아이콘은 Lucide 스타일(stroke 2px, round, 24x24 grid)에 맞춰 SVG로 제작.

---

## 6. 톤앤매너

### 한 문장 정의
> **"매너 있지만 편안한, 조용하지만 따뜻한"**

### 톤 스펙트럼

```
격식 |||..  캐주얼    (캐주얼 방향)
활기 ...||| 차분      (차분 방향)
전문 .|||| 친근      (친근 방향)
간결 ..|.. 서술적    (중간)
```

### 톤 가드레일

```
[금지]          [주의]          [적정]          [주의]          [금지]
권위적/냉담 --- 사무적/건조 --- 따뜻한 정중함 --- 감상적/수다 --- 과잉친근/반말
                              ^ 여기가 북살롱
```

### 어휘 수준
- "잘 읽히는 에세이" 수준
- "학술 논문" 수준이 아님
- 예: "사유하다"보다 "생각을 나누다"

### 감정 키워드

| 키워드 | 의미 |
|--------|------|
| **환대받음 (Welcomed)** | 평가가 아닌 반김의 공간 |
| **안온함 (Cozy)** | 비 오는 날 따뜻한 조명 아래의 차분함 |
| **지적 충만함 (Fulfilled)** | 깊은 사유를 나눈 후의 만족 |
| **여운 (Resonant)** | 쪽지를 발견했을 때의 몽글몽글한 감동 |
| **느슨함 (Relaxed)** | 각자의 속도를 존중받는 편안함 |
| **영속성 (Timeless)** | 10년 후에도 이 자리에 있을 든든함 |

### DO 가이드

| 규칙 | 예시 |
|------|------|
| 여지를 남기는 표현 | "~해보는 건 어떨까요", "~일지도 모릅니다" |
| 서술형 종결어미 | "~합니다", "~이에요", "~네요" |
| 질문을 질문으로 대함 | "어떤 부분이 인상적이었나요?" |
| 구체적 이미지 표현 | "긴 대화의 시작", "생각을 남기다" |
| 침묵도 허용 | 빈 상태를 "문제"로 프레이밍하지 않음 |
| 존대 유지, 딱딱하지 않게 | "~하셨군요" (O) / "~하였습니다" (X) |

### DON'T 가이드

| 규칙 | 예시 |
|------|------|
| 느낌표 연속 금지 | "지금 바로!!" -- 금지 |
| 이모지 본문 사용 금지 | UI 아이콘은 허용, 텍스트 내 이모지 금지 |
| 경쟁/비교 프레이밍 금지 | "1등 독서 커뮤니티" -- 금지 |
| FOMO 표현 금지 | "지금 안 하면 놓칩니다" -- 금지 |
| 유행어/밈 금지 | "ㄹㅇ", "갓생", "찐" -- 금지 |
| 명령형 금지 | "작성하세요" -> "작성해보실 수 있어요" |
| 과잉 칭찬 금지 | "대단해요!", "멋진 질문이에요!" -- 금지 |

### UX 카피 예시

| 상황 | 카피 |
|------|------|
| 온보딩 | "반갑습니다. 여기선 책에 대해 질문을 남기고, 누군가의 생각을 만날 수 있어요." |
| 질문 유도 | "이 책을 읽으며 떠오른 생각이 있나요? 짧은 질문 하나가 긴 대화의 시작이 되기도 합니다." |
| 답변 알림 | "당신이 남긴 질문에 누군가 생각을 남겼어요." |
| 빈 살롱 | "아직 이 책에 대한 이야기는 시작되지 않았네요. 첫 번째 질문을 남겨보는 건 어떨까요." |
| 에러 | "잠시 책갈피를 잃어버린 것 같아요. 금방 다시 제자리를 찾아놓을 테니, 조금만 기다려주세요." |
| 재방문 | "다시 오셨군요. 그동안 어떤 문장들을 만나고 오셨는지 궁금했어요." |
| 검색 결과 없음 | "아직 이 책에 대한 이야기는 도착하지 않았네요. 아마 당신이 첫 번째 발견자가 될 수 있을 거예요." |
| 공감 액션 | 버튼: "이 생각에 머물기" / 토스트: "조용히 갈피를 끼워둘게요." |

---

## 7. 이미지 스타일

### UI: SVG 라인아트 (세이지 단색, 1.5px stroke)

| 항목 | 규격 |
|------|------|
| 스타일 | 미니멀 SVG 라인아트 |
| 색상 | 세이지 단색 (#4A6B5D 또는 `currentColor`) |
| 선 굵기 | stroke 1.5px |
| Fill | 없음 (no fill) |
| 다크모드 | CSS 변수(`currentColor`)로 자동 전환 |
| 적용 | 빈 상태(empty state), 온보딩 |

### 마케팅: 라인아트 + 수채화 워시 하이브리드

| 항목 | 규격 |
|------|------|
| 스타일 | 세이지 + 크림 톤 수채화 배경 위 라인아트 오버레이 |
| 적용 | OG 이미지, 배너, 블로그 히어로 |

### 색상 규칙

| 규칙 | 내용 |
|------|------|
| 색상 수 | 이미지당 최대 2색 + 배경 |
| 앰버 사용 | **금지** -- CTA 전용 색상이므로 이미지에 사용하지 않음 |
| 금지사항 | 얼굴 표현, 사진풍 렌더링, 복잡한 장면 |

### 아키타입 매핑

| 아키타입 | 이미지 표현 |
|---------|------------|
| 현자 (Sage) 60% | 절제된 라인, 여백, 단색 |
| 돌봄이 (Caregiver) 30% | 수채화 워시의 부드러움, 크림 톤 |
| 탐험가 (Explorer) 10% | 손그림 느낌의 자유로운 라인 |

### 나노바나나(Gemini) 프롬프트 템플릿

| 용도 | 프롬프트 |
|------|---------|
| 빈 상태 | "Minimal single-line illustration of [subject], sage green (#4A6B5D) on off-white, no fill, 1.5px stroke" |
| 블로그 히어로 | "Watercolor wash background in muted sage and cream tones, with thin line illustration of [subject] overlaid" |
| OG 이미지 | "Clean minimal composition, left-aligned thin line art of [subject], right side text area, sage monochrome" |
| 아이콘 일러스트 | "Simple geometric line icon of [subject], rounded corners, 2px stroke, sage green on transparent" |

---

## 8. 토큰 사용 가이드 (개발자용)

### CSS 변수 -> Tailwind 클래스 매핑

> Tailwind v4에서는 @theme 블록에 등록된 CSS 변수가 자동으로 유틸리티 클래스로 변환됨.

| CSS 변수 | Tailwind 클래스 (배경) | Tailwind 클래스 (텍스트) | Tailwind 클래스 (테두리) |
|----------|----------------------|------------------------|------------------------|
| `--color-primary` | `bg-primary` | `text-primary` | `border-primary` |
| `--color-primary-foreground` | `bg-primary-foreground` | `text-primary-foreground` | - |
| `--color-primary-light` | `bg-primary-light` | `text-primary-light` | - |
| `--color-cta` | `bg-cta` | `text-cta` | `border-cta` |
| `--color-cta-foreground` | `bg-cta-foreground` | `text-cta-foreground` | - |
| `--color-secondary` | `bg-secondary` | `text-secondary` | `border-secondary` |
| `--color-secondary-foreground` | `bg-secondary-foreground` | `text-secondary-foreground` | - |
| `--color-accent` | `bg-accent` | `text-accent` | `border-accent` |
| `--color-accent-foreground` | `bg-accent-foreground` | `text-accent-foreground` | - |
| `--color-destructive` | `bg-destructive` | `text-destructive` | `border-destructive` |
| `--color-success` | `bg-success` | `text-success` | `border-success` |
| `--color-warning` | `bg-warning` | `text-warning` | `border-warning` |
| `--color-rating` | `bg-rating` | `text-rating` | - |
| `--color-rating-muted` | `bg-rating-muted` | `text-rating-muted` | - |
| `--color-status-wishlist` | `bg-status-wishlist` | `text-status-wishlist` | - |
| `--color-status-reading` | `bg-status-reading` | `text-status-reading` | - |
| `--color-status-complete` | `bg-status-complete` | `text-status-complete` | - |
| `--color-highlight` | `bg-highlight` | `text-highlight` | - |
| `--color-highlight-foreground` | `bg-highlight-foreground` | `text-highlight-foreground` | - |
| `--color-background` | `bg-background` | - | - |
| `--color-foreground` | - | `text-foreground` | - |
| `--color-surface` | `bg-surface` | - | - |
| `--color-surface-foreground` | - | `text-surface-foreground` | - |
| `--color-muted` | `bg-muted` | - | - |
| `--color-muted-foreground` | - | `text-muted-foreground` | - |
| `--color-border` | - | - | `border-border` |
| `--color-input` | - | - | `border-input` |
| `--color-ring` | - | - | `ring-ring` |

### Primary 스케일 클래스

| CSS 변수 | Tailwind 클래스 |
|----------|----------------|
| `--color-primary-50` | `bg-primary-50`, `text-primary-50` |
| `--color-primary-100` | `bg-primary-100`, `text-primary-100` |
| `--color-primary-200` | `bg-primary-200`, `text-primary-200` |
| `--color-primary-300` | `bg-primary-300`, `text-primary-300` |
| `--color-primary-500` | `bg-primary-500`, `text-primary-500` |
| `--color-primary-600` | `bg-primary-600`, `text-primary-600` |
| `--color-primary-700` | `bg-primary-700`, `text-primary-700` |

### 간격 토큰 클래스

| CSS 변수 | 사용 예시 |
|----------|----------|
| `--spacing-page-x` | `px-(--spacing-page-x)` |
| `--spacing-card-padding` | `p-(--spacing-card-padding)` |
| `--spacing-card-gap` | `gap-(--spacing-card-gap)` |
| `--spacing-element-gap` | `gap-(--spacing-element-gap)` |

### 모서리 / 그림자 클래스

| CSS 변수 | Tailwind 클래스 |
|----------|----------------|
| `--radius-sm` | `rounded-sm` |
| `--radius-md` | `rounded-md` |
| `--radius-lg` | `rounded-lg` |
| `--radius-xl` | `rounded-xl` |
| `--shadow-sm` | `shadow-sm` |
| `--shadow-md` | `shadow-md` |
| `--shadow-lg` | `shadow-lg` |

### 서체 클래스

| CSS 변수 | Tailwind 클래스 | 용도 |
|----------|----------------|------|
| `--font-sans` | `font-sans` | UI 요소, 본문 (기본) |
| `--font-serif` | `font-serif` | 히어로 제목, 인용문 |

### 금지 사항

**하드코딩 Tailwind 색상 사용 금지:**

```
-- 금지 (하드코딩) --
text-amber-500
bg-blue-600
text-red-500
bg-green-500
border-gray-200

-- 허용 (시맨틱 토큰) --
text-cta
bg-primary
text-destructive
bg-success
border-border
```

모든 색상은 반드시 시맨틱 토큰 클래스를 사용해야 한다. 하드코딩 Tailwind 색상(amber-*, blue-*, red-*, green-*, gray-* 등)을 사용하면 다크 모드 전환 시 색상이 자동으로 변환되지 않으며, 디자인 시스템의 일관성이 깨진다.

### 예외

외부 브랜드 규정에 따른 색상은 예외로 하드코딩 허용:
- 카카오 브랜드 색상: `bg-[#FEE500]` (카카오 로그인 버튼)
- 기타 외부 브랜드 가이드라인에서 지정한 색상

---

## 9. 로고 (진행중)

### 현재 상태
보류 -- 전문 디자이너 브리프 준비 완료, 의뢰 대기.

### 검토 과정 요약

| Round | 접근 | 결과 |
|-------|------|------|
| 1 | 구두점 로고 (물음표, 쉼표) | 회장님: "로고 느낌이 전혀 없다" -- 지나치게 미니멀 |
| 2 | 책+쪽지+물음표 (래스터 이미지) | 방향성 OK, 7.1/10. AI 생성은 일러스트에 가까움 |
| 3-1 | 책+쪽지+물음표 (SVG 직접 설계) | 기하학적 로고 접근, 반복 조정 |
| 3-2 | 물음표 제거 검토 | "물음표가 FAQ/도움말로 오독될 수 있다" |
| 3-3 | BS 레터마크 (타이포그래피) | 5변형 시도 |

### 도출된 핵심 인사이트

1. **AI 이미지 생성은 로고에 부적합** -- 일러스트는 잘 만들지만, 로고에 필요한 기하학적 정밀성과 극도의 단순함은 전문 디자이너 영역
2. **물음표 사용은 선택 사항** -- 쪽지/책갈피만으로도 "발견의 느낌" 전달 가능
3. **레터마크(BS)도 유력한 방향** -- 이솝/롱블랙 톤에 가장 가까운 접근
4. **파비콘 전용 변형은 필수** -- 어떤 방향이든 32px 이하 별도 설계 필요

### 디자이너 브리프 핵심

| 항목 | 내용 |
|------|------|
| 컨셉 A | "책 속 쪽지" -- 닫힌 책 + 삐져나온 앰버 쪽지 (물음표 선택) |
| 컨셉 B | "BS 레터마크" -- 세리프 모노그램, 장서표(ex-libris) 스타일 |
| 색상 | #4A6B5D(세이지) + #C4882B(앰버) 확정 팔레트 |
| 톤 | 이솝 x 독립서점 x 롱블랙 |
| 로고 유형 | 조합형 (심볼 + 워드마크), 심볼 단독 사용 가능하도록 |
| 필수 산출물 | 조합형, 심볼 단독, 파비콘 전용, 가로 배치형, 다크모드, 모노크롬 |
| 절대 금지 | 펼친 책, 돋보기, 전구, 그라데이션, 미용 연상 요소 |

---

## 10. 컴포넌트 디자인 룰

### 10.1 공용 컴포넌트 카탈로그

| 컴포넌트 | 용도 | 현재 상태 |
|----------|------|----------|
| `SalonCard` | 살롱(포럼) 카드 | ✅ 추출 완료 |
| `TabBar` | 탭 네비게이션 | ❌ 미추출 |
| `SectionHeader` | 섹션 제목 + 더보기 | ❌ 미추출 |
| `CardContainer` | 범용 카드 컨테이너 | ❌ 미추출 |
| `Spinner` | 로딩 스피너 | ❌ 미추출 |
| `EmptyState` | 빈 상태 UI | ❌ 미추출 |
| `ModalLayout` | 모달 공용 레이아웃 | ❌ 미추출 |
| `SkeletonBlock` | 스켈레톤 빌딩블록 | ❌ 미추출 |

### 10.2 카드 컨테이너 규격

| 속성 | 규격 | 토큰 |
|------|------|------|
| 배경 | `bg-surface` | `--color-surface` |
| 테두리 | `border border-border/60` | `--color-border` |
| 모서리 | `rounded-xl` | `--radius-lg` (12px) |
| 그림자 | `shadow-sm` (기본) / `hover:shadow-lg` (호버) | `--shadow-sm` / `--shadow-lg` |
| 패딩 | `p-(--spacing-card-padding) sm:p-(--spacing-card-padding-sm)` | 12px / 16px |
| 호버 | `hover:border-primary-300 hover:bg-primary-50/30 transition-all duration-300` | - |

금지: `bg-muted`를 카드 배경으로 사용 (`bg-muted`는 비활성/보조 영역 전용)
예외: 통계 카드, 인라인 하위 항목은 `bg-muted` 허용

### 10.3 섹션 헤더 규격

```
[SectionHeader 컴포넌트]
┌────────────────────────────────────────┐
│ [제목]                        [더보기 >] │
└────────────────────────────────────────┘
```

| 속성 | 규격 | Board Advisor 반영 |
|------|------|-------------------|
| 컨테이너 | `flex items-center justify-between mb-4` | - |
| 제목 | `text-lg font-semibold text-foreground` | ✅ font-serif 제거 (세리프 과잉 방지) |
| 더보기 | `text-sm text-primary hover:text-primary-700` | - |

**font-serif 적용 범위 재확인** (Board Advisor 지적):
- ✅ 허용: 히어로 제목, 인용문, 빈 살롱 안내, 책 제목, 페이지 타이틀
- ❌ 금지: 섹션 헤더, 카드 내 소제목, 버튼, 일반 UI 요소

### 10.4 탭 컴포넌트 규격

```
[TabBar 컴포넌트]
┌──────┬──────┬──────┬──────┐
│ 탭1  │ 탭2  │ 탭3  │ 탭4  │  ← 스크롤 가능 (overflow-x-auto)
└──────┴──────┴──────┴──────┘
```

| 속성 | 활성 탭 | 비활성 탭 |
|------|--------|----------|
| 배경 | `bg-primary text-primary-foreground` | `bg-transparent text-muted-foreground` |
| 모서리 | `rounded-full` | `rounded-full` |
| 패딩 | `px-4 py-2` | `px-4 py-2` |
| 전환 | `transition-colors duration-200` | `hover:bg-muted` |

### 10.5 리스트 간격 규격

| 속성 | 규격 | Board Advisor 반영 |
|------|------|-------------------|
| 카드 리스트 | `flex flex-col gap-(--spacing-card-gap) sm:gap-(--spacing-card-gap-sm)` | ✅ space-y 대신 gap + 토큰 사용 |
| 인라인 요소 | `gap-(--spacing-inline-gap)` | 8px |
| 섹션 간 | `gap-(--spacing-section-gap)` | 24px |

금지: `space-y-2`, `space-y-3` 등 하드코딩 간격 → 토큰 사용 필수

### 10.6 스피너 규격

| 속성 | 규격 |
|------|------|
| 기본 | `animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent` |
| 작은 | `h-4 w-4` |
| 큰 | `h-8 w-8` |

### 10.7 빈 상태 규격

```
[EmptyState 컴포넌트]
┌────────────────────────────┐
│         [아이콘]            │  ← text-primary opacity-30, w-12 h-12
│                            │
│     [메시지 텍스트]          │  ← text-muted-foreground, text-center
│                            │
│      [액션 버튼(선택)]       │  ← bg-cta 또는 text-primary
└────────────────────────────┘
```

### 10.8 스켈레톤 규격 (Board Advisor 추가)

| 속성 | 규격 |
|------|------|
| 블록 | `bg-muted rounded animate-pulse` |
| 텍스트 라인 | `h-4 bg-muted rounded animate-pulse` |
| 원형 | `rounded-full bg-muted animate-pulse` |
| 이미지 | `bg-muted rounded-md animate-pulse` |

### 10.9 아이콘 색상 규격 (Board Advisor 반영)

| 용도 | 클래스 | 비고 |
|------|--------|------|
| 기본 | `text-foreground` | 네비게이션, 일반 UI |
| 비활성 | `text-muted-foreground` | 비활성 탭, 보조 |
| 강조 | `text-primary` | 선택된 탭, 활성 |
| CTA | `text-cta` | 북마크 등 액션 아이콘 (등록 완료: --color-icon-cta) |

---

## 11. 레이아웃 규격

### 11.1 페이지 레이아웃

```
[모바일]                          [데스크톱]
┌─ px-3 (12px) ─────────────┐    ┌─ px-6 (24px) ── max-w-4xl mx-auto ──┐
│ [Header]                   │    │ [Header]                             │
│ [Content]                  │    │ [Content]                            │
│ [Footer/BottomNav]         │    │ [Footer]                             │
└────────────────────────────┘    └────────────────────────────────────────┘
```

| 속성 | 모바일 | sm (640px+) | lg (1024px+) |
|------|--------|------------|-------------|
| 좌우 패딩 | `px-(--spacing-page-x)` (12px) | `px-(--spacing-page-x-sm)` (24px) | `px-(--spacing-page-x-lg)` (32px) |
| 최대 너비 | 없음 | 없음 | `max-w-4xl` (896px) |
| 가운데 정렬 | 없음 | 없음 | `mx-auto` |

### 11.2 섹션 레이아웃

```
┌────────────────────────────┐
│ [SectionHeader]            │  ← mb-4
│ [CardList]                 │  ← gap-(--spacing-card-gap)
│                            │
│           mb-6             │  ← 섹션 간 간격
│                            │
│ [SectionHeader]            │
│ [CardList]                 │
└────────────────────────────┘
```

### 11.3 모달 레이아웃

| 속성 | 규격 |
|------|------|
| 배경 | `bg-surface` |
| 모서리 | `rounded-xl` |
| 패딩 | `p-(--spacing-modal-padding) sm:p-(--spacing-modal-padding-sm)` |
| 최대 너비 | `max-w-md` (모바일 전체폭) |
| 오버레이 | `bg-black/50 backdrop-blur-sm` |
| 버튼 배치 | `flex flex-col-reverse sm:flex-row sm:justify-end gap-2` |

---

## 12. 모바일 반응형 디자인 규칙

> 근거: 2026-03-09 전수 점검 — 20건의 모바일 레이아웃 잠재 문제 발견
> 원칙: **모바일 우선(Mobile-First)** — 좁은 화면에서 먼저 정상 동작을 보장하고, 넓은 화면에서 확장

### 12.1 버튼 텍스트 줄바꿈 방지 (필수)

**규칙**: 모든 버튼의 텍스트는 줄바꿈되지 않아야 한다.

| 패턴 | 필수 클래스 | 설명 |
|------|-----------|------|
| flex 컨테이너 안의 button | `shrink-0 whitespace-nowrap` | 입력폼+버튼, 제목+액션 버튼 등 |
| 단독 button | `whitespace-nowrap` | 버튼 텍스트가 2글자 이상일 때 |

```tsx
// 올바른 패턴
<div className="flex gap-2">
  <input className="flex-1 min-w-0 ..." />
  <button className="shrink-0 whitespace-nowrap px-4 py-2 ...">등록</button>
</div>

// 금지 패턴
<div className="flex gap-2">
  <input className="flex-1 ..." />
  <button className="px-4 py-2 ...">등록</button>  {/* shrink-0, whitespace-nowrap 없음 */}
</div>
```

### 12.2 flex 컨테이너 고정 요소 보호 (필수)

**규칙**: flex 레이아웃에서 크기가 고정되어야 하는 요소는 `shrink-0`을 반드시 적용한다.

| 대상 | 필수 클래스 |
|------|-----------|
| 아이콘 버튼 | `shrink-0` |
| 날짜/시간 텍스트 | `shrink-0` |
| 좋아요/댓글/조회수 그룹 | `shrink-0` |
| 액션 버튼 그룹 | `shrink-0` |

가변 길이 요소(사용자 이름, 제목 등)는 `flex-1 min-w-0`을 적용하여 축소 허용.

```tsx
// 올바른 패턴
<div className="flex items-center gap-2">
  <span className="flex-1 min-w-0 truncate">{userName}</span>
  <div className="shrink-0 flex items-center gap-2">
    <span>좋아요 {likeCount}</span>
    <span>댓글 {commentCount}</span>
  </div>
</div>
```

### 12.3 최소 터치 영역 (필수)

**규칙**: 모바일에서 탭 가능한 모든 인터랙티브 요소는 최소 44×44px 터치 영역을 확보한다.

> 근거: Apple HIG 44pt, Google Material Design 48dp (44px는 공통 최소 기준)

| 요소 유형 | 필수 클래스 |
|----------|-----------|
| 아이콘 전용 버튼 (닫기, 좋아요 등) | `min-h-[44px] min-w-[44px] flex items-center justify-center` |
| 텍스트 버튼 | `min-h-[44px]` (너비는 텍스트에 맡김) |
| 링크/탭 요소 | `min-h-[44px]` 또는 충분한 패딩 |

```tsx
// 올바른 패턴 — 아이콘 전용 버튼
<button className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center">
  <XIcon className="w-5 h-5" />
</button>

// 금지 패턴 — 아이콘만 있고 터치 영역 미확보
<button className="text-muted-foreground">
  <XIcon className="w-6 h-6" />  {/* 24×24px, 터치 불가 */}
</button>
```

### 12.4 텍스트 오버플로우 처리 (필수)

**규칙**: 사용자 입력 또는 동적 텍스트가 표시되는 곳은 반드시 오버플로우를 처리한다.

| 텍스트 유형 | 권장 처리 |
|------------|----------|
| 사용자 닉네임 | `truncate max-w-[120px]` 또는 `max-w-[40%]` |
| 게시글 제목 (한 줄) | `truncate` |
| 게시글 내용 (미리보기) | `line-clamp-2` 또는 `line-clamp-3` |
| 이메일 주소 | `truncate` |
| 알림 제목 | `flex-1 min-w-0` + `truncate` |
| 살롱(포럼) 이름 | `truncate` |

```tsx
// 올바른 패턴 — 가변 텍스트 + 고정 액션
<div className="flex items-center justify-between">
  <h3 className="flex-1 min-w-0 truncate font-semibold">{title}</h3>
  <div className="shrink-0 flex items-center gap-2">
    <button>읽음</button>
    <button>삭제</button>
  </div>
</div>

// 금지 패턴 — 오버플로우 미처리
<div className="flex items-center justify-between">
  <h3 className="font-semibold">{title}</h3>  {/* 긴 제목이 버튼을 밀어냄 */}
  <button>삭제</button>
</div>
```

### 12.5 반응형 패딩/마진 (권장)

**규칙**: 24px 이상의 패딩/마진은 모바일 분기(`sm:`)를 적용한다.

| 값 범위 | 처리 |
|---------|------|
| `p-1` ~ `p-3` (4~12px) | 반응형 분기 불필요 |
| `p-4` ~ `p-6` (16~24px) | `p-3 sm:p-4` 또는 `p-4 sm:p-6` 권장 |
| `p-8` 이상 (32px+) | 반드시 `p-4 sm:p-8` 등 반응형 분기 |

시맨틱 토큰 사용 시 이미 반응형이 내장된 경우 추가 분기 불필요:
- `p-(--spacing-card-padding) sm:p-(--spacing-card-padding-sm)` ← 이미 반응형

### 12.6 모바일 체크리스트 (개발 시 참조)

새 컴포넌트 개발 또는 기존 컴포넌트 수정 시 아래 체크리스트를 확인:

- [ ] flex 안의 button에 `shrink-0 whitespace-nowrap` 적용했는가?
- [ ] 아이콘 전용 버튼에 44×44px 터치 영역이 확보되었는가?
- [ ] 사용자 이름/제목 등 가변 텍스트에 `truncate` 또는 `line-clamp` 적용했는가?
- [ ] `justify-between` 사용 시 좌측에 `flex-1 min-w-0`, 우측에 `shrink-0` 적용했는가?
- [ ] 24px 이상 패딩에 `sm:` 반응형 분기가 있는가?

### 12.7 양호 사례 (벤치마크)

현재 코드베이스에서 올바르게 적용된 사례:

| 컴포넌트 | 패턴 | 적용 |
|----------|------|------|
| `Header.tsx` 햄버거 메뉴 | 터치 영역 | `min-h-[44px] min-w-[44px]` |
| `TabBar.tsx` | 텍스트 줄바꿈 방지 | `whitespace-nowrap` + `overflow-x-auto` |
| `PostDetail.tsx` 댓글 등록 | 버튼 보호 | `shrink-0 whitespace-nowrap` |
| `SalonCard.tsx` | 오버플로우 | `flex-1 min-w-0` + `truncate` |
| `ForumList.tsx` 히어로 검색 | 버튼 보호 | `flex-shrink-0` |
