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

export interface DeviceType {
  type: 'mobile' | 'tablet' | 'desktop';
  screenSize: { width: number; height: number };
  pixelRatio: number;
  memory: number; // Available memory in MB
  cpuCores: number;
  gpuCapability: 'low' | 'medium' | 'high';
}

export interface CullingThresholds {
  margin: number; // Extra margin for smooth scrolling
  nodeThreshold: number; // Max nodes before aggressive culling
  linkThreshold: number; // Max links before aggressive culling
  zoomSensitivity: number; // How zoom affects culling
  performanceMultiplier: number; // Performance mode multiplier
}

export interface DeviceOptimizationConfig {
  mobile: CullingThresholds;
  tablet: CullingThresholds;
  desktop: CullingThresholds;
}

export class GraphOptimizationService {
  // Default clustering thresholds
  private static readonly CLUSTERING_THRESHOLDS = {
    LOW: 50,      // Start clustering at 50 nodes
    MEDIUM: 100,  // Medium clustering at 100 nodes
    HIGH: 200     // High clustering at 200 nodes
  };

  private static readonly CLUSTER_RADIUS = 100; // Distance for clustering

  // Device-specific optimization configurations
  private static readonly DEVICE_CONFIGS: DeviceOptimizationConfig = {
    mobile: {
      margin: 100,           // Smaller margin for mobile screens
      nodeThreshold: 30,     // Lower threshold for mobile performance
      linkThreshold: 50,     // Lower link threshold
      zoomSensitivity: 1.5,  // Higher zoom sensitivity
      performanceMultiplier: 0.7 // More aggressive optimization
    },
    tablet: {
      margin: 150,           // Medium margin for tablets
      nodeThreshold: 60,     // Medium threshold
      linkThreshold: 100,    // Medium link threshold
      zoomSensitivity: 1.2,  // Medium zoom sensitivity
      performanceMultiplier: 0.85 // Moderate optimization
    },
    desktop: {
      margin: 200,           // Larger margin for desktop
      nodeThreshold: 100,    // Higher threshold for desktop
      linkThreshold: 200,    // Higher link threshold
      zoomSensitivity: 1.0,  // Standard zoom sensitivity
      performanceMultiplier: 1.0 // Standard optimization
    }
  };

  // Current device configuration
  private static currentDevice: DeviceType | null = null;
  private static currentConfig: CullingThresholds | null = null;

  /**
   * Initialize device detection and configuration
   */
  static initializeDeviceDetection(): void {
    this.currentDevice = this.detectDevice();
    this.currentConfig = this.getDeviceConfig(this.currentDevice);
  }

  /**
   * Detect current device capabilities
   */
  private static detectDevice(): DeviceType {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const pixelRatio = window.devicePixelRatio || 1;

    // Detect device type
    let deviceType: 'mobile' | 'tablet' | 'desktop';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    if (isMobile) {
      deviceType = screenWidth >= 768 && screenWidth <= 1024 ? 'tablet' : 'mobile';
    } else {
      deviceType = 'desktop';
    }

    // Estimate memory (this is approximate)
    const memory = this.estimateAvailableMemory();
    
    // Estimate CPU cores
    const cpuCores = navigator.hardwareConcurrency || 4;
    
    // Estimate GPU capability
    const gpuCapability = this.estimateGPUCapability();

    return {
      type: deviceType,
      screenSize: { width: screenWidth, height: screenHeight },
      pixelRatio,
      memory,
      cpuCores,
      gpuCapability
    };
  }

  /**
   * Estimate available memory
   */
  private static estimateAvailableMemory(): number {
    // Try to get memory info if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      return Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024));
    }

    // Fallback estimates based on device type
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 2048; // 2GB for iOS devices
    } else if (/Android/i.test(userAgent)) {
      return 3072; // 3GB for Android devices
    } else {
      return 8192; // 8GB for desktop
    }
  }

  /**
   * Estimate GPU capability
   */
  private static estimateGPUCapability(): 'low' | 'medium' | 'high' {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return 'low';
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      if (renderer.includes('Intel') || renderer.includes('Mali')) {
        return 'low';
      } else if (renderer.includes('Adreno') || renderer.includes('PowerVR')) {
        return 'medium';
      } else {
        return 'high';
      }
    }

    // Fallback based on device type
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'high';
    } else if (/Android/i.test(userAgent)) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Get device-specific configuration
   */
  private static getDeviceConfig(device: DeviceType): CullingThresholds {
    const baseConfig = this.DEVICE_CONFIGS[device.type];
    
    // Adjust based on device capabilities
    let adjustedConfig = { ...baseConfig };

    // Adjust for memory constraints
    if (device.memory < 2048) { // Less than 2GB
      adjustedConfig.nodeThreshold *= 0.7;
      adjustedConfig.linkThreshold *= 0.7;
      adjustedConfig.performanceMultiplier *= 0.8;
    } else if (device.memory > 8192) { // More than 8GB
      adjustedConfig.nodeThreshold *= 1.3;
      adjustedConfig.linkThreshold *= 1.3;
      adjustedConfig.performanceMultiplier *= 1.2;
    }

    // Adjust for GPU capability
    if (device.gpuCapability === 'low') {
      adjustedConfig.performanceMultiplier *= 0.8;
      adjustedConfig.zoomSensitivity *= 1.2;
    } else if (device.gpuCapability === 'high') {
      adjustedConfig.performanceMultiplier *= 1.2;
      adjustedConfig.zoomSensitivity *= 0.9;
    }

    // Adjust for screen size
    const screenArea = device.screenSize.width * device.screenSize.height;
    if (screenArea < 300000) { // Small screen
      adjustedConfig.margin *= 0.8;
    } else if (screenArea > 2000000) { // Large screen
      adjustedConfig.margin *= 1.2;
    }

    return adjustedConfig;
  }

  /**
   * Update device configuration (call when device changes)
   */
  static updateDeviceConfiguration(): void {
    this.currentDevice = this.detectDevice();
    this.currentConfig = this.getDeviceConfig(this.currentDevice);
  }

  /**
   * Get current device information
   */
  static getCurrentDevice(): DeviceType | null {
    return this.currentDevice;
  }

  /**
   * Get current optimization configuration
   */
  static getCurrentConfig(): CullingThresholds | null {
    return this.currentConfig;
  }

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

    // Ensure device is detected
    if (!this.currentDevice) {
      this.initializeDeviceDetection();
    }

    // Get device-specific thresholds
    const config = this.currentConfig || this.DEVICE_CONFIGS.desktop;

    // Determine clustering level based on node count and performance mode
    const clusteringLevel = this.determineClusteringLevel(nodes.length, performanceMode, config);

    // Apply viewport culling with device-specific thresholds
    const culledNodes = this.cullNodesByViewport(nodes, viewport, config);
    const culledLinks = this.cullLinksByViewport(links, culledNodes, viewport, config);

    // Apply clustering if needed
    let optimizedNodes: (GraphNode | ClusterNode)[] = culledNodes;
    let optimizedLinks: GraphLink[] = culledLinks;

    if (clusteringLevel !== 'none') {
      const clustered = this.clusterNodes(culledNodes, culledLinks, clusteringLevel, viewport, config);
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
   * Determine clustering level based on node count, performance mode, and device config
   */
  private static determineClusteringLevel(
    nodeCount: number,
    performanceMode: 'quality' | 'performance' | 'auto',
    config: CullingThresholds
  ): 'none' | 'low' | 'medium' | 'high' {
    // Apply device-specific performance multiplier
    const adjustedNodeCount = nodeCount * config.performanceMultiplier;

    if (performanceMode === 'quality') {
      return adjustedNodeCount > this.CLUSTERING_THRESHOLDS.HIGH ? 'low' : 'none';
    }
    
    if (performanceMode === 'performance') {
      if (adjustedNodeCount > this.CLUSTERING_THRESHOLDS.HIGH) return 'high';
      if (adjustedNodeCount > this.CLUSTERING_THRESHOLDS.MEDIUM) return 'medium';
      if (adjustedNodeCount > this.CLUSTERING_THRESHOLDS.LOW) return 'low';
      return 'none';
    }

    // Auto mode - adaptive based on performance and device
    if (adjustedNodeCount > this.CLUSTERING_THRESHOLDS.HIGH) return 'medium';
    if (adjustedNodeCount > this.CLUSTERING_THRESHOLDS.MEDIUM) return 'low';
    return 'none';
  }

  /**
   * Cull nodes that are outside the viewport with device-specific thresholds
   */
  private static cullNodesByViewport(nodes: GraphNode[], viewport: Viewport, config: CullingThresholds): GraphNode[] {
    // Apply zoom-sensitive margin
    const margin = (config.margin * config.zoomSensitivity) / viewport.zoom;
    const minX = viewport.x - margin;
    const maxX = viewport.x + viewport.width + margin;
    const minY = viewport.y - margin;
    const maxY = viewport.y + viewport.height + margin;

    // If we have too many nodes, apply more aggressive culling
    if (nodes.length > config.nodeThreshold) {
      const cullingFactor = nodes.length / config.nodeThreshold;
      const additionalMargin = margin * (1 - 1 / cullingFactor);
      
      return nodes.filter(node => {
        const screenX = (node.x - viewport.x) * viewport.zoom;
        const screenY = (node.y - viewport.y) * viewport.zoom;
        
        return screenX >= (minX + additionalMargin) && screenX <= (maxX - additionalMargin) && 
               screenY >= (minY + additionalMargin) && screenY <= (maxY - additionalMargin);
      });
    }

    return nodes.filter(node => {
      const screenX = (node.x - viewport.x) * viewport.zoom;
      const screenY = (node.y - viewport.y) * viewport.zoom;
      
      return screenX >= minX && screenX <= maxX && 
             screenY >= minY && screenY <= maxY;
    });
  }

  /**
   * Cull links that are outside the viewport or connect to culled nodes with device-specific thresholds
   */
  private static cullLinksByViewport(
    links: GraphLink[], 
    visibleNodes: GraphNode[], 
    viewport: Viewport,
    config: CullingThresholds
  ): GraphLink[] {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const margin = (config.margin * config.zoomSensitivity) / viewport.zoom;

    // If we have too many links, apply more aggressive culling
    if (links.length > config.linkThreshold) {
      const cullingFactor = links.length / config.linkThreshold;
      const additionalMargin = margin * (1 - 1 / cullingFactor);
      
      return links.filter(link => {
        // Only include links between visible nodes
        if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) {
          return false;
        }

        // Check if link is within viewport bounds with additional margin
        const sourceNode = visibleNodes.find(n => n.id === link.source);
        const targetNode = visibleNodes.find(n => n.id === link.target);
        
        if (!sourceNode || !targetNode) return false;

        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;
        
        const screenX = (midX - viewport.x) * viewport.zoom;
        const screenY = (midY - viewport.y) * viewport.zoom;
        
        return screenX >= additionalMargin && screenX <= viewport.width - additionalMargin &&
               screenY >= additionalMargin && screenY <= viewport.height - additionalMargin;
      });
    }

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
   * Cluster nearby nodes to reduce visual complexity with device-specific configuration
   */
  private static clusterNodes(
    nodes: GraphNode[],
    links: GraphLink[],
    level: 'low' | 'medium' | 'high',
    viewport: Viewport,
    config: CullingThresholds
  ): { nodes: (GraphNode | ClusterNode)[]; links: GraphLink[] } {
    // Adjust cluster radius based on device performance
    const clusterRadius = this.CLUSTER_RADIUS * (level === 'high' ? 2 : level === 'medium' ? 1.5 : 1) * config.performanceMultiplier;
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
        Math.pow(node.x - centerNode.x, 2) + Math.pow(node.y - centerNode.y, 2)
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
   * Get performance recommendations based on current metrics and device
   */
  static getPerformanceRecommendations(metrics: OptimizedGraphData['performanceMetrics']): string[] {
    const recommendations: string[] = [];
    const device = this.currentDevice;
    const config = this.currentConfig;

    if (metrics.renderTime > 16) { // > 60fps threshold
      recommendations.push('Consider enabling higher clustering level');
      
      if (device?.type === 'mobile') {
        recommendations.push('Mobile device detected - consider reducing graph complexity');
      }
    }

    if (metrics.cullingEfficiency < 0.3) {
      recommendations.push('Viewport culling efficiency is low - consider zooming out');
      
      if (config) {
        recommendations.push(`Current margin: ${config.margin}px, threshold: ${config.nodeThreshold} nodes`);
      }
    }

    if (metrics.clusteringEfficiency > 0.5) {
      recommendations.push('High clustering efficiency - graph is well optimized');
    }

    if (device?.memory && device.memory < 2048) {
      recommendations.push('Low memory device detected - consider reducing graph size');
    }

    if (device?.gpuCapability === 'low') {
      recommendations.push('Low GPU capability detected - using simplified rendering');
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

  /**
   * Get device-specific configuration for external use
   */
  static getDeviceConfiguration(): DeviceOptimizationConfig {
    return this.DEVICE_CONFIGS;
  }

  /**
   * Set custom device configuration
   */
  static setCustomDeviceConfig(deviceType: 'mobile' | 'tablet' | 'desktop', config: Partial<CullingThresholds>): void {
    this.DEVICE_CONFIGS[deviceType] = { ...this.DEVICE_CONFIGS[deviceType], ...config };
    
    // Update current config if device type matches
    if (this.currentDevice?.type === deviceType) {
      this.currentConfig = this.getDeviceConfig(this.currentDevice);
    }
  }
} 