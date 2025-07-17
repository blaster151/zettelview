import { GraphNode, GraphLink } from '../types/graph';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export interface ClusterNode extends GraphNode {
  isCluster: boolean;
  childNodes: string[];
  clusterSize: number;
  representativeNode?: GraphNode;
}

export interface OptimizedGraphData {
  visibleNodes: (GraphNode | ClusterNode)[];
  visibleLinks: GraphLink[];
  totalNodes: number;
  totalLinks: number;
  clusteringLevel: 'none' | 'low' | 'medium' | 'high';
  performanceMetrics: {
    cullingEfficiency: number;
    clusteringEfficiency: number;
    renderTime: number;
  };
}

export class GraphOptimizationService {
  private static readonly CLUSTERING_THRESHOLDS = {
    LOW: 50,      // Start clustering at 50 nodes
    MEDIUM: 100,  // Medium clustering at 100 nodes
    HIGH: 200     // High clustering at 200 nodes
  };

  private static readonly CLUSTER_RADIUS = 100; // Distance for clustering
  private static readonly CULLING_MARGIN = 200; // Extra margin for smooth scrolling

  /**
   * Optimize graph rendering based on viewport and performance
   */
  static optimizeGraph(
    nodes: GraphNode[],
    links: GraphLink[],
    viewport: Viewport,
    performanceMode: 'quality' | 'performance' | 'auto' = 'auto'
  ): OptimizedGraphData {
    const startTime = performance.now();

    // Determine clustering level based on node count and performance mode
    const clusteringLevel = this.determineClusteringLevel(nodes.length, performanceMode);

    // Apply viewport culling
    const culledNodes = this.cullNodesByViewport(nodes, viewport);
    const culledLinks = this.cullLinksByViewport(links, culledNodes, viewport);

    // Apply clustering if needed
    let optimizedNodes: (GraphNode | ClusterNode)[] = culledNodes;
    let optimizedLinks: GraphLink[] = culledLinks;

    if (clusteringLevel !== 'none') {
      const clustered = this.clusterNodes(culledNodes, culledLinks, clusteringLevel, viewport);
      optimizedNodes = clustered.nodes;
      optimizedLinks = clustered.links;
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    return {
      visibleNodes: optimizedNodes,
      visibleLinks: optimizedLinks,
      totalNodes: nodes.length,
      totalLinks: links.length,
      clusteringLevel,
      performanceMetrics: {
        cullingEfficiency: nodes.length > 0 ? (nodes.length - culledNodes.length) / nodes.length : 0,
        clusteringEfficiency: culledNodes.length > 0 ? (culledNodes.length - optimizedNodes.length) / culledNodes.length : 0,
        renderTime
      }
    };
  }

  /**
   * Determine clustering level based on node count and performance mode
   */
  private static determineClusteringLevel(
    nodeCount: number,
    performanceMode: 'quality' | 'performance' | 'auto'
  ): 'none' | 'low' | 'medium' | 'high' {
    if (performanceMode === 'quality') {
      return nodeCount > this.CLUSTERING_THRESHOLDS.HIGH ? 'low' : 'none';
    }
    
    if (performanceMode === 'performance') {
      if (nodeCount > this.CLUSTERING_THRESHOLDS.HIGH) return 'high';
      if (nodeCount > this.CLUSTERING_THRESHOLDS.MEDIUM) return 'medium';
      if (nodeCount > this.CLUSTERING_THRESHOLDS.LOW) return 'low';
      return 'none';
    }

    // Auto mode - adaptive based on performance
    if (nodeCount > this.CLUSTERING_THRESHOLDS.HIGH) return 'medium';
    if (nodeCount > this.CLUSTERING_THRESHOLDS.MEDIUM) return 'low';
    return 'none';
  }

  /**
   * Cull nodes that are outside the viewport
   */
  private static cullNodesByViewport(nodes: GraphNode[], viewport: Viewport): GraphNode[] {
    const margin = this.CULLING_MARGIN / viewport.zoom;
    const minX = viewport.x - margin;
    const maxX = viewport.x + viewport.width + margin;
    const minY = viewport.y - margin;
    const maxY = viewport.y + viewport.height + margin;

    return nodes.filter(node => {
      const screenX = (node.x - viewport.x) * viewport.zoom;
      const screenY = (node.y - viewport.y) * viewport.zoom;
      
      return screenX >= minX && screenX <= maxX && 
             screenY >= minY && screenY <= maxY;
    });
  }

  /**
   * Cull links that are outside the viewport or connect to culled nodes
   */
  private static cullLinksByViewport(
    links: GraphLink[], 
    visibleNodes: GraphNode[], 
    viewport: Viewport
  ): GraphLink[] {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const margin = this.CULLING_MARGIN / viewport.zoom;

    return links.filter(link => {
      // Only include links between visible nodes
      if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) {
        return false;
      }

      // Check if link is within viewport bounds
      const sourceNode = visibleNodes.find(n => n.id === link.source);
      const targetNode = visibleNodes.find(n => n.id === link.target);
      
      if (!sourceNode || !targetNode) return false;

      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;
      
      const screenX = (midX - viewport.x) * viewport.zoom;
      const screenY = (midY - viewport.y) * viewport.zoom;
      
      return screenX >= -margin && screenX <= viewport.width + margin &&
             screenY >= -margin && screenY <= viewport.height + margin;
    });
  }

  /**
   * Cluster nearby nodes to reduce visual complexity
   */
  private static clusterNodes(
    nodes: GraphNode[],
    links: GraphLink[],
    level: 'low' | 'medium' | 'high',
    viewport: Viewport
  ): { nodes: (GraphNode | ClusterNode)[]; links: GraphLink[] } {
    const clusterRadius = this.CLUSTER_RADIUS * (level === 'high' ? 2 : level === 'medium' ? 1.5 : 1);
    const clusters: ClusterNode[] = [];
    const processedNodes = new Set<string>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Find clusters
    for (const node of nodes) {
      if (processedNodes.has(node.id)) continue;

      const cluster = this.findCluster(node, nodes, clusterRadius, processedNodes);
      if (cluster.length > 1) {
        const clusterNode = this.createClusterNode(cluster, level);
        clusters.push(clusterNode);
      } else {
        // Single node - keep as is
        processedNodes.add(node.id);
      }
    }

    // Create optimized node list
    const optimizedNodes: (GraphNode | ClusterNode)[] = [
      ...clusters,
      ...nodes.filter(n => !processedNodes.has(n.id))
    ];

    // Update links to work with clusters
    const optimizedLinks = this.updateLinksForClusters(links, clusters, nodeMap);

    return { nodes: optimizedNodes, links: optimizedLinks };
  }

  /**
   * Find all nodes that belong to the same cluster
   */
  private static findCluster(
    centerNode: GraphNode,
    allNodes: GraphNode[],
    radius: number,
    processedNodes: Set<string>
  ): GraphNode[] {
    const cluster: GraphNode[] = [centerNode];
    processedNodes.add(centerNode.id);

    for (const node of allNodes) {
      if (processedNodes.has(node.id)) continue;

      const distance = Math.sqrt(
        Math.pow(centerNode.x - node.x, 2) + Math.pow(centerNode.y - node.y, 2)
      );

      if (distance <= radius) {
        cluster.push(node);
        processedNodes.add(node.id);
      }
    }

    return cluster;
  }

  /**
   * Create a cluster node from a group of nodes
   */
  private static createClusterNode(
    nodes: GraphNode[],
    level: 'low' | 'medium' | 'high'
  ): ClusterNode {
    // Calculate cluster center
    const centerX = nodes.reduce((sum, n) => sum + n.x, 0) / nodes.length;
    const centerY = nodes.reduce((sum, n) => sum + n.y, 0) / nodes.length;

    // Find representative node (most connected or largest)
    const representativeNode = nodes.reduce((best, current) => {
      const bestScore = best.tags.length + best.title.length;
      const currentScore = current.tags.length + current.title.length;
      return currentScore > bestScore ? current : best;
    });

    // Calculate cluster size based on level
    const baseSize = Math.max(...nodes.map(n => n.size));
    const clusterSize = baseSize * (level === 'high' ? 2.5 : level === 'medium' ? 2 : 1.5);

    // Generate cluster color based on dominant tags
    const allTags = nodes.flatMap(n => n.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantTag = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    const color = dominantTag 
      ? `hsl(${(dominantTag.length * 50) % 360}, 70%, 60%)`
      : '#6c757d';

    return {
      id: `cluster_${nodes.map(n => n.id).join('_')}`,
      title: `${nodes.length} notes`,
      x: centerX,
      y: centerY,
      size: clusterSize,
      color,
      tags: [dominantTag].filter(Boolean),
      isSelected: false,
      isHovered: false,
      isCluster: true,
      childNodes: nodes.map(n => n.id),
      clusterSize: nodes.length,
      representativeNode
    };
  }

  /**
   * Update links to work with clustered nodes
   */
  private static updateLinksForClusters(
    links: GraphLink[],
    clusters: ClusterNode[],
    nodeMap: Map<string, GraphNode>
  ): GraphLink[] {
    const clusterMap = new Map<string, ClusterNode>();
    clusters.forEach(cluster => {
      cluster.childNodes.forEach(nodeId => {
        clusterMap.set(nodeId, cluster);
      });
    });

    const optimizedLinks: GraphLink[] = [];
    const linkSet = new Set<string>();

    for (const link of links) {
      const sourceCluster = clusterMap.get(link.source);
      const targetCluster = clusterMap.get(link.target);

      const sourceId = sourceCluster?.id || link.source;
      const targetId = targetCluster?.id || link.target;

      // Avoid self-loops in clusters
      if (sourceId === targetId) continue;

      const linkKey = `${sourceId}-${targetId}`;
      if (linkSet.has(linkKey)) continue;

      linkSet.add(linkKey);
      optimizedLinks.push({
        ...link,
        source: sourceId,
        target: targetId,
        strength: link.strength * (sourceCluster && targetCluster ? 1.5 : 1) // Stronger cluster links
      });
    }

    return optimizedLinks;
  }

  /**
   * Get performance recommendations based on current metrics
   */
  static getPerformanceRecommendations(metrics: OptimizedGraphData['performanceMetrics']): string[] {
    const recommendations: string[] = [];

    if (metrics.renderTime > 16) { // > 60fps threshold
      recommendations.push('Consider enabling higher clustering level');
    }

    if (metrics.cullingEfficiency < 0.3) {
      recommendations.push('Viewport culling efficiency is low - consider zooming out');
    }

    if (metrics.clusteringEfficiency > 0.5) {
      recommendations.push('High clustering efficiency - graph is well optimized');
    }

    return recommendations;
  }

  /**
   * Calculate viewport from canvas and transform data
   */
  static calculateViewport(
    canvasWidth: number,
    canvasHeight: number,
    pan: { x: number; y: number },
    zoom: number
  ): Viewport {
    return {
      x: -pan.x / zoom - canvasWidth / (2 * zoom),
      y: -pan.y / zoom - canvasHeight / (2 * zoom),
      width: canvasWidth / zoom,
      height: canvasHeight / zoom,
      zoom
    };
  }
} 