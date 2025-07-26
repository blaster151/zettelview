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

// Mock performance API
const performanceMock = {
  now: jest.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: jest.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

// Mock requestAnimationFrame
const requestAnimationFrameMock = vi.fn();

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

  // Mock performance
  Object.defineProperty(window, 'performance', {
    value: performanceMock,
    writable: true,
  });

  // Mock requestAnimationFrame
  Object.defineProperty(window, 'requestAnimationFrame', {
    value: requestAnimationFrameMock,
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
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  // Clean up
  vi.clearAllMocks();
});

describe('Theme Performance', () => {
  describe('Theme Switching Performance', () => {
    it('should complete theme switch within performance budget', () => {
      // Arrange
      const startTime = performance.now();
      
      // Act
      useThemeStore.getState().setTheme('dark');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - Should complete within 16ms (60fps budget)
      expect(duration).toBeLessThan(16);
    });

    it('should not cause layout thrashing during theme switch', () => {
      // Arrange
      const observer = new MutationObserver(vi.fn());
      
      // Act
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().setTheme('dark');

      // Assert - Should not trigger excessive DOM mutations
      expect(performanceMock.mark).toHaveBeenCalled();
      expect(performanceMock.measure).toHaveBeenCalled();
    });

    it('should debounce rapid theme changes', () => {
      // Arrange
      const debounceDelay = 100; // Assuming 100ms debounce
      jest.useFakeTimers();

      // Act
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().setTheme('dark');

      jest.advanceTimersByTime(debounceDelay);

      // Assert - Should only apply the last theme
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('theme', 'dark');

      jest.useRealTimers();
    });
  });

  describe('System Preference Detection Performance', () => {
    it('should detect system preference efficiently', () => {
      // Arrange
      const matchMediaMock = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        value: matchMediaMock,
        writable: true,
      });

      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      const startTime = performance.now();

      // Act
      useThemeStore.getState().setSystemPreference('dark');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - Should complete within 5ms
      expect(duration).toBeLessThan(5);
    });

    it('should not block main thread during preference detection', () => {
      // Arrange
      const matchMediaMock = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        value: matchMediaMock,
        writable: true,
      });

      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Act & Assert
      expect(() => {
        useThemeStore.getState().setSystemPreference('light');
      }).not.toThrow();
    });
  });

  describe('DOM Manipulation Performance', () => {
    it('should apply theme classes efficiently', () => {
      // Arrange
      const mockDocumentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: mockDocumentElement,
        writable: true,
      });

      const startTime = performance.now();

      // Act
      useThemeStore.getState().setTheme('dark');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - Should complete within 5ms
      expect(duration).toBeLessThan(5);
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should batch DOM updates when switching themes', () => {
      // Arrange
      const mockDocumentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
      };

      Object.defineProperty(document, 'documentElement', {
        value: mockDocumentElement,
        writable: true,
      });

      // Act
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('light');

      // Assert - Should not call setAttribute excessively
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledTimes(2);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during theme operations', () => {
      // Arrange
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      // Act - Perform multiple theme operations
      for (let i = 0; i < 100; i++) {
        useThemeStore.getState().setTheme('dark');
        useThemeStore.getState().setTheme('light');
      }

      // Assert - Memory usage should not increase significantly
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Allow for some memory increase but not excessive
      expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB
    });

    it('should clean up event listeners properly', () => {
      // Arrange
      const matchMediaMock = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        value: matchMediaMock,
        writable: true,
      });

      const addEventListenerMock = vi.fn();
      const removeEventListenerMock = vi.fn();

      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
      });

      // Act
      useThemeStore.getState().initializeTheme();
      useThemeStore.getState().cleanup();

      // Assert
      expect(removeEventListenerMock).toHaveBeenCalled();
    });
  });

  describe('Animation Frame Performance', () => {
    it('should use requestAnimationFrame for smooth transitions', () => {
      // Arrange
      requestAnimationFrameMock.mockImplementation((callback) => {
        callback();
        return 1;
      });

      // Act
      useThemeStore.getState().setTheme('dark');

      // Assert
      expect(requestAnimationFrameMock).toHaveBeenCalled();
    });

    it('should not cause excessive animation frame requests', () => {
      // Arrange
      requestAnimationFrameMock.mockImplementation((callback) => {
        callback();
        return 1;
      });

      // Act - Multiple rapid theme changes
      for (let i = 0; i < 10; i++) {
        useThemeStore.getState().setTheme('dark');
      }

      // Assert - Should not request excessive animation frames
      expect(requestAnimationFrameMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('CSS Transition Performance', () => {
    it('should apply CSS transitions efficiently', () => {
      // Arrange
      const mockDocumentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        setAttribute: vi.fn(),
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
      useThemeStore.getState().setTheme('dark');

      // Assert
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-transition-duration',
        expect.any(String)
      );
    });

    it('should disable transitions during rapid changes', () => {
      // Arrange
      const mockDocumentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn(),
        },
        setAttribute: vi.fn(),
        getAttribute: vi.fn(),
        style: {
          setProperty: vi.fn(),
        },
      };

      Object.defineProperty(document, 'documentElement', {
        value: mockDocumentElement,
        writable: true,
      });

      // Act - Rapid theme changes
      useThemeStore.getState().setTheme('dark');
      useThemeStore.getState().setTheme('light');
      useThemeStore.getState().setTheme('dark');

      // Assert - Should disable transitions during rapid changes
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--theme-transition-duration',
        '0ms'
      );
    });
  });

  describe('Storage Performance', () => {
    it('should not cause excessive localStorage writes', () => {
      // Act - Multiple theme changes
      for (let i = 0; i < 10; i++) {
        useThemeStore.getState().setTheme('dark');
      }

      // Assert - Should only write once per unique theme
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });

    it('should handle localStorage quota efficiently', () => {
      // Arrange
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Act & Assert
      expect(() => {
        for (let i = 0; i < 100; i++) {
          useThemeStore.getState().setTheme('dark');
        }
      }).not.toThrow();
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover from errors quickly', () => {
      // Arrange
      const startTime = performance.now();
      
      // Simulate an error condition
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act
      useThemeStore.getState().setTheme('dark');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert - Should recover within 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should not retry failed operations excessively', () => {
      // Arrange
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Persistent error');
      });

      // Act
      useThemeStore.getState().setTheme('dark');

      // Assert - Should not retry more than once
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
    });
  });
}); 