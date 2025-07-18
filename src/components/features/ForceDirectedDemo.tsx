import React, { useState, useMemo } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { GraphNode, GraphLink } from '../../types/graph';
import GraphCanvas from '../graph/GraphCanvas';
import GraphControls from '../graph/GraphControls';
import GraphLegend from '../graph/GraphLegend';

const ForceDirectedDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Sample data for demonstration
  const demoNodes: GraphNode[] = useMemo(() => [
    {
      id: 'welcome',
      title: 'Welcome',
      x: 0,
      y: 0,
      size: 40,
      color: '#007bff',
      tags: ['getting-started'],
      isSelected: selectedNodeId === 'welcome',
      isHovered: false
    },
    {
      id: 'markdown',
      title: 'Markdown Guide',
      x: 0,
      y: 0,
      size: 35,
      color: '#28a745',
      tags: ['guide', 'markdown'],
      isSelected: selectedNodeId === 'markdown',
      isHovered: false
    },
    {
      id: 'links',
      title: 'Internal Links',
      x: 0,
      y: 0,
      size: 30,
      color: '#17a2b8',
      tags: ['links', 'connectivity'],
      isSelected: selectedNodeId === 'links',
      isHovered: false
    },
    {
      id: 'tags',
      title: 'Tagging System',
      x: 0,
      y: 0,
      size: 30,
      color: '#ffc107',
      tags: ['tags', 'organization'],
      isSelected: selectedNodeId === 'tags',
      isHovered: false
    },
    {
      id: 'search',
      title: 'Search & Filter',
      x: 0,
      y: 0,
      size: 35,
      color: '#6f42c1',
      tags: ['search', 'filter'],
      isSelected: selectedNodeId === 'search',
      isHovered: false
    },
    {
      id: 'graph',
      title: 'Graph View',
      x: 0,
      y: 0,
      size: 40,
      color: '#e83e8c',
      tags: ['visualization', 'graph'],
      isSelected: selectedNodeId === 'graph',
      isHovered: false
    },
    {
      id: 'ai',
      title: 'AI Assistant',
      x: 0,
      y: 0,
      size: 35,
      color: '#fd7e14',
      tags: ['ai', 'assistant'],
      isSelected: selectedNodeId === 'ai',
      isHovered: false
    },
    {
      id: 'collaboration',
      title: 'Collaboration',
      x: 0,
      y: 0,
      size: 30,
      color: '#20c997',
      tags: ['collaboration', 'sharing'],
      isSelected: selectedNodeId === 'collaboration',
      isHovered: false
    }
  ], [selectedNodeId]);

  const demoLinks: GraphLink[] = useMemo(() => [
    // Welcome connects to main features
    { source: 'welcome', target: 'markdown', type: 'internal', strength: 1 },
    { source: 'welcome', target: 'links', type: 'internal', strength: 1 },
    { source: 'welcome', target: 'tags', type: 'internal', strength: 1 },
    
    // Markdown connects to related features
    { source: 'markdown', target: 'links', type: 'internal', strength: 0.8 },
    { source: 'markdown', target: 'tags', type: 'internal', strength: 0.6 },
    
    // Links connect to search and graph
    { source: 'links', target: 'search', type: 'internal', strength: 0.8 },
    { source: 'links', target: 'graph', type: 'internal', strength: 1 },
    
    // Tags connect to search and organization
    { source: 'tags', target: 'search', type: 'internal', strength: 0.8 },
    { source: 'tags', target: 'collaboration', type: 'internal', strength: 0.6 },
    
    // Search connects to graph and AI
    { source: 'search', target: 'graph', type: 'internal', strength: 0.8 },
    { source: 'search', target: 'ai', type: 'internal', strength: 0.7 },
    
    // Graph connects to AI
    { source: 'graph', target: 'ai', type: 'internal', strength: 0.6 },
    
    // AI connects to collaboration
    { source: 'ai', target: 'collaboration', type: 'internal', strength: 0.7 },
    
    // Tag-based connections
    { source: 'markdown', target: 'search', type: 'tag', strength: 0.5 },
    { source: 'links', target: 'collaboration', type: 'tag', strength: 0.4 },
    { source: 'graph', target: 'collaboration', type: 'tag', strength: 0.5 }
  ], []);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    // Update hover state in a real implementation
    console.log('Hovered node:', nodeId);
  };

  const handleCanvasClick = () => {
    setSelectedNodeId(null);
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: colors.background
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface
      }}>
        <h2 style={{
          margin: 0,
          color: colors.text,
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          🎯 Force-Directed Graph Demo
        </h2>
        <p style={{
          margin: '8px 0 0 0',
          color: colors.textSecondary,
          fontSize: '14px'
        }}>
          Interactive force-directed layout powered by D3.js. Drag nodes, zoom with mouse wheel, and explore the connections.
        </p>
      </div>

      {/* Main graph area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <GraphCanvas
          nodes={demoNodes}
          links={demoLinks}
          zoom={zoom}
          pan={pan}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onCanvasClick={handleCanvasClick}
          colors={colors}
        />

        {/* Controls overlay */}
        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
          <GraphControls
            zoom={zoom}
            pan={pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            colors={colors}
          />
        </div>

        {/* Info panel */}
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '12px',
          maxWidth: '300px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 'bold',
            color: colors.text
          }}>
            Interactive Features
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '16px',
            fontSize: '12px',
            color: colors.textSecondary
          }}>
            <li>🖱️ <strong>Drag nodes</strong> to reposition them</li>
            <li>🔍 <strong>Scroll wheel</strong> to zoom in/out</li>
            <li>🖱️ <strong>Click and drag</strong> to pan the view</li>
            <li>👆 <strong>Click nodes</strong> to select them</li>
            <li>🖱️ <strong>Hover nodes</strong> to highlight connections</li>
          </ul>
          
          {selectedNodeId && (
            <div style={{
              marginTop: '12px',
              padding: '8px',
              background: colors.primary,
              color: 'white',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <strong>Selected:</strong> {demoNodes.find(n => n.id === selectedNodeId)?.title}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '12px',
        borderTop: `1px solid ${colors.border}`,
        background: colors.surface
      }}>
        <GraphLegend
          renderMode="internal-links"
          nodeCount={demoNodes.length}
          linkCount={demoLinks.length}
          colors={colors}
        />
      </div>
    </div>
  );
};

export default ForceDirectedDemo; 