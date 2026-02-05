import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserService } from '../lib/services';

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
                const emailForSupabase = `${kakaoId}@kakao.temp`;
                const tempPassword = `${kakaoId}_password_secure_123!`;

                console.log('Supabase 계정 생성:', emailForSupabase);

                try {
                    // 기존 로그인 상태가 있으면 먼저 로그아웃
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        console.log('기존 로그인 상태 로그아웃');
                        await supabase.auth.signOut();
                        // 로그아웃 후 잠시 대기
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    // 먼저 로그인 시도
                    let signInResult = await supabase.auth.signInWithPassword({
                        email: emailForSupabase,
                        password: tempPassword,
                    });

                    if (signInResult.error) {
                        // 로그인 실패 시 회원가입 시도
                        if (signInResult.error.message.includes('Invalid login credentials')) {
                            console.log('새 계정 생성 시도');
                            const signUpResult = await supabase.auth.signUp({
                                email: emailForSupabase,
                                password: tempPassword,
                                options: {
                                    data: {
                                        display_name: '카카오 사용자',
                                        nickname: '카카오 사용자',
                                    }
                                }
                            });

                            if (signUpResult.error) {
                                throw signUpResult.error;
                            }

                            if (signUpResult.data.user) {
                                console.log('새 계정 생성 성공');
                                // 프로필 생성
                                await UserService.createOrUpdateProfile(
                                    signUpResult.data.user.id,
                                    emailForSupabase,
                                    '카카오 사용자',
                                    undefined,
                                    '카카오 사용자'
                                );
                                console.log('프로필 저장 완료');

                                // 회원가입 후 바로 로그인
                                signInResult = await supabase.auth.signInWithPassword({
                                    email: emailForSupabase,
                                    password: tempPassword,
                                });
                            }
                        } else {
                            throw signInResult.error;
                        }
                    } else {
                        console.log('기존 계정 로그인 성공');
                    }

                    if (!signInResult.data.session) {
                        throw new Error('로그인 세션을 생성할 수 없습니다.');
                    }

                    // 로그인 성공 후 홈으로 이동
                    console.log('로그인 완료, 홈으로 이동');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Supabase 로그인 실패:', error);
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

