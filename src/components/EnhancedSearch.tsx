import React, { useState, useEffect, useRef } from 'react';
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
  const saveQueriesToStorage = (queries: typeof savedQueries) => {
    localStorage.setItem('zettelview_saved_queries', JSON.stringify(queries));
  };

  // Add saved query
  const addSavedQuery = (name: string, query: string) => {
    const newQuery = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      query,
      createdAt: new Date()
    };
    const updatedQueries = [...savedQueries, newQuery];
    setSavedQueries(updatedQueries);
    saveQueriesToStorage(updatedQueries);
  };

  // Remove saved query
  const removeSavedQuery = (id: string) => {
    const updatedQueries = savedQueries.filter(q => q.id !== id);
    setSavedQueries(updatedQueries);
    saveQueriesToStorage(updatedQueries);
  };

  // Check if current query is saved
  const isCurrentQuerySaved = savedQueries.some(q => q.query === query);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedIndex(-1);
    setShowSuggestions(newQuery.trim().length > 0);
    setShowHistory(false);
    onSearch(newQuery);
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (query.trim()) {
      setShowSuggestions(true);
    } else {
      setShowHistory(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding to allow for clicks on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = [...suggestions, ...searchResults];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const item = items[selectedIndex];
          if (selectedIndex < suggestions.length) {
            // It's a suggestion
            const suggestion = item as string;
            setQuery(suggestion);
            onSearch(suggestion);
          } else {
            // It's a search result
            const resultIndex = selectedIndex - suggestions.length;
            const result = searchResults[resultIndex];
            onSelectNote(result.noteId);
          }
        }
        setShowSuggestions(false);
        setShowHistory(false);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setShowHistory(false);
        inputRef.current?.blur();
        break;
      case 'F1':
        if (enableAdvancedSearch) {
          e.preventDefault();
          setShowAdvancedHelp(true);
        }
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle history item click
  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    onSearch(historyQuery);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  // Handle search result click
  const handleResultClick = (result: SearchResult) => {
    onSelectNote(result.noteId);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
          style={{
            width: '100%',
            padding: '8px 12px',
            paddingRight: isLoading ? '40px' : '12px', // Make room for spinner
            border: `1px solid ${queryError ? '#e74c3c' : colors.border}`,
            borderRadius: '4px',
            fontSize: '14px',
            background: colors.background,
            color: colors.text,
            transition: 'all 0.2s ease'
          }}
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}>
            <SearchLoadingSpinner size="small" showText={false} />
          </div>
        )}

        {/* Advanced search indicator */}
        {enableAdvancedSearch && isAdvancedQuery && !queryError && (
          <div style={{
            position: 'absolute',
            right: isLoading ? '40px' : '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: colors.primary,
            fontWeight: '600',
            pointerEvents: 'none'
          }}>
            ⚡
          </div>
        )}
      </div>

      {/* Query error message */}
      {queryError && (
        <div style={{
          marginTop: '4px',
          padding: '6px 8px',
          background: '#fee',
          border: '1px solid #e74c3c',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#e74c3c'
        }}>
          {queryError}
        </div>
      )}

              {/* Search controls */}
        <div style={{
          marginTop: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: colors.textSecondary
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {enableAdvancedSearch && (
              <>
                <span>Press F1 for advanced search help</span>
                <button
                  onClick={() => setShowAdvancedHelp(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primary,
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline'
                  }}
                >
                  Advanced Search
                </button>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Save query button */}
            {query.trim() && !isCurrentQuerySaved && (
              <button
                onClick={() => {
                  const name = prompt('Enter a name for this saved query:');
                  if (name?.trim()) {
                    addSavedQuery(name.trim(), query);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
                title="Save current query"
              >
                💾 Save
              </button>
            )}
            
            {/* Saved queries toggle */}
            {savedQueries.length > 0 && (
              <button
                onClick={() => {
                  setShowSavedQueries(!showSavedQueries);
                  setShowSuggestions(false);
                  setShowHistory(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
                title="Show saved queries"
              >
                📚 Saved ({savedQueries.length})
              </button>
            )}
          </div>
        </div>

      {/* Dropdown with Virtualized Results */}
      {(showSuggestions || showHistory || showSavedQueries) && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxHeight: '400px',
          overflow: 'hidden'
        }}>
          {/* Search History */}
          {showHistory && recentQueries.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: colors.textSecondary,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                Recent Searches
                <button
                  onClick={handleClearHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear
                </button>
              </div>
              {recentQueries.map((historyQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(historyQuery)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: '14px',
                    borderBottom: `1px solid ${colors.border}`,
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  🔍 {historyQuery}
                </button>
              ))}
            </div>
          )}

          {/* Saved Queries */}
          {showSavedQueries && savedQueries.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: colors.textSecondary,
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                Saved Queries
                <button
                  onClick={() => setShowSavedQueries(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Close
                </button>
              </div>
              {savedQueries.map((savedQuery) => (
                <div
                  key={savedQuery.id}
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <button
                    onClick={() => {
                      setQuery(savedQuery.query);
                      onSearch(savedQuery.query);
                      setShowSavedQueries(false);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: colors.text,
                      fontSize: '14px',
                      flex: 1
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{savedQuery.name}</div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      {savedQuery.query}
                    </div>
                  </button>
                  <button
                    onClick={() => removeSavedQuery(savedQuery.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e74c3c',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '4px'
                    }}
                    title="Remove saved query"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: colors.textSecondary,
                borderBottom: `1px solid ${colors.border}`
              }}>
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: selectedIndex === index ? colors.surfaceActive : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: '14px',
                    borderBottom: `1px solid ${colors.border}`,
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedIndex === index ? colors.surfaceActive : 'transparent';
                  }}
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator for search results */}
          {isSearching && !isLoading && (
            <div style={{
              padding: '12px',
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: '14px'
            }}>
              <SearchLoadingSpinner size="small" showText={true} />
            </div>
          )}

          {/* Virtualized Search Results */}
          {showSuggestions && searchResults.length > 0 && !isSearching && (
            <div>
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: colors.textSecondary,
                borderBottom: `1px solid ${colors.border}`
              }}>
                Results ({searchResults.length})
              </div>
              <div style={{ height: '300px' }}>
                <VirtualizedSearchResults
                  results={searchResults}
                  selectedIndex={Math.max(0, selectedIndex - suggestions.length)}
                  onSelectResult={handleResultClick}
                  height={300}
                  itemHeight={100}
                />
              </div>
            </div>
          )}

          {/* No results */}
          {showSuggestions && query.trim() && suggestions.length === 0 && searchResults.length === 0 && !isSearching && (
            <div style={{
              padding: '12px',
              textAlign: 'center',
              color: colors.textSecondary,
              fontSize: '14px'
            }}>
              No results found for "{query}"
            </div>
          )}
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