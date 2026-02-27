import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

const MonitorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const themeLabels = {
  light: '라이트 모드',
  dark: '다크 모드',
  system: '시스템 설정',
} as const;

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;
  const label = themeLabels[theme];

  return (
    <button
      onClick={toggleTheme}
      className="text-surface-foreground hover:bg-muted rounded-md p-2 transition-colors"
      aria-label={`현재 ${label}. 클릭하여 테마 변경`}
      title={label}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
};

export default ThemeToggle;
