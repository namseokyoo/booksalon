import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ToastState {
  message: string;
  type: 'info' | 'error';
}

interface ToastContextType {
  toast: ToastState | null;
  showToast: (message: string, type?: 'info' | 'error') => void;
  clearToast: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ toast, showToast, clearToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
