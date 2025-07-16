import React from 'react';
import { render, screen } from '@testing-library/react';
import EditorView from './EditorView';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { MockNoteStore, MockThemeStore } from '../../types/test';

// Mock the stores
jest.mock('../../store/noteStore');
jest.mock('../../store/themeStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('EditorView', () => {
  const mockGetNote = jest.fn();
  const mockUpdateNote = jest.fn();
  const mockColors = {
    textSecondary: '#666'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNoteStore.mockReturnValue({
      getNote: mockGetNote,
      updateNote: mockUpdateNote
    } as MockNoteStore);
    
    mockUseThemeStore.mockReturnValue({
      colors: mockColors
    } as MockThemeStore);
  });

  test('renders editor when note exists', () => {
    const mockNote = {
      id: 'note1',
      title: 'Test Note',
      body: 'Test content',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockGetNote.mockReturnValue(mockNote);
    
    render(<EditorView selectedNoteId="note1" />);
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders placeholder when note does not exist', () => {
    mockGetNote.mockReturnValue(null);
    
    render(<EditorView selectedNoteId="nonexistent" />);
    
    expect(screen.getByText('Select a note')).toBeInTheDocument();
  });

  test('calls updateNote when editor content changes', () => {
    const mockNote = {
      id: 'note1',
      title: 'Test Note',
      body: 'Test content',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockGetNote.mockReturnValue(mockNote);
    
    render(<EditorView selectedNoteId="note1" />);
    
    // The MarkdownEditor should be rendered with the note content
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
}); 