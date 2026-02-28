import React from 'react';

interface ForumListErrorProps {
  errorMessage: string;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}

const ForumListError: React.FC<ForumListErrorProps> = ({
  errorMessage,
  onRetry,
  retryCount,
  maxRetries,
}) => {
  const canRetry = retryCount < maxRetries;

  return (
    <div
      data-testid="forum-list-error"
      className="max-w-4xl mx-auto p-3 sm:p-6 lg:p-8"
    >
      <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
        {/* 에러 아이콘 */}
        <svg
          className="h-14 w-14 sm:h-16 sm:w-16 text-destructive/70 mb-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>

        {/* 에러 메시지 */}
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
          데이터를 불러오지 못했습니다
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mb-6 leading-relaxed">
          {errorMessage}
        </p>

        {/* 재시도 버튼 또는 안내 메시지 */}
        {canRetry ? (
          <button
            data-testid="retry-button"
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-medium rounded-lg px-6 py-2.5 hover:brightness-110 transition-all duration-200 shadow-sm"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            다시 시도
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            잠시 후 다시 방문해주세요.
          </p>
        )}

        {/* 재시도 카운트 표시 */}
        {retryCount > 0 && canRetry && (
          <p className="mt-3 text-xs text-muted-foreground">
            재시도 {retryCount}/{maxRetries}회
          </p>
        )}
      </div>
    </div>
  );
};

export default ForumListError;
