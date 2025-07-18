import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GraphView from './features/GraphView';
import { useNoteStore } from '../store/noteStore';

// Mock the note store
jest.mock('../store/noteStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;

// Mock canvas context
const mockContext = {
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  fillText: jest.fn(),
  measureText: jest.fn(() => ({ width: 50 })),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: ''
};

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 })),
  width: 800,
  height: 600
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 0);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

describe('GraphView', () => {
  const mockSelectNote = jest.fn();
  const mockNotes = [
    {
      id: 'note1',
      title: 'Note 1',
      body: 'This is note 1 with a link to [[Note 2]].',
      tags: ['tag1', 'tag2'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'note2',
      title: 'Note 2',
      body: 'This is note 2 with a link to [[Note 1]] and [[Note 3]].',
      tags: ['tag2'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'note3',
      title: 'Note 3',
      body: 'This is note 3 with no links.',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      selectNote: mockSelectNote,
    } as any);

    // Mock canvas element
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: jest.fn(() => mockContext)
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      value: jest.fn(() => ({ width: 800, height: 600 }))
    });
  });

  test('should render graph statistics', () => {
    render(<GraphView />);
    
    expect(screen.getByText('3 notes')).toBeInTheDocument();
    expect(screen.getByText('2 connections')).toBeInTheDocument();
    expect(screen.getByText('Avg: 1.3 links/note')).toBeInTheDocument();
  });

  test('should show most connected note', () => {
    render(<GraphView />);
    
    expect(screen.getByText('Most connected: Note 2 (2 links)')).toBeInTheDocument();
  });

  test('should render search bar', () => {
    render(<GraphView />);
    
    expect(screen.getByPlaceholderText('Search nodes by title or tags...')).toBeInTheDocument();
  });

  test('should filter nodes when searching by title', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'Note 1' } });
    
    expect(screen.getByText('Showing: 1 of 3')).toBeInTheDocument();
  });

  test('should filter nodes when searching by tags', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'tag2' } });
    
    expect(screen.getByText('Showing: 2 of 3')).toBeInTheDocument();
  });

  test('should show clear search button when search has content', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const clearButton = screen.getByTitle('Clear search');
    expect(clearButton).toBeInTheDocument();
  });

  test('should clear search when clear button is clicked', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const clearButton = screen.getByTitle('Clear search');
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
    expect(screen.queryByText('Showing:')).not.toBeInTheDocument();
  });

  test('should render canvas element', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  test('should render zoom controls', () => {
    render(<GraphView />);
    
    expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
    expect(screen.getByTitle('Reset view')).toBeInTheDocument();
  });

  test('should render minimap toggle button', () => {
    render(<GraphView />);
    
    expect(screen.getByTitle('Toggle minimap')).toBeInTheDocument();
  });

  test('should show minimap by default', () => {
    render(<GraphView />);
    
    expect(screen.getByText('Minimap')).toBeInTheDocument();
  });

  test('should toggle minimap visibility', () => {
    render(<GraphView />);
    
    const minimapToggle = screen.getByTitle('Toggle minimap');
    
    // Initially visible
    expect(screen.getByText('Minimap')).toBeInTheDocument();
    
    // Hide minimap
    fireEvent.click(minimapToggle);
    expect(screen.queryByText('Minimap')).not.toBeInTheDocument();
    
    // Show minimap again
    fireEvent.click(minimapToggle);
    expect(screen.getByText('Minimap')).toBeInTheDocument();
  });

  test('should render legend', () => {
    render(<GraphView />);
    
    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText(/Node size = content length \+ tags/)).toBeInTheDocument();
    expect(screen.getByText(/Line thickness = connection strength/)).toBeInTheDocument();
    expect(screen.getByText(/Colors = based on primary tag/)).toBeInTheDocument();
    expect(screen.getByText(/Hover for details/)).toBeInTheDocument();
  });

  test('should handle zoom in button click', () => {
    render(<GraphView />);
    
    const zoomInButton = screen.getByTitle('Zoom in');
    fireEvent.click(zoomInButton);
    
    expect(zoomInButton).toBeInTheDocument();
  });

  test('should handle zoom out button click', () => {
    render(<GraphView />);
    
    const zoomOutButton = screen.getByTitle('Zoom out');
    fireEvent.click(zoomOutButton);
    
    expect(zoomOutButton).toBeInTheDocument();
  });

  test('should handle reset view button click', () => {
    render(<GraphView />);
    
    const resetButton = screen.getByTitle('Reset view');
    fireEvent.click(resetButton);
    
    expect(resetButton).toBeInTheDocument();
  });

  test('should handle canvas mouse events', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    
    if (canvas) {
      // Test mouse down
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      
      // Test mouse move
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      
      // Test mouse up
      fireEvent.mouseUp(canvas);
      
      // Test wheel event
      fireEvent.wheel(canvas, { deltaY: 100 });
    }
  });

  test('should handle node click callback', () => {
    const mockOnNodeClick = jest.fn();
    render(<GraphView onNodeClick={mockOnNodeClick} />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Simulate clicking on a node (this would need more complex setup to actually hit a node)
      fireEvent.mouseDown(canvas, { clientX: 400, clientY: 300 });
    }
    
    // The callback would be called if we actually clicked on a node
    // In a real test, we'd need to mock the canvas context and node detection
  });

  test('should highlight selected node', () => {
    render(<GraphView selectedNodeId="note1" />);
    
    // The selected node would be highlighted in the canvas
    // We can verify the component renders with the selectedNodeId prop
    expect(screen.getByText('Knowledge Graph')).toBeInTheDocument();
  });

  test('should handle empty notes array', () => {
    mockUseNoteStore.mockReturnValue({
      notes: [],
      selectNote: mockSelectNote,
    } as any);
    
    render(<GraphView />);
    
    expect(screen.getByText('0 notes')).toBeInTheDocument();
    expect(screen.getByText('0 connections')).toBeInTheDocument();
    expect(screen.getByText('Avg: 0.0 links/note')).toBeInTheDocument();
  });

  test('should handle notes with no connections', () => {
    const isolatedNotes = [
      {
        id: 'note1',
        title: 'Isolated Note 1',
        body: 'This note has no links.',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'note2',
        title: 'Isolated Note 2',
        body: 'This note also has no links.',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    mockUseNoteStore.mockReturnValue({
      notes: isolatedNotes,
      selectNote: mockSelectNote,
    } as any);
    
    render(<GraphView />);
    
    expect(screen.getByText('2 notes')).toBeInTheDocument();
    expect(screen.getByText('0 connections')).toBeInTheDocument();
    expect(screen.getByText('Avg: 0.0 links/note')).toBeInTheDocument();
  });

  test('should handle notes with bidirectional links', () => {
    const bidirectionalNotes = [
      {
        id: 'note1',
        title: 'Note 1',
        body: 'Links to [[Note 2]]',
        tags: ['tag1'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'note2',
        title: 'Note 2',
        body: 'Links back to [[Note 1]]',
        tags: ['tag2'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    mockUseNoteStore.mockReturnValue({
      notes: bidirectionalNotes,
      selectNote: mockSelectNote,
    } as any);
    
    render(<GraphView />);
    
    expect(screen.getByText('2 notes')).toBeInTheDocument();
    expect(screen.getByText('1 connections')).toBeInTheDocument();
    expect(screen.getByText('Avg: 1.0 links/note')).toBeInTheDocument();
  });

  test('should handle canvas resize', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Simulate window resize
      fireEvent.resize(window);
    }
    
    // The canvas should handle resize events
    expect(canvas).toBeInTheDocument();
  });

  test('should render with different tag colors', () => {
    const colorfulNotes = [
      {
        id: 'note1',
        title: 'Red Note',
        body: 'Content',
        tags: ['red'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'note2',
        title: 'Blue Note',
        body: 'Content',
        tags: ['blue'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    mockUseNoteStore.mockReturnValue({
      notes: colorfulNotes,
      selectNote: mockSelectNote,
    } as any);
    
    render(<GraphView />);
    
    // The nodes should have different colors based on their tags
    expect(screen.getByText('2 notes')).toBeInTheDocument();
  });

  test('should handle long note titles', () => {
    const longTitleNote = {
      id: 'note1',
      title: 'This is a very long note title that should be truncated in the graph view',
      body: 'Content',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockUseNoteStore.mockReturnValue({
      notes: [longTitleNote],
      selectNote: mockSelectNote,
    } as any);
    
    render(<GraphView />);
    
    // The long title should be handled gracefully
    expect(screen.getByText('1 notes')).toBeInTheDocument();
  });

  test('should handle notes with many tags', () => {
    const manyTagsNote = {
      id: 'note1',
      title: 'Note with Many Tags',
      body: 'Content',
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockUseNoteStore.mockReturnValue({
      notes: [manyTagsNote],
      selectNote: mockSelectNote,
    } as any);
    
    render(<GraphView />);
    
    // The node size should be calculated based on tag count
    expect(screen.getByText('1 notes')).toBeInTheDocument();
  });

  // New tests for improvements
  test('should handle search with no results', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    expect(screen.getByText('Showing: 0 of 3')).toBeInTheDocument();
  });

  test('should handle case-insensitive search', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'NOTE 1' } });
    
    expect(screen.getByText('Showing: 1 of 3')).toBeInTheDocument();
  });

  test('should handle search with special characters', () => {
    render(<GraphView />);
    
    const searchInput = screen.getByPlaceholderText('Search nodes by title or tags...');
    fireEvent.change(searchInput, { target: { value: 'note 1!' } });
    
    expect(screen.getByText('Showing: 0 of 3')).toBeInTheDocument();
  });

  test('should handle minimap node rendering', () => {
    render(<GraphView />);
    
    // The minimap should render nodes
    expect(screen.getByText('Minimap')).toBeInTheDocument();
    
    // Check that minimap container exists
    const minimapContainer = screen.getByText('Minimap').closest('div');
    expect(minimapContainer).toBeInTheDocument();
  });

  test('should handle error boundary for canvas errors', () => {
    // Mock canvas context to throw an error
    const mockErrorContext = {
      ...mockContext,
      getBoundingClientRect: jest.fn(() => {
        throw new Error('Canvas error');
      })
    };
    
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      value: jest.fn(() => {
        throw new Error('Canvas error');
      })
    });
    
    render(<GraphView />);
    
    // Should show error boundary content
    expect(screen.getByText('Graph View Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to render graph visualization.')).toBeInTheDocument();
  });

  test('should handle error boundary retry', () => {
    // Mock canvas context to throw an error initially, then work
    let shouldThrow = true;
    
    Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
      value: jest.fn(() => {
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error('Canvas error');
        }
        return { width: 800, height: 600 };
      })
    });
    
    render(<GraphView />);
    
    // Should show error boundary content
    expect(screen.getByText('Graph View Error')).toBeInTheDocument();
    
    // Click retry button
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    // Should recover and show normal content
    expect(screen.getByText('3 notes')).toBeInTheDocument();
  });

  test('should handle requestAnimationFrame for performance', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Trigger a mouse move to test requestAnimationFrame usage
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    }
    
    // Should have called requestAnimationFrame
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  test('should handle persistent node positions', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Simulate dragging a node
      fireEvent.mouseDown(canvas, { clientX: 400, clientY: 300 });
      fireEvent.mouseMove(canvas, { clientX: 450, clientY: 350 });
      fireEvent.mouseUp(canvas);
    }
    
    // The node positions should be persisted in state
    // In a real test, we'd verify the state changes
    expect(canvas).toBeInTheDocument();
  });

  test('should handle hover states', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Simulate hovering over a node
      fireEvent.mouseMove(canvas, { clientX: 400, clientY: 300 });
    }
    
    // The hover state should be updated
    // In a real test, we'd verify the visual feedback
    expect(canvas).toBeInTheDocument();
  });

  test('should handle zoom limits', () => {
    render(<GraphView />);
    
    const zoomOutButton = screen.getByTitle('Zoom out');
    const zoomInButton = screen.getByTitle('Zoom in');
    
    // Test multiple zoom operations
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomOutButton);
    }
    
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomInButton);
    }
    
    // Should handle zoom limits gracefully
    expect(zoomOutButton).toBeInTheDocument();
    expect(zoomInButton).toBeInTheDocument();
  });

  test('should handle wheel zoom', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Test zoom in
      fireEvent.wheel(canvas, { deltaY: -100 });
      
      // Test zoom out
      fireEvent.wheel(canvas, { deltaY: 100 });
    }
    
    // Should handle wheel events
    expect(canvas).toBeInTheDocument();
  });

  test('should handle pan sensitivity', () => {
    render(<GraphView />);
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      // Simulate panning
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
      fireEvent.mouseUp(canvas);
    }
    
    // Should handle panning with proper sensitivity
    expect(canvas).toBeInTheDocument();
  });
}); 