import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { UserProfileService } from '../services/userProfile';

const KakaoCallback: React.FC = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        const handleKakaoCallback = async () => {
            try {
                // URL에서 인증 코드 추출
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');

                if (error) {
                    console.error('카카오 로그인 오류:', error);
                    alert('카카오 로그인에 실패했습니다.');
                    window.location.href = '/';
                    return;
                }

                if (!code) {
                    console.error('카카오 인증 코드가 없습니다.');
                    window.location.href = '/';
                    return;
                }

                console.log('카카오 인증 코드:', code);

                // 카카오 인증 코드에서 순수 숫자만 추출해서 고유 ID 생성
                const codeId = code.replace(/[^0-9]/g, '') || 'temp';
                const kakaoId = 'kakao_' + codeId;
                const emailForFirebase = `${kakaoId}@kakao.temp`;
                const tempPassword = `${kakaoId}_password`;

                console.log('Firebase 계정 생성:', emailForFirebase);

                try {
                    // 기존 로그인 상태가 있으면 먼저 로그아웃
                    if (auth.currentUser) {
                        console.log('기존 로그인 상태 로그아웃');
                        await signOut(auth);
                        // 로그아웃 후 잠시 대기
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    // 새 계정 생성 시도 (기존에 있으면 로그인 실패하므로 재시도)
                    let userCredential;
                    let attempts = 0;
                    const maxAttempts = 3;

                    while (attempts < maxAttempts) {
                        try {
                            attempts++;
                            console.log(`로그인/회원가입 시도 ${attempts}/${maxAttempts}`);

                            // 먼저 로그인 시도
                            userCredential = await signInWithEmailAndPassword(auth, emailForFirebase, tempPassword);
                            console.log('기존 계정 로그인 성공');
                            break;
                        } catch (error: any) {
                            if (error.code === 'auth/user-not-found') {
                                // 새 계정 생성
                                console.log('새 계정 생성 시도');
                                try {
                                    userCredential = await createUserWithEmailAndPassword(auth, emailForFirebase, tempPassword);
                                    console.log('새 계정 생성 성공');
                                    await UserProfileService.createOrUpdateProfile(
                                        userCredential.user.uid,
                                        emailForFirebase,
                                        '카카오 사용자',
                                        undefined,
                                        '카카오 사용자'
                                    );
                                    console.log('프로필 저장 완료');
                                    break;
                                } catch (createError: any) {
                                    if (createError.code === 'auth/email-already-in-use') {
                                        // 계정이 이미 존재하므로 다시 로그인 시도
                                        console.log('계정이 이미 존재함, 로그인 재시도');
                                        continue;
                                    } else {
                                        throw createError;
                                    }
                                }
                            } else {
                                console.error('로그인 실패:', error);
                                throw error;
                            }
                        }
                    }

                    if (!userCredential) {
                        throw new Error('최대 시도 횟수 초과');
                    }

                    // 로그인 성공 후 홈으로 이동
                    console.log('로그인 완료, 홈으로 이동');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Firebase 로그인 실패:', error);
                    alert('로그인 처리 중 오류가 발생했습니다: ' + (error as Error).message);
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('카카오 콜백 처리 실패:', error);
                window.location.href = '/';
            }
        };

        handleKakaoCallback();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-gray-300">카카오 로그인 처리 중...</p>
            </div>
        </div>
    );
};

export default KakaoCallback;

