// Remove Vitest import and use Jest globals
// import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useThemeStore } from '../../store/themeStore';

// Mock jsPDF
const jsPDFMock = jest.fn(() => ({
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  save: vi.fn(),
  addPage: vi.fn(),
  setFont: vi.fn(),
  getTextWidth: jest.fn(() => 50),
  getTextDimensions: jest.fn(() => ({ w: 50, h: 10 })),
}));

jest.mock('jspdf', () => ({
  default: jsPDFMock,
}));

// Mock html2canvas
const html2canvasMock = jest.fn(() => Promise.resolve({
  toBlob: jest.fn(() => Promise.resolve(new Blob())),
  toDataURL: jest.fn(() => 'data:image/png;base64,test'),
}));

jest.mock('html2canvas', () => ({
  default: html2canvasMock,
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Mock document methods
const createElementMock = vi.fn();
const appendChildMock = vi.fn();
const removeChildMock = vi.fn();

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

  // Mock document methods
  Object.defineProperty(document, 'createElement', {
    value: createElementMock,
    writable: true,
  });

  Object.defineProperty(document.body, 'appendChild', {
    value: appendChildMock,
    writable: true,
  });

  Object.defineProperty(document.body, 'removeChild', {
    value: removeChildMock,
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

describe('Theme Export', () => {
  describe('PDF Export Theme Consistency', () => {
    it('should apply current theme to PDF export', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      const mockPdf = jsPDFMock();

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert
      expect(mockPdf.setFillColor).toHaveBeenCalledWith(expect.any(Number));
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should use light theme colors when in light mode', () => {
      // Arrange
      useThemeStore.getState().setTheme('light');
      const mockPdf = jsPDFMock();

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert
      expect(mockPdf.setFillColor).toHaveBeenCalledWith(255, 255, 255); // White background
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(0, 0, 0); // Black text
    });

    it('should use dark theme colors when in dark mode', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      const mockPdf = jsPDFMock();

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert
      expect(mockPdf.setFillColor).toHaveBeenCalledWith(30, 30, 30); // Dark background
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(255, 255, 255); // White text
    });

    it('should apply theme to PDF header', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      const mockPdf = jsPDFMock();

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(16);
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(255, 255, 255);
    });

    it('should apply theme to PDF content', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      const mockPdf = jsPDFMock();

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(12);
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(255, 255, 255);
    });
  });

  describe('HTML Export Theme Consistency', () => {
    it('should include theme CSS in HTML export', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const html = useThemeStore.getState().exportToHTML('Test Note', 'Test content');

      // Assert
      expect(html).toContain('data-theme="dark"');
      expect(html).toContain('background-color: #1e1e1e');
      expect(html).toContain('color: #ffffff');
    });

    it('should include light theme CSS when in light mode', () => {
      // Arrange
      useThemeStore.getState().setTheme('light');

      // Act
      const html = useThemeStore.getState().exportToHTML('Test Note', 'Test content');

      // Assert
      expect(html).toContain('data-theme="light"');
      expect(html).toContain('background-color: #ffffff');
      expect(html).toContain('color: #000000');
    });

    it('should include dark theme CSS when in dark mode', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const html = useThemeStore.getState().exportToHTML('Test Note', 'Test content');

      // Assert
      expect(html).toContain('data-theme="dark"');
      expect(html).toContain('background-color: #1e1e1e');
      expect(html).toContain('color: #ffffff');
    });

    it('should include theme transitions in HTML export', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const html = useThemeStore.getState().exportToHTML('Test Note', 'Test content');

      // Assert
      expect(html).toContain('transition: background-color 0.2s ease');
      expect(html).toContain('transition: color 0.2s ease');
    });
  });

  describe('Image Export Theme Consistency', () => {
    it('should apply current theme to image export', async () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      const mockCanvas = {
        toBlob: jest.fn(() => Promise.resolve(new Blob())),
        toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      };
      html2canvasMock.mockResolvedValue(mockCanvas);

      // Act
      await useThemeStore.getState().exportToImage('Test Note', 'Test content');

      // Assert
      expect(html2canvasMock).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          backgroundColor: '#1e1e1e',
        })
      );
    });

    it('should use light theme background for image export', async () => {
      // Arrange
      useThemeStore.getState().setTheme('light');
      const mockCanvas = {
        toBlob: jest.fn(() => Promise.resolve(new Blob())),
        toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      };
      html2canvasMock.mockResolvedValue(mockCanvas);

      // Act
      await useThemeStore.getState().exportToImage('Test Note', 'Test content');

      // Assert
      expect(html2canvasMock).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          backgroundColor: '#ffffff',
        })
      );
    });

    it('should use dark theme background for image export', async () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      const mockCanvas = {
        toBlob: jest.fn(() => Promise.resolve(new Blob())),
        toDataURL: jest.fn(() => 'data:image/png;base64,test'),
      };
      html2canvasMock.mockResolvedValue(mockCanvas);

      // Act
      await useThemeStore.getState().exportToImage('Test Note', 'Test content');

      // Assert
      expect(html2canvasMock).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        expect.objectContaining({
          backgroundColor: '#1e1e1e',
        })
      );
    });
  });

  describe('Markdown Export Theme Consistency', () => {
    it('should include theme metadata in markdown export', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const markdown = useThemeStore.getState().exportToMarkdown('Test Note', 'Test content');

      // Assert
      expect(markdown).toContain('theme: dark');
      expect(markdown).toContain('exported-at:');
    });

    it('should include light theme metadata', () => {
      // Arrange
      useThemeStore.getState().setTheme('light');

      // Act
      const markdown = useThemeStore.getState().exportToMarkdown('Test Note', 'Test content');

      // Assert
      expect(markdown).toContain('theme: light');
    });

    it('should include dark theme metadata', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const markdown = useThemeStore.getState().exportToMarkdown('Test Note', 'Test content');

      // Assert
      expect(markdown).toContain('theme: dark');
    });
  });

  describe('Theme Color Mapping', () => {
    it('should map light theme colors correctly', () => {
      // Arrange
      useThemeStore.getState().setTheme('light');

      // Act
      const colors = useThemeStore.getState().getThemeColors();

      // Assert
      expect(colors.background).toBe('#ffffff');
      expect(colors.text).toBe('#000000');
      expect(colors.primary).toBe('#3b82f6');
      expect(colors.secondary).toBe('#6b7280');
    });

    it('should map dark theme colors correctly', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const colors = useThemeStore.getState().getThemeColors();

      // Assert
      expect(colors.background).toBe('#1e1e1e');
      expect(colors.text).toBe('#ffffff');
      expect(colors.primary).toBe('#60a5fa');
      expect(colors.secondary).toBe('#9ca3af');
    });
  });

  describe('Export Format Consistency', () => {
    it('should maintain theme consistency across all export formats', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');

      // Act
      const pdf = useThemeStore.getState().exportToPDF('Test Note', 'Test content');
      const html = useThemeStore.getState().exportToHTML('Test Note', 'Test content');
      const markdown = useThemeStore.getState().exportToMarkdown('Test Note', 'Test content');

      // Assert
      expect(pdf).toBeDefined();
      expect(html).toContain('data-theme="dark"');
      expect(markdown).toContain('theme: dark');
    });

    it('should handle theme switching during export', () => {
      // Arrange
      useThemeStore.getState().setTheme('light');

      // Act
      const html1 = useThemeStore.getState().exportToHTML('Test Note', 'Test content');
      
      useThemeStore.getState().setTheme('dark');
      const html2 = useThemeStore.getState().exportToHTML('Test Note', 'Test content');

      // Assert
      expect(html1).toContain('data-theme="light"');
      expect(html2).toContain('data-theme="dark"');
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF export errors gracefully', () => {
      // Arrange
      jsPDFMock.mockImplementation(() => {
        throw new Error('PDF generation failed');
      });

      // Act & Assert
      expect(() => {
        useThemeStore.getState().exportToPDF('Test Note', 'Test content');
      }).not.toThrow();
    });

    it('should handle image export errors gracefully', async () => {
      // Arrange
      html2canvasMock.mockRejectedValue(new Error('Image generation failed'));

      // Act & Assert
      await expect(
        useThemeStore.getState().exportToImage('Test Note', 'Test content')
      ).rejects.toThrow('Image generation failed');
    });

    it('should fallback to light theme on export errors', () => {
      // Arrange
      useThemeStore.getState().setTheme('dark');
      jsPDFMock.mockImplementation(() => {
        throw new Error('PDF generation failed');
      });

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert - Should fallback to light theme colors
      const mockPdf = jsPDFMock();
      expect(mockPdf.setFillColor).toHaveBeenCalledWith(255, 255, 255);
    });
  });

  describe('Performance', () => {
    it('should complete PDF export within reasonable time', () => {
      // Arrange
      const startTime = performance.now();

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    it('should complete HTML export within reasonable time', () => {
      // Arrange
      const startTime = performance.now();

      // Act
      useThemeStore.getState().exportToHTML('Test Note', 'Test content');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(50); // Should complete within 50ms
    });

    it('should not block UI during export', () => {
      // Arrange
      const mockRequestIdleCallback = vi.fn();
      Object.defineProperty(window, 'requestIdleCallback', {
        value: mockRequestIdleCallback,
        writable: true,
      });

      // Act
      useThemeStore.getState().exportToPDF('Test Note', 'Test content');

      // Assert
      expect(mockRequestIdleCallback).toHaveBeenCalled();
    });
  });
}); 