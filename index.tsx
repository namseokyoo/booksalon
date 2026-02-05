import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { firebaseConfig } from './services/firebase';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Check if the placeholder Firebase config has been replaced.
const isFirebaseConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_');

// A component to display when Firebase is not configured.
const FirebaseNotConfigured = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200 p-4">
        <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Firebase 설정이 필요합니다</h1>
            <p className="text-gray-300 mb-4">
                앱을 실행하려면 Firebase 프로젝트 설정이 필요합니다. 아래 단계에 따라 <code className="bg-gray-700 text-cyan-400 p-1 rounded text-sm">services/firebase.ts</code> 파일을 업데이트해주세요.
            </p>
            <ol className="list-decimal list-inside text-gray-400 space-y-2 mb-6">
                <li><a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Firebase Console</a>로 이동하여 프로젝트를 만들거나 선택하세요.</li>
                <li>프로젝트 설정 <span className="text-white">(⚙️)</span> &gt; <span className="text-white">일반</span> 탭으로 이동하세요.</li>
                <li>'내 앱' 섹션에서 웹 앱을 선택하거나 새로 만드세요.</li>
                <li>'SDK 설정 및 구성'에서 '구성' 옵션을 선택하고, 제공된 <code className="bg-gray-700 p-1 rounded text-sm">firebaseConfig</code> 객체를 복사하세요.</li>
                <li>복사한 객체로 <code className="bg-gray-700 text-cyan-400 p-1 rounded text-sm">services/firebase.ts</code> 파일의 <code className="bg-gray-700 p-1 rounded text-sm">firebaseConfig</code> 변수를 교체하세요.</li>
            </ol>
            <div className="bg-gray-900 p-4 rounded-md">
                <pre className="text-sm text-yellow-300 overflow-x-auto"><code>
{`// services/firebase.ts

export const firebaseConfig = {
  // ▼▼▼ 이 부분을 복사한 설정으로 교체하세요 ▼▼▼
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
  // ▲▲▲ 여기까지 교체 ▲▲▲
};
`}
                </code></pre>
            </div>
        </div>
    </div>
);

root.render(
  <React.StrictMode>
    {isFirebaseConfigured ? (
      <AuthProvider>
        <App />
      </AuthProvider>
    ) : (
      <FirebaseNotConfigured />
    )}
  </React.StrictMode>
);
