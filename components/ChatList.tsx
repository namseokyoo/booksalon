import React, { useState, useEffect } from 'react';
import { MessagingService } from '../services/messagingService';
import { UserProfileService } from '../services/userProfile';
import { useAuth } from '../contexts/AuthContext';
import type { ChatRoom, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ChatListProps {
    onSelectChat: (chatRoomId: string, otherUser: UserProfile) => void;
}

interface ChatRoomItemProps {
    chatRoom: ChatRoom;
    otherUserId: string;
    onSelectChat: (chatRoomId: string, otherUser: UserProfile) => void;
    currentUserId: string;
}

const ChatRoomItem: React.FC<ChatRoomItemProps> = ({
    chatRoom,
    otherUserId,
    onSelectChat,
    currentUserId
}) => {
    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOtherUser = async () => {
            try {
                const user = await UserProfileService.getUserProfile(otherUserId);
                setOtherUser(user);
            } catch (error) {
                console.error('사용자 정보 로딩 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOtherUser();
    }, [otherUserId]);

    const formatLastMessageTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    if (isLoading || !otherUser) {
        return (
            <div className="bg-white border border-gray-200 p-4 rounded-xl animate-pulse shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => onSelectChat(chatRoom.id, otherUser)}
            className="bg-white border border-gray-200 p-4 rounded-xl hover:bg-gray-50 hover:border-cyan-300 cursor-pointer transition-all shadow-sm"
        >
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                    <span className="text-white font-semibold">
                        {otherUser.nickname?.charAt(0) || otherUser.displayName?.charAt(0) || 'U'}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 font-semibold truncate">
                            {otherUser.nickname || otherUser.displayName}
                        </h3>
                        <span className="text-gray-400 text-xs">
                            {formatLastMessageTime(chatRoom.lastMessageAt)}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm truncate mt-1">
                        {chatRoom.lastMessage?.content || '메시지가 없습니다.'}
                    </p>
                    {chatRoom.unreadCount && chatRoom.unreadCount[currentUserId] > 0 && (
                        <div className="flex justify-end mt-1">
                            <span className="bg-cyan-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                                {chatRoom.unreadCount[currentUserId]}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ChatList: React.FC<ChatListProps> = ({ onSelectChat }) => {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const loadChatRooms = async () => {
            try {
                const rooms = await MessagingService.getChatRooms(currentUser.uid);
                setChatRooms(rooms);
            } catch (error) {
                console.error('채팅방 목록 로딩 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadChatRooms();
    }, [currentUser]);

    const getOtherUser = async (chatRoom: ChatRoom): Promise<UserProfile | null> => {
        if (!currentUser) return null;

        const otherUserId = chatRoom.participants.find(id => id !== currentUser.uid);
        if (!otherUserId) return null;

        try {
            return await UserProfileService.getUserProfile(otherUserId);
        } catch (error) {
            console.error('사용자 정보 로딩 실패:', error);
            return null;
        }
    };

    const formatLastMessageTime = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (chatRooms.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                아직 채팅방이 없습니다.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {chatRooms.map((chatRoom) => {
                const otherUserId = chatRoom.participants.find(id => id !== currentUser?.uid);
                if (!otherUserId) return null;

                return (
                    <ChatRoomItem
                        key={chatRoom.id}
                        chatRoom={chatRoom}
                        otherUserId={otherUserId}
                        onSelectChat={onSelectChat}
                        currentUserId={currentUser?.uid || ''}
                    />
                );
            })}
        </div>
    );
};

export default ChatList;
