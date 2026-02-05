# 북살롱 v0.4.0 백로그

> v0.3.0 QA에서 도출된 후속 조치 사항

## 🔴 높은 우선순위

### 1. runTransaction 적용 (태그 서비스)
- **출처**: v0.3.0 QA - Gemini 검토
- **파일**: services/tagService.ts
- **문제**: decrementTagCount에서 Race Condition 가능성
- **해결**: Firestore runTransaction 적용으로 원자적 연산 보장

### 2. 전문 검색 엔진 도입 검토
- **출처**: v0.3.0 QA - Gemini 검토
- **파일**: services/searchService.ts
- **문제**: 대규모 데이터에서 100개 포럼 순회 시 성능/비용 문제
- **해결**: Algolia 또는 Typesense 도입
- **참고**: PRD v0.4.0 마일스톤에 이미 Algolia 연동 계획 있음

## 🟡 중간 우선순위

### 3. searchTags Prefix 검색 개선
- **출처**: v0.3.0 QA - Gemini 검토
- **파일**: services/tagService.ts
- **문제**: 현재 >= 와 <= 조합의 prefix 검색은 완벽하지 않음
- **해결**: 더 정교한 검색 로직 또는 검색 엔진 연동

## 📋 참고
- v0.3.0 QA 리포트: docs/QA-REPORT-v0.3.0.md
- PRD: docs/PRD.md
