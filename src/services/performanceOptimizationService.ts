import { Note } from '../types/note';

export interface PerformanceMetrics {
  pageLoadTime: number;
  searchResponseTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  timestamp: Date;
}

export interface CacheConfig {
  maxSize: number;
  ttl: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

export interface LazyLoadConfig {
  threshold: number;
  rootMargin: string;
  batchSize: number;
}

export interface VirtualizationConfig {
  itemHeight: number;
  overscan: number;
  containerHeight: number;
}

export interface PerformanceThresholds {
  pageLoadTime: number;
  searchResponseTime: number;
  renderTime: number;
  memoryUsage: number;
}

export class PerformanceOptimizationService {
  private cache = new Map<string, { data: any; timestamp: number; accessCount: number }>();
  private cacheConfig: CacheConfig = {
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    strategy: 'lru'
  };
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds = {
    pageLoadTime: 2000,
    searchResponseTime: 500,
    renderTime: 100,
    memoryUsage: 50 * 1024 * 1024 // 50MB
  };
  private observers: Map<string, IntersectionObserver> = new Map();
  private virtualizedItems: Map<string, any> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Cache Management
  setCache(key: string, data: any, ttl?: number): void {
    const timestamp = Date.now();
    const itemTtl = ttl || this.cacheConfig.ttl;

    // Remove oldest items if cache is full
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictCacheItems();
    }

    this.cache.set(key, {
      data,
      timestamp,
      accessCount: 0
    });
  }

  getCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.cacheConfig.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access count for LRU/LFU
    item.accessCount++;
    return item.data;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; hitRate: number; memoryUsage: number } {
    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHitRate > 0).length;
    const hitRate = totalRequests > 0 ? cacheHits / totalRequests : 0;

    return {
      size: this.cache.size,
      hitRate,
      memoryUsage: this.estimateCacheMemoryUsage()
    };
  }

  private evictCacheItems(): void {
    const items = Array.from(this.cache.entries());
    
    switch (this.cacheConfig.strategy) {
      case 'lru':
        // Remove least recently used (oldest timestamp)
        items.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case 'lfu':
        // Remove least frequently used (lowest access count)
        items.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'fifo':
        // Remove first in, first out (keep original order)
        break;
    }

    // Remove 20% of items
    const itemsToRemove = Math.ceil(items.length * 0.2);
    for (let i = 0; i < itemsToRemove; i++) {
      this.cache.delete(items[i][0]);
    }
  }

  private estimateCacheMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, value] of this.cache) {
      totalSize += this.estimateObjectSize(key) + this.estimateObjectSize(value.data);
    }
    return totalSize;
  }

  private estimateObjectSize(obj: any): number {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  }

  // Lazy Loading
  setupLazyLoading(
    selector: string,
    callback: (entries: IntersectionObserverEntry[]) => void,
    config: LazyLoadConfig = { threshold: 0.1, rootMargin: '50px', batchSize: 10 }
  ): void {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          callback(visibleEntries);
        }
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin
      }
    );

    const elements = document.querySelectorAll(selector);
    elements.forEach(element => observer.observe(element));
    
    this.observers.set(selector, observer);
  }

  lazyLoadNotes(notes: Note[], containerId: string, config: LazyLoadConfig): Note[] {
    const container = document.getElementById(containerId);
    if (!container) return notes;

    const containerRect = container.getBoundingClientRect();
    const visibleNotes = notes.filter((_, index) => {
      const element = document.getElementById(`note-${index}`);
      if (!element) return false;

      const elementRect = element.getBoundingClientRect();
      return elementRect.top < containerRect.bottom && elementRect.bottom > containerRect.top;
    });

    return visibleNotes.slice(0, config.batchSize);
  }

  // Virtualization
  setupVirtualization(
    containerId: string,
    items: any[],
    config: VirtualizationConfig
  ): { visibleItems: any[]; totalHeight: number; scrollTop: number } {
    const container = document.getElementById(containerId);
    if (!container) return { visibleItems: [], totalHeight: 0, scrollTop: 0 };

    const scrollTop = container.scrollTop;
    const containerHeight = config.containerHeight || container.clientHeight;
    
    const startIndex = Math.floor(scrollTop / config.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / config.itemHeight) + config.overscan,
      items.length
    );

    const visibleItems = items.slice(startIndex, endIndex);
    const totalHeight = items.length * config.itemHeight;

    return {
      visibleItems,
      totalHeight,
      scrollTop
    };
  }

  // Debouncing and Throttling
  debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key)!);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Performance Monitoring
  startPerformanceMonitoring(): void {
    // Monitor page load time
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        this.recordMetric('pageLoadTime', loadTime);
      });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memoryUsage', memory.usedJSHeapSize);
      }, 5000);
    }

    // Monitor network requests
    this.setupNetworkMonitoring();
  }

  recordMetric(type: keyof PerformanceMetrics, value: number): void {
    const metric: PerformanceMetrics = {
      pageLoadTime: type === 'pageLoadTime' ? value : 0,
      searchResponseTime: type === 'searchResponseTime' ? value : 0,
      renderTime: type === 'renderTime' ? value : 0,
      memoryUsage: type === 'memoryUsage' ? value : 0,
      cacheHitRate: type === 'cacheHitRate' ? value : 0,
      networkRequests: type === 'networkRequests' ? value : 0,
      timestamp: new Date()
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Check thresholds
    this.checkPerformanceThresholds(metric);
  }

  getPerformanceMetrics(timeRange: 'hour' | 'day' | 'week' = 'hour'): PerformanceMetrics[] {
    const now = Date.now();
    const ranges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };

    return this.metrics.filter(metric => 
      now - metric.timestamp.getTime() < ranges[timeRange]
    );
  }

  getPerformanceSummary(): {
    averageLoadTime: number;
    averageSearchTime: number;
    averageRenderTime: number;
    averageMemoryUsage: number;
    cacheHitRate: number;
    totalRequests: number;
  } {
    if (this.metrics.length === 0) {
      return {
        averageLoadTime: 0,
        averageSearchTime: 0,
        averageRenderTime: 0,
        averageMemoryUsage: 0,
        cacheHitRate: 0,
        totalRequests: 0
      };
    }

    const total = this.metrics.reduce((acc, metric) => ({
      loadTime: acc.loadTime + metric.pageLoadTime,
      searchTime: acc.searchTime + metric.searchResponseTime,
      renderTime: acc.renderTime + metric.renderTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      cacheHits: acc.cacheHits + metric.cacheHitRate,
      requests: acc.requests + metric.networkRequests
    }), {
      loadTime: 0,
      searchTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHits: 0,
      requests: 0
    });

    return {
      averageLoadTime: total.loadTime / this.metrics.length,
      averageSearchTime: total.searchTime / this.metrics.length,
      averageRenderTime: total.renderTime / this.metrics.length,
      averageMemoryUsage: total.memoryUsage / this.metrics.length,
      cacheHitRate: total.cacheHits / this.metrics.length,
      totalRequests: total.requests
    };
  }

  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    const warnings: string[] = [];

    if (metric.pageLoadTime > this.thresholds.pageLoadTime) {
      warnings.push(`Page load time (${metric.pageLoadTime}ms) exceeds threshold (${this.thresholds.pageLoadTime}ms)`);
    }

    if (metric.searchResponseTime > this.thresholds.searchResponseTime) {
      warnings.push(`Search response time (${metric.searchResponseTime}ms) exceeds threshold (${this.thresholds.searchResponseTime}ms)`);
    }

    if (metric.renderTime > this.thresholds.renderTime) {
      warnings.push(`Render time (${metric.renderTime}ms) exceeds threshold (${this.thresholds.renderTime}ms)`);
    }

    if (metric.memoryUsage > this.thresholds.memoryUsage) {
      warnings.push(`Memory usage (${metric.memoryUsage} bytes) exceeds threshold (${this.thresholds.memoryUsage} bytes)`);
    }

    if (warnings.length > 0) {
      console.warn('Performance warnings:', warnings);
      this.emitPerformanceWarning(warnings);
    }
  }

  private setupNetworkMonitoring(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric('networkRequests', resourceEntry.duration);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private emitPerformanceWarning(warnings: string[]): void {
    // Emit custom event for performance warnings
    const event = new CustomEvent('performanceWarning', {
      detail: { warnings, timestamp: new Date() }
    });
    window.dispatchEvent(event);
  }

  // Image Optimization
  optimizeImages(images: HTMLImageElement[]): void {
    images.forEach(img => {
      // Lazy load images
      if ('loading' in HTMLImageElement.prototype) {
        img.loading = 'lazy';
      }

      // Set appropriate sizes
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }

      // Add error handling
      img.onerror = () => {
        img.src = '/placeholder-image.png';
      };
    });
  }

  // Code Splitting and Dynamic Imports
  async loadComponent(componentPath: string): Promise<any> {
    const cacheKey = `component:${componentPath}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const module = await import(componentPath);
      this.setCache(cacheKey, module);
      return module;
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      throw error;
    }
  }

  // Memory Management
  cleanup(): void {
    // Clear all timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    // Clear virtualized items
    this.virtualizedItems.clear();

    // Clear old cache entries
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.cacheConfig.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Configuration
  updateCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
  }

  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  // Analytics
  getPerformanceAnalytics(): {
    trends: { date: string; metrics: PerformanceMetrics }[];
    recommendations: string[];
    bottlenecks: string[];
  } {
    const recentMetrics = this.getPerformanceMetrics('day');
    const trends = this.calculateTrends(recentMetrics);
    const recommendations = this.generateRecommendations(recentMetrics);
    const bottlenecks = this.identifyBottlenecks(recentMetrics);

    return { trends, recommendations, bottlenecks };
  }

  private calculateTrends(metrics: PerformanceMetrics[]): { date: string; metrics: PerformanceMetrics }[] {
    // Group metrics by hour
    const hourlyGroups = new Map<string, PerformanceMetrics[]>();
    
    metrics.forEach(metric => {
      const hour = metric.timestamp.toISOString().slice(0, 13);
      if (!hourlyGroups.has(hour)) {
        hourlyGroups.set(hour, []);
      }
      hourlyGroups.get(hour)!.push(metric);
    });

    return Array.from(hourlyGroups.entries()).map(([hour, hourMetrics]) => ({
      date: hour,
      metrics: this.averageMetrics(hourMetrics)
    }));
  }

  private averageMetrics(metrics: PerformanceMetrics[]): PerformanceMetrics {
    const total = metrics.reduce((acc, metric) => ({
      pageLoadTime: acc.pageLoadTime + metric.pageLoadTime,
      searchResponseTime: acc.searchResponseTime + metric.searchResponseTime,
      renderTime: acc.renderTime + metric.renderTime,
      memoryUsage: acc.memoryUsage + metric.memoryUsage,
      cacheHitRate: acc.cacheHitRate + metric.cacheHitRate,
      networkRequests: acc.networkRequests + metric.networkRequests
    }), {
      pageLoadTime: 0,
      searchResponseTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      networkRequests: 0
    });

    const count = metrics.length;
    return {
      pageLoadTime: total.pageLoadTime / count,
      searchResponseTime: total.searchResponseTime / count,
      renderTime: total.renderTime / count,
      memoryUsage: total.memoryUsage / count,
      cacheHitRate: total.cacheHitRate / count,
      networkRequests: total.networkRequests / count,
      timestamp: new Date()
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics[]): string[] {
    const recommendations: string[] = [];
    const summary = this.getPerformanceSummary();

    if (summary.averageLoadTime > 1500) {
      recommendations.push('Consider implementing code splitting to reduce initial bundle size');
    }

    if (summary.averageSearchTime > 300) {
      recommendations.push('Optimize search algorithms or implement search result caching');
    }

    if (summary.averageRenderTime > 50) {
      recommendations.push('Consider using virtualization for large lists or implementing React.memo');
    }

    if (summary.cacheHitRate < 0.5) {
      recommendations.push('Increase cache size or improve cache key strategy');
    }

    if (summary.averageMemoryUsage > 30 * 1024 * 1024) {
      recommendations.push('Implement memory cleanup and avoid memory leaks');
    }

    return recommendations;
  }

  private identifyBottlenecks(metrics: PerformanceMetrics[]): string[] {
    const bottlenecks: string[] = [];
    const slowSearches = metrics.filter(m => m.searchResponseTime > 1000);
    const slowRenders = metrics.filter(m => m.renderTime > 200);
    const highMemory = metrics.filter(m => m.memoryUsage > 100 * 1024 * 1024);

    if (slowSearches.length > 0) {
      bottlenecks.push(`Search performance issues detected in ${slowSearches.length} instances`);
    }

    if (slowRenders.length > 0) {
      bottlenecks.push(`Render performance issues detected in ${slowRenders.length} instances`);
    }

    if (highMemory.length > 0) {
      bottlenecks.push(`Memory usage issues detected in ${highMemory.length} instances`);
    }

    return bottlenecks;
  }
}

export const performanceOptimizationService = new PerformanceOptimizationService(); 