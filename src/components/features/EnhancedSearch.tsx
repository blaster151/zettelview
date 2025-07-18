import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { useNoteStore } from '@/store/noteStore';
import SearchHistoryPanel from './SearchHistoryPanel';
import AdvancedFilters from './AdvancedFilters';
import SearchAnalytics from './SearchAnalytics';
import SearchTemplatesButton from './SearchTemplatesButton';
import EnhancedSearchSuggestions from './EnhancedSearchSuggestions';
import { SearchSuggestion } from '../../services/searchSuggestionsService';

interface EnhancedSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
  className?: string;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  onSearch,
  placeholder = "Search notes...",
  initialQuery = "",
  className = ""
}) => {
  const { colors } = useThemeStore();
  const { searchNotes } = useNoteStore();
  
  // Add refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const analyticsButtonRef = useRef<HTMLButtonElement>(null);
  
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setError(null);
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) {
      setError("Search query cannot be empty.");
      return;
    }
    onSearch(query);
    setShowSuggestions(false);
  }, [query, onSearch]);

  const handleClear = useCallback(() => {
    setQuery("");
    setShowSuggestions(false);
    setError(null);
  }, []);

  const handleInputFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    handleSearch();
  }, [handleSearch]);

  const handleSearchFromHistory = useCallback((query: string) => {
    setQuery(query);
    setShowHistory(false);
    handleSearch();
  }, [handleSearch]);

  const handleApplyFilters = useCallback((filters: any) => {
    setCurrentFilters(filters);
    setShowFilters(false);
    handleSearch();
  }, [handleSearch]);

  useEffect(() => {
    if (query.trim()) {
      const results = searchNotes(query, currentFilters);
      // setSuggestions(results); // This line is no longer needed as suggestions are handled by EnhancedSearchSuggestions
      // setSelectedSuggestionIndex(-1); // Clear selected suggestion when new results come in
    } else {
      // setSuggestions([]); // This line is no longer needed
      // setSelectedSuggestionIndex(-1);
    }
  }, [query, currentFilters, searchNotes]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        // if (showSuggestions && suggestions.length > 0) { // This block is no longer needed
        //   setSelectedSuggestionIndex(prev => 
        //     prev < suggestions.length - 1 ? prev + 1 : 0
        //   );
        // }
        break;
      case 'ArrowUp':
        e.preventDefault();
        // if (showSuggestions && suggestions.length > 0) { // This block is no longer needed
        //   setSelectedSuggestionIndex(prev => 
        //     prev > 0 ? prev - 1 : suggestions.length - 1
        //   );
        // }
        break;
      case 'Enter':
        e.preventDefault();
        // if (showSuggestions && selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) { // This block is no longer needed
        //   handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        // } else {
          handleSearch();
        // }
        break;
      case 'Escape':
        if (showSuggestions) {
          setShowSuggestions(false);
          // setSelectedSuggestionIndex(-1); // This line is no longer needed
        } else if (showHistory) {
          setShowHistory(false);
        } else if (showFilters) {
          setShowFilters(false);
        } else if (showAnalytics) {
          setShowAnalytics(false);
        }
        break;
      case 'Tab':
        // Handle tab navigation between search input and buttons
        if (e.shiftKey) {
          // Shift+Tab - move backwards
          if (document.activeElement === searchInputRef.current) {
            e.preventDefault();
            analyticsButtonRef.current?.focus();
          } else if (document.activeElement === analyticsButtonRef.current) {
            e.preventDefault();
            filtersButtonRef.current?.focus();
          } else if (document.activeElement === filtersButtonRef.current) {
            e.preventDefault();
            historyButtonRef.current?.focus();
          }
        } else {
          // Tab - move forwards
          if (document.activeElement === historyButtonRef.current) {
            e.preventDefault();
            filtersButtonRef.current?.focus();
          } else if (document.activeElement === filtersButtonRef.current) {
            e.preventDefault();
            analyticsButtonRef.current?.focus();
          } else if (document.activeElement === analyticsButtonRef.current) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
        }
        break;
    }
  }, [showSuggestions, // suggestions, selectedSuggestionIndex, // These are no longer needed
    showHistory, showFilters, showAnalytics, handleSuggestionSelect, handleSearch]);

  // Focus management for suggestions
  useEffect(() => {
    // if (showSuggestions && suggestions.length > 0) { // This block is no longer needed
    //   // Focus the selected suggestion
    //   const suggestionElements = suggestionsRef.current?.querySelectorAll('[role="option"]');
    //   if (suggestionElements && selectedSuggestionIndex >= 0) {
    //     (suggestionElements[selectedSuggestionIndex] as HTMLElement)?.focus();
    //   }
    // }
  }, [showSuggestions]); // suggestions, selectedSuggestionIndex are no longer needed

  return (
    <div style={{ position: 'relative', width: '100%' }} className={className}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        gap: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      role="search"
      aria-label="Search notes"
      >
        <span style={{ color: colors.textSecondary, fontSize: '16px' }}>🔍</span>
        
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: colors.text,
            fontSize: '14px'
          }}
          aria-label="Search query input"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-controls="search-suggestions"
          aria-activedescendant={/*selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined*/} undefined
          tabIndex={0}
        />
        
        {query && (
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '4px',
              borderRadius: '4px'
            }}
            aria-label="Clear search query"
            tabIndex={0}
          >
            ×
          </button>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '4px' }}
        role="toolbar"
        aria-label="Search actions"
        >
          <SearchTemplatesButton
            onApplyTemplate={(template) => {
              setQuery(template.query);
              setCurrentFilters(template.filters);
              handleSearch();
            }}
            currentFilters={currentFilters}
          />
          
          <button
            ref={historyButtonRef}
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '6px 8px',
              background: showHistory ? colors.primary : 'transparent',
              color: showHistory ? 'white' : colors.textSecondary,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            aria-label="Show search history"
            aria-pressed={showHistory}
            tabIndex={0}
          >
            📜
          </button>
          
          <button
            ref={filtersButtonRef}
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '6px 8px',
              background: showFilters ? colors.primary : 'transparent',
              color: showFilters ? 'white' : colors.textSecondary,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            aria-label="Show advanced filters"
            aria-pressed={showFilters}
            tabIndex={0}
          >
            🔧
          </button>
          
          <button
            ref={analyticsButtonRef}
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              padding: '6px 8px',
              background: showAnalytics ? colors.primary : 'transparent',
              color: showAnalytics ? 'white' : colors.textSecondary,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            aria-label="Show search analytics"
            aria-pressed={showAnalytics}
            tabIndex={0}
          >
            📊
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          color: colors.error,
          fontSize: '12px',
          marginTop: '4px',
          padding: '4px 8px',
          background: colors.errorBackground,
          borderRadius: '4px'
        }}
        role="alert"
        aria-live="polite"
        >
          ⚠️ {error}
        </div>
      )}

      {/* Enhanced Search Suggestions */}
      <EnhancedSearchSuggestions
        query={query}
        isVisible={showSuggestions}
        onSuggestionSelect={handleSuggestionSelect}
        onClose={() => setShowSuggestions(false)}
        maxSuggestions={8}
      />

      {/* Search History Panel */}
      {showHistory && (
        <SearchHistoryPanel
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onSearch={handleSearchFromHistory}
        />
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <AdvancedFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={handleApplyFilters}
          initialFilters={currentFilters}
        />
      )}

      {/* Search Analytics */}
      {showAnalytics && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          marginTop: '4px',
          padding: '16px',
          minWidth: '300px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}
        role="dialog"
        aria-label="Search analytics"
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h3 style={{
              margin: 0,
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              📊 Search Analytics
            </h3>
            <button
              onClick={() => setShowAnalytics(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textSecondary,
                fontSize: '12px'
              }}
              aria-label="Close search analytics"
              tabIndex={0}
            >
              ×
            </button>
          </div>
          
          <SearchAnalytics />
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch; 