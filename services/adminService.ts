import { db } from './firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    increment
} from 'firebase/firestore';
import type { AdminUser, Report, UserProfile, Forum, Post, Comment } from '../types';

/**
 * @deprecated v0.4.0부터 Firebase 대신 Supabase 사용
 * 이 서비스는 Firebase 환경변수가 없으면 비활성화됩니다.
 * 추후 Supabase 기반으로 마이그레이션 예정입니다.
 */
export class AdminService {
    // Firebase 비활성화 시 경고 출력 및 빈 값 반환
    private static checkFirebaseAvailable(): boolean {
        if (!db) {
            console.warn('[AdminService] Firebase가 비활성화되어 있습니다. 이 기능은 현재 사용할 수 없습니다.');
            return false;
        }
        return true;
    }

    // 관리자 권한 확인
    static async isAdmin(userId: string): Promise<boolean> {
        if (!this.checkFirebaseAvailable() || !db) {
            return false;
        }
        try {
            const adminRef = doc(db, 'admins', userId);
            const adminDoc = await getDoc(adminRef);
            return adminDoc.exists() && adminDoc.data()?.role === 'admin';
        } catch (error) {
            console.error('관리자 권한 확인 실패:', error);
            return false;
        }
    }

    // 관리자 권한 확인 (moderator 포함)
    static async isModerator(userId: string): Promise<boolean> {
        if (!this.checkFirebaseAvailable() || !db) {
            return false;
        }
        try {
            const adminRef = doc(db, 'admins', userId);
            const adminDoc = await getDoc(adminRef);
            const data = adminDoc.data();
            return adminDoc.exists() && (data?.role === 'admin' || data?.role === 'moderator');
        } catch (error) {
            console.error('관리자 권한 확인 실패:', error);
            return false;
        }
    }

    // 관리자로 설정
    static async setAdmin(userId: string, role: 'admin' | 'moderator'): Promise<void> {
        if (!this.checkFirebaseAvailable() || !db) {
            return;
        }
        const adminRef = doc(db, 'admins', userId);
        await updateDoc(adminRef, {
            role,
            updatedAt: serverTimestamp()
        });
    }

    // 사용자 목록 조회
    static async getUsers(limitCount: number = 50): Promise<UserProfile[]> {
        if (!this.checkFirebaseAvailable() || !db) {
            return [];
        }
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
    }

    // 사용자 검색
    static async searchUsers(searchTerm: string): Promise<UserProfile[]> {
        if (!this.checkFirebaseAvailable() || !db) {
            return [];
        }
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('displayName', '>=', searchTerm),
            where('displayName', '<=', searchTerm + '\uf8ff'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
    }

    // 사용자 계정 비활성화
    static async deactivateUser(userId: string): Promise<void> {
        if (!this.checkFirebaseAvailable() || !db) {
            return;
        }
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isActive: false,
            deactivatedAt: serverTimestamp(),
            deactivatedBy: 'admin'
        });
    }

    // 사용자 계정 활성화
    static async activateUser(userId: string): Promise<void> {
        if (!this.checkFirebaseAvailable() || !db) {
            return;
        }
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isActive: true,
            deactivatedAt: null,
            deactivatedBy: null
        });
    }

    // 포럼 목록 조회
    static async getForums(limitCount: number = 50): Promise<Forum[]> {
        if (!this.checkFirebaseAvailable() || !db) {
            return [];
        }
        const forumsRef = collection(db, 'forums');
        const q = query(
            forumsRef,
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ isbn: doc.id, ...doc.data() })) as Forum[];
    }

    // 포럼 삭제
    static async deleteForum(isbn: string): Promise<void> {
        if (!this.checkFirebaseAvailable() || !db) {
            return;
        }
        const forumRef = doc(db, 'forums', isbn);
        await deleteDoc(forumRef);
    }

    // 신고 생성
    static async createReport(
        reporterId: string,
        type: Report['type'],
        reason: string,
        description: string,
        metadata?: {
            reportedUserId?: string;
            reportedPostId?: string;
            reportedCommentId?: string;
            reportedForumId?: string;
        }
    ): Promise<string> {
        if (!this.checkFirebaseAvailable() || !db) {
            throw new Error('신고 기능을 사용할 수 없습니다. (Firebase 비활성화)');
        }
        const reportsRef = collection(db, 'reports');

        const report = {
            reporterId,
            type,
            reason,
            description,
            status: 'pending',
            createdAt: serverTimestamp(),
            ...metadata
        };

        const docRef = await addDoc(reportsRef, report);
        return docRef.id;
    }

    // 신고 목록 조회
    static async getReports(status?: Report['status']): Promise<Report[]> {
        if (!this.checkFirebaseAvailable() || !db) {
            return [];
        }
        const reportsRef = collection(db, 'reports');
        let q = query(
            reportsRef,
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        if (status) {
            q = query(
                reportsRef,
                where('status', '==', status),
                orderBy('createdAt', 'desc'),
                limit(50)
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Report[];
    }

    // 신고 상태 업데이트
    static async updateReportStatus(
        reportId: string,
        status: Report['status'],
        resolvedBy: string,
        resolution?: string
    ): Promise<void> {
        if (!this.checkFirebaseAvailable() || !db) {
            return;
        }
        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
            status,
            resolvedBy,
            resolvedAt: serverTimestamp(),
            resolution
        });
    }

    // 통계 조회
    static async getStats(): Promise<{
        totalUsers: number;
        totalForums: number;
        totalPosts: number;
        totalReports: number;
        pendingReports: number;
    }> {
        if (!this.checkFirebaseAvailable() || !db) {
            return {
                totalUsers: 0,
                totalForums: 0,
                totalPosts: 0,
                totalReports: 0,
                pendingReports: 0
            };
        }
        const [usersSnapshot, forumsSnapshot, reportsSnapshot] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'forums')),
            getDocs(collection(db, 'reports'))
        ]);

        const pendingReports = reportsSnapshot.docs.filter(
            doc => doc.data().status === 'pending'
        ).length;

        // 포스트 수는 각 포럼의 포스트를 합산
        let totalPosts = 0;
        for (const forumDoc of forumsSnapshot.docs) {
            const postsSnapshot = await getDocs(
                collection(db, 'forums', forumDoc.id, 'posts')
            );
            totalPosts += postsSnapshot.size;
        }

        return {
            totalUsers: usersSnapshot.size,
            totalForums: forumsSnapshot.size,
            totalPosts,
            totalReports: reportsSnapshot.size,
            pendingReports
        };
    }

    // 실시간 통계 리스너
    static subscribeToStats(callback: (stats: any) => void): () => void {
        if (!this.checkFirebaseAvailable() || !db) {
            callback({
                totalUsers: 0,
                totalForums: 0,
                totalPosts: 0,
                totalReports: 0,
                pendingReports: 0
            });
            return () => {}; // 빈 unsubscribe 함수 반환
        }
        const usersRef = collection(db, 'users');
        const forumsRef = collection(db, 'forums');
        const reportsRef = collection(db, 'reports');

        const unsubscribeUsers = onSnapshot(usersRef, () => {
            this.getStats().then(callback);
        });

        const unsubscribeForums = onSnapshot(forumsRef, () => {
            this.getStats().then(callback);
        });

        const unsubscribeReports = onSnapshot(reportsRef, () => {
            this.getStats().then(callback);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeForums();
            unsubscribeReports();
        };
    }
}
