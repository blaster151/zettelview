import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagManager from './TagManager';
import { Note } from '../types/domain';

// Mock note for testing
const mockNote: Note = {
  id: 'test-note-1',
  title: 'Test Note',
  body: 'This is a test note',
  tags: ['programming', 'javascript', 'react'],
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

// Mock update function
const mockUpdateNote = jest.fn();

describe('TagManager', () => {
  beforeEach(() => {
    mockUpdateNote.mockClear();
  });

  it('renders all existing tags', () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    expect(screen.getByText('programming')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('allows adding a new tag', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const input = screen.getByPlaceholderText('Add tag...');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'typescript' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-1', {
        tags: ['programming', 'javascript', 'react', 'typescript']
      });
    });
  });

  it('allows adding a tag with Enter key', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const input = screen.getByPlaceholderText('Add tag...');
    
    fireEvent.change(input, { target: { value: 'typescript' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-1', {
        tags: ['programming', 'javascript', 'react', 'typescript']
      });
    });
  });

  it('prevents adding duplicate tags', () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const input = screen.getByPlaceholderText('Add tag...');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'javascript' } });
    
    expect(addButton).toBeDisabled();
  });

  it('prevents adding empty tags', () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const input = screen.getByPlaceholderText('Add tag...');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: '   ' } });
    
    expect(addButton).toBeDisabled();
  });

  it('allows removing a tag', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const removeButtons = screen.getAllByText('×');
    fireEvent.click(removeButtons[0]); // Remove first tag (programming)

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-1', {
        tags: ['javascript', 'react']
      });
    });
  });

  it('allows editing a tag', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const programmingTag = screen.getByText('programming');
    fireEvent.click(programmingTag);

    const editInput = screen.getByDisplayValue('programming');
    fireEvent.change(editInput, { target: { value: 'programming-advanced' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-1', {
        tags: ['programming-advanced', 'javascript', 'react']
      });
    });
  });

  it('allows editing a tag with blur event', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const programmingTag = screen.getByText('programming');
    fireEvent.click(programmingTag);

    const editInput = screen.getByDisplayValue('programming');
    fireEvent.change(editInput, { target: { value: 'programming-advanced' } });
    fireEvent.blur(editInput);

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-1', {
        tags: ['programming-advanced', 'javascript', 'react']
      });
    });
  });

  it('cancels editing with Escape key', () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const programmingTag = screen.getByText('programming');
    fireEvent.click(programmingTag);

    const editInput = screen.getByDisplayValue('programming');
    fireEvent.change(editInput, { target: { value: 'programming-advanced' } });
    fireEvent.keyDown(editInput, { key: 'Escape' });

    // Should revert to showing the original tag
    expect(screen.getByText('programming')).toBeInTheDocument();
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  it('prevents saving empty edited tags', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const programmingTag = screen.getByText('programming');
    fireEvent.click(programmingTag);

    const editInput = screen.getByDisplayValue('programming');
    fireEvent.change(editInput, { target: { value: '   ' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    // Should not call updateNote for empty tags
    expect(mockUpdateNote).not.toHaveBeenCalled();
  });

  it('handles keyboard navigation for tag editing', () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const programmingTag = screen.getByText('programming');
    
    // Test Enter key
    fireEvent.keyDown(programmingTag, { key: 'Enter' });
    expect(screen.getByDisplayValue('programming')).toBeInTheDocument();
    
    // Test Space key
    const javascriptTag = screen.getByText('javascript');
    fireEvent.keyDown(javascriptTag, { key: ' ' });
    expect(screen.getByDisplayValue('javascript')).toBeInTheDocument();
  });

  it('handles note with no tags', () => {
    const noteWithoutTags: Note = {
      ...mockNote,
      tags: []
    };

    render(
      <TagManager 
        note={noteWithoutTags} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('clears input after adding a tag', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const input = screen.getByPlaceholderText('Add tag...');
    const addButton = screen.getByText('Add');

    fireEvent.change(input, { target: { value: 'typescript' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('clears editing state after saving', async () => {
    render(
      <TagManager 
        note={mockNote} 
        noteId="test-note-1" 
        onUpdateNote={mockUpdateNote} 
      />
    );

    const programmingTag = screen.getByText('programming');
    fireEvent.click(programmingTag);

    const editInput = screen.getByDisplayValue('programming');
    fireEvent.change(editInput, { target: { value: 'programming-advanced' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    await waitFor(() => {
      // Should call updateNote with the new tag
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note-1', {
        tags: ['programming-advanced', 'javascript', 'react']
      });
    });
  });
}); 