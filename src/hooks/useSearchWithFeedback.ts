import { useState, useEffect, useCallback, useRef } from 'react';
import { useNoteStore } from '../store/noteStore';
import { SearchResult } from '../services/searchService';
import { AdvancedQueryParser } from '../services/advancedQueryParser';

interface UseSearchWithFeedbackOptions {
  loadingDelay?: number; // Delay before showing loading indicator (default: 100ms)
  maxResults?: number;
  includeBody?: boolean;
  enableAdvancedSearch?: boolean;
}

interface UseSearchWithFeedbackReturn {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  isSearching: boolean; // True when search is in progress
  searchSuggestions: string[];
  isAdvancedQuery: boolean;
  queryError: string | null;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearchWithFeedback = (
  options: UseSearchWithFeedbackOptions = {}
): UseSearchWithFeedbackReturn => {
  const {
    loadingDelay = 100,
    maxResults = 50,
    includeBody = true,
    enableAdvancedSearch = true
  } = options;

  const { 
    searchNotes, 
    getSearchSuggestions, 
    advancedSearch, 
    validateAdvancedQuery, 
    getAdvancedSearchSuggestions 
  } = useNoteStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [isAdvancedQuery, setIsAdvancedQuery] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

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

  // Check if query contains advanced operators
  const checkAdvancedQuery = useCallback((searchQuery: string) => {
    if (!enableAdvancedSearch || !searchQuery.trim()) {
      return false;
    }
    return /(tag:|title:|body:|AND|OR|NOT|\(|\)|")/i.test(searchQuery);
  }, [enableAdvancedSearch]);

  // Perform search with loading feedback
  const performSearch = useCallback(async (searchQuery: string) => {
    clearTimeouts();

    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setIsSearching(false);
      setSearchSuggestions([]);
      setIsAdvancedQuery(false);
      setQueryError(null);
      return;
    }

    setIsSearching(true);

    // Check if this is an advanced query
    const isAdvanced = checkAdvancedQuery(searchQuery);
    setIsAdvancedQuery(isAdvanced);

    // Validate advanced query if needed
    if (isAdvanced) {
      const validation = validateAdvancedQuery(searchQuery);
      setQueryError(validation.error || null);
      
      if (!validation.isValid) {
        setIsLoading(false);
        setIsSearching(false);
        setResults([]);
        return;
      }
    } else {
      setQueryError(null);
    }

    // Start loading indicator after delay
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(true);
    }, loadingDelay);

    try {
      // Perform the appropriate search
      if (isAdvanced) {
        await advancedSearch(searchQuery, { maxResults, includeBody });
      } else {
        await searchNotes(searchQuery, { maxResults, includeBody });
      }
      
      // Get search suggestions
      const suggestions = isAdvanced 
        ? getAdvancedSearchSuggestions(searchQuery)
        : getSearchSuggestions(searchQuery, 5);
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
  }, [
    searchNotes, 
    getSearchSuggestions, 
    advancedSearch, 
    validateAdvancedQuery, 
    getAdvancedSearchSuggestions, 
    maxResults, 
    includeBody, 
    loadingDelay, 
    clearTimeouts, 
    checkAdvancedQuery
  ]);

  // Debounced search for real-time input
  const debouncedSearch = useCallback((searchQuery: string) => {
    clearTimeouts();
    
    if (!searchQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setIsSearching(false);
      setSearchSuggestions([]);
      setIsAdvancedQuery(false);
      setQueryError(null);
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
    setIsAdvancedQuery(false);
    setQueryError(null);
  }, [clearTimeouts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Listen to search results from store
  useEffect(() => {
    // Get the current search results from the store
    const currentResults = useNoteStore.getState().searchResults;
    setResults(currentResults);

    // Subscribe to future changes
    const unsubscribe = useNoteStore.subscribe((state) => {
      setResults(state.searchResults);
    });

    return unsubscribe;
  }, []);

  return {
    query,
    setQuery: updateQuery,
    results,
    isLoading,
    isSearching,
    searchSuggestions,
    isAdvancedQuery,
    queryError,
    performSearch,
    clearSearch
  };
}; 