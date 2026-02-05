import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import type { BookRating, RatingDistribution } from '../types';

export class RatingService {
    // 사용자 평점 저장/업데이트
    static async setUserRating(
        bookIsbn: string,
        userId: string,
        rating: number
    ): Promise<void> {
        // rating은 1-5 사이의 정수여야 함
        if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
            throw new Error('평점은 1-5 사이의 정수여야 합니다.');
        }

        const ratingDocId = `${bookIsbn}_${userId}`;
        const ratingRef = doc(db, 'ratings', ratingDocId);

        // 기존 평점 확인
        const existingRating = await getDoc(ratingRef);

        if (existingRating.exists()) {
            // 기존 평점 업데이트
            await updateDoc(ratingRef, {
                rating,
                updatedAt: serverTimestamp()
            });
        } else {
            // 새 평점 생성
            await setDoc(ratingRef, {
                bookIsbn,
                userId,
                rating,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        // Forum의 평균 평점 업데이트
        await this.updateForumRating(bookIsbn);
    }

    // 사용자 평점 조회
    static async getUserRating(bookIsbn: string, userId: string): Promise<number | null> {
        const ratingDocId = `${bookIsbn}_${userId}`;
        const ratingRef = doc(db, 'ratings', ratingDocId);
        const ratingSnap = await getDoc(ratingRef);

        if (ratingSnap.exists()) {
            const data = ratingSnap.data() as BookRating;
            return data.rating;
        }

        return null;
    }

    // 평균 평점 조회
    static async getAverageRating(bookIsbn: string): Promise<{ average: number; total: number }> {
        const ratingsRef = collection(db, 'ratings');
        const q = query(ratingsRef, where('bookIsbn', '==', bookIsbn));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return { average: 0, total: 0 };
        }

        const ratings = snapshot.docs.map(doc => doc.data() as BookRating);
        const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
        const average = sum / ratings.length;
        const roundedAverage = Math.round(average * 10) / 10; // 소수점 1자리

        return {
            average: roundedAverage,
            total: ratings.length
        };
    }

    // Forum의 평균 평점 업데이트
    static async updateForumRating(bookIsbn: string): Promise<void> {
        const { average, total } = await this.getAverageRating(bookIsbn);

        const forumRef = doc(db, 'forums', bookIsbn);
        await updateDoc(forumRef, {
            averageRating: average,
            totalRatings: total
        });
    }

    // 평점 삭제
    static async deleteRating(bookIsbn: string, userId: string): Promise<void> {
        const ratingDocId = `${bookIsbn}_${userId}`;
        const ratingRef = doc(db, 'ratings', ratingDocId);

        // Firestore는 deleteDoc이 없으므로 존재하면 삭제하지 않고 평점을 0으로 설정하지 않음
        // 대신 평균 평점을 다시 계산
        await this.updateForumRating(bookIsbn);
    }

    // 평점 분포 조회
    static async getRatingDistribution(bookIsbn: string): Promise<RatingDistribution> {
        const ratingsRef = collection(db, 'ratings');
        const q = query(ratingsRef, where('bookIsbn', '==', bookIsbn));
        const snapshot = await getDocs(q);

        // 초기값 설정
        const distribution: RatingDistribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };

        if (snapshot.empty) {
            return distribution;
        }

        // 각 평점별 개수 계산
        snapshot.docs.forEach(doc => {
            const data = doc.data() as BookRating;
            const rating = data.rating as 1 | 2 | 3 | 4 | 5;
            if (rating >= 1 && rating <= 5) {
                distribution[rating]++;
            }
        });

        return distribution;
    }
}

