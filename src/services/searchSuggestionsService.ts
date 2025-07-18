import { Note } from '../types/domain';
import { SearchHistory } from './searchService';

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'tag' | 'title' | 'concept' | 'related';
  relevance: number;
  source: 'content' | 'history' | 'tags' | 'ai' | 'popular';
  metadata?: {
    noteId?: string;
    tag?: string;
    frequency?: number;
    lastUsed?: number;
  };
}

export interface SuggestionContext {
  currentQuery: string;
  userHistory: string[];
  recentSearches: string[];
  popularTags: string[];
  noteCount: number;
}

class SearchSuggestionsService {
  private notes: Note[] = [];
  private suggestionCache = new Map<string, SearchSuggestion[]>();
  private cacheTimeout = 2 * 60 * 1000; // 2 minutes
  private lastCacheCleanup = Date.now();

  // Initialize with notes
  initialize(notes: Note[]): void {
    this.notes = notes;
    this.suggestionCache.clear();
  }

  // Get intelligent suggestions based on partial query
  getSuggestions(
    partialQuery: string,
    context: SuggestionContext,
    maxSuggestions: number = 8
  ): SearchSuggestion[] {
    if (!partialQuery.trim()) {
      return this.getPopularSuggestions(context, maxSuggestions);
    }

    const cacheKey = `${partialQuery}:${maxSuggestions}`;
    const cached = this.suggestionCache.get(cacheKey);
    if (cached && Date.now() - this.lastCacheCleanup < this.cacheTimeout) {
      return cached.slice(0, maxSuggestions);
    }

    const suggestions: SearchSuggestion[] = [];

    // 1. Exact matches from content
    suggestions.push(...this.getExactMatches(partialQuery, context));

    // 2. Fuzzy matches from titles and content
    suggestions.push(...this.getFuzzyMatches(partialQuery, context));

    // 3. Tag-based suggestions
    suggestions.push(...this.getTagSuggestions(partialQuery, context));

    // 4. Related concept suggestions
    suggestions.push(...this.getRelatedConceptSuggestions(partialQuery, context));

    // 5. History-based suggestions
    suggestions.push(...this.getHistorySuggestions(partialQuery, context));

    // 6. AI-enhanced suggestions
    suggestions.push(...this.getAISuggestions(partialQuery, context));

    // Sort by relevance and remove duplicates
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, maxSuggestions);

    // Cache results
    this.suggestionCache.set(cacheKey, sortedSuggestions);
    this.cleanupCache();

    return sortedSuggestions;
  }

  // Get exact matches from note content
  private getExactMatches(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Search in titles
    this.notes.forEach(note => {
      if (note.title.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          id: `title-${note.id}`,
          text: note.title,
          type: 'title',
          relevance: this.calculateRelevance(query, note.title, 'exact'),
          source: 'content',
          metadata: { noteId: note.id }
        });
      }
    });

    // Search in tags
    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            id: `tag-${tag}`,
            text: tag,
            type: 'tag',
            relevance: this.calculateRelevance(query, tag, 'exact'),
            source: 'tags',
            metadata: { tag, frequency: this.getTagFrequency(tag) }
          });
        }
      });
    });

    return suggestions;
  }

  // Get fuzzy matches using simple similarity
  private getFuzzyMatches(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Fuzzy title matches
    this.notes.forEach(note => {
      const similarity = this.calculateSimilarity(lowerQuery, note.title.toLowerCase());
      if (similarity > 0.3) {
        suggestions.push({
          id: `fuzzy-title-${note.id}`,
          text: note.title,
          type: 'title',
          relevance: similarity * 0.8,
          source: 'content',
          metadata: { noteId: note.id }
        });
      }
    });

    // Fuzzy content matches (first 100 characters)
    this.notes.forEach(note => {
      const contentPreview = note.body.substring(0, 100).toLowerCase();
      const similarity = this.calculateSimilarity(lowerQuery, contentPreview);
      if (similarity > 0.4) {
        const words = note.body.split(' ').slice(0, 5).join(' ');
        suggestions.push({
          id: `fuzzy-content-${note.id}`,
          text: words + '...',
          type: 'query',
          relevance: similarity * 0.6,
          source: 'content',
          metadata: { noteId: note.id }
        });
      }
    });

    return suggestions;
  }

  // Get tag-based suggestions
  private getTagSuggestions(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Get all unique tags
    const allTags = new Set<string>();
    this.notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });

    // Find tags that match or are related
    allTags.forEach(tag => {
      const lowerTag = tag.toLowerCase();
      if (lowerTag.includes(lowerQuery) || this.calculateSimilarity(lowerQuery, lowerTag) > 0.3) {
        const frequency = this.getTagFrequency(tag);
        suggestions.push({
          id: `suggest-tag-${tag}`,
          text: `tag:${tag}`,
          type: 'tag',
          relevance: this.calculateRelevance(query, tag, 'tag') * (frequency / this.notes.length),
          source: 'tags',
          metadata: { tag, frequency }
        });
      }
    });

    return suggestions;
  }

  // Get related concept suggestions
  private getRelatedConceptSuggestions(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    // Find notes that contain the query and extract related concepts
    const relatedNotes = this.notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.body.toLowerCase().includes(query.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    // Extract common tags from related notes
    const relatedTags = new Map<string, number>();
    relatedNotes.forEach(note => {
      note.tags.forEach(tag => {
        relatedTags.set(tag, (relatedTags.get(tag) || 0) + 1);
      });
    });

    // Create suggestions for related concepts
    relatedTags.forEach((frequency, tag) => {
      if (tag.toLowerCase() !== query.toLowerCase()) {
        suggestions.push({
          id: `related-${tag}`,
          text: `related to "${query}": ${tag}`,
          type: 'related',
          relevance: (frequency / relatedNotes.length) * 0.7,
          source: 'ai',
          metadata: { tag, frequency }
        });
      }
    });

    return suggestions;
  }

  // Get history-based suggestions
  private getHistorySuggestions(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Search in user history
    context.userHistory.forEach((historyQuery, index) => {
      if (historyQuery.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          id: `history-${index}`,
          text: historyQuery,
          type: 'query',
          relevance: this.calculateRelevance(query, historyQuery, 'history') * (1 - index * 0.1),
          source: 'history',
          metadata: { lastUsed: Date.now() - index * 1000 }
        });
      }
    });

    // Search in recent searches
    context.recentSearches.forEach((searchQuery, index) => {
      if (searchQuery.toLowerCase().includes(lowerQuery)) {
        suggestions.push({
          id: `recent-${index}`,
          text: searchQuery,
          type: 'query',
          relevance: this.calculateRelevance(query, searchQuery, 'recent') * (1 - index * 0.05),
          source: 'history',
          metadata: { lastUsed: Date.now() - index * 1000 }
        });
      }
    });

    return suggestions;
  }

  // Get AI-enhanced suggestions
  private getAISuggestions(query: string, context: SuggestionContext): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Generate contextual suggestions based on query patterns
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    
    if (queryWords.length > 0) {
      // Suggest common query patterns
      const commonPatterns = this.getCommonQueryPatterns(queryWords);
      commonPatterns.forEach((pattern, index) => {
        suggestions.push({
          id: `ai-pattern-${index}`,
          text: pattern,
          type: 'query',
          relevance: 0.5 - index * 0.1,
          source: 'ai'
        });
      });

      // Suggest related search terms
      const relatedTerms = this.getRelatedSearchTerms(queryWords);
      relatedTerms.forEach((term, index) => {
        suggestions.push({
          id: `ai-term-${index}`,
          text: term,
          type: 'concept',
          relevance: 0.4 - index * 0.1,
          source: 'ai'
        });
      });
    }

    return suggestions;
  }

  // Get popular suggestions when no query is provided
  private getPopularSuggestions(context: SuggestionContext, maxSuggestions: number): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Popular tags
    context.popularTags.slice(0, 3).forEach(tag => {
      suggestions.push({
        id: `popular-tag-${tag}`,
        text: `tag:${tag}`,
        type: 'tag',
        relevance: 0.9,
        source: 'popular',
        metadata: { tag }
      });
    });

    // Recent searches
    context.recentSearches.slice(0, 3).forEach((query, index) => {
      suggestions.push({
        id: `popular-recent-${index}`,
        text: query,
        type: 'query',
        relevance: 0.8 - index * 0.1,
        source: 'popular',
        metadata: { lastUsed: Date.now() - index * 1000 }
      });
    });

    // Common search patterns
    const commonPatterns = ['recent notes', 'tagged notes', 'linked notes', 'archived notes'];
    commonPatterns.forEach((pattern, index) => {
      suggestions.push({
        id: `popular-pattern-${index}`,
        text: pattern,
        type: 'query',
        relevance: 0.7 - index * 0.1,
        source: 'popular'
      });
    });

    return suggestions.slice(0, maxSuggestions);
  }

  // Calculate relevance score
  private calculateRelevance(query: string, target: string, type: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerTarget = target.toLowerCase();

    // Exact match gets highest score
    if (lowerTarget === lowerQuery) return 1.0;
    
    // Starts with query
    if (lowerTarget.startsWith(lowerQuery)) return 0.9;
    
    // Contains query
    if (lowerTarget.includes(lowerQuery)) return 0.8;
    
    // Similarity-based score
    const similarity = this.calculateSimilarity(lowerQuery, lowerTarget);
    
    // Adjust based on type
    switch (type) {
      case 'exact': return similarity * 1.0;
      case 'tag': return similarity * 0.9;
      case 'history': return similarity * 0.8;
      case 'recent': return similarity * 0.85;
      default: return similarity * 0.7;
    }
  }

  // Calculate simple similarity between strings
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ').filter(word => word.length > 2);
    const words2 = str2.split(' ').filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  // Get tag frequency
  private getTagFrequency(tag: string): number {
    return this.notes.filter(note => note.tags.includes(tag)).length;
  }

  // Get common query patterns
  private getCommonQueryPatterns(queryWords: string[]): string[] {
    const patterns: string[] = [];
    
    // Add common prefixes
    patterns.push(`recent ${queryWords[0]}`);
    patterns.push(`tagged ${queryWords[0]}`);
    patterns.push(`linked ${queryWords[0]}`);
    
    // Add common suffixes
    patterns.push(`${queryWords[0]} notes`);
    patterns.push(`${queryWords[0]} content`);
    
    return patterns;
  }

  // Get related search terms
  private getRelatedSearchTerms(queryWords: string[]): string[] {
    const relatedTerms: string[] = [];
    
    // Find related terms from note content
    const relatedNotes = this.notes.filter(note => 
      queryWords.some(word => 
        note.title.toLowerCase().includes(word) ||
        note.body.toLowerCase().includes(word)
      )
    );

    // Extract common words from related notes
    const wordFrequency = new Map<string, number>();
    relatedNotes.forEach(note => {
      const words = (note.title + ' ' + note.body)
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !queryWords.includes(word));
      
      words.forEach(word => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });

    // Get top related terms
    const sortedTerms = Array.from(wordFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word);

    return sortedTerms;
  }

  // Deduplicate suggestions
  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.type}:${suggestion.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Cleanup old cache entries
  private cleanupCache(): void {
    if (Date.now() - this.lastCacheCleanup > this.cacheTimeout) {
      this.suggestionCache.clear();
      this.lastCacheCleanup = Date.now();
    }
  }

  // Get suggestion statistics
  getSuggestionStats(): {
    totalSuggestions: number;
    cacheSize: number;
    averageRelevance: number;
  } {
    const allSuggestions = Array.from(this.suggestionCache.values()).flat();
    const totalRelevance = allSuggestions.reduce((sum, s) => sum + s.relevance, 0);
    
    return {
      totalSuggestions: allSuggestions.length,
      cacheSize: this.suggestionCache.size,
      averageRelevance: allSuggestions.length > 0 ? totalRelevance / allSuggestions.length : 0
    };
  }

  // Clear cache
  clearCache(): void {
    this.suggestionCache.clear();
  }
}

export const SearchSuggestionsService = new SearchSuggestionsService(); 