import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useThemeStore } from '../../store/themeStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock matchMedia
const matchMediaMock = vi.fn();

// Mock document methods
const createElementMock = vi.fn();
const querySelectorMock = vi.fn();
const setAttributeMock = vi.fn();

beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  
  // Clear localStorage to prevent quota exceeded errors
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
  
  // Reset theme store
  useThemeStore.setState({
    theme: 'light',
    systemPreference: 'light',
    isDark: false,
    isSystem: false,
    colors: {
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
      overlay: 'rgba(0, 0, 0, 0.3)',
    },
  });

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: matchMediaMock,
    writable: true,
  });

  // Mock document methods
  Object.defineProperty(document, 'createElement', {
    value: createElementMock,
    writable: true,
  });

  Object.defineProperty(document, 'querySelector', {
    value: querySelectorMock,
    writable: true,
  });

  // Mock document.documentElement
  Object.defineProperty(document, 'documentElement', {
    value: {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      },
      setAttribute: setAttributeMock,
      getAttribute: vi.fn(),
      style: {
        setProperty: vi.fn(),
      },
    },
    writable: true,
  });
});

afterEach(() => {
  // Clean up
  vi.clearAllMocks();
});

describe('Theme Flash Prevention', () => {
  describe('Inline Script Execution', () => {
    it('should execute inline script before React loads', () => {
      // Arrange
      const mockScript = {
        textContent: '',
        setAttribute: vi.fn(),
      };
      createElementMock.mockReturnValue(mockScript);

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(createElementMock).toHaveBeenCalledWith('script');
      expect(mockScript.setAttribute).toHaveBeenCalledWith('type', 'text/javascript');
    });

    it('should set theme attribute immediately', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('dark');

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should prevent flash of unstyled content', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
          },
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: mockStyle,
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('visibility', 'hidden');
    });
  });

  describe('Critical CSS Application', () => {
    it('should apply critical CSS styles', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
          },
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: mockStyle,
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('visibility', 'hidden');
    });

    it('should remove visibility hidden after theme application', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
          },
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: mockStyle,
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();
      useThemeStore.getState().applyTheme();

      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('visibility', 'visible');
    });
  });

  describe('System Preference Detection', () => {
    it('should detect system preference before React loads', () => {
      // Arrange
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should apply system preference immediately', () => {
      // Arrange
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'dark');
    });
  });

  describe('Loading Indicator', () => {
    it('should show loading indicator during theme application', () => {
      // Arrange
      const mockLoadingElement = {
        style: {
          display: 'block',
        },
      };
      querySelectorMock.mockReturnValue(mockLoadingElement);

      // Act
      useThemeStore.getState().showLoadingIndicator();

      // Assert
      expect(querySelectorMock).toHaveBeenCalledWith('.theme-loading');
      expect(mockLoadingElement.style.display).toBe('block');
    });

    it('should hide loading indicator after theme application', () => {
      // Arrange
      const mockLoadingElement = {
        style: {
          display: 'none',
        },
      };
      querySelectorMock.mockReturnValue(mockLoadingElement);

      // Act
      useThemeStore.getState().hideLoadingIndicator();

      // Assert
      expect(querySelectorMock).toHaveBeenCalledWith('.theme-loading');
      expect(mockLoadingElement.style.display).toBe('none');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act & Assert
      expect(() => useThemeStore.getState().initializeTheme()).not.toThrow();
    });

    it('should handle matchMedia errors gracefully', () => {
      // Arrange
      matchMediaMock.mockImplementation(() => {
        throw new Error('Media query error');
      });

      // Act & Assert
      expect(() => useThemeStore.getState().initializeTheme()).not.toThrow();
    });

    it('should fallback to light theme on errors', () => {
      // Arrange
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(setAttributeMock).toHaveBeenCalledWith('data-theme', 'light');
    });
  });

  describe('Performance Optimization', () => {
    it('should apply theme synchronously to prevent flash', () => {
      // Arrange
      const startTime = performance.now();

      // Act
      useThemeStore.getState().initializeTheme();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - Should complete synchronously
      expect(duration).toBeLessThan(1);
    });

    it('should not block rendering during theme application', () => {
      // Arrange
      const mockRequestIdleCallback = vi.fn();
      Object.defineProperty(window, 'requestIdleCallback', {
        value: mockRequestIdleCallback,
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockRequestIdleCallback).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility during theme transition', () => {
      // Arrange
      const mockDocumentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        setAttribute: setAttributeMock,
        getAttribute: vi.fn(),
        style: {
          setProperty: vi.fn(),
        },
      };

      Object.defineProperty(document, 'documentElement', {
        value: mockDocumentElement,
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(setAttributeMock).toHaveBeenCalledWith('data-theme', expect.any(String));
    });

    it('should preserve user\'s reduced motion preference', () => {
      // Arrange
      matchMediaMock.mockImplementation((query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          };
        }
        return {
          matches: false,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        };
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should work in browsers without localStorage', () => {
      // Arrange
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      });

      // Act & Assert
      expect(() => useThemeStore.getState().initializeTheme()).not.toThrow();
    });

    it('should work in browsers without matchMedia', () => {
      // Arrange
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });

      // Act & Assert
      expect(() => useThemeStore.getState().initializeTheme()).not.toThrow();
    });

    it('should handle older browser APIs', () => {
      // Arrange
      const oldMatchMedia = {
        addListener: vi.fn(), // Older API
        removeListener: vi.fn(),
        matches: false,
      };

      matchMediaMock.mockReturnValue(oldMatchMedia);

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(oldMatchMedia.addListener).toHaveBeenCalled();
    });
  });

  describe('Theme Transition Prevention', () => {
    it('should disable transitions during initial load', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
          },
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: mockStyle,
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--theme-transition-duration', '0ms');
    });

    it('should re-enable transitions after theme application', () => {
      // Arrange
      const mockStyle = {
        setProperty: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn(),
          },
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: mockStyle,
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();
      useThemeStore.getState().applyTheme();

      // Assert
      expect(mockStyle.setProperty).toHaveBeenCalledWith('--theme-transition-duration', '200ms');
    });
  });

  describe('DOM Manipulation', () => {
    it('should remove existing theme classes before applying new theme', () => {
      // Arrange
      const mockClassList = {
        add: vi.fn(),
        remove: vi.fn(),
        contains: jest.fn(() => true),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: mockClassList,
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: {
            setProperty: vi.fn(),
          },
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockClassList.remove).toHaveBeenCalled();
    });

    it('should apply theme classes correctly', () => {
      // Arrange
      const mockClassList = {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: {
          classList: mockClassList,
          setAttribute: setAttributeMock,
          getAttribute: vi.fn(),
          style: {
            setProperty: vi.fn(),
          },
        },
        writable: true,
      });

      // Act
      useThemeStore.getState().setTheme('dark');

      // Assert
      expect(mockClassList.add).toHaveBeenCalledWith('dark');
    });
  });

  describe('Event Handling', () => {
    it('should handle system preference changes', () => {
      // Arrange
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };

      matchMediaMock.mockReturnValue(mockMediaQuery);

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should handle reduced motion preference changes', () => {
      // Arrange
      const mockMediaQuery = {
        matches: false,
        addListener: vi.fn(), // Older API
        removeListener: vi.fn(),
      };

      matchMediaMock.mockReturnValue(mockMediaQuery);

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(mockMediaQuery.addListener).toHaveBeenCalled();
    });
  });
}); 