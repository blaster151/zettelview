import React, { useState, useEffect } from 'react';
import { AdvancedGraphView } from './AdvancedGraphView';
import { GraphData, GraphNode, GraphLink } from '../services/advancedGraphService';

// Sample graph data for demo
const createSampleGraphData = (): GraphData => {
  const nodes: GraphNode[] = [
    // Notes
    {
      id: 'note1',
      label: 'Getting Started',
      type: 'note',
      data: { content: 'Introduction to the system' },
      color: '#3B82F6',
      size: 25,
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        tags: ['guide', 'beginner'],
        connections: 5,
        importance: 0.9
      }
    },
    {
      id: 'note2',
      label: 'Advanced Features',
      type: 'note',
      data: { content: 'Deep dive into advanced functionality' },
      color: '#10B981',
      size: 30,
      metadata: {
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
        tags: ['advanced', 'tutorial'],
        connections: 8,
        importance: 0.8
      }
    },
    {
      id: 'note3',
      label: 'API Reference',
      type: 'note',
      data: { content: 'Complete API documentation' },
      color: '#F59E0B',
      size: 28,
      metadata: {
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-18'),
        tags: ['api', 'reference'],
        connections: 12,
        importance: 0.7
      }
    },
    {
      id: 'note4',
      label: 'Best Practices',
      type: 'note',
      data: { content: 'Recommended patterns and practices' },
      color: '#EF4444',
      size: 22,
      metadata: {
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-22'),
        tags: ['best-practices', 'guide'],
        connections: 6,
        importance: 0.6
      }
    },
    {
      id: 'note5',
      label: 'Troubleshooting',
      type: 'note',
      data: { content: 'Common issues and solutions' },
      color: '#8B5CF6',
      size: 20,
      metadata: {
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-16'),
        tags: ['troubleshooting', 'help'],
        connections: 4,
        importance: 0.5
      }
    },
    {
      id: 'note6',
      label: 'Performance Tips',
      type: 'note',
      data: { content: 'Optimization strategies' },
      color: '#06B6D4',
      size: 18,
      metadata: {
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-25'),
        tags: ['performance', 'optimization'],
        connections: 3,
        importance: 0.4
      }
    },

    // Tags
    {
      id: 'tag1',
      label: 'Guide',
      type: 'tag',
      data: { count: 3 },
      color: '#84CC16',
      size: 15,
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-25'),
        tags: ['meta'],
        connections: 3,
        importance: 0.3
      }
    },
    {
      id: 'tag2',
      label: 'API',
      type: 'tag',
      data: { count: 2 },
      color: '#F97316',
      size: 12,
      metadata: {
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-18'),
        tags: ['meta'],
        connections: 2,
        importance: 0.2
      }
    },
    {
      id: 'tag3',
      label: 'Advanced',
      type: 'tag',
      data: { count: 1 },
      color: '#EC4899',
      size: 10,
      metadata: {
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
        tags: ['meta'],
        connections: 1,
        importance: 0.1
      }
    },

    // Users
    {
      id: 'user1',
      label: 'Alice',
      type: 'user',
      data: { role: 'admin' },
      color: '#6366F1',
      size: 20,
      metadata: {
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-25'),
        tags: ['user'],
        connections: 4,
        importance: 0.8
      }
    },
    {
      id: 'user2',
      label: 'Bob',
      type: 'user',
      data: { role: 'editor' },
      color: '#14B8A6',
      size: 18,
      metadata: {
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-24'),
        tags: ['user'],
        connections: 3,
        importance: 0.6
      }
    },
    {
      id: 'user3',
      label: 'Carol',
      type: 'user',
      data: { role: 'viewer' },
      color: '#F43F5E',
      size: 16,
      metadata: {
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-23'),
        tags: ['user'],
        connections: 2,
        importance: 0.4
      }
    }
  ];

  const links: GraphLink[] = [
    // Note references
    {
      id: 'link1',
      source: 'note1',
      target: 'note2',
      type: 'reference',
      weight: 3,
      color: '#3B82F6',
      metadata: {
        createdAt: new Date('2024-01-15'),
        strength: 0.8,
        bidirectional: true
      }
    },
    {
      id: 'link2',
      source: 'note2',
      target: 'note3',
      type: 'reference',
      weight: 2,
      color: '#10B981',
      metadata: {
        createdAt: new Date('2024-01-20'),
        strength: 0.6,
        bidirectional: false
      }
    },
    {
      id: 'link3',
      source: 'note1',
      target: 'note4',
      type: 'reference',
      weight: 2,
      color: '#F59E0B',
      metadata: {
        createdAt: new Date('2024-01-15'),
        strength: 0.7,
        bidirectional: true
      }
    },
    {
      id: 'link4',
      source: 'note3',
      target: 'note5',
      type: 'reference',
      weight: 1,
      color: '#EF4444',
      metadata: {
        createdAt: new Date('2024-01-18'),
        strength: 0.5,
        bidirectional: false
      }
    },
    {
      id: 'link5',
      source: 'note2',
      target: 'note6',
      type: 'reference',
      weight: 2,
      color: '#8B5CF6',
      metadata: {
        createdAt: new Date('2024-01-20'),
        strength: 0.6,
        bidirectional: true
      }
    },

    // Tag connections
    {
      id: 'link6',
      source: 'note1',
      target: 'tag1',
      type: 'tag',
      weight: 1,
      color: '#84CC16',
      metadata: {
        createdAt: new Date('2024-01-01'),
        strength: 0.9,
        bidirectional: false
      }
    },
    {
      id: 'link7',
      source: 'note2',
      target: 'tag1',
      type: 'tag',
      weight: 1,
      color: '#84CC16',
      metadata: {
        createdAt: new Date('2024-01-10'),
        strength: 0.8,
        bidirectional: false
      }
    },
    {
      id: 'link8',
      source: 'note4',
      target: 'tag1',
      type: 'tag',
      weight: 1,
      color: '#84CC16',
      metadata: {
        createdAt: new Date('2024-01-12'),
        strength: 0.7,
        bidirectional: false
      }
    },
    {
      id: 'link9',
      source: 'note3',
      target: 'tag2',
      type: 'tag',
      weight: 1,
      color: '#F97316',
      metadata: {
        createdAt: new Date('2024-01-05'),
        strength: 0.9,
        bidirectional: false
      }
    },
    {
      id: 'link10',
      source: 'note2',
      target: 'tag3',
      type: 'tag',
      weight: 1,
      color: '#EC4899',
      metadata: {
        createdAt: new Date('2024-01-10'),
        strength: 0.8,
        bidirectional: false
      }
    },

    // User collaborations
    {
      id: 'link11',
      source: 'user1',
      target: 'note1',
      type: 'collaboration',
      weight: 2,
      color: '#6366F1',
      metadata: {
        createdAt: new Date('2024-01-01'),
        strength: 0.9,
        bidirectional: false
      }
    },
    {
      id: 'link12',
      source: 'user1',
      target: 'note2',
      type: 'collaboration',
      weight: 2,
      color: '#6366F1',
      metadata: {
        createdAt: new Date('2024-01-10'),
        strength: 0.8,
        bidirectional: false
      }
    },
    {
      id: 'link13',
      source: 'user2',
      target: 'note3',
      type: 'collaboration',
      weight: 2,
      color: '#14B8A6',
      metadata: {
        createdAt: new Date('2024-01-05'),
        strength: 0.7,
        bidirectional: false
      }
    },
    {
      id: 'link14',
      source: 'user2',
      target: 'note4',
      type: 'collaboration',
      weight: 1,
      color: '#14B8A6',
      metadata: {
        createdAt: new Date('2024-01-12'),
        strength: 0.6,
        bidirectional: false
      }
    },
    {
      id: 'link15',
      source: 'user3',
      target: 'note5',
      type: 'collaboration',
      weight: 1,
      color: '#F43F5E',
      metadata: {
        createdAt: new Date('2024-01-08'),
        strength: 0.5,
        bidirectional: false
      }
    }
  ];

  return {
    nodes,
    links,
    metadata: {
      totalNodes: nodes.length,
      totalLinks: links.length,
      clusters: 3,
      density: 0.15,
      averageDegree: 2.5
    }
  };
};

export const AdvancedGraphDemo: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>(createSampleGraphData());
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<GraphLink | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'features' | 'examples'>('graph');

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    setSelectedLink(null);
  };

  const handleLinkClick = (link: GraphLink) => {
    setSelectedLink(link);
    setSelectedNode(null);
  };

  const regenerateData = () => {
    setGraphData(createSampleGraphData());
    setSelectedNode(null);
    setSelectedLink(null);
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-100 text-blue-800';
      case 'tag': return 'bg-green-100 text-green-800';
      case 'user': return 'bg-purple-100 text-purple-800';
      case 'category': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLinkTypeColor = (type: string) => {
    switch (type) {
      case 'reference': return 'bg-blue-100 text-blue-800';
      case 'tag': return 'bg-green-100 text-green-800';
      case 'collaboration': return 'bg-purple-100 text-purple-800';
      case 'hierarchy': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced Graph View Demo</h1>
        <p className="text-lg text-gray-600">
          Explore advanced graph visualization with multiple layouts, clustering, and analytics
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('graph')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'graph'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Interactive Graph
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'examples'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Examples
          </button>
        </nav>
      </div>

      {activeTab === 'graph' && (
        <div className="space-y-6">
          {/* Graph View */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Interactive Graph</h2>
                <button
                  onClick={regenerateData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Regenerate Data
                </button>
              </div>
            </div>
            <div className="h-96">
              <AdvancedGraphView
                data={graphData}
                onNodeClick={handleNodeClick}
                onLinkClick={handleLinkClick}
              />
            </div>
          </div>

          {/* Selection Details */}
          {(selectedNode || selectedLink) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Selection Details</h3>
              
              {selectedNode && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: selectedNode.color || '#3B82F6' }}
                    >
                      {selectedNode.label.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedNode.label}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNodeTypeColor(selectedNode.type)}`}>
                        {selectedNode.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Properties</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Size: {selectedNode.size}</div>
                        <div>Color: {selectedNode.color}</div>
                        {selectedNode.cluster && <div>Cluster: {selectedNode.cluster}</div>}
                      </div>
                    </div>
                    
                    {selectedNode.metadata && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Metadata</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Connections: {selectedNode.metadata.connections}</div>
                          <div>Importance: {selectedNode.metadata.importance}</div>
                          <div>Tags: {selectedNode.metadata.tags.join(', ')}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLink && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedLink.color || '#6B7280' }}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {selectedLink.source} → {selectedLink.target}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLinkTypeColor(selectedLink.type)}`}>
                        {selectedLink.type}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Properties</h5>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>Weight: {selectedLink.weight}</div>
                        <div>Color: {selectedLink.color}</div>
                      </div>
                    </div>
                    
                    {selectedLink.metadata && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Metadata</h5>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Strength: {selectedLink.metadata.strength}</div>
                          <div>Bidirectional: {selectedLink.metadata.bidirectional ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Layout Algorithms */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Layout Algorithms</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Force-Directed</h4>
                    <p className="text-sm text-gray-600">
                      Physics-based layout using attractive and repulsive forces
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Circular</h4>
                    <p className="text-sm text-gray-600">
                      Arranges nodes in a circle for equal prominence
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Hierarchical</h4>
                    <p className="text-sm text-gray-600">
                      Tree-like structure showing relationships
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Grid</h4>
                    <p className="text-sm text-gray-600">
                      Organized grid pattern for structured data
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Radial</h4>
                    <p className="text-sm text-gray-600">
                      Concentric circles with central focus
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clustering Algorithms */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clustering Algorithms</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Louvain</h4>
                    <p className="text-sm text-gray-600">
                      Community detection using modularity optimization
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">K-Means</h4>
                    <p className="text-sm text-gray-600">
                      Position-based clustering for spatial organization
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Spectral</h4>
                    <p className="text-sm text-gray-600">
                      Graph Laplacian-based clustering
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Features */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics & Insights</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium text-gray-900 mb-2">Centrality Analysis</h4>
                <p className="text-sm text-gray-600">
                  Identify important nodes and hubs in the network
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🔗</div>
                <h4 className="font-medium text-gray-900 mb-2">Community Detection</h4>
                <p className="text-sm text-gray-600">
                  Find natural clusters and communities
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">📈</div>
                <h4 className="font-medium text-gray-900 mb-2">Network Statistics</h4>
                <p className="text-sm text-gray-600">
                  Density, diameter, and connectivity metrics
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Features */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Navigation</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Zoom in/out with mouse wheel or buttons</li>
                  <li>• Pan by dragging the canvas</li>
                  <li>• Click nodes and links for details</li>
                  <li>• Reset view to original position</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Filtering</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Filter by node types (notes, tags, users)</li>
                  <li>• Filter by link types (references, tags, collaboration)</li>
                  <li>• Filter by connection count</li>
                  <li>• Filter by date ranges and tags</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Use Cases */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Use Cases</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">Knowledge Management</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Visualize relationships between notes, tags, and concepts
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-900">Collaboration Networks</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Track user interactions and collaboration patterns
                  </p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-900">Content Analysis</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Analyze content relationships and topic clusters
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-900">Research Mapping</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Map research topics and their connections
                  </p>
                </div>
              </div>
            </div>

            {/* Sample Data */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Data Structure</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Node Types</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Notes (6 nodes)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Tags (3 nodes)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Users (3 nodes)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Link Types</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>References (5 links)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Tags (4 links)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Collaboration (5 links)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Graph Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{graphData.nodes.length}</div>
                <div className="text-sm text-gray-600">Total Nodes</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{graphData.links.length}</div>
                <div className="text-sm text-gray-600">Total Links</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {graphData.metadata?.clusters || 0}
                </div>
                <div className="text-sm text-gray-600">Clusters</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {(graphData.metadata?.density * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Density</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 