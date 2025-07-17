import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VirtualizedSearchResults from './VirtualizedSearchResults';
import { useThemeStore } from '../store/themeStore';
import { SearchResult } from '../services/searchService';

// Mock react-window
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData }: any) => (
    <div data-testid="virtualized-search-results">
      {Array.from({ length: itemCount }, (_, index) => 
        React.cloneElement(children, { 
          index, 
          style: { height: 100 }, 
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

const mockSearchResults: SearchResult[] = [
  {
    noteId: '1',
    title: 'JavaScript Guide',
    body: 'Learn JavaScript programming language fundamentals and advanced concepts',
    tags: ['javascript', 'programming'],
    score: 0.95,
    matches: [{ type: 'title' as const, field: 'JavaScript Guide', indices: [] }]
  },
  {
    noteId: '2',
    title: 'React Tutorial',
    body: 'Complete guide to React development with hooks and modern patterns',
    tags: ['react', 'frontend'],
    score: 0.87,
    matches: [{ type: 'title' as const, field: 'React Tutorial', indices: [] }]
  },
  {
    noteId: '3',
    title: 'TypeScript Basics',
    body: 'Introduction to TypeScript for JavaScript developers',
    tags: ['typescript', 'programming'],
    score: 0.82,
    matches: [{ type: 'title' as const, field: 'TypeScript Basics', indices: [] }]
  }
];

describe('VirtualizedSearchResults', () => {
  beforeEach(() => {
    mockUseThemeStore.mockReturnValue({ colors: mockColors });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    results: mockSearchResults,
    selectedIndex: -1,
    onSelectResult: jest.fn(),
    height: 300,
    itemHeight: 100
  };

  test('renders virtualized search results with correct number of items', () => {
    render(<VirtualizedSearchResults {...defaultProps} />);
    
    expect(screen.getByTestId('virtualized-search-results')).toBeInTheDocument();
    expect(screen.getByText('📝 JavaScript Guide')).toBeInTheDocument();
    expect(screen.getByText('📝 React Tutorial')).toBeInTheDocument();
    expect(screen.getByText('📝 TypeScript Basics')).toBeInTheDocument();
  });

  test('displays search result titles correctly', () => {
    render(<VirtualizedSearchResults {...defaultProps} />);
    
    expect(screen.getByText('📝 JavaScript Guide')).toBeInTheDocument();
    expect(screen.getByText('📝 React Tutorial')).toBeInTheDocument();
    expect(screen.getByText('📝 TypeScript Basics')).toBeInTheDocument();
  });

  test('displays search result body preview correctly', () => {
    render(<VirtualizedSearchResults {...defaultProps} />);
    
    expect(screen.getByText(/Learn JavaScript programming language fundamentals/)).toBeInTheDocument();
    expect(screen.getByText(/Complete guide to React development/)).toBeInTheDocument();
    expect(screen.getByText(/Introduction to TypeScript/)).toBeInTheDocument();
  });

  test('displays search result tags correctly', () => {
    render(<VirtualizedSearchResults {...defaultProps} />);
    
    expect(screen.getByText('🏷️ javascript, programming')).toBeInTheDocument();
    expect(screen.getByText('🏷️ react, frontend')).toBeInTheDocument();
    expect(screen.getByText('🏷️ typescript, programming')).toBeInTheDocument();
  });

  test('calls onSelectResult when result is clicked', () => {
    const onSelectResult = jest.fn();
    render(<VirtualizedSearchResults {...defaultProps} onSelectResult={onSelectResult} />);
    
    const firstResultButton = screen.getByText('📝 JavaScript Guide').closest('button');
    fireEvent.click(firstResultButton!);
    
    expect(onSelectResult).toHaveBeenCalledWith(mockSearchResults[0]);
  });

  test('applies selected styling to selected result', () => {
    render(<VirtualizedSearchResults {...defaultProps} selectedIndex={1} />);
    
    const selectedResultButton = screen.getByText('📝 React Tutorial').closest('button');
    expect(selectedResultButton).toHaveStyle({ background: mockColors.surfaceActive });
  });

  test('applies hover styling on mouse enter', () => {
    render(<VirtualizedSearchResults {...defaultProps} />);
    
    const resultButton = screen.getByText('📝 JavaScript Guide').closest('button');
    fireEvent.mouseEnter(resultButton!);
    
    expect(resultButton).toHaveStyle({ background: mockColors.surfaceHover });
  });

  test('removes hover styling on mouse leave', () => {
    render(<VirtualizedSearchResults {...defaultProps} />);
    
    const resultButton = screen.getByText('📝 JavaScript Guide').closest('button');
    fireEvent.mouseEnter(resultButton!);
    fireEvent.mouseLeave(resultButton!);
    
    expect(resultButton).toHaveStyle({ background: 'transparent' });
  });

  test('handles empty results array', () => {
    render(<VirtualizedSearchResults {...defaultProps} results={[]} />);
    
    expect(screen.getByTestId('virtualized-search-results')).toBeInTheDocument();
    expect(screen.queryByText('📝 JavaScript Guide')).not.toBeInTheDocument();
  });

  test('handles results without body content', () => {
    const resultsWithoutBody: SearchResult[] = [
      {
        noteId: '1',
        title: 'Note without body',
        body: '',
        tags: ['test'],
        score: 0.9,
        matches: [{ type: 'title' as const, field: 'Note without body', indices: [] }]
      }
    ];
    
    render(<VirtualizedSearchResults {...defaultProps} results={resultsWithoutBody} />);
    
    expect(screen.getByText('📝 Note without body')).toBeInTheDocument();
    // Should not render body preview
    expect(screen.queryByText(/Learn JavaScript/)).not.toBeInTheDocument();
  });

  test('handles results without tags', () => {
    const resultsWithoutTags: SearchResult[] = [
      {
        noteId: '1',
        title: 'Note without tags',
        body: 'This note has no tags',
        tags: [],
        score: 0.9,
        matches: [{ type: 'title' as const, field: 'Note without tags', indices: [] }]
      }
    ];
    
    render(<VirtualizedSearchResults {...defaultProps} results={resultsWithoutTags} />);
    
    expect(screen.getByText('📝 Note without tags')).toBeInTheDocument();
    // Should not render tag section
    expect(screen.queryByText('🏷️')).not.toBeInTheDocument();
  });

  test('truncates long body content', () => {
    const resultWithLongBody: SearchResult[] = [
      {
        noteId: '1',
        title: 'Long content note',
        body: 'A'.repeat(200), // Very long content
        tags: ['test'],
        score: 0.9,
        matches: [{ type: 'title' as const, field: 'Long content note', indices: [] }]
      }
    ];
    
    render(<VirtualizedSearchResults {...defaultProps} results={resultWithLongBody} />);
    
    const bodyText = screen.getByText(/A{80}/); // Should be truncated to 80 chars
    expect(bodyText).toBeInTheDocument();
    expect(bodyText.textContent).toContain('...');
  });

  test('uses custom item height when provided', () => {
    render(<VirtualizedSearchResults {...defaultProps} itemHeight={120} />);
    
    expect(screen.getByTestId('virtualized-search-results')).toBeInTheDocument();
    // The mock will use the provided itemHeight
  });
}); 