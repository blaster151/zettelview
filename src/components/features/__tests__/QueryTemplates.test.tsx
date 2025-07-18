import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import SearchTemplates from '../SearchTemplates';
import SearchTemplatesButton from '../SearchTemplatesButton';
import { SearchTemplates as SearchTemplatesService, SearchTemplate, AppliedFilters } from '../../../services/searchService';
import { ThemeProvider } from '../../../store/themeStore';
import { NoteProvider } from '../../../store/noteStore';

// Mock the search templates service
jest.mock('../../../services/searchService', () => ({
  SearchTemplates: {
    getTemplates: jest.fn(() => [
      {
        id: 'template-1',
        name: 'Recent Notes',
        description: 'Find notes created in the last 7 days',
        query: '',
        filters: {
          datePreset: 'week',
          dateRange: { start: null, end: null },
          contentTypes: {
            hasLinks: false,
            hasTags: false,
            hasContent: true,
            hasAttachments: false,
            isArchived: false
          },
          includeTags: [],
          excludeTags: [],
          tagLogic: 'any',
          textFilters: [],
          sortBy: 'date',
          sortOrder: 'desc',
          maxResults: 50
        },
        category: 'general',
        isDefault: true,
        createdAt: Date.now(),
        usageCount: 5,
        lastUsed: Date.now()
      },
      {
        id: 'template-2',
        name: 'Tagged Notes',
        description: 'Find notes that have tags',
        query: '',
        filters: {
          datePreset: 'all',
          dateRange: { start: null, end: null },
          contentTypes: {
            hasLinks: false,
            hasTags: true,
            hasContent: false,
            hasAttachments: false,
            isArchived: false
          },
          includeTags: [],
          excludeTags: [],
          tagLogic: 'any',
          textFilters: [],
          sortBy: 'date',
          sortOrder: 'desc',
          maxResults: 50
        },
        category: 'general',
        isDefault: true,
        createdAt: Date.now(),
        usageCount: 3,
        lastUsed: Date.now() - 1000
      }
    ]),
    getCategories: jest.fn(() => [
      { id: 'general', name: 'General', description: 'General templates', icon: '🔍' },
      { id: 'work', name: 'Work', description: 'Work templates', icon: '💼' },
      { id: 'personal', name: 'Personal', description: 'Personal templates', icon: '👤' }
    ]),
    saveTemplate: jest.fn((template) => ({
      ...template,
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
      usageCount: 0
    })),
    updateTemplate: jest.fn(() => true),
    deleteTemplate: jest.fn(() => true),
    incrementUsage: jest.fn(),
    getPopularTemplates: jest.fn(() => []),
    getRecentTemplates: jest.fn(() => []),
    duplicateTemplate: jest.fn(() => null),
    exportTemplates: jest.fn(() => '{}'),
    importTemplates: jest.fn(() => ({ success: true, message: 'Success' })),
    resetToDefaults: jest.fn(),
    getTemplateStats: jest.fn(() => ({
      total: 2,
      byCategory: { general: 2 },
      mostUsed: null,
      recentlyUsed: null
    }))
  }
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <NoteProvider>
        {component}
      </NoteProvider>
    </ThemeProvider>
  );
};

describe('Query Templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SearchTemplates Component', () => {
    const mockOnClose = jest.fn();
    const mockOnApplyTemplate = jest.fn();

    beforeEach(() => {
      mockOnClose.mockClear();
      mockOnApplyTemplate.mockClear();
    });

    it('should render templates manager modal', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByText('📋 Search Templates')).toBeInTheDocument();
      expect(screen.getByText('Recent Notes')).toBeInTheDocument();
      expect(screen.getByText('Tagged Notes')).toBeInTheDocument();
    });

    it('should filter templates by category', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const categorySelect = screen.getByLabelText('Filter templates by category');
      fireEvent.change(categorySelect, { target: { value: 'work' } });

      // Should show no templates since both are in 'general' category
      expect(screen.getByText('No matching templates found.')).toBeInTheDocument();
    });

    it('should filter templates by search', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Filter templates by name or description');
      fireEvent.change(searchInput, { target: { value: 'Recent' } });

      expect(screen.getByText('Recent Notes')).toBeInTheDocument();
      expect(screen.queryByText('Tagged Notes')).not.toBeInTheDocument();
    });

    it('should apply template when clicked', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const applyButton = screen.getByLabelText('Apply template: Recent Notes');
      fireEvent.click(applyButton);

      expect(mockOnApplyTemplate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Recent Notes'
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should show create template form', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const newButton = screen.getByLabelText('Create new template');
      fireEvent.click(newButton);

      expect(screen.getByText('➕ Create Template')).toBeInTheDocument();
      expect(screen.getByLabelText('Template name')).toBeInTheDocument();
    });

    it('should create new template', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Open create form
      const newButton = screen.getByLabelText('Create new template');
      fireEvent.click(newButton);

      // Fill form
      const nameInput = screen.getByLabelText('Template name');
      const descriptionInput = screen.getByLabelText('Template description');
      
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      // Submit form
      const createButton = screen.getByLabelText('Create template');
      fireEvent.click(createButton);

      expect(SearchTemplatesService.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template',
          description: 'Test description'
        })
      );
    });

    it('should delete template', async () => {
      // Mock window.confirm
      window.confirm = jest.fn(() => true);

      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const deleteButton = screen.getByLabelText('Delete template: Recent Notes');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(SearchTemplatesService.deleteTemplate).toHaveBeenCalledWith('template-1');
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={mockOnClose}
          onApplyTemplate={mockOnApplyTemplate}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      
      // Escape should close modal
      fireEvent.keyDown(modal, { key: 'Escape' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('SearchTemplatesButton Component', () => {
    const mockOnApplyTemplate = jest.fn();
    const mockCurrentFilters: AppliedFilters = {
      datePreset: 'all',
      dateRange: { start: null, end: null },
      contentTypes: {
        hasLinks: false,
        hasTags: false,
        hasContent: true,
        hasAttachments: false,
        isArchived: false
      },
      includeTags: [],
      excludeTags: [],
      tagLogic: 'any',
      textFilters: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      maxResults: 50
    };

    beforeEach(() => {
      mockOnApplyTemplate.mockClear();
    });

    it('should render templates button', () => {
      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      expect(screen.getByLabelText('Show search templates')).toBeInTheDocument();
    });

    it('should open dropdown when clicked', async () => {
      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      const button = screen.getByLabelText('Show search templates');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('📋 Search Templates')).toBeInTheDocument();
      });
    });

    it('should show popular and recent templates', async () => {
      // Mock popular and recent templates
      (SearchTemplatesService.getPopularTemplates as jest.Mock).mockReturnValue([
        {
          id: 'popular-1',
          name: 'Popular Template',
          usageCount: 10
        }
      ]);
      (SearchTemplatesService.getRecentTemplates as jest.Mock).mockReturnValue([
        {
          id: 'recent-1',
          name: 'Recent Template',
          lastUsed: Date.now()
        }
      ]);

      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      const button = screen.getByLabelText('Show search templates');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('🔥 Popular')).toBeInTheDocument();
        expect(screen.getByText('⏰ Recent')).toBeInTheDocument();
      });
    });

    it('should apply template from dropdown', async () => {
      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      const button = screen.getByLabelText('Show search templates');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Recent Notes')).toBeInTheDocument();
      });

      const applyButton = screen.getByLabelText('Apply template: Recent Notes');
      fireEvent.click(applyButton);

      expect(mockOnApplyTemplate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Recent Notes'
      }));
    });

    it('should save current search as template', async () => {
      // Mock prompt
      const mockPrompt = jest.fn()
        .mockReturnValueOnce('Test Template') // name
        .mockReturnValueOnce('Test Description') // description
        .mockReturnValueOnce('work'); // category
      
      window.prompt = mockPrompt;
      window.alert = jest.fn();

      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      const button = screen.getByLabelText('Show search templates');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('💾 Save Current')).toBeInTheDocument();
      });

      const saveButton = screen.getByLabelText('Save current search as template');
      fireEvent.click(saveButton);

      expect(mockPrompt).toHaveBeenCalledTimes(3);
      expect(SearchTemplatesService.saveTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Template',
          description: 'Test Description',
          category: 'work',
          filters: mockCurrentFilters
        })
      );
    });

    it('should handle keyboard navigation', async () => {
      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      const button = screen.getByLabelText('Show search templates');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const dropdown = screen.getByRole('menu');
      
      // Escape should close dropdown
      fireEvent.keyDown(dropdown, { key: 'Escape' });
      
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should filter templates in dropdown', async () => {
      renderWithProviders(
        <SearchTemplatesButton
          onApplyTemplate={mockOnApplyTemplate}
          currentFilters={mockCurrentFilters}
        />
      );

      const button = screen.getByLabelText('Show search templates');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByLabelText('Filter templates')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Filter templates');
      fireEvent.change(searchInput, { target: { value: 'Recent' } });

      expect(screen.getByText('Recent Notes')).toBeInTheDocument();
      expect(screen.queryByText('Tagged Notes')).not.toBeInTheDocument();
    });
  });

  describe('Template Service Integration', () => {
    it('should load templates on component mount', () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={jest.fn()}
          onApplyTemplate={jest.fn()}
        />
      );

      expect(SearchTemplatesService.getTemplates).toHaveBeenCalled();
      expect(SearchTemplatesService.getCategories).toHaveBeenCalled();
    });

    it('should increment usage when template is applied', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={jest.fn()}
          onApplyTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const applyButton = screen.getByLabelText('Apply template: Recent Notes');
      fireEvent.click(applyButton);

      expect(SearchTemplatesService.incrementUsage).toHaveBeenCalledWith('template-1');
    });

    it('should export templates', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={jest.fn()}
          onApplyTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const importExportButton = screen.getByLabelText('Import or export templates');
      fireEvent.click(importExportButton);

      const exportButton = screen.getByLabelText('Export all templates');
      fireEvent.click(exportButton);

      expect(SearchTemplatesService.exportTemplates).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={jest.fn()}
          onApplyTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Filter templates by name or description')).toBeInTheDocument();
      expect(screen.getByLabelText('Filter templates by category')).toBeInTheDocument();
      expect(screen.getByLabelText('Sort templates')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderWithProviders(
        <SearchTemplates
          isOpen={true}
          onClose={jest.fn()}
          onApplyTemplate={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      
      // Tab should cycle through focusable elements
      fireEvent.keyDown(modal, { key: 'Tab' });
      // Focus should move to next element
      
      // Shift+Tab should move backwards
      fireEvent.keyDown(modal, { key: 'Tab', shiftKey: true });
      // Focus should move to previous element
    });
  });
}); 