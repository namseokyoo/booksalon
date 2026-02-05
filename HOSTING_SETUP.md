# Firebase Hosting 설정 가이드 (정적 사이트)

## ⚠️ 중요: App Hosting vs Hosting

### Firebase App Hosting
- **용도**: 서버 애플리케이션 (Node.js Express, Next.js 등)
- **특징**: 서버가 실행되어야 함 (PORT=8080 필요)
- **사용 불가**: 현재 프로젝트는 정적 사이트이므로 사용 불가 ❌

### Firebase Hosting (전통 방식)
- **용도**: 정적 사이트 (React SPA, Vue SPA 등)
- **특징**: 빌드된 정적 파일만 배포
- **사용 가능**: 현재 프로젝트에 적합 ✅

---

## 🚀 Firebase Hosting 배포 방법

### 1. 로컬에서 빌드 및 배포

```bash
# 1. 빌드
npm run build

# 2. 배포
firebase deploy --only hosting
```

### 2. GitHub Actions로 자동 배포 (선택사항)

`.github/workflows/deploy.yml` 파일이 있으면 자동 배포 가능합니다.

---

## 📋 배포 절차

### 1. 빌드
```bash
npm run build
```
- `dist` 폴더에 정적 파일 생성

### 2. 배포
```bash
firebase deploy --only hosting
```

### 3. 전체 배포 (Hosting + Functions + Firestore)
```bash
firebase deploy
```

---

## 🔧 Firebase 콘솔에서 App Hosting 제거

1. Firebase 콘솔 접속
2. **App Hosting** 메뉴로 이동
3. 설정된 App Hosting 삭제 (있다면)

---

## ✅ 현재 설정

- ✅ `firebase.json`에 `hosting` 설정 추가 완료
- ✅ 정적 사이트 배포 준비 완료
- ✅ SPA 라우팅 설정 완료 (`rewrites`)

---

## 📝 배포 명령어 요약

```bash
# 빌드
npm run build

# Hosting만 배포
firebase deploy --only hosting

# Functions만 배포
firebase deploy --only functions

# 전체 배포
firebase deploy
```

---

**작성일**: 2025-01-27  
**상태**: Firebase Hosting (전통 방식) 설정 완료

