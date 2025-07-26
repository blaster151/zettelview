import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { GraphNode, GraphLink, GraphRenderMode } from '../../types/graph';
import { GraphLinkService } from '../../services/graphLinkService';
import { GraphOptimizationService } from '../../services/graphOptimizationService';

// Lazy load heavy components
const GraphCanvas = React.lazy(() => import('../graph/GraphCanvas'));
const GraphControls = React.lazy(() => import('../graph/GraphControls'));
const GraphLegend = React.lazy(() => import('../graph/GraphLegend'));
const RenderModeSelector = React.lazy(() => import('../graph/RenderModeSelector'));
const GraphPerformanceMonitor = React.lazy(() => import('../graph/GraphPerformanceMonitor'));

// Performance constants
const PERFORMANCE_CONSTANTS = {
  RENDER_THROTTLE: 16, // ~60fps
  NODE_CLICK_DEBOUNCE: 150,
  ZOOM_SENSITIVITY: 0.1,
  PAN_SENSITIVITY: 0.5,
  MAX_NODES_FOR_QUALITY: 100,
  MAX_NODES_FOR_PERFORMANCE: 500
} as const;

interface GraphViewProps {
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
}

// Memoized graph data calculation
const useGraphData = (notes: any[], renderMode: GraphRenderMode, selectedNodeId?: string, hoveredNode?: string) => {
  return useMemo(() => {
    const startTime = performance.now();
    
    const graphNodes: GraphNode[] = notes.map((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI;
      const radius = 200;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const contentLength = note.body.length;
      const tagCount = note.tags.length;
      const size = Math.max(20, Math.min(60, 30 + (contentLength / 1000) * 5 + tagCount * 2));

      const color = note.tags.length > 0 
        ? `hsl(${(note.tags[0].length * 50) % 360}, 70%, 60%)`
        : '#6c757d';

      return {
        id: note.id,
        title: note.title,
        x,
        y,
        size,
        color,
        tags: note.tags,
        isSelected: note.id === selectedNodeId,
        isHovered: note.id === hoveredNode
      };
    });

    const graphLinks = GraphLinkService.generateLinks(notes, renderMode);
    
    const endTime = performance.now();
    
    return {
      nodes: graphNodes,
      links: graphLinks,
      performanceMetrics: {
        calculationTime: endTime - startTime,
        nodeCount: graphNodes.length,
        linkCount: graphLinks.length
      }
    };
  }, [notes, renderMode, selectedNodeId, hoveredNode]);
};

// Memoized viewport optimization
const useViewportOptimization = (nodes: GraphNode[], links: GraphLink[], performanceMode: string) => {
  return useMemo(() => {
    const nodeCount = nodes.length;
    
    // Determine optimization level based on node count and performance mode
    let optimizationLevel = 'none';
    if (performanceMode === 'performance' || nodeCount > PERFORMANCE_CONSTANTS.MAX_NODES_FOR_PERFORMANCE) {
      optimizationLevel = 'high';
    } else if (nodeCount > PERFORMANCE_CONSTANTS.MAX_NODES_FOR_QUALITY) {
      optimizationLevel = 'medium';
    }

    // Apply optimizations
    let optimizedNodes = nodes;
    let optimizedLinks = links;

    if (optimizationLevel === 'high') {
      // High optimization: reduce node count, simplify rendering
      optimizedNodes = nodes.slice(0, PERFORMANCE_CONSTANTS.MAX_NODES_FOR_PERFORMANCE);
      optimizedLinks = links.filter(link => 
        optimizedNodes.some(node => node.id === link.source) &&
        optimizedNodes.some(node => node.id === link.target)
      );
    } else if (optimizationLevel === 'medium') {
      // Medium optimization: reduce link complexity
      optimizedLinks = links.slice(0, links.length * 0.7);
    }

    return {
      nodes: optimizedNodes,
      links: optimizedLinks,
      optimizationLevel,
      originalNodeCount: nodeCount,
      originalLinkCount: links.length
    };
  }, [nodes, links, performanceMode]);
};

// Memoized interaction handlers
const useGraphInteractions = (
  onNodeClick?: (nodeId: string) => void,
  onNodeHover?: (nodeId: string | null) => void
) => {
  const handleNodeClick = useCallback((nodeId: string) => {
    onNodeClick?.(nodeId);
  }, [onNodeClick]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    onNodeHover?.(nodeId);
  }, [onNodeHover]);

  const handleCanvasClick = useCallback(() => {
    onNodeClick?.('');
  }, [onNodeClick]);

  return {
    handleNodeClick,
    handleNodeHover,
    handleCanvasClick
  };
};

// Main GraphView component with performance optimizations
const GraphView: React.FC<GraphViewProps> = ({ onNodeClick, selectedNodeId }) => {
  const notes = useNoteStore(state => state.notes);
  const selectNote = useNoteStore(state => state.selectNote);
  const colors = useThemeStore(state => state.colors);
  
  // State management with performance considerations
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMinimap, setShowMinimap] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'performance' | 'auto'>('auto');
  
  // Force-directed layout state
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  
  // Advanced filtering state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [contentFilter, setContentFilter] = useState<'all' | 'has-links' | 'has-tags' | 'has-content'>('all');
  const [nodeSizeFilter, setNodeSizeFilter] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  
  // Render mode state with localStorage persistence
  const [renderMode, setRenderMode] = useState<GraphRenderMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zettelview_graph_render_mode');
      return (saved as GraphRenderMode) || 'internal-links';
    }
    return 'internal-links';
  });
  
  // Persistent node positions
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Handle render mode change with persistence
  const handleRenderModeChange = useCallback((mode: GraphRenderMode) => {
    setRenderMode(mode);
    localStorage.setItem('zettelview_graph_render_mode', mode);
  }, []);

  // Memoized graph data
  const { nodes, links, performanceMetrics } = useGraphData(
    notes, 
    renderMode, 
    selectedNodeId, 
    hoveredNode
  );

  // Memoized viewport optimization
  const { 
    nodes: optimizedNodes, 
    links: optimizedLinks, 
    optimizationLevel,
    originalNodeCount,
    originalLinkCount
  } = useViewportOptimization(nodes, links, performanceMode);

  // Memoized interaction handlers
  const { handleNodeClick, handleNodeHover, handleCanvasClick } = useGraphInteractions(
    (nodeId) => {
      if (nodeId) {
        selectNote(nodeId);
        onNodeClick?.(nodeId);
      }
    },
    (nodeId: string | null) => setHoveredNode(nodeId || undefined)
  );

  // Memoized filtered nodes
  const filteredNodes = useMemo(() => {
    let filtered = optimizedNodes;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node => 
        node.title.toLowerCase().includes(query) ||
        node.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(node =>
        selectedTags.some(tag => node.tags.includes(tag))
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(node => {
        const note = notes.find(n => n.id === node.id);
        return note && new Date(note.createdAt) >= filterDate;
      });
    }

    // Content filter
    if (contentFilter !== 'all') {
      filtered = filtered.filter(node => {
        const note = notes.find(n => n.id === node.id);
        if (!note) return false;
        
        switch (contentFilter) {
          case 'has-links':
            return /\[\[([^[\]]+)\]\]/g.test(note.body);
          case 'has-tags':
            return note.tags.length > 0;
          case 'has-content':
            return note.body.length > 100;
          default:
            return true;
        }
      });
    }

    // Node size filter
    if (nodeSizeFilter !== 'all') {
      filtered = filtered.filter(node => {
        const size = node.size;
        switch (nodeSizeFilter) {
          case 'small':
            return size <= 25;
          case 'medium':
            return size > 25 && size <= 40;
          case 'large':
            return size > 40;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [optimizedNodes, searchQuery, selectedTags, dateFilter, contentFilter, nodeSizeFilter, notes]);

  // Memoized filtered links
  const filteredLinks = useMemo(() => {
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    return optimizedLinks.filter(link => 
      filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
    );
  }, [optimizedLinks, filteredNodes]);

  // Performance monitoring data
  const performanceData = useMemo(() => ({
    totalNodes: originalNodeCount,
    totalLinks: originalLinkCount,
    visibleNodes: filteredNodes.length,
    visibleLinks: filteredLinks.length,
    optimizationLevel,
    performanceMetrics,
    cullingEfficiency: originalNodeCount > 0 ? (originalNodeCount - filteredNodes.length) / originalNodeCount : 0,
    clusteringEfficiency: 0, // Would be calculated if clustering was implemented
    renderTime: performanceMetrics.calculationTime,
    clusteringLevel: 'none' as const
  }), [originalNodeCount, originalLinkCount, filteredNodes.length, filteredLinks.length, optimizationLevel, performanceMetrics]);

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Graph controls */}
      <div style={{ 
        padding: '8px', 
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Suspense fallback={<div>Loading...</div>}>
            <RenderModeSelector
              currentMode={renderMode}
              onModeChange={handleRenderModeChange}
            />
          </Suspense>

          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '4px 8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px'
            }}
            aria-label="Search graph nodes"
          />
          
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            style={{
              padding: '4px 8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: showFilterPanel ? colors.primary : 'transparent',
              color: showFilterPanel ? 'white' : colors.text,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            aria-label={`${showFilterPanel ? 'Hide' : 'Show'} filter panel`}
            aria-expanded={showFilterPanel}
          >
            🔍 Filters
          </button>
          
          <button
            onClick={() => setShowMinimap(!showMinimap)}
            style={{
              padding: '4px 8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: showMinimap ? colors.primary : 'transparent',
              color: showMinimap ? 'white' : colors.text,
              cursor: 'pointer',
              fontSize: '12px'
            }}
            aria-label={`${showMinimap ? 'Hide' : 'Show'} minimap`}
            aria-expanded={showMinimap}
          >
            🗺️ Minimap
          </button>
          
          {/* Zoom controls */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <button
              onClick={() => setZoom(Math.max(0.1, zoom / 1.2))}
              style={{
                width: '24px',
                height: '24px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
            
            <span style={{
              fontSize: '11px',
              color: colors.textSecondary,
              padding: '0 4px',
              minWidth: '40px',
              textAlign: 'center'
            }}>
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => setZoom(Math.min(3, zoom * 1.2))}
              style={{
                width: '24px',
                height: '24px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
            
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              style={{
                width: '24px',
                height: '24px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px'
              }}
              title="Reset view"
              aria-label="Reset view"
            >
              ⌂
            </button>
          </div>
          
          {/* Simulation controls */}
          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            <button
              onClick={() => setIsSimulationRunning(!isSimulationRunning)}
              style={{
                padding: '4px 8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: isSimulationRunning ? colors.primary : 'transparent',
                color: isSimulationRunning ? 'white' : colors.text,
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title={`${isSimulationRunning ? 'Pause' : 'Resume'} simulation`}
              aria-label={`${isSimulationRunning ? 'Pause' : 'Resume'} simulation`}
            >
              {isSimulationRunning ? '⏸️' : '▶️'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div style={{
          padding: '12px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surface
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Tag filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Tags:
              </label>
              <select
                multiple
                value={selectedTags}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedTags(values);
                }}
                style={{
                  padding: '4px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px',
                  minWidth: '120px'
                }}
                aria-label="Filter by tags"
              >
                <option value="">All tags</option>
                {Array.from(new Set(notes.flatMap(note => note.tags))).map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Date:
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                style={{
                  padding: '4px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Filter by date"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
            </div>

            {/* Content filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Content:
              </label>
              <select
                value={contentFilter}
                onChange={(e) => setContentFilter(e.target.value as any)}
                style={{
                  padding: '4px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Filter by content type"
              >
                <option value="all">All notes</option>
                <option value="has-links">With links</option>
                <option value="has-tags">With tags</option>
                <option value="has-content">With content</option>
              </select>
            </div>

            {/* Node size filter */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>
                Size:
              </label>
              <select
                value={nodeSizeFilter}
                onChange={(e) => setNodeSizeFilter(e.target.value as any)}
                style={{
                  padding: '4px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Filter by node size"
              >
                <option value="all">All sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Clear filters */}
            <div style={{ display: 'flex', alignItems: 'end' }}>
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setDateFilter('all');
                  setContentFilter('all');
                  setNodeSizeFilter('all');
                }}
                style={{
                  padding: '4px 8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
                aria-label="Clear all filters"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filter summary */}
          <div style={{ 
            marginTop: '8px', 
            fontSize: '11px', 
            color: colors.textSecondary 
          }}>
            Showing {filteredNodes.length} of {originalNodeCount} nodes
            {filteredNodes.length !== originalNodeCount && (
              <span style={{ color: colors.primary }}>
                {' '}(filtered)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main graph area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: colors.textSecondary
          }}>
            Loading graph...
          </div>
        }>
          <GraphCanvas
            nodes={filteredNodes}
            links={filteredLinks}
            zoom={zoom}
            pan={pan}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onCanvasClick={handleCanvasClick}
            colors={colors}
          />
        </Suspense>

        {/* Performance monitor */}
        <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
          <Suspense fallback={<div>Loading...</div>}>
            <GraphPerformanceMonitor
              graphData={performanceData}
              onPerformanceModeChange={setPerformanceMode}
              currentMode={performanceMode}
            />
          </Suspense>
        </div>

        {/* Minimap */}
        {showMinimap && (
          <div style={{ position: 'absolute', bottom: '8px', right: '8px' }}>
            <Suspense fallback={<div>Loading minimap...</div>}>
              <GraphControls
                zoom={zoom}
                pan={pan}
                onZoomChange={setZoom}
                onPanChange={setPan}
                colors={colors}
              />
            </Suspense>
          </div>
        )}
      </div>

      {/* Graph legend */}
      <div style={{ 
        padding: '8px', 
        borderTop: `1px solid ${colors.border}`,
        background: colors.surface
      }}>
        <Suspense fallback={<div>Loading legend...</div>}>
          <GraphLegend
            renderMode={renderMode}
            nodeCount={filteredNodes.length}
            linkCount={filteredLinks.length}
            colors={colors}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default GraphView; 