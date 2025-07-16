// Enhanced search utilities for ZettelView
// Provides fuzzy matching, search history, and advanced filtering

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

// Fuzzy search implementation using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Find fuzzy matches in text
function findFuzzyMatches(text: string, query: string, threshold: number = 3): number[] {
  const matches: number[] = [];
  const words = text.toLowerCase().split(/\s+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  queryWords.forEach(queryWord => {
    words.forEach((word, index) => {
      const distance = levenshteinDistance(word, queryWord);
      if (distance <= threshold && word.length > 0) {
        matches.push(index);
      }
    });
  });
  
  return matches;
}

// Calculate search score based on match quality
function calculateScore(
  query: string,
  title: string,
  body: string,
  tags: string[],
  matches: SearchResult['matches']
): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const bodyLower = body.toLowerCase();
  
  // Exact matches get highest score
  if (titleLower.includes(queryLower)) {
    score += 100;
  }
  
  if (bodyLower.includes(queryLower)) {
    score += 50;
  }
  
  // Tag matches
  const tagMatches = tags.filter(tag => tag.toLowerCase().includes(queryLower));
  score += tagMatches.length * 30;
  
  // Fuzzy matches get lower score
  matches.forEach(match => {
    if (match.type === 'title') {
      score += 20 - match.indices.length; // Fewer indices = better match
    } else if (match.type === 'body') {
      score += 10 - match.indices.length;
    } else if (match.type === 'tags') {
      score += 15 - match.indices.length;
    }
  });
  
  // Boost score for recent notes
  return score;
}

/**
 * Perform fuzzy search on notes
 * @param notes - Array of notes to search
 * @param query - Search query
 * @param options - Search options
 * @returns Array of search results with scores and match details
 */
export function fuzzySearch(
  notes: Array<{ id: string; title: string; body: string; tags: string[] }>,
  query: string,
  options: {
    threshold?: number;
    maxResults?: number;
    includeFuzzy?: boolean;
  } = {}
): SearchResult[] {
  const { threshold = 3, maxResults = 50, includeFuzzy = true } = options;
  
  if (!query.trim()) {
    return [];
  }
  
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();
  
  notes.forEach(note => {
    const matches: SearchResult['matches'] = [];
    let hasMatch = false;
    
    // Check title
    if (note.title.toLowerCase().includes(queryLower)) {
      matches.push({
        type: 'title',
        field: note.title,
        indices: []
      });
      hasMatch = true;
    } else if (includeFuzzy) {
      const titleMatches = findFuzzyMatches(note.title, query, threshold);
      if (titleMatches.length > 0) {
        matches.push({
          type: 'title',
          field: note.title,
          indices: titleMatches
        });
        hasMatch = true;
      }
    }
    
    // Check body
    if (note.body.toLowerCase().includes(queryLower)) {
      matches.push({
        type: 'body',
        field: note.body.substring(0, 100) + '...',
        indices: []
      });
      hasMatch = true;
    } else if (includeFuzzy) {
      const bodyMatches = findFuzzyMatches(note.body, query, threshold);
      if (bodyMatches.length > 0) {
        matches.push({
          type: 'body',
          field: note.body.substring(0, 100) + '...',
          indices: bodyMatches
        });
        hasMatch = true;
      }
    }
    
    // Check tags
    const tagMatches = note.tags.filter(tag => 
      tag.toLowerCase().includes(queryLower)
    );
    if (tagMatches.length > 0) {
      matches.push({
        type: 'tags',
        field: tagMatches.join(', '),
        indices: []
      });
      hasMatch = true;
    } else if (includeFuzzy) {
      note.tags.forEach(tag => {
        const tagFuzzyMatches = findFuzzyMatches(tag, query, threshold);
        if (tagFuzzyMatches.length > 0) {
          matches.push({
            type: 'tags',
            field: tag,
            indices: tagFuzzyMatches
          });
          hasMatch = true;
        }
      });
    }
    
    if (hasMatch) {
      const score = calculateScore(query, note.title, note.body, note.tags, matches);
      results.push({
        noteId: note.id,
        title: note.title,
        body: note.body,
        tags: note.tags,
        score,
        matches
      });
    }
  });
  
  // Sort by score (highest first) and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

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
      if (filtered.length > this.MAX_HISTORY_SIZE) {
        filtered.splice(this.MAX_HISTORY_SIZE);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
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
 * @param text - Text to highlight
 * @param query - Search query
 * @returns Text with highlighted terms
 */
export function highlightSearchTerms(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  let highlightedText = text;
  
  queryWords.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}

/**
 * Get search suggestions based on note content
 * @param notes - Array of notes
 * @param partialQuery - Partial search query
 * @returns Array of suggestion strings
 */
export function getSearchSuggestions(
  notes: Array<{ title: string; body: string; tags: string[] }>,
  partialQuery: string
): string[] {
  if (!partialQuery.trim()) return [];
  
  const suggestions = new Set<string>();
  const queryLower = partialQuery.toLowerCase();
  
  notes.forEach(note => {
    // Title suggestions
    if (note.title.toLowerCase().includes(queryLower)) {
      suggestions.add(note.title);
    }
    
    // Tag suggestions
    note.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.add(tag);
      }
    });
    
    // Word suggestions from body
    const words = note.body.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.startsWith(queryLower) && word.length > queryLower.length) {
        suggestions.add(word);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 10);
} 