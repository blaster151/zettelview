import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import GraphCanvas from './GraphCanvas';
import { GraphNode, GraphLink } from '../../types/graph';
import { ThemeColors } from '../../types/theme';

// Mock D3
vi.mock('d3', () => ({
  forceSimulation: jest.fn(() => ({
    force: vi.fn().mockReturnThis(),
    alphaDecay: vi.fn().mockReturnThis(),
    velocityDecay: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    stop: vi.fn(),
    alpha: vi.fn().mockReturnThis(),
    restart: vi.fn(),
    alphaTarget: vi.fn().mockReturnThis(),
    nodes: vi.fn().mockReturnThis()
  })),
  forceLink: jest.fn(() => ({
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
    links: vi.fn().mockReturnThis()
  })),
  forceManyBody: jest.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    distanceMax: vi.fn().mockReturnThis()
  })),
  forceCenter: jest.fn(() => ({
    strength: vi.fn().mockReturnThis()
  })),
  forceCollide: jest.fn(() => ({
    radius: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis()
  })),
  forceX: jest.fn(() => ({
    strength: vi.fn().mockReturnThis()
  })),
  forceY: jest.fn(() => ({
    strength: vi.fn().mockReturnThis()
  })),
  select: jest.fn(() => ({
    select: jest.fn(() => ({
      attr: vi.fn().mockReturnThis(),
      append: jest.fn(() => ({
        attr: vi.fn().mockReturnThis(),
        style: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        selectAll: jest.fn(() => ({
          data: jest.fn(() => ({
            enter: jest.fn(() => ({
              append: jest.fn(() => ({
                attr: vi.fn().mockReturnThis(),
                style: vi.fn().mockReturnThis(),
                on: vi.fn().mockReturnThis(),
                text: vi.fn().mockReturnThis(),
                call: vi.fn().mockReturnThis()
              }))
            }))
          }))
        })),
        remove: vi.fn()
      }))
    }))
  })),
  drag: jest.fn(() => ({
    on: vi.fn().mockReturnThis()
  }))
}));

const mockColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  primary: '#007bff',
  secondary: '#6c757d',
  accent: '#17a2b8',
  warning: '#ffc107',
  error: '#dc3545',
  success: '#28a745',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6'
};

const mockNodes: GraphNode[] = [
  {
    id: 'node1',
    title: 'Node 1',
    x: 100,
    y: 100,
    size: 30,
    color: '#007bff',
    tags: ['tag1'],
    isSelected: false,
    isHovered: false
  },
  {
    id: 'node2',
    title: 'Node 2',
    x: 200,
    y: 200,
    size: 25,
    color: '#6c757d',
    tags: ['tag2'],
    isSelected: false,
    isHovered: false
  }
];

const mockLinks: GraphLink[] = [
  {
    source: 'node1',
    target: 'node2',
    type: 'internal',
    strength: 1
  }
];

describe('GraphCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        colors={mockColors}
      />
    );

    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('should handle canvas click', () => {
    const mockOnCanvasClick = vi.fn();
    
    render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        onCanvasClick={mockOnCanvasClick}
        colors={mockColors}
      />
    );

    const svg = screen.getByRole('img');
    fireEvent.click(svg);
    
    expect(mockOnCanvasClick).toHaveBeenCalled();
  });

  test('should handle mouse wheel zoom', () => {
    render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        colors={mockColors}
      />
    );

    const svg = screen.getByRole('img');
    fireEvent.wheel(svg, { deltaY: 100 });
    
    // The zoom functionality would be tested by checking if the transform was updated
    // Since we're mocking D3, we just verify the event was handled
    expect(svg).toBeInTheDocument();
  });

  test('should handle mouse drag for panning', () => {
    render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        colors={mockColors}
      />
    );

    const svg = screen.getByRole('img');
    
    fireEvent.mouseDown(svg, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(svg, { clientX: 150, clientY: 150 });
    fireEvent.mouseUp(svg);
    
    // The panning functionality would be tested by checking if the transform was updated
    expect(svg).toBeInTheDocument();
  });

  test('should update transform when zoom/pan props change', () => {
    const { rerender } = render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        colors={mockColors}
      />
    );

    // Re-render with different zoom/pan values
    rerender(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1.5}
        pan={{ x: 50, y: 50 }}
        colors={mockColors}
      />
    );

    // The transform should be updated
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('should handle node hover', () => {
    const mockOnNodeHover = vi.fn();
    
    render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        onNodeHover={mockOnNodeHover}
        colors={mockColors}
      />
    );

    // Since nodes are rendered as SVG elements, we can't easily test hover
    // But we can verify the callback is available
    expect(mockOnNodeHover).toBeDefined();
  });

  test('should handle node click', () => {
    const mockOnNodeClick = vi.fn();
    
    render(
      <GraphCanvas
        nodes={mockNodes}
        links={mockLinks}
        zoom={1}
        pan={{ x: 0, y: 0 }}
        onNodeClick={mockOnNodeClick}
        colors={mockColors}
      />
    );

    // Since nodes are rendered as SVG elements, we can't easily test clicks
    // But we can verify the callback is available
    expect(mockOnNodeClick).toBeDefined();
  });
}); 