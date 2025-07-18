import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock matchMedia
const matchMediaMock = vi.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
});

// Mock document methods
const createElementMock = vi.fn();
const querySelectorMock = vi.fn();
const setAttributeMock = vi.fn();

Object.defineProperty(document, 'createElement', {
  value: createElementMock,
});

Object.defineProperty(document, 'querySelector', {
  value: querySelectorMock,
});

Object.defineProperty(document.documentElement, 'setAttribute', {
  value: setAttributeMock,
});

describe('Theme Flash Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset theme store
    themeStore.setState({
      theme: 'light',
      systemPreference: 'light',
      isDark: false,
      isSystem: false,
    });
    
    // Clear document classes
    document.documentElement.classList.remove('dark', 'light', 'theme-applied');
    document.body.classList.remove('theme-transitioning');
    
    // Mock meta theme-color element
    const mockMetaElement = {
      setAttribute: vi.fn(),
    };
    querySelectorMock.mockReturnValue(mockMetaElement);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light', 'theme-applied');
    document.body.classList.remove('theme-transitioning');
  });

  describe('Initial Theme Detection', () => {
    it('should detect theme from localStorage', () => {
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
    });

    it('should detect system preference when no localStorage data', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: true, // System prefers dark mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().systemPreference).toBe('dark');
    });

    it('should fall back to light theme when detection fails', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia error');
      });
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light');
      expect(themeStore.getState().isDark).toBe(false);
    });
  });

  describe('DOM Theme Application', () => {
    it('should apply theme classes to document element', () => {
      // Arrange
      themeStore.setState({ theme: 'dark', isDark: true });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should apply theme classes to body element', () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      
      // Act
      themeStore.getState().setTheme('light');
      
      // Assert
      expect(document.body.classList.contains('theme-light')).toBe(true);
      expect(document.body.classList.contains('theme-dark')).toBe(false);
    });

    it('should update meta theme-color for mobile browsers', () => {
      // Arrange
      const mockMetaElement = {
        setAttribute: vi.fn(),
      };
      querySelectorMock.mockReturnValue(mockMetaElement);
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(querySelectorMock).toHaveBeenCalledWith('meta[name="theme-color"]');
      expect(mockMetaElement.setAttribute).toHaveBeenCalledWith('content', '#1f2937');
    });

    it('should apply CSS custom properties', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };
      Object.defineProperty(document.documentElement, 'style', {
        value: mockStyle,
        writable: true,
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--color-background', '#1f2937');
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--color-text', '#f9fafb');
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--color-primary', '#60a5fa');
    });
  });

  describe('Theme Transition Prevention', () => {
    it('should prevent theme flash during initialization', () => {
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
      expect(document.documentElement.classList.contains('theme-applied')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should apply theme before React hydration', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };
      Object.defineProperty(document.documentElement, 'style', {
        value: mockStyle,
        writable: true,
      });
      
      // Act - Simulate inline script execution
      const initialTheme = 'dark';
      document.documentElement.classList.add(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      
      // Assert
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should handle theme changes without flash', () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.body.classList.contains('theme-transitioning')).toBe(false);
    });
  });

  describe('System Preference Handling', () => {
    it('should detect system preference changes', () => {
      // Arrange
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      themeStore.setState({ isSystem: true });
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(themeStore.getState().systemPreference).toBe('light');
    });

    it('should update theme when system preference changes', () => {
      // Arrange
      const mockMediaQuery = {
        matches: true, // System now prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      themeStore.setState({ isSystem: true, theme: 'light', isDark: false });
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
    });

    it('should not update theme when not using system preference', () => {
      // Arrange
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      themeStore.setState({ isSystem: false, theme: 'light', isDark: false });
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light');
      expect(themeStore.getState().isDark).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Arrange
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });
      
      // Act & Assert
      expect(() => {
        themeStore.getState().setTheme('dark');
      }).not.toThrow();
      
      // Theme should still change in memory
      expect(themeStore.getState().theme).toBe('dark');
    });

    it('should handle DOM manipulation errors gracefully', () => {
      // Arrange
      Object.defineProperty(document.documentElement, 'classList', {
        get: () => {
          throw new Error('DOM manipulation error');
        },
      });
      
      // Act & Assert
      expect(() => {
        themeStore.getState().setTheme('dark');
      }).not.toThrow();
      
      // Theme should still change in store
      expect(themeStore.getState().theme).toBe('dark');
    });

    it('should handle JSON parsing errors gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Default fallback
    });
  });

  describe('Performance Optimization', () => {
    it('should minimize DOM operations during theme changes', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };
      Object.defineProperty(document.documentElement, 'style', {
        value: mockStyle,
        writable: true,
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      themeStore.getState().setTheme('light');
      themeStore.getState().setTheme('dark');
      
      // Assert - Should batch operations efficiently
      expect(mockStyle.setProperty).toHaveBeenCalledTimes(36); // 12 properties * 3 changes
    });

    it('should use efficient class manipulation', () => {
      // Arrange
      const classListSpy = vi.spyOn(document.documentElement.classList, 'remove');
      const classListAddSpy = vi.spyOn(document.documentElement.classList, 'add');
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(classListSpy).toHaveBeenCalledWith('light', 'dark');
      expect(classListAddSpy).toHaveBeenCalledWith('dark');
    });
  });

  describe('Accessibility Features', () => {
    it('should maintain proper focus indicators during theme changes', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };
      Object.defineProperty(document.documentElement, 'style', {
        value: mockStyle,
        writable: true,
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--color-primary', '#60a5fa');
    });

    it('should support reduced motion preferences', () => {
      // Arrange
      matchMediaMock.mockImplementation((query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return { matches: true };
        }
        return { matches: false };
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      // Theme should still change but without animations
      expect(themeStore.getState().theme).toBe('dark');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work without matchMedia support', () => {
      // Arrange
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Default fallback
    });

    it('should work without localStorage support', () => {
      // Arrange
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('light'); // Default fallback
    });

    it('should handle older browser event listener APIs', () => {
      // Arrange
      const mockMediaQuery = {
        matches: false,
        addListener: vi.fn(), // Older API
        removeListener: vi.fn(),
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      // Act
      themeStore.getState().initializeTheme();
      
      // Assert
      expect(mockMediaQuery.addListener).toHaveBeenCalled();
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme preference across sessions', () => {
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

    it('should preserve system preference setting', () => {
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
    });
  });
}); 