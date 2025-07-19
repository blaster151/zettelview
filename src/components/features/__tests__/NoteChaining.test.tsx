import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteChaining from '../NoteChaining';
import { useNoteStore } from '../../../store/noteStore';
import { useThemeStore } from '../../../store/themeStore';

// Mock the hooks
jest.mock('../../../store/noteStore');
jest.mock('../../../store/themeStore');
jest.mock('../../../hooks/useNoteChaining');
jest.mock('../../../services/noteChainingService');
jest.mock('../../../services/notificationService');
jest.mock('../../../services/loggingService');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('NoteChaining', () => {
  const mockParentNote = {
    id: 'parent-note',
    title: 'Parent Note',
    body: 'This is the parent note content',
    tags: ['parent', 'test'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockColors = {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007bff',
    border: '#ddd'
  };

  const mockCreateChainedNote = jest.fn();
  const mockOnNoteCreated = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockUseNoteStore.mockReturnValue({
      getNote: jest.fn().mockReturnValue(mockParentNote)
    } as any);

    mockUseThemeStore.mockReturnValue({
      colors: mockColors
    } as any);

    // Mock the useNoteChaining hook
    const { useNoteChaining } = require('../../../hooks/useNoteChaining');
    useNoteChaining.mockReturnValue({
      createChainedNote: mockCreateChainedNote,
      isCreating: false,
      defaultOptions: {
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        autoTitle: true
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with parent note information', () => {
    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Create Chained Note')).toBeInTheDocument();
    expect(screen.getByText(/From: Parent Note/)).toBeInTheDocument();
  });

  test('shows error when no parent note is provided', () => {
    mockUseNoteStore.mockReturnValue({
      getNote: jest.fn().mockReturnValue(null)
    } as any);

    render(
      <NoteChaining 
        parentNoteId="nonexistent"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No parent note selected')).toBeInTheDocument();
  });

  test('handles quick create button click', async () => {
    mockCreateChainedNote.mockResolvedValue({
      id: 'chained-note',
      title: 'Chained Note',
      body: 'Chained note content',
      tags: ['parent', 'test'],
      parentId: 'parent-note'
    });

    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    const quickCreateButton = screen.getByText(/Quick Create/);
    fireEvent.click(quickCreateButton);

    await waitFor(() => {
      expect(mockCreateChainedNote).toHaveBeenCalledWith('parent-note', {
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        autoTitle: true
      });
    });
  });

  test('handles custom title input', async () => {
    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    const titleInput = screen.getByPlaceholderText(/Leave empty for auto-generated title/);
    await userEvent.type(titleInput, 'Custom Chained Note');

    expect(titleInput).toHaveValue('Custom Chained Note');
  });

  test('toggles advanced options visibility', () => {
    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    const toggleButton = screen.getByText(/Show Advanced Options/);
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Hide Advanced Options/)).toBeInTheDocument();
    expect(screen.getByText(/Inherit tags from parent/)).toBeInTheDocument();
  });

  test('handles option changes', () => {
    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    // Show advanced options
    const toggleButton = screen.getByText(/Show Advanced Options/);
    fireEvent.click(toggleButton);

    // Toggle inherit tags
    const inheritTagsCheckbox = screen.getByLabelText(/Inherit tags from parent/);
    fireEvent.click(inheritTagsCheckbox);

    expect(inheritTagsCheckbox).not.toBeChecked();
  });

  test('handles create button click with custom options', async () => {
    mockCreateChainedNote.mockResolvedValue({
      id: 'chained-note',
      title: 'Custom Chained Note',
      body: 'Chained note content',
      tags: ['parent', 'test'],
      parentId: 'parent-note'
    });

    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    // Set custom title
    const titleInput = screen.getByPlaceholderText(/Leave empty for auto-generated title/);
    await userEvent.type(titleInput, 'Custom Chained Note');

    // Create the note
    const createButton = screen.getByText(/Create Chained Note/);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateChainedNote).toHaveBeenCalledWith('parent-note', {
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        autoTitle: false
      });
    });
  });

  test('handles cancel button click', () => {
    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows loading state during creation', () => {
    const { useNoteChaining } = require('../../../hooks/useNoteChaining');
    useNoteChaining.mockReturnValue({
      createChainedNote: mockCreateChainedNote,
      isCreating: true,
      defaultOptions: {
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        autoTitle: true
      }
    });

    render(
      <NoteChaining 
        parentNoteId="parent-note"
        onNoteCreated={mockOnNoteCreated}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByText(/Quick Create/)).toBeDisabled();
  });
}); 