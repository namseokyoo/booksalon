import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export class ProfileImageService {
    // 프로필 이미지 업로드
    static async uploadProfileImage(uid: string, file: File): Promise<string> {
        try {
            // 파일 타입 검증
            if (!file.type.startsWith('image/')) {
                throw new Error('이미지 파일만 업로드 가능합니다.');
            }

            // 파일 크기 검증 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
            }

            // 파일 확장자 추출
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (!fileExtension || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                throw new Error('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WebP만 지원)');
            }

            // Firebase Storage 경로 설정
            const fileName = `profile_${uid}_${Date.now()}.${fileExtension}`;
            const storageRef = ref(storage, `profile-images/${fileName}`);

            // 파일 업로드
            const snapshot = await uploadBytes(storageRef, file);

            // 다운로드 URL 가져오기
            const downloadURL = await getDownloadURL(snapshot.ref);

            return downloadURL;
        } catch (error) {
            console.error('프로필 이미지 업로드 실패:', error);
            throw error;
        }
    }

    // 프로필 이미지 삭제
    static async deleteProfileImage(imageUrl: string): Promise<void> {
        try {
            if (!imageUrl) return;

            // Firebase Storage에서 이미지 삭제
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            console.error('프로필 이미지 삭제 실패:', error);
            // 삭제 실패해도 계속 진행 (이미지가 없을 수도 있음)
        }
    }

    // 기본 프로필 이미지 URL 생성 (이니셜 기반)
    static generateDefaultProfileImageUrl(nickname: string): string {
        const safeName = (nickname || 'U').trim();
        const initial = safeName.charAt(0).toUpperCase() || 'U';

        // Tailwind 클래스가 아니라 실제 HEX 팔레트 사용 (WCAG 대비 양호 색상)
        const colorHexList = [
            'EF4444', // red-500
            '3B82F6', // blue-500
            '10B981', // green-500
            'F59E0B', // yellow-500
            '8B5CF6', // violet-500
            'EC4899', // pink-500
            '6366F1', // indigo-500
            '14B8A6'  // teal-500
        ];

        const code = initial.charCodeAt(0) || 65; // fallback 'A'
        const colorHex = colorHexList[code % colorHexList.length];

        // SVG 데이터 URL 생성
        const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="#${colorHex}" />
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${initial}</text>
      </svg>
    `;

        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    // 이미지 최적화 (클라이언트 사이드)
    static async optimizeImage(file: File, maxWidth: number = 400, maxHeight: number = 400, quality: number = 0.8): Promise<File> {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 원본 비율 유지하면서 크기 조정
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                // 이미지 그리기
                ctx?.drawImage(img, 0, 0, width, height);

                // Blob으로 변환
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const optimizedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(optimizedFile);
                        } else {
                            reject(new Error('이미지 최적화 실패'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = URL.createObjectURL(file);
        });
    }
}
