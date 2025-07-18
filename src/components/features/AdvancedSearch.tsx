import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface SearchFilter {
  field: 'title' | 'body' | 'tags' | 'all';
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
  value: string;
}

interface SavedQuery {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter[];
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

interface SearchResult {
  noteId: string;
  title: string;
  body: string;
  tags: string[];
  score: number;
  matches: {
    field: string;
    snippet: string;
    highlights: number[];
  }[];
}

interface AdvancedSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ isOpen, onClose, onSelectNote }) => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });

  // Load saved queries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zettelview_saved_queries');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedQueries(parsed.map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
          lastUsed: new Date(q.lastUsed)
        })));
      } catch (error) {
        loggingService.error('Failed to load saved queries', error as Error);
      }
    }
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('zettelview_search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        loggingService.error('Failed to load search history', error as Error);
      }
    }
  }, []);

  // Save queries to localStorage
  const saveQueriesToStorage = useCallback((queries: SavedQuery[]) => {
    localStorage.setItem('zettelview_saved_queries', JSON.stringify(queries));
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = useCallback((history: string[]) => {
    localStorage.setItem('zettelview_search_history', JSON.stringify(history));
  }, []);

  // Add to search history
  const addToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const newHistory = [searchQuery, ...searchHistory.filter(q => q !== searchQuery)].slice(0, 20);
    setSearchHistory(newHistory);
    saveHistoryToStorage(newHistory);
  }, [searchHistory, saveHistoryToStorage]);

  // Save current search as query
  const saveCurrentSearch = useCallback(() => {
    const name = prompt('Enter a name for this search:');
    if (!name?.trim()) return;
    
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: name.trim(),
      query,
      filters,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1
    };
    
    const updated = [newQuery, ...savedQueries];
    setSavedQueries(updated);
    saveQueriesToStorage(updated);
    
    loggingService.info('Saved search query', { name: newQuery.name });
  }, [query, filters, savedQueries, saveQueriesToStorage]);

  // Load saved query
  const loadSavedQuery = useCallback((savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
    setFilters(savedQuery.filters);
    
    // Update usage stats
    const updated = savedQueries.map(q => 
      q.id === savedQuery.id 
        ? { ...q, lastUsed: new Date(), useCount: q.useCount + 1 }
        : q
    );
    setSavedQueries(updated);
    saveQueriesToStorage(updated);
    
    setShowSavedQueries(false);
  }, [savedQueries, saveQueriesToStorage]);

  // Delete saved query
  const deleteSavedQuery = useCallback((queryId: string) => {
    const updated = savedQueries.filter(q => q.id !== queryId);
    setSavedQueries(updated);
    saveQueriesToStorage(updated);
  }, [savedQueries, saveQueriesToStorage]);

  // Add filter
  const addFilter = useCallback(() => {
    const newFilter: SearchFilter = {
      field: 'all',
      operator: 'contains',
      value: ''
    };
    setFilters([...filters, newFilter]);
  }, [filters]);

  // Update filter
  const updateFilter = useCallback((index: number, updates: Partial<SearchFilter>) => {
    const updated = filters.map((filter, i) => 
      i === index ? { ...filter, ...updates } : filter
    );
    setFilters(updated);
  }, [filters]);

  // Remove filter
  const removeFilter = useCallback((index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  }, [filters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!query.trim() && filters.length === 0) return;
    
    setIsSearching(true);
    addToHistory(query);
    
    try {
      const searchResults = await PerformanceUtils.measureAsync(
        'advanced_search',
        () => executeSearch(query, filters, notes, dateRange, sortBy, sortOrder)
      );
      
      setResults(searchResults);
      
      loggingService.info('Advanced search completed', { 
        query, 
        filters: filters.length,
        results: searchResults.length 
      });
    } catch (error) {
      loggingService.error('Advanced search failed', error as Error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, filters, notes, dateRange, sortBy, sortOrder, addToHistory]);

  // Execute search logic
  const executeSearch = (
    searchQuery: string,
    searchFilters: SearchFilter[],
    allNotes: any[],
    dateFilter: { start: Date | null; end: Date | null },
    sortField: string,
    sortDirection: string
  ): SearchResult[] => {
    let filteredNotes = allNotes;

    // Apply date range filter
    if (dateFilter.start || dateFilter.end) {
      filteredNotes = filteredNotes.filter(note => {
        const noteDate = new Date(note.createdAt);
        if (dateFilter.start && noteDate < dateFilter.start) return false;
        if (dateFilter.end && noteDate > dateFilter.end) return false;
        return true;
      });
    }

    // Apply search filters
    searchFilters.forEach(filter => {
      filteredNotes = filteredNotes.filter(note => {
        const fieldValue = filter.field === 'all' 
          ? `${note.title} ${note.body} ${note.tags.join(' ')}`
          : note[filter.field];
        
        const searchValue = filter.value.toLowerCase();
        const fieldValueLower = fieldValue.toLowerCase();
        
        switch (filter.operator) {
          case 'contains':
            return fieldValueLower.includes(searchValue);
          case 'equals':
            return fieldValueLower === searchValue;
          case 'starts_with':
            return fieldValueLower.startsWith(searchValue);
          case 'ends_with':
            return fieldValueLower.endsWith(searchValue);
          case 'regex':
            try {
              const regex = new RegExp(searchValue, 'i');
              return regex.test(fieldValue);
            } catch {
              return false;
            }
          default:
            return true;
        }
      });
    });

    // Apply main query
    if (searchQuery.trim()) {
      const queryTerms = searchQuery.toLowerCase().split(/\s+/);
      filteredNotes = filteredNotes.filter(note => {
        const searchableText = `${note.title} ${note.body} ${note.tags.join(' ')}`.toLowerCase();
        return queryTerms.every(term => searchableText.includes(term));
      });
    }

    // Convert to search results with scoring
    const searchResults: SearchResult[] = filteredNotes.map(note => {
      const searchableText = `${note.title} ${note.body} ${note.tags.join(' ')}`.toLowerCase();
      const queryTerms = searchQuery.toLowerCase().split(/\s+/);
      
      let score = 0;
      const matches: SearchResult['matches'] = [];
      
      // Calculate relevance score
      queryTerms.forEach(term => {
        const titleMatches = (note.title.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const bodyMatches = (note.body.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const tagMatches = note.tags.filter(tag => tag.toLowerCase().includes(term)).length;
        
        score += titleMatches * 3 + bodyMatches + tagMatches * 2;
      });
      
      // Add match details
      if (queryTerms.length > 0) {
        const firstTerm = queryTerms[0];
        const bodyIndex = note.body.toLowerCase().indexOf(firstTerm);
        if (bodyIndex >= 0) {
          const snippet = note.body.substring(Math.max(0, bodyIndex - 50), bodyIndex + 100);
          matches.push({
            field: 'body',
            snippet: snippet.length < note.body.length ? snippet + '...' : snippet,
            highlights: [bodyIndex]
          });
        }
      }
      
      return {
        noteId: note.id,
        title: note.title,
        body: note.body,
        tags: note.tags,
        score,
        matches
      };
    });

    // Sort results
    searchResults.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'relevance':
          comparison = b.score - a.score;
          break;
        case 'date':
          const aDate = new Date(allNotes.find(n => n.id === a.noteId)?.createdAt || 0);
          const bDate = new Date(allNotes.find(n => n.id === b.noteId)?.createdAt || 0);
          comparison = bDate.getTime() - aDate.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return searchResults;
  };

  // Handle result selection
  const handleResultClick = useCallback((noteId: string) => {
    onSelectNote(noteId);
    onClose();
  }, [onSelectNote, onClose]);

  // Handle history item click
  const handleHistoryClick = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '1000px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>Advanced Search</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close advanced search"
          >
            ×
          </button>
        </div>

        {/* Search Controls */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          {/* Main Search Input */}
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter search query..."
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '16px',
                background: colors.background,
                color: colors.text
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  performSearch();
                }
              }}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={performSearch}
            disabled={isSearching}
            style={{
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              opacity: isSearching ? 0.6 : 1
            }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Options */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {/* Sort Options */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: colors.textSecondary }}>
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text
              }}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: colors.textSecondary }}>
              Order:
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              style={{
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text
              }}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: colors.textSecondary }}>
              Date Range:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="date"
                value={dateRange.start?.toISOString().split('T')[0] || ''}
                onChange={(e) => setDateRange(prev => ({ 
                  ...prev, 
                  start: e.target.value ? new Date(e.target.value) : null 
                }))}
                style={{
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text
                }}
              />
              <span style={{ color: colors.textSecondary, alignSelf: 'center' }}>to</span>
              <input
                type="date"
                value={dateRange.end?.toISOString().split('T')[0] || ''}
                onChange={(e) => setDateRange(prev => ({ 
                  ...prev, 
                  end: e.target.value ? new Date(e.target.value) : null 
                }))}
                style={{
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowSavedQueries(!showSavedQueries)}
            style={{
              padding: '8px 16px',
              background: showSavedQueries ? colors.primary : colors.surface,
              color: showSavedQueries ? 'white' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            💾 Saved Queries ({savedQueries.length})
          </button>
          
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 16px',
              background: showHistory ? colors.primary : colors.surface,
              color: showHistory ? 'white' : colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📜 History ({searchHistory.length})
          </button>
          
          <button
            onClick={saveCurrentSearch}
            disabled={!query.trim() && filters.length === 0}
            style={{
              padding: '8px 16px',
              background: colors.surface,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: (!query.trim() && filters.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (!query.trim() && filters.length === 0) ? 0.5 : 1
            }}
          >
            💾 Save Search
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <h4 style={{ margin: 0, color: colors.text }}>Filters ({filters.length})</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={addFilter}
                style={{
                  padding: '4px 8px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                + Add Filter
              </button>
              <button
                onClick={clearFilters}
                disabled={filters.length === 0}
                style={{
                  padding: '4px 8px',
                  background: colors.surface,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  cursor: filters.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  opacity: filters.length === 0 ? 0.5 : 1
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          {filters.map((filter, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <select
                value={filter.field}
                onChange={(e) => updateFilter(index, { field: e.target.value as any })}
                style={{
                  padding: '6px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text,
                  fontSize: '12px'
                }}
              >
                <option value="all">All Fields</option>
                <option value="title">Title</option>
                <option value="body">Body</option>
                <option value="tags">Tags</option>
              </select>
              
              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, { operator: e.target.value as any })}
                style={{
                  padding: '6px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text,
                  fontSize: '12px'
                }}
              >
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts_with">Starts with</option>
                <option value="ends_with">Ends with</option>
                <option value="regex">Regex</option>
              </select>
              
              <input
                type="text"
                value={filter.value}
                onChange={(e) => updateFilter(index, { value: e.target.value })}
                placeholder="Enter value..."
                style={{
                  flex: 1,
                  padding: '6px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text,
                  fontSize: '12px'
                }}
              />
              
              <button
                onClick={() => removeFilter(index)}
                style={{
                  padding: '6px 8px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Saved Queries Panel */}
        {showSavedQueries && (
          <div style={{
            padding: '16px',
            background: colors.surface,
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Saved Queries</h4>
            {savedQueries.length === 0 ? (
              <p style={{ color: colors.textSecondary, margin: 0 }}>No saved queries</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedQueries.map(savedQuery => (
                  <div key={savedQuery.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    background: colors.background,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: colors.text }}>
                        {savedQuery.name}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {savedQuery.query} • Used {savedQuery.useCount} times
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => loadSavedQuery(savedQuery)}
                        style={{
                          padding: '4px 8px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteSavedQuery(savedQuery.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search History Panel */}
        {showHistory && (
          <div style={{
            padding: '16px',
            background: colors.surface,
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Search History</h4>
            {searchHistory.length === 0 ? (
              <p style={{ color: colors.textSecondary, margin: 0 }}>No search history</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {searchHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(historyQuery)}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: colors.text,
                      borderRadius: '4px'
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
          </div>
        )}

        {/* Search Results */}
        <div>
          <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>
            Results ({results.length})
          </h4>
          
          {results.length === 0 && !isSearching && (
            <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>
              No results found. Try adjusting your search criteria.
            </p>
          )}
          
          {results.map((result, index) => (
            <div
              key={result.noteId}
              onClick={() => handleResultClick(result.noteId)}
              style={{
                padding: '16px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                marginBottom: '8px',
                cursor: 'pointer',
                background: colors.background,
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.background;
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <h5 style={{ margin: 0, color: colors.text, fontSize: '16px' }}>
                  {result.title}
                </h5>
                <span style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                  background: colors.surface,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Score: {result.score}
                </span>
              </div>
              
              {result.matches.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '14px',
                    color: colors.textSecondary,
                    background: colors.surface,
                    padding: '8px',
                    borderRadius: '4px',
                    fontStyle: 'italic'
                  }}>
                    "{result.matches[0].snippet}"
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {result.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    style={{
                      padding: '2px 6px',
                      background: colors.primary,
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '11px'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch; 