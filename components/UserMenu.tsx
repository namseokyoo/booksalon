import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { MessagingService } from '../services/messagingService';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
    user: UserProfile;
    onClose: () => void;
    onShowProfile: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onClose, onShowProfile }) => {
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!currentUser || currentUser.uid === user.uid) {
            alert('자신에게는 메시지를 보낼 수 없습니다.');
            return;
        }

        setIsLoading(true);
        try {
            // 채팅방 생성 또는 기존 채팅방 찾기
            const chatRoom = await MessagingService.getOrCreateChatRoom(
                currentUser.uid,
                user.uid
            );

            // TODO: 메시지 페이지로 이동하는 로직 추가
            alert(`${user.nickname || user.displayName}님과의 채팅방이 생성되었습니다.`);
            onClose();
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
            alert('메시지 전송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayName = () => {
        return user.nickname || user.displayName || user.email?.split('@')[0] || '익명';
    };

    return (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-700 rounded-lg shadow-lg py-2 z-50">
            <div className="p-4 border-b border-gray-600">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center">
                        {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-semibold">
                                {getDisplayName().charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">{getDisplayName()}</h3>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="py-2">
                <button
                    onClick={onShowProfile}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors duration-200"
                >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    프로필 보기
                </button>

                {currentUser && currentUser.uid !== user.uid && (
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
                    >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {isLoading ? '처리 중...' : '메시지 보내기'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserMenu;
