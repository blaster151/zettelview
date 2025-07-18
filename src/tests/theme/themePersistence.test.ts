import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeStore } from '../../stores/themeStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia for system preference detection
const matchMediaMock = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

describe('Theme Persistence', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset theme store to initial state
    themeStore.setState({
      theme: 'light',
      systemPreference: 'light',
      isDark: false,
      isSystem: false,
    });
  });

  afterEach(() => {
    // Clean up any side effects
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('localStorage Persistence', () => {
    it('should save theme preference to localStorage when theme changes', () => {
      // Arrange
      const expectedTheme = 'dark';
      
      // Act
      themeStore.getState().setTheme(expectedTheme);
      
      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zettelview-theme',
        JSON.stringify({
          theme: expectedTheme,
          isSystem: false,
          timestamp: expect.any(Number)
        })
      );
    });

    it('should load theme preference from localStorage on initialization', () => {
      // Arrange
      const savedTheme = {
        theme: 'dark',
        isSystem: false,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTheme));
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('zettelview-theme');
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Default fallback
      expect(themeStore.getState().isDark).toBe(false);
    });

    it('should handle missing localStorage data gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Default fallback
      expect(themeStore.getState().isDark).toBe(false);
    });

    it('should persist system preference setting', () => {
      // Arrange
      const savedSettings = {
        theme: 'light',
        isSystem: true,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().isSystem).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zettelview-theme',
        JSON.stringify(expect.objectContaining({
          isSystem: true
        }))
      );
    });

    it('should update localStorage when switching to system preference', () => {
      // Arrange
      themeStore.setState({ theme: 'light', isSystem: false });
      
      // Act
      themeStore.getState().setSystemPreference(true);
      
      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zettelview-theme',
        JSON.stringify(expect.objectContaining({
          isSystem: true
        }))
      );
    });

    it('should handle localStorage quota exceeded error', () => {
      // Arrange
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      // Act & Assert
      expect(() => {
        themeStore.getState().setTheme('dark');
      }).not.toThrow();
      
      // Theme should still change in memory even if localStorage fails
      expect(themeStore.getState().theme).toBe('dark');
    });
  });

  describe('System Preference Detection', () => {
    it('should detect system dark mode preference', () => {
      // Arrange
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(themeStore.getState().systemPreference).toBe('dark');
    });

    it('should detect system light mode preference', () => {
      // Arrange
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(themeStore.getState().systemPreference).toBe('light');
    });

    it('should update theme when system preference changes', () => {
      // Arrange
      themeStore.setState({ isSystem: true, systemPreference: 'light' });
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(themeStore.getState().systemPreference).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
    });

    it('should handle system preference detection failure gracefully', () => {
      // Arrange
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia not supported');
      });
      
      // Act & Assert
      expect(() => {
        themeStore.getState().detectSystemPreference();
      }).not.toThrow();
      
      // Should fall back to light mode
      expect(themeStore.getState().systemPreference).toBe('light');
    });
  });

  describe('Theme Initialization', () => {
    it('should initialize with saved theme preference', () => {
      // Arrange
      const savedTheme = {
        theme: 'dark',
        isSystem: false,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTheme));
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
      expect(themeStore.getState().isSystem).toBe(false);
    });

    it('should initialize with system preference when isSystem is true', () => {
      // Arrange
      const savedSettings = {
        theme: 'light',
        isSystem: true,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
      matchMediaMock.mockReturnValue({
        matches: true, // System prefers dark mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().isSystem).toBe(true);
      expect(themeStore.getState().systemPreference).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
    });

    it('should fall back to light mode when no preference is saved', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light');
      expect(themeStore.getState().isDark).toBe(false);
      expect(themeStore.getState().isSystem).toBe(false);
    });

    it('should handle expired theme preferences', () => {
      // Arrange
      const expiredTheme = {
        theme: 'dark',
        isSystem: false,
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredTheme));
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Should reset to default
    });

    it('should apply theme to document element on initialization', () => {
      // Arrange
      const savedTheme = {
        theme: 'dark',
        isSystem: false,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTheme));
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });
  });

  describe('Theme Switching', () => {
    it('should switch between light and dark themes', () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      
      // Act - Switch to dark
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      
      // Act - Switch back to light
      themeStore.getState().setTheme('light');
      
      // Assert
      expect(themeStore.getState().theme).toBe('light');
      expect(themeStore.getState().isDark).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('should toggle theme correctly', () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      
      // Act
      themeStore.getState().toggleTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
      
      // Act - Toggle again
      themeStore.getState().toggleTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light');
      expect(themeStore.getState().isDark).toBe(false);
    });

    it('should handle invalid theme values gracefully', () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      
      // Act
      themeStore.getState().setTheme('invalid-theme' as any);
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Should remain unchanged
      expect(themeStore.getState().isDark).toBe(false);
    });
  });

  describe('Cross-Session Persistence', () => {
    it('should maintain theme preference across browser sessions', () => {
      // Arrange
      const savedTheme = {
        theme: 'dark',
        isSystem: false,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTheme));
      
      // Act - Simulate page reload
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('zettelview-theme');
    });

    it('should handle multiple theme changes within session', () => {
      // Arrange
      const changes: string[] = [];
      localStorageMock.setItem.mockImplementation((key, value) => {
        changes.push(JSON.parse(value).theme);
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      themeStore.getState().setTheme('light');
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(changes).toEqual(['dark', 'light', 'dark']);
      expect(themeStore.getState().theme).toBe('dark');
    });

    it('should preserve system preference setting across sessions', () => {
      // Arrange
      const savedSettings = {
        theme: 'light',
        isSystem: true,
        timestamp: Date.now()
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
      matchMediaMock.mockReturnValue({
        matches: true, // System prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().isSystem).toBe(true);
      expect(themeStore.getState().systemPreference).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
    });
  });
}); 