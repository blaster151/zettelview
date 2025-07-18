import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeState {
  theme: 'light' | 'dark';
  systemPreference: 'light' | 'dark';
  isDark: boolean;
  isSystem: boolean;
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    accent: string;
    surface: string;
    surfaceHover: string;
    inputBackground: string;
    inputBorder: string;
    shadow: string;
    overlay: string;
  };
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSystemPreference: (isSystem: boolean) => void;
  detectSystemPreference: () => void;
  initializeTheme: () => void;
}

// Get initial theme from HTML (set by inline script)
const getInitialTheme = (): 'light' | 'dark' => {
  // Check if theme was set by inline script
  if (typeof window !== 'undefined' && window.__INITIAL_THEME__) {
    return window.__INITIAL_THEME__;
  }
  
  // Fallback to localStorage or system preference
  try {
    const saved = localStorage.getItem('zettelview-theme');
    if (saved) {
      const themeData = JSON.parse(saved);
      if (themeData && themeData.theme) {
        return themeData.theme;
      }
    }
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error);
  }
  
  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  
  return 'light';
};

// Check if system preference is being used
const getInitialSystemPreference = (): boolean => {
  if (typeof window !== 'undefined' && window.__THEME_UTILS__) {
    return window.__THEME_UTILS__.isSystemTheme();
  }
  
  try {
    const saved = localStorage.getItem('zettelview-theme');
    if (saved) {
      const themeData = JSON.parse(saved);
      return themeData && themeData.isSystem === true;
    }
  } catch (error) {
    console.warn('Failed to check system preference:', error);
  }
  
  return true; // Default to system preference
};

// Apply theme to DOM immediately
const applyThemeToDOM = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Remove existing theme classes
  root.classList.remove('light', 'dark');
  
  // Add new theme class
  root.classList.add(theme);
  
  // Set theme attribute
  root.setAttribute('data-theme', theme);
  
  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#1f2937' : '#ffffff');
  }
  
  // Apply CSS custom properties
  const cssProperties = theme === 'dark' ? {
    '--color-background': '#1f2937',
    '--color-text': '#f9fafb',
    '--color-primary': '#60a5fa',
    '--color-secondary': '#9ca3af',
    '--color-border': '#374151',
    '--color-accent': '#374151',
    '--color-surface': '#111827',
    '--color-surface-hover': '#1f2937',
    '--color-input-background': '#374151',
    '--color-input-border': '#4b5563',
    '--color-shadow': 'rgba(0, 0, 0, 0.3)',
    '--color-overlay': 'rgba(0, 0, 0, 0.5)'
  } : {
    '--color-background': '#ffffff',
    '--color-text': '#000000',
    '--color-primary': '#3b82f6',
    '--color-secondary': '#6b7280',
    '--color-border': '#e5e7eb',
    '--color-accent': '#f3f4f6',
    '--color-surface': '#ffffff',
    '--color-surface-hover': '#f9fafb',
    '--color-input-background': '#ffffff',
    '--color-input-border': '#d1d5db',
    '--color-shadow': 'rgba(0, 0, 0, 0.1)',
    '--color-overlay': 'rgba(0, 0, 0, 0.3)'
  };
  
  Object.entries(cssProperties).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

// Get color values based on theme
const getThemeColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? {
    background: '#1f2937',
    text: '#f9fafb',
    primary: '#60a5fa',
    secondary: '#9ca3af',
    border: '#374151',
    accent: '#374151',
    surface: '#111827',
    surfaceHover: '#1f2937',
    inputBackground: '#374151',
    inputBorder: '#4b5563',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.5)'
  } : {
    background: '#ffffff',
    text: '#000000',
    primary: '#3b82f6',
    secondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#f3f4f6',
    surface: '#ffffff',
    surfaceHover: '#f9fafb',
    inputBackground: '#ffffff',
    inputBorder: '#d1d5db',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.3)'
  };
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      systemPreference: 'light',
      isDark: getInitialTheme() === 'dark',
      isSystem: getInitialSystemPreference(),
      colors: getThemeColors(getInitialTheme()),
      
      setTheme: (theme: 'light' | 'dark') => {
        // Apply theme to DOM immediately
        applyThemeToDOM(theme);
        
        set({
          theme,
          isDark: theme === 'dark',
          colors: getThemeColors(theme),
          isSystem: false
        });
        
        // Save to localStorage
        try {
          localStorage.setItem('zettelview-theme', JSON.stringify({
            theme,
            isSystem: false,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.warn('Failed to save theme to localStorage:', error);
        }
      },
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
      
      setSystemPreference: (isSystem: boolean) => {
        set({ isSystem });
        
        if (isSystem) {
          // Use system preference
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          get().setTheme(systemTheme);
          
          // Save system preference
          try {
            localStorage.setItem('zettelview-theme', JSON.stringify({
              theme: systemTheme,
              isSystem: true,
              timestamp: Date.now()
            }));
          } catch (error) {
            console.warn('Failed to save system preference:', error);
          }
        }
      },
      
      detectSystemPreference: () => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        
        set({ systemPreference: systemTheme });
        
        // Update theme if using system preference
        if (get().isSystem) {
          get().setTheme(systemTheme);
        }
      },
      
      initializeTheme: () => {
        // Theme is already applied by inline script, just ensure consistency
        const currentTheme = get().theme;
        applyThemeToDOM(currentTheme);
        
        // Set up system preference listener
        if (typeof window !== 'undefined' && window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          
          const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            const newSystemTheme = e.matches ? 'dark' : 'light';
            set({ systemPreference: newSystemTheme });
            
            // Update theme if using system preference
            if (get().isSystem) {
              get().setTheme(newSystemTheme);
            }
          };
          
          // Add listener for system theme changes
          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
          } else {
            // Fallback for older browsers
            mediaQuery.addListener(handleSystemThemeChange);
          }
        }
        
        // Hide loading indicator if still visible
        setTimeout(() => {
          const loadingElement = document.getElementById('theme-loading');
          if (loadingElement && !loadingElement.classList.contains('hidden')) {
            loadingElement.classList.add('hidden');
            setTimeout(() => {
              if (loadingElement.parentNode) {
                loadingElement.parentNode.removeChild(loadingElement);
              }
            }, 300);
          }
        }, 0);
      }
    }),
    {
      name: 'zettelview-theme',
      partialize: (state) => ({
        theme: state.theme,
        isSystem: state.isSystem
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure theme is applied after rehydration
        if (state) {
          applyThemeToDOM(state.theme);
        }
      }
    }
  )
);

// Initialize theme immediately when store is created
if (typeof window !== 'undefined') {
  // Apply initial theme to DOM
  const initialTheme = getInitialTheme();
  applyThemeToDOM(initialTheme);
  
  // Set up system preference detection
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemTheme = mediaQuery.matches ? 'dark' : 'light';
    
    // Update store with system preference
    useThemeStore.setState({ systemPreference: systemTheme });
  }
}

// Type declarations for global theme utilities
declare global {
  interface Window {
    __INITIAL_THEME__?: 'light' | 'dark';
    __THEME_UTILS__?: {
      getThemePreference: () => 'light' | 'dark';
      applyTheme: (theme: 'light' | 'dark') => void;
      isSystemTheme: () => boolean;
    };
  }
} 