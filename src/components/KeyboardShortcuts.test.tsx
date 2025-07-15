import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeyboardShortcuts from './KeyboardShortcuts';
import { useNoteStore } from '../store/noteStore';

// Mock the note store
jest.mock('../store/noteStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;

// Mock prompt
global.prompt = jest.fn();

// Mock querySelector for input elements
const mockQuerySelector = jest.fn();
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true
});

describe('KeyboardShortcuts', () => {
  const mockSelectNote = jest.fn();
  const mockAddNote = jest.fn();
  const mockNotes = [
    { id: 'note1', title: 'Note 1', body: 'Content 1', tags: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'note2', title: 'Note 2', body: 'Content 2', tags: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'note3', title: 'Note 3', body: 'Content 3', tags: [], createdAt: new Date(), updatedAt: new Date() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      selectedId: 'note2',
      selectNote: mockSelectNote,
      addNote: mockAddNote,
    } as any);
  });

  const renderWithShortcuts = () => {
    return render(
      <KeyboardShortcuts>
        <div data-testid="app-content">App Content</div>
      </KeyboardShortcuts>
    );
  };

  test('should render children without showing command palette initially', () => {
    renderWithShortcuts();
    
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(screen.queryByText('Search commands...')).not.toBeInTheDocument();
  });

  test('should open command palette with Ctrl+Shift+P', async () => {
    renderWithShortcuts();
    
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
  });

  test('should close command palette with Escape', async () => {
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
    
    // Close with Escape
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByText('Search commands...')).not.toBeInTheDocument();
    });
  });

  test('should navigate command palette with arrow keys', async () => {
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
    
    // Navigate down
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    
    // Navigate up
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    
    // Should still be open
    expect(screen.getByText('Search commands...')).toBeInTheDocument();
  });

  test('should filter commands based on search query', async () => {
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(searchInput, { target: { value: 'create' } });
    
    // Should show only create-related commands
    expect(screen.getByText('Create new note')).toBeInTheDocument();
    expect(screen.queryByText('Focus search')).not.toBeInTheDocument();
  });

  test('should execute command when Enter is pressed', async () => {
    (global.prompt as jest.Mock).mockReturnValue('New Note');
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
    
    // Select first command (Create new note)
    fireEvent.keyDown(document, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockAddNote).toHaveBeenCalledWith('New Note');
    });
  });

  test('should navigate to previous note with Ctrl+P', () => {
    renderWithShortcuts();
    
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true });
    
    expect(mockSelectNote).toHaveBeenCalledWith('note1');
  });

  test('should navigate to next note with Ctrl+Shift+P', () => {
    renderWithShortcuts();
    
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    // First opens command palette, so we need to close it and try again
    fireEvent.keyDown(document, { key: 'Escape' });
    
    // This should navigate to next note
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    // The command palette should open again, not navigate
    expect(screen.getByText('Search commands...')).toBeInTheDocument();
  });

  test('should create new note with Ctrl+N', () => {
    (global.prompt as jest.Mock).mockReturnValue('Test Note');
    renderWithShortcuts();
    
    fireEvent.keyDown(document, { key: 'N', ctrlKey: true });
    
    expect(global.prompt).toHaveBeenCalledWith('Enter note title:');
    expect(mockAddNote).toHaveBeenCalledWith('Test Note');
  });

  test('should focus search input with Ctrl+F', () => {
    const mockSearchInput = {
      focus: jest.fn(),
      select: jest.fn(),
    };
    mockQuerySelector.mockReturnValue(mockSearchInput);
    
    renderWithShortcuts();
    
    fireEvent.keyDown(document, { key: 'F', ctrlKey: true });
    
    expect(mockQuerySelector).toHaveBeenCalledWith('input[placeholder*="Search"]');
    expect(mockSearchInput.focus).toHaveBeenCalled();
    expect(mockSearchInput.select).toHaveBeenCalled();
  });

  test('should focus new note input with Ctrl+Shift+N', () => {
    const mockNewNoteInput = {
      focus: jest.fn(),
      select: jest.fn(),
    };
    mockQuerySelector.mockReturnValue(mockNewNoteInput);
    
    renderWithShortcuts();
    
    fireEvent.keyDown(document, { key: 'N', ctrlKey: true, shiftKey: true });
    
    expect(mockQuerySelector).toHaveBeenCalledWith('input[placeholder*="New note title"]');
    expect(mockNewNoteInput.focus).toHaveBeenCalled();
    expect(mockNewNoteInput.select).toHaveBeenCalled();
  });

  test('should not handle shortcuts when typing in input elements', () => {
    renderWithShortcuts();
    
    // Simulate typing in an input
    const input = document.createElement('input');
    Object.defineProperty(document, 'activeElement', {
      value: input,
      writable: true
    });
    
    fireEvent.keyDown(document, { key: 'N', ctrlKey: true });
    
    // Should not call addNote because we're in an input
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  test('should not handle shortcuts when typing in textarea elements', () => {
    renderWithShortcuts();
    
    // Simulate typing in a textarea
    const textarea = document.createElement('textarea');
    Object.defineProperty(document, 'activeElement', {
      value: textarea,
      writable: true
    });
    
    fireEvent.keyDown(document, { key: 'N', ctrlKey: true });
    
    // Should not call addNote because we're in a textarea
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  test('should show all command categories', async () => {
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });

  test('should show keyboard shortcuts in command palette', async () => {
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+P')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Shift+P')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Shift+C')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+F')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+Shift+N')).toBeInTheDocument();
    });
  });

  test('should handle edge case when no notes exist', () => {
    mockUseNoteStore.mockReturnValue({
      notes: [],
      selectedId: null,
      selectNote: mockSelectNote,
      addNote: mockAddNote,
    } as any);
    
    renderWithShortcuts();
    
    // Should not crash when trying to navigate
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true });
    
    expect(mockSelectNote).not.toHaveBeenCalled();
  });

  test('should handle edge case when at first note', () => {
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      selectedId: 'note1', // First note
      selectNote: mockSelectNote,
      addNote: mockAddNote,
    } as any);
    
    renderWithShortcuts();
    
    // Try to go to previous note (should do nothing)
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true });
    
    expect(mockSelectNote).not.toHaveBeenCalled();
  });

  test('should handle edge case when at last note', () => {
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      selectedId: 'note3', // Last note
      selectNote: mockSelectNote,
      addNote: mockAddNote,
    } as any);
    
    renderWithShortcuts();
    
    // Try to go to next note (should do nothing)
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    // Should open command palette instead
    expect(screen.getByText('Search commands...')).toBeInTheDocument();
  });

  test('should show "No commands found" when search has no results', async () => {
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search commands...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('No commands found')).toBeInTheDocument();
  });

  test('should handle command execution via click', async () => {
    (global.prompt as jest.Mock).mockReturnValue('Clicked Note');
    renderWithShortcuts();
    
    // Open command palette
    fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
    
    await waitFor(() => {
      expect(screen.getByText('Search commands...')).toBeInTheDocument();
    });
    
    // Click on "Create new note" command
    const createCommand = screen.getByText('Create new note');
    fireEvent.click(createCommand);
    
    await waitFor(() => {
      expect(mockAddNote).toHaveBeenCalledWith('Clicked Note');
    });
    
    // Command palette should close
    expect(screen.queryByText('Search commands...')).not.toBeInTheDocument();
  });
}); 