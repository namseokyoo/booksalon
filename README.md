# 📚 북살롱 (Book Salon)

> 책을 중심으로 한 지식 공유 및 토론 커뮤니티 플랫폼

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/namseokyoo/booksalon_251025/releases)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC.svg)](https://tailwindcss.com/)

**현재 버전**: `0.1.0` (베타) | [변경사항 보기](./CHANGELOG.md) | [버전 관리 가이드](./VERSION.md)

## 🎯 서비스 소개

북살롱은 특정 도서에 대해 깊이 있는 대화를 나눌 수 있는 커뮤니티 플랫폼입니다. ISBN 기반으로 특정 도서에 집중된 토론 공간을 제공하며, 독자들이 독서 경험을 공유하고 다양한 관점을 교환할 수 있습니다.

### ✨ 주요 기능

- 🔍 **도서 검색**: ISBN 또는 책 제목으로 도서 검색
- 🏛️ **살롱 생성**: 검색된 도서로 독서 토론 공간 생성
- 📝 **게시물 작성**: 살롱 내에서 독서 후기 및 토론 게시물 작성
- 💬 **댓글 시스템**: 게시물에 대한 댓글 작성 및 토론
- 👤 **사용자 프로필**: 확장된 프로필 정보 및 프로필 이미지 업로드
- ⭐ **북마크**: 관심 있는 살롱 북마크 및 관리
- ❤️ **소셜 기능**: 게시물/댓글 좋아요, 사용자 팔로우
- 🔔 **활동 피드**: 팔로우한 사용자의 활동 피드
- 🔎 **사용자 검색**: 다른 사용자 검색 및 팔로우
- 📊 **활동 통계**: 사용자 활동 통계 및 분석

## 🛠️ 기술 스택

### Frontend
- **React 19.2.0** - 최신 React 버전
- **TypeScript** - 타입 안정성
- **Vite** - 빠른 개발 서버
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크

### Backend
- **Firebase v12** - 최신 Firebase SDK
- **Firestore** - 실시간 NoSQL 데이터베이스
- **Firebase Authentication** - 사용자 인증
- **Firebase Storage** - 파일 저장소

### External APIs
- **카카오 도서 검색 API** - ISBN 및 제목 검색

## 🚀 시작하기

### 필수 조건

- Node.js 18.0.0 이상
- npm 또는 yarn
- Firebase 프로젝트
- 카카오 API 키

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/booksalon.git
   cd booksalon
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경변수 설정**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` 파일에 실제 값들을 입력:
   ```env
   # Firebase 설정 (Firebase 콘솔에서 확인)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # 카카오 API 키 (카카오 개발자 센터에서 발급)
   VITE_KAKAO_API_KEY=your_kakao_api_key
   ```

4. **Firebase 설정**
   - Firebase 콘솔에서 프로젝트 생성
   - Firestore, Authentication, Storage 활성화
   - 프로젝트 설정에서 웹 앱 추가
   - Firebase 설정 정보를 `.env.local`에 입력

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   ```
   http://localhost:3001
   ```

## 📁 프로젝트 구조

```
booksalon/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── Header.tsx       # 헤더 컴포넌트
│   │   ├── ForumList.tsx   # 포럼 목록
│   │   ├── ForumView.tsx   # 포럼 상세
│   │   ├── ProfilePage.tsx # 프로필 페이지
│   │   └── ...
│   ├── services/            # 서비스 레이어
│   │   ├── firebase.ts      # Firebase 설정
│   │   ├── userProfile.ts   # 사용자 프로필 서비스
│   │   ├── bookmarkService.ts # 북마크 서비스
│   │   └── ...
│   ├── contexts/            # React Context
│   │   └── AuthContext.tsx  # 인증 컨텍스트
│   ├── types.ts             # TypeScript 타입 정의
│   └── App.tsx              # 메인 앱 컴포넌트
├── public/                  # 정적 파일
├── .env.local              # 환경변수
├── firebase.json           # Firebase 설정
├── storage.rules           # Firebase Storage 규칙
└── README.md               # 프로젝트 문서
```

## 🔧 주요 기능 상세

### 📚 도서 검색
- ISBN 번호 또는 책 제목으로 도서 검색
- 카카오 도서 검색 API 연동
- 검색 결과에서 기존 살롱 확인 및 새 살롱 생성

### 🏛️ 살롱 시스템
- 도서 기반 독서 토론 공간
- 실시간 게시물 및 댓글 업데이트
- 북마크 기능으로 관심 살롱 관리

### 👤 사용자 프로필
- 닉네임, 프로필 이미지, 지역, 웹사이트
- 독서 목표, 선호 장르 설정
- 활동 통계 및 작성한 게시물/댓글 관리

### ❤️ 소셜 기능
- 게시물 및 댓글 좋아요
- 사용자 팔로우/언팔로우
- 팔로우한 사용자의 활동 피드
- 사용자 검색 및 프로필 확인

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: `cyan-400` (#22d3ee) - 브랜드 컬러
- **Background**: `gray-900` (#111827) - 메인 배경
- **Card**: `gray-800` (#1f2937) - 카드 배경
- **Text**: `white` (#ffffff) - 주요 텍스트

### 반응형 디자인
- 모바일 우선 접근
- `sm:`, `md:`, `lg:` 브레이크포인트 활용
- 터치 친화적인 UI

## 🔒 보안

- Firebase 보안 규칙 설정
- 사용자 인증 상태 검증
- 입력 데이터 검증 및 sanitization
- Firebase Storage 보안 규칙

## 📊 성능 최적화

- Firestore 쿼리 최적화
- 이미지 로딩 최적화
- 실시간 업데이트 효율성
- 클라이언트 사이드 이미지 압축

## 🧪 테스트

### 테스트 계정
프로젝트에는 다양한 페르소나의 테스트 계정이 포함되어 있습니다:

- **독서 애호가**: `booklover@test.com`
- **SF 매니아**: `scifi_fan@test.com`
- **문학 비평가**: `literary_critic@test.com`
- **자기계발 독자**: `self_improvement@test.com`
- **역사 애호가**: `history_buff@test.com`

모든 테스트 계정의 비밀번호: `password123`

## 🚀 배포

### Firebase 호스팅
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init hosting

# 빌드 및 배포
npm run build
firebase deploy
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📊 프로젝트 문서

- [CONTINUATION_GUIDE.md](./CONTINUATION_GUIDE.md) - 개발 가이드 및 로드맵
- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) - 경쟁사 분석 및 개선 계획
- [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md) - 개발 로그
- [FINAL_TEST_REPORT.md](./FINAL_TEST_REPORT.md) - 최종 테스트 리포트

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트 링크: [https://github.com/your-username/booksalon](https://github.com/your-username/booksalon)

## 🙏 감사의 말

- [React](https://reactjs.org/) - UI 라이브러리
- [Firebase](https://firebase.google.com/) - 백엔드 서비스
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [카카오](https://developers.kakao.com/) - 도서 검색 API

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!