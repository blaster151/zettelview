import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
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
  borderLight: string;
  
  // Accent colors
  primary: string;
  primaryHover: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  
  // Code block colors
  codeBackground: string;
  codeBorder: string;
  
  // Graph colors
  graphNode: string;
  graphNodeHover: string;
  graphNodeSelected: string;
  graphEdge: string;
  graphBackground: string;
}

export const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceHover: '#e9ecef',
  surfaceActive: '#dee2e6',
  
  text: '#212529',
  textSecondary: '#6c757d',
  textMuted: '#adb5bd',
  
  border: '#dee2e6',
  borderLight: '#e9ecef',
  
  primary: '#007bff',
  primaryHover: '#0056b3',
  secondary: '#6c757d',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  
  codeBackground: '#f8f9fa',
  codeBorder: '#e9ecef',
  
  graphNode: '#007bff',
  graphNodeHover: '#0056b3',
  graphNodeSelected: '#28a745',
  graphEdge: '#6c757d',
  graphBackground: '#ffffff',
};

export const darkTheme: ThemeColors = {
  background: '#1a1a1a',
  surface: '#2d2d2d',
  surfaceHover: '#3d3d3d',
  surfaceActive: '#4d4d4d',
  
  text: '#e9ecef',
  textSecondary: '#adb5bd',
  textMuted: '#6c757d',
  
  border: '#495057',
  borderLight: '#343a40',
  
  primary: '#0d6efd',
  primaryHover: '#0b5ed7',
  secondary: '#6c757d',
  success: '#198754',
  warning: '#ffc107',
  error: '#dc3545',
  
  codeBackground: '#2d2d2d',
  codeBorder: '#495057',
  
  graphNode: '#0d6efd',
  graphNodeHover: '#0b5ed7',
  graphNodeSelected: '#198754',
  graphEdge: '#6c757d',
  graphBackground: '#1a1a1a',
};

interface ThemeStore {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      colors: lightTheme,
      
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({
          theme: newTheme,
          colors: newTheme === 'light' ? lightTheme : darkTheme,
        });
      },
      
      setTheme: (theme: Theme) => {
        set({
          theme,
          colors: theme === 'light' ? lightTheme : darkTheme,
        });
      },
    }),
    {
      name: 'zettelview-theme',
    }
  )
); 