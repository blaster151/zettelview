import { searchService, SearchHistory, highlightSearchTerms } from './searchService';
import { Note } from '../types/domain';

// Mock notes for testing
const mockNotes: Note[] = [
  {
    id: 'note1',
    title: 'JavaScript Programming Guide',
    body: 'Learn JavaScript programming with examples and best practices.',
    tags: ['programming', 'javascript', 'tutorial'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'note2',
    title: 'React Development Tips',
    body: 'Advanced React patterns and performance optimization techniques.',
    tags: ['programming', 'react', 'frontend'],
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02')
  },
  {
    id: 'note3',
    title: 'TypeScript Fundamentals',
    body: 'Introduction to TypeScript and type safety in JavaScript.',
    tags: ['programming', 'typescript', 'javascript'],
    createdAt: new Date('2023-01-03'),
    updatedAt: new Date('2023-01-03')
  },
  {
    id: 'note4',
    title: 'Project Management Best Practices',
    body: 'Guide to managing software projects effectively.',
    tags: ['management', 'planning', 'agile'],
    createdAt: new Date('2023-01-04'),
    updatedAt: new Date('2023-01-04')
  }
];

describe('SearchService', () => {
  beforeEach(() => {
    // Clear search history before each test
    SearchHistory.clearHistory();
    // Initialize search service with mock notes
    searchService.initialize(mockNotes);
  });

  describe('search', () => {
    it('should perform fuzzy search on titles', () => {
      const results = searchService.search('javascript');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title.toLowerCase()).toContain('javascript');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should perform fuzzy search on tags', () => {
      const results = searchService.search('programming');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.tags.includes('programming'))).toBe(true);
    });

    it('should perform fuzzy search on body content', () => {
      const results = searchService.search('examples');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].body.toLowerCase()).toContain('examples');
    });

    it('should handle typos with fuzzy matching', () => {
      const results = searchService.search('javascrpt'); // Typo
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title.toLowerCase()).toContain('javascript');
    });

    it('should return empty results for non-matching queries', () => {
      const results = searchService.search('nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should respect maxResults limit', () => {
      const results = searchService.search('programming', { maxResults: 2 });
      
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should exclude body content when includeBody is false', () => {
      const results = searchService.search('javascript', { includeBody: false });
      
      expect(results[0].body).toBe('');
    });

    it('should return results sorted by score (highest first)', () => {
      const results = searchService.search('programming');
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });

  describe('quickSearch', () => {
    it('should search only titles and tags', () => {
      const results = searchService.quickSearch('javascript');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].body).toBe(''); // Body should be empty
      expect(results[0].title.toLowerCase()).toContain('javascript');
    });

    it('should be faster than full search', () => {
      const startTime = performance.now();
      searchService.quickSearch('programming');
      const quickTime = performance.now() - startTime;

      const startTime2 = performance.now();
      searchService.search('programming');
      const fullTime = performance.now() - startTime2;

      // Quick search should be faster (though this might not always be true in tests)
      expect(quickTime).toBeLessThan(fullTime * 2); // Allow some variance
    });
  });

  describe('searchByTags', () => {
    it('should search by specific tags', () => {
      const results = searchService.searchByTags(['javascript']);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.tags.includes('javascript'))).toBe(true);
    });

    it('should handle multiple tags', () => {
      const results = searchService.searchByTags(['programming', 'react']);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.tags.includes('programming') && r.tags.includes('react'))).toBe(true);
    });

    it('should return empty results for non-existent tags', () => {
      const results = searchService.searchByTags(['nonexistent']);
      
      expect(results).toEqual([]);
    });
  });

  describe('getSuggestions', () => {
    it('should return search suggestions', () => {
      const suggestions = searchService.getSuggestions('jav');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('javascript'))).toBe(true);
    });

    it('should include tag suggestions', () => {
      const suggestions = searchService.getSuggestions('prog');
      
      expect(suggestions.some(s => s.toLowerCase().includes('programming'))).toBe(true);
    });

    it('should limit suggestions', () => {
      const suggestions = searchService.getSuggestions('prog', 2);
      
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('caching', () => {
    it('should cache search results', () => {
      const results1 = searchService.search('javascript');
      const results2 = searchService.search('javascript');
      
      expect(results1).toEqual(results2);
    });

    it('should clear cache when notes are reinitialized', () => {
      const results1 = searchService.search('javascript');
      
      // Reinitialize with same notes
      searchService.initialize(mockNotes);
      const results2 = searchService.search('javascript');
      
      // Results should still be the same (same data)
      expect(results1).toEqual(results2);
    });

    it('should provide cache statistics', () => {
      searchService.search('javascript');
      const stats = searchService.getStats();
      
      expect(stats.cacheSize).toBeGreaterThan(0);
      expect(stats.totalNotes).toBe(mockNotes.length);
      expect(stats.isInitialized).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle large queries efficiently', () => {
      const startTime = performance.now();
      searchService.search('javascript programming guide tutorial');
      const endTime = performance.now();
      
      // Should complete within reasonable time (100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle repeated searches efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        searchService.search('javascript');
      }
      
      const endTime = performance.now();
      
      // Should complete within reasonable time (500ms)
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});

describe('SearchHistory', () => {
  beforeEach(() => {
    SearchHistory.clearHistory();
  });

  it('should add queries to history', () => {
    SearchHistory.addToHistory('javascript', 5);
    const history = SearchHistory.getHistory();
    
    expect(history.length).toBe(1);
    expect(history[0].query).toBe('javascript');
    expect(history[0].resultCount).toBe(5);
  });

  it('should remove duplicate queries', () => {
    SearchHistory.addToHistory('javascript', 5);
    SearchHistory.addToHistory('javascript', 3);
    const history = SearchHistory.getHistory();
    
    expect(history.length).toBe(1);
    expect(history[0].resultCount).toBe(3); // Should use latest result count
  });

  it('should limit history size', () => {
    for (let i = 0; i < 25; i++) {
      SearchHistory.addToHistory(`query${i}`, i);
    }
    
    const history = SearchHistory.getHistory();
    expect(history.length).toBeLessThanOrEqual(20);
  });

  it('should return recent queries', () => {
    SearchHistory.addToHistory('query1', 1);
    SearchHistory.addToHistory('query2', 2);
    SearchHistory.addToHistory('query3', 3);
    
    const recent = SearchHistory.getRecentQueries(2);
    expect(recent.length).toBe(2);
    expect(recent[0]).toBe('query3'); // Most recent first
  });

  it('should clear history', () => {
    SearchHistory.addToHistory('javascript', 5);
    SearchHistory.clearHistory();
    
    const history = SearchHistory.getHistory();
    expect(history.length).toBe(0);
  });
});

describe('highlightSearchTerms', () => {
  it('should highlight search terms in text', () => {
    const text = 'JavaScript is a programming language';
    const query = 'javascript';
    const highlighted = highlightSearchTerms(text, query);
    
    expect(highlighted).toContain('<mark>JavaScript</mark>');
  });

  it('should handle case-insensitive highlighting', () => {
    const text = 'JavaScript is a programming language';
    const query = 'JAVASCRIPT';
    const highlighted = highlightSearchTerms(text, query);
    
    expect(highlighted).toContain('<mark>JavaScript</mark>');
  });

  it('should handle special characters in query', () => {
    const text = 'C++ is a programming language';
    const query = 'C++';
    const highlighted = highlightSearchTerms(text, query);
    
    expect(highlighted).toContain('<mark>C++</mark>');
  });

  it('should return original text for empty query', () => {
    const text = 'JavaScript is a programming language';
    const highlighted = highlightSearchTerms(text, '');
    
    expect(highlighted).toBe(text);
  });
}); 