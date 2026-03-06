import React from 'react';

interface HighlightTextProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * 검색어 하이라이트 컴포넌트
 * 주어진 텍스트에서 검색어와 일치하는 부분을 하이라이트 표시합니다.
 */
const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlight,
  className = '',
  highlightClassName = 'bg-highlight text-highlight-foreground font-medium',
}) => {
  // 검색어가 없거나 텍스트가 없으면 그대로 반환
  if (!highlight.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  // 검색어를 정규식으로 변환 (특수문자 이스케이프)
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');

  // 텍스트를 검색어 기준으로 분할
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // 검색어와 일치하는 부분인지 확인 (대소문자 무시)
        const isMatch = part.toLowerCase() === highlight.toLowerCase();

        if (isMatch) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

/**
 * HTML 문자열에서 검색어를 하이라이트 태그로 감싸는 유틸 함수
 * XSS 방지를 위해 실제로 innerHTML을 사용하지 않고, React 컴포넌트 방식 권장
 */
export const highlightSearchTerm = (text: string, term: string): string => {
  if (!term.trim() || !text) {
    return text;
  }

  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');

  return text.replace(regex, '<mark class="bg-highlight text-highlight-foreground font-medium">$1</mark>');
};

export default HighlightText;
