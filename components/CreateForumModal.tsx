
import React, { useState } from 'react';
import type { Book } from '../types';
import BookInfo from './BookInfo';
import TagInput from './TagInput';

interface CreateForumModalProps {
  book: Book;
  onClose: () => void;
  onCreate: (book: Book, tags?: string[]) => void;
}

const CreateForumModal: React.FC<CreateForumModalProps> = ({ book, onClose, onCreate }) => {
  const [tags, setTags] = useState<string[]>([]);

  const handleCreate = () => {
    onCreate(book, tags.length > 0 ? tags : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium leading-6 text-foreground text-center mb-2">살롱을 만드시겠습니까?</h3>
          <p className="text-center text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">이 책에 대한 살롱이 없습니다. 새로운 살롱을 만드세요.</p>
          <BookInfo book={book} />

          {/* 태그 입력 */}
          <div className="mt-4 pt-4 border-t border-border">
            <TagInput
              tags={tags}
              onChange={setTags}
              maxTags={5}
              type="forum"
              placeholder="살롱 태그 추가 (선택)"
            />
          </div>
        </div>
        <div className="bg-muted px-3 sm:px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-border">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-3 sm:px-4 py-2 bg-primary text-sm sm:text-base font-medium text-primary-foreground hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto transition-colors duration-200"
            onClick={handleCreate}
          >
            만들기
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-border shadow-sm px-3 sm:px-4 py-2 bg-surface text-sm sm:text-base font-medium text-surface-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:w-auto transition-colors duration-200"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateForumModal;
