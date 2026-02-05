# 버전 관리 가이드

## 버전 번호 체계

이 프로젝트는 [Semantic Versioning (SemVer)](https://semver.org/lang/ko/)을 따릅니다.

형식: `MAJOR.MINOR.PATCH` (예: `0.1.0`)

- **MAJOR**: 호환되지 않는 API 변경
- **MINOR**: 하위 호환성을 유지하면서 기능 추가
- **PATCH**: 하위 호환성을 유지하면서 버그 수정

## 현재 버전: 0.3.0

현재 프로젝트는 **0.x.x** 버전으로, 개발/베타 단계입니다.
- `0.1.0`: 초기 라이트 테마 UI 완성 버전
- `0.2.0`: 필터 UI 개선 및 통합 검색 기능 추가
- `0.3.0`: 태그 시스템, 검색 개선, 이미지 업로드, 평점 시스템 추가
- `1.0.0`: 정식 출시 버전 (향후 목표)

## 버전 관리 워크플로우

### 1. 버전 업데이트 시점

- **PATCH (0.1.0 → 0.1.1)**: 버그 수정, 작은 UI 개선
- **MINOR (0.1.0 → 0.2.0)**: 새로운 기능 추가, UI 개선
- **MAJOR (0.x.x → 1.0.0)**: 정식 출시, 주요 아키텍처 변경

### 2. 버전 업데이트 절차

1. **변경사항 확인**
   ```bash
   git log --oneline
   ```

2. **버전 번호 업데이트**
   - `package.json`의 `version` 필드 수정
   - `CHANGELOG.md`에 변경사항 기록

3. **버전 브랜치 생성**
   ```bash
   git checkout -b release/v0.x.x
   ```

4. **커밋 및 푸시**
   ```bash
   git add .
   git commit -m "chore: bump version to 0.x.x"
   git push origin release/v0.x.x
   ```

5. **메인 브랜치에 머지**
   ```bash
   git checkout main
   git merge release/v0.x.x
   git push origin main
   ```

6. **태그 생성 (선택사항)**
   ```bash
   git tag -a v0.x.x -m "Version 0.x.x"
   git push origin v0.x.x
   ```

### 3. CHANGELOG 작성 규칙

- **Added**: 새로운 기능
- **Changed**: 기존 기능 변경
- **Deprecated**: 곧 제거될 기능
- **Removed**: 제거된 기능
- **Fixed**: 버그 수정
- **Security**: 보안 관련 수정

### 4. 버전 브랜치 네이밍

- `release/v0.x.x`: 버전 릴리스 브랜치
- `feature/xxx`: 기능 개발 브랜치
- `fix/xxx`: 버그 수정 브랜치
- `hotfix/v0.x.x`: 긴급 수정 브랜치

## 다음 버전 계획

### 0.4.0 (예정)
- 다크 모드 토글 기능
- 반응형 디자인 개선
- 성능 최적화

### 0.5.0 (예정)
- 추가 소셜 기능
- 알림 시스템
- 실시간 채팅

### 1.0.0 (목표)
- 정식 출시
- 모든 핵심 기능 완성
- 안정성 확보
