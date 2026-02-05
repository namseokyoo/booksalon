import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    increment,
    serverTimestamp,
    collectionGroup,
    writeBatch
} from 'firebase/firestore';
import type { Forum, Post, TagStats } from '../types';

export class TagService {
    // 태그 이름 정규화 (공백 제거, 소문자 변환)
    static normalizeTag(tag: string): string {
        return tag.trim().toLowerCase().replace(/\s+/g, '_');
    }

    // 태그 유효성 검사
    static validateTag(tag: string): { valid: boolean; error?: string } {
        const trimmed = tag.trim();
        if (trimmed.length === 0) {
            return { valid: false, error: '태그를 입력해주세요.' };
        }
        if (trimmed.length > 20) {
            return { valid: false, error: '태그는 20자 이내로 입력해주세요.' };
        }
        if (!/^[가-힣a-zA-Z0-9_\s]+$/.test(trimmed)) {
            return { valid: false, error: '태그는 한글, 영문, 숫자, 밑줄(_)만 사용 가능합니다.' };
        }
        return { valid: true };
    }

    // 태그 사용 횟수 증가
    static async incrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void> {
        const normalizedTag = this.normalizeTag(tagName);
        const tagRef = doc(db, 'tags', `${normalizedTag}_${type}`);
        const tagSnap = await getDoc(tagRef);

        if (tagSnap.exists()) {
            await updateDoc(tagRef, {
                count: increment(1),
                lastUsedAt: serverTimestamp()
            });
        } else {
            await setDoc(tagRef, {
                name: tagName.trim(),
                count: 1,
                type,
                lastUsedAt: serverTimestamp()
            });
        }
    }

    // 태그 사용 횟수 감소 (count가 0이 되면 태그 문서 삭제)
    static async decrementTagCount(tagName: string, type: 'forum' | 'post'): Promise<void> {
        const normalizedTag = this.normalizeTag(tagName);
        const tagRef = doc(db, 'tags', `${normalizedTag}_${type}`);
        const tagSnap = await getDoc(tagRef);

        if (tagSnap.exists()) {
            const currentCount = tagSnap.data().count || 0;
            if (currentCount > 1) {
                await updateDoc(tagRef, {
                    count: increment(-1)
                });
            } else {
                // count가 0 또는 1이 되면 태그 문서 삭제
                await deleteDoc(tagRef);
            }
        }
    }

    // 미사용 태그 정리 (count가 0인 태그 일괄 삭제)
    static async cleanupUnusedTags(): Promise<{ deleted: number; errors: string[] }> {
        const errors: string[] = [];
        let deleted = 0;

        try {
            const tagsRef = collection(db, 'tags');
            const q = query(tagsRef, where('count', '<=', 0));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { deleted: 0, errors: [] };
            }

            // Firestore batch는 최대 500개 제한
            const batchSize = 500;
            const batches: typeof writeBatch extends (db: any) => infer R ? R[] : never[] = [];
            let currentBatch = writeBatch(db);
            let operationCount = 0;

            for (const docSnap of snapshot.docs) {
                currentBatch.delete(docSnap.ref);
                operationCount++;
                deleted++;

                if (operationCount >= batchSize) {
                    batches.push(currentBatch);
                    currentBatch = writeBatch(db);
                    operationCount = 0;
                }
            }

            // 마지막 배치 추가
            if (operationCount > 0) {
                batches.push(currentBatch);
            }

            // 모든 배치 실행
            await Promise.all(batches.map(batch => batch.commit()));

            console.log(`미사용 태그 ${deleted}개 삭제 완료`);
        } catch (error) {
            console.error('미사용 태그 정리 실패:', error);
            errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
        }

        return { deleted, errors };
    }

    // 인기 태그 조회 (캐싱 적용 가능)
    static async getPopularTags(type: 'forum' | 'post', maxCount: number = 10): Promise<string[]> {
        try {
            const tagsRef = collection(db, 'tags');
            const q = query(
                tagsRef,
                where('type', '==', type),
                orderBy('count', 'desc'),
                limit(maxCount)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data() as TagStats;
                return data.name;
            });
        } catch (error) {
            console.error('인기 태그 조회 실패:', error);
            return [];
        }
    }

    // 태그 자동완성 (prefix 검색)
    static async searchTags(prefix: string, type: 'forum' | 'post', maxCount: number = 5): Promise<string[]> {
        if (!prefix.trim()) {
            return this.getPopularTags(type, maxCount);
        }

        try {
            const normalizedPrefix = this.normalizeTag(prefix);
            const tagsRef = collection(db, 'tags');

            // Firestore는 prefix 검색을 위해 범위 쿼리 사용
            // 정규화된 태그 이름 기반으로 검색
            const q = query(
                tagsRef,
                where('type', '==', type),
                orderBy('count', 'desc'),
                limit(20)
            );

            const snapshot = await getDocs(q);
            const results = snapshot.docs
                .map(doc => {
                    const data = doc.data() as TagStats;
                    return data.name;
                })
                .filter(name =>
                    name.toLowerCase().includes(prefix.toLowerCase())
                )
                .slice(0, maxCount);

            return results;
        } catch (error) {
            console.error('태그 검색 실패:', error);
            return [];
        }
    }

    // 태그로 살롱 검색
    static async getForumsByTag(tagName: string): Promise<Forum[]> {
        try {
            const forumsRef = collection(db, 'forums');
            const q = query(
                forumsRef,
                where('tags', 'array-contains', tagName),
                orderBy('lastActivityAt', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                isbn: doc.id,
                ...doc.data()
            })) as Forum[];
        } catch (error) {
            console.error('태그로 살롱 검색 실패:', error);
            return [];
        }
    }

    // 태그로 게시물 검색 (Collection Group Query)
    static async getPostsByTag(tagName: string, forumIsbn?: string): Promise<Post[]> {
        try {
            if (forumIsbn) {
                // 특정 살롱 내 게시물 검색
                const postsRef = collection(db, 'forums', forumIsbn, 'posts');
                const q = query(
                    postsRef,
                    where('tags', 'array-contains', tagName),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Post[];
            } else {
                // 전체 게시물 검색 (Collection Group Query)
                const postsRef = collectionGroup(db, 'posts');
                const q = query(
                    postsRef,
                    where('tags', 'array-contains', tagName),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );

                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Post[];
            }
        } catch (error) {
            console.error('태그로 게시물 검색 실패:', error);
            return [];
        }
    }

    // 살롱에 태그 추가 (최대 5개)
    static async addTagsToForum(forumIsbn: string, tags: string[]): Promise<void> {
        if (tags.length > 5) {
            throw new Error('태그는 최대 5개까지 추가할 수 있습니다.');
        }

        // 모든 태그 유효성 검사
        for (const tag of tags) {
            const validation = this.validateTag(tag);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }

        const forumRef = doc(db, 'forums', forumIsbn);
        await updateDoc(forumRef, {
            tags: tags.map(t => t.trim())
        });

        // 태그 통계 업데이트
        for (const tag of tags) {
            await this.incrementTagCount(tag, 'forum');
        }
    }

    // 게시물에 태그 추가 (최대 3개)
    static async addTagsToPost(forumIsbn: string, postId: string, tags: string[]): Promise<void> {
        if (tags.length > 3) {
            throw new Error('게시물 태그는 최대 3개까지 추가할 수 있습니다.');
        }

        // 모든 태그 유효성 검사
        for (const tag of tags) {
            const validation = this.validateTag(tag);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
        }

        const postRef = doc(db, 'forums', forumIsbn, 'posts', postId);
        await updateDoc(postRef, {
            tags: tags.map(t => t.trim())
        });

        // 태그 통계 업데이트
        for (const tag of tags) {
            await this.incrementTagCount(tag, 'post');
        }
    }

    // 살롱 태그 업데이트 (기존 태그와 비교하여 추가/삭제)
    static async updateForumTags(forumIsbn: string, oldTags: string[], newTags: string[]): Promise<void> {
        const addedTags = newTags.filter(t => !oldTags.includes(t));
        const removedTags = oldTags.filter(t => !newTags.includes(t));

        const forumRef = doc(db, 'forums', forumIsbn);
        await updateDoc(forumRef, {
            tags: newTags.map(t => t.trim())
        });

        // 추가된 태그 카운트 증가
        for (const tag of addedTags) {
            await this.incrementTagCount(tag, 'forum');
        }

        // 삭제된 태그 카운트 감소
        for (const tag of removedTags) {
            await this.decrementTagCount(tag, 'forum');
        }
    }

    // 게시물 태그 업데이트
    static async updatePostTags(forumIsbn: string, postId: string, oldTags: string[], newTags: string[]): Promise<void> {
        const addedTags = newTags.filter(t => !oldTags.includes(t));
        const removedTags = oldTags.filter(t => !newTags.includes(t));

        const postRef = doc(db, 'forums', forumIsbn, 'posts', postId);
        await updateDoc(postRef, {
            tags: newTags.map(t => t.trim())
        });

        // 추가된 태그 카운트 증가
        for (const tag of addedTags) {
            await this.incrementTagCount(tag, 'post');
        }

        // 삭제된 태그 카운트 감소
        for (const tag of removedTags) {
            await this.decrementTagCount(tag, 'post');
        }
    }

    // 모든 태그 조회 (관리용)
    static async getAllTags(type?: 'forum' | 'post'): Promise<TagStats[]> {
        try {
            const tagsRef = collection(db, 'tags');
            let q;

            if (type) {
                q = query(tagsRef, where('type', '==', type), orderBy('count', 'desc'));
            } else {
                q = query(tagsRef, orderBy('count', 'desc'));
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                name: doc.data().name,
                count: doc.data().count,
                type: doc.data().type,
                lastUsedAt: doc.data().lastUsedAt
            })) as TagStats[];
        } catch (error) {
            console.error('태그 목록 조회 실패:', error);
            return [];
        }
    }
}
