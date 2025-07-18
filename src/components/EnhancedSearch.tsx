import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchHistory, highlightSearchTerms } from '../utils/searchUtils';
import { useThemeStore } from '../store/themeStore';
import VirtualizedSearchResults from './VirtualizedSearchResults';
import { useSearchWithFeedback } from '../hooks/useSearchWithFeedback';
import SearchLoadingSpinner from './SearchLoadingSpinner';
import AdvancedSearchHelp from './AdvancedSearchHelp';
import SearchHistoryButton from './features/SearchHistoryButton';
import SearchHistoryPanel from './features/SearchHistoryPanel';
import { SearchResult } from '../services/searchService';
import { advancedSearchService } from '../services/advancedSearchService';
import SearchAnalytics from './features/SearchAnalytics';

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
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
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

  // Handle search from history
  const handleSearchFromHistory = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    onSearch(historyQuery);
    setShowHistory(false);
    inputRef.current?.focus();
  }, [setQuery, onSearch]);

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
    <>
      <div 
        ref={containerRef}
        className={`enhanced-search ${className}`}
        style={{ position: 'relative' }}
        role="search"
        aria-label="Enhanced search for notes"
      >
        {/* Main search input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          background: colors.background,
          padding: '4px'
        }}>
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
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: colors.text,
              fontSize: '14px',
              padding: '8px 12px',
              outline: 'none'
            }}
            aria-label="Search notes input"
            aria-autocomplete="list"
            aria-controls="search-suggestions-list"
            aria-expanded={showSuggestions}
            aria-describedby={queryError ? 'search-error' : undefined}
            role="combobox"
          />

          {/* Search history button */}
          <SearchHistoryButton
            onSearch={handleSearchFromHistory}
            size="small"
            showCount={true}
            aria-label="Open search history dropdown"
          />

          {/* Advanced search indicator */}
          {isAdvancedQuery && (
            <div style={{
              padding: '4px 8px',
              background: colors.info,
              color: 'white',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
            aria-label="Advanced search mode enabled"
            >
              ADV
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && <SearchLoadingSpinner size="small" aria-label="Searching..." />}

          {/* Clear button */}
          {query && (
            <button
              onClick={clearSearch}
              style={{
                background: 'none',
                border: 'none',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              aria-label="Clear search input"
            >
              ✕
            </button>
          )}

          {/* Search button */}
          <button
            onClick={() => onSearch(query)}
            style={{
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            aria-label="Perform search"
          >
            Search
          </button>
        </div>

        {/* Compact Search Analytics */}
        <div style={{ margin: '12px 0' }}>
          <SearchAnalytics style={{ padding: '8px', fontSize: '12px' }} aria-label="Search analytics summary" />
        </div>

        {/* Error message */}
        {queryError && (
          <div id="search-error" style={{
            color: colors.error,
            fontSize: '12px',
            marginTop: '4px',
            padding: '4px 8px',
            background: colors.surface,
            borderRadius: '4px'
          }}
          role="alert"
          aria-live="assertive"
          >
            ⚠️ {queryError}
          </div>
        )}

        {/* Dropdown */}
        {(showSuggestions || showHistory || showSavedQueries) && (
          <div
            id="search-suggestions-list"
            role="listbox"
            aria-label="Search suggestions and history"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              marginTop: '4px',
              maxHeight: '400px',
              overflow: 'auto',
              zIndex: 1000
            }}
          >
            {/* Search suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: colors.textSecondary,
                  fontWeight: 'bold'
                }}>
                  Suggestions
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      onSearch(suggestion);
                      setShowSuggestions(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: colors.text,
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    🔍 {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Search history */}
            {showHistory && recentQueries.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: colors.textSecondary,
                  fontWeight: 'bold',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Recent Searches</span>
                  <button
                    onClick={() => setShowHistoryPanel(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.primary,
                      cursor: 'pointer',
                      fontSize: '11px',
                      textDecoration: 'underline'
                    }}
                  >
                    View all
                  </button>
                </div>
                {recentQueries.map((historyQuery, index) => (
                  <button
                    key={historyQuery}
                    onClick={() => handleSearchFromHistory(historyQuery)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: colors.text,
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    🕒 {historyQuery}
                  </button>
                ))}
                <div style={{
                  padding: '8px 16px',
                  borderTop: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <button
                    onClick={handleClearHistory}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    Clear history
                  </button>
                </div>
              </div>
            )}

            {/* Saved queries */}
            {showSavedQueries && savedQueries.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: colors.textSecondary,
                  fontWeight: 'bold'
                }}>
                  Saved Queries
                </div>
                {savedQueries.map((savedQuery) => (
                  <button
                    key={savedQuery.id}
                    onClick={() => handleSavedQueryClick(savedQuery)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: colors.text,
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    💾 {savedQuery.name}
                    <div style={{
                      fontSize: '11px',
                      color: colors.textSecondary,
                      marginTop: '2px'
                    }}>
                      {savedQuery.query}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Search results */}
            {showSuggestions && searchResults.length > 0 && (
              <div style={{ padding: '8px 0' }}>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  color: colors.textSecondary,
                  fontWeight: 'bold'
                }}>
                  Results ({searchResults.length})
                </div>
                <VirtualizedSearchResults
                  results={searchResults}
                  onSelectResult={handleResultClick}
                  selectedIndex={selectedIndex}
                  height={200}
                />
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '4px 8px',
              background: showHistory ? colors.primary : colors.surface,
              color: showHistory ? 'white' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🕒 History
          </button>

          <button
            onClick={() => setShowSavedQueries(!showSavedQueries)}
            style={{
              padding: '4px 8px',
              background: showSavedQueries ? colors.primary : colors.surface,
              color: showSavedQueries ? 'white' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            💾 Saved
          </button>

          {query && (
            <button
              onClick={handleSaveQuery}
              style={{
                padding: '4px 8px',
                background: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Save Query
            </button>
          )}

          {enableAdvancedSearch && (
            <button
              onClick={() => setShowAdvancedHelp(!showAdvancedHelp)}
              style={{
                padding: '4px 8px',
                background: showAdvancedHelp ? colors.info : colors.surface,
                color: showAdvancedHelp ? 'white' : colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Advanced Help
            </button>
          )}
        </div>

        {/* Advanced search help */}
        {showAdvancedHelp && (
          <AdvancedSearchHelp
            isOpen={showAdvancedHelp}
            onClose={() => setShowAdvancedHelp(false)}
          />
        )}
      </div>

      {/* Full search history panel */}
      <SearchHistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onSearch={handleSearchFromHistory}
      />
    </>
  );
};

export default EnhancedSearch; 