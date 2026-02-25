/**
 * 북살롱 v0.5.1
 */
import "./sentry";
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import './index.css';
import App from './App';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Supabase 환경 변수 확인
const isSupabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.startsWith('YOUR_');

// Supabase 설정이 없을 때 표시할 컴포넌트
const SupabaseNotConfigured = () => (
  <div className="flex items-center justify-center min-h-screen bg-background text-foreground p-4">
    <div className="max-w-2xl w-full bg-surface rounded-lg shadow-xl p-8">
      <h1 className="text-2xl font-bold text-red-400 mb-4">Supabase 설정이 필요합니다</h1>
      <p className="text-surface-foreground mb-4">
        앱을 실행하려면 Supabase 프로젝트 설정이 필요합니다. 아래 단계에 따라 <code className="bg-muted text-cyan-400 p-1 rounded text-sm">.env</code> 파일을 생성해주세요.
      </p>
      <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-6">
        <li><a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Supabase Dashboard</a>로 이동하여 프로젝트를 만들거나 선택하세요.</li>
        <li>프로젝트 설정 <span className="text-white">(⚙️)</span> &gt; <span className="text-white">API</span> 탭으로 이동하세요.</li>
        <li>Project URL과 anon/public 키를 복사하세요.</li>
        <li>프로젝트 루트에 <code className="bg-muted text-cyan-400 p-1 rounded text-sm">.env</code> 파일을 생성하고 아래 형식으로 입력하세요.</li>
      </ol>
      <div className="bg-background p-4 rounded-md">
        <pre className="text-sm text-yellow-300 overflow-x-auto"><code>
{`# .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
`}
        </code></pre>
      </div>
    </div>
  </div>
);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Sentry.ErrorBoundary fallback={<p>오류가 발생했습니다. 페이지를 새로고침해주세요.</p>}>
        {isSupabaseConfigured ? (
          <SupabaseAuthProvider>
            <App />
          </SupabaseAuthProvider>
        ) : (
          <SupabaseNotConfigured />
        )}
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
