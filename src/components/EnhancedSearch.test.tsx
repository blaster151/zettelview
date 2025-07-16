import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedSearch from './EnhancedSearch';
import { createMockNote } from '../types/test';

// Mock the theme store
const mockColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceHover: '#e9ecef',
  surfaceActive: '#dee2e6',
  text: '#212529',
  textSecondary: '#6c757d',
  primary: '#007bff',
  border: '#dee2e6'
};

jest.mock('../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: mockColors
  })
}));

// Mock search utilities
jest.mock('../utils/searchUtils', () => ({
  fuzzySearch: jest.fn(),
  SearchHistory: {
    getRecentQueries: jest.fn(),
    clearHistory: jest.fn()
  },
  highlightSearchTerms: jest.fn(),
  getSearchSuggestions: jest.fn()
}));

const mockFuzzySearch = require('../utils/searchUtils').fuzzySearch;
const mockGetRecentQueries = require('../utils/searchUtils').SearchHistory.getRecentQueries;
const mockGetSearchSuggestions = require('../utils/searchUtils').getSearchSuggestions;

const mockNotes = [
  createMockNote('note1', 'JavaScript Guide', 'Learn JavaScript programming', ['javascript', 'programming']),
  createMockNote('note2', 'Python Basics', 'Introduction to Python', ['python', 'basics']),
  createMockNote('note3', 'React Development', 'Building with React', ['react', 'web'])
];

describe('EnhancedSearch', () => {
  const defaultProps = {
    notes: mockNotes,
    onSearch: jest.fn(),
    onSelectNote: jest.fn(),
    placeholder: 'Search notes...'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFuzzySearch.mockReturnValue([]);
    mockGetRecentQueries.mockReturnValue([]);
    mockGetSearchSuggestions.mockReturnValue([]);
  });

  test('should render search input with placeholder', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    expect(input).toBeInTheDocument();
  });

  test('should call onSearch when input changes', async () => {
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'javascript');
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('javascript');
  });

  test('should show search icon', () => {
    render(<EnhancedSearch {...defaultProps} />);
    
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  test('should show clear button when query exists', async () => {
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'test');
    
    const clearButton = screen.getByTitle('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  test('should clear search when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'test');
    
    const clearButton = screen.getByTitle('Clear search');
    await user.click(clearButton);
    
    expect(input).toHaveValue('');
    expect(defaultProps.onSearch).toHaveBeenCalledWith('');
  });

  test('should show search history on focus when no query', async () => {
    const recentQueries = ['javascript', 'python', 'react'];
    mockGetRecentQueries.mockReturnValue(recentQueries);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.click(input);
    
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('🔍 javascript')).toBeInTheDocument();
    expect(screen.getByText('🔍 python')).toBeInTheDocument();
    expect(screen.getByText('🔍 react')).toBeInTheDocument();
  });

  test('should show suggestions when typing', async () => {
    const suggestions = ['JavaScript', 'JavaScript Guide'];
    mockGetSearchSuggestions.mockReturnValue(suggestions);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'jav');
    
    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('💡 JavaScript')).toBeInTheDocument();
    expect(screen.getByText('💡 JavaScript Guide')).toBeInTheDocument();
  });

  test('should show search results when available', async () => {
    const searchResults = [
      {
        noteId: 'note1',
        title: 'JavaScript Guide',
        body: 'Learn JavaScript programming',
        tags: ['javascript', 'programming'],
        score: 100,
        matches: [{ type: 'title' as const, field: 'JavaScript Guide', indices: [] }]
      }
    ];
    mockFuzzySearch.mockReturnValue(searchResults);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'javascript');
    
    expect(screen.getByText('Results (1)')).toBeInTheDocument();
    expect(screen.getByText('📝 JavaScript Guide')).toBeInTheDocument();
  });

  test('should handle suggestion click', async () => {
    const suggestions = ['JavaScript'];
    mockGetSearchSuggestions.mockReturnValue(suggestions);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'jav');
    
    const suggestion = screen.getByText('💡 JavaScript');
    await user.click(suggestion);
    
    expect(input).toHaveValue('JavaScript');
    expect(defaultProps.onSearch).toHaveBeenCalledWith('JavaScript');
  });

  test('should handle history item click', async () => {
    const recentQueries = ['javascript'];
    mockGetRecentQueries.mockReturnValue(recentQueries);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.click(input);
    
    const historyItem = screen.getByText('🔍 javascript');
    await user.click(historyItem);
    
    expect(input).toHaveValue('javascript');
    expect(defaultProps.onSearch).toHaveBeenCalledWith('javascript');
  });

  test('should handle search result click', async () => {
    const searchResults = [
      {
        noteId: 'note1',
        title: 'JavaScript Guide',
        body: 'Learn JavaScript programming',
        tags: ['javascript', 'programming'],
        score: 100,
        matches: [{ type: 'title' as const, field: 'JavaScript Guide', indices: [] }]
      }
    ];
    mockFuzzySearch.mockReturnValue(searchResults);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'javascript');
    
    const result = screen.getByText('📝 JavaScript Guide');
    await user.click(result);
    
    expect(defaultProps.onSelectNote).toHaveBeenCalledWith('note1');
  });

  test('should handle keyboard navigation', async () => {
    const searchResults = [
      {
        noteId: 'note1',
        title: 'JavaScript Guide',
        body: 'Learn JavaScript programming',
        tags: ['javascript', 'programming'],
        score: 100,
        matches: [{ type: 'title' as const, field: 'JavaScript Guide', indices: [] }]
      }
    ];
    mockFuzzySearch.mockReturnValue(searchResults);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'javascript');
    
    // Press arrow down to select first result
    await user.keyboard('{ArrowDown}');
    
    // Press enter to select
    await user.keyboard('{Enter}');
    
    expect(defaultProps.onSelectNote).toHaveBeenCalledWith('note1');
  });

  test('should handle escape key', async () => {
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.click(input);
    
    // Press escape to close dropdown
    await user.keyboard('{Escape}');
    
    // Dropdown should be hidden
    expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
  });

  test('should show no results message', async () => {
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'nonexistent');
    
    expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument();
  });

  test('should handle clear history', async () => {
    const recentQueries = ['javascript'];
    mockGetRecentQueries.mockReturnValue(recentQueries);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.click(input);
    
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);
    
    expect(require('../utils/searchUtils').SearchHistory.clearHistory).toHaveBeenCalled();
  });

  test('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.click(input);
    
    // Click outside the component
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Recent Searches')).not.toBeInTheDocument();
    });
  });

  test('should display tags in search results', async () => {
    const searchResults = [
      {
        noteId: 'note1',
        title: 'JavaScript Guide',
        body: 'Learn JavaScript programming',
        tags: ['javascript', 'programming'],
        score: 100,
        matches: [{ type: 'title' as const, field: 'JavaScript Guide', indices: [] }]
      }
    ];
    mockFuzzySearch.mockReturnValue(searchResults);
    
    const user = userEvent.setup();
    render(<EnhancedSearch {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('Search notes...');
    await user.type(input, 'javascript');
    
    expect(screen.getByText('🏷️ javascript, programming')).toBeInTheDocument();
  });
}); 