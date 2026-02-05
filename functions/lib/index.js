"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLikeUpdate = exports.onCommentCreate = exports.onPostCreate = exports.onForumCreate = exports.updatePopularPosts = exports.updatePopularForums = exports.aggregateDailyMetrics = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// 일별 통계 집계 (매일 자정 실행)
exports.aggregateDailyMetrics = functions.pubsub
    .schedule('0 0 * * *') // 매일 자정
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
        // 전날 데이터 집계
        const [usersSnapshot, forumsSnapshot, reportsSnapshot] = await Promise.all([
            db.collection('users').get(),
            db.collection('forums').get(),
            db.collection('reports').get()
        ]);
        // 전날 생성된 사용자 수
        const newUsers = usersSnapshot.docs.filter(doc => {
            var _a;
            const createdAt = (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate();
            return createdAt && createdAt >= yesterday && createdAt < today;
        }).length;
        // 전날 생성된 포럼 수
        const newForums = forumsSnapshot.docs.filter(doc => {
            var _a;
            const createdAt = (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate();
            return createdAt && createdAt >= yesterday && createdAt < today;
        }).length;
        // 전날 게시글 및 댓글 수집
        let newPosts = 0;
        let newComments = 0;
        let newLikes = 0;
        for (const forumDoc of forumsSnapshot.docs) {
            const postsRef = db.collection('forums').doc(forumDoc.id).collection('posts');
            const postsSnapshot = await postsRef.get();
            postsSnapshot.docs.forEach(postDoc => {
                var _a;
                const postData = postDoc.data();
                const createdAt = (_a = postData.createdAt) === null || _a === void 0 ? void 0 : _a.toDate();
                if (createdAt && createdAt >= yesterday && createdAt < today) {
                    newPosts++;
                    newLikes += postData.likeCount || 0;
                }
                // 댓글 수집
                const commentsRef = postsRef.doc(postDoc.id).collection('comments');
                commentsRef.get().then(commentsSnapshot => {
                    commentsSnapshot.docs.forEach(commentDoc => {
                        var _a;
                        const commentCreatedAt = (_a = commentDoc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate();
                        if (commentCreatedAt && commentCreatedAt >= yesterday && commentCreatedAt < today) {
                            newComments++;
                        }
                    });
                });
            });
        }
        // 전날 신고 수
        const newReports = reportsSnapshot.docs.filter(doc => {
            var _a;
            const createdAt = (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate();
            return createdAt && createdAt >= yesterday && createdAt < today;
        }).length;
        const pendingReports = reportsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
        const resolvedReports = reportsSnapshot.docs.filter(doc => doc.data().status === 'resolved').length;
        // 활성 사용자 수 (전날 로그인한 사용자)
        const activeUsers = usersSnapshot.docs.filter(doc => {
            var _a;
            const lastLoginAt = (_a = doc.data().lastLoginAt) === null || _a === void 0 ? void 0 : _a.toDate();
            return lastLoginAt && lastLoginAt >= yesterday && lastLoginAt < today;
        }).length;
        // 일별 통계 저장
        const dailyMetrics = {
            date: dateStr,
            totalUsers: usersSnapshot.size,
            activeUsers,
            newUsers,
            totalForums: forumsSnapshot.size,
            newForums,
            totalPosts: 0,
            newPosts,
            totalComments: 0,
            newComments,
            totalLikes: 0,
            newLikes,
            totalReports: reportsSnapshot.size,
            newReports,
            pendingReports,
            resolvedReports,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('analytics').doc('daily_metrics').collection('metrics').doc(dateStr).set(dailyMetrics);
        console.log(`일별 통계 집계 완료: ${dateStr}`);
        return null;
    }
    catch (error) {
        console.error('일별 통계 집계 실패:', error);
        return null;
    }
});
// 인기 포럼 업데이트 (매시간 실행)
exports.updatePopularForums = functions.pubsub
    .schedule('0 * * * *') // 매시간
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
    try {
        const forumsSnapshot = await db.collection('forums').get();
        const popularForums = [];
        // 각 포럼의 통계 수집
        for (const forumDoc of forumsSnapshot.docs) {
            const forumData = forumDoc.data();
            const postsRef = db.collection('forums').doc(forumDoc.id).collection('posts');
            const postsSnapshot = await postsRef.get();
            let commentCount = 0;
            let likeCount = 0;
            for (const postDoc of postsSnapshot.docs) {
                const postData = postDoc.data();
                likeCount += postData.likeCount || 0;
                const commentsSnapshot = await postsRef.doc(postDoc.id).collection('comments').get();
                commentCount += commentsSnapshot.size;
            }
            const postCount = postsSnapshot.size;
            // 인기도 점수: 게시글 수 * 2 + 댓글 수 + 좋아요 수
            const popularityScore = postCount * 2 + commentCount + likeCount;
            popularForums.push({
                isbn: forumDoc.id,
                title: forumData.book.title,
                thumbnail: forumData.book.thumbnail,
                authors: forumData.book.authors,
                postCount,
                commentCount,
                likeCount,
                popularityScore,
                lastActivityAt: forumData.lastActivityAt || admin.firestore.Timestamp.now(),
                rank: 0 // 나중에 정렬 후 설정
            });
        }
        // 인기도 점수로 정렬
        popularForums.sort((a, b) => b.popularityScore - a.popularityScore);
        // TOP 10 저장
        const top10 = popularForums.slice(0, 10).map((forum, index) => (Object.assign(Object.assign({}, forum), { rank: index + 1 })));
        // 기존 데이터 삭제 후 새로 저장
        const popularForumsRef = db.collection('analytics').doc('popular_forums');
        await popularForumsRef.set({
            forums: top10,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('인기 포럼 업데이트 완료');
        return null;
    }
    catch (error) {
        console.error('인기 포럼 업데이트 실패:', error);
        return null;
    }
});
// 인기 게시글 업데이트 (매시간 실행)
exports.updatePopularPosts = functions.pubsub
    .schedule('0 * * * *') // 매시간
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
    try {
        const forumsSnapshot = await db.collection('forums').get();
        const popularPosts = [];
        // 각 포럼의 게시글 수집
        for (const forumDoc of forumsSnapshot.docs) {
            const forumData = forumDoc.data();
            const postsRef = db.collection('forums').doc(forumDoc.id).collection('posts');
            const postsQuery = postsRef.orderBy('likeCount', 'desc').limit(5);
            const postsSnapshot = await postsQuery.get();
            for (const postDoc of postsSnapshot.docs) {
                const postData = postDoc.data();
                const likeCount = postData.likeCount || 0;
                const commentsSnapshot = await postsRef.doc(postDoc.id).collection('comments').get();
                const commentCount = commentsSnapshot.size;
                // 인기도 점수: 좋아요 * 2 + 댓글 수
                const popularityScore = likeCount * 2 + commentCount;
                popularPosts.push({
                    postId: postDoc.id,
                    forumIsbn: forumDoc.id,
                    forumTitle: forumData.book.title,
                    title: postData.title,
                    authorId: postData.author.uid,
                    authorName: postData.author.displayName || postData.author.email,
                    likeCount,
                    commentCount,
                    popularityScore,
                    createdAt: postData.createdAt,
                    rank: 0
                });
            }
        }
        // 인기도 점수로 정렬
        popularPosts.sort((a, b) => b.popularityScore - a.popularityScore);
        // TOP 10 저장
        const top10 = popularPosts.slice(0, 10).map((post, index) => (Object.assign(Object.assign({}, post), { rank: index + 1 })));
        // 기존 데이터 삭제 후 새로 저장
        const popularPostsRef = db.collection('analytics').doc('popular_posts');
        await popularPostsRef.set({
            posts: top10,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('인기 게시글 업데이트 완료');
        return null;
    }
    catch (error) {
        console.error('인기 게시글 업데이트 실패:', error);
        return null;
    }
});
// 포럼 생성 시 통계 업데이트
exports.onForumCreate = functions.firestore
    .document('forums/{forumId}')
    .onCreate(async (snapshot, context) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateStr = today.toISOString().split('T')[0];
        const metricsRef = db.collection('analytics').doc('daily_metrics').collection('metrics').doc(dateStr);
        const metricsDoc = await metricsRef.get();
        if (metricsDoc.exists) {
            await metricsRef.update({
                newForums: admin.firestore.FieldValue.increment(1),
                totalForums: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        return null;
    }
    catch (error) {
        console.error('포럼 생성 통계 업데이트 실패:', error);
        return null;
    }
});
// 게시글 작성 시 통계 업데이트
exports.onPostCreate = functions.firestore
    .document('forums/{forumId}/posts/{postId}')
    .onCreate(async (snapshot, context) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateStr = today.toISOString().split('T')[0];
        const metricsRef = db.collection('analytics').doc('daily_metrics').collection('metrics').doc(dateStr);
        const metricsDoc = await metricsRef.get();
        if (metricsDoc.exists) {
            await metricsRef.update({
                newPosts: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // 포럼의 postCount 업데이트
        await db.collection('forums').doc(context.params.forumId).update({
            postCount: admin.firestore.FieldValue.increment(1),
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return null;
    }
    catch (error) {
        console.error('게시글 작성 통계 업데이트 실패:', error);
        return null;
    }
});
// 댓글 작성 시 통계 업데이트
exports.onCommentCreate = functions.firestore
    .document('forums/{forumId}/posts/{postId}/comments/{commentId}')
    .onCreate(async (snapshot, context) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateStr = today.toISOString().split('T')[0];
        const metricsRef = db.collection('analytics').doc('daily_metrics').collection('metrics').doc(dateStr);
        const metricsDoc = await metricsRef.get();
        if (metricsDoc.exists) {
            await metricsRef.update({
                newComments: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        // 게시글의 commentCount 업데이트
        await db.collection('forums').doc(context.params.forumId)
            .collection('posts').doc(context.params.postId)
            .update({
            commentCount: admin.firestore.FieldValue.increment(1)
        });
        // 포럼의 lastActivityAt 업데이트
        await db.collection('forums').doc(context.params.forumId).update({
            lastActivityAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return null;
    }
    catch (error) {
        console.error('댓글 작성 통계 업데이트 실패:', error);
        return null;
    }
});
// 좋아요 시 인기 게시글 업데이트 (트리거)
exports.onLikeUpdate = functions.firestore
    .document('forums/{forumId}/posts/{postId}')
    .onUpdate(async (change, context) => {
    try {
        const beforeData = change.before.data();
        const afterData = change.after.data();
        const beforeLikes = beforeData.likeCount || 0;
        const afterLikes = afterData.likeCount || 0;
        // 좋아요 수가 변경된 경우에만 인기 게시글 업데이트
        if (beforeLikes !== afterLikes) {
            // 인기 게시글 업데이트 함수 호출 (간단한 버전)
            // 실제로는 전체 재계산보다는 해당 게시글만 업데이트하는 것이 효율적
            // 여기서는 간단히 로그만 남김
            console.log(`게시글 좋아요 수 변경: ${context.params.postId}, ${beforeLikes} -> ${afterLikes}`);
        }
        return null;
    }
    catch (error) {
        console.error('좋아요 업데이트 처리 실패:', error);
        return null;
    }
});
//# sourceMappingURL=index.js.map