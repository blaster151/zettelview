import React, { useState, useEffect, useRef } from 'react';
import { AdvancedGraphService, GraphData, GraphNode, GraphLink, GraphFilter, LayoutAlgorithm, ClusterAlgorithm } from '../services/advancedGraphService';

interface AdvancedGraphViewProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onLinkClick?: (link: GraphLink) => void;
}

export const AdvancedGraphView: React.FC<AdvancedGraphViewProps> = ({
  data,
  onNodeClick,
  onLinkClick
}) => {
  const [currentData, setCurrentData] = useState<GraphData>(data);
  const [selectedLayout, setSelectedLayout] = useState<string>('force-directed');
  const [selectedClustering, setSelectedClustering] = useState<string>('');
  const [filter, setFilter] = useState<GraphFilter>({});
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [selectedLinks, setSelectedLinks] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    setCurrentData(data);
    AdvancedGraphService.setData(data);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    contextRef.current = context;
    renderGraph();
  }, [currentData, selectedLayout, selectedClustering, filter, zoom, pan, selectedNodes, selectedLinks]);

  useEffect(() => {
    if (selectedLayout) {
      applyLayout();
    }
  }, [selectedLayout]);

  useEffect(() => {
    if (selectedClustering) {
      applyClustering();
    }
  }, [selectedClustering]);

  const applyLayout = async () => {
    setIsLoading(true);
    try {
      const result = await AdvancedGraphService.applyLayout(selectedLayout);
      if (result) {
        setCurrentData(result);
      }
    } catch (error) {
      console.error('Failed to apply layout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyClustering = async () => {
    setIsLoading(true);
    try {
      const result = await AdvancedGraphService.applyClustering(selectedClustering);
      if (result) {
        setCurrentData(result);
      }
    } catch (error) {
      console.error('Failed to apply clustering:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const computeAnalytics = async () => {
    setIsLoading(true);
    try {
      const result = await AdvancedGraphService.computeAnalytics();
      setAnalytics(result);
    } catch (error) {
      console.error('Failed to compute analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    const filteredData = AdvancedGraphService.filterData(filter);
    if (filteredData) {
      setCurrentData(filteredData);
    }
  };

  const clearFilter = () => {
    setFilter({});
    setCurrentData(data);
  };

  const renderGraph = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    context.save();
    context.translate(pan.x, pan.y);
    context.scale(zoom, zoom);

    // Render links
    currentData.links.forEach(link => {
      const sourceNode = currentData.nodes.find(n => n.id === link.source);
      const targetNode = currentData.nodes.find(n => n.id === link.target);
      
      if (!sourceNode?.position || !targetNode?.position) return;

      const isSelected = selectedLinks.has(link.id);
      context.strokeStyle = isSelected ? '#ef4444' : (link.color || '#6b7280');
      context.lineWidth = isSelected ? 3 : link.weight;
      context.setLineDash(isSelected ? [5, 5] : []);

      context.beginPath();
      context.moveTo(sourceNode.position.x, sourceNode.position.y);
      context.lineTo(targetNode.position.x, targetNode.position.y);
      context.stroke();
    });

    // Render nodes
    currentData.nodes.forEach(node => {
      if (!node.position) return;

      const isSelected = selectedNodes.has(node.id);
      const size = node.size || 20;
      
      // Node background
      context.fillStyle = isSelected ? '#ef4444' : (node.color || '#3b82f6');
      context.beginPath();
      context.arc(node.position.x, node.position.y, size, 0, 2 * Math.PI);
      context.fill();

      // Node border
      context.strokeStyle = isSelected ? '#dc2626' : '#1e40af';
      context.lineWidth = isSelected ? 3 : 2;
      context.stroke();

      // Node label
      context.fillStyle = '#ffffff';
      context.font = '12px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(node.label, node.position.x, node.position.y);
    });

    context.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / zoom;
    const y = (event.clientY - rect.top - pan.y) / zoom;

    // Check for node clicks
    const clickedNode = currentData.nodes.find(node => {
      if (!node.position) return false;
      const distance = Math.sqrt(
        Math.pow(node.position.x - x, 2) + Math.pow(node.position.y - y, 2)
      );
      return distance <= (node.size || 20);
    });

    if (clickedNode) {
      setSelectedNodes(new Set([clickedNode.id]));
      onNodeClick?.(clickedNode);
      return;
    }

    // Check for link clicks (simplified)
    const clickedLink = currentData.links.find(link => {
      const sourceNode = currentData.nodes.find(n => n.id === link.source);
      const targetNode = currentData.nodes.find(n => n.id === link.target);
      
      if (!sourceNode?.position || !targetNode?.position) return false;

      const distance = distanceToLine(
        x, y,
        sourceNode.position.x, sourceNode.position.y,
        targetNode.position.x, targetNode.position.y
      );
      return distance <= 5;
    });

    if (clickedLink) {
      setSelectedLinks(new Set([clickedLink.id]));
      onLinkClick?.(clickedLink);
      return;
    }

    // Clear selection if clicking empty space
    setSelectedNodes(new Set());
    setSelectedLinks(new Set());
  };

  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta * 0.1)));
  };

  const handlePan = (dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNodes(new Set());
    setSelectedLinks(new Set());
  };

  const algorithms = AdvancedGraphService.getAlgorithms();
  const clusterAlgorithms = AdvancedGraphService.getClusterAlgorithms();

  return (
    <div className="h-full flex flex-col">
      {/* Controls */}
      {showControls && (
        <div className="bg-white border-b p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Advanced Graph View</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowControls(!showControls)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {showControls ? 'Hide' : 'Show'} Controls
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Layout Algorithm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Layout Algorithm
              </label>
              <select
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {algorithms.map(algorithm => (
                  <option key={algorithm.name} value={algorithm.name}>
                    {algorithm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clustering Algorithm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clustering
              </label>
              <select
                value={selectedClustering}
                onChange={(e) => setSelectedClustering(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {clusterAlgorithms.map(algorithm => (
                  <option key={algorithm.name} value={algorithm.name}>
                    {algorithm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Node Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Node Types
              </label>
              <select
                multiple
                value={filter.nodeTypes || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilter(prev => ({ ...prev, nodeTypes: selected.length > 0 ? selected : undefined }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="note">Notes</option>
                <option value="tag">Tags</option>
                <option value="user">Users</option>
                <option value="category">Categories</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Apply Filter
              </button>
              <button
                onClick={clearFilter}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={computeAnalytics}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Computing...' : 'Compute Analytics'}
              </button>
              <button
                onClick={resetView}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Reset View
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleZoom(-1)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                -
              </button>
              <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => handleZoom(1)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div className="bg-white border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Graph Analytics</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.statistics.nodeCount}</div>
              <div className="text-sm text-gray-600">Nodes</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.statistics.linkCount}</div>
              <div className="text-sm text-gray-600">Links</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.statistics.averageDegree.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Avg Degree</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {(analytics.statistics.density * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Density</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Top Hubs</h4>
              <div className="space-y-1">
                {analytics.hubs.slice(0, 5).map(hub => (
                  <div key={hub.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{hub.label}</span>
                    <span className="text-gray-500">{analytics.centrality[hub.id]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Communities</h4>
              <div className="space-y-1">
                {analytics.communities.slice(0, 5).map((community, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    Community {index + 1}: {community.length} nodes
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      <div className="flex-1 relative bg-gray-50">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          className="cursor-pointer border border-gray-300"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Processing...</p>
            </div>
          </div>
        )}

        {/* Selection Info */}
        {(selectedNodes.size > 0 || selectedLinks.size > 0) && (
          <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Selection</h4>
            {selectedNodes.size > 0 && (
              <div className="text-sm text-gray-600 mb-1">
                Nodes: {selectedNodes.size}
              </div>
            )}
            {selectedLinks.size > 0 && (
              <div className="text-sm text-gray-600">
                Links: {selectedLinks.size}
              </div>
            )}
          </div>
        )}

        {/* Graph Info */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
          <div className="text-sm text-gray-600">
            <div>Nodes: {currentData.nodes.length}</div>
            <div>Links: {currentData.links.length}</div>
            <div>Zoom: {Math.round(zoom * 100)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 