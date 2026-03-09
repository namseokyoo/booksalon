import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'error';
  action?: { label: string; onClick: () => void };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', action, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 마운트 직후 fade-in
    const showTimer = setTimeout(() => setVisible(true), 10);

    const hideDelay = action ? 4500 : 3000;
    const closeDelay = action ? 4800 : 3300;

    // 3초 후 fade-out → 언마운트
    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, hideDelay);

    const closeTimer = setTimeout(() => {
      onClose();
    }, closeDelay);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [action, onClose]);

  const baseClasses =
    'fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-opacity duration-300';

  const typeClasses =
    type === 'error'
      ? 'bg-destructive/10 border-destructive text-destructive'
      : 'bg-surface border-border text-foreground';

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`${baseClasses} ${typeClasses} ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {message}
      {action && (
        <button
          onClick={(e) => { e.stopPropagation(); action.onClick(); onClose(); }}
          className="mt-2 block text-sm font-medium text-primary hover:text-primary-700 underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default Toast;
