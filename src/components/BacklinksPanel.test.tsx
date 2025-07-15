import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BacklinksPanel from './BacklinksPanel';
import { useNoteStore } from '../store/noteStore';

// Mock the note store
jest.mock('../store/noteStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;

describe('BacklinksPanel', () => {
  const mockSelectNote = jest.fn();
  const mockGetNote = jest.fn();

  const createMockNote = (id: string, title: string, body: string) => ({
    id,
    title,
    body,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should show "no backlinks" message when no notes link to current note', () => {
    const notes = [
      createMockNote('note1', 'Note 1', 'This is note 1 content.'),
      createMockNote('note2', 'Note 2', 'This is note 2 content.'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(createMockNote('current', 'Current Note', 'Current note content.'));

    render(<BacklinksPanel currentNoteId="current" />);

    expect(screen.getByText('Backlinks')).toBeInTheDocument();
    expect(screen.getByText('No other notes link to this one yet.')).toBeInTheDocument();
  });

  test('should display backlinks when other notes link to current note', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]] and other content.'),
      createMockNote('note2', 'Note 2', 'This also mentions [[Current Note]] in the text.'),
      createMockNote('note3', 'Note 3', 'This note has no links to current note.'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    expect(screen.getByText('Backlinks (2)')).toBeInTheDocument();
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
    expect(screen.queryByText('Note 3')).not.toBeInTheDocument();
  });

  test('should show context around the backlink', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'Some text before [[Current Note]] and some text after.'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    expect(screen.getByText('Note 1')).toBeInTheDocument();
    // Should show context around the link
    expect(screen.getByText(/Some text before/)).toBeInTheDocument();
    expect(screen.getByText(/and some text after/)).toBeInTheDocument();
  });

  test('should handle case-insensitive backlink matching', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[current note]] (lowercase).'),
      createMockNote('note2', 'Note 2', 'This links to [[CURRENT NOTE]] (uppercase).'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    expect(screen.getByText('Backlinks (2)')).toBeInTheDocument();
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
  });

  test('should navigate to linked note when clicked', async () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]].'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    const backlinkItem = screen.getByText('Note 1').closest('div');
    expect(backlinkItem).toBeInTheDocument();

    fireEvent.click(backlinkItem!);
    expect(mockSelectNote).toHaveBeenCalledWith('note1');
  });

  test('should navigate to linked note when Enter key is pressed', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]].'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    const backlinkItem = screen.getByText('Note 1').closest('div');
    expect(backlinkItem).toBeInTheDocument();

    fireEvent.keyDown(backlinkItem!, { key: 'Enter' });
    expect(mockSelectNote).toHaveBeenCalledWith('note1');
  });

  test('should navigate to linked note when Space key is pressed', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]].'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    const backlinkItem = screen.getByText('Note 1').closest('div');
    expect(backlinkItem).toBeInTheDocument();

    fireEvent.keyDown(backlinkItem!, { key: ' ' });
    expect(mockSelectNote).toHaveBeenCalledWith('note1');
  });

  test('should not trigger navigation for other keys', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]].'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    const backlinkItem = screen.getByText('Note 1').closest('div');
    expect(backlinkItem).toBeInTheDocument();

    fireEvent.keyDown(backlinkItem!, { key: 'Tab' });
    expect(mockSelectNote).not.toHaveBeenCalled();
  });

  test('should handle multiple links to the same note', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'First link: [[Current Note]]. Second link: [[Current Note]] again.'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    expect(screen.getByText('Backlinks (1)')).toBeInTheDocument();
    expect(screen.getByText('Note 1')).toBeInTheDocument();
    // Should only show the note once, even with multiple links
    expect(screen.getAllByText('Note 1')).toHaveLength(1);
  });

  test('should handle notes with no body content', () => {
    const notes = [
      createMockNote('current', 'Current Note', ''),
      createMockNote('note1', 'Note 1', ''),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    expect(screen.getByText('No other notes link to this one yet.')).toBeInTheDocument();
  });

  test('should handle current note not found', () => {
    const notes = [
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]].'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(null);

    render(<BacklinksPanel currentNoteId="nonexistent" />);

    expect(screen.getByText('No other notes link to this one yet.')).toBeInTheDocument();
  });

  test('should have proper accessibility attributes', () => {
    const notes = [
      createMockNote('current', 'Current Note', 'Current note content.'),
      createMockNote('note1', 'Note 1', 'This links to [[Current Note]].'),
    ];

    mockUseNoteStore.mockReturnValue({
      notes,
      getNote: mockGetNote,
      selectNote: mockSelectNote,
    } as any);

    mockGetNote.mockReturnValue(notes[0]);

    render(<BacklinksPanel currentNoteId="current" />);

    const backlinkItem = screen.getByLabelText('Navigate to note: Note 1');
    expect(backlinkItem).toBeInTheDocument();
    expect(backlinkItem).toHaveAttribute('role', 'button');
    expect(backlinkItem).toHaveAttribute('tabIndex', '0');
  });
}); 