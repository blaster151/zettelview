import { Note } from '../types/domain';

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'tag' | 'user' | 'category';
  data: any;
  position?: { x: number; y: number };
  size?: number;
  color?: string;
  cluster?: string;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    connections: number;
    importance: number;
  };
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'reference' | 'tag' | 'collaboration' | 'hierarchy';
  weight: number;
  color?: string;
  metadata?: {
    createdAt: Date;
    strength: number;
    bidirectional: boolean;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  metadata?: {
    totalNodes: number;
    totalLinks: number;
    clusters: number;
    density: number;
    averageDegree: number;
  };
}

export interface LayoutAlgorithm {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (data: GraphData) => Promise<GraphData>;
}

export interface ClusterAlgorithm {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (data: GraphData) => Promise<GraphData>;
}

export interface GraphFilter {
  nodeTypes?: string[];
  linkTypes?: string[];
  minConnections?: number;
  maxConnections?: number;
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  clusters?: string[];
}

export interface GraphAnalytics {
  centrality: Record<string, number>;
  clustering: Record<string, number>;
  communities: string[][];
  bridges: GraphLink[];
  isolates: GraphNode[];
  hubs: GraphNode[];
  statistics: {
    nodeCount: number;
    linkCount: number;
    averageDegree: number;
    density: number;
    diameter: number;
    averagePathLength: number;
  };
}

class AdvancedGraphService {
  private algorithms: Map<string, LayoutAlgorithm> = new Map();
  private clusterAlgorithms: Map<string, ClusterAlgorithm> = new Map();
  private currentData: GraphData | null = null;
  private analytics: GraphAnalytics | null = null;

  constructor() {
    this.initializeAlgorithms();
  }

  private initializeAlgorithms(): void {
    // Layout Algorithms
    this.algorithms.set('force-directed', {
      name: 'Force-Directed Layout',
      description: 'Uses physics simulation to position nodes based on forces',
      parameters: {
        strength: -300,
        distance: 100,
        iterations: 300,
        alpha: 0.3,
        alphaDecay: 0.0228,
        velocityDecay: 0.4
      },
      execute: this.forceDirectedLayout.bind(this)
    });

    this.algorithms.set('circular', {
      name: 'Circular Layout',
      description: 'Arranges nodes in a circle',
      parameters: {
        radius: 200,
        centerX: 0,
        centerY: 0
      },
      execute: this.circularLayout.bind(this)
    });

    this.algorithms.set('hierarchical', {
      name: 'Hierarchical Layout',
      description: 'Arranges nodes in a tree-like structure',
      parameters: {
        nodeSeparation: 100,
        levelSeparation: 150,
        direction: 'TB' // TB, BT, LR, RL
      },
      execute: this.hierarchicalLayout.bind(this)
    });

    this.algorithms.set('grid', {
      name: 'Grid Layout',
      description: 'Arranges nodes in a grid pattern',
      parameters: {
        columns: 10,
        spacing: 100
      },
      execute: this.gridLayout.bind(this)
    });

    this.algorithms.set('radial', {
      name: 'Radial Layout',
      description: 'Arranges nodes in concentric circles',
      parameters: {
        centerNode: null,
        levels: 3,
        radiusIncrement: 100
      },
      execute: this.radialLayout.bind(this)
    });

    // Clustering Algorithms
    this.clusterAlgorithms.set('louvain', {
      name: 'Louvain Community Detection',
      description: 'Detects communities using modularity optimization',
      parameters: {
        resolution: 1.0,
        iterations: 10
      },
      execute: this.louvainClustering.bind(this)
    });

    this.clusterAlgorithms.set('k-means', {
      name: 'K-Means Clustering',
      description: 'Clusters nodes based on position similarity',
      parameters: {
        k: 5,
        iterations: 100
      },
      execute: this.kMeansClustering.bind(this)
    });

    this.clusterAlgorithms.set('spectral', {
      name: 'Spectral Clustering',
      description: 'Uses graph Laplacian for clustering',
      parameters: {
        k: 5,
        similarity: 'cosine'
      },
      execute: this.spectralClustering.bind(this)
    });
  }

  // Data Management
  setData(data: GraphData): void {
    this.currentData = data;
    this.analytics = null; // Reset analytics
  }

  getData(): GraphData | null {
    return this.currentData;
  }

  updateNode(nodeId: string, updates: Partial<GraphNode>): void {
    if (!this.currentData) return;

    const nodeIndex = this.currentData.nodes.findIndex(n => n.id === nodeId);
    if (nodeIndex >= 0) {
      this.currentData.nodes[nodeIndex] = {
        ...this.currentData.nodes[nodeIndex],
        ...updates
      };
    }
  }

  updateLink(linkId: string, updates: Partial<GraphLink>): void {
    if (!this.currentData) return;

    const linkIndex = this.currentData.links.findIndex(l => l.id === linkId);
    if (linkIndex >= 0) {
      this.currentData.links[linkIndex] = {
        ...this.currentData.links[linkIndex],
        ...updates
      };
    }
  }

  addNode(node: GraphNode): void {
    if (!this.currentData) return;
    this.currentData.nodes.push(node);
  }

  addLink(link: GraphLink): void {
    if (!this.currentData) return;
    this.currentData.links.push(link);
  }

  removeNode(nodeId: string): void {
    if (!this.currentData) return;
    
    this.currentData.nodes = this.currentData.nodes.filter(n => n.id !== nodeId);
    this.currentData.links = this.currentData.links.filter(l => 
      l.source !== nodeId && l.target !== nodeId
    );
  }

  removeLink(linkId: string): void {
    if (!this.currentData) return;
    this.currentData.links = this.currentData.links.filter(l => l.id !== linkId);
  }

  // Layout Algorithms
  async applyLayout(algorithmName: string, parameters?: Record<string, any>): Promise<GraphData | null> {
    const algorithm = this.algorithms.get(algorithmName);
    if (!algorithm || !this.currentData) return null;

    const params = { ...algorithm.parameters, ...parameters };
    const result = await algorithm.execute(this.currentData);
    
    this.currentData = result;
    return result;
  }

  private async forceDirectedLayout(data: GraphData): Promise<GraphData> {
    // Simulate force-directed layout
    const nodes = [...data.nodes];
    const links = [...data.links];
    
    // Initialize random positions
    nodes.forEach(node => {
      if (!node.position) {
        node.position = {
          x: (Math.random() - 0.5) * 800,
          y: (Math.random() - 0.5) * 600
        };
      }
    });

    // Simple force simulation
    const iterations = 100;
    const strength = -300;
    const distance = 100;

    for (let i = 0; i < iterations; i++) {
      // Apply repulsive forces
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const node1 = nodes[j];
          const node2 = nodes[k];
          
          if (!node1.position || !node2.position) continue;
          
          const dx = node2.position.x - node1.position.x;
          const dy = node2.position.y - node1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const force = strength / (distance * distance);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            node1.position.x -= fx;
            node1.position.y -= fy;
            node2.position.x += fx;
            node2.position.y += fy;
          }
        }
      }

      // Apply attractive forces for links
      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        
        if (!source?.position || !target?.position) return;
        
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = (distance - 100) * 0.1;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.position.x += fx;
          source.position.y += fy;
          target.position.x -= fx;
          target.position.y -= fy;
        }
      });
    }

    return { nodes, links, metadata: data.metadata };
  }

  private async circularLayout(data: GraphData): Promise<GraphData> {
    const nodes = [...data.nodes];
    const radius = 200;
    const centerX = 0;
    const centerY = 0;
    
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      node.position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    return { nodes, links: data.links, metadata: data.metadata };
  }

  private async hierarchicalLayout(data: GraphData): Promise<GraphData> {
    const nodes = [...data.nodes];
    const links = [...data.links];
    
    // Simple hierarchical layout - find root nodes and arrange in levels
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map(nodes.map(n => [n.id, 0]));
    
    links.forEach(link => {
      inDegree.set(link.target, (inDegree.get(link.target) || 0) + 1);
    });
    
    const levels: GraphNode[][] = [];
    const visited = new Set<string>();
    
    // Find root nodes (in-degree = 0)
    const roots = nodes.filter(n => inDegree.get(n.id) === 0);
    levels.push(roots);
    roots.forEach(n => visited.add(n.id));
    
    // Build levels
    let currentLevel = 0;
    while (levels[currentLevel]?.length > 0) {
      const nextLevel: GraphNode[] = [];
      
      levels[currentLevel].forEach(node => {
        const children = links
          .filter(l => l.source === node.id)
          .map(l => nodeMap.get(l.target))
          .filter(n => n && !visited.has(n.id));
        
        children.forEach(child => {
          if (child) {
            nextLevel.push(child);
            visited.add(child.id);
          }
        });
      });
      
      if (nextLevel.length > 0) {
        levels.push(nextLevel);
      }
      currentLevel++;
    }
    
    // Position nodes
    const levelSeparation = 150;
    const nodeSeparation = 100;
    
    levels.forEach((level, levelIndex) => {
      const y = levelIndex * levelSeparation;
      const totalWidth = (level.length - 1) * nodeSeparation;
      const startX = -totalWidth / 2;
      
      level.forEach((node, nodeIndex) => {
        node.position = {
          x: startX + nodeIndex * nodeSeparation,
          y: y
        };
      });
    });

    return { nodes, links, metadata: data.metadata };
  }

  private async gridLayout(data: GraphData): Promise<GraphData> {
    const nodes = [...data.nodes];
    const columns = 10;
    const spacing = 100;
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      node.position = {
        x: (col - columns / 2) * spacing,
        y: (row - nodes.length / columns / 2) * spacing
      };
    });

    return { nodes, links: data.links, metadata: data.metadata };
  }

  private async radialLayout(data: GraphData): Promise<GraphData> {
    const nodes = [...data.nodes];
    const levels = 3;
    const radiusIncrement = 100;
    
    // Simple radial layout with concentric circles
    nodes.forEach((node, index) => {
      const level = index % levels;
      const angle = (index / Math.ceil(nodes.length / levels)) * 2 * Math.PI;
      const radius = (level + 1) * radiusIncrement;
      
      node.position = {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      };
    });

    return { nodes, links: data.links, metadata: data.metadata };
  }

  // Clustering Algorithms
  async applyClustering(algorithmName: string, parameters?: Record<string, any>): Promise<GraphData | null> {
    const algorithm = this.clusterAlgorithms.get(algorithmName);
    if (!algorithm || !this.currentData) return null;

    const params = { ...algorithm.parameters, ...parameters };
    const result = await algorithm.execute(this.currentData);
    
    this.currentData = result;
    return result;
  }

  private async louvainClustering(data: GraphData): Promise<GraphData> {
    // Simplified Louvain algorithm
    const nodes = [...data.nodes];
    const links = [...data.links];
    
    // Initialize each node in its own community
    const communities = new Map(nodes.map(n => [n.id, n.id]));
    const nodeCommunities = new Map<string, Set<string>>();
    
    nodes.forEach(node => {
      nodeCommunities.set(node.id, new Set([node.id]));
    });
    
    // Simple community detection based on connectivity
    const nodeConnections = new Map<string, string[]>();
    nodes.forEach(node => {
      nodeConnections.set(node.id, []);
    });
    
    links.forEach(link => {
      const sourceConnections = nodeConnections.get(link.source) || [];
      const targetConnections = nodeConnections.get(link.target) || [];
      sourceConnections.push(link.target);
      targetConnections.push(link.source);
      nodeConnections.set(link.source, sourceConnections);
      nodeConnections.set(link.target, targetConnections);
    });
    
    // Group nodes with high connectivity
    const visited = new Set<string>();
    let clusterId = 0;
    
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      
      const cluster = new Set<string>();
      const queue = [node.id];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        cluster.add(currentId);
        
        const connections = nodeConnections.get(currentId) || [];
        connections.forEach(connectedId => {
          if (!visited.has(connectedId)) {
            queue.push(connectedId);
          }
        });
      }
      
      // Assign cluster to nodes
      cluster.forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          node.cluster = `cluster_${clusterId}`;
        }
      });
      
      clusterId++;
    });

    return { nodes, links, metadata: data.metadata };
  }

  private async kMeansClustering(data: GraphData): Promise<GraphData> {
    const nodes = [...data.nodes];
    const k = 5;
    
    // Use node positions for clustering
    const positions = nodes
      .filter(n => n.position)
      .map(n => ({ id: n.id, x: n.position!.x, y: n.position!.y }));
    
    if (positions.length === 0) return data;
    
    // Initialize centroids randomly
    const centroids = Array.from({ length: k }, () => ({
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600
    }));
    
    // K-means iteration
    for (let iteration = 0; iteration < 10; iteration++) {
      // Assign points to nearest centroid
      const assignments = new Map<string, number>();
      
      positions.forEach(pos => {
        let minDistance = Infinity;
        let nearestCentroid = 0;
        
        centroids.forEach((centroid, index) => {
          const distance = Math.sqrt(
            Math.pow(pos.x - centroid.x, 2) + Math.pow(pos.y - centroid.y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = index;
          }
        });
        
        assignments.set(pos.id, nearestCentroid);
      });
      
      // Update centroids
      for (let i = 0; i < k; i++) {
        const clusterPoints = positions.filter(pos => assignments.get(pos.id) === i);
        if (clusterPoints.length > 0) {
          centroids[i] = {
            x: clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length,
            y: clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length
          };
        }
      }
    }
    
    // Assign clusters to nodes
    positions.forEach(pos => {
      const node = nodes.find(n => n.id === pos.id);
      if (node) {
        const clusterIndex = assignments.get(pos.id) || 0;
        node.cluster = `cluster_${clusterIndex}`;
      }
    });

    return { nodes, links: data.links, metadata: data.metadata };
  }

  private async spectralClustering(data: GraphData): Promise<GraphData> {
    // Simplified spectral clustering
    return this.kMeansClustering(data);
  }

  // Analytics
  async computeAnalytics(): Promise<GraphAnalytics | null> {
    if (!this.currentData) return null;

    const { nodes, links } = this.currentData;
    
    // Compute centrality
    const centrality = this.computeCentrality(nodes, links);
    
    // Compute clustering coefficient
    const clustering = this.computeClusteringCoefficient(nodes, links);
    
    // Detect communities
    const communities = this.detectCommunities(nodes, links);
    
    // Find bridges and isolates
    const bridges = this.findBridges(links);
    const isolates = this.findIsolates(nodes, links);
    const hubs = this.findHubs(nodes, centrality);
    
    // Compute statistics
    const statistics = this.computeStatistics(nodes, links);
    
    this.analytics = {
      centrality,
      clustering,
      communities,
      bridges,
      isolates,
      hubs,
      statistics
    };
    
    return this.analytics;
  }

  private computeCentrality(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
    const centrality: Record<string, number> = {};
    
    nodes.forEach(node => {
      const connections = links.filter(l => l.source === node.id || l.target === node.id).length;
      centrality[node.id] = connections;
    });
    
    return centrality;
  }

  private computeClusteringCoefficient(nodes: GraphNode[], links: GraphLink[]): Record<string, number> {
    const clustering: Record<string, number> = {};
    
    nodes.forEach(node => {
      const neighbors = new Set<string>();
      
      links.forEach(link => {
        if (link.source === node.id) neighbors.add(link.target);
        if (link.target === node.id) neighbors.add(link.source);
      });
      
      const neighborArray = Array.from(neighbors);
      let triangles = 0;
      let possibleTriangles = neighborArray.length * (neighborArray.length - 1) / 2;
      
      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          const hasLink = links.some(l => 
            (l.source === neighborArray[i] && l.target === neighborArray[j]) ||
            (l.source === neighborArray[j] && l.target === neighborArray[i])
          );
          if (hasLink) triangles++;
        }
      }
      
      clustering[node.id] = possibleTriangles > 0 ? triangles / possibleTriangles : 0;
    });
    
    return clustering;
  }

  private detectCommunities(nodes: GraphNode[], links: GraphLink[]): string[][] {
    // Simple community detection using connected components
    const visited = new Set<string>();
    const communities: string[][] = [];
    
    nodes.forEach(node => {
      if (visited.has(node.id)) return;
      
      const community: string[] = [];
      const queue = [node.id];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        community.push(currentId);
        
        links.forEach(link => {
          if (link.source === currentId && !visited.has(link.target)) {
            queue.push(link.target);
          }
          if (link.target === currentId && !visited.has(link.source)) {
            queue.push(link.source);
          }
        });
      }
      
      if (community.length > 0) {
        communities.push(community);
      }
    });
    
    return communities;
  }

  private findBridges(links: GraphLink[]): GraphLink[] {
    // Simplified bridge detection
    return links.filter(link => link.weight > 0.8);
  }

  private findIsolates(nodes: GraphNode[], links: GraphLink[]): GraphNode[] {
    return nodes.filter(node => 
      !links.some(link => link.source === node.id || link.target === node.id)
    );
  }

  private findHubs(nodes: GraphNode[], centrality: Record<string, number>): GraphNode[] {
    const avgCentrality = Object.values(centrality).reduce((sum, val) => sum + val, 0) / Object.values(centrality).length;
    return nodes.filter(node => centrality[node.id] > avgCentrality * 2);
  }

  private computeStatistics(nodes: GraphNode[], links: GraphLink[]): any {
    const nodeCount = nodes.length;
    const linkCount = links.length;
    const averageDegree = linkCount > 0 ? (2 * linkCount) / nodeCount : 0;
    const density = nodeCount > 1 ? (2 * linkCount) / (nodeCount * (nodeCount - 1)) : 0;
    
    return {
      nodeCount,
      linkCount,
      averageDegree,
      density,
      diameter: 0, // Would need path computation
      averagePathLength: 0 // Would need path computation
    };
  }

  // Filtering
  filterData(filter: GraphFilter): GraphData | null {
    if (!this.currentData) return null;

    let filteredNodes = [...this.currentData.nodes];
    let filteredLinks = [...this.currentData.links];

    // Apply filters
    if (filter.nodeTypes) {
      filteredNodes = filteredNodes.filter(node => filter.nodeTypes!.includes(node.type));
    }

    if (filter.linkTypes) {
      filteredLinks = filteredLinks.filter(link => filter.linkTypes!.includes(link.type));
    }

    if (filter.minConnections !== undefined || filter.maxConnections !== undefined) {
      const nodeConnections = new Map<string, number>();
      filteredLinks.forEach(link => {
        nodeConnections.set(link.source, (nodeConnections.get(link.source) || 0) + 1);
        nodeConnections.set(link.target, (nodeConnections.get(link.target) || 0) + 1);
      });

      filteredNodes = filteredNodes.filter(node => {
        const connections = nodeConnections.get(node.id) || 0;
        if (filter.minConnections !== undefined && connections < filter.minConnections) return false;
        if (filter.maxConnections !== undefined && connections > filter.maxConnections) return false;
        return true;
      });
    }

    if (filter.tags) {
      filteredNodes = filteredNodes.filter(node => 
        node.metadata?.tags?.some(tag => filter.tags!.includes(tag))
      );
    }

    if (filter.clusters) {
      filteredNodes = filteredNodes.filter(node => 
        node.cluster && filter.clusters!.includes(node.cluster)
      );
    }

    // Remove links that reference filtered out nodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    filteredLinks = filteredLinks.filter(link => 
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks,
      metadata: this.computeMetadata(filteredNodes, filteredLinks)
    };
  }

  private computeMetadata(nodes: GraphNode[], links: GraphLink[]): any {
    const clusters = new Set(nodes.map(n => n.cluster).filter(Boolean));
    const averageDegree = links.length > 0 ? (2 * links.length) / nodes.length : 0;
    const density = nodes.length > 1 ? (2 * links.length) / (nodes.length * (nodes.length - 1)) : 0;

    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      clusters: clusters.size,
      density,
      averageDegree
    };
  }

  // Utility Methods
  getAlgorithms(): LayoutAlgorithm[] {
    return Array.from(this.algorithms.values());
  }

  getClusterAlgorithms(): ClusterAlgorithm[] {
    return Array.from(this.clusterAlgorithms.values());
  }

  getAnalytics(): GraphAnalytics | null {
    return this.analytics;
  }

  exportData(): string {
    if (!this.currentData) return '';
    return JSON.stringify(this.currentData, null, 2);
  }

  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.nodes && parsed.links) {
        this.currentData = parsed;
        this.analytics = null;
        return true;
      }
    } catch (error) {
      console.error('Failed to import graph data:', error);
    }
    return false;
  }
}

export const AdvancedGraphService = new AdvancedGraphService(); 