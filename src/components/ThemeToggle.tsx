import React from 'react';
import { useThemeStore } from '../store/themeStore';

const ThemeToggle: React.FC = () => {
  const theme = useThemeStore(state => state.theme);
  const toggleTheme = useThemeStore(state => state.toggleTheme);
  const colors = useThemeStore(state => state.colors);

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        color: colors.text,
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
      {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  );
};

export default ThemeToggle; 