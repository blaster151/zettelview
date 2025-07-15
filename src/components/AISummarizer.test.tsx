import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AISummarizer from './AISummarizer';
import { useNoteStore } from '../store/noteStore';

// Mock the note store
jest.mock('../store/noteStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;

// Mock setTimeout for faster tests
jest.useFakeTimers();

describe('AISummarizer', () => {
  const mockGetNote = jest.fn();
  const mockNotes = [
    {
      id: 'note1',
      title: 'Test Note',
      body: 'This is a test note with some content. It contains multiple sentences. This should be enough for testing the AI summarizer functionality.',
      tags: ['test', 'ai'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'note2',
      title: 'Another Note',
      body: 'This is another note for testing.',
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNoteStore.mockReturnValue({
      getNote: mockGetNote,
      notes: mockNotes,
    } as any);
  });

  test('should render placeholder when no note is selected', () => {
    mockGetNote.mockReturnValue(null);
    
    render(<AISummarizer />);
    
    expect(screen.getByText('Select a note to analyze with AI')).toBeInTheDocument();
  });

  test('should render AI analysis interface when note is selected', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    expect(screen.getByText('AI Analysis: Test Note')).toBeInTheDocument();
    expect(screen.getByText('Get insights, summaries, and answers about your note')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Ask Question')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  test('should show close button when onClose prop is provided', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    const mockOnClose = jest.fn();
    
    render(<AISummarizer noteId="note1" onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close AI analysis');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should start in summary mode by default', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const summaryButton = screen.getByText('Summary');
    expect(summaryButton).toHaveStyle({ background: '#007bff' });
  });

  test('should switch to question mode when Ask Question tab is clicked', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const questionButton = screen.getByText('Ask Question');
    fireEvent.click(questionButton);
    
    expect(questionButton).toHaveStyle({ background: '#007bff' });
    expect(screen.getByLabelText('Ask a question about this note:')).toBeInTheDocument();
  });

  test('should switch to insights mode when Insights tab is clicked', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const insightsButton = screen.getByText('Insights');
    fireEvent.click(insightsButton);
    
    expect(insightsButton).toHaveStyle({ background: '#007bff' });
  });

  test('should generate summary when Generate Summary button is clicked', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const generateButton = screen.getByText('Generate Summary');
    fireEvent.click(generateButton);
    
    // Should show loading state
    expect(screen.getByText('Generating Summary...')).toBeInTheDocument();
    
    // Fast-forward timers
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
    });
    
    // Should show generated summary
    expect(screen.getByText(/This is a test note with some content/)).toBeInTheDocument();
  });

  test('should show suggested questions after generating summary', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const generateButton = screen.getByText('Generate Summary');
    fireEvent.click(generateButton);
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Suggested Questions')).toBeInTheDocument();
    });
    
    expect(screen.getByText('What are the main topics discussed in this note?')).toBeInTheDocument();
    expect(screen.getByText('How does this relate to other notes in your knowledge base?')).toBeInTheDocument();
    expect(screen.getByText('What actions or next steps are mentioned?')).toBeInTheDocument();
  });

  test('should show suggested tags after generating summary', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const generateButton = screen.getByText('Generate Summary');
    fireEvent.click(generateButton);
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Suggested Tags')).toBeInTheDocument();
    });
    
    // Should show some suggested tags
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });

  test('should answer questions when Ask Question button is clicked', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    // Switch to question mode
    fireEvent.click(screen.getByText('Ask Question'));
    
    const questionInput = screen.getByLabelText('Ask a question about this note:');
    fireEvent.change(questionInput, { target: { value: 'What is this note about?' } });
    
    const askButton = screen.getByText('Ask Question');
    fireEvent.click(askButton);
    
    // Should show loading state
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Answer')).toBeInTheDocument();
    });
    
    // Should show generated answer
    expect(screen.getByText(/Based on the content/)).toBeInTheDocument();
  });

  test('should handle Enter key in question input', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    // Switch to question mode
    fireEvent.click(screen.getByText('Ask Question'));
    
    const questionInput = screen.getByLabelText('Ask a question about this note:');
    fireEvent.change(questionInput, { target: { value: 'What is this note about?' } });
    
    // Press Enter
    fireEvent.keyDown(questionInput, { key: 'Enter' });
    
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Answer')).toBeInTheDocument();
    });
  });

  test('should disable Ask Question button when input is empty', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    // Switch to question mode
    fireEvent.click(screen.getByText('Ask Question'));
    
    const askButton = screen.getByText('Ask Question');
    expect(askButton).toBeDisabled();
  });

  test('should generate insights when Generate Insights button is clicked', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    // Switch to insights mode
    fireEvent.click(screen.getByText('Insights'));
    
    const generateButton = screen.getByText('Generate Insights');
    fireEvent.click(generateButton);
    
    // Should show loading state
    expect(screen.getByText('Generating Insights...')).toBeInTheDocument();
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Note Analysis')).toBeInTheDocument();
    });
    
    // Should show generated insights
    expect(screen.getByText(/This note contains/)).toBeInTheDocument();
  });

  test('should show related notes in insights mode', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    // Switch to insights mode
    fireEvent.click(screen.getByText('Insights'));
    
    const generateButton = screen.getByText('Generate Insights');
    fireEvent.click(generateButton);
    
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Related Notes')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Another Note')).toBeInTheDocument();
  });

  test('should handle suggested question clicks', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    // Generate summary first
    fireEvent.click(screen.getByText('Generate Summary'));
    jest.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Suggested Questions')).toBeInTheDocument();
    });
    
    // Click on a suggested question
    const suggestedQuestion = screen.getByText('What are the main topics discussed in this note?');
    fireEvent.click(suggestedQuestion);
    
    // Should switch to question mode and populate the input
    expect(screen.getByDisplayValue('What are the main topics discussed in this note?')).toBeInTheDocument();
  });

  test('should handle AI service errors gracefully', async () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    // Mock a failing AI service by overriding the setTimeout
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = jest.fn(() => {
      throw new Error('AI service error');
    }) as any;
    
    render(<AISummarizer noteId="note1" />);
    
    const generateButton = screen.getByText('Generate Summary');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to generate summary. Please try again.')).toBeInTheDocument();
    });
    
    // Restore original setTimeout
    global.setTimeout = originalSetTimeout;
  });

  test('should handle notes with no content', () => {
    const emptyNote = {
      id: 'empty',
      title: 'Empty Note',
      body: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockGetNote.mockReturnValue(emptyNote);
    
    render(<AISummarizer noteId="empty" />);
    
    expect(screen.getByText('AI Analysis: Empty Note')).toBeInTheDocument();
  });

  test('should handle notes with many tags', () => {
    const taggedNote = {
      id: 'tagged',
      title: 'Tagged Note',
      body: 'This note has many tags.',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockGetNote.mockReturnValue(taggedNote);
    
    render(<AISummarizer noteId="tagged" />);
    
    expect(screen.getByText('AI Analysis: Tagged Note')).toBeInTheDocument();
  });

  test('should handle notes with internal links', () => {
    const linkedNote = {
      id: 'linked',
      title: 'Linked Note',
      body: 'This note links to [[Another Note]] and [[Test Note]].',
      tags: ['links'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockGetNote.mockReturnValue(linkedNote);
    
    render(<AISummarizer noteId="linked" />);
    
    expect(screen.getByText('AI Analysis: Linked Note')).toBeInTheDocument();
  });

  test('should show loading spinner during AI processing', () => {
    mockGetNote.mockReturnValue(mockNotes[0]);
    
    render(<AISummarizer noteId="note1" />);
    
    const generateButton = screen.getByText('Generate Summary');
    fireEvent.click(generateButton);
    
    expect(screen.getByText('AI is analyzing your note...')).toBeInTheDocument();
  });
}); 