import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteSidebar from './NoteSidebar';

// Mock the Zustand store
const mockAddNote = jest.fn().mockResolvedValue(undefined);
const mockSelectNote = jest.fn();
const mockNotes = [
  {
    id: 'welcome',
    title: 'Welcome',
    body: 'Welcome content',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'test-note',
    title: 'Test Note',
    body: 'Test content',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

jest.mock('../store/noteStore', () => ({
  useNoteStore: () => ({
    notes: mockNotes,
    selectedId: 'welcome',
    selectNote: mockSelectNote,
    addNote: mockAddNote,
  }),
}));

// Helper function to prevent hanging with timeout
const safeUserEvent = {
  click: (element: Element) => {
    return Promise.race([
      userEvent.click(element),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('userEvent.click timeout')), 5000)
      )
    ]);
  },
  type: (element: Element, text: string) => {
    return Promise.race([
      userEvent.type(element, text),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('userEvent.type timeout')), 5000)
      )
    ]);
  }
};

describe('NoteSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render notes list and create note form', () => {
    render(<NoteSidebar />);
    
    // Check that the sidebar title is rendered
    expect(screen.getByText('Notes')).toBeInTheDocument();
    
    // Check that the create note form is rendered
    expect(screen.getByPlaceholderText('New note title...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Note' })).toBeInTheDocument();
    
    // Check that existing notes are rendered
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  test('should create a new note when form is submitted', async () => {
    render(<NoteSidebar />);
    
    const input = screen.getByPlaceholderText('New note title...');
    const submitButton = screen.getByRole('button', { name: 'Create Note' });
    
    // Initially button should be disabled
    expect(submitButton).toBeDisabled();
    
    // Type in the input
    await act(async () => {
      await safeUserEvent.type(input, 'New Note Title');
    });
    
    // Button should now be enabled
    expect(submitButton).not.toBeDisabled();
    
    // Submit the form
    await act(async () => {
      await safeUserEvent.click(submitButton);
    });
    
    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockAddNote).toHaveBeenCalledWith('New Note Title');
    });
    
    // Check that input is cleared after submission
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  test('should select a note when clicked', async () => {
    render(<NoteSidebar />);
    
    // Click on the "Test Note" button
    const testNoteButton = screen.getByText('Test Note').closest('button');
    expect(testNoteButton).toBeInTheDocument();
    
    await act(async () => {
      await safeUserEvent.click(testNoteButton!);
    });
    
    // Check that selectNote was called with the correct note id
    expect(mockSelectNote).toHaveBeenCalledWith('test-note');
  });

  test('should not create note with empty title', async () => {
    render(<NoteSidebar />);
    
    const input = screen.getByPlaceholderText('New note title...');
    const submitButton = screen.getByRole('button', { name: 'Create Note' });
    
    // Try to submit with empty input
    await act(async () => {
      await safeUserEvent.click(submitButton);
    });
    
    // Check that addNote was not called
    expect(mockAddNote).not.toHaveBeenCalled();
  });

  test('should not create note with whitespace-only title', async () => {
    render(<NoteSidebar />);
    
    const input = screen.getByPlaceholderText('New note title...');
    const submitButton = screen.getByRole('button', { name: 'Create Note' });
    
    // Type only whitespace
    await act(async () => {
      await safeUserEvent.type(input, '   ');
    });
    
    // Button should still be disabled
    expect(submitButton).toBeDisabled();
    
    // Try to submit
    await act(async () => {
      await safeUserEvent.click(submitButton);
    });
    
    // Check that addNote was not called
    expect(mockAddNote).not.toHaveBeenCalled();
  });
}); 