import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchHistory, highlightSearchTerms } from '../utils/searchUtils';
import { useThemeStore } from '../store/themeStore';
import VirtualizedSearchResults from './VirtualizedSearchResults';
import { useSearchWithFeedback } from '../hooks/useSearchWithFeedback';
import SearchLoadingSpinner from './SearchLoadingSpinner';
import AdvancedSearchHelp from './AdvancedSearchHelp';
import { SearchResult } from '../services/searchService';
import { advancedSearchService } from '../services/advancedSearchService';

interface EnhancedSearchProps {
  notes: Array<{ id: string; title: string; body: string; tags: string[] }>;
  onSearch: (query: string) => void;
  onSelectNote: (noteId: string) => void;
  placeholder?: string;
  className?: string;
  enableAdvancedSearch?: boolean;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  notes,
  onSearch,
  onSelectNote,
  placeholder = "Search notes...",
  className = "",
  enableAdvancedSearch = true
}) => {
  const { colors } = useThemeStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showAdvancedHelp, setShowAdvancedHelp] = useState(false);
  const [isAdvancedQuery, setIsAdvancedQuery] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [savedQueries, setSavedQueries] = useState<Array<{ id: string; name: string; query: string; createdAt: Date }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use the new search hook with loading feedback
  const {
    query,
    setQuery,
    results: searchResults,
    isLoading,
    isSearching,
    searchSuggestions: suggestions,
    clearSearch
  } = useSearchWithFeedback({
    loadingDelay: 100,
    maxResults: 50,
    includeBody: true
  });

  // Initialize advanced search service
  useEffect(() => {
    if (enableAdvancedSearch) {
      // Convert notes to the expected format
      const formattedNotes = notes.map(note => ({
        ...note,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      advancedSearchService.initialize(formattedNotes);
    }
  }, [notes, enableAdvancedSearch]);

  // Check if query contains advanced operators
  useEffect(() => {
    if (enableAdvancedSearch && query.trim()) {
      const hasAdvancedOperators = /(tag:|title:|body:|AND|OR|NOT|\(|\)|")/i.test(query);
      setIsAdvancedQuery(hasAdvancedOperators);
      
      // Validate advanced query
      if (hasAdvancedOperators) {
        const validation = advancedSearchService.validateQuery(query);
        setQueryError(validation.error || null);
      } else {
        setQueryError(null);
      }
    } else {
      setIsAdvancedQuery(false);
      setQueryError(null);
    }
  }, [query, enableAdvancedSearch]);

  // Search history
  const recentQueries = SearchHistory.getRecentQueries(5);

  // Load saved queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zettelview_saved_queries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedQueries(parsed.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt)
        })));
      } catch (error) {
        console.error('Failed to parse saved queries:', error);
      }
    }
  }, []);

  // Save queries to localStorage
  const saveQuery = useCallback((name: string, query: string) => {
    const newQuery = {
      id: Date.now().toString(),
      name,
      query,
      createdAt: new Date()
    };
    const updated = [...savedQueries, newQuery];
    setSavedQueries(updated);
    localStorage.setItem('zettelview_saved_queries', JSON.stringify(updated));
  }, [savedQueries]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selectedResult = searchResults[selectedIndex];
      if (selectedResult) {
        onSelectNote(selectedResult.noteId);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowHistory(false);
      setShowSavedQueries(false);
      setSelectedIndex(-1);
    }
  }, [searchResults, selectedIndex, onSelectNote]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (query.trim()) {
      setShowSuggestions(true);
    }
  }, [query]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  // Handle result selection
  const handleResultClick = useCallback((result: SearchResult) => {
    onSelectNote(result.noteId);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onSelectNote]);

  // Handle saved query selection
  const handleSavedQueryClick = useCallback((savedQuery: { query: string }) => {
    setQuery(savedQuery.query);
    setShowSavedQueries(false);
    inputRef.current?.focus();
  }, [setQuery]);

  // Handle save current query
  const handleSaveQuery = useCallback(() => {
    if (!query.trim()) return;
    
    const name = prompt('Enter a name for this search:');
    if (name?.trim()) {
      saveQuery(name.trim(), query);
    }
  }, [query, saveQuery]);

  // Handle clear history
  const handleClearHistory = () => {
    SearchHistory.clearHistory();
    setShowHistory(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
        setShowSavedQueries(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`enhanced-search ${className}`}
      style={{ position: 'relative' }}
      role="search"
      aria-label="Enhanced search for notes"
    >
      {/* Main search input */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${queryError ? '#dc3545' : colors.border}`,
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          aria-label="Search notes"
          aria-describedby={queryError ? 'search-error' : undefined}
          aria-expanded={showSuggestions || showHistory || showSavedQueries}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
          aria-controls="search-results"
        />
        
        {/* Search status indicator */}
        {(isLoading || isSearching) && (
          <div 
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: colors.textSecondary
            }}
            aria-live="polite"
            aria-label={isLoading ? 'Searching...' : 'Processing search...'}
          >
            {isLoading ? '⏳' : '🔍'}
          </div>
        )}

        {/* Error message */}
        {queryError && (
          <div 
            id="search-error"
            style={{
              color: '#dc3545',
              fontSize: '12px',
              marginTop: '4px'
            }}
            role="alert"
            aria-live="assertive"
          >
            {queryError}
          </div>
        )}
      </div>

      {/* Search controls */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowSavedQueries(!showSavedQueries)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer'
          }}
          aria-label={`${showSavedQueries ? 'Hide' : 'Show'} saved searches`}
          aria-expanded={showSavedQueries}
        >
          💾 Saved
        </button>
        
        <button
          onClick={handleSaveQuery}
          disabled={!query.trim()}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            background: 'transparent',
            cursor: query.trim() ? 'pointer' : 'not-allowed',
            opacity: query.trim() ? 1 : 0.5
          }}
          aria-label="Save current search"
        >
          💾 Save
        </button>

        {enableAdvancedSearch && (
          <button
            onClick={() => setShowAdvancedHelp(!showAdvancedHelp)}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: 'transparent',
              cursor: 'pointer'
            }}
            aria-label={`${showAdvancedHelp ? 'Hide' : 'Show'} advanced search help`}
            aria-expanded={showAdvancedHelp}
          >
            ❓ Help
          </button>
        )}
      </div>

      {/* Advanced search help */}
      {showAdvancedHelp && (
        <div 
          style={{
            marginTop: '8px',
            padding: '12px',
            background: '#f8f9fa',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            fontSize: '12px'
          }}
          role="region"
          aria-label="Advanced search help"
        >
          <h4 style={{ margin: '0 0 8px 0' }}>Advanced Search Syntax:</h4>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li><code>tag:javascript</code> - Search by tag</li>
            <li><code>title:meeting</code> - Search in titles only</li>
            <li><code>body:important</code> - Search in content only</li>
            <li><code>javascript AND react</code> - Both terms must match</li>
            <li><code>javascript OR typescript</code> - Either term can match</li>
            <li><code>NOT draft</code> - Exclude notes with "draft"</li>
          </ul>
        </div>
      )}

      {/* Saved queries panel */}
      {showSavedQueries && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflow: 'auto'
          }}
          role="listbox"
          aria-label="Saved searches"
        >
          {savedQueries.length === 0 ? (
            <div style={{ padding: '12px', color: colors.textSecondary }}>
              No saved searches
            </div>
          ) : (
            savedQueries.map((savedQuery) => (
              <div
                key={savedQuery.id}
                onClick={() => handleSavedQueryClick(savedQuery)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                role="option"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSavedQueryClick(savedQuery);
                  }
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{savedQuery.name}</span>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {savedQuery.query}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search results */}
      {showSuggestions && searchResults.length > 0 && (
        <div 
          id="search-results"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '300px',
            overflow: 'auto'
          }}
          role="listbox"
          aria-label="Search results"
        >
          {searchResults.map((result, index) => (
            <div
              key={result.noteId}
              onClick={() => handleResultClick(result)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: `1px solid ${colors.border}`,
                background: index === selectedIndex ? '#f0f0f0' : 'transparent'
              }}
              role="option"
              aria-selected={index === selectedIndex}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleResultClick(result);
                }
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {result.title}
              </div>
              {result.body && (
                <div style={{ 
                  fontSize: '12px', 
                  color: colors.textSecondary,
                  marginBottom: '4px'
                }}>
                  {result.body.substring(0, 100)}...
                </div>
              )}
              {result.tags.length > 0 && (
                <div style={{ fontSize: '11px', color: '#007bff' }}>
                  {result.tags.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && query.trim() && !isLoading && searchResults.length === 0 && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: `1px solid ${colors.border}`,
            borderRadius: '4px',
            padding: '12px',
            textAlign: 'center',
            color: colors.textSecondary
          }}
          role="status"
          aria-live="polite"
        >
          No notes found matching "{query}"
        </div>
      )}

      {/* Advanced Search Help Modal */}
      <AdvancedSearchHelp
        isOpen={showAdvancedHelp}
        onClose={() => setShowAdvancedHelp(false)}
      />
    </div>
  );
};

export default EnhancedSearch; 