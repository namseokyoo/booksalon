import React from 'react';
import type { UserProfile } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

interface UserProfilePreviewProps {
    user: UserProfile;
    onClose: () => void;
    onSendMessage?: () => void;
}

const UserProfilePreview: React.FC<UserProfilePreviewProps> = ({ user, onClose, onSendMessage }) => {
    const { currentUser } = useAuth();
    const isOwnProfile = currentUser && currentUser.uid === user.uid;

    const getDisplayName = () => {
        return user.nickname || user.displayName || user.email?.split('@')[0] || '익명';
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'yyyy년 MM월 dd일', { locale: ko });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md text-white">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">프로필</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                            {user.profileImageUrl ? (
                                <img src={user.profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-xl font-semibold">
                                    {getDisplayName().charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">{getDisplayName()}</h3>
                            <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        {user.location && (
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-gray-300">{user.location}</span>
                            </div>
                        )}

                        {user.favoriteGenres && user.favoriteGenres.length > 0 && (
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="text-gray-300">선호 장르: {user.favoriteGenres.join(', ')}</span>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-gray-300">가입일: {formatDate(user.createdAt)}</span>
                        </div>
                    </div>

                    {user.bio && (
                        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                            <p className="text-gray-300 text-sm">{user.bio}</p>
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-2">
                        {!isOwnProfile && onSendMessage && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onSendMessage();
                                }}
                                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                            >
                                메시지 보내기
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePreview;
