import { db } from './firebase';
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp, increment, arrayRemove, arrayUnion } from 'firebase/firestore';
import type { UserProfile, Activity } from '../types';

export class SocialService {
    // 사용자 팔로우/언팔로우
    static async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
        const currentUserRef = db.collection('users').doc(currentUserId);
        const targetUserRef = db.collection('users').doc(targetUserId);

        const [currentUserDoc, targetUserDoc] = await Promise.all([
            currentUserRef.get(),
            targetUserRef.get()
        ]);

        if (!currentUserDoc.exists || !targetUserDoc.exists) {
            throw new Error('사용자를 찾을 수 없습니다.');
        }

        const currentUserData = currentUserDoc.data() as UserProfile;
        const targetUserData = targetUserDoc.data() as UserProfile;

        const currentFollowing = currentUserData.following || [];
        const targetFollowers = targetUserData.followers || [];

        const isFollowing = currentFollowing.includes(targetUserId);

        if (isFollowing) {
            // 언팔로우
            await Promise.all([
                currentUserRef.update({
                    following: arrayRemove(targetUserId)
                }),
                targetUserRef.update({
                    followers: arrayRemove(currentUserId)
                })
            ]);

            // 활동 기록 생성
            await this.createActivity({
                type: 'follow',
                userId: currentUserId,
                userName: currentUserData.displayName || currentUserData.email.split('@')[0],
                userEmail: currentUserData.email,
                targetId: targetUserId,
                targetTitle: targetUserData.displayName || targetUserData.email.split('@')[0],
                metadata: { action: 'unfollow' }
            });

            return false;
        } else {
            // 팔로우
            await Promise.all([
                currentUserRef.update({
                    following: arrayUnion(targetUserId)
                }),
                targetUserRef.update({
                    followers: arrayUnion(currentUserId)
                })
            ]);

            // 활동 기록 생성
            await this.createActivity({
                type: 'follow',
                userId: currentUserId,
                userName: currentUserData.displayName || currentUserData.email.split('@')[0],
                userEmail: currentUserData.email,
                targetId: targetUserId,
                targetTitle: targetUserData.displayName || targetUserData.email.split('@')[0],
                metadata: { action: 'follow' }
            });

            return true;
        }
    }

    // 팔로우 상태 확인
    static async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
        const userDoc = await db.collection('users').doc(currentUserId).get();
        if (!userDoc.exists) return false;

        const userData = userDoc.data() as UserProfile;
        const following = userData.following || [];
        return following.includes(targetUserId);
    }

    // 팔로워 목록 조회
    static async getFollowers(userId: string): Promise<UserProfile[]> {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return [];

        const userData = userDoc.data() as UserProfile;
        const followerIds = userData.followers || [];

        if (followerIds.length === 0) return [];

        const followers: UserProfile[] = [];
        for (const followerId of followerIds) {
            try {
                const followerDoc = await db.collection('users').doc(followerId).get();
                if (followerDoc.exists) {
                    followers.push({ uid: followerDoc.id, ...followerDoc.data() } as UserProfile);
                }
            } catch (error) {
                console.error(`팔로워 ${followerId} 조회 실패:`, error);
            }
        }

        return followers;
    }

    // 팔로잉 목록 조회
    static async getFollowing(userId: string): Promise<UserProfile[]> {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return [];

        const userData = userDoc.data() as UserProfile;
        const followingIds = userData.following || [];

        if (followingIds.length === 0) return [];

        const following: UserProfile[] = [];
        for (const followingId of followingIds) {
            try {
                const followingDoc = await db.collection('users').doc(followingId).get();
                if (followingDoc.exists) {
                    following.push({ uid: followingDoc.id, ...followingDoc.data() } as UserProfile);
                }
            } catch (error) {
                console.error(`팔로잉 ${followingId} 조회 실패:`, error);
            }
        }

        return following;
    }

    // 좋아요 토글
    static async toggleLike(
        currentUserId: string,
        targetType: 'post' | 'comment',
        targetId: string,
        forumIsbn: string,
        postId: string // 댓글의 경우 부모 게시물 ID
    ): Promise<boolean> {
        let targetRef;
        if (targetType === 'post') {
            targetRef = doc(db, 'forums', forumIsbn, 'posts', targetId);
        } else {
            // 댓글의 경우
            targetRef = doc(db, 'forums', forumIsbn, 'posts', postId, 'comments', targetId);
        }

        const targetDoc = await getDoc(targetRef);
        if (!targetDoc.exists) {
            throw new Error('대상을 찾을 수 없습니다.');
        }

        const targetData = targetDoc.data();
        const likes = targetData?.likes || [];
        const isLiked = likes.includes(currentUserId);

        if (isLiked) {
            // 좋아요 취소
            await updateDoc(targetRef, {
                likes: arrayRemove(currentUserId),
                likeCount: increment(-1)
            });

            return false;
        } else {
            // 좋아요 추가
            await updateDoc(targetRef, {
                likes: arrayUnion(currentUserId),
                likeCount: increment(1)
            });

            return true;
        }
    }

    // 활동 기록 생성
    static async createActivity(activityData: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
        const activity: Activity = {
            ...activityData,
            id: '', // Firestore에서 자동 생성
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'activities'), activity);
    }

    // 사용자 활동 피드 조회
    static async getUserActivityFeed(userId: string, limit: number = 20): Promise<Activity[]> {
        const activitiesRef = db.collection('activities')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        const activitiesSnap = await activitiesRef.get();
        return activitiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Activity[];
    }

    // 팔로잉 사용자들의 활동 피드 조회
    static async getFollowingActivityFeed(userId: string, limit: number = 20): Promise<Activity[]> {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return [];

        const userData = userDoc.data() as UserProfile;
        const followingIds = userData.following || [];

        if (followingIds.length === 0) return [];

        const activitiesRef = db.collection('activities')
            .where('userId', 'in', followingIds)
            .orderBy('createdAt', 'desc')
            .limit(limit);

        const activitiesSnap = await activitiesRef.get();
        return activitiesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Activity[];
    }

    // 사용자 검색
    static async searchUsers(searchTerm: string, limit: number = 10): Promise<UserProfile[]> {
        const usersRef = db.collection('users');
        const usersSnap = await usersRef.get();

        const users = usersSnap.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        })) as UserProfile[];

        const searchLower = searchTerm.toLowerCase();
        const filteredUsers = users.filter(user =>
            user.displayName?.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.bio?.toLowerCase().includes(searchLower)
        );

        return filteredUsers.slice(0, limit);
    }
}
