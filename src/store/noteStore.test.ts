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
  test('should add a new note with correct properties', () => {
    const { result } = renderHook(() => useNoteStore());
    
    act(() => {
      result.current.addNote('Test Note');
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

  test('should update an existing note', () => {
    const { result } = renderHook(() => useNoteStore());
    
    // First add a note
    act(() => {
      result.current.addNote('Test Note');
    });

    const originalNote = result.current.getNote('test-note');
    const originalUpdatedAt = originalNote?.updatedAt;

    // Wait a bit to ensure different timestamps
    setTimeout(() => {}, 10);

    // Update the note
    act(() => {
      result.current.updateNote('test-note', { 
        title: 'Updated Test Note',
        body: 'Updated content'
      });
    });

    const updatedNote = result.current.getNote('test-note');
    
    expect(updatedNote?.title).toBe('Updated Test Note');
    expect(updatedNote?.body).toBe('Updated content');
    expect(updatedNote?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
  });

  test('should find existing note or create new one', () => {
    const { result } = renderHook(() => useNoteStore());
    
    // First add a note
    act(() => {
      result.current.addNote('Existing Note');
    });

    const initialNoteCount = result.current.notes.length;

    // Try to find existing note (case insensitive)
    act(() => {
      const noteId = result.current.findOrCreateNote('existing note');
      expect(noteId).toBe('existing-note');
    });

    // Should not create a duplicate
    expect(result.current.notes.length).toBe(initialNoteCount);

    // Try to find non-existing note
    act(() => {
      const noteId = result.current.findOrCreateNote('New Note');
      expect(noteId).toBe('new-note');
    });

    // Should create a new note
    expect(result.current.notes.length).toBe(initialNoteCount + 1);
    expect(result.current.selectedId).toBe('new-note');
  });
}); 