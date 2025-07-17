import { useState, useEffect, useCallback, useRef } from 'react';
import { useNoteStore } from '../store/noteStore';
import { SearchResult } from '../services/searchService';

interface UseSearchWithFeedbackOptions {
  loadingDelay?: number; // Delay before showing loading indicator (default: 100ms)
  maxResults?: number;
  includeBody?: boolean;
}

interface UseSearchWithFeedbackReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  isSearching: boolean; // True when search is in progress
  searchSuggestions: string[];
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearchWithFeedback = (
  options: UseSearchWithFeedbackOptions = {}
): UseSearchWithFeedbackReturn => {
  const {
    loadingDelay = 100,
    maxResults = 50,
    includeBody = true
  } = options;

  const { searchNotes, getSearchSuggestions } = useNoteStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any existing timeouts
  const clearTimeouts = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  // Perform search with loading feedback
  const performSearch = useCallback(async (searchQuery: string) => {
    clearTimeouts();

    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setIsSearching(false);
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);

    // Start loading indicator after delay
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
    }, loadingDelay);

    try {
      // Perform the search
      await searchNotes(searchQuery, { maxResults, includeBody });
      
      // Get search suggestions
      const suggestions = getSearchSuggestions(searchQuery, 5);
      setSearchSuggestions(suggestions);

      // Clear loading state
      setIsLoading(false);
      setIsSearching(false);
    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
      setIsSearching(false);
      setResults([]);
      setSearchSuggestions([]);
    }
  }, [searchNotes, getSearchSuggestions, maxResults, includeBody, loadingDelay, clearTimeouts]);

  // Debounced search for real-time input
  const debouncedSearch = useCallback((searchQuery: string) => {
    clearTimeouts();
    
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setIsSearching(false);
      setSearchSuggestions([]);
      return;
    }

    // Debounce search to avoid too many requests
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 150); // 150ms debounce
  }, [performSearch, clearTimeouts]);

  // Update query and trigger search
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    debouncedSearch(newQuery);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    clearTimeouts();
    setQuery('');
    setResults([]);
    setIsLoading(false);
    setIsSearching(false);
    setSearchSuggestions([]);
  }, [clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Listen to search results from store
  useEffect(() => {
    const unsubscribe = useNoteStore.subscribe(
      (state) => state.searchResults,
      (searchResults) => {
        setResults(searchResults);
      }
    );

    return unsubscribe;
  }, []);

  return {
    query,
    setQuery: updateQuery,
    results,
    isLoading,
    isSearching,
    searchSuggestions,
    performSearch,
    clearSearch
  };
}; 