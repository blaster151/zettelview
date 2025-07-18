import { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchHistory, SearchHistoryItem } from '../services/searchService';

interface UseSearchHistoryOptions {
  maxHistorySize?: number;
  enableAnalytics?: boolean;
  autoSave?: boolean;
}

interface SearchHistoryStats {
  totalSearches: number;
  uniqueQueries: number;
  averageResults: number;
  mostSearched: string;
  recentActivity: number;
  searchTrends: Array<{ date: string; count: number }>;
  popularQueries: Array<{ query: string; count: number }>;
}

interface UseSearchHistoryReturn {
  // State
  history: SearchHistoryItem[];
  isLoading: boolean;
  
  // Actions
  addToHistory: (query: string, resultCount: number) => void;
  clearHistory: () => void;
  removeFromHistory: (query: string) => void;
  removeMultipleFromHistory: (queries: string[]) => void;
  
  // Queries
  getRecentQueries: (limit?: number) => string[];
  getPopularQueries: (limit?: number) => Array<{ query: string; count: number }>;
  searchHistory: (searchTerm: string) => SearchHistoryItem[];
  
  // Analytics
  getStats: () => SearchHistoryStats;
  getSearchTrends: (days?: number) => Array<{ date: string; count: number }>;
  
  // Utilities
  exportHistory: () => string;
  importHistory: (data: string) => boolean;
  getHistoryByDateRange: (startDate: Date, endDate: Date) => SearchHistoryItem[];
}

export const useSearchHistory = (options: UseSearchHistoryOptions = {}): UseSearchHistoryReturn => {
  const {
    maxHistorySize = 50,
    enableAnalytics = true,
    autoSave = true
  } = options;

  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const historyData = SearchHistory.getHistory();
        setHistory(historyData);
      } catch (error) {
        console.error('Failed to load search history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Add to history
  const addToHistory = useCallback((query: string, resultCount: number) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      query: query.trim(),
      timestamp: Date.now(),
      resultCount
    };

    setHistory(prevHistory => {
      // Remove duplicate entries
      const filtered = prevHistory.filter(item => item.query !== newItem.query);
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered];
      
      // Limit history size
      const limited = updated.slice(0, maxHistorySize);
      
      // Auto-save to localStorage
      if (autoSave) {
        try {
          localStorage.setItem('zettelview_search_history', JSON.stringify(limited));
        } catch (error) {
          console.warn('Failed to save search history:', error);
        }
      }
      
      return limited;
    });
  }, [maxHistorySize, autoSave]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    SearchHistory.clearHistory();
  }, []);

  // Remove from history
  const removeFromHistory = useCallback((query: string) => {
    setHistory(prevHistory => {
      const updated = prevHistory.filter(item => item.query !== query);
      
      if (autoSave) {
        try {
          localStorage.setItem('zettelview_search_history', JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save search history:', error);
        }
      }
      
      return updated;
    });
  }, [autoSave]);

  // Remove multiple from history
  const removeMultipleFromHistory = useCallback((queries: string[]) => {
    setHistory(prevHistory => {
      const updated = prevHistory.filter(item => !queries.includes(item.query));
      
      if (autoSave) {
        try {
          localStorage.setItem('zettelview_search_history', JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save search history:', error);
        }
      }
      
      return updated;
    });
  }, [autoSave]);

  // Get recent queries
  const getRecentQueries = useCallback((limit: number = 5) => {
    return history.slice(0, limit).map(item => item.query);
  }, [history]);

  // Get popular queries
  const getPopularQueries = useCallback((limit: number = 10) => {
    const frequency = new Map<string, number>();
    
    history.forEach(item => {
      frequency.set(item.query, (frequency.get(item.query) || 0) + 1);
    });
    
    return Array.from(frequency.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [history]);

  // Search history
  const searchHistory = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return history;
    
    return history.filter(item => 
      item.query.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history]);

  // Get search trends
  const getSearchTrends = useCallback((days: number = 7) => {
    const trends = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
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
    
    return trends;
  }, [history]);

  // Get history by date range
  const getHistoryByDateRange = useCallback((startDate: Date, endDate: Date) => {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    return history.filter(item => 
      item.timestamp >= startTime && item.timestamp <= endTime
    );
  }, [history]);

  // Get comprehensive stats
  const getStats = useCallback((): SearchHistoryStats => {
    if (history.length === 0) {
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        averageResults: 0,
        mostSearched: '',
        recentActivity: 0,
        searchTrends: [],
        popularQueries: []
      };
    }

    // Basic stats
    const uniqueQueries = new Set(history.map(item => item.query));
    const totalResults = history.reduce((sum, item) => sum + item.resultCount, 0);
    const averageResults = Math.round(totalResults / history.length);
    
    // Most searched query
    const popularQueries = getPopularQueries(10);
    const mostSearched = popularQueries[0]?.query || '';
    
    // Recent activity (last 24 hours)
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentActivity = history.filter(item => item.timestamp >= dayAgo).length;
    
    // Search trends
    const searchTrends = getSearchTrends(7);

    return {
      totalSearches: history.length,
      uniqueQueries: uniqueQueries.size,
      averageResults,
      mostSearched,
      recentActivity,
      searchTrends,
      popularQueries
    };
  }, [history, getPopularQueries, getSearchTrends]);

  // Export history
  const exportHistory = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      history: history,
      stats: getStats()
    };
    
    return JSON.stringify(exportData, null, 2);
  }, [history, getStats]);

  // Import history
  const importHistory = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.version && parsed.history && Array.isArray(parsed.history)) {
        setHistory(parsed.history);
        
        if (autoSave) {
          localStorage.setItem('zettelview_search_history', JSON.stringify(parsed.history));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import search history:', error);
      return false;
    }
  }, [autoSave]);

  return {
    // State
    history,
    isLoading,
    
    // Actions
    addToHistory,
    clearHistory,
    removeFromHistory,
    removeMultipleFromHistory,
    
    // Queries
    getRecentQueries,
    getPopularQueries,
    searchHistory,
    
    // Analytics
    getStats,
    getSearchTrends,
    
    // Utilities
    exportHistory,
    importHistory,
    getHistoryByDateRange
  };
}; 