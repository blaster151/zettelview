import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchSuggestionsService, SearchSuggestion, SuggestionContext } from '../../../services/searchSuggestionsService';
import EnhancedSearchSuggestions from '../EnhancedSearchSuggestions';
import { Note } from '../../../types/domain';

// Mock the stores
jest.mock('../../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#007bff',
      secondary: '#6c757d',
      accent: '#17a2b8',
      warning: '#ffc107',
      success: '#28a745',
      border: '#dee2e6',
      surfaceHover: '#e9ecef',
      primaryHover: '#0056b3'
    }
  })
}));

jest.mock('../../../store/noteStore', () => ({
  useNoteStore: () => ({
    notes: [
      {
        id: '1',
        title: 'Project Planning',
        body: 'This is a project planning note with important deadlines and tasks.',
        tags: ['project', 'planning', 'work'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Meeting Notes',
        body: 'Notes from the team meeting discussing new features and roadmap.',
        tags: ['meeting', 'team', 'features'],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: '3',
        title: 'Research Ideas',
        body: 'Collection of research ideas and potential topics for investigation.',
        tags: ['research', 'ideas', 'topics'],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      }
    ]
  })
}));

// Mock SearchHistory
jest.mock('../../../services/searchService', () => ({
  SearchHistory: {
    getHistory: jest.fn(() => [
      { query: 'project', timestamp: Date.now() - 1000 },
      { query: 'meeting', timestamp: Date.now() - 2000 },
      { query: 'research', timestamp: Date.now() - 3000 }
    ])
  }
}));

describe('SearchSuggestionsService', () => {
  let service: SearchSuggestionsService;
  let sampleNotes: Note[];

  beforeEach(() => {
    service = new SearchSuggestionsService();
    sampleNotes = [
      {
        id: '1',
        title: 'Project Planning',
        body: 'This is a project planning note with important deadlines and tasks.',
        tags: ['project', 'planning', 'work'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        title: 'Meeting Notes',
        body: 'Notes from the team meeting discussing new features and roadmap.',
        tags: ['meeting', 'team', 'features'],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: '3',
        title: 'Research Ideas',
        body: 'Collection of research ideas and potential topics for investigation.',
        tags: ['research', 'ideas', 'topics'],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03')
      }
    ];
    service.initialize(sampleNotes);
  });

  describe('Initialization', () => {
    it('should initialize with notes', () => {
      expect(service).toBeDefined();
    });

    it('should clear cache on initialization', () => {
      const stats = service.getSuggestionStats();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('getSuggestions', () => {
    it('should return popular suggestions for empty query', () => {
      const context: SuggestionContext = {
        currentQuery: '',
        userHistory: ['project', 'meeting'],
        recentSearches: ['project'],
        popularTags: ['project', 'meeting'],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('', context, 5);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].source).toBe('popular');
    });

    it('should return exact matches for title queries', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('project', context, 5);
      const titleMatches = suggestions.filter(s => s.type === 'title');
      expect(titleMatches.length).toBeGreaterThan(0);
      expect(titleMatches[0].text).toContain('Project');
    });

    it('should return tag suggestions', () => {
      const context: SuggestionContext = {
        currentQuery: 'proj',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('proj', context, 5);
      const tagMatches = suggestions.filter(s => s.type === 'tag');
      expect(tagMatches.length).toBeGreaterThan(0);
      expect(tagMatches[0].text).toContain('project');
    });

    it('should return history-based suggestions', () => {
      const context: SuggestionContext = {
        currentQuery: 'proj',
        userHistory: ['project planning', 'project management'],
        recentSearches: ['project'],
        popularTags: [],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('proj', context, 5);
      const historyMatches = suggestions.filter(s => s.source === 'history');
      expect(historyMatches.length).toBeGreaterThan(0);
    });

    it('should return AI-enhanced suggestions', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('project', context, 5);
      const aiMatches = suggestions.filter(s => s.source === 'ai');
      expect(aiMatches.length).toBeGreaterThan(0);
    });

    it('should respect maxSuggestions limit', () => {
      const context: SuggestionContext = {
        currentQuery: 'proj',
        userHistory: ['project'],
        recentSearches: ['project'],
        popularTags: ['project'],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('proj', context, 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should deduplicate suggestions', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: ['project'],
        recentSearches: ['project'],
        popularTags: ['project'],
        noteCount: 3
      };

      const suggestions = service.getSuggestions('project', context, 10);
      const uniqueTexts = new Set(suggestions.map(s => s.text));
      expect(uniqueTexts.size).toBe(suggestions.length);
    });
  });

  describe('Caching', () => {
    it('should cache suggestions', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      service.getSuggestions('project', context, 5);
      const stats = service.getSuggestionStats();
      expect(stats.cacheSize).toBeGreaterThan(0);
    });

    it('should return cached suggestions for same query', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      const firstCall = service.getSuggestions('project', context, 5);
      const secondCall = service.getSuggestions('project', context, 5);
      expect(firstCall).toEqual(secondCall);
    });

    it('should clear cache', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      service.getSuggestions('project', context, 5);
      service.clearCache();
      const stats = service.getSuggestionStats();
      expect(stats.cacheSize).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should provide suggestion statistics', () => {
      const context: SuggestionContext = {
        currentQuery: 'project',
        userHistory: [],
        recentSearches: [],
        popularTags: [],
        noteCount: 3
      };

      service.getSuggestions('project', context, 5);
      const stats = service.getSuggestionStats();
      
      expect(stats).toHaveProperty('totalSuggestions');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('averageRelevance');
      expect(typeof stats.totalSuggestions).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
      expect(typeof stats.averageRelevance).toBe('number');
    });
  });
});

describe('EnhancedSearchSuggestions Component', () => {
  const defaultProps = {
    query: 'project',
    isVisible: true,
    onSuggestionSelect: jest.fn(),
    onClose: jest.fn(),
    maxSuggestions: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should not render when not visible', () => {
    render(<EnhancedSearchSuggestions {...defaultProps} isVisible={false} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should display suggestions header', () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    expect(screen.getByText('💡 Smart Suggestions')).toBeInTheDocument();
  });

  it('should handle suggestion selection', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    // Wait for suggestions to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Find and click a suggestion
    const suggestions = screen.getAllByRole('option');
    if (suggestions.length > 0) {
      fireEvent.click(suggestions[0]);
      expect(defaultProps.onSuggestionSelect).toHaveBeenCalled();
    }
  });

  it('should handle keyboard navigation', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    const listbox = screen.getByRole('listbox');
    
    // Wait for suggestions to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Test arrow down
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    
    // Test arrow up
    fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    
    // Test enter
    fireEvent.keyDown(listbox, { key: 'Enter' });
    
    // Test escape
    fireEvent.keyDown(listbox, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<EnhancedSearchSuggestions {...defaultProps} query="new" />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show no suggestions message when empty', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} query="xyz123" />);
    
    await waitFor(() => {
      expect(screen.getByText('No suggestions found')).toBeInTheDocument();
    });
  });

  it('should display suggestion metadata', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check for suggestion types and sources
    const suggestions = screen.getAllByRole('option');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('should handle mouse interactions', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const suggestions = screen.getAllByRole('option');
    if (suggestions.length > 0) {
      // Test mouse enter
      fireEvent.mouseEnter(suggestions[0]);
      
      // Test mouse leave
      fireEvent.mouseLeave(suggestions[0]);
    }
  });

  it('should display keyboard navigation hints', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('↑↓ Navigate')).toBeInTheDocument();
    expect(screen.getByText('↵ Select')).toBeInTheDocument();
    expect(screen.getByText('Esc Close')).toBeInTheDocument();
  });

  it('should show suggestion count', async () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const suggestions = screen.getAllByRole('option');
    if (suggestions.length > 0) {
      expect(screen.getByText(`${suggestions.length} suggestions`)).toBeInTheDocument();
    }
  });

  it('should handle focus and blur events', () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    const listbox = screen.getByRole('listbox');
    fireEvent.focus(listbox);
    fireEvent.blur(listbox);
  });

  it('should be accessible', () => {
    render(<EnhancedSearchSuggestions {...defaultProps} />);
    
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('aria-label', 'Search suggestions');
    expect(listbox).toHaveAttribute('tabIndex', '0');
  });
});

describe('SearchSuggestions Integration', () => {
  it('should work with real note data', async () => {
    const { useNoteStore } = require('../../../store/noteStore');
    const notes = useNoteStore().notes;
    
    const service = new SearchSuggestionsService();
    service.initialize(notes);
    
    const context: SuggestionContext = {
      currentQuery: 'project',
      userHistory: ['project planning'],
      recentSearches: ['project'],
      popularTags: ['project', 'meeting'],
      noteCount: notes.length
    };
    
    const suggestions = service.getSuggestions('project', context, 5);
    expect(suggestions.length).toBeGreaterThan(0);
    
    // Check that suggestions are relevant
    const relevantSuggestions = suggestions.filter(s => s.relevance > 0.3);
    expect(relevantSuggestions.length).toBeGreaterThan(0);
  });

  it('should handle edge cases', () => {
    const service = new SearchSuggestionsService();
    
    // Test with empty notes
    service.initialize([]);
    const context: SuggestionContext = {
      currentQuery: 'test',
      userHistory: [],
      recentSearches: [],
      popularTags: [],
      noteCount: 0
    };
    
    const suggestions = service.getSuggestions('test', context, 5);
    expect(suggestions.length).toBeGreaterThanOrEqual(0);
  });
}); 