import React, { useState } from 'react';
import { MessagingService } from '../lib/services';
import { UserService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '../types';
import Spinner from './Spinner';

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
        <div className="flex flex-col gap-3 sm:gap-4">
            <div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={handleInputChange}
                    placeholder="사용자 이름으로 검색..."
                    className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:ring-ring focus:border-primary focus:outline-none"
                />
            </div>

            {isSearching && (
                <div className="flex items-center justify-center py-4">
                    <Spinner size="md" />
                </div>
            )}

            {searchResults.length > 0 && (
                <div className="flex flex-col gap-3 sm:gap-4">
                    <h3 className="text-foreground font-semibold">검색 결과</h3>
                    {searchResults.map((user) => (
                        <div
                            key={user.uid}
                            onClick={() => onSelectUser(user)}
                            className="bg-surface p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                                    <span className="text-primary-foreground font-semibold text-sm">
                                        {user.nickname?.charAt(0) || user.displayName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-foreground font-medium">
                                        {user.nickname || user.displayName}
                                    </h4>
                                    <p className="text-muted-foreground text-sm">{user.email}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                    검색 결과가 없습니다.
                </div>
            )}
        </div>
    );
};

export default UserSearch;
