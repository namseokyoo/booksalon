import React, { useState } from 'react';
import { MessagingService } from '../services/messagingService';
import { UserProfileService } from '../services/userProfile';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';

interface UserSearchProps {
    onSelectUser: (user: UserProfile) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onSelectUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { currentUser } = useAuth();

    const handleSearch = async (query: string) => {
        if (!query.trim() || !currentUser) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await MessagingService.searchUsersForMessaging(query.trim(), currentUser.uid);
            setSearchResults(results);
        } catch (error) {
            console.error('사용자 검색 실패:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        // 디바운싱
        const timeoutId = setTimeout(() => {
            handleSearch(value);
        }, 300);

        return () => clearTimeout(timeoutId);
    };

    return (
        <div className="space-y-4">
            <div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="사용자 이름으로 검색..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none"
                />
            </div>

            {isSearching && (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                </div>
            )}

            {searchResults.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-white font-semibold">검색 결과</h3>
                    {searchResults.map((user) => (
                        <div
                            key={user.uid}
                            onClick={() => onSelectUser(user)}
                            className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm">
                                        {user.nickname?.charAt(0) || user.displayName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium">
                                        {user.nickname || user.displayName}
                                    </h4>
                                    <p className="text-gray-400 text-sm">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
    );
};

export default UserSearch;