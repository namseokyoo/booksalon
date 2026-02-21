import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserService, BookmarkService, ProfileImageService } from '../lib/services';
import { ReadingLogService, type ReadingLog, type ReadingStats } from '../lib/services/readingLogService';
import { supabase } from '../lib/supabase';
import BadgeList from './BadgeList';
import type { BadgeStats } from '../lib/badges';
import type { UserProfile, Post, Comment, Forum } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 배지 섹션 래퍼
const BadgeListSection: React.FC<{
    readingStats: ReadingStats;
    totalPosts: number;
    totalComments: number;
}> = ({ readingStats, totalPosts, totalComments }) => {
    const badgeStats: BadgeStats = {
        reading: readingStats.reading,
        completed: readingStats.completed,
        wantToRead: readingStats.wantToRead,
        totalPosts,
        totalComments,
    };
    return <BadgeList stats={badgeStats} />;
};

interface ProfilePageProps {
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
    const { currentUser } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [bookmarkedForums, setBookmarkedForums] = useState<Forum[]>([]);
    const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
    const [readingStats, setReadingStats] = useState<ReadingStats>({ reading: 0, completed: 0, wantToRead: 0 });
    const [readingFilter, setReadingFilter] = useState<'all' | 'reading' | 'completed' | 'want_to_read'>('all');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'stats' | 'bookmarks' | 'readingLog' | 'badges'>('stats');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        nickname: '',
        bio: '',
        location: '',
        website: '',
        readingGoal: 0,
        favoriteGenres: [] as string[],
        profileImageFile: null as File | null
    });

    useEffect(() => {
        if (currentUser) {
            loadUserData();
        }
    }, [currentUser]);

    const loadUserData = async () => {
        if (!currentUser) return;

        try {
            setLoading(true);
            const [profileData, postsData, commentsData, bookmarksData] = await Promise.all([
                UserService.getUserProfileByAuthId(currentUser.uid),
                UserService.getUserPosts(currentUser.uid),
                UserService.getUserComments(currentUser.uid),
                BookmarkService.getBookmarkedForums(currentUser.uid)
            ]);

            setProfile(profileData);
            setPosts(postsData);
            setComments(commentsData);
            setBookmarkedForums(bookmarksData);

            // 독서 로그 로드 (프로필의 users 테이블 id 필요)
            if (profileData?.uid) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('id')
                    .eq('auth_id', profileData.uid)
                    .single();
                if (userData) {
                    const dbUserId = (userData as { id: string }).id;
                    const [logs, stats] = await Promise.all([
                        ReadingLogService.getReadingLogs(dbUserId),
                        ReadingLogService.getReadingStats(dbUserId),
                    ]);
                    setReadingLogs(logs);
                    setReadingStats(stats);
                }
            }

            if (profileData) {
                setEditForm({
                    displayName: profileData.displayName || '',
                    nickname: profileData.nickname || '',
                    bio: profileData.bio || '',
                    location: profileData.location || '',
                    website: profileData.website || '',
                    readingGoal: profileData.readingGoal || 0,
                    favoriteGenres: profileData.favoriteGenres || [],
                    profileImageFile: null
                });
            }
        } catch (error) {
            console.error('사용자 데이터 로딩 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser || !profile) return;

        try {
            // 프로필 이미지 업로드 (있는 경우)
            let profileImageUrl: string | undefined;
            if (editForm.profileImageFile) {
                profileImageUrl = await ProfileImageService.uploadProfileImage(
                    currentUser.uid,
                    editForm.profileImageFile
                );
            }

            // 기본 프로필 업데이트
            await UserService.updateProfile(profile.id, {
                displayName: editForm.displayName,
                nickname: editForm.nickname,
                bio: editForm.bio,
                location: editForm.location,
                website: editForm.website,
                readingGoal: editForm.readingGoal,
                ...(profileImageUrl ? { profileImageUrl } : {}),
            });

            // 선호 장르 업데이트 (별도 테이블)
            await UserService.updateFavoriteGenres(profile.id, editForm.favoriteGenres);

            // 프로필 다시 로드
            await loadUserData();
            setIsEditing(false);
        } catch (error) {
            console.error('프로필 저장 실패:', error);
            alert('프로필 저장 중 오류가 발생했습니다.');
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditForm(prev => ({ ...prev, profileImageFile: file }));
        }
    };

    const handleGenreToggle = (genre: string) => {
        setEditForm(prev => ({
            ...prev,
            favoriteGenres: prev.favoriteGenres.includes(genre)
                ? prev.favoriteGenres.filter(g => g !== genre)
                : [...prev.favoriteGenres, genre]
        }));
    };

    const formatDate = (timestamp: string | Date | { toDate: () => Date } | null | undefined) => {
        if (!timestamp) return '알 수 없음';
        try {
            let date: Date;
            if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if ('toDate' in timestamp && typeof timestamp.toDate === 'function') {
                date = timestamp.toDate();
            } else {
                date = new Date();
            }
            return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
        } catch {
            return '알 수 없음';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={onBack}
                        className="mb-6 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        ← 돌아가기
                    </button>
                    <div className="text-center p-8">
                        <p className="text-gray-700">프로필을 찾을 수 없습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        aria-label="이전 페이지로 돌아가기"
                    >
                        ← 돌아가기
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                    >
                        {isEditing ? '취소' : '프로필 편집'}
                    </button>
                </div>

                {/* 프로필 정보 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                        {/* 아바타 */}
                        <div className="w-20 h-20 bg-cyan-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-md border-4 border-white">
                            {profile.profileImageUrl ? (
                                <img src={profile.profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                            ) : (
                                (profile.nickname || profile.displayName || profile.email).charAt(0).toUpperCase()
                            )}
                        </div>

                        {/* 프로필 정보 */}
                        <div className="flex-1">
                            {isEditing ? (
                                <div className="space-y-6">
                                    {/* 프로필 이미지 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">프로필 이미지</label>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-300 flex items-center justify-center shadow-sm">
                                                {editForm.profileImageFile ? (
                                                    <img
                                                        src={URL.createObjectURL(editForm.profileImageFile)}
                                                        alt="프로필 미리보기"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : profile?.profileImageUrl ? (
                                                    <img
                                                        src={profile.profileImageUrl}
                                                        alt="프로필"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-gray-600 text-xl font-semibold">
                                                        {(profile?.nickname || profile?.displayName || profile?.email || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden"
                                                    id="profile-image-input"
                                                />
                                                <label
                                                    htmlFor="profile-image-input"
                                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer font-medium"
                                                >
                                                    이미지 선택
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF, WebP (최대 5MB)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 기본 정보 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
                                            <input
                                                type="text"
                                                value={editForm.nickname}
                                                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                                placeholder="닉네임을 입력하세요"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">지역</label>
                                            <input
                                                type="text"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                                placeholder="지역을 입력하세요"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">웹사이트</label>
                                        <input
                                            type="url"
                                            value={editForm.website}
                                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="https://example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">연간 독서 목표</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1000"
                                            value={editForm.readingGoal}
                                            onChange={(e) => setEditForm({ ...editForm, readingGoal: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="연간 독서 목표 권수"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">자기소개</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                            placeholder="자기소개를 입력하세요"
                                            rows={3}
                                        />
                                    </div>

                                    {/* 선호 장르 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">선호 장르</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['문학', 'SF/판타지', '자기계발', '역사', '과학', '경제/경영', '예술', '철학', '종교'].map((genre) => (
                                                <button
                                                    key={genre}
                                                    onClick={() => handleGenreToggle(genre)}
                                                    className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${editForm.favoriteGenres.includes(genre)
                                                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium'
                                                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {genre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 저장 버튼 */}
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                        {profile.nickname || profile.displayName || profile.email.split('@')[0]}
                                    </h1>
                                    <p className="text-gray-600 mb-2">{profile.email}</p>
                                    {profile.bio && (
                                        <p className="text-gray-700 mb-4 leading-relaxed">{profile.bio}</p>
                                    )}
                                    {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {profile.favoriteGenres.map((genre) => (
                                                <span key={genre} className="px-2.5 py-1 text-xs bg-cyan-50 text-cyan-700 border border-cyan-200 rounded-full font-medium">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="space-y-1 text-sm text-gray-600">
                                        {profile.location && <p>📍 지역: {profile.location}</p>}
                                        {profile.website && <p>🌐 웹사이트: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">{profile.website}</a></p>}
                                        {profile.readingGoal > 0 && <p>📚 연간 독서 목표: {profile.readingGoal}권</p>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                                        <p>가입일: {formatDate(profile.createdAt)}</p>
                                        <p>마지막 로그인: {formatDate(profile.lastLoginAt)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex space-x-1 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'stats'
                            ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        활동 통계
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'posts'
                            ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        작성한 글 ({posts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'comments'
                            ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        작성한 댓글 ({comments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'bookmarks'
                            ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        북마크한 살롱 ({bookmarkedForums.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('readingLog')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'readingLog'
                            ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        독서 로그
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'badges'
                            ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        배지
                    </button>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    {activeTab === 'stats' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">활동 통계</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-cyan-600">{profile.postCount || 0}</div>
                                    <div className="text-gray-600 mt-1">작성한 글</div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-cyan-600">{profile.commentCount || 0}</div>
                                    <div className="text-gray-600 mt-1">작성한 댓글</div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-cyan-600">{profile.forumCount || 0}</div>
                                    <div className="text-gray-600 mt-1">생성한 포럼</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">작성한 글</h2>
                            {posts.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">작성한 글이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <div key={post.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                                            <p className="text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                <span>{formatDate(post.createdAt)}</span>
                                                <span>댓글 {post.commentCount || 0}개</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">작성한 댓글</h2>
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">작성한 댓글이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                                            <p className="text-gray-700 mb-2">{comment.content}</p>
                                            <div className="text-sm text-gray-500">
                                                {formatDate(comment.createdAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bookmarks' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">북마크한 살롱</h2>
                            {bookmarkedForums.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">북마크한 살롱이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {bookmarkedForums.map((forum) => (
                                        <div key={forum.isbn} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-cyan-300 transition-all cursor-pointer">
                                            <div className="flex items-start space-x-4">
                                                <img
                                                    src={forum.book.thumbnail}
                                                    alt={forum.book.title}
                                                    className="w-16 h-auto rounded-lg flex-shrink-0 shadow-sm"
                                                />
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{forum.book.title}</h3>
                                                    <p className="text-gray-600 text-sm mb-1">{forum.book.authors.join(', ')}</p>
                                                    <p className="text-gray-500 text-xs mb-2">{forum.book.publisher}</p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span>게시물 {forum.postCount || 0}개</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'readingLog' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">독서 로그</h2>

                            {/* 독서 통계 카드 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-blue-600">{readingStats.reading}</div>
                                    <div className="text-blue-700 mt-1">읽는 중</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-green-600">{readingStats.completed}</div>
                                    <div className="text-green-700 mt-1">완독</div>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-amber-600">{readingStats.wantToRead}</div>
                                    <div className="text-amber-700 mt-1">읽고 싶음</div>
                                </div>
                            </div>

                            {/* 상태 필터 */}
                            <div className="flex space-x-2 mb-4">
                                {[
                                    { value: 'all' as const, label: '전체' },
                                    { value: 'reading' as const, label: '읽는 중' },
                                    { value: 'completed' as const, label: '완독' },
                                    { value: 'want_to_read' as const, label: '읽고 싶음' },
                                ].map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setReadingFilter(filter.value)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                                            readingFilter === filter.value
                                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium'
                                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* 책 목록 */}
                            {(() => {
                                const filteredLogs = readingFilter === 'all'
                                    ? readingLogs
                                    : readingLogs.filter((log) => log.status === readingFilter);

                                if (filteredLogs.length === 0) {
                                    return <p className="text-gray-500 text-center py-8">독서 로그가 없습니다.</p>;
                                }

                                return (
                                    <div className="space-y-3">
                                        {filteredLogs.map((log) => (
                                            <div key={log.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{log.forumIsbn}</p>
                                                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                log.status === 'reading' ? 'bg-blue-100 text-blue-700' :
                                                                log.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                                {log.status === 'reading' ? '읽는 중' :
                                                                 log.status === 'completed' ? '완독' : '읽고 싶음'}
                                                            </span>
                                                            {log.startedAt && (
                                                                <span>시작: {formatDate(log.startedAt)}</span>
                                                            )}
                                                            {log.finishedAt && (
                                                                <span>완료: {formatDate(log.finishedAt)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {log.note && (
                                                    <p className="text-gray-600 text-sm mt-2 border-t border-gray-200 pt-2">{log.note}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'badges' && profile && (
                        <div>
                            <BadgeListSection
                                readingStats={readingStats}
                                totalPosts={profile.postCount || 0}
                                totalComments={profile.commentCount || 0}
                            />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
