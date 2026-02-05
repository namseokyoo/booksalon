import React, { useState, useEffect, useRef } from 'react';
import { MessagingService } from '../services/messagingService';
import { UserProfileService } from '../services/userProfile';
import { useAuth } from '../contexts/AuthContext';
import type { Message, ChatRoom, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

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
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!chatRoomId || !currentUser) return;

        // 메시지 읽음 처리
        MessagingService.markAsRead(chatRoomId, currentUser.uid);

        // 실시간 메시지 리스너
        const unsubscribe = MessagingService.subscribeToMessages(chatRoomId, (newMessages) => {
            setMessages(newMessages);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [chatRoomId, currentUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !otherUser) return;

        try {
            await MessagingService.sendMessage(
                chatRoomId,
                currentUser.uid,
                otherUser.uid,
                newMessage.trim()
            );
            setNewMessage('');
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    const formatMessageTime = (timestamp: any) => {
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

    return (
        <div className="flex flex-col h-full">
            {/* 채팅 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                        <span className="text-white font-semibold text-sm">
                            {otherUser.nickname?.charAt(0) || otherUser.displayName?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-gray-900 font-semibold">
                            {otherUser.nickname || otherUser.displayName}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {otherUser.email}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* 메시지 목록 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        아직 메시지가 없습니다. 첫 메시지를 보내보세요!
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-sm ${message.senderId === currentUser?.uid
                                        ? 'bg-cyan-50 text-gray-900'
                                        : 'bg-white border border-gray-200 text-gray-900'
                                    }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                <p className={`text-xs mt-1 ${message.senderId === currentUser?.uid ? 'text-gray-500' : 'text-gray-400'
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
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        전송
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatComponent;
