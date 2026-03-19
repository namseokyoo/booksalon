import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpenIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { useModals } from '../contexts/ModalContext';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const { openLogin, openSignup, openSearch } = useModals();
    const { currentUser, logout } = useAuth();
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

    const handleMenuToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = async () => {
        setIsDropdownOpen(false);
        await logout();
    };

    return (
        <header className="w-full overflow-hidden bg-surface border-b border-border shadow-sm sticky top-0 z-20">
            <div className="w-full max-w-4xl mx-auto overflow-hidden px-4 sm:px-5 md:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 min-h-[64px]">
                    {/* 로고/홈 버튼 */}
                    <Link
                        to="/"
                        className="flex min-w-0 flex-shrink-0 items-center space-x-2 text-foreground hover:text-primary transition-colors duration-200"
                        aria-label="북살롱 홈으로 이동"
                    >
                        <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                        <h1 className="truncate text-lg sm:text-2xl font-bold font-serif tracking-wider">북살롱</h1>
                    </Link>

                    {/* 검색 버튼 및 햄버거 메뉴 */}
                    <nav className="flex flex-shrink-0 items-center space-x-2 sm:space-x-3" aria-label="사이트 내비게이션">
                        {/* 통합 검색 버튼 */}
                        <button
                            onClick={openSearch}
                            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-surface-foreground hover:bg-muted rounded-md transition-colors duration-200"
                            aria-label="통합 검색 열기"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        <ThemeToggle />

                        {/* 햄버거 메뉴 버튼 */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={handleMenuToggle}
                                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-surface-foreground hover:bg-muted rounded-md transition-colors duration-200"
                                aria-label="메뉴 열기"
                                aria-expanded={isDropdownOpen}
                                aria-haspopup="true"
                            >
                                {isDropdownOpen ? (
                                    /* X 아이콘 */
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    /* 햄버거 아이콘 */
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>

                            {/* 드롭다운 메뉴 */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg py-1 z-50" role="menu" aria-label="메뉴">
                                    {currentUser ? (
                                        <>
                                            {/* 로그인 상태: 프로필 / 활동 피드 / 알림 */}
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    navigate('/profile');
                                                }}
                                                className="flex items-center w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                프로필
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    navigate('/activity');
                                                }}
                                                className="flex items-center w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                </svg>
                                                활동 피드
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    navigate('/notifications');
                                                }}
                                                className="flex items-center w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                </svg>
                                                알림
                                            </button>

                                            <hr className="my-1 border-border" />
                                        </>
                                    ) : (
                                        <>
                                            {/* 비로그인 상태: 로그인 / 회원가입 */}
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    openLogin();
                                                }}
                                                className="flex items-center w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                </svg>
                                                로그인
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    openSignup();
                                                }}
                                                className="flex items-center w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                                </svg>
                                                회원가입
                                            </button>

                                            <hr className="my-1 border-border" />
                                        </>
                                    )}

                                    {/* 공통 메뉴: 테마 변경 */}

                                    <div
                                        className="flex items-center justify-between w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground"
                                        role="menuitem"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                            </svg>
                                            테마 변경
                                        </div>
                                        <ThemeToggle />
                                    </div>

                                    {currentUser && (
                                        <>
                                            <hr className="my-1 border-border" />

                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center w-full px-4 py-2 min-h-[44px] text-sm text-surface-foreground hover:bg-muted transition-colors duration-200"
                                                role="menuitem"
                                            >
                                                <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                로그아웃
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
