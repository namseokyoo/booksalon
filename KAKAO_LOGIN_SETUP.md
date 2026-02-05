# 카카오 로그인 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 앱 등록
1. https://developers.kakao.com 접속
2. 카카오 계정으로 로그인
3. "내 애플리케이션" → "애플리케이션 추가하기"

### 앱 정보 입력
- **앱 이름**: 북살롱
- **사업자명**: (개인/회사명 입력)
- **앱 실행 환경**: 웹

### 플랫폼 설정
1. "앱 설정" → "플랫폼"
2. "Web 플랫폼 추가" 클릭
3. 사이트 도메인: `http://localhost:3000`
4. Redirect URI: `http://localhost:3000/kakao/callback`

### 카카오 로그인 활성화
1. "제품 설정" → "카카오 로그인" ON
2. Redirect URI: `http://localhost:3000/kakao/callback` 등록
3. "동의항목" 설정:
   - 닉네임 (필수)
   - 프로필 사진 (선택)
   - 이메일 (선택)

### 앱 키 확인
"앱 키" 메뉴에서 다음 키를 복사:
- **REST API 키** ← 이걸 사용합니다!

## 2. 환경 변수 설정

`.env.local` 파일에 카카오 REST API 키를 추가하세요:

```env
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key_here
```

## 3. 코드에 카카오 SDK 추가

`index.html`에 카카오 SDK 스크립트를 추가합니다:

```html
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"></script>
```

## 4. 테스트

1. 개발 서버 실행: `npm run dev`
2. 로그인 모달 열기
3. "카카오로 로그인" 버튼 클릭
4. 카카오 로그인 팝업에서 로그인
5. Redirect URI로 돌아와서 로그인 완료
