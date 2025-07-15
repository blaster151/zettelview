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
    tags: ['welcome', 'getting-started'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'test-note',
    title: 'Test Note',
    body: 'Test content',
    tags: ['test', 'example'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'programming-note',
    title: 'Programming Guide',
    body: 'This is a programming guide with JavaScript examples',
    tags: ['programming', 'javascript'],
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
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

  // Search functionality tests
  test('should filter notes by search query in title', async () => {
    render(<NoteSidebar />);
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    await act(async () => {
      await safeUserEvent.type(searchInput, 'Programming');
    });
    
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
  });

  test('should filter notes by search query in body content', async () => {
    render(<NoteSidebar />);
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    await act(async () => {
      await safeUserEvent.type(searchInput, 'JavaScript');
    });
    
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
  });

  test('should filter notes by search query in tags', async () => {
    render(<NoteSidebar />);
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    await act(async () => {
      await safeUserEvent.type(searchInput, 'javascript');
    });
    
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
  });

  test('should show all notes when search query is cleared', async () => {
    render(<NoteSidebar />);
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    await act(async () => {
      await safeUserEvent.type(searchInput, 'Programming');
    });
    
    // Clear the search
    await act(async () => {
      await safeUserEvent.type(searchInput, '{selectall}{backspace}');
    });
    
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
  });

  // Tag filtering tests
  test('should show tag filter dropdown', () => {
    render(<NoteSidebar />);
    
    const tagSelect = screen.getByDisplayValue('All tags');
    expect(tagSelect).toBeInTheDocument();
  });

  test('should filter notes by selected tag', async () => {
    render(<NoteSidebar />);
    
    const tagSelect = screen.getByDisplayValue('All tags');
    await act(async () => {
      fireEvent.change(tagSelect, { target: { value: 'programming' } });
    });
    
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
  });

  test('should show all notes when "All tags" is selected', async () => {
    render(<NoteSidebar />);
    
    const tagSelect = screen.getByDisplayValue('All tags');
    await act(async () => {
      fireEvent.change(tagSelect, { target: { value: 'programming' } });
    });
    
    await act(async () => {
      fireEvent.change(tagSelect, { target: { value: 'all' } });
    });
    
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
  });

  test('should combine search query and tag filtering', async () => {
    render(<NoteSidebar />);
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    const tagSelect = screen.getByDisplayValue('All tags');
    
    await act(async () => {
      await safeUserEvent.type(searchInput, 'Guide');
    });
    
    await act(async () => {
      fireEvent.change(tagSelect, { target: { value: 'javascript' } });
    });
    
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
    expect(screen.queryByText('Welcome')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
  });

  test('should show "No notes found" message when no notes match search', async () => {
    render(<NoteSidebar />);
    
    const searchInput = screen.getByPlaceholderText('Search notes...');
    await act(async () => {
      await safeUserEvent.type(searchInput, 'nonexistent');
    });
    
    expect(screen.getByText('No notes found matching your search.')).toBeInTheDocument();
  });

  test('should display tags for notes in the list', () => {
    render(<NoteSidebar />);
    
    expect(screen.getByText('welcome, getting-started')).toBeInTheDocument();
    expect(screen.getByText('test, example')).toBeInTheDocument();
    expect(screen.getByText('programming, javascript')).toBeInTheDocument();
  });
}); 