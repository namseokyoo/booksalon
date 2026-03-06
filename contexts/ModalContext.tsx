import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalState {
  loginOpen: boolean;
  signupOpen: boolean;
  deleteAccountOpen: boolean;
  searchOpen: boolean;
}

interface ModalContextType extends ModalState {
  openLogin: () => void;
  closeLogin: () => void;
  openSignup: () => void;
  closeSignup: () => void;
  openDeleteAccount: () => void;
  closeDeleteAccount: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>({
    loginOpen: false,
    signupOpen: false,
    deleteAccountOpen: false,
    searchOpen: false,
  });

  const openLogin = useCallback(() => setState(s => ({ ...s, loginOpen: true })), []);
  const closeLogin = useCallback(() => setState(s => ({ ...s, loginOpen: false })), []);
  const openSignup = useCallback(() => setState(s => ({ ...s, signupOpen: true })), []);
  const closeSignup = useCallback(() => setState(s => ({ ...s, signupOpen: false })), []);
  const openDeleteAccount = useCallback(() => setState(s => ({ ...s, deleteAccountOpen: true })), []);
  const closeDeleteAccount = useCallback(() => setState(s => ({ ...s, deleteAccountOpen: false })), []);
  const openSearch = useCallback(() => setState(s => ({ ...s, searchOpen: true })), []);
  const closeSearch = useCallback(() => setState(s => ({ ...s, searchOpen: false })), []);

  return (
    <ModalContext.Provider value={{
      ...state,
      openLogin, closeLogin, openSignup, closeSignup,
      openDeleteAccount, closeDeleteAccount, openSearch, closeSearch,
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModals() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModals must be used within ModalProvider');
  return ctx;
}
