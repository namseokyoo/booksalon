import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, serverTimestamp, increment } from 'firebase/firestore';
import { ProfileImageService } from './profileImageService';
import type { UserProfile, Post, Comment } from '../types';

export class UserProfileService {
    // 사용자 프로필 생성/업데이트 (확장된 버전)
    static async createOrUpdateProfile(
        uid: string,
        email: string,
        displayName?: string,
        bio?: string,
        nickname?: string,
        profileImageFile?: File
    ): Promise<void> {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        let profileImageUrl: string | undefined;

        // 프로필 이미지 업로드 처리
        if (profileImageFile) {
            try {
                // 이미지 최적화
                const optimizedFile = await ProfileImageService.optimizeImage(profileImageFile);
                profileImageUrl = await ProfileImageService.uploadProfileImage(uid, optimizedFile);
            } catch (error) {
                console.error('프로필 이미지 업로드 실패:', error);
                throw error;
            }
        }

        if (userSnap.exists()) {
            // 기존 사용자 업데이트
            const updateData: any = {
                displayName: displayName || userSnap.data()?.displayName,
                bio: bio || userSnap.data()?.bio,
                lastLoginAt: serverTimestamp()
            };

            if (nickname) updateData.nickname = nickname;
            if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;

            await updateDoc(userRef, updateData);
        } else {
            // 새 사용자 생성
            const defaultNickname = nickname || displayName || email.split('@')[0];
            const defaultProfileImageUrl = profileImageUrl || ProfileImageService.generateDefaultProfileImageUrl(defaultNickname);

            await setDoc(userRef, {
                uid,
                email,
                displayName: displayName || email.split('@')[0],
                nickname: defaultNickname,
                bio: bio || '',
                profileImageUrl: defaultProfileImageUrl,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                postCount: 0,
                commentCount: 0,
                forumCount: 0,
                favoriteGenres: [],
                readingGoal: 0,
                notificationSettings: {
                    newPosts: true,
                    newComments: true,
                    forumUpdates: true,
                    follows: true,
                    likes: true,
                    emailNotifications: false
                }
            });
        }
    }

    // 사용자 프로필 조회
    static async getUserProfile(uid: string): Promise<UserProfile | null> {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists) {
            return { uid, ...userSnap.data() } as UserProfile;
        }
        return null;
    }

    // 사용자 작성 게시물 조회 (인덱스 없이 작동하도록 수정)
    static async getUserPosts(uid: string): Promise<Post[]> {
        // 모든 포럼에서 해당 사용자의 게시물을 찾기
        const forumsRef = collection(db, 'forums');
        const forumsSnap = await getDocs(forumsRef);

        const allPosts: Post[] = [];

        for (const forumDoc of forumsSnap.docs) {
            const postsRef = query(collection(db, 'forums', forumDoc.id, 'posts'), where('author.uid', '==', uid));
            const postsSnap = await getDocs(postsRef);

            const posts = postsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];

            allPosts.push(...posts);
        }

        // 클라이언트에서 정렬
        return allPosts.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
        });
    }

    // 사용자 작성 댓글 조회 (인덱스 없이 작동하도록 수정)
    static async getUserComments(uid: string): Promise<Comment[]> {
        // 모든 포럼의 모든 게시물에서 해당 사용자의 댓글을 찾기
        const forumsRef = collection(db, 'forums');
        const forumsSnap = await getDocs(forumsRef);

        const allComments: Comment[] = [];

        for (const forumDoc of forumsSnap.docs) {
            const postsRef = collection(db, 'forums', forumDoc.id, 'posts');
            const postsSnap = await getDocs(postsRef);

            for (const postDoc of postsSnap.docs) {
                const commentsRef = query(collection(db, 'forums', forumDoc.id, 'posts', postDoc.id, 'comments'), where('author.uid', '==', uid));
                const commentsSnap = await getDocs(commentsRef);

                const comments = commentsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Comment[];

                allComments.push(...comments);
            }
        }

        // 클라이언트에서 정렬
        return allComments.sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || new Date(0);
            const bTime = b.createdAt?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
        });
    }

    // 사용자 활동 통계 업데이트
    static async updateUserStats(uid: string, type: 'post' | 'comment' | 'forum', shouldIncrement: boolean = true): Promise<void> {
        const userRef = doc(db, 'users', uid);
        const fieldName = `${type}Count`;

        await updateDoc(userRef, {
            [fieldName]: shouldIncrement ? increment(1) : increment(-1)
        });
    }

    // 사용자 프로필 편집 (확장된 버전)
    static async updateProfile(uid: string, updateData: Partial<UserProfile>): Promise<void> {
        const userRef = doc(db, 'users', uid);

        let profileImageUrl: string | undefined;

        // 프로필 이미지 업로드 처리
        if (updateData.profileImageFile) {
            try {
                const optimizedFile = await ProfileImageService.optimizeImage(updateData.profileImageFile);
                profileImageUrl = await ProfileImageService.uploadProfileImage(uid, optimizedFile);
            } catch (error) {
                console.error('프로필 이미지 업로드 실패:', error);
                throw error;
            }
        }

        const dataToUpdate: any = {
            ...updateData,
            lastLoginAt: serverTimestamp()
        };

        // 파일 객체는 제거하고 URL만 저장
        delete dataToUpdate.profileImageFile;
        if (profileImageUrl) {
            dataToUpdate.profileImageUrl = profileImageUrl;
        }

        await updateDoc(userRef, dataToUpdate);
    }
}
