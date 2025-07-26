import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { AdvancedSearch } from '../components/features/AdvancedSearch';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';

// Mock the stores
vi.mock('../store/noteStore');
vi.mock('../store/themeStore');
vi.mock('../services/loggingService');
vi.mock('../services/performanceMonitor');

const mockUseNoteStore = useNoteStore as vi.MockedFunction<typeof useNoteStore>;
const mockUseThemeStore = useThemeStore as vi.MockedFunction<typeof useThemeStore>;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Advanced Search', () => {
  const mockNotes = [
    {
      id: '1',
      title: 'Meeting Notes',
      body: 'Discussion about project timeline and milestones. Important decisions made.',
      tags: ['meeting', 'project', 'timeline'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Technical Documentation',
      body: 'API endpoints and database schema. Implementation details for the backend.',
      tags: ['technical', 'api', 'documentation'],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '3',
      title: 'Personal Goals',
      body: 'My personal goals for this year. Focus on learning and growth.',
      tags: ['personal', 'goals', 'learning'],
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: '4',
      title: 'Shopping List',
      body: 'Milk, bread, eggs, and vegetables. Need to buy groceries this weekend.',
      tags: ['shopping', 'groceries'],
      createdAt: new Date('2024-01-30'),
      updatedAt: new Date('2024-01-30')
    }
  ];

  const mockColors = {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceHover: '#e9ecef',
    surfaceActive: '#dee2e6',
    text: '#212529',
    textSecondary: '#6c757d',
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#17a2b8',
    border: '#dee2e6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      searchNotes: vi.fn(),
      getSearchSuggestions: vi.fn(),
      advancedSearch: vi.fn(),
      validateAdvancedQuery: vi.fn(),
      getAdvancedSearchSuggestions: vi.fn()
    });

    mockUseThemeStore.mockReturnValue({
      colors: mockColors,
      toggleTheme: vi.fn()
    });

    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Search Operators', () => {
    test('contains operator returns correct filtered notes', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      // Add a filter with contains operator
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const operatorSelect = screen.getByDisplayValue('Contains');
      const valueInput = screen.getByPlaceholderText('Value...');
      
      fireEvent.change(valueInput, { target: { value: 'project' } });
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.queryByText('Shopping List')).not.toBeInTheDocument();
      });
    });

    test('starts_with operator returns correct filtered notes', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const operatorSelect = screen.getByDisplayValue('Contains');
      fireEvent.change(operatorSelect, { target: { value: 'starts_with' } });
      
      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: 'Meeting' } });
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.queryByText('Technical Documentation')).not.toBeInTheDocument();
      });
    });

    test('ends_with operator returns correct filtered notes', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const operatorSelect = screen.getByDisplayValue('Contains');
      fireEvent.change(operatorSelect, { target: { value: 'ends_with' } });
      
      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: 'List' } });
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Shopping List')).toBeInTheDocument();
        expect(screen.queryByText('Meeting Notes')).not.toBeInTheDocument();
      });
    });

    test('equals operator returns correct filtered notes', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const operatorSelect = screen.getByDisplayValue('Contains');
      fireEvent.change(operatorSelect, { target: { value: 'equals' } });
      
      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: 'Meeting Notes' } });
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.queryByText('Technical Documentation')).not.toBeInTheDocument();
      });
    });

    test('regex operator returns correct filtered notes', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const operatorSelect = screen.getByDisplayValue('Contains');
      fireEvent.change(operatorSelect, { target: { value: 'regex' } });
      
      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: '^[A-Z].*' } }); // Starts with capital letter
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.getByText('Technical Documentation')).toBeInTheDocument();
        expect(screen.getByText('Personal Goals')).toBeInTheDocument();
        expect(screen.getByText('Shopping List')).toBeInTheDocument();
      });
    });

    test('invalid regex pattern handles gracefully', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const operatorSelect = screen.getByDisplayValue('Contains');
      fireEvent.change(operatorSelect, { target: { value: 'regex' } });
      
      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: '[' } }); // Invalid regex
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });
  });

  describe('Saved Queries', () => {
    test('saved queries load and execute correctly', async () => {
      const savedQueries = [
        {
          id: '1',
          name: 'Project Notes',
          query: 'project',
          filters: [{ field: 'all', operator: 'contains', value: 'project' }],
          createdAt: new Date('2024-01-01'),
          lastUsed: new Date('2024-01-01'),
          useCount: 5
        }
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedQueries));

      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const savedQueriesButton = screen.getByText('Saved Queries');
      fireEvent.click(savedQueriesButton);

      await waitFor(() => {
        expect(screen.getByText('Project Notes')).toBeInTheDocument();
      });

      const savedQuery = screen.getByText('Project Notes');
      fireEvent.click(savedQuery);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.getByText('Technical Documentation')).toBeInTheDocument();
      });
    });

    test('saved queries handle malformed data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      // Should not crash and should show empty state
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    });

    test('save current search as query', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'important meeting' } });

      const saveQueryButton = screen.getByText('Save Query');
      fireEvent.click(saveQueryButton);

      // Mock prompt
      const mockPrompt = jest.spyOn(window, 'prompt').mockReturnValue('Important Meetings');

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'zettelview_saved_queries',
          expect.stringContaining('Important Meetings')
        );
      });

      mockPrompt.mockRestore();
    });
  });

  describe('No-Match Search', () => {
    test('no-match search returns clean empty UI', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'nonexistent term' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search terms or filters')).toBeInTheDocument();
      });
    });

    test('empty search shows appropriate message', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Enter a search query to get started')).toBeInTheDocument();
      });
    });
  });

  describe('Sort Options', () => {
    test('sort by relevance affects result order', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'notes' } });

      const sortSelect = screen.getByDisplayValue('Relevance');
      fireEvent.change(sortSelect, { target: { value: 'relevance' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const results = screen.getAllByTestId('search-result');
        expect(results[0]).toHaveTextContent('Meeting Notes');
        expect(results[1]).toHaveTextContent('Technical Documentation');
      });
    });

    test('sort by date affects result order', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'notes' } });

      const sortSelect = screen.getByDisplayValue('Relevance');
      fireEvent.change(sortSelect, { target: { value: 'date' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const results = screen.getAllByTestId('search-result');
        expect(results[0]).toHaveTextContent('Shopping List'); // Most recent
        expect(results[3]).toHaveTextContent('Meeting Notes'); // Oldest
      });
    });

    test('sort by title affects result order', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'notes' } });

      const sortSelect = screen.getByDisplayValue('Relevance');
      fireEvent.change(sortSelect, { target: { value: 'title' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const results = screen.getAllByTestId('search-result');
        expect(results[0]).toHaveTextContent('Meeting Notes');
        expect(results[1]).toHaveTextContent('Personal Goals');
        expect(results[2]).toHaveTextContent('Shopping List');
        expect(results[3]).toHaveTextContent('Technical Documentation');
      });
    });

    test('sort order (asc/desc) affects result order', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'notes' } });

      const sortSelect = screen.getByDisplayValue('Relevance');
      fireEvent.change(sortSelect, { target: { value: 'title' } });

      const orderSelect = screen.getByDisplayValue('Desc');
      fireEvent.change(orderSelect, { target: { value: 'asc' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const results = screen.getAllByTestId('search-result');
        expect(results[0]).toHaveTextContent('Technical Documentation');
        expect(results[3]).toHaveTextContent('Meeting Notes');
      });
    });
  });

  describe('Search Result Snippets', () => {
    test('search result snippets contain highlighted matches', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'project' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const snippet = screen.getByText(/Discussion about project timeline/);
        expect(snippet).toBeInTheDocument();
        
        // Check for highlighted text
        const highlightedText = snippet.querySelector('.highlight');
        expect(highlightedText).toHaveTextContent('project');
      });
    });

    test('snippets are truncated appropriately', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'important' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const snippet = screen.getByText(/Important decisions made/);
        expect(snippet).toBeInTheDocument();
        expect(snippet.textContent).toHaveLength(150); // Should be truncated
      });
    });

    test('multiple matches in snippet are all highlighted', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'and' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        const highlights = screen.getAllByText('and');
        expect(highlights.length).toBeGreaterThan(1);
        highlights.forEach(highlight => {
          expect(highlight).toHaveClass('highlight');
        });
      });
    });
  });

  describe('Filter Combinations', () => {
    test('multiple filters work together', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      // Add first filter
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: 'meeting' } });

      // Add second filter
      fireEvent.click(addFilterButton);
      const secondValueInput = screen.getAllByPlaceholderText('Value...')[1];
      fireEvent.change(secondValueInput, { target: { value: 'project' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.queryByText('Technical Documentation')).not.toBeInTheDocument();
      });
    });

    test('field-specific filters work correctly', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const addFilterButton = screen.getByText('Add Filter');
      fireEvent.click(addFilterButton);

      const fieldSelect = screen.getByDisplayValue('All Fields');
      fireEvent.change(fieldSelect, { target: { value: 'title' } });

      const valueInput = screen.getByPlaceholderText('Value...');
      fireEvent.change(valueInput, { target: { value: 'Meeting' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
        expect(screen.queryByText('Technical Documentation')).not.toBeInTheDocument();
      });
    });
  });

  describe('Date Range Filtering', () => {
    test('date range filter works correctly', async () => {
      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const dateRangeStart = screen.getByLabelText('Start Date');
      const dateRangeEnd = screen.getByLabelText('End Date');

      fireEvent.change(dateRangeStart, { target: { value: '2024-01-20' } });
      fireEvent.change(dateRangeEnd, { target: { value: '2024-01-30' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Technical Documentation')).toBeInTheDocument();
        expect(screen.getByText('Personal Goals')).toBeInTheDocument();
        expect(screen.getByText('Shopping List')).toBeInTheDocument();
        expect(screen.queryByText('Meeting Notes')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Error Handling', () => {
    test('handles large result sets gracefully', async () => {
      const largeNotes = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        title: `Note ${i}`,
        body: `Content for note ${i}`,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      mockUseNoteStore.mockReturnValue({
        notes: largeNotes,
        searchNotes: vi.fn(),
        getSearchSuggestions: vi.fn(),
        advancedSearch: vi.fn(),
        validateAdvancedQuery: vi.fn(),
        getAdvancedSearchSuggestions: vi.fn()
      });

      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'test' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText(/Showing \d+ of \d+ results/)).toBeInTheDocument();
      });
    });

    test('handles search errors gracefully', async () => {
      mockUseNoteStore.mockReturnValue({
        notes: mockNotes,
        searchNotes: vi.fn().mockRejectedValue(new Error('Search failed')),
        getSearchSuggestions: vi.fn(),
        advancedSearch: vi.fn(),
        validateAdvancedQuery: vi.fn(),
        getAdvancedSearchSuggestions: vi.fn()
      });

      render(<AdvancedSearch isOpen={true} onClose={vi.fn()} onSelectNote={vi.fn()} />);
      
      const queryInput = screen.getByPlaceholderText('Search notes...');
      fireEvent.change(queryInput, { target: { value: 'test' } });

      const searchButton = screen.getByText('Search');
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(screen.getByText('Search failed. Please try again.')).toBeInTheDocument();
      });
    });
  });
}); 