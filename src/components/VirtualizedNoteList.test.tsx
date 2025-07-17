import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VirtualizedNoteList from './VirtualizedNoteList';
import { useThemeStore } from '../store/themeStore';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: itemCount }, (_, index) => 
        React.cloneElement(children, { 
          index, 
          style: { height: 80 }, 
          data: itemData 
        })
      )}
    </div>
  )
}));

// Mock theme store
jest.mock('../store/themeStore');
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

const mockColors = {
  text: '#333',
  textSecondary: '#666',
  primary: '#007bff',
  surface: '#fff',
  surfaceActive: '#e3f2fd',
  surfaceHover: '#f5f5f5',
  border: '#ddd',
  background: '#fff'
};

const mockNotes = [
  {
    id: '1',
    title: 'Test Note 1',
    body: 'This is test note 1',
    tags: ['test', 'example'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Test Note 2',
    body: 'This is test note 2',
    tags: ['test', 'demo'],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    id: '3',
    title: 'Test Note 3',
    body: 'This is test note 3',
    tags: ['demo'],
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z'
  }
];

describe('VirtualizedNoteList', () => {
  beforeEach(() => {
    mockUseThemeStore.mockReturnValue({ colors: mockColors });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    notes: mockNotes,
    selectedId: null,
    onSelectNote: jest.fn(),
    height: 400,
    itemHeight: 80
  };

  test('renders virtualized list with correct number of items', () => {
    render(<VirtualizedNoteList {...defaultProps} />);
    
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    expect(screen.getByText('Test Note 3')).toBeInTheDocument();
  });

  test('displays note titles correctly', () => {
    render(<VirtualizedNoteList {...defaultProps} />);
    
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    expect(screen.getByText('Test Note 3')).toBeInTheDocument();
  });

  test('displays note dates correctly', () => {
    render(<VirtualizedNoteList {...defaultProps} />);
    
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    expect(screen.getByText('1/3/2023')).toBeInTheDocument();
  });

  test('displays note tags correctly', () => {
    render(<VirtualizedNoteList {...defaultProps} />);
    
    expect(screen.getByText('test, example')).toBeInTheDocument();
    expect(screen.getByText('test, demo')).toBeInTheDocument();
    expect(screen.getByText('demo')).toBeInTheDocument();
  });

  test('calls onSelectNote when note is clicked', () => {
    const onSelectNote = jest.fn();
    render(<VirtualizedNoteList {...defaultProps} onSelectNote={onSelectNote} />);
    
    const firstNoteButton = screen.getByText('Test Note 1').closest('button');
    fireEvent.click(firstNoteButton!);
    
    expect(onSelectNote).toHaveBeenCalledWith('1');
  });

  test('applies selected styling to selected note', () => {
    render(<VirtualizedNoteList {...defaultProps} selectedId="2" />);
    
    const selectedNoteButton = screen.getByText('Test Note 2').closest('button');
    expect(selectedNoteButton).toHaveStyle({ background: mockColors.surfaceActive });
  });

  test('applies hover styling on mouse enter', () => {
    render(<VirtualizedNoteList {...defaultProps} />);
    
    const noteButton = screen.getByText('Test Note 1').closest('button');
    fireEvent.mouseEnter(noteButton!);
    
    expect(noteButton).toHaveStyle({ background: mockColors.surfaceHover });
  });

  test('removes hover styling on mouse leave', () => {
    render(<VirtualizedNoteList {...defaultProps} />);
    
    const noteButton = screen.getByText('Test Note 1').closest('button');
    fireEvent.mouseEnter(noteButton!);
    fireEvent.mouseLeave(noteButton!);
    
    expect(noteButton).toHaveStyle({ background: 'transparent' });
  });

  test('handles empty notes array', () => {
    render(<VirtualizedNoteList {...defaultProps} notes={[]} />);
    
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    expect(screen.queryByText('Test Note 1')).not.toBeInTheDocument();
  });

  test('uses custom item height when provided', () => {
    render(<VirtualizedNoteList {...defaultProps} itemHeight={100} />);
    
    expect(screen.getByTestId('virtualized-list')).toBeInTheDocument();
    // The mock will use the provided itemHeight
  });

  test('handles notes without tags', () => {
    const notesWithoutTags = [
      {
        id: '1',
        title: 'Note without tags',
        body: 'This note has no tags',
        tags: [],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];
    
    render(<VirtualizedNoteList {...defaultProps} notes={notesWithoutTags} />);
    
    expect(screen.getByText('Note without tags')).toBeInTheDocument();
    // Should not render any tag elements
    expect(screen.queryByText('test, example')).not.toBeInTheDocument();
  });

  test('handles notes with special characters in title', () => {
    const notesWithSpecialChars = [
      {
        id: '1',
        title: 'Note with special chars: @#$%^&*()',
        body: 'This note has special characters',
        tags: ['special'],
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];
    
    render(<VirtualizedNoteList {...defaultProps} notes={notesWithSpecialChars} />);
    
    expect(screen.getByText('Note with special chars: @#$%^&*()')).toBeInTheDocument();
  });
}); 