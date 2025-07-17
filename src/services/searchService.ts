import Fuse from 'fuse.js';
import { Note } from '../types/domain';

export interface SearchResult {
  noteId: string;
  title: string;
  body: string;
  tags: string[];
  score: number;
  matches: {
    type: 'title' | 'body' | 'tags';
    field: string;
    indices: number[];
  }[];
}

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

// Fuse.js configuration for optimal fuzzy search
const FUSE_OPTIONS: Fuse.IFuseOptions<any> = {
  // Search in multiple fields with different weights
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'tags', weight: 0.3 },
    { name: 'body', weight: 0.1 }
  ],
  // Fuzzy search settings
  threshold: 0.3, // Lower = more strict matching
  distance: 100, // Maximum distance for fuzzy matching
  minMatchCharLength: 2, // Minimum characters to match
  // Performance settings
  includeScore: true,
  includeMatches: true,
  // Ignore case
  ignoreCase: true,
  // Ignore location (search anywhere in text)
  ignoreLocation: true,
  // Use simple tokenization
  tokenize: true,
  matchAllTokens: false,
  // Cache results for better performance
  useExtendedSearch: false
};

class SearchService {
  private fuse: Fuse<any> | null = null;
  private notes: Note[] = [];
  private searchCache = new Map<string, SearchResult[]>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private lastCacheCleanup = Date.now();

  /**
   * Initialize the search index with notes
   */
  initialize(notes: Note[]): void {
    this.notes = notes;
    
    // Prepare data for Fuse.js
    const searchData = notes.map(note => ({
      id: note.id,
      title: note.title,
      body: note.body,
      tags: note.tags.join(' '), // Join tags for better search
      note // Keep reference to original note
    }));

    // Create new Fuse instance
    this.fuse = new Fuse(searchData, FUSE_OPTIONS);
    
    // Clear cache when notes change
    this.searchCache.clear();
  }

  /**
   * Perform fuzzy search with caching
   */
  search(
    query: string,
    options: {
      maxResults?: number;
      includeBody?: boolean;
    } = {}
  ): SearchResult[] {
    const { maxResults = 50, includeBody = true } = options;
    
    if (!query.trim() || !this.fuse) {
      return [];
    }

    // Check cache first
    const cacheKey = `${query}:${maxResults}:${includeBody}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Clean up old cache entries periodically
    this.cleanupCache();

    // Perform search with Fuse.js
    const fuseResults = this.fuse.search(query, {
      limit: maxResults
    });

    // Transform Fuse.js results to our format
    const results: SearchResult[] = fuseResults.map(fuseResult => {
      const note = fuseResult.item.note as Note;
      const score = fuseResult.score || 0;
      
      // Extract match information
      const matches: SearchResult['matches'] = [];
      
      if (fuseResult.matches) {
        fuseResult.matches.forEach(match => {
          if (match.key === 'title') {
            matches.push({
              type: 'title',
              field: note.title,
              indices: match.indices || []
            });
          } else if (match.key === 'tags') {
            matches.push({
              type: 'tags',
              field: note.tags.join(', '),
              indices: match.indices || []
            });
          } else if (match.key === 'body' && includeBody) {
            matches.push({
              type: 'body',
              field: note.body.substring(0, 100) + '...',
              indices: match.indices || []
            });
          }
        });
      }

      return {
        noteId: note.id,
        title: note.title,
        body: includeBody ? note.body : '',
        tags: note.tags,
        score: 1 - score, // Invert score (Fuse.js uses 0 = perfect match)
        matches
      };
    });

    // Cache the results
    this.searchCache.set(cacheKey, results);
    
    return results;
  }

  /**
   * Search only in titles and tags (faster for quick searches)
   */
  quickSearch(query: string, maxResults: number = 20): SearchResult[] {
    if (!query.trim() || !this.fuse) {
      return [];
    }

    // Create a temporary Fuse instance with only title and tags
    const quickFuse = new Fuse(this.notes.map(note => ({
      id: note.id,
      title: note.title,
      tags: note.tags.join(' '),
      note
    })), {
      ...FUSE_OPTIONS,
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'tags', weight: 0.3 }
      ]
    });

    const results = quickFuse.search(query, { limit: maxResults });
    
    return results.map(fuseResult => {
      const note = fuseResult.item.note as Note;
      return {
        noteId: note.id,
        title: note.title,
        body: '', // Don't include body for quick search
        tags: note.tags,
        score: 1 - (fuseResult.score || 0),
        matches: [] // Simplified for quick search
      };
    });
  }

  /**
   * Search by tags only
   */
  searchByTags(tags: string[]): SearchResult[] {
    if (!tags.length || !this.fuse) {
      return [];
    }

    const tagQuery = tags.join(' ');
    return this.search(tagQuery, { maxResults: 100, includeBody: false });
  }

  /**
   * Get search suggestions based on note content
   */
  getSuggestions(partialQuery: string, maxSuggestions: number = 5): string[] {
    if (!partialQuery.trim() || !this.fuse) {
      return [];
    }

    const suggestions = new Set<string>();
    
    // Get recent search history
    const history = SearchHistory.getRecentQueries(10);
    history.forEach(query => {
      if (query.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(query);
      }
    });

    // Get suggestions from note titles and tags
    const quickResults = this.quickSearch(partialQuery, 20);
    quickResults.forEach(result => {
      // Add title words that match
      const titleWords = result.title.toLowerCase().split(/\s+/);
      titleWords.forEach(word => {
        if (word.includes(partialQuery.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });

      // Add tag suggestions
      result.tags.forEach(tag => {
        if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, maxSuggestions);
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    if (now - this.lastCacheCleanup > this.cacheTimeout) {
      this.searchCache.clear();
      this.lastCacheCleanup = now;
    }
  }

  /**
   * Get search statistics
   */
  getStats(): {
    totalNotes: number;
    cacheSize: number;
    isInitialized: boolean;
  } {
    return {
      totalNotes: this.notes.length,
      cacheSize: this.searchCache.size,
      isInitialized: this.fuse !== null
    };
  }
}

// Export singleton instance
export const searchService = new SearchService();

/**
 * Search history management
 */
export class SearchHistory {
  private static readonly STORAGE_KEY = 'zettelview_search_history';
  private static readonly MAX_HISTORY_SIZE = 20;
  
  static getHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static addToHistory(query: string, resultCount: number): void {
    try {
      const history = this.getHistory();
      const newItem: SearchHistoryItem = {
        query: query.trim(),
        timestamp: Date.now(),
        resultCount
      };
      
      // Remove duplicate entries
      const filtered = history.filter(item => item.query !== newItem.query);
      
      // Add new item at the beginning
      filtered.unshift(newItem);
      
      // Limit history size
      const limited = filtered.slice(0, this.MAX_HISTORY_SIZE);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limited));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }
  
  static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }
  
  static getRecentQueries(limit: number = 5): string[] {
    const history = this.getHistory();
    return history.slice(0, limit).map(item => item.query);
  }
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
} 