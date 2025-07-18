import { renderHook, act } from '@testing-library/react';
import { useInternalLinks } from './useInternalLinks';
import { useNoteStore } from '../store/noteStore';
import { notificationService } from '../services/notificationService';

// Mock dependencies
jest.mock('../store/noteStore');
jest.mock('../services/notificationService');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;

describe('useInternalLinks', () => {
  const mockFindOrCreateNote = jest.fn();
  const mockSelectNote = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNoteStore.mockReturnValue({
      findOrCreateNote: mockFindOrCreateNote,
      selectNote: mockSelectNote,
      notes: [],
      selectedId: null,
      isInitialized: true,
      storagePermission: true,
      searchResults: [],
      isSearching: false,
      initialize: jest.fn(),
      requestStoragePermission: jest.fn(),
      addNote: jest.fn(),
      updateNote: jest.fn(),
      getNote: jest.fn(),
      deleteNote: jest.fn(),
      loadNotesFromStorage: jest.fn(),
      searchNotes: jest.fn(),
      quickSearch: jest.fn(),
      searchByTags: jest.fn(),
      clearSearch: jest.fn(),
      getSearchSuggestions: jest.fn()
    });

    mockNotificationService.error = jest.fn();
  });

  describe('parseInternalLinks', () => {
    it('should parse internal links correctly', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = 'This note links to [[Test Note]] and [[Another Note]].';
      const parsed = result.current.parseInternalLinks(text);
      
      expect(parsed).toEqual([
        { type: 'text', content: 'This note links to ' },
        { type: 'link', content: '[[Test Note]]', noteTitle: 'Test Note' },
        { type: 'text', content: ' and ' },
        { type: 'link', content: '[[Another Note]]', noteTitle: 'Another Note' },
        { type: 'text', content: '.' }
      ]);
    });

    it('should handle text without internal links', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = 'This is just regular text without any links.';
      const parsed = result.current.parseInternalLinks(text);
      
      expect(parsed).toEqual([
        { type: 'text', content: 'This is just regular text without any links.' }
      ]);
    });

    it('should handle empty text', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const parsed = result.current.parseInternalLinks('');
      
      expect(parsed).toEqual([]);
    });

    it('should handle text with only internal links', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = '[[Test Note]]';
      const parsed = result.current.parseInternalLinks(text);
      
      expect(parsed).toEqual([
        { type: 'link', content: '[[Test Note]]', noteTitle: 'Test Note' }
      ]);
    });

    it('should handle multiple consecutive links', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = '[[Link1]][[Link2]][[Link3]]';
      const parsed = result.current.parseInternalLinks(text);
      
      expect(parsed).toEqual([
        { type: 'link', content: '[[Link1]]', noteTitle: 'Link1' },
        { type: 'link', content: '[[Link2]]', noteTitle: 'Link2' },
        { type: 'link', content: '[[Link3]]', noteTitle: 'Link3' }
      ]);
    });
  });

  describe('handleInternalLinkClick', () => {
    it('should handle successful link navigation', async () => {
      const { result } = renderHook(() => useInternalLinks());
      
      mockFindOrCreateNote.mockResolvedValue('test-note-id');
      
      await act(async () => {
        await result.current.handleInternalLinkClick('Test Note');
      });
      
      expect(mockFindOrCreateNote).toHaveBeenCalledWith('Test Note');
      expect(mockSelectNote).toHaveBeenCalledWith('test-note-id');
    });

    it('should handle navigation errors gracefully', async () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const error = new Error('Navigation failed');
      mockFindOrCreateNote.mockRejectedValue(error);
      
      await act(async () => {
        await result.current.handleInternalLinkClick('Test Note');
      });
      
      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Link Navigation Failed',
        'Unable to navigate to "Test Note". Please try again or create the note manually.'
      );
    });
  });

  describe('isValidInternalLink', () => {
    it('should validate correct internal link format', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      expect(result.current.isValidInternalLink('[[Test Note]]')).toBe(true);
      expect(result.current.isValidInternalLink('[[Another Note]]')).toBe(true);
      expect(result.current.isValidInternalLink('[[Note with spaces]]')).toBe(true);
    });

    it('should reject invalid internal link format', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      expect(result.current.isValidInternalLink('Test Note')).toBe(false);
      expect(result.current.isValidInternalLink('[Test Note]')).toBe(false);
      expect(result.current.isValidInternalLink('[[Test Note')).toBe(false);
      expect(result.current.isValidInternalLink('Test Note]]')).toBe(false);
      expect(result.current.isValidInternalLink('')).toBe(false);
    });
  });

  describe('extractInternalLinks', () => {
    it('should extract all internal links from text', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = 'This note links to [[Test Note]] and [[Another Note]] and [[Third Note]].';
      const links = result.current.extractInternalLinks(text);
      
      expect(links).toEqual(['Test Note', 'Another Note', 'Third Note']);
    });

    it('should return empty array for text without links', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = 'This is just regular text without any links.';
      const links = result.current.extractInternalLinks(text);
      
      expect(links).toEqual([]);
    });

    it('should handle duplicate links', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = '[[Test Note]] appears twice: [[Test Note]]';
      const links = result.current.extractInternalLinks(text);
      
      expect(links).toEqual(['Test Note', 'Test Note']);
    });

    it('should handle links with special characters', () => {
      const { result } = renderHook(() => useInternalLinks());
      
      const text = '[[Note with @#$%^&*()]] and [[Another-Note]]';
      const links = result.current.extractInternalLinks(text);
      
      expect(links).toEqual(['Note with @#$%^&*()', 'Another-Note']);
    });
  });

  describe('noteExists', () => {
    it('should return true for existing notes (case-insensitive)', () => {
      // Mock notes in the store
      const mockNotes = [
        { id: '1', title: 'Test Note', body: '', tags: [], createdAt: new Date(), updatedAt: new Date() },
        { id: '2', title: 'Another Note', body: '', tags: [], createdAt: new Date(), updatedAt: new Date() }
      ];
      
      (useNoteStore as jest.Mock).mockReturnValue({
        findOrCreateNote: mockFindOrCreateNote,
        selectNote: mockSelectNote,
        notes: mockNotes
      });

      const { result } = renderHook(() => useInternalLinks());
      
      expect(result.current.noteExists('Test Note')).toBe(true);
      expect(result.current.noteExists('test note')).toBe(true);
      expect(result.current.noteExists('ANOTHER NOTE')).toBe(true);
    });

    it('should return false for non-existing notes', () => {
      // Mock empty notes array
      (useNoteStore as jest.Mock).mockReturnValue({
        findOrCreateNote: mockFindOrCreateNote,
        selectNote: mockSelectNote,
        notes: []
      });

      const { result } = renderHook(() => useInternalLinks());
      
      expect(result.current.noteExists('Non-existent Note')).toBe(false);
      expect(result.current.noteExists('')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Mock notes in the store
      const mockNotes = [
        { id: '1', title: 'Test Note', body: '', tags: [], createdAt: new Date(), updatedAt: new Date() }
      ];
      
      (useNoteStore as jest.Mock).mockReturnValue({
        findOrCreateNote: mockFindOrCreateNote,
        selectNote: mockSelectNote,
        notes: mockNotes
      });

      const { result } = renderHook(() => useInternalLinks());
      
      expect(result.current.noteExists('   Test Note   ')).toBe(false); // Whitespace matters
      expect(result.current.noteExists('TestNote')).toBe(false); // Different format
    });
  });
}); 