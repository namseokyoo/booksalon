# GitHub Actions 자동 배포 설정 가이드

## 🚀 자동 배포 설정

### ✅ 완료된 작업
- ✅ GitHub Actions 워크플로우 생성 (`.github/workflows/deploy.yml`)
- ✅ `production` 브랜치에 푸시 시 자동 배포 설정

---

## 📋 GitHub Secrets 설정 (필수)

### 1. Firebase Token 생성

로컬에서 Firebase CLI로 토큰 생성:

```bash
# Firebase CLI 설치 (아직 안 했다면)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# CI/CD용 토큰 생성
firebase login:ci
```

생성된 토큰을 복사해두세요. (예: `1//xxxxxxxxxxxxx`)

### 2. GitHub Secrets 추가

1. GitHub 저장소 접속: https://github.com/namseokyoo/booksalon_251025
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 클릭하여 다음 Secrets 추가:

#### 필수 Secrets

**1. FIREBASE_TOKEN**
- **이름**: `FIREBASE_TOKEN`
- **값**: `firebase login:ci` 명령어로 생성한 토큰

**2. 환경 변수 Secrets (빌드용)**

다음 환경 변수들을 Secrets로 추가:

- `VITE_FIREBASE_API_KEY`: Firebase API 키
- `VITE_FIREBASE_AUTH_DOMAIN`: `booksalon-2301f.firebaseapp.com`
- `VITE_FIREBASE_PROJECT_ID`: `booksalon-2301f`
- `VITE_FIREBASE_STORAGE_BUCKET`: `booksalon-2301f.firebasestorage.app`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID`: Firebase App ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Firebase Measurement ID (선택사항)
- `VITE_KAKAO_API_KEY`: 카카오 API 키

---

## 🔄 자동 배포 프로세스

### 배포 트리거
- **자동**: `production` 브랜치에 푸시 시 자동 배포
- **수동**: GitHub Actions 탭에서 수동 실행 가능

### 배포 단계
1. GitHub에 푸시 (`production` 브랜치)
2. GitHub Actions 자동 실행
3. Node.js 환경 설정
4. 의존성 설치 (`npm ci`)
5. 빌드 (`npm run build`)
6. Firebase Hosting에 배포

---

## 📝 사용 방법

### 1. 개발 후 배포

```bash
# 1. main 브랜치에서 개발
git checkout main
# ... 코드 수정 ...

# 2. production 브랜치로 머지
git checkout production
git merge main
git push origin production

# 3. 자동 배포 시작 (GitHub Actions가 자동 실행)
```

### 2. 직접 production에 커밋 (권장하지 않음)

```bash
git checkout production
# ... 코드 수정 ...
git add .
git commit -m "Update"
git push origin production
```

### 3. 수동 배포 (GitHub Actions에서)

1. GitHub 저장소 → **Actions** 탭
2. **Deploy to Firebase Hosting** 워크플로우 선택
3. **Run workflow** 클릭
4. 브랜치 선택 후 실행

---

## 🔍 배포 상태 확인

### GitHub Actions에서 확인
- 저장소 → **Actions** 탭
- 워크플로우 실행 상태 확인
- 로그 확인 가능

### Firebase 콘솔에서 확인
- https://console.firebase.google.com/project/booksalon-2301f/hosting
- 배포된 버전 확인

---

## ⚙️ 워크플로우 설정 변경

`.github/workflows/deploy.yml` 파일을 수정하여:
- 다른 브랜치에서도 배포 가능
- 배포 전 테스트 추가 가능
- 여러 환경 배포 설정 가능

---

## 🐛 문제 해결

### 배포 실패 시
1. GitHub Actions 로그 확인
2. Secrets 설정 확인
3. 빌드 에러 확인
4. Firebase 권한 확인

### 빌드 실패 시
- 환경 변수 누락 확인
- `npm ci` 실패 시 `package-lock.json` 확인
- Node.js 버전 확인 (현재: 20)

---

## 📊 현재 설정 요약

- **배포 브랜치**: `production`
- **빌드 명령어**: `npm run build`
- **배포 대상**: Firebase Hosting
- **프로젝트 ID**: `booksalon-2301f`
- **Node.js 버전**: 20

---

**작성일**: 2025-01-27  
**상태**: 자동 배포 설정 완료, GitHub Secrets 설정 필요

