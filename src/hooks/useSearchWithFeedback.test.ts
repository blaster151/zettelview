import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearchWithFeedback } from './useSearchWithFeedback';
import { useNoteStore } from '../store/noteStore';

// Mock the note store
jest.mock('../store/noteStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;

describe('useSearchWithFeedback', () => {
  const mockSearchNotes = jest.fn();
  const mockGetSearchSuggestions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockUseNoteStore.mockReturnValue({
      searchNotes: mockSearchNotes,
      getSearchSuggestions: mockGetSearchSuggestions,
      searchResults: [],
      isSearching: false
    } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useSearchWithFeedback());

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchSuggestions).toEqual([]);
  });

  test('should not show loading for empty query', async () => {
    const { result } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    act(() => {
      result.current.setQuery('');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSearching).toBe(false);
    expect(mockSearchNotes).not.toHaveBeenCalled();
  });

  test('should show loading indicator after delay for long searches', async () => {
    const { result } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    // Mock a slow search
    mockSearchNotes.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));

    act(() => {
      result.current.setQuery('test query');
    });

    // Initially not loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSearching).toBe(true);

    // Advance time to trigger loading indicator
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should now show loading
    expect(result.current.isLoading).toBe(true);

    // Wait for search to complete
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  test('should not show loading for fast searches', async () => {
    const { result } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    // Mock a fast search
    mockSearchNotes.mockResolvedValue(undefined);

    act(() => {
      result.current.setQuery('test query');
    });

    // Wait for search to complete
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    // Should not have shown loading indicator
    expect(result.current.isLoading).toBe(false);
  });

  test('should debounce search requests', async () => {
    const { result } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    mockSearchNotes.mockResolvedValue(undefined);

    // Type multiple characters quickly
    act(() => {
      result.current.setQuery('t');
    });

    act(() => {
      result.current.setQuery('te');
    });

    act(() => {
      result.current.setQuery('tes');
    });

    act(() => {
      result.current.setQuery('test');
    });

    // Should not have called search yet due to debouncing
    expect(mockSearchNotes).not.toHaveBeenCalled();

    // Advance time to trigger debounced search
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should have called search with final query
    expect(mockSearchNotes).toHaveBeenCalledWith('test', { maxResults: 50, includeBody: true });
  });

  test('should clear search state when clearing', () => {
    const { result } = renderHook(() => useSearchWithFeedback());

    act(() => {
      result.current.setQuery('test query');
    });

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.searchSuggestions).toEqual([]);
  });

  test('should handle search errors gracefully', async () => {
    const { result } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    mockSearchNotes.mockRejectedValue(new Error('Search failed'));

    act(() => {
      result.current.setQuery('test query');
    });

    // Wait for search to complete
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.results).toEqual([]);
    expect(result.current.searchSuggestions).toEqual([]);
  });

  test('should get search suggestions', async () => {
    const { result } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    const mockSuggestions = ['suggestion1', 'suggestion2'];
    mockGetSearchSuggestions.mockReturnValue(mockSuggestions);
    mockSearchNotes.mockResolvedValue(undefined);

    act(() => {
      result.current.setQuery('test query');
    });

    // Wait for search to complete
    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockGetSearchSuggestions).toHaveBeenCalledWith('test query', 5);
    expect(result.current.searchSuggestions).toEqual(mockSuggestions);
  });

  test('should use custom options', () => {
    const { result } = renderHook(() => useSearchWithFeedback({
      loadingDelay: 200,
      maxResults: 25,
      includeBody: false
    }));

    mockSearchNotes.mockResolvedValue(undefined);

    act(() => {
      result.current.setQuery('test query');
    });

    // Advance time to trigger search
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(mockSearchNotes).toHaveBeenCalledWith('test query', { maxResults: 25, includeBody: false });
  });

  test('should cleanup timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useSearchWithFeedback({ loadingDelay: 100 }));

    mockSearchNotes.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));

    act(() => {
      result.current.setQuery('test query');
    });

    // Trigger loading indicator
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Unmount should not cause any errors
    unmount();
  });
}); 