import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, CheckCircle, BookmarkPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ReadingLogService } from '../lib/services';
import type { ReadingStatus } from '../lib/services/readingLogService';
import { supabase } from '../lib/supabase';
import LoginRequiredPopup from './LoginRequiredPopup';

interface ReadingStatusButtonProps {
  isbn: string;
  onLoginRequired?: () => void;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'reading', label: '읽는 중', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'completed', label: '완독', icon: <CheckCircle className="w-4 h-4" /> },
  { value: 'want_to_read', label: '읽고 싶음', icon: <BookmarkPlus className="w-4 h-4" /> },
];

const ReadingStatusButton: React.FC<ReadingStatusButtonProps> = ({ isbn, onLoginRequired }) => {
  const { currentUser } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // users 테이블에서 id 조회
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserId = async () => {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', currentUser.uid)
        .single();

      if (data) {
        setUserId((data as { id: string }).id);
      }
    };
    fetchUserId();
  }, [currentUser]);

  // 현재 독서 상태 로드
  useEffect(() => {
    if (!userId) return;

    const loadStatus = async () => {
      const log = await ReadingLogService.getReadingLogByIsbn(userId, isbn);
      setCurrentStatus(log?.status || null);
    };
    loadStatus();
  }, [userId, isbn]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 메시지 자동 숨김
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleStatusChange = async (status: ReadingStatus) => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    try {
      await ReadingLogService.upsertReadingLog(userId, isbn, status);
      setCurrentStatus(status);
      const option = STATUS_OPTIONS.find((o) => o.value === status);
      setMessage(`${option?.label}(으)로 설정되었습니다`);
    } catch (error) {
      console.error('독서 상태 변경 실패:', error);
      setMessage('상태 변경에 실패했습니다');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleRemoveStatus = async () => {
    if (!userId || isLoading) return;

    setIsLoading(true);
    try {
      await ReadingLogService.deleteReadingLog(userId, isbn);
      setCurrentStatus(null);
      setMessage('독서 상태가 제거되었습니다');
    } catch (error) {
      console.error('독서 상태 제거 실패:', error);
      setMessage('상태 제거에 실패했습니다');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!currentUser) {
            setShowLoginPopup(true);
            return;
          }
          setIsOpen(!isOpen);
        }}
        disabled={isLoading}
        className={`whitespace-nowrap flex items-center space-x-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors duration-200 ${
          currentStatus
            ? 'bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100'
            : 'bg-surface border-border text-surface-foreground hover:bg-muted'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : currentOption ? (
          <span className="flex items-center gap-1.5">{currentOption.icon} {currentOption.label}</span>
        ) : (
          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> 독서 상태</span>
        )}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && currentUser && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-200 flex items-center space-x-2 ${
                currentStatus === option.value
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-surface-foreground hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-1.5">
                {option.icon}
                {option.label}
              </span>
              {currentStatus === option.value && (
                <svg className="h-4 w-4 ml-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          {currentStatus && (
            <>
              <div className="border-t border-border" />
              <button
                onClick={handleRemoveStatus}
                className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors duration-200"
              >
                상태 제거
              </button>
            </>
          )}
        </div>
      )}

      {message && (
        <div className="absolute top-full left-0 mt-1 px-3 py-2 bg-surface text-foreground text-xs rounded-lg shadow-lg whitespace-nowrap z-30">
          {message}
        </div>
      )}

      <LoginRequiredPopup
        message="독서 상태를 변경하려면 로그인이 필요합니다."
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={() => { if (onLoginRequired) onLoginRequired(); }}
      />
    </div>
  );
};

export default ReadingStatusButton;
