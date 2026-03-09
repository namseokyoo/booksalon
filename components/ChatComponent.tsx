import React, { useState, useEffect, useRef } from 'react';
import { MessagingService } from '../lib/services';
import { UserService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import type { Message, ChatRoom, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Spinner from './Spinner';

interface ChatComponentProps {
    chatRoomId: string;
    otherUser: UserProfile;
    onClose: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ chatRoomId, otherUser, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!chatRoomId || !currentUser) return;

        // 메시지 읽음 처리
        MessagingService.markAsRead(chatRoomId, userProfile?.id || '');

        // 실시간 메시지 리스너
        const unsubscribe = MessagingService.subscribeToMessages(chatRoomId, (newMessages) => {
            setMessages(newMessages);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [chatRoomId, currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !otherUser) return;

        try {
            await MessagingService.sendMessage(
                chatRoomId,
                userProfile?.id || '',
                otherUser.id,
                newMessage.trim()
            );
            setNewMessage('');
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    const formatMessageTime = (timestamp: string | Date | null | undefined) => {
        if (!timestamp) return '';
        const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
        return formatDistanceToNow(date, { addSuffix: true, locale: ko });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* 채팅 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                        <span className="text-white font-semibold text-sm">
                            {otherUser.nickname?.charAt(0) || otherUser.displayName?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-foreground font-semibold">
                            {otherUser.nickname || otherUser.displayName}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            {otherUser.nickname || otherUser.email?.split('@')[0]}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        아직 메시지가 없습니다. 첫 메시지를 보내보세요!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === userProfile?.id ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-sm ${message.senderId === userProfile?.id
                                        ? 'bg-primary-50 text-foreground'
                                        : 'bg-surface border border-border text-foreground'
                                    }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${message.senderId === userProfile?.id ? 'text-muted-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {formatMessageTime(message.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 메시지 입력 */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-surface">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 bg-surface border border-border rounded-lg px-3 py-3 text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="shrink-0 whitespace-nowrap px-4 py-3 bg-cta text-cta-foreground rounded-lg hover:bg-cta-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        전송
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatComponent;
