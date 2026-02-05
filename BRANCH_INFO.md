# 배포 브랜치 정보

## 📋 브랜치 구조

### 브랜치 목록
- **main**: 개발 브랜치
- **production**: 배포용 브랜치 ✅

---

## 🚀 배포 브랜치 사용 방법

### Firebase App Hosting 설정 시
- **브랜치**: `production` 선택
- Firebase 콘솔에서 App Hosting 설정 시 `production` 브랜치를 선택하세요

### 배포 프로세스
1. **개발**: `main` 브랜치에서 작업
2. **테스트**: 로컬에서 테스트 완료
3. **배포**: `production` 브랜치에 머지
4. **자동 배포**: Firebase App Hosting이 자동으로 감지하여 배포

---

## 🔄 production 브랜치 업데이트 방법

### 방법 1: main에서 production으로 머지
```bash
git checkout production
git merge main
git push origin production
```

### 방법 2: 직접 production에 커밋 (권장하지 않음)
```bash
git checkout production
# 코드 수정
git add .
git commit -m "Update"
git push origin production
```

---

## 📝 현재 상태

- ✅ `production` 브랜치 생성 완료
- ✅ GitHub에 푸시 완료
- ✅ Firebase App Hosting 설정 대기

**브랜치 URL**: https://github.com/namseokyoo/booksalon_251025/tree/production

---

**작성일**: 2025-01-27

