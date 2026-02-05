/**
 * @deprecated v0.4.0부터 Firebase 대신 Supabase 사용
 *
 * 이 파일은 점진적 마이그레이션을 위해 유지되고 있습니다.
 * 새로운 코드에서는 lib/supabase.ts와 lib/services/를 사용하세요.
 *
 * 완전한 마이그레이션 후 이 파일은 삭제됩니다.
 */
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase 설정 (점진적 마이그레이션용, 추후 제거 예정)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화 (환경변수 없으면 비활성화)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // 환경변수가 없으면 초기화하지 않음
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    console.warn('[Firebase] 환경변수 미설정. Firebase 기능이 비활성화됩니다.');
  }
} catch (error) {
  console.warn('[Firebase] 초기화 실패. Firebase 기능이 비활성화됩니다:', error);
}

// Firebase 서비스 내보내기 (null일 수 있음)
export { auth, db, storage };
