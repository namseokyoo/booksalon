import React, { useState, useEffect, useRef } from 'react';
import { ReadingLogService, type ReadingStatus } from '../lib/services/readingLogService';

interface ReadingStatusButtonProps {
  isbn: string;
  userId: string;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string; icon: string }[] = [
  { value: 'reading', label: '읽는 중', icon: '\uD83D\uDCD6' },
  { value: 'completed', label: '완독', icon: '\u2705' },
  { value: 'want_to_read', label: '읽고 싶음', icon: '\uD83D\uDCCB' },
];

const ReadingStatusButton: React.FC<ReadingStatusButtonProps> = ({ isbn, userId }) => {
  const [currentStatus, setCurrentStatus] = useState<ReadingStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    ReadingLogService.getReadingLogByIsbn(userId, isbn).then((log) => {
      if (log) setCurrentStatus(log.status);
      setLoading(false);
    });
  }, [userId, isbn]);

  // 외부 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 토스트 자동 닫기
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!userId || loading) return null;

  const handleSelect = async (status: ReadingStatus) => {
    try {
      if (currentStatus === status) {
        // 같은 상태 클릭 시 해제
        await ReadingLogService.deleteReadingLog(userId, isbn);
        setCurrentStatus(null);
        setToast('독서 상태가 해제되었습니다');
      } else {
        await ReadingLogService.upsertReadingLog(userId, isbn, status);
        setCurrentStatus(status);
        const option = STATUS_OPTIONS.find((o) => o.value === status);
        setToast(`${option?.icon} ${option?.label}(으)로 설정되었습니다`);
      }
    } catch (error) {
      console.error('독서 상태 변경 실패:', error);
      setToast('상태 변경에 실패했습니다');
    }
    setIsOpen(false);
  };

  const currentOption = STATUS_OPTIONS.find((o) => o.value === currentStatus);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          currentStatus
            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100'
            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
        }`}
      >
        <span>{currentOption ? currentOption.icon : '\uD83D\uDCD6'}</span>
        <span>{currentOption ? currentOption.label : '독서 상태'}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]" role="listbox" aria-label="독서 상태 선택">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              role="option"
              aria-selected={currentStatus === option.value}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(option.value);
                }
              }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-2 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                currentStatus === option.value ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {currentStatus === option.value && (
                <svg className="w-4 h-4 ml-auto text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

export default ReadingStatusButton;
