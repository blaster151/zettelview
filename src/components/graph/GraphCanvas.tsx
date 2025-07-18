import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink } from '../../types/graph';
import { ThemeColors } from '../../types/theme';
import { useState } from 'react';

interface GraphCanvasProps {
  nodes: GraphNode[];
  links: GraphLink[];
  zoom: number;
  pan: { x: number; y: number };
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onCanvasClick?: () => void;
  colors: ThemeColors;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  links,
  zoom,
  pan,
  onNodeClick,
  onNodeHover,
  onCanvasClick,
  colors
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Memoize D3 data structures
  const d3Nodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      // Initialize with current position or random position
      x: node.x || Math.random() * 800,
      y: node.y || Math.random() * 600,
      fx: null as number | null,
      fy: null as number | null
    }));
  }, [nodes]);

  const d3Links = useMemo(() => {
    return links.map(link => ({
      ...link,
      source: link.source,
      target: link.target
    }));
  }, [links]);

  // Create force simulation
  const createSimulation = useCallback(() => {
    if (!svgRef.current) return;

    // Clear existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create new simulation
    simulationRef.current = d3.forceSimulation<GraphNode>(d3Nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(d3Links)
        .id(d => d.id)
        .distance(d => {
          // Adjust link distance based on link type and strength
          const baseDistance = 100;
          const strength = d.strength || 1;
          return baseDistance / strength;
        })
        .strength(d => {
          // Adjust link strength based on type
          const baseStrength = 0.3;
          const strength = d.strength || 1;
          return baseStrength * strength;
        })
      )
      .force('charge', d3.forceManyBody()
        .strength(d => {
          // Repulsive force based on node size
          const baseStrength = -300;
          const sizeFactor = d.size / 30;
          return baseStrength * sizeFactor;
        })
        .distanceMax(300)
      )
      .force('center', d3.forceCenter(400, 300))
      .force('collision', d3.forceCollide()
        .radius(d => d.size + 10)
        .strength(0.7)
      )
      .force('x', d3.forceX(400).strength(0.1))
      .force('y', d3.forceY(300).strength(0.1))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    return simulationRef.current;
  }, [d3Nodes, d3Links]);

  // Handle zoom and pan
  const updateTransform = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    
    g.attr('transform', `translate(${pan.x}, ${pan.y}) scale(${zoom})`);
  }, [zoom, pan]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const scale = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoom * scale));

    // Calculate new pan to zoom towards mouse position
    const newPanX = mouseX - (mouseX - pan.x) * scale;
    const newPanY = mouseY - (mouseY - pan.y) * scale;

    // Update zoom and pan (these would be passed as props from parent)
    // For now, we'll just update the transform
    const g = d3.select(svg).select('g');
    g.attr('transform', `translate(${newPanX}, ${newPanY}) scale(${newZoom})`);
  }, [zoom, pan]);

  // Handle mouse drag for panning
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
      if (svgRef.current) {
        svgRef.current.style.cursor = 'grabbing';
      }
    }
  }, [pan]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (isPanning) {
      const newPanX = event.clientX - panStart.x;
      const newPanY = event.clientY - panStart.y;
      
      const g = d3.select(svgRef.current).select('g');
      g.attr('transform', `translate(${newPanX}, ${newPanY}) scale(${zoom})`);
    }
  }, [isPanning, panStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (svgRef.current) {
      svgRef.current.style.cursor = 'grab';
    }
  }, []);

  // Render graph
  const renderGraph = useCallback(() => {
    if (!svgRef.current || !simulationRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');

    // Clear existing elements
    g.selectAll('*').remove();

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line')
      .attr('stroke', d => {
        // Color based on link type
        switch (d.type) {
          case 'internal':
            return colors.primary;
          case 'tag':
            return colors.secondary;
          case 'similarity':
            return colors.accent;
          case 'hierarchical':
            return colors.warning;
          default:
            return colors.border;
        }
      })
      .attr('stroke-width', d => {
        // Width based on link strength
        const baseWidth = 1;
        const strength = d.strength || 1;
        return baseWidth * strength;
      })
      .attr('stroke-opacity', d => {
        // Opacity based on link strength
        const baseOpacity = 0.6;
        const strength = d.strength || 1;
        return Math.min(1, baseOpacity * strength);
      });

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d.id);
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d.id);
        // Highlight connected links
        link.style('stroke-opacity', l => 
          l.source === d.id || l.target === d.id ? 1 : 0.1
        );
      })
      .on('mouseleave', (event, d) => {
        onNodeHover?.(null);
        // Reset link opacity
        link.style('stroke-opacity', d => {
          const baseOpacity = 0.6;
          const strength = d.strength || 1;
          return Math.min(1, baseOpacity * strength);
        });
      });

    // Add node circles
    node.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => {
        if (d.isSelected) {
          return colors.primary;
        } else if (d.isHovered) {
          return colors.accent;
        } else {
          return d.color;
        }
      })
      .attr('stroke', d => {
        if (d.isSelected) {
          return colors.primary;
        } else if (d.isHovered) {
          return colors.accent;
        } else {
          return colors.border;
        }
      })
      .attr('stroke-width', d => {
        if (d.isSelected || d.isHovered) {
          return 3;
        } else {
          return 1;
        }
      })
      .attr('stroke-opacity', 0.8);

    // Add node labels
    const label = node.append('text')
      .text(d => d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', d => Math.max(10, Math.min(14, d.size / 3)))
      .attr('font-weight', d => d.isSelected ? 'bold' : 'normal')
      .attr('fill', colors.text)
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Add tag indicators
    node.append('circle')
      .attr('r', 3)
      .attr('cx', d => d.size + 5)
      .attr('cy', -d.size - 5)
      .attr('fill', d => d.tags.length > 0 ? colors.secondary : 'transparent')
      .style('pointer-events', 'none');

    // Update positions on simulation tick
    simulationRef.current.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      node.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Add drag behavior
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as any);

  }, [d3Nodes, d3Links, colors, onNodeClick, onNodeHover]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === svgRef.current) {
      onCanvasClick?.();
    }
  }, [onCanvasClick]);

  // Initialize and update simulation
  useEffect(() => {
    const simulation = createSimulation();
    if (simulation) {
      renderGraph();
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [createSimulation, renderGraph]);

  // Update transform when zoom/pan changes
  useEffect(() => {
    updateTransform();
  }, [updateTransform]);

  // Update simulation when data changes
  useEffect(() => {
    if (simulationRef.current) {
      simulationRef.current.nodes(d3Nodes);
      simulationRef.current.force<d3.ForceLink<GraphNode, GraphLink>>('link')?.links(d3Links);
      simulationRef.current.alpha(0.3).restart();
    }
  }, [d3Nodes, d3Links]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ 
          background: colors.background,
          cursor: 'grab'
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* Arrow marker for directed links */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={colors.border}
            />
          </marker>
          
          {/* Glow filter for selected nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g>
          {/* Graph elements will be rendered here */}
        </g>
      </svg>
    </div>
  );
};

export default GraphCanvas; 