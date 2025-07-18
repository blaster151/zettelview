import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import CalendarView from './CalendarView';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { Note } from '../types/domain';

// Mock the stores
jest.mock('../store/noteStore');
jest.mock('../store/themeStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('CalendarView', () => {
  const mockSelectNote = jest.fn();
  const mockOnNoteClick = jest.fn();
  
  const mockNotes: Note[] = [
    {
      id: 'note1',
      title: 'Test Note 1',
      body: 'Test content 1',
      tags: ['test', 'example'],
      createdAt: new Date(2024, 0, 15, 12, 0, 0), // January 15, 2024 at noon
      updatedAt: new Date(2024, 0, 15, 12, 0, 0)
    },
    {
      id: 'note2',
      title: 'Test Note 2',
      body: 'Test content 2',
      tags: ['test'],
      createdAt: new Date(2024, 0, 20, 12, 0, 0), // January 20, 2024 at noon
      updatedAt: new Date(2024, 0, 25, 12, 0, 0)  // January 25, 2024 at noon
    },
    {
      id: 'note3',
      title: 'Test Note 3',
      body: 'Test content 3',
      tags: ['example'],
      createdAt: new Date(2024, 0, 10, 12, 0, 0), // January 10, 2024 at noon
      updatedAt: new Date(2024, 0, 10, 12, 0, 0)
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
    primaryHover: '#0056b3',
    secondary: '#6c757d',
    border: '#dee2e6'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      selectNote: mockSelectNote,
      selectedId: null,
      isInitialized: true,
      storagePermission: true,
      searchResults: [],
      isSearching: false,
      initialize: jest.fn(),
      requestStoragePermission: jest.fn(),
      addNote: jest.fn(),
      updateNote: jest.fn(),
      getNote: jest.fn(),
      findOrCreateNote: jest.fn(),
      deleteNote: jest.fn(),
      loadNotesFromStorage: jest.fn(),
      searchNotes: jest.fn(),
      quickSearch: jest.fn(),
      searchByTags: jest.fn(),
      clearSearch: jest.fn(),
      getSearchSuggestions: jest.fn()
    });

    mockUseThemeStore.mockReturnValue({
      colors: mockColors,
      theme: 'light',
      toggleTheme: jest.fn(),
      setTheme: jest.fn()
    });

    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders calendar view with current month', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Check that the current month and year are displayed
    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const expectedMonth = monthNames[currentDate.getMonth()];
    const expectedYear = currentDate.getFullYear();

    expect(screen.getByText(`${expectedMonth} ${expectedYear}`)).toBeInTheDocument();
  });

  it('displays day headers correctly', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('shows notes on their creation dates by default', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Note 1 was created on Jan 15, 2024
    // We need to navigate to January 2024 to see it
    // Navigate to January 2024 by clicking previous month multiple times if needed
    const prevButton = screen.getByText('←');
    
    // Keep clicking until we reach January 2024
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    while (currentYear > 2024 || (currentYear === 2024 && currentMonth > 0)) {
      fireEvent.click(prevButton);
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    }

    // Look for the note title in the calendar
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
  });

  it('switches to modified date mode when selector is changed', async () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    const dateModeSelector = screen.getByDisplayValue('Created Date');
    fireEvent.change(dateModeSelector, { target: { value: 'modified' } });

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zettelview_calendar_date_mode',
        'modified'
      );
    });
  });

  it('loads saved date mode from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('modified');

    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    expect(screen.getByDisplayValue('Modified Date')).toBeInTheDocument();
  });

  it('navigates to previous month when left arrow is clicked', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    const currentDate = new Date();
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const expectedMonth = monthNames[prevMonth.getMonth()];

    const prevButton = screen.getByText('←');
    fireEvent.click(prevButton);

    expect(screen.getByText(`${expectedMonth} ${prevMonth.getFullYear()}`)).toBeInTheDocument();
  });

  it('navigates to next month when right arrow is clicked', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const expectedMonth = monthNames[nextMonth.getMonth()];

    const nextButton = screen.getByText('→');
    fireEvent.click(nextButton);

    expect(screen.getByText(`${expectedMonth} ${nextMonth.getFullYear()}`)).toBeInTheDocument();
  });

  it('goes to today when Today button is clicked', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Navigate to a different month first
    const prevButton = screen.getByText('←');
    fireEvent.click(prevButton);

    // Then click Today button (not the span)
    const todayButton = screen.getByRole('button', { name: 'Today' });
    fireEvent.click(todayButton);

    const currentDate = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const expectedMonth = monthNames[currentDate.getMonth()];

    expect(screen.getByText(`${expectedMonth} ${currentDate.getFullYear()}`)).toBeInTheDocument();
  });

  it('calls onNoteClick when a note is clicked', async () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Navigate to January 2024 to see the notes
    const prevButton = screen.getByText('←');
    
    // Keep clicking until we reach January 2024
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    while (currentYear > 2024 || (currentYear === 2024 && currentMonth > 0)) {
      fireEvent.click(prevButton);
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    }

    // Find and click on a note
    const noteButton = screen.getByText('Test Note 1');
    fireEvent.click(noteButton);

    await waitFor(() => {
      expect(mockSelectNote).toHaveBeenCalledWith('note1');
      expect(mockOnNoteClick).toHaveBeenCalledWith('note1');
    });
  });

  it('highlights selected note', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Navigate to January 2024 to see the notes
    const prevButton = screen.getByText('←');
    
    // Keep clicking until we reach January 2024
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    while (currentYear > 2024 || (currentYear === 2024 && currentMonth > 0)) {
      fireEvent.click(prevButton);
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    }

    // The selected note should have different styling
    const selectedNoteButton = screen.getByText('Test Note 1');
    expect(selectedNoteButton).toHaveStyle({ background: mockColors.primary });
  });

  it('shows more notes indicator when there are more than 3 notes', () => {
    const manyNotes = [
      {
        id: 'note1',
        title: 'Test Note 1',
        body: 'Test content 1',
        tags: ['test', 'example'],
        createdAt: new Date(2024, 0, 15, 12, 0, 0), // January 15, 2024 at noon
        updatedAt: new Date(2024, 0, 15, 12, 0, 0)
      },
      {
        id: 'note2',
        title: 'Test Note 2',
        body: 'Test content 2',
        tags: ['test'],
        createdAt: new Date(2024, 0, 15, 12, 0, 0), // January 15, 2024 at noon
        updatedAt: new Date(2024, 0, 15, 12, 0, 0)
      },
      {
        id: 'note3',
        title: 'Test Note 3',
        body: 'Test content 3',
        tags: ['example'],
        createdAt: new Date(2024, 0, 15, 12, 0, 0), // January 15, 2024 at noon
        updatedAt: new Date(2024, 0, 15, 12, 0, 0)
      },
      {
        id: 'note4',
        title: 'Test Note 4',
        body: 'Test content 4',
        tags: ['test'],
        createdAt: new Date(2024, 0, 15, 12, 0, 0), // January 15, 2024 at noon
        updatedAt: new Date(2024, 0, 15, 12, 0, 0)
      },
      {
        id: 'note5',
        title: 'Test Note 5',
        body: 'Test content 5',
        tags: ['test'],
        createdAt: new Date(2024, 0, 15, 12, 0, 0), // January 15, 2024 at noon
        updatedAt: new Date(2024, 0, 15, 12, 0, 0)
      }
    ];

    mockUseNoteStore.mockReturnValue({
      notes: manyNotes,
      selectNote: mockSelectNote,
      selectedId: null,
      isInitialized: true,
      storagePermission: true,
      searchResults: [],
      isSearching: false,
      initialize: jest.fn(),
      requestStoragePermission: jest.fn(),
      addNote: jest.fn(),
      updateNote: jest.fn(),
      getNote: jest.fn(),
      findOrCreateNote: jest.fn(),
      deleteNote: jest.fn(),
      loadNotesFromStorage: jest.fn(),
      searchNotes: jest.fn(),
      quickSearch: jest.fn(),
      searchByTags: jest.fn(),
      clearSearch: jest.fn(),
      getSearchSuggestions: jest.fn()
    });

    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Navigate to January 2024 to see the notes
    const prevButton = screen.getByText('←');
    
    // Keep clicking until we reach January 2024
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    while (currentYear > 2024 || (currentYear === 2024 && currentMonth > 0)) {
      fireEvent.click(prevButton);
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
    }

    // Should show "+2 more" indicator (5 notes total, showing first 3, so +2 more)
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('displays legend with correct information', () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    expect(screen.getByText('Selected Note')).toBeInTheDocument();
    expect(screen.getAllByText('Today')[1]).toBeInTheDocument(); // Use getAllByText to get the legend one
    expect(screen.getByText('Viewing by: Creation Date')).toBeInTheDocument();
  });

  it('updates legend when date mode changes', async () => {
    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    const dateModeSelector = screen.getByDisplayValue('Created Date');
    fireEvent.change(dateModeSelector, { target: { value: 'modified' } });

    await waitFor(() => {
      expect(screen.getByText('Viewing by: Modification Date')).toBeInTheDocument();
    });
  });

  it('handles empty notes array gracefully', () => {
    mockUseNoteStore.mockReturnValue({
      ...mockUseNoteStore(),
      notes: []
    });

    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Should still render the calendar without errors
    expect(screen.getAllByText('Today')[1]).toBeInTheDocument(); // Use getAllByText to get the legend one
  });

  it('handles notes with invalid dates gracefully', () => {
    const notesWithInvalidDates = [
      {
        id: 'note1',
        title: 'Test Note 1',
        body: 'Test content 1',
        tags: ['test'],
        createdAt: new Date('invalid-date'),
        updatedAt: new Date('invalid-date')
      }
    ];

    mockUseNoteStore.mockReturnValue({
      ...mockUseNoteStore(),
      notes: notesWithInvalidDates
    });

    render(
      <CalendarView 
        onNoteClick={mockOnNoteClick}
        selectedNoteId="note1"
      />
    );

    // Should render without crashing
    expect(screen.getAllByText('Today')[1]).toBeInTheDocument(); // Use getAllByText to get the legend one
  });
}); 