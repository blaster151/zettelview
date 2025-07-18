import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchHistoryPanel from './SearchHistoryPanel';
import { SearchHistory } from '../../services/searchService';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';

// Mock the stores
jest.mock('../../store/themeStore');
jest.mock('../../store/noteStore');
jest.mock('../../services/searchService');

const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;
const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockSearchHistory = SearchHistory as jest.Mocked<typeof SearchHistory>;

describe('SearchHistoryPanel', () => {
  const mockColors = {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceHover: '#e9ecef',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#dee2e6',
    primary: '#007bff',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    success: '#28a745'
  };

  const mockHistory = [
    { query: 'javascript', timestamp: Date.now() - 1000, resultCount: 5 },
    { query: 'react', timestamp: Date.now() - 2000, resultCount: 3 },
    { query: 'typescript', timestamp: Date.now() - 3000, resultCount: 7 }
  ];

  beforeEach(() => {
    mockUseThemeStore.mockReturnValue({ colors: mockColors });
    mockUseNoteStore.mockReturnValue({ searchNotes: jest.fn() });
    mockSearchHistory.getHistory.mockReturnValue(mockHistory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    expect(screen.getByText('🔍 Search History')).toBeInTheDocument();
    expect(screen.getByText('Search Analytics')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={false}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    expect(screen.queryByText('🔍 Search History')).not.toBeInTheDocument();
  });

  it('displays search history items', () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
  });

  it('calls onSearch when clicking a history item', () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    fireEvent.click(screen.getByText('javascript'));
    
    expect(onSearch).toHaveBeenCalledWith('javascript');
    expect(onClose).toHaveBeenCalled();
  });

  it('filters history by search term', async () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    const filterInput = screen.getByPlaceholderText('Filter history...');
    fireEvent.change(filterInput, { target: { value: 'javascript' } });

    await waitFor(() => {
      expect(screen.getByText('javascript')).toBeInTheDocument();
      expect(screen.queryByText('react')).not.toBeInTheDocument();
      expect(screen.queryByText('typescript')).not.toBeInTheDocument();
    });
  });

  it('displays analytics information', () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument(); // Total searches
    expect(screen.getByText('3')).toBeInTheDocument(); // Unique queries
    expect(screen.getByText('5')).toBeInTheDocument(); // Average results
  });

  it('handles empty history', () => {
    mockSearchHistory.getHistory.mockReturnValue([]);
    
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    expect(screen.getByText('No search history')).toBeInTheDocument();
  });

  it('calls onClose when clicking close button', () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    const closeButton = screen.getByLabelText('Close search history panel');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('sorts history by different criteria', async () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    const sortSelect = screen.getByDisplayValue('Most recent');
    fireEvent.change(sortSelect, { target: { value: 'results' } });

    await waitFor(() => {
      expect(sortSelect).toHaveValue('results');
    });
  });

  it('filters by date range', async () => {
    const onClose = jest.fn();
    const onSearch = jest.fn();

    render(
      <SearchHistoryPanel
        isOpen={true}
        onClose={onClose}
        onSearch={onSearch}
      />
    );

    const dateSelect = screen.getByDisplayValue('All time');
    fireEvent.change(dateSelect, { target: { value: 'today' } });

    await waitFor(() => {
      expect(dateSelect).toHaveValue('today');
    });
  });
}); 