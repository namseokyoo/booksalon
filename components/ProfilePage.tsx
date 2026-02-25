import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserService, BookmarkService, ProfileImageService, ReadingLogService } from '../lib/services';
import type { ReadingLog, ReadingStatus, ReadingStats } from '../lib/services/readingLogService';
import type { UserProfile, Post, Comment, Forum } from '../types';
import type { BadgeStats } from '../lib/badges';
import BadgeList from './BadgeList';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ProfilePageProps {
    onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
    const { currentUser, userProfile: authUserProfile } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [bookmarkedForums, setBookmarkedForums] = useState<Forum[]>([]);
    const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([]);
    const [readingStats, setReadingStats] = useState<ReadingStats>({ reading: 0, completed: 0, wantToRead: 0 });
    const [readingLogBooks, setReadingLogBooks] = useState<Map<string, { title: string; thumbnail: string; authors: string[] }>>(new Map());
    const [readingFilter, setReadingFilter] = useState<ReadingStatus | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'stats' | 'bookmarks' | 'reading' | 'badges'>('stats');
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
            // users 테이블에서 실제 user_id 조회
            const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('auth_id', currentUser.uid)
                .single();

            const internalUserId = userData ? (userData as { id: string }).id : null;

            const [profileData, postsData, commentsData, bookmarksData, logsData, statsData] = await Promise.all([
                UserService.getUserProfileByAuthId(currentUser.uid),
                internalUserId ? UserService.getUserPosts(internalUserId) : Promise.resolve([]),
                internalUserId ? UserService.getUserComments(internalUserId) : Promise.resolve([]),
                internalUserId ? BookmarkService.getBookmarkedForums(internalUserId) : Promise.resolve([]),
                internalUserId ? ReadingLogService.getReadingLogs(internalUserId) : Promise.resolve([]),
                internalUserId ? ReadingLogService.getReadingStats(internalUserId) : Promise.resolve({ reading: 0, completed: 0, wantToRead: 0 }),
            ]);

            setProfile(profileData);
            setPosts(postsData);
            setComments(commentsData);
            setBookmarkedForums(bookmarksData);
            setReadingLogs(logsData);
            setReadingStats(statsData);

            // 독서 로그의 책 정보 로드
            if (logsData.length > 0) {
                const isbns = logsData.map((log) => log.forumIsbn);
                const { data: books } = await supabase
                    .from('books')
                    .select('isbn, title, thumbnail, authors')
                    .in('isbn', isbns);

                if (books) {
                    const bookMap = new Map<string, { title: string; thumbnail: string; authors: string[] }>();
                    (books as Array<{ isbn: string; title: string; thumbnail: string | null; authors: string[] }>).forEach((book) => {
                        bookMap.set(book.isbn, {
                            title: book.title,
                            thumbnail: book.thumbnail || '',
                            authors: book.authors || [],
                        });
                    });
                    setReadingLogBooks(bookMap);
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
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background p-3 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={onBack}
                        className="mb-6 px-4 py-2 bg-surface border border-border text-surface-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                        ← 돌아가기
                    </button>
                    <div className="text-center p-8">
                        <p className="text-surface-foreground">프로필을 찾을 수 없습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-3 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-surface border border-border text-surface-foreground rounded-lg hover:bg-muted transition-colors"
                        aria-label="이전 페이지로 돌아가기"
                    >
                        ← 돌아가기
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        {isEditing ? '취소' : '프로필 편집'}
                    </button>
                </div>

                {/* 프로필 정보 */}
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 mb-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                        {/* 아바타 */}
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-md border-4 border-surface">
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
                                        <label className="block text-sm font-medium text-surface-foreground mb-2">프로필 이미지</label>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center shadow-sm">
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
                                                    <span className="text-muted-foreground text-xl font-semibold">
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
                                                    className="px-4 py-2 bg-surface border border-border text-surface-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer font-medium"
                                                >
                                                    이미지 선택
                                                </label>
                                                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP (최대 5MB)</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 기본 정보 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-surface-foreground mb-2">닉네임</label>
                                            <input
                                                type="text"
                                                value={editForm.nickname}
                                                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                                                placeholder="닉네임을 입력하세요"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-surface-foreground mb-2">지역</label>
                                            <input
                                                type="text"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                                                placeholder="지역을 입력하세요"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-foreground mb-2">웹사이트</label>
                                        <input
                                            type="url"
                                            value={editForm.website}
                                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                                            placeholder="https://example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-foreground mb-2">연간 독서 목표</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1000"
                                            value={editForm.readingGoal}
                                            onChange={(e) => setEditForm({ ...editForm, readingGoal: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                                            placeholder="연간 독서 목표 권수"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-foreground mb-2">자기소개</label>
                                        <textarea
                                            value={editForm.bio}
                                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-foreground focus:ring-2 focus:ring-ring focus:border-primary"
                                            placeholder="자기소개를 입력하세요"
                                            rows={3}
                                        />
                                    </div>

                                    {/* 선호 장르 */}
                                    <div>
                                        <label className="block text-sm font-medium text-surface-foreground mb-2">선호 장르</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['문학', 'SF/판타지', '자기계발', '역사', '과학', '경제/경영', '예술', '철학', '종교'].map((genre) => (
                                                <button
                                                    key={genre}
                                                    onClick={() => handleGenreToggle(genre)}
                                                    className={`px-3 py-1 text-sm rounded-full transition-colors duration-200 ${editForm.favoriteGenres.includes(genre)
                                                            ? 'bg-primary-50 text-primary-700 border border-primary-200 font-medium'
                                                            : 'bg-muted text-surface-foreground border border-border hover:bg-accent'
                                                        }`}
                                                >
                                                    {genre}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 저장 버튼 */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-700 transition-colors font-medium"
                                        >
                                            저장
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-4 py-2 bg-muted text-surface-foreground rounded-lg hover:bg-accent transition-colors font-medium"
                                        >
                                            취소
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground mb-2">
                                        {profile.nickname || profile.displayName || profile.email.split('@')[0]}
                                    </h1>
                                    <p className="text-muted-foreground mb-2">{profile.email}</p>
                                    {profile.bio && (
                                        <p className="text-surface-foreground mb-4 leading-relaxed">{profile.bio}</p>
                                    )}
                                    {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {profile.favoriteGenres.map((genre) => (
                                                <span key={genre} className="px-2.5 py-1 text-xs bg-primary-50 text-primary-700 border border-primary-200 rounded-full font-medium">
                                                    {genre}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        {profile.location && <p>📍 지역: {profile.location}</p>}
                                        {profile.website && <p>🌐 웹사이트: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{profile.website}</a></p>}
                                        {profile.readingGoal > 0 && <p>📚 연간 독서 목표: {profile.readingGoal}권</p>}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                                        <p>가입일: {formatDate(profile.createdAt)}</p>
                                        <p>마지막 로그인: {formatDate(profile.lastLoginAt)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex gap-1 mb-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'stats'
                            ? 'bg-surface border-t border-x border-border text-primary border-b-2 border-b-primary -mb-px'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        활동 통계
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'posts'
                            ? 'bg-surface border-t border-x border-border text-primary border-b-2 border-b-primary -mb-px'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        작성한 글 ({posts.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'comments'
                            ? 'bg-surface border-t border-x border-border text-primary border-b-2 border-b-primary -mb-px'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        작성한 댓글 ({comments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'bookmarks'
                            ? 'bg-surface border-t border-x border-border text-primary border-b-2 border-b-primary -mb-px'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        북마크한 살롱 ({bookmarkedForums.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('reading')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'reading'
                            ? 'bg-surface border-t border-x border-border text-primary border-b-2 border-b-primary -mb-px'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        독서 로그 ({readingLogs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'badges'
                            ? 'bg-surface border-t border-x border-border text-primary border-b-2 border-b-primary -mb-px'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        배지
                    </button>
                </div>

                {/* 탭 콘텐츠 */}
                <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 shadow-sm">
                    {activeTab === 'stats' && (
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">활동 통계</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-muted border border-border rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-primary">{profile.postCount || 0}</div>
                                    <div className="text-muted-foreground mt-1">작성한 글</div>
                                </div>
                                <div className="bg-muted border border-border rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-primary">{profile.commentCount || 0}</div>
                                    <div className="text-muted-foreground mt-1">작성한 댓글</div>
                                </div>
                                <div className="bg-muted border border-border rounded-xl p-4 text-center shadow-sm">
                                    <div className="text-3xl font-bold text-primary">{profile.forumCount || 0}</div>
                                    <div className="text-muted-foreground mt-1">생성한 포럼</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">작성한 글</h2>
                            {posts.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">작성한 글이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <div key={post.id} className="bg-muted border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <h3 className="text-lg font-semibold text-foreground mb-2">{post.title}</h3>
                                            <p className="text-muted-foreground mb-2 line-clamp-2">{post.content}</p>
                                            <div className="flex justify-between items-center text-sm text-muted-foreground">
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
                            <h2 className="text-xl font-bold text-foreground mb-4">작성한 댓글</h2>
                            {comments.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">작성한 댓글이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="bg-muted border border-border rounded-xl p-4 shadow-sm">
                                            <p className="text-surface-foreground mb-2">{comment.content}</p>
                                            <div className="text-sm text-muted-foreground">
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
                            <h2 className="text-xl font-bold text-foreground mb-4">북마크한 살롱</h2>
                            {bookmarkedForums.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">북마크한 살롱이 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {bookmarkedForums.map((forum) => (
                                        <div key={forum.isbn} className="bg-muted border border-border rounded-xl p-4 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer">
                                            <div className="flex items-start space-x-4">
                                                <img
                                                    src={forum.book.thumbnail}
                                                    alt={forum.book.title}
                                                    className="w-16 h-auto rounded-lg flex-shrink-0 shadow-sm"
                                                />
                                                <div className="flex-grow min-w-0">
                                                    <h3 className="font-semibold text-foreground text-lg mb-2">{forum.book.title}</h3>
                                                    <p className="text-muted-foreground text-sm mb-1">{forum.book.authors.join(', ')}</p>
                                                    <p className="text-muted-foreground text-xs mb-2">{forum.book.publisher}</p>
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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

                    {activeTab === 'reading' && (
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-4">독서 로그</h2>

                            {/* 통계 요약 */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{readingStats.reading}</div>
                                    <div className="text-xs text-blue-600 mt-0.5">{'\uD83D\uDCD6'} 읽는 중</div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-green-600">{readingStats.completed}</div>
                                    <div className="text-xs text-green-600 mt-0.5">{'\u2705'} 완독</div>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-amber-600">{readingStats.wantToRead}</div>
                                    <div className="text-xs text-amber-600 mt-0.5">{'\uD83D\uDCCB'} 읽고 싶음</div>
                                </div>
                            </div>

                            {/* 필터 */}
                            <div className="flex gap-2 mb-4">
                                {([
                                    { value: 'all' as const, label: '전체' },
                                    { value: 'reading' as const, label: '\uD83D\uDCD6 읽는 중' },
                                    { value: 'completed' as const, label: '\u2705 완독' },
                                    { value: 'want_to_read' as const, label: '\uD83D\uDCCB 읽고 싶음' },
                                ]).map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setReadingFilter(filter.value)}
                                        className={`px-3 py-1.5 text-xs rounded-full transition-colors duration-200 ${
                                            readingFilter === filter.value
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* 독서 로그 목록 */}
                            {readingLogs.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">독서 로그가 없습니다.</p>
                            ) : (
                                <div className="space-y-4">
                                    {readingLogs
                                        .filter((log) => readingFilter === 'all' || log.status === readingFilter)
                                        .map((log) => {
                                            const book = readingLogBooks.get(log.forumIsbn);
                                            const statusLabel =
                                                log.status === 'reading' ? '\uD83D\uDCD6 읽는 중' :
                                                log.status === 'completed' ? '\u2705 완독' :
                                                '\uD83D\uDCCB 읽고 싶음';
                                            const statusColor =
                                                log.status === 'reading' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                log.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200';

                                            return (
                                                <div key={log.id} className="bg-muted border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex items-start space-x-4">
                                                        {book?.thumbnail && (
                                                            <img
                                                                src={book.thumbnail}
                                                                alt={book?.title || '책 표지'}
                                                                className="w-14 h-auto rounded-lg flex-shrink-0 shadow-sm"
                                                            />
                                                        )}
                                                        <div className="flex-grow min-w-0">
                                                            <h3 className="font-semibold text-foreground mb-1">
                                                                {book?.title || log.forumIsbn}
                                                            </h3>
                                                            {book?.authors && book.authors.length > 0 && (
                                                                <p className="text-muted-foreground text-sm mb-2">{book.authors.join(', ')}</p>
                                                            )}
                                                            <div className="flex items-center space-x-3 text-sm">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColor}`}>
                                                                    {statusLabel}
                                                                </span>
                                                                {log.startedAt && (
                                                                    <span className="text-muted-foreground text-xs">
                                                                        시작: {formatDate(log.startedAt)}
                                                                    </span>
                                                                )}
                                                                {log.finishedAt && (
                                                                    <span className="text-muted-foreground text-xs">
                                                                        완독: {formatDate(log.finishedAt)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {log.note && (
                                                                <p className="text-muted-foreground text-sm mt-2 italic">{log.note}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {readingLogs.filter((log) => readingFilter === 'all' || log.status === readingFilter).length === 0 && (
                                        <p className="text-muted-foreground text-center py-8">해당 상태의 독서 로그가 없습니다.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <BadgeList
                            stats={{
                                reading: readingStats.reading,
                                completed: readingStats.completed,
                                wantToRead: readingStats.wantToRead,
                                totalPosts: profile.postCount || 0,
                                totalComments: profile.commentCount || 0,
                            } as BadgeStats}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
