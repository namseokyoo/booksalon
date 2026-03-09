import React, { useState, useEffect } from 'react';
import { MessagingService } from '../lib/services';
import { UserService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { ChatRoom, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import MessagingPageSkeleton from './MessagingPageSkeleton';

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
                const user = await UserService.getUserProfileById(otherUserId);
                setOtherUser(user);
            } catch (error) {
                console.error('사용자 정보 로딩 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOtherUser();
    }, [otherUserId]);

    const formatLastMessageTime = (timestamp: string | Date | null | undefined) => {
        if (!timestamp) return '';
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    if (isLoading || !otherUser) {
        return (
            <div className="bg-surface border border-border p-4 rounded-xl animate-pulse shadow-sm">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => onSelectChat(chatRoom.id, otherUser)}
            className="bg-surface border border-border p-4 rounded-xl hover:bg-muted hover:border-primary-300 cursor-pointer transition-all shadow-sm"
        >
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-sm border-2 border-surface">
                    <span className="text-white font-semibold">
                        {otherUser.nickname?.charAt(0) || otherUser.displayName?.charAt(0) || 'U'}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <h3 className="text-foreground font-semibold truncate">
                            {otherUser.nickname || otherUser.displayName}
                        </h3>
                        <span className="text-muted-foreground text-xs">
                            {formatLastMessageTime(chatRoom.lastMessageAt)}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm truncate mt-1">
                        {chatRoom.lastMessage?.content || '메시지가 없습니다.'}
                    </p>
                    {chatRoom.unreadCount && chatRoom.unreadCount[currentUserId] > 0 && (
                        <div className="flex justify-end mt-1">
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
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
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const fetchChats = async () => {
            try {
                const rooms = await MessagingService.getChatRooms(userProfile?.id || '');
                setChatRooms(rooms);
            } catch (error) {
                console.error('채팅방 목록 로딩 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChats();

        // Realtime 구독: 새 메시지 수신 시 채팅 목록 refetch
        const channel = supabase
            .channel('chat_list_updates')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                () => { fetchChats(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const getOtherUser = async (chatRoom: ChatRoom): Promise<UserProfile | null> => {
        if (!currentUser) return null;

        const otherUserId = chatRoom.participants.find(id => id !== userProfile?.id);
        if (!otherUserId) return null;

        try {
            return await UserService.getUserProfileById(otherUserId);
        } catch (error) {
            console.error('사용자 정보 로딩 실패:', error);
            return null;
        }
    };

    const formatLastMessageTime = (timestamp: string | Date | null | undefined) => {
        if (!timestamp) return '';
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    if (isLoading) {
        return <MessagingPageSkeleton />;
    }

    if (chatRooms.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                아직 채팅방이 없습니다.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 sm:gap-4">
            {chatRooms.map((chatRoom) => {
                const otherUserId = chatRoom.participants.find(id => id !== userProfile?.id);
                if (!otherUserId) return null;

                return (
                    <ChatRoomItem
                        key={chatRoom.id}
                        chatRoom={chatRoom}
                        otherUserId={otherUserId}
                        onSelectChat={onSelectChat}
                        currentUserId={userProfile?.id || ''}
                    />
                );
            })}
        </div>
    );
};

export default ChatList;
