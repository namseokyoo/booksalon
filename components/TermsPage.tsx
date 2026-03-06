import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="prose max-w-none text-foreground">
        <h1 className="text-2xl font-bold font-serif mb-6">이용약관</h1>
        <p className="text-muted-foreground text-sm mb-6">최종 수정일: 2026년 3월 4일</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            본 약관은 북살롱(이하 "서비스")이 제공하는 독서 커뮤니티 서비스의 이용 조건 및
            절차에 관한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">제2조 (서비스 이용)</h2>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li>서비스는 소셜 로그인(Google, Kakao)을 통해 가입 후 이용할 수 있습니다.</li>
            <li>사용자는 서비스를 통해 독서 관련 게시물 작성, 댓글, 좋아요, 북마크 기능을 이용할 수 있습니다.</li>
            <li>서비스는 사전 공지 없이 내용을 변경하거나 중단할 수 있습니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">제3조 (금지 행위)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            사용자는 다음의 행위를 해서는 안 됩니다.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>타인을 비방하거나 명예를 훼손하는 행위</li>
            <li>불법적이거나 부적절한 콘텐츠 게시</li>
            <li>스팸 또는 광고성 콘텐츠 게시</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>타인의 개인정보를 무단으로 수집하거나 이용하는 행위</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">제4조 (콘텐츠 저작권)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            사용자가 서비스에 게시한 게시물, 댓글 등의 저작권은 해당 사용자에게 있습니다.
            단, 사용자는 서비스 운영 및 홍보를 위한 범위 내에서 해당 콘텐츠를 사용할 수 있도록
            서비스 운영자에게 비독점적 라이선스를 부여합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">제5조 (면책)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            서비스는 사용자가 게시한 콘텐츠에 대한 책임을 지지 않습니다.
            서비스 이용 중 발생하는 손해에 대해 서비스 운영자는 고의 또는 중과실이 없는 한
            책임을 지지 않습니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">제6조 (약관 변경)</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            본 약관은 서비스 내 공지를 통해 변경될 수 있으며, 변경된 약관은 공지 후 7일이 경과하면
            효력이 발생합니다.
          </p>
        </section>
      </article>
    </div>
  );
};

export default TermsPage;
