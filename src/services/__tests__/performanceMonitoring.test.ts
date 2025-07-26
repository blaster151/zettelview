import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor, PerformanceUtils } from '../../services/performanceMonitor';

describe('Performance Monitoring - Comprehensive Testing', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor = new PerformanceMonitor();
    
    // Mock performance.memory
    Object.defineProperty(performance, 'memory', {
      value: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
      },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Memory Usage Monitoring', () => {
    test('should track memory usage over time', () => {
      const initialMemory = performanceMonitor.getReport().summary.averageMemoryUsage;
      
      // Simulate memory increase
      (performance as any).memory.usedJSHeapSize = 75 * 1024 * 1024; // 75MB
      
      // Trigger memory check
      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: (performance as any).memory.usedJSHeapSize,
        unit: 'bytes',
        category: 'memory'
      });

      const updatedReport = performanceMonitor.getReport();
      expect(updatedReport.summary.averageMemoryUsage).toBeGreaterThan(initialMemory);
    });

    test('should detect memory pressure', () => {
      // Simulate high memory usage
      (performance as any).memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB
      
      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: (performance as any).memory.usedJSHeapSize,
        unit: 'bytes',
        category: 'memory'
      });

      const report = performanceMonitor.getReport();
      const memoryRecommendations = report.recommendations.filter(rec => 
        rec.includes('memory') || rec.includes('Memory')
      );
      
      expect(memoryRecommendations.length).toBeGreaterThan(0);
    });

    test('should handle memory exhaustion scenarios', () => {
      // Simulate critical memory usage
      (performance as any).memory.usedJSHeapSize = 180 * 1024 * 1024; // 180MB
      
      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: (performance as any).memory.usedJSHeapSize,
        unit: 'bytes',
        category: 'memory'
      });

      const report = performanceMonitor.getReport();
      const criticalRecommendations = report.recommendations.filter(rec => 
        rec.includes('Critical') || rec.includes('immediate attention')
      );
      
      expect(criticalRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Render Performance Monitoring', () => {
    test('should track render times', () => {
      const startTime = performance.now();
      
      // Simulate render operation
      setTimeout(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        performanceMonitor.recordMetric({
          name: 'render_time',
          value: renderTime,
          unit: 'ms',
          category: 'render'
        });
      }, 20); // Simulate 20ms render

      const report = performanceMonitor.getReport();
      expect(report.summary.averageRenderTime).toBeGreaterThan(0);
    });

    test('should detect slow renders', () => {
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 50, // 50ms render time
        unit: 'ms',
        category: 'render'
      });

      const report = performanceMonitor.getReport();
      const renderRecommendations = report.recommendations.filter(rec => 
        rec.includes('render') || rec.includes('Render')
      );
      
      expect(renderRecommendations.length).toBeGreaterThan(0);
    });

    test('should identify performance bottlenecks', () => {
      // Record multiple slow operations
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 100,
        unit: 'ms',
        category: 'render'
      });

      performanceMonitor.recordMetric({
        name: 'search_time',
        value: 500,
        unit: 'ms',
        category: 'user'
      });

      const report = performanceMonitor.getReport();
      expect(report.summary.slowestOperation).toBeDefined();
      expect(report.summary.fastestOperation).toBeDefined();
    });
  });

  describe('Network Performance Monitoring', () => {
    test('should track network requests', () => {
      performanceMonitor.recordMetric({
        name: 'network_request',
        value: 200,
        unit: 'ms',
        category: 'network',
        metadata: {
          url: '/api/notes',
          method: 'GET',
          status: 200
        }
      });

      const report = performanceMonitor.getReport();
      const networkMetrics = report.metrics.filter(m => m.category === 'network');
      expect(networkMetrics.length).toBeGreaterThan(0);
    });

    test('should detect slow network connections', () => {
      performanceMonitor.recordMetric({
        name: 'network_speed',
        value: 0.5, // 0.5 Mbps
        unit: 'Mbps',
        category: 'network'
      });

      const report = performanceMonitor.getReport();
      const networkRecommendations = report.recommendations.filter(rec => 
        rec.includes('network') || rec.includes('connection')
      );
      
      expect(networkRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Thresholds', () => {
    test('should trigger warnings for exceeded thresholds', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Exceed render time threshold
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 40, // Exceeds 33ms threshold
        unit: 'ms',
        category: 'render'
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should trigger errors for critical thresholds', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Exceed memory threshold
      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: 600 * 1024 * 1024, // 600MB - exceeds 500MB threshold
        unit: 'bytes',
        category: 'memory'
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Utilities', () => {
    test('should measure async operations', async () => {
      const asyncOperation = () => new Promise(resolve => setTimeout(resolve, 50));
      
      const result = await PerformanceUtils.measureAsync('test_operation', asyncOperation);
      
      expect(result.duration).toBeGreaterThan(0);
      expect(result.name).toBe('test_operation');
    });

    test('should measure sync operations', () => {
      const syncOperation = () => {
        const start = performance.now();
        while (performance.now() - start < 10) {
          // Busy wait for 10ms
        }
      };
      
      const result = PerformanceUtils.measureSync('test_sync', syncOperation);
      
      expect(result.duration).toBeGreaterThan(0);
      expect(result.name).toBe('test_sync');
    });

    test('should check if performance is acceptable', () => {
      // Set good performance metrics
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 10, // Good render time
        unit: 'ms',
        category: 'render'
      });

      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: 50 * 1024 * 1024, // Good memory usage
        unit: 'bytes',
        category: 'memory'
      });

      expect(PerformanceUtils.isPerformanceAcceptable()).toBe(true);
    });

    test('should detect unacceptable performance', () => {
      // Set poor performance metrics
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 50, // Poor render time
        unit: 'ms',
        category: 'render'
      });

      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: 150 * 1024 * 1024, // Poor memory usage
        unit: 'bytes',
        category: 'memory'
      });

      expect(PerformanceUtils.isPerformanceAcceptable()).toBe(false);
    });
  });

  describe('Memory Management', () => {
    test('should limit metrics storage', () => {
      // Add many metrics to test limit
      for (let i = 0; i < 1100; i++) {
        performanceMonitor.recordMetric({
          name: `metric_${i}`,
          value: i,
          unit: 'count',
          category: 'user'
        });
      }

      const report = performanceMonitor.getReport();
      expect(report.metrics.length).toBeLessThanOrEqual(1000);
    });

    test('should provide memory cleanup recommendations', () => {
      // Add many metrics
      for (let i = 0; i < 600; i++) {
        performanceMonitor.recordMetric({
          name: `metric_${i}`,
          value: i,
          unit: 'count',
          category: 'user'
        });
      }

      const report = performanceMonitor.getReport();
      const cleanupRecommendations = report.recommendations.filter(rec => 
        rec.includes('clearing') || rec.includes('free memory')
      );
      
      expect(cleanupRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Reporting', () => {
    test('should generate comprehensive reports', () => {
      // Add various metrics
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 15,
        unit: 'ms',
        category: 'render'
      });

      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: 60 * 1024 * 1024,
        unit: 'bytes',
        category: 'memory'
      });

      performanceMonitor.recordMetric({
        name: 'user_interaction',
        value: 100,
        unit: 'ms',
        category: 'user'
      });

      const report = performanceMonitor.getReport();
      
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.timestamp).toBeDefined();
      
      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(report.summary.averageRenderTime).toBeGreaterThan(0);
      expect(report.summary.averageMemoryUsage).toBeGreaterThan(0);
    });

    test('should provide actionable recommendations', () => {
      // Create performance issues
      performanceMonitor.recordMetric({
        name: 'render_time',
        value: 100, // Slow render
        unit: 'ms',
        category: 'render'
      });

      performanceMonitor.recordMetric({
        name: 'memory_usage',
        value: 200 * 1024 * 1024, // High memory
        unit: 'bytes',
        category: 'memory'
      });

      const report = performanceMonitor.getReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      report.recommendations.forEach(rec => {
        expect(rec).toMatch(/consider|implement|optimize|review/i);
      });
    });
  });
}); 