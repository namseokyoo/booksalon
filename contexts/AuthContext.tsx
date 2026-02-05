
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { UserProfileService } from '../services/userProfile';

interface AuthContextType {
  currentUser: any | null;
  loading: boolean;
  // FIX: Update parameter names from 'pass' to 'password' to match the implementation signature.
  signup: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
  loginWithKakao: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export { type AuthContextType };

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  // FIX: Add a null check to ensure the hook is used within the provider context.
  // This provides a clearer error message and improves type safety for components using this hook.
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // FIX: Add explicit types to function parameters to avoid implicit 'any' errors.
  function signup(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // FIX: Add explicit types to function parameters to avoid implicit 'any' errors.
  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Google 로그인 성공
      const user = result.user;
      if (user) {
        // 프로필 생성/업데이트
        await UserProfileService.createOrUpdateProfile(
          user.uid,
          user.email || '',
          user.displayName || undefined,
          undefined,
          user.displayName || undefined
        );
      }

      // 동일한 이메일의 계정이 있으면 자동으로 연결
      if (user.email) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, user.email);
          if (methods.includes('password') && !user.providerData.find((p: any) => p.providerId === 'password')) {
            // 이메일/비밀번호 계정이 있는데 연결되지 않은 경우, 사용자에게 알림
            console.log('⚠️ 동일한 이메일의 계정이 있습니다. 프로필을 확인해주세요.');
          }
        } catch (err) {
          // 에러 무시 (계정이 없는 경우 등)
        }
      }
    } catch (error: any) {
      // Firebase가 자동으로 계정을 연결할 수 있는 경우 에러 처리
      if (error.code === 'auth/account-exists-with-different-credential') {
        // 이 경우 사용자에게 기존 계정으로 로그인하도록 안내해야 함
        throw new Error('이미 이메일/비밀번호로 등록된 계정이 있습니다. 해당 방법으로 먼저 로그인한 후 소셜 로그인을 연결할 수 있습니다.');
      }
      console.error('Google 로그인 실패:', error);
      throw error;
    }
  }

  async function loginWithKakao() {
    // Firebase OIDC (Kakao) 사용: Firebase 콘솔에 'OpenID Connect' 제공자 등록 필요
    // Provider ID 예시: 'oidc.kakao'
    const provider = new OAuthProvider('oidc.kakao');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user) {
        await UserProfileService.createOrUpdateProfile(
          user.uid,
          user.email || '',
          user.displayName || undefined,
          undefined,
          user.displayName || undefined
        );
      }

      // 동일한 이메일의 계정이 있으면 자동으로 연결
      if (user.email) {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, user.email);
          if (methods.includes('password') && !user.providerData.find((p: any) => p.providerId === 'password')) {
            // 이메일/비밀번호 계정이 있는데 연결되지 않은 경우, 사용자에게 알림
            console.log('⚠️ 동일한 이메일의 계정이 있습니다. 프로필을 확인해주세요.');
          }
        } catch (err) {
          // 에러 무시 (계정이 없는 경우 등)
        }
      }
    } catch (error: any) {
      // Firebase가 자동으로 계정을 연결할 수 있는 경우 에러 처리
      if (error.code === 'auth/account-exists-with-different-credential') {
        // 이 경우 사용자에게 기존 계정으로 로그인하도록 안내해야 함
        throw new Error('이미 이메일/비밀번호로 등록된 계정이 있습니다. 해당 방법으로 먼저 로그인한 후 소셜 로그인을 연결할 수 있습니다.');
      }
      console.error('Kakao(OIDC) 로그인 실패:', error);
      throw error;
    }
  }

  function logout() {
    return signOut(auth);
  }

  function deleteAccount() {
    const user = auth.currentUser;
    if (user) {
      return deleteUser(user);
    }
    return Promise.reject(new Error("No user is logged in."));
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자 프로필 생성/업데이트
        try {
          // 소셜 로그인 사용자의 경우 displayName과 email을 활용
          const displayName = user.displayName || user.email?.split('@')[0] || '사용자';
          const nickname = user.displayName || displayName;

          await UserProfileService.createOrUpdateProfile(
            user.uid,
            user.email || '',
            displayName,
            undefined, // bio
            nickname
          );
          console.log('✅ 사용자 프로필 생성/업데이트 완료');
        } catch (error) {
          console.error('프로필 생성/업데이트 실패:', error);
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    loginWithGoogle,
    loginWithKakao,
    logout,
    deleteAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}