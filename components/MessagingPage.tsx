import React, { useState, useEffect } from 'react';
import ChatList from '../components/ChatList';
import ChatComponent from '../components/ChatComponent';
import UserSearch from '../components/UserSearch';
import { MessagingService } from '../services/messagingService';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileService } from '../services/userProfile';
import type { UserProfile } from '../types';

interface MessagingPageProps {
    targetUserId?: string;
}

const MessagingPage: React.FC<MessagingPageProps> = ({ targetUserId }) => {
    const [activeTab, setActiveTab] = useState<'chats' | 'search'>('chats');
    const [selectedChat, setSelectedChat] = useState<{
        chatRoomId: string;
        otherUser: UserProfile;
    } | null>(null);
    const { currentUser } = useAuth();

    // targetUserId가 있으면 자동으로 해당 사용자와의 채팅 시작
    useEffect(() => {
        const startChatWithUser = async () => {
            if (!targetUserId || !currentUser) return;

            try {
                const userProfile = await UserProfileService.getUserProfile(targetUserId);
                if (!userProfile) return;

                const chatRoom = await MessagingService.getOrCreateChatRoom(
                    currentUser.uid,
                    targetUserId
                );

                setSelectedChat({ chatRoomId: chatRoom.id, otherUser: userProfile });
                setActiveTab('chats');
            } catch (error) {
                console.error('채팅 시작 실패:', error);
            }
        };

        startChatWithUser();
    }, [targetUserId, currentUser]);

    const handleSelectChat = (chatRoomId: string, otherUser: UserProfile) => {
        setSelectedChat({ chatRoomId, otherUser });
    };

    const handleSelectUser = async (user: UserProfile) => {
        if (!currentUser) return;

        try {
            // 채팅방 생성 또는 기존 채팅방 찾기
            const chatRoom = await MessagingService.getOrCreateChatRoom(
                currentUser.uid,
                user.uid
            );

            setSelectedChat({ chatRoomId: chatRoom.id, otherUser: user });
            setActiveTab('chats');
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
        }
    };

    const handleCloseChat = () => {
        setSelectedChat(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">💬 메시지</h1>
                    <p className="text-gray-600">다른 사용자와 실시간으로 소통하세요</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* 사이드바 */}
                    <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        {/* 채팅 목록만 표시 */}
                        <ChatList onSelectChat={handleSelectChat} />
                    </div>

                    {/* 메인 채팅 영역 */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        {selectedChat ? (
                            <ChatComponent
                                chatRoomId={selectedChat.chatRoomId}
                                otherUser={selectedChat.otherUser}
                                onClose={handleCloseChat}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold mb-2 text-gray-900">채팅을 시작하세요</h3>
                                    <p className="text-gray-600">왼쪽에서 채팅방을 선택하거나 새로운 사용자를 검색해보세요.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagingPage;
