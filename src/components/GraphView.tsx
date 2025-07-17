import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNoteStore } from '../store/noteStore';
import { Note } from '../types/domain';
import { GraphNode, GraphLink, GraphRenderMode } from '../types/graph';
import { GraphLinkService } from '../services/graphLinkService';
import RenderModeSelector from './graph/RenderModeSelector';

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

        // Draw links with different styles based on type
        links.forEach(link => {
          const sourceNode = nodes.find(n => n.id === link.source);
          const targetNode = nodes.find(n => n.id === link.target);
          
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

        // Draw nodes
        nodes.forEach(node => {
          const isSelected = node.isSelected;
          const isHovered = node.isHovered;
          const isFiltered = filteredNodes.includes(node);

          // Skip drawing if node is filtered out
          if (!isFiltered) return;

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
  }, [nodes, links, filteredNodes, selectedNodeId, hoveredNode, zoom, pan]);

  // Enhanced mouse event handlers with debouncing
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x - canvas.width / 2) / zoom;
    const y = (e.clientY - rect.top - pan.y - canvas.height / 2) / zoom;

    // Check if clicking on a node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= node.size;
    });

    if (clickedNode) {
      setIsDragging(true);
      setDragNode(clickedNode.id);
      onNodeClick?.(clickedNode.id);
      selectNote(clickedNode.id);
    } else {
      setIsDragging(true);
      setDragNode(null);
    }

    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [nodes, pan, zoom, onNodeClick, selectNote]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x - canvas.width / 2) / zoom;
    const y = (e.clientY - rect.top - pan.y - canvas.height / 2) / zoom;

    // Update hover state
    const hoveredNode = nodes.find(node => {
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
  }, [isDragging, dragNode, lastMousePos, zoom, nodes]);

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

  // Memoized statistics with render mode info
  const stats = useMemo(() => ({
    totalNotes: nodes.length,
    totalLinks: links.length,
    averageConnections: nodes.length > 0 ? (links.length * 2) / nodes.length : 0,
    mostConnected: nodes.reduce((max, node) => {
      const connections = links.filter(l => l.source === node.id || l.target === node.id).length;
      return connections > max.connections ? { node, connections } : max;
    }, { node: null as GraphNode | null, connections: 0 }),
    filteredCount: filteredNodes.length,
    linkTypeBreakdown: links.reduce((acc, link) => {
      acc[link.type] = (acc[link.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [nodes, links, filteredNodes]);

  // Search functionality
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <CanvasErrorBoundary>
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        background: '#f8f9fa'
      }}>
        {/* Graph Statistics */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e1e4e8',
          background: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span><strong>{stats.totalNotes}</strong> notes</span>
            <span><strong>{stats.totalLinks}</strong> connections</span>
            <span>Avg: <strong>{stats.averageConnections.toFixed(1)}</strong> links/note</span>
            {searchQuery && (
              <span>Showing: <strong>{stats.filteredCount}</strong> of {stats.totalNotes}</span>
            )}
          </div>
          {stats.mostConnected.node && (
            <span>
              Most connected: <strong>{stats.mostConnected.node.title}</strong> 
              ({stats.mostConnected.connections} links)
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #e1e4e8',
          background: 'white'
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search nodes by title or tags..."
              style={{
                width: '100%',
                padding: '8px 32px 8px 12px',
                border: '1px solid #e1e4e8',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#666'
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Canvas Container */}
        <div style={{
          flex: 1, 
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
          
          {/* Render Mode Selector */}
          <RenderModeSelector
            currentMode={renderMode}
            onModeChange={handleRenderModeChange}
          />

          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <button
              onClick={() => setZoom(prev => Math.min(GRAPH_CONSTANTS.ZOOM_MAX, prev * GRAPH_CONSTANTS.ZOOM_FACTOR))}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e1e4e8',
                background: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => setZoom(prev => Math.max(GRAPH_CONSTANTS.ZOOM_MIN, prev / GRAPH_CONSTANTS.ZOOM_FACTOR))}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e1e4e8',
                background: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              title="Zoom out"
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
                border: '1px solid #e1e4e8',
                background: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Reset view"
            >
              ⌂
            </button>
            <button
              onClick={() => setShowMinimap(prev => !prev)}
              style={{
                width: '32px',
                height: '32px',
                border: '1px solid #e1e4e8',
                background: showMinimap ? '#007bff' : 'white',
                color: showMinimap ? 'white' : '#333',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              title="Toggle minimap"
            >
              ⊞
            </button>
          </div>

          {/* Minimap */}
          {showMinimap && (
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '150px',
              height: '100px',
              background: 'white',
              border: '1px solid #e1e4e8',
              borderRadius: '6px',
              padding: '8px',
              fontSize: '10px'
            }}>
              <div style={{ marginBottom: '4px', fontWeight: '600' }}>Minimap</div>
              <div style={{
                width: '100%',
                height: '70px',
                background: '#f6f8fa',
                border: '1px solid #e1e4e8',
                borderRadius: '4px',
                position: 'relative'
              }}>
                {/* Simplified minimap representation */}
                {filteredNodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute',
                      left: `${((node.x + 300) / 600) * 100}%`,
                      top: `${((node.y + 300) / 600) * 100}%`,
                      width: '4px',
                      height: '4px',
                      background: node.isSelected ? '#007bff' : node.color,
                      borderRadius: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'white',
            border: '1px solid #e1e4e8',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '12px',
            color: '#586069'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600' }}>Legend</div>
            <div>• Node size = content length + tags</div>
            <div>• Line thickness = connection strength</div>
            <div>• Colors = based on primary tag</div>
            <div>• Hover for details</div>
            <div style={{ marginTop: '8px', borderTop: '1px solid #e1e4e8', paddingTop: '8px' }}>
              <div style={{ fontWeight: '600' }}>Link Types:</div>
              <div style={{ color: '#007bff' }}>• Blue = Internal links</div>
              <div style={{ color: '#28a745' }}>• Green = Tag connections</div>
              <div style={{ color: '#ffc107' }}>• Yellow = Content similarity</div>
              <div style={{ color: '#dc3545' }}>• Red = Hierarchical</div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong>Tip:</strong> Drag nodes to rearrange, scroll to zoom
            </div>
          </div>
        </div>
      </div>
    </CanvasErrorBoundary>
  );
};

export default GraphView; 