import React from 'react';

interface BookLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap: Record<NonNullable<BookLoaderProps['size']>, number> = {
  sm: 60,
  md: 120,
  lg: 180,
};

const BookLoader: React.FC<BookLoaderProps> = ({
  size = 'md',
  label = '콘텐츠를 불러오는 중',
  className,
}) => {
  const px = sizeMap[size];

  return (
    <div
      className={`bl-book-loader flex h-64 items-center justify-center ${className ?? ''}`.trim()}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <style>{`
        .bl-book-loader {
          --bl-book-green: var(--color-primary, oklch(0.42 0.06 155));
          --bl-page-fill: var(--color-surface, #ffffff);
          --bl-page-stroke: var(--color-border, #d9d3c7);
          --bl-page-line: var(--color-border, #d8d2c4);
          --bl-shadow-soft-color: rgba(31, 90, 63, 0.14);
          --bl-shadow-main-color: rgba(31, 90, 63, 0.22);
        }

        .bl-book-loader svg {
          overflow: visible;
        }

        .bl-shadow-soft,
        .bl-shadow-main {
          transform-box: fill-box;
          transform-origin: center;
        }

        .bl-shadow-soft {
          fill: var(--bl-shadow-soft-color);
          animation: bl-shadow-soft-breathe 1.8s ease-in-out infinite;
        }

        .bl-shadow-main {
          fill: var(--bl-shadow-main-color);
          animation: bl-shadow-main-breathe 1.8s ease-in-out infinite;
        }

        .bl-book-body {
          animation: bl-book-float 1.8s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .bl-book-inner {
          fill: var(--bl-book-green);
          fill-opacity: 0.12;
          stroke: none;
        }

        .bl-book-outline,
        .bl-spine {
          fill: none;
          stroke: var(--bl-book-green);
          stroke-width: 2.1;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .bl-spine {
          stroke-width: 1.8;
          opacity: 0.92;
        }

        .bl-page-shape {
          fill: var(--bl-page-fill);
          stroke: var(--bl-page-stroke);
          stroke-width: 1.3;
          stroke-linejoin: round;
        }

        .bl-page-line {
          stroke: var(--bl-page-line);
          stroke-width: 1.2;
          stroke-linecap: round;
          opacity: 0.95;
        }

        .bl-page {
          animation: bl-page-flip 1.8s cubic-bezier(0.45, 0, 0.2, 1) infinite;
          opacity: 0;
          transform-box: fill-box;
          transform-origin: left center;
        }

        .bl-p1 {
          animation-delay: 0s;
        }

        .bl-p2 {
          animation-delay: 0.22s;
        }

        .bl-p3 {
          animation-delay: 0.44s;
        }

        @keyframes bl-book-float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes bl-shadow-soft-breathe {
          0%,
          100% {
            opacity: 0.78;
            transform: scaleX(1) scaleY(1);
          }

          50% {
            opacity: 0.58;
            transform: scaleX(0.92) scaleY(0.92);
          }
        }

        @keyframes bl-shadow-main-breathe {
          0%,
          100% {
            opacity: 0.88;
            transform: scaleX(1) scaleY(1);
          }

          50% {
            opacity: 0.68;
            transform: scaleX(0.88) scaleY(0.88);
          }
        }

        @keyframes bl-page-flip {
          0%,
          18% {
            opacity: 0;
            transform: translateX(0) rotate(0deg);
          }

          24% {
            opacity: 1;
            transform: translateX(0) rotate(0deg);
          }

          55% {
            opacity: 1;
            transform: translateX(-1px) rotate(-12deg);
          }

          82% {
            opacity: 0;
            transform: translateX(-6px) rotate(-34deg);
          }

          100% {
            opacity: 0;
            transform: translateX(-6px) rotate(-34deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .bl-book-body,
          .bl-shadow-soft,
          .bl-shadow-main,
          .bl-page {
            animation: none !important;
          }
        }
      `}</style>
      <svg
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
        width={px}
        height={px}
        aria-hidden="true"
      >
        <ellipse className="bl-shadow-soft" cx="60" cy="97.2" rx="28.5" ry="6.6" />
        <ellipse className="bl-shadow-main" cx="60" cy="96.6" rx="21.5" ry="4.1" />

        <g className="bl-book-body">
          <path
            className="bl-book-inner"
            d="M32 41 Q45 37 60 37.2 Q75 37 88 41 L88 80 Q75 77 60 77.2 Q45 77 32 80 Z"
          />

          <path
            className="bl-page-shape"
            d="M33 39 C42.8 37.6 51.2 37.6 58 38.2 L58 75.2 C51.2 74.8 42.8 75 33 77 Z"
          />
          <line className="bl-page-line" x1="39" y1="49" x2="54.8" y2="47" />
          <line className="bl-page-line" x1="39" y1="55" x2="54.8" y2="53" />
          <line className="bl-page-line" x1="39" y1="61" x2="54.8" y2="59" />
          <line className="bl-page-line" x1="39" y1="67" x2="54.8" y2="65" />

          <path
            className="bl-page-shape"
            d="M61.2 38.2 C68 37.6 76.4 37.6 86.2 39 L86.2 77 C76.4 75 68 74.8 61.2 75.2 Z"
          />
          <line className="bl-page-line" x1="66.4" y1="49" x2="82.2" y2="47" />
          <line className="bl-page-line" x1="66.4" y1="55" x2="82.2" y2="53" />
          <line className="bl-page-line" x1="66.4" y1="61" x2="82.2" y2="59" />
          <line className="bl-page-line" x1="66.4" y1="67" x2="82.2" y2="65" />

          <g className="bl-page bl-p1">
            <path
              className="bl-page-shape"
              d="M60 38.1 C67.2 37.4 75.2 37.5 84.8 38.8 L84.8 76.8 C75.2 75.2 67.2 75 60 75.4 Z"
            />
            <line className="bl-page-line" x1="65.1" y1="49" x2="80.5" y2="47" />
            <line className="bl-page-line" x1="65.1" y1="55" x2="80.5" y2="53" />
            <line className="bl-page-line" x1="65.1" y1="61" x2="80.5" y2="59" />
            <line className="bl-page-line" x1="65.1" y1="67" x2="80.5" y2="65" />
          </g>

          <g className="bl-page bl-p2">
            <path
              className="bl-page-shape"
              d="M60 38.1 C67.2 37.4 75.2 37.5 84.8 38.8 L84.8 76.8 C75.2 75.2 67.2 75 60 75.4 Z"
            />
            <line className="bl-page-line" x1="65.1" y1="49" x2="80.5" y2="47" />
            <line className="bl-page-line" x1="65.1" y1="55" x2="80.5" y2="53" />
            <line className="bl-page-line" x1="65.1" y1="61" x2="80.5" y2="59" />
            <line className="bl-page-line" x1="65.1" y1="67" x2="80.5" y2="65" />
          </g>

          <g className="bl-page bl-p3">
            <path
              className="bl-page-shape"
              d="M60 38.1 C67.2 37.4 75.2 37.5 84.8 38.8 L84.8 76.8 C75.2 75.2 67.2 75 60 75.4 Z"
            />
            <line className="bl-page-line" x1="65.1" y1="49" x2="80.5" y2="47" />
            <line className="bl-page-line" x1="65.1" y1="55" x2="80.5" y2="53" />
            <line className="bl-page-line" x1="65.1" y1="61" x2="80.5" y2="59" />
            <line className="bl-page-line" x1="65.1" y1="67" x2="80.5" y2="65" />
          </g>

          <path
            className="bl-book-outline"
            d="M32 80 L32 41 Q45 37 60 37.2 Q75 37 88 41 L88 80"
          />
          <path className="bl-book-outline" d="M32 41 Q45 35.8 60 37.2 Q75 35.8 88 41" />
          <path className="bl-book-outline" d="M32 80 Q45 77 60 77.2 Q75 77 88 80" />

          <line className="bl-spine" x1="60" y1="37.2" x2="60" y2="77.2" />
        </g>
      </svg>
    </div>
  );
};

export default BookLoader;
