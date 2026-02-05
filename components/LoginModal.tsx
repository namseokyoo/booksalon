
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { login, loginWithGoogle, loginWithKakao } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onClose();
    } catch (err) {
      setError('로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setSocialLoading(true);
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || '소셜 로그인에 실패했습니다.');
      console.error(err);
    }
    setSocialLoading(false);
  };

  const handleKakaoLogin = async () => {
    try {
      setError('');
      setSocialLoading(true);
      await loginWithKakao();
      onClose();
    } catch (err: any) {
      setError(err.message || '카카오 로그인에 실패했습니다.');
      console.error(err);
    }
    setSocialLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-sm">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4 text-center">로그인</h3>
          {error && <p className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-2 sm:p-3 rounded-lg mb-3 sm:mb-4">{error}</p>}
          <div className="space-y-3 sm:space-y-4">
            <input
              type="email"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 구분선 */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
            >
              {socialLoading ? (
                <span>로그인 중...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>구글로 로그인</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleKakaoLogin}
              disabled={socialLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-yellow-400 rounded-lg bg-yellow-400 text-black hover:bg-yellow-500 disabled:bg-yellow-300 disabled:opacity-50 transition-colors font-medium"
            >
              {socialLoading ? (
                <span>로그인 중...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 4.813 0 10.759c0 4.05 2.709 7.51 6.452 9.258-.098-.689-.187-1.745.04-2.494.17-.73 1.108-4.754 1.108-4.754S6.68 12.27 6.68 11.36c0-.91.902-1.585 2.017-1.585s2.594 1.096 3.512 2.528c.69 1.23.94 1.89 1.506 1.89s2.198-.66 2.198-1.89c0-1.89-.94-3.688-2.198-4.828-1.159-.94-2.274-1.584-3.512-2.528C8.435.772 9.107.424 9.918.424c1.694 0 2.793 1.23 2.793 2.828 0 1.585-.902 3.688-2.274 5.31C9.11 10.722 10.32 12.27 12 12.27s4.17-1.46 4.898-1.89c.729-.43 1.69-1.08 1.17-1.69-.52-.61-1.69-1.08-2.793-1.585-1.104-.505-2.117-.94-2.793-1.584-.676-.643-1.108-1.084-1.17-1.585-.062-.5.104-.61.624-.61.52 0 1.69.104 2.274.61.584.505.314.94-.21 1.584-.524.643-.524 1.084.104 1.69.628.605 1.69 1.23 2.794 1.89 1.104.66 2.198 1.23 3.2 1.89 1.002.66 1.69 1.08 1.69 1.89 0 .81-.688 1.585-1.576 1.585-.888 0-1.576-.735-1.576-1.585z" fill="currentColor" />
                  </svg>
                  <span>카카오로 로그인</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-3 sm:px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-3 sm:px-4 py-2 bg-cyan-600 text-sm sm:text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto disabled:bg-gray-400 transition-colors duration-200"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-3 sm:px-4 py-2 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto transition-colors duration-200"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginModal;
