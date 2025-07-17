import React, { useState, useEffect, useRef } from 'react';
import { SearchHistory, highlightSearchTerms } from '../utils/searchUtils';
import { useThemeStore } from '../store/themeStore';
import VirtualizedSearchResults from './VirtualizedSearchResults';
import { useSearchWithFeedback } from '../hooks/useSearchWithFeedback';
import SearchLoadingSpinner from './SearchLoadingSpinner';
import { SearchResult } from '../services/searchService';

interface EnhancedSearchProps {
  notes: Array<{ id: string; title: string; body: string; tags: string[] }>;
  onSearch: (query: string) => void;
  onSelectNote: (noteId: string) => void;
  placeholder?: string;
  className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  notes,
  onSearch,
  onSelectNote,
  placeholder = "Search notes...",
  className = ""
}) => {
  const { colors } = useThemeStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
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

  // Search history
  const recentQueries = SearchHistory.getRecentQueries(5);

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
            border: `1px solid ${colors.border}`,
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
      </div>

      {/* Dropdown with Virtualized Results */}
      {(showSuggestions || showHistory) && (
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
    </div>
  );
};

export default EnhancedSearch; 