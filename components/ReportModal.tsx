import React, { useState } from 'react';
import { AdminService } from '../lib/services';
import { useAuth } from '../contexts/AuthContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'user' | 'post' | 'comment' | 'forum';
    targetId: string;
    targetTitle?: string;
}

const ReportModal: React.FC<ReportModalProps> = ({
    isOpen,
    onClose,
    type,
    targetId,
    targetTitle
}) => {
    const [reportType, setReportType] = useState<'spam' | 'harassment' | 'inappropriate_content' | 'fake_news' | 'other'>('spam');
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { currentUser, userProfile } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !reason.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            const metadata: {
                reportedUserId?: string;
                reportedPostId?: string;
                reportedCommentId?: string;
                reportedForumId?: string;
            } = {};

            if (type === 'user') {
                metadata.reportedUserId = targetId;
            } else if (type === 'post') {
                metadata.reportedPostId = targetId;
            } else if (type === 'comment') {
                metadata.reportedCommentId = targetId;
            } else if (type === 'forum') {
                metadata.reportedForumId = targetId;
            }

            await AdminService.createReport(
                userProfile?.id || '',
                reportType,
                reason.trim(),
                description.trim(),
                metadata
            );

            alert('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
            onClose();

            // 폼 초기화
            setReason('');
            setDescription('');
            setReportType('spam');
        } catch (error) {
            console.error('신고 접수 실패:', error);
            alert('신고 접수에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const getTypeLabel = () => {
        switch (type) {
            case 'user': return '사용자';
            case 'post': return '게시물';
            case 'comment': return '댓글';
            case 'forum': return '포럼';
            default: return '항목';
        }
    };

    const getTypeReasonOptions = () => {
        switch (type) {
            case 'user':
                return [
                    { value: 'spam', label: '스팸 계정' },
                    { value: 'harassment', label: '괴롭힘/욕설' },
                    { value: 'inappropriate_content', label: '부적절한 프로필' },
                    { value: 'other', label: '기타' }
                ];
            case 'post':
            case 'comment':
                return [
                    { value: 'spam', label: '스팸 게시물' },
                    { value: 'harassment', label: '괴롭힘/욕설' },
                    { value: 'inappropriate_content', label: '부적절한 내용' },
                    { value: 'fake_news', label: '가짜 정보' },
                    { value: 'other', label: '기타' }
                ];
            case 'forum':
                return [
                    { value: 'inappropriate_content', label: '부적절한 포럼' },
                    { value: 'spam', label: '스팸 포럼' },
                    { value: 'other', label: '기타' }
                ];
            default:
                return [
                    { value: 'spam', label: '스팸' },
                    { value: 'harassment', label: '괴롭힘' },
                    { value: 'inappropriate_content', label: '부적절한 내용' },
                    { value: 'other', label: '기타' }
                ];
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">🚨 신고하기</h2>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4">
                        <p className="text-surface-foreground text-sm">
                            <span className="font-semibold">{getTypeLabel()}</span>을(를) 신고합니다.
                            {targetTitle && (
                                <span className="block mt-1 text-muted-foreground">
                                    "{targetTitle}"
                                </span>
                            )}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-surface-foreground mb-2">
                                신고 사유
                            </label>
                            <select
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value as Report['type'])}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground focus:ring-ring focus:border-primary focus:outline-none"
                            >
                                {getTypeReasonOptions().map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-foreground mb-2">
                                신고 제목
                            </label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="신고 사유를 간단히 입력하세요"
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:ring-ring focus:border-primary focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-surface-foreground mb-2">
                                상세 설명
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="신고 내용을 자세히 설명해주세요"
                                rows={4}
                                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground focus:ring-ring focus:border-primary focus:outline-none resize-none"
                                required
                            />
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-accent text-foreground rounded-lg hover:bg-muted transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !reason.trim() || !description.trim()}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isSubmitting ? '신고 중...' : '신고하기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;
