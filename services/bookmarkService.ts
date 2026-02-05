import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from 'firebase/firestore';
import type { Forum } from '../types';

export class BookmarkService {
    // 포럼 북마크 추가/제거
    static async toggleBookmark(uid: string, isbn: string): Promise<boolean> {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('사용자 프로필을 찾을 수 없습니다.');
        }

        const userData = userDoc.data();
        const bookmarkedForums = userData?.bookmarkedForums || [];

        const isBookmarked = bookmarkedForums.includes(isbn);

        if (isBookmarked) {
            // 북마크 제거
            await updateDoc(userRef, {
                bookmarkedForums: arrayRemove(isbn)
            });
            return false;
        } else {
            // 북마크 추가
            await updateDoc(userRef, {
                bookmarkedForums: arrayUnion(isbn)
            });
            return true;
        }
    }

    // 사용자의 북마크한 포럼 목록 조회
    static async getBookmarkedForums(uid: string): Promise<Forum[]> {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists) {
            return [];
        }

        const userData = userDoc.data();
        const bookmarkedIsbns = userData?.bookmarkedForums || [];

        if (bookmarkedIsbns.length === 0) {
            return [];
        }

        // 북마크한 포럼들의 정보를 조회
        const forums: Forum[] = [];

        for (const isbn of bookmarkedIsbns) {
            try {
                const forumDoc = await getDoc(doc(db, 'forums', isbn));
                if (forumDoc.exists) {
                    forums.push({ isbn: forumDoc.id, ...forumDoc.data() } as Forum);
                }
            } catch (error) {
                console.error(`포럼 ${isbn} 조회 실패:`, error);
            }
        }

        return forums;
    }

    // 포럼이 북마크되어 있는지 확인
    static async isBookmarked(uid: string, isbn: string): Promise<boolean> {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();
        const bookmarkedForums = userData?.bookmarkedForums || [];

        return bookmarkedForums.includes(isbn);
    }

    // 알림 설정 업데이트
    static async updateNotificationSettings(
        uid: string,
        settings: {
            newPosts?: boolean;
            newComments?: boolean;
            forumUpdates?: boolean;
        }
    ): Promise<void> {
        const userRef = doc(db, 'users', uid);

        await updateDoc(userRef, {
            notificationSettings: settings
        });
    }

    // 알림 설정 조회
    static async getNotificationSettings(uid: string): Promise<{
        newPosts: boolean;
        newComments: boolean;
        forumUpdates: boolean;
    }> {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists) {
            return {
                newPosts: true,
                newComments: true,
                forumUpdates: true
            };
        }

        const userData = userDoc.data();
        const settings = userData?.notificationSettings || {};

        return {
            newPosts: settings.newPosts ?? true,
            newComments: settings.newComments ?? true,
            forumUpdates: settings.forumUpdates ?? true
        };
    }
}
