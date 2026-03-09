import React from 'react';

interface LoginRequiredPopupProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginRequiredPopup: React.FC<LoginRequiredPopupProps> = ({ message, isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-xl p-6 max-w-xs w-full text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-foreground mb-4">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => { onLogin(); onClose(); }}
            className="px-4 py-2 text-sm font-medium text-cta-foreground bg-cta rounded-lg hover:bg-cta-700 transition-colors"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredPopup;
