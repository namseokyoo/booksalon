
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DeleteAccountModalProps {
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ onClose }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { deleteAccount } = useAuth();

  const handleDelete = async () => {
    try {
      setError('');
      setLoading(true);
      await deleteAccount();
      onClose();
    } catch (err) {
      setError('계정 삭제에 실패했습니다. 다시 로그인한 후 시도해주세요.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-white mb-2 text-center">정말 탈퇴하시겠습니까?</h3>
          <p className="text-center text-sm text-gray-400 mb-4">이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.</p>
          {error && <p className="bg-red-900/50 text-red-300 text-sm p-3 rounded-md my-4">{error}</p>}
        </div>
        <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-500"
          >
            {loading ? '삭제 중...' : '네, 탈퇴합니다.'}
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
