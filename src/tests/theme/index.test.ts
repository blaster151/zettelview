import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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

beforeAll(() => {
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

afterAll(() => {
  // Clean up
  vi.clearAllMocks();
});

describe('Theme System Integration', () => {
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
  });

  describe('Theme Store Integration', () => {
    it('should initialize theme store correctly', () => {
      // Assert
      expect(useThemeStore.getState().theme).toBe('light');
      expect(useThemeStore.getState().isDark).toBe(false);
      expect(useThemeStore.getState().isSystem).toBe(false);
    });

    it('should switch themes correctly', () => {
      // Act
      useThemeStore.getState().setTheme('dark');

      // Assert
      expect(useThemeStore.getState().theme).toBe('dark');
      expect(useThemeStore.getState().isDark).toBe(true);
    });

    it('should toggle themes correctly', () => {
      // Arrange
      useThemeStore.getState().setTheme('light');

      // Act
      useThemeStore.getState().toggleTheme();

      // Assert
      expect(useThemeStore.getState().theme).toBe('dark');
      expect(useThemeStore.getState().isDark).toBe(true);
    });
  });

  describe('System Preference Integration', () => {
    it('should detect system preference correctly', () => {
      // Arrange
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Act
      useThemeStore.getState().setSystemPreference('dark');

      // Assert
      expect(useThemeStore.getState().systemPreference).toBe('dark');
    });

    it('should handle system mode correctly', () => {
      // Arrange
      matchMediaMock.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });

      // Act
      useThemeStore.getState().setSystemMode(true);

      // Assert
      expect(useThemeStore.getState().isSystem).toBe(true);
    });
  });

  describe('Persistence Integration', () => {
    it('should save theme to localStorage', () => {
      // Act
      useThemeStore.getState().setTheme('dark');

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should load theme from localStorage', () => {
      // Arrange
      localStorageMock.getItem.mockReturnValue('dark');

      // Act
      useThemeStore.getState().initializeTheme();

      // Assert
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(useThemeStore.getState().theme).toBe('dark');
    });
  });

  describe('DOM Integration', () => {
    it('should apply theme to document element', () => {
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

      // Assert
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should remove old theme classes', () => {
      // Arrange
      const mockDocumentElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: jest.fn(() => true),
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

      // Assert
      expect(mockDocumentElement.classList.remove).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle localStorage errors gracefully', () => {
      // Arrange
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Act & Assert
      expect(() => useThemeStore.getState().setTheme('dark')).not.toThrow();
    });

    it('should handle matchMedia errors gracefully', () => {
      // Arrange
      matchMediaMock.mockImplementation(() => {
        throw new Error('Media query error');
      });

      // Act & Assert
      expect(() => useThemeStore.getState().setSystemPreference('dark')).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should complete theme operations efficiently', () => {
      // Arrange
      const startTime = performance.now();

      // Act
      useThemeStore.getState().setTheme('dark');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(10);
    });

    it('should not cause excessive DOM operations', () => {
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
      useThemeStore.getState().setTheme('dark');

      // Assert
      expect(mockDocumentElement.setAttribute).toHaveBeenCalledTimes(3);
    });
  });
}); 