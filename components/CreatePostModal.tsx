import React, { useState } from 'react';
import TagInput from './TagInput';
import ImageUploader, { type ImagePreview } from './ImageUploader';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (title: string, content: string, tags?: string[], images?: ImagePreview[]) => void;
  isSubmitting?: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSubmit, isSubmitting = false }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [images, setImages] = useState<ImagePreview[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim() && !isSubmitting) {
      onSubmit(
        title.trim(),
        content.trim(),
        tags.length > 0 ? tags : undefined,
        images.length > 0 ? images : undefined
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-gray-900 mb-3 sm:mb-4">새로운 글 작성</h3>
          <div>
            <label htmlFor="post-title" className="sr-only">
              Title
            </label>
            <input
              id="post-title"
              name="title"
              type="text"
              required
              disabled={isSubmitting}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="mt-3 sm:mt-4">
            <label htmlFor="post-content" className="sr-only">
              Content
            </label>
            <textarea
              id="post-content"
              name="content"
              rows={6}
              required
              disabled={isSubmitting}
              className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:z-10 text-sm resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="내용을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* 이미지 업로드 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <ImageUploader
              images={images}
              onChange={setImages}
              maxImages={3}
              disabled={isSubmitting}
            />
          </div>

          {/* 태그 입력 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <TagInput
              tags={tags}
              onChange={setTags}
              maxTags={3}
              type="post"
              placeholder="게시물 태그 추가 (선택)"
            />
          </div>
        </div>
        <div className="bg-gray-50 px-3 sm:px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-3 sm:px-4 py-2 bg-cyan-600 text-sm sm:text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto transition-colors duration-200 disabled:bg-cyan-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                업로드 중...
              </>
            ) : (
              '작성'
            )}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-3 sm:px-4 py-2 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostModal;
