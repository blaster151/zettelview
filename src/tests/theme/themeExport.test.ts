import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { themeStore } from '../../stores/themeStore';
import { AdvancedExportImport, ExportOptions } from '../../services/advancedExportImport';

// Mock jsPDF for PDF generation
const jsPDFMock = vi.fn(() => ({
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  setFillColor: vi.fn(),
  text: vi.fn(),
  rect: vi.fn(),
  save: vi.fn(),
  addPage: vi.fn(),
  setFont: vi.fn(),
  getTextWidth: vi.fn(() => 50),
  getTextDimensions: vi.fn(() => ({ w: 50, h: 10 })),
}));

vi.mock('jspdf', () => ({
  default: jsPDFMock,
}));

// Mock html2canvas for HTML to image conversion
const html2canvasMock = vi.fn(() => Promise.resolve({
  toBlob: vi.fn(() => Promise.resolve(new Blob())),
  toDataURL: vi.fn(() => 'data:image/png;base64,test'),
}));

vi.mock('html2canvas', () => ({
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document methods
const createElementMock = vi.fn();
const appendChildMock = vi.fn();
const removeChildMock = vi.fn();

Object.defineProperty(document, 'createElement', {
  value: createElementMock,
});

Object.defineProperty(document.body, 'appendChild', {
  value: appendChildMock,
});

Object.defineProperty(document.body, 'removeChild', {
  value: removeChildMock,
});

describe('Theme Export Consistency', () => {
  let exportService: AdvancedExportImport;
  const sampleNotes = [
    {
      id: '1',
      title: 'Test Note',
      content: 'This is a test note with some content.',
      tags: ['test', 'sample'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    exportService = AdvancedExportImport.getInstance();
    
    // Reset theme store
    themeStore.setState({
      theme: 'light',
      systemPreference: 'light',
      isDark: false,
      isSystem: false,
    });
    
    // Clear document classes
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('HTML Export Theme Consistency', () => {
    it('should include light theme styles in HTML export', async () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('light');
      expect(htmlContent).toContain('--color-background: #ffffff');
      expect(htmlContent).toContain('--color-text: #000000');
      expect(htmlContent).toContain('--color-primary: #3b82f6');
      expect(htmlContent).toContain('--color-secondary: #6b7280');
      expect(htmlContent).toContain('--color-border: #e5e7eb');
      expect(htmlContent).toContain('--color-accent: #f3f4f6');
    });

    it('should include dark theme styles in HTML export', async () => {
      // Arrange
      themeStore.setState({ theme: 'dark', isDark: true });
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('dark');
      expect(htmlContent).toContain('--color-background: #1f2937');
      expect(htmlContent).toContain('--color-text: #f9fafb');
      expect(htmlContent).toContain('--color-primary: #60a5fa');
      expect(htmlContent).toContain('--color-secondary: #9ca3af');
      expect(htmlContent).toContain('--color-border: #374151');
      expect(htmlContent).toContain('--color-accent: #374151');
    });

    it('should include both light and dark theme styles for theme switching', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('.light {');
      expect(htmlContent).toContain('.dark {');
      expect(htmlContent).toContain('--color-background: #ffffff');
      expect(htmlContent).toContain('--color-background: #1f2937');
    });

    it('should include proper CSS transitions for theme switching', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('transition:');
      expect(htmlContent).toContain('color 0.3s ease');
      expect(htmlContent).toContain('background-color 0.3s ease');
      expect(htmlContent).toContain('border-color 0.3s ease');
    });

    it('should include responsive design styles', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('@media');
      expect(htmlContent).toContain('max-width');
      expect(htmlContent).toContain('min-width');
    });

    it('should include print styles for better printing', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('@media print');
      expect(htmlContent).toContain('page-break');
      expect(htmlContent).toContain('print-color-adjust');
    });
  });

  describe('PDF Export Theme Consistency', () => {
    it('should apply light theme colors to PDF export', async () => {
      // Arrange
      themeStore.setState({ theme: 'light', isDark: false });
      const exportOptions: ExportOptions = {
        format: 'pdf',
        includeMetadata: true,
        includeTags: true,
      };

      // Mock PDF generation
      const mockPdf = {
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        setFillColor: vi.fn(),
        text: vi.fn(),
        rect: vi.fn(),
        save: vi.fn(),
        addPage: vi.fn(),
        setFont: vi.fn(),
        getTextWidth: vi.fn(() => 50),
        getTextDimensions: vi.fn(() => ({ w: 50, h: 10 })),
      };

      jsPDFMock.mockReturnValue(mockPdf);

      // Act
      await exportService.exportNotes(sampleNotes, exportOptions);

      // Assert
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(0, 0, 0); // Black text
      expect(mockPdf.setFillColor).toHaveBeenCalledWith(255, 255, 255); // White background
    });

    it('should apply dark theme colors to PDF export', async () => {
      // Arrange
      themeStore.setState({ theme: 'dark', isDark: true });
      const exportOptions: ExportOptions = {
        format: 'pdf',
        includeMetadata: true,
        includeTags: true,
      };

      // Mock PDF generation
      const mockPdf = {
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        setFillColor: vi.fn(),
        text: vi.fn(),
        rect: vi.fn(),
        save: vi.fn(),
        addPage: vi.fn(),
        setFont: vi.fn(),
        getTextWidth: vi.fn(() => 50),
        getTextDimensions: vi.fn(() => ({ w: 50, h: 10 })),
      };

      jsPDFMock.mockReturnValue(mockPdf);

      // Act
      await exportService.exportNotes(sampleNotes, exportOptions);

      // Assert
      expect(mockPdf.setTextColor).toHaveBeenCalledWith(249, 250, 251); // Light text
      expect(mockPdf.setFillColor).toHaveBeenCalledWith(31, 41, 55); // Dark background
    });

    it('should include proper font sizes and spacing in PDF', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'pdf',
        includeMetadata: true,
        includeTags: true,
      };

      const mockPdf = {
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        setFillColor: vi.fn(),
        text: vi.fn(),
        rect: vi.fn(),
        save: vi.fn(),
        addPage: vi.fn(),
        setFont: vi.fn(),
        getTextWidth: vi.fn(() => 50),
        getTextDimensions: vi.fn(() => ({ w: 50, h: 10 })),
      };

      jsPDFMock.mockReturnValue(mockPdf);

      // Act
      await exportService.exportNotes(sampleNotes, exportOptions);

      // Assert
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(16); // Title font size
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(12); // Content font size
      expect(mockPdf.setFontSize).toHaveBeenCalledWith(10); // Metadata font size
    });

    it('should handle page breaks properly in PDF', async () => {
      // Arrange
      const longNotes = Array.from({ length: 50 }, (_, i) => ({
        id: i.toString(),
        title: `Note ${i}`,
        content: 'This is a very long note content that should span multiple pages when exported to PDF. '.repeat(20),
        tags: ['test'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      }));

      const exportOptions: ExportOptions = {
        format: 'pdf',
        includeMetadata: true,
        includeTags: true,
      };

      const mockPdf = {
        setFontSize: vi.fn(),
        setTextColor: vi.fn(),
        setFillColor: vi.fn(),
        text: vi.fn(),
        rect: vi.fn(),
        save: vi.fn(),
        addPage: vi.fn(),
        setFont: vi.fn(),
        getTextWidth: vi.fn(() => 50),
        getTextDimensions: vi.fn(() => ({ w: 50, h: 10 })),
      };

      jsPDFMock.mockReturnValue(mockPdf);

      // Act
      await exportService.exportNotes(longNotes, exportOptions);

      // Assert
      expect(mockPdf.addPage).toHaveBeenCalled(); // Should add pages for long content
    });
  });

  describe('Markdown Export Theme Consistency', () => {
    it('should include theme metadata in markdown export', async () => {
      // Arrange
      themeStore.setState({ theme: 'dark', isDark: true });
      const exportOptions: ExportOptions = {
        format: 'markdown',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const markdownContent = result as string;

      // Assert
      expect(markdownContent).toContain('theme: dark');
      expect(markdownContent).toContain('exported-at:');
      expect(markdownContent).toContain('total-notes: 1');
    });

    it('should include proper markdown formatting', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'markdown',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const markdownContent = result as string;

      // Assert
      expect(markdownContent).toContain('# Test Note');
      expect(markdownContent).toContain('This is a test note with some content.');
      expect(markdownContent).toContain('**Tags:** #test #sample');
      expect(markdownContent).toContain('**Created:**');
      expect(markdownContent).toContain('**Updated:**');
    });
  });

  describe('Export Template Theme Support', () => {
    it('should apply theme variables in custom templates', async () => {
      // Arrange
      themeStore.setState({ theme: 'dark', isDark: true });
      
      const customTemplate = {
        id: 'theme-aware-template',
        name: 'Theme Aware Template',
        format: 'html',
        template: `
          <div class="{{theme}}-theme">
            <h1>{{title}}</h1>
            <p>{{content}}</p>
            <div class="theme-info">Current theme: {{theme}}</div>
          </div>
        `,
        variables: ['title', 'content', 'theme'],
      };

      exportService.addTemplate(customTemplate);

      const exportOptions: ExportOptions = {
        format: 'html',
        template: 'theme-aware-template',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      const result = await exportService.exportNotes(sampleNotes, exportOptions);
      const htmlContent = result as string;

      // Assert
      expect(htmlContent).toContain('dark-theme');
      expect(htmlContent).toContain('Current theme: dark');
    });

    it('should handle theme switching in templates', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act - Export with light theme
      themeStore.setState({ theme: 'light', isDark: false });
      const lightResult = await exportService.exportNotes(sampleNotes, exportOptions);
      const lightContent = lightResult as string;

      // Act - Export with dark theme
      themeStore.setState({ theme: 'dark', isDark: true });
      const darkResult = await exportService.exportNotes(sampleNotes, exportOptions);
      const darkContent = darkResult as string;

      // Assert
      expect(lightContent).toContain('light');
      expect(lightContent).toContain('--color-background: #ffffff');
      expect(darkContent).toContain('dark');
      expect(darkContent).toContain('--color-background: #1f2937');
    });
  });

  describe('Export Theme Validation', () => {
    it('should validate theme consistency across export formats', async () => {
      // Arrange
      themeStore.setState({ theme: 'dark', isDark: true });
      const formats: Array<ExportOptions['format']> = ['html', 'markdown', 'json'];

      // Act & Assert
      for (const format of formats) {
        const exportOptions: ExportOptions = {
          format,
          includeMetadata: true,
          includeTags: true,
        };

        const result = await exportService.exportNotes(sampleNotes, exportOptions);
        const content = result as string;

        // All formats should include theme information
        expect(content).toContain('dark');
      }
    });

    it('should handle theme export errors gracefully', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Mock theme store to throw error
      const originalGetState = themeStore.getState;
      themeStore.getState = vi.fn(() => {
        throw new Error('Theme store error');
      });

      // Act & Assert
      await expect(exportService.exportNotes(sampleNotes, exportOptions))
        .rejects.toThrow('Theme store error');

      // Restore original method
      themeStore.getState = originalGetState;
    });

    it('should ensure export works without theme store', async () => {
      // Arrange
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Temporarily remove theme store
      const originalThemeStore = (global as any).themeStore;
      delete (global as any).themeStore;

      // Act & Assert
      await expect(exportService.exportNotes(sampleNotes, exportOptions))
        .resolves.toBeDefined();

      // Restore theme store
      (global as any).themeStore = originalThemeStore;
    });
  });

  describe('Export Theme Performance', () => {
    it('should export with theme styles efficiently', async () => {
      // Arrange
      const startTime = performance.now();
      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act
      await exportService.exportNotes(sampleNotes, exportOptions);

      // Assert
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should handle large exports with theme styles', async () => {
      // Arrange
      const largeNotes = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        title: `Note ${i}`,
        content: 'Content '.repeat(100),
        tags: ['test'],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z'
      }));

      const exportOptions: ExportOptions = {
        format: 'html',
        includeMetadata: true,
        includeTags: true,
      };

      // Act & Assert
      await expect(exportService.exportNotes(largeNotes, exportOptions))
        .resolves.toBeDefined();
    });
  });
}); 