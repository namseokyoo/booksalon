
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SignUpModalProps {
  onClose: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'invalid_format'>('idle');
  const { signup, loginWithGoogle, loginWithKakao } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const latestEmailValueRef = useRef('');
  const emailCheckRequestIdRef = useRef(0);

  // ESC 키로 닫기 + 포커스 트래핑
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const firstInput = modalRef.current?.querySelector<HTMLElement>('input');
    firstInput?.focus();

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const checkEmailDuplicate = async (emailValue: string) => {
    if (!emailValue) {
      return;
    }

    const requestId = ++emailCheckRequestIdRef.current;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      if (latestEmailValueRef.current === emailValue && requestId === emailCheckRequestIdRef.current) {
        setEmailStatus('invalid_format');
      }
      return;
    }

    setEmailStatus('checking');

    try {
      const { data, error: emailCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailValue)
        .maybeSingle();

      if (latestEmailValueRef.current !== emailValue || requestId !== emailCheckRequestIdRef.current) {
        return;
      }

      if (emailCheckError) {
        setEmailStatus('idle');
        return;
      }

      setEmailStatus(data ? 'duplicate' : 'available');
    } catch {
      if (latestEmailValueRef.current === emailValue && requestId === emailCheckRequestIdRef.current) {
        setEmailStatus('idle');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailStatus === 'checking' || emailStatus === 'duplicate' || emailStatus === 'invalid_format') {
      return;
    }
    if (password !== passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    if (password.length < 6) {
      return setError('비밀번호는 6자 이상이어야 합니다.');
    }
    if (!nickname.trim()) {
      return setError('닉네임을 입력해주세요.');
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return setError('닉네임은 2자 이상 20자 이하여야 합니다.');
    }

    try {
      setError('');
      setLoading(true);
      const result = await signup(email, password);

      // 회원가입 후 닉네임 저장
      if (result?.user) {
        const { UserService } = await import('../lib/services');
        await UserService.createOrUpdateProfile(
          result.user.id,
          email,
          email.split('@')[0], // displayName
          nickname, // nickname
          undefined // bio
        );
      }

      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes('User already registered') ||
        errorMessage.includes('already been registered') ||
        errorMessage.includes('email address is already registered') ||
        errorMessage.toLowerCase().includes('already')
      ) {
        setError('이미 가입된 이메일입니다. 로그인을 이용해 주세요.');
      } else {
        setError('회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
      console.error(err);
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      setSocialLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: unknown) {
      setError('구글 가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      console.error(err);
    }
    setSocialLoading(false);
  };

  const handleKakaoSignUp = async () => {
    try {
      setError('');
      setSocialLoading(true);
      await loginWithKakao();
      onClose();
    } catch (err: unknown) {
      setError('카카오 가입 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      console.error(err);
    }
    setSocialLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="signup-modal-title" ref={modalRef}>
      <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-xl w-full max-w-xs sm:max-w-sm">
        <div className="p-4 sm:p-6">
          <h3 id="signup-modal-title" className="text-base sm:text-lg font-medium font-serif leading-6 text-foreground mb-3 sm:mb-4 text-center">북살롱에 오신 것을 환영합니다</h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-3 sm:mb-4">여기선 책에 대해 질문을 남기고, 누군가의 생각을 만날 수 있어요.</p>
          {error && <p className="bg-destructive/5 border border-destructive/20 text-destructive text-sm p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">{error}</p>}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-1">이메일 주소</label>
              <input
                id="signup-email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                placeholder="이메일"
                value={email}
                onChange={(e) => {
                  const nextEmail = e.target.value;
                  latestEmailValueRef.current = nextEmail;
                  emailCheckRequestIdRef.current += 1;
                  setEmail(nextEmail);
                  setEmailStatus('idle');
                }}
                onBlur={(e) => checkEmailDuplicate(e.target.value)}
              />
              {emailStatus === 'checking' && (
                <p className="text-xs text-muted-foreground mt-1">확인 중...</p>
              )}
              {emailStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1">사용 가능한 이메일입니다</p>
              )}
              {emailStatus === 'duplicate' && (
                <p className="text-xs text-destructive mt-1">이미 사용 중인 이메일입니다</p>
              )}
              {emailStatus === 'invalid_format' && (
                <p className="text-xs text-destructive mt-1">올바른 이메일 형식이 아닙니다</p>
              )}
            </div>
            <div>
              <label htmlFor="signup-nickname" className="block text-sm font-medium text-foreground mb-1">닉네임</label>
              <input
                id="signup-nickname"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                placeholder="닉네임 (2-20자)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-1">비밀번호</label>
              <input
                id="signup-password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="signup-password-confirm" className="block text-sm font-medium text-foreground mb-1">비밀번호 확인</label>
              <input
                id="signup-password-confirm"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-border bg-surface text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
                placeholder="비밀번호 확인"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          </div>

          {/* 구분선 */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-muted-foreground">또는</span>
            </div>
          </div>

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleKakaoSignUp}
              disabled={socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-yellow-400 rounded-lg bg-yellow-400 text-black hover:bg-yellow-500 disabled:bg-yellow-300 disabled:opacity-50 transition-colors font-medium"
            >
              {socialLoading ? (
                <span>가입 중...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 4.813 0 10.759c0 4.05 2.709 7.51 6.452 9.258-.098-.689-.187-1.745.04-2.494.17-.73 1.108-4.754 1.108-4.754S6.68 12.27 6.68 11.36c0-.91.902-1.585 2.017-1.585s2.594 1.096 3.512 2.528c.69 1.23.94 1.89 1.506 1.89s2.198-.66 2.198-1.89c0-1.89-.94-3.688-2.198-4.828-1.159-.94-2.274-1.584-3.512-2.528C8.435.772 9.107.424 9.918.424c1.694 0 2.793 1.23 2.793 2.828 0 1.585-.902 3.688-2.274 5.31C9.11 10.722 10.32 12.27 12 12.27s4.17-1.46 4.898-1.89c.729-.43 1.69-1.08 1.17-1.69-.52-.61-1.69-1.08-2.793-1.585-1.104-.505-2.117-.94-2.793-1.584-.676-.643-1.108-1.084-1.17-1.585-.062-.5.104-.61.624-.61.52 0 1.69.104 2.274.61.584.505.314.94-.21 1.584-.524.643-.524 1.084.104 1.69.628.605 1.69 1.23 2.794 1.89 1.104.66 2.198 1.23 3.2 1.89 1.002.66 1.69 1.08 1.69 1.89 0 .81-.688 1.585-1.576 1.585-.888 0-1.576-.735-1.576-1.585z" fill="currentColor" />
                  </svg>
                  <span>카카오로 가입</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg bg-surface text-surface-foreground hover:bg-muted disabled:bg-muted disabled:opacity-50 transition-colors font-medium"
            >
              {socialLoading ? (
                <span>가입 중...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>구글로 가입</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="bg-muted px-3 sm:px-6 py-3 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-border">
          <button
            type="submit"
            disabled={loading || emailStatus === 'checking' || emailStatus === 'duplicate' || emailStatus === 'invalid_format'}
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-3 py-2 bg-cta text-sm sm:text-base font-medium text-cta-foreground hover:bg-cta-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-3 py-2 bg-surface text-sm sm:text-base font-medium text-surface-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:w-auto transition-colors duration-200"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpModal;
