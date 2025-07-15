import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNoteStore } from '../store/noteStore';

interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  size: number;
  color: string;
  tags: string[];
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
}

interface GraphViewProps {
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string;
}

const GraphView: React.FC<GraphViewProps> = ({ onNodeClick, selectedNodeId }) => {
  const { notes, selectNote } = useNoteStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Generate graph data from notes
  const { nodes, links } = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const graphLinks: GraphLink[] = [];
    const linkCounts: Record<string, number> = {};

    // Create nodes from notes
    notes.forEach((note, index) => {
      const angle = (index / notes.length) * 2 * Math.PI;
      const radius = 200;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      // Calculate node size based on content length and tag count
      const contentLength = note.body.length;
      const tagCount = note.tags.length;
      const size = Math.max(20, Math.min(60, 30 + (contentLength / 1000) * 10 + tagCount * 5));

      // Generate color based on tags
      const color = note.tags.length > 0 
        ? `hsl(${(note.tags[0].length * 50) % 360}, 70%, 60%)`
        : '#6c757d';

      graphNodes.push({
        id: note.id,
        title: note.title,
        x,
        y,
        size,
        color,
        tags: note.tags
      });
    });

    // Create links based on internal references
    const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;
    
    notes.forEach(note => {
      let match;
      while ((match = internalLinkPattern.exec(note.body)) !== null) {
        const linkTitle = match[1].trim();
        const targetNote = notes.find(n => 
          n.title.toLowerCase() === linkTitle.toLowerCase()
        );
        
        if (targetNote && targetNote.id !== note.id) {
          const linkKey = `${note.id}-${targetNote.id}`;
          const reverseKey = `${targetNote.id}-${note.id}`;
          
          if (!linkCounts[linkKey] && !linkCounts[reverseKey]) {
            graphLinks.push({
              source: note.id,
              target: targetNote.id,
              strength: 1
            });
            linkCounts[linkKey] = 1;
          } else {
            // Strengthen existing link
            const existingLink = graphLinks.find(l => 
              (l.source === note.id && l.target === targetNote.id) ||
              (l.source === targetNote.id && l.target === note.id)
            );
            if (existingLink) {
              existingLink.strength += 0.5;
            }
          }
        }
      }
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [notes]);

  // Canvas drawing functions
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x + canvas.width / 2, pan.y + canvas.height / 2);
    ctx.scale(zoom, zoom);

    // Draw links
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = `rgba(100, 100, 100, ${0.3 + link.strength * 0.2})`;
        ctx.lineWidth = 1 + link.strength;
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isSelected = node.id === selectedNodeId;
      const isHovered = dragNode === node.id;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#007bff' : isHovered ? '#0056b3' : node.color;
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = isSelected ? '#0056b3' : '#fff';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node title
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
    });

    ctx.restore();
  }, [nodes, links, selectedNodeId, dragNode, zoom, pan]);

  // Mouse event handlers
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
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    if (dragNode) {
      // Move specific node
      const nodeIndex = nodes.findIndex(n => n.id === dragNode);
      if (nodeIndex !== -1) {
        const newNodes = [...nodes];
        newNodes[nodeIndex] = {
          ...newNodes[nodeIndex],
          x: newNodes[nodeIndex].x + deltaX / zoom,
          y: newNodes[nodeIndex].y + deltaY / zoom
        };
        // Note: In a real implementation, you'd update the store
      }
    } else {
      // Pan the view
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
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
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  }, []);

  // Redraw on changes
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Statistics
  const stats = useMemo(() => ({
    totalNotes: nodes.length,
    totalLinks: links.length,
    averageConnections: nodes.length > 0 ? (links.length * 2) / nodes.length : 0,
    mostConnected: nodes.reduce((max, node) => {
      const connections = links.filter(l => l.source === node.id || l.target === node.id).length;
      return connections > max.connections ? { node, connections } : max;
    }, { node: null as GraphNode | null, connections: 0 })
  }), [nodes, links]);

  return (
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
        </div>
        {stats.mostConnected.node && (
          <span>
            Most connected: <strong>{stats.mostConnected.node.title}</strong> 
            ({stats.mostConnected.connections} links)
          </span>
        )}
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
            onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
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
            onClick={() => setZoom(prev => Math.max(0.1, prev * 0.8))}
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
        </div>

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
          <div style={{ marginTop: '8px' }}>
            <strong>Tip:</strong> Drag nodes to rearrange, scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView; 