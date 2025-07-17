import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GraphPerformanceMonitor from './GraphPerformanceMonitor';
import { OptimizedGraphData } from '../../services/graphOptimizationService';

const mockGraphData: OptimizedGraphData = {
  visibleNodes: [
    {
      id: '1',
      title: 'Test Node',
      x: 0,
      y: 0,
      size: 30,
      color: '#ff0000',
      tags: ['test'],
      isSelected: false,
      isHovered: false
    }
  ],
  visibleLinks: [
    {
      source: '1',
      target: '2',
      type: 'internal',
      strength: 1
    }
  ],
  totalNodes: 10,
  totalLinks: 5,
  clusteringLevel: 'none',
  performanceMetrics: {
    cullingEfficiency: 0.5,
    clusteringEfficiency: 0.2,
    renderTime: 12.5
  }
};

describe('GraphPerformanceMonitor', () => {
  const defaultProps = {
    graphData: mockGraphData,
    onPerformanceModeChange: jest.fn(),
    currentMode: 'auto' as const
  };

  test('renders performance monitor with basic information', () => {
    render(<GraphPerformanceMonitor {...defaultProps} />);
    
    expect(screen.getByText('Graph Performance')).toBeInTheDocument();
    expect(screen.getByText('Nodes: 1/10')).toBeInTheDocument();
    expect(screen.getByText('Links: 1/5')).toBeInTheDocument();
    expect(screen.getByText('Render: 12.5ms')).toBeInTheDocument();
  });

  test('displays performance mode selector', () => {
    render(<GraphPerformanceMonitor {...defaultProps} />);
    
    const modeSelector = screen.getByDisplayValue('Auto');
    expect(modeSelector).toBeInTheDocument();
    
    fireEvent.change(modeSelector, { target: { value: 'performance' } });
    expect(defaultProps.onPerformanceModeChange).toHaveBeenCalledWith('performance');
  });

  test('shows performance status based on metrics', () => {
    const goodPerformanceData = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.8,
        clusteringEfficiency: 0.6,
        renderTime: 8.0
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={goodPerformanceData} />);
    
    // Should show "Good" status for good performance
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  test('shows poor performance status for slow rendering', () => {
    const poorPerformanceData = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.1,
        clusteringEfficiency: 0.1,
        renderTime: 50.0
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={poorPerformanceData} />);
    
    expect(screen.getByText('Poor')).toBeInTheDocument();
  });

  test('expands to show detailed metrics when expand button is clicked', () => {
    render(<GraphPerformanceMonitor {...defaultProps} />);
    
    const expandButton = screen.getByTitle('Expand');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Clustering: none')).toBeInTheDocument();
    expect(screen.getByText('Culling: 50%')).toBeInTheDocument();
    expect(screen.getByText('Clustering: 20%')).toBeInTheDocument();
    expect(screen.getByText('FPS: 80')).toBeInTheDocument(); // 1000/12.5
  });

  test('shows recommendations when recommendations button is clicked', () => {
    const dataWithRecommendations = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.1, // Low culling efficiency
        clusteringEfficiency: 0.1,
        renderTime: 50.0 // Slow rendering
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={dataWithRecommendations} />);
    
    const recommendationsButton = screen.getByTitle('Show recommendations');
    fireEvent.click(recommendationsButton);
    
    expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    expect(screen.getByText(/Consider enabling higher clustering level/)).toBeInTheDocument();
    expect(screen.getByText(/Zoom out to improve culling efficiency/)).toBeInTheDocument();
  });

  test('shows performance warning for very slow rendering', () => {
    const slowPerformanceData = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.5,
        clusteringEfficiency: 0.2,
        renderTime: 50.0 // > 33ms threshold
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={slowPerformanceData} />);
    
    expect(screen.getByText(/⚠️ Slow rendering detected/)).toBeInTheDocument();
  });

  test('handles clustering level display', () => {
    const clusteredData = {
      ...mockGraphData,
      clusteringLevel: 'high' as const
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={clusteredData} />);
    
    const expandButton = screen.getByTitle('Expand');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('Clustering: high')).toBeInTheDocument();
  });

  test('handles large graphs with recommendations', () => {
    const largeGraphData = {
      ...mockGraphData,
      totalNodes: 250,
      totalLinks: 100
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={largeGraphData} />);
    
    const recommendationsButton = screen.getByTitle('Show recommendations');
    fireEvent.click(recommendationsButton);
    
    expect(screen.getByText(/Large graph detected/)).toBeInTheDocument();
  });

  test('collapses detailed view when collapse button is clicked', () => {
    render(<GraphPerformanceMonitor {...defaultProps} />);
    
    const expandButton = screen.getByTitle('Expand');
    fireEvent.click(expandButton);
    
    // Should show detailed metrics
    expect(screen.getByText('Clustering: none')).toBeInTheDocument();
    
    const collapseButton = screen.getByTitle('Collapse');
    fireEvent.click(collapseButton);
    
    // Should hide detailed metrics
    expect(screen.queryByText('Clustering: none')).not.toBeInTheDocument();
  });

  test('hides recommendations when recommendations button is clicked again', () => {
    const dataWithRecommendations = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.1,
        clusteringEfficiency: 0.1,
        renderTime: 50.0
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={dataWithRecommendations} />);
    
    const recommendationsButton = screen.getByTitle('Show recommendations');
    fireEvent.click(recommendationsButton);
    
    // Should show recommendations
    expect(screen.getByText('Recommendations:')).toBeInTheDocument();
    
    fireEvent.click(recommendationsButton);
    
    // Should hide recommendations
    expect(screen.queryByText('Recommendations:')).not.toBeInTheDocument();
  });

  test('displays correct FPS calculation', () => {
    const dataWithSpecificRenderTime = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.5,
        clusteringEfficiency: 0.2,
        renderTime: 16.67 // Should give ~60 FPS
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={dataWithSpecificRenderTime} />);
    
    const expandButton = screen.getByTitle('Expand');
    fireEvent.click(expandButton);
    
    expect(screen.getByText('FPS: 60')).toBeInTheDocument(); // 1000/16.67 ≈ 60
  });

  test('handles zero render time gracefully', () => {
    const dataWithZeroRenderTime = {
      ...mockGraphData,
      performanceMetrics: {
        cullingEfficiency: 0.5,
        clusteringEfficiency: 0.2,
        renderTime: 0
      }
    };

    render(<GraphPerformanceMonitor {...defaultProps} graphData={dataWithZeroRenderTime} />);
    
    expect(screen.getByText('Render: 0.0ms')).toBeInTheDocument();
  });
}); 