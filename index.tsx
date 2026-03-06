/**
 * 북살롱 v0.5.1
 */
import "./sentry";
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ModalProvider } from './contexts/ModalContext';
import { ToastProvider } from './contexts/ToastContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.startsWith('YOUR_');

const SupabaseNotConfigured = () => (
  <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
    <div className="max-w-2xl w-full bg-surface rounded-lg shadow-xl p-8">
      <h1 className="text-2xl font-bold text-destructive mb-4">Supabase 설정이 필요합니다</h1>
      <p className="text-surface-foreground mb-4">
        앱을 실행하려면 Supabase 프로젝트 설정이 필요합니다.
      </p>
    </div>
  </div>
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Sentry.ErrorBoundary fallback={<p>오류가 발생했습니다. 페이지를 새로고침해주세요.</p>}>
        {isSupabaseConfigured ? (
          <SupabaseAuthProvider>
            <ModalProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </ModalProvider>
          </SupabaseAuthProvider>
        ) : (
          <SupabaseNotConfigured />
        )}
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
