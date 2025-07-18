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

export interface AppliedFilters {
  datePreset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  dateRange: { start: Date | null; end: Date | null };
  contentTypes: {
    hasLinks: boolean;
    hasTags: boolean;
    hasContent: boolean;
    hasAttachments: boolean;
    isArchived: boolean;
  };
  includeTags: string[];
  excludeTags: string[];
  tagLogic: 'any' | 'all' | 'none';
  textFilters: Array<{
    field: 'all' | 'title' | 'body' | 'tags';
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
    value: string;
    caseSensitive: boolean;
  }>;
  sortBy: 'relevance' | 'date' | 'title' | 'size' | 'tags';
  sortOrder: 'asc' | 'desc';
  maxResults: number;
}

export interface SearchTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  filters: AppliedFilters;
  category: string;
  isDefault?: boolean;
  createdAt: number;
  lastUsed?: number;
  usageCount: number;
}

export interface SearchTemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
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

class SearchTemplates {
  private readonly STORAGE_KEY = 'zettelview_search_templates';
  private readonly CATEGORIES_KEY = 'zettelview_template_categories';

  // Default template categories
  private defaultCategories: SearchTemplateCategory[] = [
    { id: 'general', name: 'General', description: 'General search templates', icon: '🔍' },
    { id: 'work', name: 'Work', description: 'Work-related search templates', icon: '💼' },
    { id: 'personal', name: 'Personal', description: 'Personal note templates', icon: '👤' },
    { id: 'research', name: 'Research', description: 'Research and study templates', icon: '📚' },
    { id: 'projects', name: 'Projects', description: 'Project-related templates', icon: '📁' },
    { id: 'custom', name: 'Custom', description: 'Custom templates', icon: '⚙️' }
  ];

  // Default templates
  private defaultTemplates: SearchTemplate[] = [
    {
      id: 'recent-notes',
      name: 'Recent Notes',
      description: 'Find notes created in the last 7 days',
      query: '',
      filters: {
        datePreset: 'week',
        dateRange: { start: null, end: null },
        contentTypes: {
          hasLinks: false,
          hasTags: false,
          hasContent: true,
          hasAttachments: false,
          isArchived: false
        },
        includeTags: [],
        excludeTags: [],
        tagLogic: 'any',
        textFilters: [],
        sortBy: 'date',
        sortOrder: 'desc',
        maxResults: 50
      },
      category: 'general',
      isDefault: true,
      createdAt: Date.now(),
      usageCount: 0
    },
    {
      id: 'tagged-notes',
      name: 'Tagged Notes',
      description: 'Find notes that have tags',
      query: '',
      filters: {
        datePreset: 'all',
        dateRange: { start: null, end: null },
        contentTypes: {
          hasLinks: false,
          hasTags: true,
          hasContent: false,
          hasAttachments: false,
          isArchived: false
        },
        includeTags: [],
        excludeTags: [],
        tagLogic: 'any',
        textFilters: [],
        sortBy: 'date',
        sortOrder: 'desc',
        maxResults: 50
      },
      category: 'general',
      isDefault: true,
      createdAt: Date.now(),
      usageCount: 0
    },
    {
      id: 'linked-notes',
      name: 'Linked Notes',
      description: 'Find notes that contain links',
      query: '',
      filters: {
        datePreset: 'all',
        dateRange: { start: null, end: null },
        contentTypes: {
          hasLinks: true,
          hasTags: false,
          hasContent: false,
          hasAttachments: false,
          isArchived: false
        },
        includeTags: [],
        excludeTags: [],
        tagLogic: 'any',
        textFilters: [],
        sortBy: 'date',
        sortOrder: 'desc',
        maxResults: 50
      },
      category: 'general',
      isDefault: true,
      createdAt: Date.now(),
      usageCount: 0
    },
    {
      id: 'archived-notes',
      name: 'Archived Notes',
      description: 'Find archived notes',
      query: '',
      filters: {
        datePreset: 'all',
        dateRange: { start: null, end: null },
        contentTypes: {
          hasLinks: false,
          hasTags: false,
          hasContent: false,
          hasAttachments: false,
          isArchived: true
        },
        includeTags: [],
        excludeTags: [],
        tagLogic: 'any',
        textFilters: [],
        sortBy: 'date',
        sortOrder: 'desc',
        maxResults: 50
      },
      category: 'general',
      isDefault: true,
      createdAt: Date.now(),
      usageCount: 0
    }
  ];

  getCategories(): SearchTemplateCategory[] {
    try {
      const stored = localStorage.getItem(this.CATEGORIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default categories
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(this.defaultCategories));
      return this.defaultCategories;
    } catch (error) {
      console.error('Error loading template categories:', error);
      return this.defaultCategories;
    }
  }

  addCategory(category: Omit<SearchTemplateCategory, 'id'>): SearchTemplateCategory {
    const categories = this.getCategories();
    const newCategory: SearchTemplateCategory = {
      ...category,
      id: `category-${Date.now()}`
    };
    categories.push(newCategory);
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<SearchTemplateCategory>): boolean {
    const categories = this.getCategories();
    const index = categories.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
      return true;
    }
    return false;
  }

  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const filtered = categories.filter(cat => cat.id !== id);
    if (filtered.length !== categories.length) {
      localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(filtered));
      // Move templates from deleted category to 'custom'
      const templates = this.getTemplates();
      const updatedTemplates = templates.map(template => 
        template.category === id ? { ...template, category: 'custom' } : template
      );
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTemplates));
      return true;
    }
    return false;
  }

  getTemplates(): SearchTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      // Initialize with default templates
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultTemplates));
      return this.defaultTemplates;
    } catch (error) {
      console.error('Error loading search templates:', error);
      return this.defaultTemplates;
    }
  }

  getTemplatesByCategory(categoryId: string): SearchTemplate[] {
    return this.getTemplates().filter(template => template.category === categoryId);
  }

  getTemplate(id: string): SearchTemplate | null {
    const templates = this.getTemplates();
    return templates.find(template => template.id === id) || null;
  }

  saveTemplate(template: Omit<SearchTemplate, 'id' | 'createdAt' | 'usageCount'>): SearchTemplate {
    const templates = this.getTemplates();
    const newTemplate: SearchTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
      usageCount: 0
    };
    templates.push(newTemplate);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<SearchTemplate>): boolean {
    const templates = this.getTemplates();
    const index = templates.findIndex(template => template.id === id);
    if (index !== -1) {
      templates[index] = { ...templates[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
      return true;
    }
    return false;
  }

  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates();
    const filtered = templates.filter(template => template.id !== id);
    if (filtered.length !== templates.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  incrementUsage(id: string): void {
    const templates = this.getTemplates();
    const index = templates.findIndex(template => template.id === id);
    if (index !== -1) {
      templates[index].usageCount += 1;
      templates[index].lastUsed = Date.now();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    }
  }

  getPopularTemplates(limit: number = 5): SearchTemplate[] {
    const templates = this.getTemplates();
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  getRecentTemplates(limit: number = 5): SearchTemplate[] {
    const templates = this.getTemplates();
    return templates
      .filter(template => template.lastUsed)
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, limit);
  }

  duplicateTemplate(id: string): SearchTemplate | null {
    const template = this.getTemplate(id);
    if (template) {
      const duplicated: Omit<SearchTemplate, 'id' | 'createdAt' | 'usageCount'> = {
        name: `${template.name} (Copy)`,
        description: template.description,
        query: template.query,
        filters: template.filters,
        category: template.category
      };
      return this.saveTemplate(duplicated);
    }
    return null;
  }

  exportTemplates(): string {
    const templates = this.getTemplates();
    const categories = this.getCategories();
    return JSON.stringify({ templates, categories }, null, 2);
  }

  importTemplates(data: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(data);
      if (parsed.templates && Array.isArray(parsed.templates)) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(parsed.templates));
      }
      if (parsed.categories && Array.isArray(parsed.categories)) {
        localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(parsed.categories));
      }
      return { success: true, message: 'Templates imported successfully' };
    } catch (error) {
      return { success: false, message: 'Invalid template data format' };
    }
  }

  resetToDefaults(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultTemplates));
    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(this.defaultCategories));
  }

  getTemplateStats(): {
    total: number;
    byCategory: Record<string, number>;
    mostUsed: SearchTemplate | null;
    recentlyUsed: SearchTemplate | null;
  } {
    const templates = this.getTemplates();
    const byCategory: Record<string, number> = {};
    
    templates.forEach(template => {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
    });

    const mostUsed = templates.reduce((max, current) => 
      current.usageCount > max.usageCount ? current : max, templates[0] || null
    );

    const recentlyUsed = templates
      .filter(template => template.lastUsed)
      .reduce((recent, current) => 
        (current.lastUsed || 0) > (recent.lastUsed || 0) ? current : recent, templates[0] || null
      );

    return {
      total: templates.length,
      byCategory,
      mostUsed,
      recentlyUsed
    };
  }
}

export const SearchTemplates = new SearchTemplates(); 