import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import EnhancedSearch from '../EnhancedSearch';
import AdvancedFilters from '../AdvancedFilters';
import SearchHistoryPanel from '../SearchHistoryPanel';
import { ThemeProvider } from '../../../store/themeStore';
import { NoteProvider } from '../../../store/noteStore';

// Mock the search service
jest.mock('../../../services/searchService', () => ({
  SearchHistory: {
    getHistory: jest.fn(() => [
      { query: 'test query 1', timestamp: Date.now(), resultCount: 5 },
      { query: 'test query 2', timestamp: Date.now() - 1000, resultCount: 3 }
    ]),
    clearHistory: jest.fn(),
    addToHistory: jest.fn()
  }
}));

// Mock the note store
const mockSearchNotes = jest.fn(() => ['suggestion 1', 'suggestion 2', 'suggestion 3']);
const mockNoteStore = {
  searchNotes: mockSearchNotes,
  notes: []
};

jest.mock('../../../store/noteStore', () => ({
  useNoteStore: () => mockNoteStore
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

describe('Keyboard Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EnhancedSearch', () => {
    const mockOnSearch = jest.fn();

    beforeEach(() => {
      mockOnSearch.mockClear();
    });

    it('should handle Tab navigation between elements', async () => {
      renderWithProviders(
        <EnhancedSearch onSearch={mockOnSearch} />
      );

      const searchInput = screen.getByRole('textbox');
      const historyButton = screen.getByLabelText('Show search history');
      const filtersButton = screen.getByLabelText('Show advanced filters');
      const analyticsButton = screen.getByLabelText('Show search analytics');

      // Focus search input
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);

      // Tab to history button
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      expect(document.activeElement).toBe(historyButton);

      // Tab to filters button
      fireEvent.keyDown(historyButton, { key: 'Tab' });
      expect(document.activeElement).toBe(filtersButton);

      // Tab to analytics button
      fireEvent.keyDown(filtersButton, { key: 'Tab' });
      expect(document.activeElement).toBe(analyticsButton);

      // Tab back to search input
      fireEvent.keyDown(analyticsButton, { key: 'Tab' });
      expect(document.activeElement).toBe(searchInput);
    });

    it('should handle Shift+Tab navigation backwards', async () => {
      renderWithProviders(
        <EnhancedSearch onSearch={mockOnSearch} />
      );

      const searchInput = screen.getByRole('textbox');
      const historyButton = screen.getByLabelText('Show search history');
      const filtersButton = screen.getByLabelText('Show advanced filters');
      const analyticsButton = screen.getByLabelText('Show search analytics');

      // Focus search input
      searchInput.focus();

      // Shift+Tab to analytics button
      fireEvent.keyDown(searchInput, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(analyticsButton);

      // Shift+Tab to filters button
      fireEvent.keyDown(analyticsButton, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(filtersButton);

      // Shift+Tab to history button
      fireEvent.keyDown(filtersButton, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(historyButton);

      // Shift+Tab back to search input
      fireEvent.keyDown(historyButton, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(searchInput);
    });

    it('should handle arrow key navigation in suggestions', async () => {
      renderWithProviders(
        <EnhancedSearch onSearch={mockOnSearch} />
      );

      const searchInput = screen.getByRole('textbox');
      
      // Type to trigger suggestions
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const suggestions = screen.getAllByRole('option');
      expect(suggestions).toHaveLength(3);

      // Arrow down to first suggestion
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(suggestions[0]).toHaveAttribute('aria-selected', 'true');

      // Arrow down to second suggestion
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      expect(suggestions[1]).toHaveAttribute('aria-selected', 'true');

      // Arrow up back to first suggestion
      fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
      expect(suggestions[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle Enter key to select suggestion', async () => {
      renderWithProviders(
        <EnhancedSearch onSearch={mockOnSearch} />
      );

      const searchInput = screen.getByRole('textbox');
      
      // Type to trigger suggestions
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Arrow down to first suggestion
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });

      // Enter to select suggestion
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalledWith('suggestion 1');
    });

    it('should handle Escape key to close suggestions', async () => {
      renderWithProviders(
        <EnhancedSearch onSearch={mockOnSearch} />
      );

      const searchInput = screen.getByRole('textbox');
      
      // Type to trigger suggestions
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Escape to close suggestions
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      });
    });
  });

  describe('AdvancedFilters', () => {
    const mockOnClose = jest.fn();
    const mockOnApplyFilters = jest.fn();

    beforeEach(() => {
      mockOnClose.mockClear();
      mockOnApplyFilters.mockClear();
    });

    it('should handle Tab navigation within modal', async () => {
      renderWithProviders(
        <AdvancedFilters
          isOpen={true}
          onClose={mockOnClose}
          onApplyFilters={mockOnApplyFilters}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close advanced filters dialog');
      const applyButton = screen.getByLabelText('Apply current filters to search');

      // Focus should be on close button initially
      expect(document.activeElement).toBe(closeButton);

      // Tab should cycle through elements
      fireEvent.keyDown(closeButton, { key: 'Tab' });
      // Focus should move to next focusable element

      // Shift+Tab should move backwards
      fireEvent.keyDown(applyButton, { key: 'Tab', shiftKey: true });
      // Focus should move to previous focusable element
    });

    it('should handle Escape key to close modal', async () => {
      renderWithProviders(
        <AdvancedFilters
          isOpen={true}
          onClose={mockOnClose}
          onApplyFilters={mockOnApplyFilters}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      fireEvent.keyDown(modal, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle Enter key on buttons', async () => {
      renderWithProviders(
        <AdvancedFilters
          isOpen={true}
          onClose={mockOnClose}
          onApplyFilters={mockOnApplyFilters}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close advanced filters dialog');
      
      // Focus the button
      closeButton.focus();
      
      // Enter should activate the button
      fireEvent.keyDown(closeButton, { key: 'Enter' });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should trap focus within modal', async () => {
      renderWithProviders(
        <AdvancedFilters
          isOpen={true}
          onClose={mockOnClose}
          onApplyFilters={mockOnApplyFilters}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      const closeButton = screen.getByLabelText('Close advanced filters dialog');
      const applyButton = screen.getByLabelText('Apply current filters to search');

      // Focus should be trapped within modal
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Tab from last element should go to first
      applyButton.focus();
      fireEvent.keyDown(applyButton, { key: 'Tab' });
      expect(document.activeElement).toBe(closeButton);

      // Shift+Tab from first element should go to last
      fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(applyButton);
    });
  });

  describe('SearchHistoryPanel', () => {
    const mockOnClose = jest.fn();
    const mockOnSearch = jest.fn();

    beforeEach(() => {
      mockOnClose.mockClear();
      mockOnSearch.mockClear();
    });

    it('should handle arrow key navigation in history list', async () => {
      renderWithProviders(
        <SearchHistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSearch={mockOnSearch}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const historyList = screen.getByRole('list');
      const historyItems = screen.getAllByRole('listitem');

      expect(historyItems).toHaveLength(2);

      // Focus the list
      historyList.focus();

      // Arrow down to first item
      fireEvent.keyDown(historyList, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(historyItems[0]);

      // Arrow down to second item
      fireEvent.keyDown(historyList, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(historyItems[1]);

      // Arrow up back to first item
      fireEvent.keyDown(historyList, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(historyItems[0]);
    });

    it('should handle Enter key to select history item', async () => {
      renderWithProviders(
        <SearchHistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSearch={mockOnSearch}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const historyItems = screen.getAllByRole('listitem');
      const firstItem = historyItems[0];

      // Focus and select first item
      firstItem.focus();
      fireEvent.keyDown(firstItem, { key: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalledWith('test query 1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle Space key to select history item', async () => {
      renderWithProviders(
        <SearchHistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSearch={mockOnSearch}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const historyItems = screen.getAllByRole('listitem');
      const firstItem = historyItems[0];

      // Focus and select first item with Space
      firstItem.focus();
      fireEvent.keyDown(firstItem, { key: 'Space' });

      expect(mockOnSearch).toHaveBeenCalledWith('test query 1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle Escape key to close panel', async () => {
      renderWithProviders(
        <SearchHistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSearch={mockOnSearch}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const modal = screen.getByRole('dialog');
      fireEvent.keyDown(modal, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should handle Tab navigation within panel', async () => {
      renderWithProviders(
        <SearchHistoryPanel
          isOpen={true}
          onClose={mockOnClose}
          onSearch={mockOnSearch}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close search history panel');
      const analyticsButton = screen.getByLabelText('Hide search analytics');

      // Focus should be on close button initially
      expect(document.activeElement).toBe(closeButton);

      // Tab should cycle through elements
      fireEvent.keyDown(closeButton, { key: 'Tab' });
      // Focus should move to next focusable element

      // Shift+Tab should move backwards
      fireEvent.keyDown(analyticsButton, { key: 'Tab', shiftKey: true });
      // Focus should move to previous focusable element
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels on all interactive elements', () => {
      renderWithProviders(
        <EnhancedSearch onSearch={jest.fn()} />
      );

      // Check for ARIA labels
      expect(screen.getByLabelText('Search query input')).toBeInTheDocument();
      expect(screen.getByLabelText('Show search history')).toBeInTheDocument();
      expect(screen.getByLabelText('Show advanced filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Show search analytics')).toBeInTheDocument();
    });

    it('should have proper role attributes', () => {
      renderWithProviders(
        <EnhancedSearch onSearch={jest.fn()} />
      );

      // Check for proper roles
      expect(screen.getByRole('search')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('toolbar')).toBeInTheDocument();
    });

    it('should announce changes to screen readers', async () => {
      renderWithProviders(
        <EnhancedSearch onSearch={jest.fn()} />
      );

      const searchInput = screen.getByRole('textbox');
      
      // Type to trigger suggestions
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.focus(searchInput);

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Check for aria-expanded attribute
      expect(searchInput).toHaveAttribute('aria-expanded', 'true');
      expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
      expect(searchInput).toHaveAttribute('aria-controls', 'search-suggestions');
    });
  });
}); 