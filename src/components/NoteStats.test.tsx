import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../store/themeStore';
import NoteStats from './NoteStats';

// Mock theme store
const mockThemeStore = {
  colors: {
    surface: '#ffffff',
    background: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007acc',
    border: '#e0e0e0',
    surfaceHover: '#f0f0f0'
  }
};

jest.mock('../store/themeStore', () => ({
  useThemeStore: () => mockThemeStore,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const createMockNote = (id: string, title: string, body: string, tags: string[] = [], createdAt?: Date, updatedAt?: Date) => ({
  id,
  title,
  body,
  tags,
  createdAt: createdAt || new Date('2024-01-01'),
  updatedAt: updatedAt || new Date('2024-01-01')
});

describe('NoteStats', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when closed', () => {
    it('should not render anything', () => {
      const { container } = render(
        <NoteStats
          notes={[]}
          isOpen={false}
          onClose={mockOnClose}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('when open with no notes', () => {
    it('should display empty state message', () => {
      render(
        <NoteStats
          notes={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('📊 Note Statistics & Analytics')).toBeInTheDocument();
      expect(screen.getByText('No Notes Yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first note to see statistics and analytics.')).toBeInTheDocument();
    });

    it('should show zero values for all stats', () => {
      render(
        <NoteStats
          notes={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Check for total notes specifically
      const totalNotesElement = screen.getByText('Total Notes').closest('div');
      expect(totalNotesElement).toHaveTextContent('0');
    });
  });

  describe('when open with notes', () => {
    const mockNotes = [
      createMockNote('1', 'First Note', 'This is the first note with some content.', ['tag1', 'tag2'], new Date('2024-01-01'), new Date('2024-01-01')),
      createMockNote('2', 'Second Note', 'Another note with different content and more words.', ['tag1', 'tag3'], new Date('2024-01-02'), new Date('2024-01-02')),
      createMockNote('3', 'Third Note', 'Third note with [[linked note]] and more content.', ['tag2'], new Date('2024-01-03'), new Date('2024-01-03'))
    ];

    it('should display all sections', () => {
      render(
        <NoteStats
          notes={mockNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('📊 Note Statistics & Analytics')).toBeInTheDocument();
      expect(screen.getByText('📈 Overview')).toBeInTheDocument();
      expect(screen.getByText('📝 Content Analysis')).toBeInTheDocument();
      expect(screen.getByText('🏷️ Most Used Tags')).toBeInTheDocument();
      expect(screen.getByText('⏰ Time Analysis')).toBeInTheDocument();
      expect(screen.getByText('📅 Recent Activity (Last 7 Days)')).toBeInTheDocument();
    });

    it('should calculate and display correct statistics', () => {
      render(
        <NoteStats
          notes={mockNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Overview stats - use more specific queries
      expect(screen.getByText('Total Notes').closest('div')).toHaveTextContent('3');
      expect(screen.getByText('Total Words').closest('div')).toHaveTextContent('25');
      expect(screen.getByText('Unique Tags').closest('div')).toHaveTextContent('3');
      expect(screen.getByText('Avg Links/Note').closest('div')).toHaveTextContent('0.33');

      // Content analysis
      expect(screen.getByText('Avg Words/Note:').closest('div')).toHaveTextContent('8');
      expect(screen.getByText('Avg Tags/Note:').closest('div')).toHaveTextContent('1.7');
    });

    it('should display most used tags correctly', () => {
      render(
        <NoteStats
          notes={mockNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // tag1 appears in 2 notes, tag2 in 2 notes, tag3 in 1 note
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });

    it('should display time analysis correctly', () => {
      render(
        <NoteStats
          notes={mockNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument(); // Oldest note
      expect(screen.getByText('Jan 3, 2024')).toBeInTheDocument(); // Newest note
      expect(screen.getByText('2 days')).toBeInTheDocument(); // Date range
    });

    it('should display recent activity chart', () => {
      render(
        <NoteStats
          notes={mockNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      // Should show 7 days of activity
      expect(screen.getByText('Jan 1')).toBeInTheDocument();
      expect(screen.getByText('Jan 2')).toBeInTheDocument();
      expect(screen.getByText('Jan 3')).toBeInTheDocument();
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <NoteStats
          notes={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTitle('Close statistics');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside the modal', () => {
      render(
        <NoteStats
          notes={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle notes with no tags', () => {
      const notesWithoutTags = [
        createMockNote('1', 'Note 1', 'Content 1', []),
        createMockNote('2', 'Note 2', 'Content 2', [])
      ];

      render(
        <NoteStats
          notes={notesWithoutTags}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Unique Tags').closest('div')).toHaveTextContent('0');
      expect(screen.getByText('No tags used yet')).toBeInTheDocument();
    });

    it('should handle notes with empty content', () => {
      const notesWithEmptyContent = [
        createMockNote('1', 'Empty Note', '', ['tag1']),
        createMockNote('2', 'Another Empty', '   ', ['tag2'])
      ];

      render(
        <NoteStats
          notes={notesWithEmptyContent}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Total Notes').closest('div')).toHaveTextContent('2');
      expect(screen.getByText('Total Words').closest('div')).toHaveTextContent('0');
    });

    it('should handle notes with many links', () => {
      const notesWithLinks = [
        createMockNote('1', 'Linked Note', 'This has [[link1]] and [[link2]] and [[link3]].', ['tag1'])
      ];

      render(
        <NoteStats
          notes={notesWithLinks}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Avg Links/Note').closest('div')).toHaveTextContent('3');
    });

    it('should handle notes with same creation and update dates', () => {
      const sameDate = new Date('2024-01-01');
      const notesWithSameDates = [
        createMockNote('1', 'Note 1', 'Content 1', ['tag1'], sameDate, sameDate),
        createMockNote('2', 'Note 2', 'Content 2', ['tag2'], sameDate, sameDate)
      ];

      render(
        <NoteStats
          notes={notesWithSameDates}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument(); // Oldest note
      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument(); // Newest note
      expect(screen.getByText('0 days')).toBeInTheDocument(); // Date range
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <NoteStats
          notes={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTitle('Close statistics')).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      render(
        <NoteStats
          notes={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTitle('Close statistics');
      expect(closeButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('performance', () => {
    it('should handle large number of notes efficiently', () => {
      const manyNotes = Array.from({ length: 100 }, (_, i) =>
        createMockNote(
          `note-${i}`,
          `Note ${i}`,
          `Content for note ${i} with some words and [[link${i}]]`,
          [`tag${i % 5}`],
          new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
          new Date(`2024-01-${String(i + 1).padStart(2, '0')}`)
        )
      );

      const startTime = performance.now();
      render(
        <NoteStats
          notes={manyNotes}
          isOpen={true}
          onClose={mockOnClose}
        />
      );
      const endTime = performance.now();

      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(screen.getByText('Total Notes').closest('div')).toHaveTextContent('100');
    });
  });
}); 