import { GraphOptimizationService, Viewport } from './graphOptimizationService';
import { GraphNode, GraphLink } from '../types/graph';

describe('GraphOptimizationService', () => {
  const mockNodes: GraphNode[] = [
    {
      id: '1',
      title: 'Node 1',
      x: 0,
      y: 0,
      size: 30,
      color: '#ff0000',
      tags: ['test'],
      isSelected: false,
      isHovered: false
    },
    {
      id: '2',
      title: 'Node 2',
      x: 100,
      y: 100,
      size: 30,
      color: '#00ff00',
      tags: ['test'],
      isSelected: false,
      isHovered: false
    },
    {
      id: '3',
      title: 'Node 3',
      x: 200,
      y: 200,
      size: 30,
      color: '#0000ff',
      tags: ['demo'],
      isSelected: false,
      isHovered: false
    },
    {
      id: '4',
      title: 'Node 4',
      x: 50,
      y: 50,
      size: 30,
      color: '#ffff00',
      tags: ['test'],
      isSelected: false,
      isHovered: false
    }
  ];

  const mockLinks: GraphLink[] = [
    {
      source: '1',
      target: '2',
      type: 'internal',
      strength: 1
    },
    {
      source: '2',
      target: '3',
      type: 'internal',
      strength: 1
    },
    {
      source: '1',
      target: '4',
      type: 'tag',
      strength: 0.5
    }
  ];

  const mockViewport: Viewport = {
    x: 0,
    y: 0,
    width: 300,
    height: 300,
    zoom: 1
  };

  describe('optimizeGraph', () => {
    test('should return original data for small graphs in quality mode', () => {
      const result = GraphOptimizationService.optimizeGraph(
        mockNodes,
        mockLinks,
        mockViewport,
        'quality'
      );

      expect(result.visibleNodes).toHaveLength(4);
      expect(result.visibleLinks).toHaveLength(3);
      expect(result.clusteringLevel).toBe('none');
      expect(result.totalNodes).toBe(4);
      expect(result.totalLinks).toBe(3);
    });

    test('should apply clustering for large graphs in performance mode', () => {
      // Create many nodes for clustering
      const manyNodes = Array.from({ length: 150 }, (_, i) => ({
        ...mockNodes[0],
        id: `node-${i}`,
        title: `Node ${i}`,
        x: Math.random() * 1000,
        y: Math.random() * 1000
      }));

      const result = GraphOptimizationService.optimizeGraph(
        manyNodes,
        mockLinks,
        mockViewport,
        'performance'
      );

      expect(result.clusteringLevel).toBe('high');
      expect(result.visibleNodes.length).toBeLessThan(manyNodes.length);
      expect(result.performanceMetrics.clusteringEfficiency).toBeGreaterThan(0);
    });

    test('should apply viewport culling', () => {
      const viewportOutside: Viewport = {
        x: 1000,
        y: 1000,
        width: 300,
        height: 300,
        zoom: 1
      };

      const result = GraphOptimizationService.optimizeGraph(
        mockNodes,
        mockLinks,
        viewportOutside,
        'auto'
      );

      expect(result.visibleNodes.length).toBeLessThan(mockNodes.length);
      expect(result.performanceMetrics.cullingEfficiency).toBeGreaterThan(0);
    });

    test('should calculate performance metrics correctly', () => {
      const result = GraphOptimizationService.optimizeGraph(
        mockNodes,
        mockLinks,
        mockViewport,
        'auto'
      );

      expect(result.performanceMetrics.renderTime).toBeGreaterThan(0);
      expect(result.performanceMetrics.cullingEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.cullingEfficiency).toBeLessThanOrEqual(1);
      expect(result.performanceMetrics.clusteringEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.performanceMetrics.clusteringEfficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateViewport', () => {
    test('should calculate viewport correctly', () => {
      const canvasWidth = 800;
      const canvasHeight = 600;
      const pan = { x: 100, y: 50 };
      const zoom = 2;

      const viewport = GraphOptimizationService.calculateViewport(
        canvasWidth,
        canvasHeight,
        pan,
        zoom
      );

      expect(viewport.x).toBe(-150); // (-100 - 400) / 2
      expect(viewport.y).toBe(-100); // (-50 - 300) / 2
      expect(viewport.width).toBe(400); // 800 / 2
      expect(viewport.height).toBe(300); // 600 / 2
      expect(viewport.zoom).toBe(2);
    });

    test('should handle zero zoom', () => {
      const viewport = GraphOptimizationService.calculateViewport(
        800,
        600,
        { x: 0, y: 0 },
        0.5
      );

      expect(viewport.width).toBe(1600); // 800 / 0.5
      expect(viewport.height).toBe(1200); // 600 / 0.5
    });
  });

  describe('getPerformanceRecommendations', () => {
    test('should recommend clustering for slow rendering', () => {
      const metrics = {
        renderTime: 50, // Slow
        cullingEfficiency: 0.5,
        clusteringEfficiency: 0.2
      };

      const recommendations = GraphOptimizationService.getPerformanceRecommendations(metrics);
      expect(recommendations).toContain('Consider enabling higher clustering level');
    });

    test('should recommend zooming out for low culling efficiency', () => {
      const metrics = {
        renderTime: 10,
        cullingEfficiency: 0.1, // Low
        clusteringEfficiency: 0.5
      };

      const recommendations = GraphOptimizationService.getPerformanceRecommendations(metrics);
      expect(recommendations).toContain('Viewport culling efficiency is low - consider zooming out');
    });

    test('should praise high clustering efficiency', () => {
      const metrics = {
        renderTime: 10,
        cullingEfficiency: 0.5,
        clusteringEfficiency: 0.8 // High
      };

      const recommendations = GraphOptimizationService.getPerformanceRecommendations(metrics);
      expect(recommendations).toContain('High clustering efficiency - graph is well optimized');
    });

    test('should return empty array for good performance', () => {
      const metrics = {
        renderTime: 10,
        cullingEfficiency: 0.7,
        clusteringEfficiency: 0.3
      };

      const recommendations = GraphOptimizationService.getPerformanceRecommendations(metrics);
      expect(recommendations).toHaveLength(0);
    });
  });

  describe('clustering behavior', () => {
    test('should cluster nearby nodes', () => {
      const nearbyNodes: GraphNode[] = [
        { ...mockNodes[0], x: 0, y: 0 },
        { ...mockNodes[1], x: 50, y: 50 }, // Within cluster radius
        { ...mockNodes[2], x: 200, y: 200 } // Far away
      ];

      const result = GraphOptimizationService.optimizeGraph(
        nearbyNodes,
        mockLinks,
        mockViewport,
        'performance'
      );

      // Should have clustering applied
      expect(result.clusteringLevel).not.toBe('none');
      expect(result.visibleNodes.length).toBeLessThan(nearbyNodes.length);
    });

    test('should handle empty node arrays', () => {
      const result = GraphOptimizationService.optimizeGraph(
        [],
        [],
        mockViewport,
        'auto'
      );

      expect(result.visibleNodes).toHaveLength(0);
      expect(result.visibleLinks).toHaveLength(0);
      expect(result.clusteringLevel).toBe('none');
    });

    test('should handle single node', () => {
      const result = GraphOptimizationService.optimizeGraph(
        [mockNodes[0]],
        [],
        mockViewport,
        'performance'
      );

      expect(result.visibleNodes).toHaveLength(1);
      expect(result.clusteringLevel).toBe('none');
    });
  });

  describe('viewport culling behavior', () => {
    test('should cull nodes outside viewport', () => {
      const nodesOutsideViewport: GraphNode[] = [
        { ...mockNodes[0], x: 0, y: 0 }, // Inside
        { ...mockNodes[1], x: 1000, y: 1000 }, // Outside
        { ...mockNodes[2], x: -1000, y: -1000 } // Outside
      ];

      const result = GraphOptimizationService.optimizeGraph(
        nodesOutsideViewport,
        mockLinks,
        mockViewport,
        'quality'
      );

      expect(result.visibleNodes.length).toBeLessThan(nodesOutsideViewport.length);
      expect(result.performanceMetrics.cullingEfficiency).toBeGreaterThan(0);
    });

    test('should include margin in culling calculations', () => {
      const nodesAtEdge: GraphNode[] = [
        { ...mockNodes[0], x: 350, y: 350 }, // Just outside viewport but within margin
        { ...mockNodes[1], x: 500, y: 500 } // Far outside
      ];

      const result = GraphOptimizationService.optimizeGraph(
        nodesAtEdge,
        mockLinks,
        mockViewport,
        'quality'
      );

      // Should include the node within margin
      expect(result.visibleNodes.length).toBeGreaterThan(0);
    });
  });
}); 