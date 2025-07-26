import React, { useEffect, useCallback, useMemo, useContext, useState } from 'react';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  category: 'render' | 'network' | 'memory' | 'user' | 'system';
  metadata?: Record<string, any>;
}

export interface PerformanceThreshold {
  name: string;
  threshold: number;
  severity: 'warning' | 'error' | 'critical';
  action?: () => void;
}

export interface PerformanceReport {
  summary: {
    totalMetrics: number;
    averageRenderTime: number;
    averageMemoryUsage: number;
    slowestOperation: string;
    fastestOperation: string;
  };
  metrics: PerformanceMetric[];
  recommendations: string[];
  timestamp: Date;
}

export interface PerformanceMonitor {
  startTimer: (name: string) => void;
  endTimer: (name: string, metadata?: Record<string, any>) => void;
  recordMetric: (metric: Omit<PerformanceMetric, 'timestamp'>) => void;
  getMetrics: (filter?: Partial<PerformanceMetric>) => PerformanceMetric[];
  getReport: () => PerformanceReport;
  clearMetrics: () => void;
  setThreshold: (threshold: PerformanceThreshold) => void;
  getRecommendations: () => string[];
}

class PerformanceMonitorImpl implements PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private thresholds: PerformanceThreshold[] = [];
  private maxMetrics = 1000;

  constructor() {
    this.setupDefaultThresholds();
    this.setupMemoryMonitoring();
    this.setupNetworkMonitoring();
  }

  private setupDefaultThresholds() {
    this.thresholds = [
      {
        name: 'render_time',
        threshold: 16, // 60fps target
        severity: 'warning',
        action: () => this.logPerformanceIssue('Render time exceeded 16ms threshold')
      },
      {
        name: 'render_time',
        threshold: 33, // 30fps minimum
        severity: 'error',
        action: () => this.logPerformanceIssue('Render time exceeded 33ms threshold')
      },
      {
        name: 'memory_usage',
        threshold: 100 * 1024 * 1024, // 100MB
        severity: 'warning',
        action: () => this.logPerformanceIssue('Memory usage exceeded 100MB')
      },
      {
        name: 'memory_usage',
        threshold: 500 * 1024 * 1024, // 500MB
        severity: 'error',
        action: () => this.logPerformanceIssue('Memory usage exceeded 500MB')
      }
    ];
  }

  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric({
          name: 'memory_usage',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: 'memory',
          metadata: {
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          }
        });
      }, 5000); // Check every 5 seconds
    }
  }

  private setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          this.recordMetric({
            name: 'network_speed',
            value: connection.downlink || 0,
            unit: 'Mbps',
            category: 'network',
            metadata: {
              effectiveType: connection.effectiveType,
              rtt: connection.rtt,
              saveData: connection.saveData
            }
          });
        });
      }
    }
  }

  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  endTimer(name: string, metadata?: Record<string, any>): void {
    const startTime = this.timers.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        category: 'render',
        metadata
      });
      this.timers.delete(name);
      this.checkThresholds(name, duration);
    }
  }

  recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);

    // Keep metrics under max limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    this.checkThresholds(metric.name, metric.value);
  }

  getMetrics(filter?: Partial<PerformanceMetric>): PerformanceMetric[] {
    if (!filter) return [...this.metrics];

    return this.metrics.filter(metric => {
      return Object.entries(filter).every(([key, value]) => {
        return (metric as any)[key] === value;
      });
    });
  }

  getReport(): PerformanceReport {
    const renderMetrics = this.metrics.filter(m => m.category === 'render');
    const memoryMetrics = this.metrics.filter(m => m.category === 'memory');

    const renderTimes = renderMetrics.map(m => m.value);
    const memoryUsages = memoryMetrics.map(m => m.value);

    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
      : 0;

    const averageMemoryUsage = memoryUsages.length > 0
      ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      : 0;

    const slowestOperation = renderMetrics.length > 0
      ? renderMetrics.reduce((a, b) => a.value > b.value ? a : b).name
      : 'N/A';

    const fastestOperation = renderMetrics.length > 0
      ? renderMetrics.reduce((a, b) => a.value < b.value ? a : b).name
      : 'N/A';

    return {
      summary: {
        totalMetrics: this.metrics.length,
        averageRenderTime,
        averageMemoryUsage,
        slowestOperation,
        fastestOperation
      },
      metrics: [...this.metrics],
      recommendations: this.getRecommendations(),
      timestamp: new Date()
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  setThreshold(threshold: PerformanceThreshold): void {
    this.thresholds.push(threshold);
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.getReport();

    // Render time recommendations
    if (report.summary.averageRenderTime > 16) {
      recommendations.push('Consider optimizing render performance - average render time exceeds 16ms');
    }

    if (report.summary.averageRenderTime > 33) {
      recommendations.push('Critical: Render performance needs immediate attention - average render time exceeds 33ms');
    }

    // Memory recommendations
    if (report.summary.averageMemoryUsage > 100 * 1024 * 1024) {
      recommendations.push('Consider memory optimization - average usage exceeds 100MB');
    }

    if (report.summary.averageMemoryUsage > 500 * 1024 * 1024) {
      recommendations.push('Critical: Memory usage is very high - consider implementing memory management');
    }

    // Network recommendations
    const networkMetrics = this.metrics.filter(m => m.category === 'network');
    const slowConnections = networkMetrics.filter(m => 
      m.name === 'network_speed' && m.value < 1
    );

    if (slowConnections.length > 0) {
      recommendations.push('Consider optimizing for slow network connections');
    }

    // General recommendations
    if (this.metrics.length > 500) {
      recommendations.push('Consider clearing old performance metrics to free memory');
    }

    return recommendations;
  }

  private checkThresholds(name: string, value: number): void {
    const relevantThresholds = this.thresholds.filter(t => t.name === name);
    
    for (const threshold of relevantThresholds) {
      if (value > threshold.threshold) {
        threshold.action?.();
        this.logPerformanceIssue(
          `${name} exceeded ${threshold.threshold} (${threshold.severity}): ${value}`
        );
      }
    }
  }

  private logPerformanceIssue(message: string): void {
    console.warn(`[Performance] ${message}`);
    // In a real app, you might send this to an analytics service
  }
}

// React performance monitoring hooks
export function usePerformanceTimer(name: string) {
  const monitor = performanceMonitor;
  
  useEffect(() => {
    monitor.startTimer(name);
    return () => {
      monitor.endTimer(name);
    };
  }, [name]);
}

export function usePerformanceMetric() {
  const monitor = performanceMonitor;
  
  return useCallback((metric: Omit<PerformanceMetric, 'timestamp'>) => {
    monitor.recordMetric(metric);
  }, []);
}

// Component performance wrapper
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  metricName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    usePerformanceTimer(metricName);
    return <Component {...props} />;
  });
}

// Performance monitoring context
interface PerformanceContextType {
  monitor: PerformanceMonitor;
  isEnabled: boolean;
  toggleMonitoring: () => void;
}

const PerformanceContext = React.createContext<PerformanceContextType | null>(null);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const monitor = useMemo(() => new PerformanceMonitorImpl(), []);

  const toggleMonitoring = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const value = useMemo(() => ({
    monitor,
    isEnabled,
    toggleMonitoring
  }), [monitor, isEnabled, toggleMonitoring]);

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceMonitor(): PerformanceContextType {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceMonitor must be used within PerformanceProvider');
  }
  return context;
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitorImpl();

// Performance monitoring utilities
export const PerformanceUtils = {
  // Debounce with performance tracking
  debounceWithTracking<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    metricName: string
  ): T {
    let timeoutId: NodeJS.Timeout;
    
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        performanceMonitor.startTimer(metricName);
        try {
          func(...args);
        } finally {
          performanceMonitor.endTimer(metricName);
        }
      }, delay);
    }) as T;
  },

  // Throttle with performance tracking
  throttleWithTracking<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    metricName: string
  ): T {
    let lastCall = 0;
    
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        performanceMonitor.startTimer(metricName);
        try {
          func(...args);
        } finally {
          performanceMonitor.endTimer(metricName);
        }
      }
    }) as T;
  },

  // Measure async operations
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    performanceMonitor.startTimer(name);
    try {
      const result = await operation();
      return result;
    } finally {
      performanceMonitor.endTimer(name);
    }
  },

  // Measure synchronous operations
  measureSync<T>(
    name: string,
    operation: () => T
  ): T {
    performanceMonitor.startTimer(name);
    try {
      return operation();
    } finally {
      performanceMonitor.endTimer(name);
    }
  },

  // Get performance summary
  getSummary(): PerformanceReport['summary'] {
    return performanceMonitor.getReport().summary;
  },

  // Check if performance is acceptable
  isPerformanceAcceptable(): boolean {
    const summary = this.getSummary();
    return summary.averageRenderTime <= 16 && summary.averageMemoryUsage <= 100 * 1024 * 1024;
  }
}; 