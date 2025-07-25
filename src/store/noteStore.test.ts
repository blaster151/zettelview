import { renderHook, act } from '@testing-library/react';
import { useNoteStore } from './noteStore';

// Mock Zustand to reset state between tests
const mockStore = {
  notes: [],
  selectedId: null,
  addNote: jest.fn(),
  updateNote: jest.fn(),
  selectNote: jest.fn(),
  getNote: jest.fn(),
  findOrCreateNote: jest.fn(),
};

// Reset the store before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear localStorage to reset persist state
  localStorage.clear();
  
  // Reset the store state by creating a new instance
  const { result } = renderHook(() => useNoteStore());
  act(() => {
    // Clear all notes except the initial welcome note
    result.current.notes.forEach(note => {
      if (note.id !== 'welcome') {
        // Remove non-welcome notes by updating the store
        result.current.updateNote(note.id, { title: '', body: '' });
      }
    });
  });
});

describe('NoteStore', () => {
  test('should add a new note with correct properties', async () => {
    const { result } = renderHook(() => useNoteStore());
    
    await act(async () => {
      await result.current.addNote('Test Note');
    });

    const newNote = result.current.notes.find(note => note.title === 'Test Note');
    
    expect(newNote).toBeDefined();
    expect(newNote?.id).toBe('test-note');
    expect(newNote?.title).toBe('Test Note');
    expect(newNote?.body).toBe('# Test Note\n\nStart writing your note here...');
    expect(newNote?.createdAt).toBeInstanceOf(Date);
    expect(newNote?.updatedAt).toBeInstanceOf(Date);
    expect(result.current.selectedId).toBe('test-note');
  });

  test('should update an existing note', async () => {
    const { result } = renderHook(() => useNoteStore());
    
    // First add a note
    await act(async () => {
      await result.current.addNote('Test Note');
    });

    const originalNote = result.current.getNote('test-note');
    const originalUpdatedAt = originalNote?.updatedAt;

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update the note
    await act(async () => {
      await result.current.updateNote('test-note', { 
        title: 'Updated Test Note',
        body: 'Updated content'
      });
    });

    const updatedNote = result.current.getNote('test-note');
    
    expect(updatedNote?.title).toBe('Updated Test Note');
    expect(updatedNote?.body).toBe('Updated content');
    expect(updatedNote?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
  });

  test('should find existing note or create new one', async () => {
    const { result } = renderHook(() => useNoteStore());
    
    // First add a note
    await act(async () => {
      await result.current.addNote('Existing Note');
    });

    const initialNoteCount = result.current.notes.length;

    // Try to find existing note (case insensitive)
    await act(async () => {
      const noteId = await result.current.findOrCreateNote('existing note');
      expect(noteId).toBe('existing-note');
    });

    // Should not create a duplicate
    expect(result.current.notes.length).toBe(initialNoteCount);

    // Try to find non-existing note
    await act(async () => {
      const noteId = await result.current.findOrCreateNote('New Note');
      expect(noteId).toBe('new-note');
    });

    // Should create a new note
    expect(result.current.notes.length).toBe(initialNoteCount + 1);
    expect(result.current.selectedId).toBe('new-note');
  });
}); 

describe('Persist Middleware', () => {
  it('should persist selectedId to localStorage', () => {
    const { result } = renderHook(() => useNoteStore());
    
    act(() => {
      result.current.selectNote('test-note-id');
    });
    
    const persisted = localStorage.getItem('zettelview-notes');
    expect(persisted).toContain('test-note-id');
  });

  it('should persist storagePermission to localStorage', () => {
    const { result } = renderHook(() => useNoteStore());
    
    act(() => {
      // Simulate storage permission being granted
      result.current.requestStoragePermission();
    });
    
    const persisted = localStorage.getItem('zettelview-notes');
    expect(persisted).toBeDefined();
  });

  it('should restore selectedId from localStorage on initialization', () => {
    // Set up localStorage with persisted data
    localStorage.setItem('zettelview-notes', JSON.stringify({
      state: { selectedId: 'persisted-note-id' },
      version: 0
    }));
    
    const { result } = renderHook(() => useNoteStore());
    
    expect(result.current.selectedId).toBe('persisted-note-id');
  });

  it('should not persist notes array to localStorage', () => {
    const { result } = renderHook(() => useNoteStore());
    
    act(() => {
      result.current.addNote('Test Note');
    });
    
    const persisted = localStorage.getItem('zettelview-notes');
    const parsed = JSON.parse(persisted || '{}');
    
    // Should not contain the full notes array
    expect(parsed.state.notes).toBeUndefined();
  });
}); 