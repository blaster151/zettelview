import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNoteStore } from '../store/noteStore';
import { Note } from '../types/domain';
import { GraphNode, GraphLink, GraphRenderMode } from '../types/graph';
import { GraphLinkService } from '../services/graphLinkService';
import { GraphOptimizationService, OptimizedGraphData, Viewport } from '../services/graphOptimizationService';
import RenderModeSelector from './graph/RenderModeSelector';
import GraphPerformanceMonitor from './graph/GraphPerformanceMonitor';

interface GraphViewProps {
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
}

// Constants - extracted from magic numbers
const GRAPH_CONSTANTS = {
  INITIAL_RADIUS: 200,
  MIN_NODE_SIZE: 20,
  MAX_NODE_SIZE: 60,
  BASE_NODE_SIZE: 30,
  CONTENT_SIZE_FACTOR: 10,
  TAG_SIZE_FACTOR: 5,
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 3,
  ZOOM_FACTOR: 1.2,
  PAN_SENSITIVITY: 1,
  HOVER_RADIUS: 5,
  DEBOUNCE_DELAY: 16, // ~60fps
} as const;

// Error boundary for canvas operations
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#666',
          background: '#f8f9fa',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          margin: '16px'
        }}>
          <h3>Graph View Error</h3>
          <p>Failed to render graph visualization.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const GraphView: React.FC<GraphViewProps> = ({ onNodeClick, selectedNodeId }) => {
  const { notes, selectNote } = useNoteStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  // State management
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMinimap, setShowMinimap] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'performance' | 'auto'>('auto');
  
  // Render mode state with localStorage persistence
  const [renderMode, setRenderMode] = useState<GraphRenderMode>(() => {
    const saved = localStorage.getItem('zettelview_graph_render_mode');
    return (saved as GraphRenderMode) || 'internal-links';
  });
  
  // Persistent node positions (in a real app, this would be in the store)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // Handle render mode change with persistence
  const handleRenderModeChange = useCallback((mode: GraphRenderMode) => {
    setRenderMode(mode);
    localStorage.setItem('zettelview_graph_render_mode', mode);
  }, []);

  // Memoized graph data generation with render mode support
  const { nodes, links, filteredNodes } = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const linkCounts: Record<string, number> = {};

    // Create nodes from notes with memoized calculations
    notes.forEach((note, index) => {
      // Use saved position or calculate new one
      const savedPosition = nodePositions[note.id];
      let x: number, y: number;
      
      if (savedPosition) {
        x = savedPosition.x;
        y = savedPosition.y;
      } else {
        const angle = (index / notes.length) * 2 * Math.PI;
        const radius = GRAPH_CONSTANTS.INITIAL_RADIUS;
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }

      // Memoized size calculation
      const contentLength = note.body.length;
      const tagCount = note.tags.length;
      const size = Math.max(
        GRAPH_CONSTANTS.MIN_NODE_SIZE,
        Math.min(
          GRAPH_CONSTANTS.MAX_NODE_SIZE,
          GRAPH_CONSTANTS.BASE_NODE_SIZE + 
          (contentLength / 1000) * GRAPH_CONSTANTS.CONTENT_SIZE_FACTOR + 
          tagCount * GRAPH_CONSTANTS.TAG_SIZE_FACTOR
        )
      );

      // Memoized color generation
      const color = note.tags.length > 0 
        ? `hsl(${(note.tags[0].length * 50) % 360}, 70%, 60%)`
        : '#6c757d';

      const isSelected = note.id === selectedNodeId;
      const isHovered = note.id === hoveredNode;

      graphNodes.push({
        id: note.id,
        title: note.title,
        x,
        y,
        size,
        color,
        tags: note.tags,
        isSelected,
        isHovered
      });
    });

    // Generate links based on selected render mode
    const graphLinks = GraphLinkService.generateLinks(notes, renderMode);

    // Filter nodes based on search query
    const filtered = searchQuery.trim() === '' 
      ? graphNodes 
      : graphNodes.filter(node => 
          node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    return { nodes: graphNodes, links: graphLinks, filteredNodes: filtered };
  }, [notes, nodePositions, selectedNodeId, hoveredNode, searchQuery, renderMode]);

  // Optimize graph data based on viewport and performance mode
  const optimizedGraphData = useMemo((): OptimizedGraphData => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return {
        visibleNodes: filteredNodes,
        visibleLinks: links,
        totalNodes: nodes.length,
        totalLinks: links.length,
        clusteringLevel: 'none',
        performanceMetrics: { cullingEfficiency: 0, clusteringEfficiency: 0, renderTime: 0 }
      };
    }

    const viewport = GraphOptimizationService.calculateViewport(
      canvas.width,
      canvas.height,
      pan,
      zoom
    );

    return GraphOptimizationService.optimizeGraph(
      filteredNodes,
      links,
      viewport,
      performanceMode
    );
  }, [filteredNodes, links, nodes.length, pan, zoom, performanceMode]);

  // Debounced canvas drawing with requestAnimationFrame
  const drawGraph = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations
        ctx.save();
        ctx.translate(pan.x + canvas.width / 2, pan.y + canvas.height / 2);
        ctx.scale(zoom, zoom);

        // Draw optimized links
        optimizedGraphData.visibleLinks.forEach(link => {
          const sourceNode = optimizedGraphData.visibleNodes.find(n => n.id === link.source);
          const targetNode = optimizedGraphData.visibleNodes.find(n => n.id === link.target);
          
          if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.moveTo(sourceNode.x, sourceNode.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            
            // Different link styles based on type
            let strokeStyle: string;
            let lineWidth: number;
            
            switch (link.type) {
              case 'internal':
                strokeStyle = `rgba(0, 123, 255, ${0.4 + link.strength * 0.3})`;
                lineWidth = 1 + link.strength;
                break;
              case 'tag':
                strokeStyle = `rgba(40, 167, 69, ${0.4 + link.strength * 0.3})`;
                lineWidth = 1 + link.strength * 0.5;
                break;
              case 'similarity':
                strokeStyle = `rgba(255, 193, 7, ${0.4 + link.strength * 0.3})`;
                lineWidth = 1 + link.strength * 0.5;
                break;
              case 'hierarchical':
                strokeStyle = `rgba(220, 53, 69, ${0.4 + link.strength * 0.3})`;
                lineWidth = 1 + link.strength;
                break;
              default:
                strokeStyle = `rgba(100, 100, 100, ${0.3 + link.strength * 0.2})`;
                lineWidth = 1 + link.strength;
            }
            
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        });

        // Draw optimized nodes (including clusters)
        optimizedGraphData.visibleNodes.forEach(node => {
          const isSelected = node.isSelected;
          const isHovered = node.isHovered;
          const isCluster = 'isCluster' in node && node.isCluster;

          // Node circle with enhanced visual feedback
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
          
          if (isSelected) {
            ctx.fillStyle = '#007bff';
          } else if (isHovered) {
            ctx.fillStyle = '#0056b3';
          } else {
            ctx.fillStyle = node.color;
          }
          
          ctx.fill();
          
          // Node border with enhanced styling
          ctx.strokeStyle = isSelected ? '#0056b3' : isHovered ? '#007bff' : '#fff';
          ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
          ctx.stroke();

          // Node title with improved text rendering
          ctx.fillStyle = '#fff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Truncate title if too long
          const maxWidth = node.size * 1.5;
          let title = node.title;
          while (ctx.measureText(title).width > maxWidth && title.length > 3) {
            title = title.slice(0, -1) + '...';
          }
          
          ctx.fillText(title, node.x, node.y);

          // Special styling for clusters
          if (isCluster) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size + 5, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Show cluster size
            ctx.fillStyle = '#007bff';
            ctx.font = '10px Arial';
            ctx.fillText(`${node.clusterSize}`, node.x, node.y + node.size + 15);
          }

          // Highlight effect for hovered nodes
          if (isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size + GRAPH_CONSTANTS.HOVER_RADIUS, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(0, 123, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });

        ctx.restore();
      } catch (error) {
        console.error('Canvas drawing error:', error);
        throw error; // Let error boundary handle it
      }
    });
  }, [optimizedGraphData, selectedNodeId, hoveredNode, zoom, pan]);

  // Enhanced mouse event handlers with debouncing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x - canvas.width / 2) / zoom;
    const y = (e.clientY - rect.top - pan.y - canvas.height / 2) / zoom;

    // Check if clicking on a node (including clusters)
    const clickedNode = optimizedGraphData.visibleNodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    if (clickedNode) {
      setIsDragging(true);
      setDragNode(clickedNode.id);
      
      // Handle cluster clicks
      if ('isCluster' in clickedNode && clickedNode.isCluster) {
        // For now, just select the representative node
        if (clickedNode.representativeNode) {
          onNodeClick?.(clickedNode.representativeNode.id);
          selectNote(clickedNode.representativeNode.id);
        }
      } else {
        onNodeClick?.(clickedNode.id);
        selectNote(clickedNode.id);
      }
    } else {
      setIsDragging(true);
      setDragNode(null);
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [optimizedGraphData.visibleNodes, pan, zoom, onNodeClick, selectNote]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x - canvas.width / 2) / zoom;
    const y = (e.clientY - rect.top - pan.y - canvas.height / 2) / zoom;

    // Update hover state
    const hoveredNode = optimizedGraphData.visibleNodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });
    
    setHoveredNode(hoveredNode?.id || null);

    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    if (dragNode) {
      // Move specific node with persistent storage
      setNodePositions(prev => ({
        ...prev,
        [dragNode]: {
          x: (prev[dragNode]?.x || 0) + deltaX / zoom,
          y: (prev[dragNode]?.y || 0) + deltaY / zoom
        }
      }));
    } else {
      // Pan the view
      setPan(prev => ({
        x: prev.x + deltaX * GRAPH_CONSTANTS.PAN_SENSITIVITY,
        y: prev.y + deltaY * GRAPH_CONSTANTS.PAN_SENSITIVITY
      }));
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragNode, lastMousePos, zoom, optimizedGraphData.visibleNodes]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNode(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 / GRAPH_CONSTANTS.ZOOM_FACTOR : GRAPH_CONSTANTS.ZOOM_FACTOR;
    setZoom(prev => Math.max(GRAPH_CONSTANTS.ZOOM_MIN, Math.min(GRAPH_CONSTANTS.ZOOM_MAX, prev * delta)));
  }, []);

  // Optimized redraw with useEffect
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Cleanup animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <CanvasErrorBoundary>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Performance Monitor */}
        <GraphPerformanceMonitor
          graphData={optimizedGraphData}
          onPerformanceModeChange={setPerformanceMode}
          currentMode={performanceMode}
        />

        {/* Render Mode Selector */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000
        }}>
          <RenderModeSelector
            currentMode={renderMode}
            onModeChange={handleRenderModeChange}
          />
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            cursor: isDragging ? 'grabbing' : 'grab',
            background: '#f8f9fa'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Search Input */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              width: '200px'
            }}
          />
        </div>

        {/* Zoom Controls */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          zIndex: 1000
        }}>
          <button
            onClick={() => setZoom(prev => Math.min(GRAPH_CONSTANTS.ZOOM_MAX, prev * GRAPH_CONSTANTS.ZOOM_FACTOR))}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(GRAPH_CONSTANTS.ZOOM_MIN, prev / GRAPH_CONSTANTS.ZOOM_FACTOR))}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            −
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            style={{
              width: '32px',
              height: '32px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ⌂
          </button>
        </div>
      </div>
    </CanvasErrorBoundary>
  );
};

export default GraphView; 