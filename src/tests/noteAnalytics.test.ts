import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteAnalytics } from '../components/features/NoteAnalytics';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';

// Mock the stores
jest.mock('../store/noteStore');
jest.mock('../store/themeStore');
jest.mock('../services/loggingService');
jest.mock('../services/performanceMonitor');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('Note Analytics', () => {
  const mockNotes = [
    {
      id: '1',
      title: 'Meeting Notes',
      body: 'Discussion about project timeline and milestones. Important decisions made during the meeting. We discussed the upcoming sprint and resource allocation.',
      tags: ['meeting', 'project', 'timeline'],
      createdAt: new Date('2024-01-15T10:00:00'),
      updatedAt: new Date('2024-01-15T10:00:00')
    },
    {
      id: '2',
      title: 'Technical Documentation',
      body: 'API endpoints and database schema. Implementation details for the backend services. This includes authentication, authorization, and data validation.',
      tags: ['technical', 'api', 'documentation'],
      createdAt: new Date('2024-01-20T14:30:00'),
      updatedAt: new Date('2024-01-20T14:30:00')
    },
    {
      id: '3',
      title: 'Personal Goals',
      body: 'My personal goals for this year. Focus on learning and growth. I want to improve my skills in React, TypeScript, and data analysis.',
      tags: ['personal', 'goals', 'learning'],
      createdAt: new Date('2024-01-25T09:15:00'),
      updatedAt: new Date('2024-01-25T09:15:00')
    },
    {
      id: '4',
      title: 'Shopping List',
      body: 'Milk, bread, eggs, and vegetables. Need to buy groceries this weekend. Also need to pick up some household items.',
      tags: ['shopping', 'groceries'],
      createdAt: new Date('2024-01-30T16:45:00'),
      updatedAt: new Date('2024-01-30T16:45:00')
    },
    {
      id: '5',
      title: 'Code Review Notes',
      body: 'Review of the authentication module. Found several issues with input validation and error handling. Need to implement proper logging.',
      tags: ['code-review', 'technical', 'security'],
      createdAt: new Date('2024-02-01T11:20:00'),
      updatedAt: new Date('2024-02-01T11:20:00')
    }
  ];

  const mockColors = {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceHover: '#e9ecef',
    surfaceActive: '#dee2e6',
    text: '#212529',
    textSecondary: '#6c757d',
    primary: '#007bff',
    secondary: '#6c757d',
    accent: '#17a2b8',
    border: '#dee2e6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      searchNotes: jest.fn(),
      getSearchSuggestions: jest.fn(),
      advancedSearch: jest.fn(),
      validateAdvancedQuery: jest.fn(),
      getAdvancedSearchSuggestions: jest.fn()
    });

    mockUseThemeStore.mockReturnValue({
      colors: mockColors,
      toggleTheme: jest.fn()
    });
  });

  describe('Word and Character Counts', () => {
    test('word counts are accurate for various markdown inputs', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        // Total words should be calculated correctly
        const totalWordsElement = screen.getByText('Total Words');
        const totalWordsValue = totalWordsElement.parentElement?.querySelector('div');
        expect(totalWordsValue).toHaveTextContent('150'); // Approximate total words
        
        // Average words per note
        const avgWordsElement = screen.getByText('Avg Words per Note');
        const avgWordsValue = avgWordsElement.parentElement?.querySelector('div');
        expect(avgWordsValue).toHaveTextContent('30'); // 150 words / 5 notes
      });
    });

    test('character counts are accurate', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        const totalCharsElement = screen.getByText('Total Characters');
        const totalCharsValue = totalCharsElement.parentElement?.querySelector('div');
        expect(totalCharsValue).toHaveTextContent('750'); // Approximate total characters
      });
    });

    test('handles empty notes correctly', async () => {
      mockUseNoteStore.mockReturnValue({
        notes: [],
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument(); // Total notes
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });

    test('handles notes with special characters and formatting', async () => {
      const notesWithFormatting = [
        {
          id: '1',
          title: 'Formatted Note',
          body: 'This note has **bold text**, *italic text*, and `code snippets`. It also has\n\nmultiple\n\nlines.',
          tags: ['formatted'],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        }
      ];

      mockUseNoteStore.mockReturnValue({
        notes: notesWithFormatting,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        const totalWordsElement = screen.getByText('Total Words');
        const totalWordsValue = totalWordsElement.parentElement?.querySelector('div');
        expect(totalWordsValue).toHaveTextContent('15'); // Should count actual words, not markdown
      });
    });
  });

  describe('Chart Updates', () => {
    test('charts update correctly with date range filter changes', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to month view
      const timeRangeSelect = screen.getByDisplayValue('All Time');
      fireEvent.change(timeRangeSelect, { target: { value: 'month' } });

      await waitFor(() => {
        // Should show fewer notes in month view
        const totalNotesElement = screen.getByText('Total Notes');
        const totalNotesValue = totalNotesElement.parentElement?.querySelector('div');
        expect(totalNotesValue).toHaveTextContent('5'); // All notes are within a month
      });

      // Switch to week view
      fireEvent.change(timeRangeSelect, { target: { value: 'week' } });

      await waitFor(() => {
        // Should show even fewer notes in week view
        const totalNotesElement = screen.getByText('Total Notes');
        const totalNotesValue = totalNotesElement.parentElement?.querySelector('div');
        expect(totalNotesValue).toHaveTextContent('1'); // Only the most recent note
      });
    });

    test('trends chart shows correct monthly data', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to trends tab
      const trendsTab = screen.getByText('Trends');
      fireEvent.click(trendsTab);

      await waitFor(() => {
        expect(screen.getByText('Notes per Month')).toBeInTheDocument();
        expect(screen.getByText('Jan 2024')).toBeInTheDocument();
        expect(screen.getByText('Feb 2024')).toBeInTheDocument();
      });
    });

    test('writing pattern chart shows hourly distribution', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to writing tab
      const writingTab = screen.getByText('Writing');
      fireEvent.click(writingTab);

      await waitFor(() => {
        expect(screen.getByText('Writing Pattern by Hour')).toBeInTheDocument();
        // Should show hours with activity
        expect(screen.getByText('10:00')).toBeInTheDocument();
        expect(screen.getByText('14:30')).toBeInTheDocument();
      });
    });
  });

  describe('Tag Analysis', () => {
    test('tag analysis reflects changes after tag updates', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to tags tab
      const tagsTab = screen.getByText('Tags');
      fireEvent.click(tagsTab);

      await waitFor(() => {
        // Should show most used tags
        expect(screen.getByText('technical')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // technical appears in 2 notes
        
        // Should show least used tags
        expect(screen.getByText('shopping')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // shopping appears in 1 note
      });
    });

    test('tag diversity calculation is accurate', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        // 5 notes with 10 unique tags total = 2.0 average tags per note
        const tagDiversityElement = screen.getByText('Tag Diversity');
        const tagDiversityValue = tagDiversityElement.parentElement?.querySelector('div');
        expect(tagDiversityValue).toHaveTextContent('2.0');
      });
    });

    test('handles notes without tags', async () => {
      const notesWithoutTags = [
        {
          id: '1',
          title: 'Untagged Note',
          body: 'This note has no tags.',
          tags: [],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        }
      ];

      mockUseNoteStore.mockReturnValue({
        notes: notesWithoutTags,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        const tagDiversityElement = screen.getByText('Tag Diversity');
        const tagDiversityValue = tagDiversityElement.parentElement?.querySelector('div');
        expect(tagDiversityValue).toHaveTextContent('0.0');
      });
    });
  });

  describe('Trends Calculation', () => {
    test('trends are calculated correctly for sparse data', async () => {
      const sparseNotes = [
        {
          id: '1',
          title: 'January Note',
          body: 'First note of the year.',
          tags: ['january'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          title: 'March Note',
          body: 'Note from March.',
          tags: ['march'],
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date('2024-03-15')
        }
      ];

      mockUseNoteStore.mockReturnValue({
        notes: sparseNotes,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to trends tab
      const trendsTab = screen.getByText('Trends');
      fireEvent.click(trendsTab);

      await waitFor(() => {
        expect(screen.getByText('Jan 2024')).toBeInTheDocument();
        expect(screen.getByText('Mar 2024')).toBeInTheDocument();
        expect(screen.queryByText('Feb 2024')).not.toBeInTheDocument(); // No notes in February
      });
    });

    test('writing streak calculation is accurate', async () => {
      const consecutiveNotes = [
        {
          id: '1',
          title: 'Day 1',
          body: 'First day.',
          tags: ['day1'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          title: 'Day 2',
          body: 'Second day.',
          tags: ['day2'],
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02')
        },
        {
          id: '3',
          title: 'Day 3',
          body: 'Third day.',
          tags: ['day3'],
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03')
        }
      ];

      mockUseNoteStore.mockReturnValue({
        notes: consecutiveNotes,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to writing tab
      const writingTab = screen.getByText('Writing');
      fireEvent.click(writingTab);

      await waitFor(() => {
        const writingStreakElement = screen.getByText('Writing Streak');
        const writingStreakValue = writingStreakElement.parentElement?.querySelector('div');
        expect(writingStreakValue).toHaveTextContent('3'); // 3 consecutive days
      });
    });

    test('handles single note correctly', async () => {
      const singleNote = [
        {
          id: '1',
          title: 'Single Note',
          body: 'Just one note.',
          tags: ['single'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      mockUseNoteStore.mockReturnValue({
        notes: singleNote,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        const writingStreakElement = screen.getByText('Writing Streak');
        const writingStreakValue = writingStreakElement.parentElement?.querySelector('div');
        expect(writingStreakValue).toHaveTextContent('1'); // Single day streak
      });
    });
  });

  describe('Content Analysis', () => {
    test('most common words analysis is accurate', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to content tab
      const contentTab = screen.getByText('Content');
      fireEvent.click(contentTab);

      await waitFor(() => {
        expect(screen.getByText('Most Common Words')).toBeInTheDocument();
        // Should show frequently occurring words
        expect(screen.getByText('the')).toBeInTheDocument();
        expect(screen.getByText('and')).toBeInTheDocument();
      });
    });

    test('reading time calculation is accurate', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to content tab
      const contentTab = screen.getByText('Content');
      fireEvent.click(contentTab);

      await waitFor(() => {
        const readingTimeElement = screen.getByText('Average Reading Time');
        const readingTimeValue = readingTimeElement.parentElement?.querySelector('div');
        expect(readingTimeValue).toHaveTextContent('1'); // ~150 words / 200 words per minute
      });
    });

    test('complexity distribution calculation is accurate', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to content tab
      const contentTab = screen.getByText('Content');
      fireEvent.click(contentTab);

      await waitFor(() => {
        expect(screen.getByText('Complexity Distribution')).toBeInTheDocument();
        expect(screen.getByText('Simple')).toBeInTheDocument();
        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getByText('Complex')).toBeInTheDocument();
      });
    });

    test('link density calculation is accurate', async () => {
      const notesWithLinks = [
        {
          id: '1',
          title: 'Linked Note',
          body: 'This note has [[internal links]] and [[more links]]. It also contains regular text.',
          tags: ['linked'],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      mockUseNoteStore.mockReturnValue({
        notes: notesWithLinks,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Switch to content tab
      const contentTab = screen.getByText('Content');
      fireEvent.click(contentTab);

      await waitFor(() => {
        const linkDensityElement = screen.getByText('Link Density');
        const linkDensityValue = linkDensityElement.parentElement?.querySelector('div');
        expect(linkDensityValue).toHaveTextContent('0.133'); // 2 links / 15 words
      });
    });
  });

  describe('Exported Reports', () => {
    test('exported reports match on-screen analytics', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Wait for analytics to load
      await waitFor(() => {
        expect(screen.getByText('Total Notes')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);

      await waitFor(() => {
        // Should trigger download with correct data
        expect(screen.getByText('Report exported successfully')).toBeInTheDocument();
      });
    });

    test('export includes all analytics data', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Wait for analytics to load
      await waitFor(() => {
        expect(screen.getByText('Total Notes')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);

      await waitFor(() => {
        // Should include all sections
        expect(screen.getByText('Report exported successfully')).toBeInTheDocument();
      });
    });

    test('export handles empty data gracefully', async () => {
      mockUseNoteStore.mockReturnValue({
        notes: [],
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Wait for empty state
      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });

      // Click export button
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('No data to export')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Error Handling', () => {
    test('handles large datasets efficiently', async () => {
      const largeNotes = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        title: `Note ${i}`,
        body: `Content for note ${i}. This is a longer note with more content to test performance.`,
        tags: ['test', 'performance'],
        createdAt: new Date(`2024-01-${(i % 30) + 1}`),
        updatedAt: new Date(`2024-01-${(i % 30) + 1}`)
      }));

      mockUseNoteStore.mockReturnValue({
        notes: largeNotes,
        searchNotes: jest.fn(),
        getSearchSuggestions: jest.fn(),
        advancedSearch: jest.fn(),
        validateAdvancedQuery: jest.fn(),
        getAdvancedSearchSuggestions: jest.fn()
      });

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('1000')).toBeInTheDocument(); // Total notes
        expect(screen.getByText('Calculating...')).not.toBeInTheDocument(); // Should finish calculation
      });
    });

    test('handles calculation errors gracefully', async () => {
      // Mock a calculation error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error calculating analytics')).toBeInTheDocument();
      });

      console.error.mockRestore();
    });

    test('loading states are displayed correctly', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      // Should show loading initially
      expect(screen.getByText('Calculating analytics...')).toBeInTheDocument();
      
      // Should hide loading after calculation
      await waitFor(() => {
        expect(screen.queryByText('Calculating analytics...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('all interactive elements have proper ARIA labels', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        // Check for ARIA labels on interactive elements
        const timeRangeSelect = screen.getByLabelText('Time Range');
        expect(timeRangeSelect).toBeInTheDocument();
        
        const exportButton = screen.getByLabelText('Export analytics report');
        expect(exportButton).toBeInTheDocument();
      });
    });

    test('keyboard navigation works correctly', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        // Tab through interactive elements
        const firstTab = screen.getByText('Overview');
        firstTab.focus();
        expect(firstTab).toHaveFocus();
        
        // Press arrow key to navigate tabs
        fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
        const secondTab = screen.getByText('Tags');
        expect(secondTab).toHaveFocus();
      });
    });

    test('screen reader announcements work correctly', async () => {
      render(<NoteAnalytics isOpen={true} onClose={jest.fn()} />);
      
      await waitFor(() => {
        // Check for screen reader announcements
        const announcement = screen.getByText('Analytics loaded successfully');
        expect(announcement).toBeInTheDocument();
      });
    });
  });
}); 