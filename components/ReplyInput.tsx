import React, { useState } from 'react';

interface ReplyInputProps {
  parentId: string;
  onSubmit: (content: string, parentId: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ReplyInput: React.FC<ReplyInputProps> = ({ parentId, onSubmit, onCancel, isSubmitting = false }) => {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') {
      setError('답글 내용을 입력해주세요.');
      return;
    }
    setError(null);
    await onSubmit(content, parentId);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="답글을 입력하세요..."
        rows={2}
        disabled={isSubmitting}
        className="w-full p-2 bg-surface border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary resize-none"
      />
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[36px] px-3 py-1 bg-cta text-cta-foreground rounded-lg text-sm hover:bg-cta-700 font-medium disabled:opacity-50"
        >
          등록
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-h-[36px] px-3 py-1 bg-muted text-surface-foreground rounded-lg text-sm hover:bg-gray-300 font-medium disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
};

export default ReplyInput;
