import { 
  fuzzySearch, 
  SearchHistory, 
  highlightSearchTerms, 
  getSearchSuggestions,
  SearchResult 
} from './searchUtils';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockNotes = [
  {
    id: 'note1',
    title: 'JavaScript Programming Guide',
    body: 'Learn JavaScript programming with examples and best practices.',
    tags: ['javascript', 'programming', 'guide']
  },
  {
    id: 'note2',
    title: 'Python Basics',
    body: 'Introduction to Python programming language.',
    tags: ['python', 'basics', 'programming']
  },
  {
    id: 'note3',
    title: 'React Development',
    body: 'Building modern web applications with React.',
    tags: ['react', 'web', 'development']
  },
  {
    id: 'note4',
    title: 'Database Design',
    body: 'SQL and database design principles.',
    tags: ['database', 'sql', 'design']
  }
];

describe('Search Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('fuzzySearch', () => {
    test('should return empty array for empty query', () => {
      const results = fuzzySearch(mockNotes, '');
      expect(results).toEqual([]);
    });

    test('should find exact matches in title', () => {
      const results = fuzzySearch(mockNotes, 'JavaScript');
      expect(results).toHaveLength(1);
      expect(results[0].noteId).toBe('note1');
      expect(results[0].score).toBeGreaterThan(0);
    });

    test('should find exact matches in body', () => {
      const results = fuzzySearch(mockNotes, 'programming');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.noteId === 'note1')).toBe(true);
    });

    test('should find exact matches in tags', () => {
      const results = fuzzySearch(mockNotes, 'python');
      expect(results).toHaveLength(1);
      expect(results[0].noteId).toBe('note2');
    });

    test('should handle case-insensitive search', () => {
      const results = fuzzySearch(mockNotes, 'javascript');
      expect(results).toHaveLength(1);
      expect(results[0].noteId).toBe('note1');
    });

    test('should return results sorted by score', () => {
      const results = fuzzySearch(mockNotes, 'programming');
      expect(results.length).toBeGreaterThan(1);
      
      // Check that scores are in descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    test('should limit results based on maxResults option', () => {
      const results = fuzzySearch(mockNotes, 'programming', { maxResults: 2 });
      expect(results).toHaveLength(2);
    });

    test('should include match details', () => {
      const results = fuzzySearch(mockNotes, 'JavaScript');
      expect(results[0].matches).toBeDefined();
      expect(results[0].matches.length).toBeGreaterThan(0);
      expect(results[0].matches[0]).toHaveProperty('type');
      expect(results[0].matches[0]).toHaveProperty('field');
    });

    test('should handle fuzzy matching with typos', () => {
      const results = fuzzySearch(mockNotes, 'javascrpt'); // typo
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.noteId === 'note1')).toBe(true);
    });
  });

  describe('SearchHistory', () => {
    test('should get empty history initially', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const history = SearchHistory.getHistory();
      expect(history).toEqual([]);
    });

    test('should get history from localStorage', () => {
      const mockHistory = [
        { query: 'test', timestamp: 1234567890, resultCount: 5 }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
      
      const history = SearchHistory.getHistory();
      expect(history).toEqual(mockHistory);
    });

    test('should add item to history', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      SearchHistory.addToHistory('test query', 3);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zettelview_search_history',
        expect.stringContaining('test query')
      );
    });

    test('should remove duplicates when adding to history', () => {
      const existingHistory = [
        { query: 'test', timestamp: 1234567890, resultCount: 5 }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingHistory));
      
      SearchHistory.addToHistory('test', 3);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].resultCount).toBe(3);
    });

    test('should limit history size', () => {
      const largeHistory = Array.from({ length: 25 }, (_, i) => ({
        query: `query${i}`,
        timestamp: Date.now() + i,
        resultCount: 1
      }));
      localStorageMock.getItem.mockReturnValue(JSON.stringify(largeHistory));
      
      SearchHistory.addToHistory('new query', 1);
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(20); // MAX_HISTORY_SIZE
    });

    test('should clear history', () => {
      SearchHistory.clearHistory();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zettelview_search_history');
    });

    test('should get recent queries', () => {
      const mockHistory = [
        { query: 'query1', timestamp: 1234567890, resultCount: 1 },
        { query: 'query2', timestamp: 1234567891, resultCount: 2 },
        { query: 'query3', timestamp: 1234567892, resultCount: 3 }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));
      
      const recent = SearchHistory.getRecentQueries(2);
      expect(recent).toEqual(['query1', 'query2']);
    });

    test('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const history = SearchHistory.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('highlightSearchTerms', () => {
    test('should return original text for empty query', () => {
      const result = highlightSearchTerms('Hello world', '');
      expect(result).toBe('Hello world');
    });

    test('should highlight exact matches', () => {
      const result = highlightSearchTerms('Hello world', 'world');
      expect(result).toBe('Hello <mark>world</mark>');
    });

    test('should highlight multiple matches', () => {
      const result = highlightSearchTerms('Hello world, hello universe', 'hello');
      expect(result).toBe('<mark>Hello</mark> world, <mark>hello</mark> universe');
    });

    test('should handle case-insensitive highlighting', () => {
      const result = highlightSearchTerms('Hello WORLD', 'world');
      expect(result).toBe('Hello <mark>WORLD</mark>');
    });

    test('should highlight multiple query words', () => {
      const result = highlightSearchTerms('Hello world universe', 'world universe');
      expect(result).toBe('Hello <mark>world</mark> <mark>universe</mark>');
    });
  });

  describe('getSearchSuggestions', () => {
    test('should return empty array for empty query', () => {
      const suggestions = getSearchSuggestions(mockNotes, '');
      expect(suggestions).toEqual([]);
    });

    test('should suggest from titles', () => {
      const suggestions = getSearchSuggestions(mockNotes, 'jav');
      expect(suggestions).toContain('JavaScript');
    });

    test('should suggest from tags', () => {
      const suggestions = getSearchSuggestions(mockNotes, 'prog');
      expect(suggestions).toContain('programming');
    });

    test('should suggest from body content', () => {
      const suggestions = getSearchSuggestions(mockNotes, 'learn');
      expect(suggestions).toContain('Learn');
    });

    test('should limit suggestions', () => {
      const suggestions = getSearchSuggestions(mockNotes, 'a');
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    test('should handle case-insensitive suggestions', () => {
      const suggestions = getSearchSuggestions(mockNotes, 'JAV');
      expect(suggestions).toContain('JavaScript');
    });
  });
}); 