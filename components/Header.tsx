import React, { useState, useRef, useEffect } from 'react';
import { BookOpenIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';

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
    const { currentUser, logout } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 사용자 프로필 로드
    useEffect(() => {
        if (currentUser) {
            loadUserProfile();
        } else {
            setUserProfile(null);
        }
    }, [currentUser]);

    const loadUserProfile = async () => {
        if (!currentUser) return;

        try {
            const { UserProfileService } = await import('../services/userProfile');
            const profile = await UserProfileService.getUserProfile(currentUser.uid);
            setUserProfile(profile);
        } catch (error) {
            console.error('사용자 프로필 로드 실패:', error);
        }
    };

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
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* 로고/홈 버튼 */}
                    <button
                        onClick={onHomeClick}
                        className="flex items-center space-x-2 text-gray-900 hover:text-cyan-600 transition-colors duration-200"
                    >
                        <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8" />
                        <h1 className="text-lg sm:text-2xl font-bold tracking-wider">북살롱</h1>
                    </button>

                    {/* 검색 버튼 및 사용자 메뉴 */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {/* 통합 검색 버튼 */}
                        <button
                            onClick={onSearchClick}
                            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                            title="통합 검색"
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
                                    className="flex items-center space-x-2 px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                                >
                                    {/* 프로필 이미지 */}
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex items-center justify-center shadow-sm">
                                        {getProfileImageUrl() ? (
                                            <img
                                                src={getProfileImageUrl()!}
                                                alt="프로필"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-gray-700 text-xs sm:text-sm font-semibold">
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
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onProfileClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
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
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            활동 피드
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onSearchClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            사용자 검색
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onMessagingClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            메시지
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onNotificationsClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
                                            </svg>
                                            알림
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onAdminClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            관리자
                                        </button>

                                        <hr className="my-1 border-gray-200" />

                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                onDeleteClick();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            계정 삭제
                                        </button>

                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
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
                            <div className="flex space-x-2">
                                <button
                                    onClick={onSignUpClick}
                                    className="px-3 py-1 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                                >
                                    회원가입
                                </button>
                                <button
                                    onClick={onLoginClick}
                                    className="px-3 py-1 text-xs sm:text-sm bg-cyan-600 text-white hover:bg-cyan-700 rounded-md transition-colors duration-200 font-medium"
                                >
                                    로그인
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;