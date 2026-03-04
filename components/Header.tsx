import React, { useState, useRef, useEffect } from 'react';
import { BookOpenIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
    onLoginClick: () => void;
    onSignUpClick: () => void;
    onDeleteClick: () => void;
    onProfileClick: () => void;
    onActivityClick: () => void;
    onSearchClick: () => void;
    onMessagingClick: () => void;
    onNotificationsClick: () => void;
    onAdminClick: () => void;
    onHomeClick: () => void;
}

const Header: React.FC<HeaderProps> = ({
    onLoginClick,
    onSignUpClick,
    onDeleteClick,
    onProfileClick,
    onActivityClick,
    onSearchClick,
    onMessagingClick,
    onNotificationsClick,
    onAdminClick,
    onHomeClick
}) => {
    const { currentUser, userProfile, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleUserMenuClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        await logout();
    };

    const getDisplayName = () => {
        // userProfile 우선, 없으면 Firebase 사용자 정보에서 안전하게 파생
        if (userProfile) {
            const base = userProfile.nickname || userProfile.displayName || userProfile.email || '사용자';
            return base;
        }
        const email = currentUser?.email;
        if (email && email.includes('@')) return email.split('@')[0];
        return currentUser?.displayName || '사용자';
    };

    const getProfileImageUrl = () => {
        if (!userProfile) return null;
        return userProfile.profileImageUrl || null;
    };

    const getProfileInitial = () => {
        const displayName = getDisplayName();
        return displayName.charAt(0).toUpperCase();
    };

    return (
        <header className="bg-surface border-b border-border shadow-sm sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* 로고/홈 버튼 */}
                    <a
                        href="/"
                        onClick={(e) => { e.preventDefault(); onHomeClick(); }}
                        className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors duration-200"
                        aria-label="북살롱 홈으로 이동"
                    >
                        <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                        <h1 className="text-lg sm:text-2xl font-bold font-serif tracking-wider">북살롱</h1>
                    </a>

                    {/* 검색 버튼 및 사용자 메뉴 */}
                    <nav className="flex items-center space-x-2 sm:space-x-3" aria-label="사이트 내비게이션">
                        {/* 테마 토글 */}
                        <ThemeToggle />
                        {/* 통합 검색 버튼 */}
                        <button
                            onClick={onSearchClick}
                            className="p-2 text-surface-foreground hover:bg-muted rounded-md transition-colors duration-200"
                            title="통합 검색"
                            aria-label="통합 검색 열기"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        {currentUser ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* 사용자 프로필 버튼 */}
                                <button
                                    onClick={handleUserMenuClick}
                                    className="flex items-center space-x-2 px-2 sm:px-3 py-2 min-h-[44px] text-xs sm:text-sm text-surface-foreground hover:bg-muted rounded-md transition-colors duration-200"
                                    aria-label="사용자 메뉴 열기"
                                    aria-expanded={isDropdownOpen}
                                    aria-haspopup="true"
                                >
                                    {/* 프로필 이미지 */}
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center shadow-sm">
                                        {getProfileImageUrl() ? (
                                            <img
                                                src={getProfileImageUrl()!}
                                                alt="프로필"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-surface-foreground text-xs sm:text-sm font-semibold">
                                                {getProfileInitial()}
                                            </span>
                                        )}
                                    </div>

                                    {/* 사용자명 (데스크톱에서만 표시) */}
                                    <span className="hidden sm:block text-xs sm:text-sm truncate max-w-24">
                                        {getDisplayName()}
                                    </span>

                                    {/* 드롭다운 화살표 */}
                                    <svg
                                        className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* 드롭다운 메뉴 */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg py-1 z-50" role="menu" aria-label="사용자 메뉴">
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onProfileClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            프로필
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onActivityClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            활동 피드
                                        </button>

                                        {/* 메시지: 유저간 메시지 기능 미오픈. 향후 오픈 시 주석 해제 */}
                                        {/*
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onMessagingClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            메시지
                                        </button>
                                        */}

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onNotificationsClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                                            </svg>
                                            알림
                                        </button>

                                        {/* 관리자 메뉴: 향후 isAdmin 로직 추가 예정. 현재 전체 숨김 처리.
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onAdminClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            관리자
                                        </button>
                                        */}

                                        <hr className="my-1 border-border" />

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={onSignUpClick}
                                    className="px-3 py-2 min-h-[44px] text-xs sm:text-sm text-surface-foreground hover:bg-muted rounded-md transition-colors duration-200"
                                    aria-label="회원가입"
                                >
                                    회원가입
                                </button>
                                <button
                                    onClick={onLoginClick}
                                    className="px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-cta text-cta-foreground hover:bg-cta-700 rounded-md transition-colors duration-200 font-medium"
                                    aria-label="로그인"
                                >
                                    로그인
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;