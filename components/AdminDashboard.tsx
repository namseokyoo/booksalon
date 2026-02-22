import React, { useState, useEffect } from 'react';
import { AdminService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';
import type { Report } from '../types';

const AdminDashboard: React.FC = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'forums' | 'reports'>('dashboard');
    const [stats, setStats] = useState<Awaited<ReturnType<typeof AdminService.getStats>> | null>(null);
    const [users, setUsers] = useState<Awaited<ReturnType<typeof AdminService.getUsers>>>([]);
    const [forums, setForums] = useState<Awaited<ReturnType<typeof AdminService.getForums>>>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const { currentUser, userProfile } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const checkAdminStatus = async () => {
            try {
                const adminStatus = await AdminService.isAdmin(userProfile?.id || '');
                setIsAdmin(adminStatus);

                if (adminStatus) {
                    // 통계 로드
                    const statsData = await AdminService.getStats();
                    setStats(statsData);

                    // 실시간 통계 리스너
                    const unsubscribeStats = AdminService.subscribeToStats(setStats);

                    return () => unsubscribeStats();
                }
            } catch (error) {
                console.error('관리자 상태 확인 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminStatus();
    }, [currentUser]);

    useEffect(() => {
        if (!isAdmin) return;

        const loadData = async () => {
            try {
                if (activeTab === 'users') {
                    const usersData = await AdminService.getUsers();
                    setUsers(usersData);
                } else if (activeTab === 'forums') {
                    const forumsData = await AdminService.getForums();
                    setForums(forumsData);
                } else if (activeTab === 'reports') {
                    const reportsData = await AdminService.getReports();
                    setReports(reportsData);
                }
            } catch (error) {
                console.error('데이터 로딩 실패:', error);
            }
        };

        loadData();
    }, [isAdmin, activeTab]);

    const handleDeactivateUser = async (userId: string) => {
        try {
            await AdminService.deactivateUser(userId);
            // 사용자 목록 새로고침
            const usersData = await AdminService.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error('사용자 비활성화 실패:', error);
        }
    };

    const handleActivateUser = async (userId: string) => {
        try {
            await AdminService.activateUser(userId);
            // 사용자 목록 새로고침
            const usersData = await AdminService.getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error('사용자 활성화 실패:', error);
        }
    };

    const handleDeleteForum = async (isbn: string) => {
        try {
            await AdminService.deleteForum(isbn);
            // 포럼 목록 새로고침
            const forumsData = await AdminService.getForums();
            setForums(forumsData);
        } catch (error) {
            console.error('포럼 삭제 실패:', error);
        }
    };

    const handleResolveReport = async (reportId: string) => {
        try {
            await AdminService.updateReportStatus(reportId, 'resolved', currentUser?.uid || '');
            // 신고 목록 새로고침
            const reportsData = await AdminService.getReports();
            setReports(reportsData);
        } catch (error) {
            console.error('신고 해결 실패:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center text-gray-600 py-8">
                        <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">접근 권한이 없습니다</h3>
                        <p>관리자 권한이 필요한 페이지입니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">🛡️ 관리자 대시보드</h1>
                    <p className="text-gray-600">북살롱 서비스 관리 및 모니터링</p>
                </div>

                {/* 탭 네비게이션 */}
                <div className="flex space-x-2 mb-6 border-b border-gray-200">
                    {[
                        { id: 'dashboard', label: '대시보드', icon: '📊' },
                        { id: 'users', label: '사용자 관리', icon: '👥' },
                        { id: 'forums', label: '포럼 관리', icon: '📚' },
                        { id: 'reports', label: '신고 관리', icon: '⚠️' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'dashboard' | 'users' | 'forums' | 'reports')}
                            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                    ? 'bg-white border-t border-x border-gray-200 text-cyan-600 border-b-2 border-b-cyan-600 -mb-px'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* 탭 내용 */}
                {activeTab === 'dashboard' && stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-gray-600 text-sm">총 사용자</p>
                                    <p className="text-3xl font-bold text-cyan-600">{stats.totalUsers || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-gray-600 text-sm">총 포럼</p>
                                    <p className="text-3xl font-bold text-cyan-600">{stats.totalForums || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-100 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-gray-600 text-sm">총 게시물</p>
                                    <p className="text-3xl font-bold text-cyan-600">{stats.totalPosts || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
                            <div className="flex items-center">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-gray-600 text-sm">대기 중인 신고</p>
                                    <p className="text-3xl font-bold text-cyan-600">{stats.pendingReports || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">사용자 관리</h2>
                        <div className="space-y-3">
                            {users.map((user) => (
                                <div key={user.uid} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center shadow-sm">
                                            <span className="text-white font-semibold">
                                                {user.nickname?.charAt(0) || user.displayName?.charAt(0) || 'U'}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-gray-900 font-semibold">
                                                {user.nickname || user.displayName}
                                            </h3>
                                            <p className="text-gray-600 text-sm">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        {user.isActive !== false ? (
                                            <button
                                                onClick={() => handleDeactivateUser(user.uid)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium"
                                            >
                                                비활성화
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivateUser(user.uid)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium"
                                            >
                                                활성화
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'forums' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">포럼 관리</h2>
                        <div className="space-y-3">
                            {forums.map((forum) => (
                                <div key={forum.isbn} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={forum.book.thumbnail}
                                            alt={forum.book.title}
                                            className="w-12 h-16 object-cover rounded-lg shadow-sm"
                                        />
                                        <div>
                                            <h3 className="text-gray-900 font-semibold">{forum.book.title}</h3>
                                            <p className="text-gray-600 text-sm">{forum.book.authors.join(', ')}</p>
                                            <p className="text-gray-500 text-sm">게시물: {forum.postCount || 0}개</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteForum(forum.isbn)}
                                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium"
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">신고 관리</h2>
                        <div className="space-y-3">
                            {reports.map((report) => (
                                <div key={report.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    report.status === 'resolved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        'bg-gray-100 text-gray-700 border border-gray-200'
                                                }`}>
                                                {report.status === 'pending' ? '대기중' :
                                                    report.status === 'resolved' ? '해결됨' : '검토중'}
                                            </span>
                                            <span className="text-gray-600 text-sm">
                                                {report.type === 'spam' ? '스팸' :
                                                    report.type === 'harassment' ? '괴롭힘' :
                                                        report.type === 'inappropriate_content' ? '부적절한 내용' :
                                                            report.type === 'fake_news' ? '가짜 뉴스' : '기타'}
                                            </span>
                                        </div>
                                        <span className="text-gray-500 text-sm">
                                            {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}
                                        </span>
                                    </div>
                                    <p className="text-gray-900 font-semibold mb-1">{report.reason}</p>
                                    <p className="text-gray-600 text-sm mb-3">{report.description}</p>
                                    {report.status === 'pending' && (
                                        <button
                                            onClick={() => handleResolveReport(report.id)}
                                            className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 font-medium"
                                        >
                                            해결 처리
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
