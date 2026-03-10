import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import BookLoader from '../components/BookLoader';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { useModals } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';

const LoginModal = React.lazy(() => import('../components/LoginModal'));
const SignUpModal = React.lazy(() => import('../components/SignUpModal'));
const DeleteAccountModal = React.lazy(() => import('../components/DeleteAccountModal'));
const SearchModal = React.lazy(() => import('../components/SearchModal'));

export default function RootLayout() {
  const { loginOpen, signupOpen, deleteAccountOpen, searchOpen, closeLogin, closeSignup, closeDeleteAccount, closeSearch } = useModals();
  const { toast, clearToast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main aria-label="메인 콘텐츠">
        <Suspense fallback={<BookLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={clearToast}
        />
      )}

      <Suspense fallback={null}>
        {loginOpen && <LoginModal onClose={closeLogin} />}
        {signupOpen && <SignUpModal onClose={closeSignup} />}
        {deleteAccountOpen && <DeleteAccountModal onClose={closeDeleteAccount} />}
        {searchOpen && <SearchModal onClose={closeSearch} />}
      </Suspense>
    </div>
  );
}
