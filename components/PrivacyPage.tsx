import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="prose max-w-none text-foreground">
        <h1 className="text-2xl font-bold font-serif mb-6">개인정보처리방침</h1>
        <p className="text-muted-foreground text-sm mb-6">최종 수정일: 2026년 3월 4일</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">1. 수집하는 개인정보</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            북살롱은 서비스 제공을 위해 다음의 개인정보를 수집합니다.
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>이메일 주소 (Google 또는 Kakao OAuth를 통해 수집)</li>
            <li>프로필 이름 및 사진 (OAuth 제공자로부터 선택적 수집)</li>
            <li>서비스 이용 기록 (게시물, 댓글, 좋아요, 북마크)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">2. 수집 목적</h2>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>회원 식별 및 서비스 제공</li>
            <li>게시물 및 댓글 작성 기능 제공</li>
            <li>사용자 간 소통 기능 제공</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">3. 소셜 로그인 (Google / Kakao OAuth)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            북살롱은 Google 및 Kakao OAuth를 통한 소셜 로그인을 제공합니다.
            로그인 시 각 서비스의 개인정보처리방침이 함께 적용되며, 북살롱은 OAuth 제공자로부터
            이메일 주소와 기본 프로필 정보만 수집합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">4. 데이터 보관 및 파기</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            수집된 개인정보는 회원 탈퇴 시 즉시 파기됩니다. 단, 관련 법령에 따라
            일정 기간 보관이 필요한 경우 해당 기간 동안 안전하게 보관 후 파기합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">5. 제3자 제공</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            북살롱은 원칙적으로 사용자의 개인정보를 외부에 제공하지 않습니다.
            다만, 서비스 운영을 위해 Supabase(데이터베이스), Vercel(호스팅),
            Google Analytics(서비스 분석)를 이용하며, 각 서비스의 개인정보처리방침이 적용됩니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">6. 문의</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            개인정보 관련 문의는 서비스 내 게시글을 통해 운영자에게 연락해주세요.
          </p>
        </section>
      </article>
    </div>
  );
};

export default PrivacyPage;
