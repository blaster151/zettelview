import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SearchHistory, SearchHistoryItem } from '../../services/searchService';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import SearchAnalytics from './SearchAnalytics';

interface SearchHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

interface SearchAnalytics {
  totalSearches: number;
  uniqueQueries: number;
  averageResults: number;
  mostSearched: string;
  recentActivity: number;
  searchTrends: Array<{ date: string; count: number }>;
}

const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  isOpen,
  onClose,
  onSearch
}) => {
  const { colors } = useThemeStore();
  const { searchNotes } = useNoteStore();
  
  // Add refs for keyboard navigation
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const historyListRef = useRef<HTMLDivElement>(null);
  
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<SearchHistoryItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'frequency' | 'results'>('recent');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load history on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      const historyData = SearchHistory.getHistory();
      setHistory(historyData);
      setFilteredHistory(historyData);
    }
  }, [isOpen]);

  // Filter and sort history
  useEffect(() => {
    let filtered = [...history];

    // Apply search filter
    if (searchFilter) {
      filtered = filtered.filter(item => 
        item.query.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Apply date filter
    const now = new Date();
    switch (dateFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(item => 
          new Date(item.timestamp) >= today
        );
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(item => 
          new Date(item.timestamp) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(item => 
          new Date(item.timestamp) >= monthAgo
        );
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'frequency':
        // Count frequency of each query
        const frequency = new Map<string, number>();
        filtered.forEach(item => {
          frequency.set(item.query, (frequency.get(item.query) || 0) + 1);
        });
        filtered.sort((a, b) => {
          const freqA = frequency.get(a.query) || 0;
          const freqB = frequency.get(b.query) || 0;
          return freqB - freqA;
        });
        break;
      case 'results':
        filtered.sort((a, b) => b.resultCount - a.resultCount);
        break;
    }

    setFilteredHistory(filtered);
  }, [history, searchFilter, dateFilter, sortBy]);

  // Calculate analytics
  const analytics = useMemo((): SearchAnalytics => {
    if (history.length === 0) {
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        averageResults: 0,
        mostSearched: '',
        recentActivity: 0,
        searchTrends: []
      };
    }

    // Count unique queries
    const uniqueQueries = new Set(history.map(item => item.query));
    
    // Calculate average results
    const totalResults = history.reduce((sum, item) => sum + item.resultCount, 0);
    const averageResults = Math.round(totalResults / history.length);
    
    // Find most searched query
    const queryFrequency = new Map<string, number>();
    history.forEach(item => {
      queryFrequency.set(item.query, (queryFrequency.get(item.query) || 0) + 1);
    });
    const mostSearched = Array.from(queryFrequency.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    // Count recent activity (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentActivity = history.filter(item => item.timestamp >= dayAgo).length;
    
    // Calculate search trends (last 7 days)
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = history.filter(item => 
        item.timestamp >= dayStart && item.timestamp < dayEnd
      ).length;
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }

    return {
      totalSearches: history.length,
      uniqueQueries: uniqueQueries.size,
      averageResults,
      mostSearched,
      recentActivity,
      searchTrends: trends
    };
  }, [history]);

  // Handle search from history
  const handleSearchFromHistory = useCallback((query: string) => {
    onSearch(query);
    onClose();
  }, [onSearch, onClose]);

  // Handle bulk search
  const handleBulkSearch = useCallback(() => {
    if (selectedItems.size === 0) return;
    
    const queries = Array.from(selectedItems);
    const combinedQuery = queries.join(' OR ');
    onSearch(combinedQuery);
    onClose();
    setSelectedItems(new Set());
  }, [selectedItems, onSearch, onClose]);

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all search history?')) {
      SearchHistory.clearHistory();
      setHistory([]);
      setFilteredHistory([]);
      setSelectedItems(new Set());
    }
  }, []);

  // Handle delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Delete ${selectedItems.size} selected search history items?`)) {
      const updatedHistory = history.filter(item => !selectedItems.has(item.query));
      setHistory(updatedHistory);
      setSelectedItems(new Set());
      
      // Update localStorage
      localStorage.setItem('zettelview_search_history', JSON.stringify(updatedHistory));
    }
  }, [selectedItems, history]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === filteredHistory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredHistory.map(item => item.query)));
    }
  }, [selectedItems, filteredHistory]);

  // Handle item selection
  const handleItemSelect = useCallback((query: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(query)) {
      newSelected.delete(query);
    } else {
      newSelected.add(query);
    }
    setSelectedItems(newSelected);
  }, [selectedItems]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
    
    return date.toLocaleDateString();
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        // Trap focus within modal
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
        break;
      case 'ArrowDown':
        if (e.target === historyListRef.current || historyListRef.current?.contains(e.target as Node)) {
          e.preventDefault();
          const items = historyListRef.current?.querySelectorAll('[role="listitem"]');
          if (items && items.length > 0) {
            const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
            const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            (items[nextIndex] as HTMLElement)?.focus();
          }
        }
        break;
      case 'ArrowUp':
        if (e.target === historyListRef.current || historyListRef.current?.contains(e.target as Node)) {
          e.preventDefault();
          const items = historyListRef.current?.querySelectorAll('[role="listitem"]');
          if (items && items.length > 0) {
            const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            (items[prevIndex] as HTMLElement)?.focus();
          }
        }
        break;
      case 'Enter':
        if (e.target === document.activeElement) {
          const target = e.target as HTMLElement;
          if (target.tagName === 'BUTTON') {
            e.preventDefault();
            target.click();
          } else if (target.getAttribute('role') === 'listitem') {
            e.preventDefault();
            const query = target.getAttribute('data-query');
            if (query) {
              handleSearchFromHistory(query);
            }
          }
        }
        break;
      case 'Space':
        if (e.target === document.activeElement) {
          const target = e.target as HTMLElement;
          if (target.getAttribute('role') === 'listitem') {
            e.preventDefault();
            const query = target.getAttribute('data-query');
            if (query) {
              handleSearchFromHistory(query);
            }
          }
        }
        break;
    }
  }, [onClose, handleSearchFromHistory]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element when modal opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}
    onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-history-title"
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: colors.text,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          id="search-history-title"
          >
            🔍 Search History
          </h2>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '4px'
            }}
            aria-label="Close search history panel"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface
          }}
          role="region"
          aria-labelledby="analytics-section-label"
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <h3 id="analytics-section-label" style={{
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
                aria-label="Hide search analytics section"
                tabIndex={0}
              >
                Hide
              </button>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px'
            }}
            role="group"
            aria-label="Search statistics"
            >
              <div style={{
                textAlign: 'center',
                padding: '8px',
                background: colors.background,
                borderRadius: '4px'
              }}
              role="group"
              aria-label="Total searches statistic"
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>
                  {analytics.totalSearches}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Total Searches
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '8px',
                background: colors.background,
                borderRadius: '4px'
              }}
              role="group"
              aria-label="Unique queries statistic"
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.secondary }}>
                  {analytics.uniqueQueries}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Unique Queries
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '8px',
                background: colors.background,
                borderRadius: '4px'
              }}
              role="group"
              aria-label="Average results statistic"
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.accent }}>
                  {analytics.averageResults}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Avg Results
                </div>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '8px',
                background: colors.background,
                borderRadius: '4px'
              }}
              role="group"
              aria-label="Today's activity statistic"
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.warning }}>
                  {analytics.recentActivity}
                </div>
                <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                  Today
                </div>
              </div>
            </div>

            {analytics.mostSearched && (
              <div style={{
                marginTop: '12px',
                padding: '8px',
                background: colors.background,
                borderRadius: '4px',
                fontSize: '12px'
              }}
              role="group"
              aria-label="Most searched query"
              >
                <strong>Most searched:</strong> {analytics.mostSearched}
              </div>
            )}

            {/* Search Trends Chart */}
            {analytics.searchTrends.length > 0 && (
              <div style={{ marginTop: '12px' }}
              role="group"
              aria-label="Search activity trends for last 7 days"
              >
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
                  Last 7 days activity:
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'end',
                  gap: '4px',
                  height: '60px'
                }}
                role="img"
                aria-label="Bar chart showing search activity over the last 7 days"
                >
                  {analytics.searchTrends.map((trend, index) => {
                    const maxCount = Math.max(...analytics.searchTrends.map(t => t.count));
                    const height = maxCount > 0 ? (trend.count / maxCount) * 50 : 0;
                    return (
                      <div key={index} style={{ flex: 1, textAlign: 'center' }}
                      role="group"
                      aria-label={`${trend.date}: ${trend.count} searches`}
                      >
                        <div style={{
                          height: `${height}px`,
                          background: colors.primary,
                          borderRadius: '2px 2px 0 0',
                          minHeight: '2px'
                        }} />
                        <div style={{
                          fontSize: '10px',
                          color: colors.textSecondary,
                          marginTop: '4px'
                        }}>
                          {trend.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
        role="toolbar"
        aria-label="Search history controls"
        >
          {/* Search filter */}
          <input
            type="text"
            placeholder="Filter history..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px',
              minWidth: '150px'
            }}
            aria-label="Filter search history by query text"
            tabIndex={0}
          />

          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px'
            }}
            aria-label="Filter search history by date range"
            tabIndex={0}
          >
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px'
            }}
            aria-label="Sort search history"
            tabIndex={0}
          >
            <option value="recent">Most recent</option>
            <option value="frequency">Most frequent</option>
            <option value="results">Most results</option>
          </select>

          {/* Action buttons */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            {selectedItems.size > 0 && (
              <>
                <button
                  onClick={handleBulkSearch}
                  style={{
                    padding: '6px 12px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  aria-label={`Search selected ${selectedItems.size} queries`}
                  tabIndex={0}
                >
                  Search Selected ({selectedItems.size})
                </button>
                <button
                  onClick={handleDeleteSelected}
                  style={{
                    padding: '6px 12px',
                    background: colors.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  aria-label={`Delete ${selectedItems.size} selected search history items`}
                  tabIndex={0}
                >
                  Delete
                </button>
              </>
            )}
            
            <button
              onClick={handleClearHistory}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              aria-label="Clear all search history"
              tabIndex={0}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* History List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0 20px'
        }}
        role="main"
        aria-labelledby="search-history-title"
        >
          {filteredHistory.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: colors.textSecondary
            }}
            role="status"
            aria-live="polite"
            >
              {history.length === 0 ? (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No search history</div>
                  <div style={{ fontSize: '12px' }}>Your search history will appear here</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No matching searches</div>
                  <div style={{ fontSize: '12px' }}>Try adjusting your filters</div>
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: '12px 0' }}>
              {/* Select all checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${colors.border}`
              }}>
                <input
                  type="checkbox"
                  checked={selectedItems.size === filteredHistory.length && filteredHistory.length > 0}
                  onChange={handleSelectAll}
                  style={{ marginRight: '8px' }}
                  aria-label={`Select all ${filteredHistory.length} search history items`}
                  tabIndex={0}
                />
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Select all ({filteredHistory.length})
                </span>
              </div>

              {/* History items */}
              <div 
                ref={historyListRef}
                role="list" 
                aria-label="Search history items"
                tabIndex={0}
              >
                {filteredHistory.map((item, index) => (
                  <div
                    key={`${item.query}-${item.timestamp}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: `1px solid ${colors.border}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleSearchFromHistory(item.query)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    role="listitem"
                    aria-label={`Search query: ${item.query}, ${item.resultCount} results, ${formatTimestamp(item.timestamp)}`}
                    data-query={item.query}
                    tabIndex={0}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.query)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleItemSelect(item.query);
                      }}
                      style={{ marginRight: '12px' }}
                      aria-label={`Select search query: ${item.query}`}
                      tabIndex={0}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        color: colors.text,
                        marginBottom: '4px'
                      }}>
                        {item.query}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.textSecondary,
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span>{formatTimestamp(item.timestamp)}</span>
                        <span>{item.resultCount} results</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSearchFromHistory(item.query);
                      }}
                      style={{
                        padding: '6px 12px',
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                      aria-label={`Search for: ${item.query}`}
                      tabIndex={0}
                    >
                      Search
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: colors.textSecondary
        }}
        role="contentinfo"
        >
          <span>
            Showing {filteredHistory.length} of {history.length} searches
          </span>
          <button
            ref={lastFocusableRef}
            onClick={() => setShowAnalytics(!showAnalytics)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textSecondary,
              fontSize: '12px'
            }}
            aria-label={`${showAnalytics ? 'Hide' : 'Show'} search analytics`}
            tabIndex={0}
          >
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryPanel; 