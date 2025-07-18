import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'auto';

export interface ColorScheme {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  // Background colors
  background: string;
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Border colors
  border: string;
  borderHover: string;
  borderFocus: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Graph colors
  graphNode: string;
  graphLink: string;
  graphSelected: string;
  graphHover: string;
  
  // Code colors
  codeBackground: string;
  codeText: string;
  codeComment: string;
  codeKeyword: string;
  codeString: string;
  codeNumber: string;
  
  // Shadow colors
  shadow: string;
  shadowHover: string;
  
  // Overlay colors
  overlay: string;
  backdrop: string;
}

const lightColors: ColorScheme = {
  // Primary colors
  primary: '#007bff',
  primaryHover: '#0056b3',
  primaryActive: '#004085',
  
  // Background colors
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceHover: '#e9ecef',
  surfaceActive: '#dee2e6',
  
  // Text colors
  text: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  
  // Border colors
  border: '#dee2e6',
  borderHover: '#adb5bd',
  borderFocus: '#007bff',
  
  // Status colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
  
  // Graph colors
  graphNode: '#6c757d',
  graphLink: '#dee2e6',
  graphSelected: '#007bff',
  graphHover: '#ffc107',
  
  // Code colors
  codeBackground: '#f8f9fa',
  codeText: '#212529',
  codeComment: '#6c757d',
  codeKeyword: '#d63384',
  codeString: '#198754',
  codeNumber: '#fd7e14',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowHover: 'rgba(0, 0, 0, 0.15)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)'
};

const darkColors: ColorScheme = {
  // Primary colors
  primary: '#0d6efd',
  primaryHover: '#0b5ed7',
  primaryActive: '#0a58ca',
  
  // Background colors
  background: '#1a1a1a',
  surface: '#2d2d2d',
  surfaceHover: '#3d3d3d',
  surfaceActive: '#4d4d4d',
  
  // Text colors
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  textMuted: '#808080',
  
  // Border colors
  border: '#404040',
  borderHover: '#606060',
  borderFocus: '#0d6efd',
  
  // Status colors
  success: '#198754',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#0dcaf0',
  
  // Graph colors
  graphNode: '#b0b0b0',
  graphLink: '#404040',
  graphSelected: '#0d6efd',
  graphHover: '#ffc107',
  
  // Code colors
  codeBackground: '#2d2d2d',
  codeText: '#ffffff',
  codeComment: '#808080',
  codeKeyword: '#ff6b6b',
  codeString: '#51cf66',
  codeNumber: '#ffd43b',
  
  // Shadow colors
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowHover: 'rgba(0, 0, 0, 0.4)',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(0, 0, 0, 0.5)'
};

interface ThemeStore {
  theme: Theme;
  colors: ColorScheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Get system theme preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Get effective theme (resolves 'auto' to system preference)
const getEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'auto') {
    return getSystemTheme();
  }
  return theme;
};

// Get colors for a specific theme
const getColors = (theme: 'light' | 'dark'): ColorScheme => {
  return theme === 'dark' ? darkColors : lightColors;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'auto',
      colors: getColors(getEffectiveTheme('auto')),
      isDark: getEffectiveTheme('auto') === 'dark',

      setTheme: (theme: Theme) => {
        const effectiveTheme = getEffectiveTheme(theme);
        set({
          theme,
          colors: getColors(effectiveTheme),
          isDark: effectiveTheme === 'dark'
        });
        
        // Apply theme to document
        applyThemeToDocument(effectiveTheme);
      },

      toggleTheme: () => {
        const current = get();
        const newTheme = current.isDark ? 'light' : 'dark';
        current.setTheme(newTheme);
      }
    }),
    {
      name: 'zettelview-theme',
      partialize: (state) => ({ theme: state.theme })
    }
  )
);

// Apply theme to document (CSS custom properties)
const applyThemeToDocument = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  
  const colors = getColors(theme);
  const root = document.documentElement;
  
  // Set CSS custom properties
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Set theme class
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(`theme-${theme}`);
  
  // Update meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', colors.background);
  }
};

// Initialize theme on mount
if (typeof window !== 'undefined') {
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'auto') {
      const effectiveTheme = e.matches ? 'dark' : 'light';
      store.setTheme('auto'); // This will resolve to the new system theme
    }
  });
  
  // Apply initial theme
  const store = useThemeStore.getState();
  applyThemeToDocument(getEffectiveTheme(store.theme));
} 