import React, { useState, useEffect, useRef } from 'react';
import { performanceOptimizationService, PerformanceMetrics, CacheConfig, PerformanceThresholds } from '../services/performanceOptimizationService';

interface PerformanceChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
  }[];
}

const PerformanceOptimizationDemo: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [cacheStats, setCacheStats] = useState(performanceOptimizationService.getCacheStats());
  const [performanceSummary, setPerformanceSummary] = useState(performanceOptimizationService.getPerformanceSummary());
  const [analytics, setAnalytics] = useState(performanceOptimizationService.getPerformanceAnalytics());
  const [cacheConfig, setCacheConfig] = useState<CacheConfig>({
    maxSize: 1000,
    ttl: 5 * 60 * 1000,
    strategy: 'lru'
  });
  const [thresholds, setThresholds] = useState<PerformanceThresholds>({
    pageLoadTime: 2000,
    searchResponseTime: 500,
    renderTime: 100,
    memoryUsage: 50 * 1024 * 1024
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'cache' | 'optimization' | 'analytics'>('metrics');
  const [testResults, setTestResults] = useState<{ [key: string]: number }>({});
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Start performance monitoring
    performanceOptimizationService.startPerformanceMonitoring();
    setIsMonitoring(true);

    // Set up periodic updates
    const interval = setInterval(() => {
      updateMetrics();
    }, 2000);

    return () => {
      clearInterval(interval);
      performanceOptimizationService.cleanup();
    };
  }, []);

  useEffect(() => {
    // Update cache config when it changes
    performanceOptimizationService.updateCacheConfig(cacheConfig);
  }, [cacheConfig]);

  useEffect(() => {
    // Update thresholds when they change
    performanceOptimizationService.updateThresholds(thresholds);
  }, [thresholds]);

  const updateMetrics = () => {
    const recentMetrics = performanceOptimizationService.getPerformanceMetrics('hour');
    setMetrics(recentMetrics);
    setCacheStats(performanceOptimizationService.getCacheStats());
    setPerformanceSummary(performanceOptimizationService.getPerformanceSummary());
    setAnalytics(performanceOptimizationService.getPerformanceAnalytics());
  };

  const runPerformanceTest = async (testType: string) => {
    const startTime = performance.now();
    
    switch (testType) {
      case 'search':
        // Simulate search operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        break;
      case 'render':
        // Simulate render operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        break;
      case 'cache':
        // Test cache operations
        for (let i = 0; i < 100; i++) {
          performanceOptimizationService.setCache(`test-${i}`, { data: `value-${i}` });
          performanceOptimizationService.getCache(`test-${i}`);
        }
        break;
      case 'memory':
        // Simulate memory-intensive operation
        const largeArray = new Array(1000000).fill(0);
        largeArray.forEach((_, i) => largeArray[i] = Math.random());
        break;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setTestResults(prev => ({
      ...prev,
      [testType]: duration
    }));

    // Record the metric
    performanceOptimizationService.recordMetric(
      testType === 'search' ? 'searchResponseTime' : 'renderTime',
      duration
    );
  };

  const clearCache = () => {
    performanceOptimizationService.clearCache();
    updateMetrics();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceColor = (value: number, threshold: number): string => {
    if (value <= threshold * 0.7) return 'text-green-600';
    if (value <= threshold) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, threshold: number): string => {
    if (value <= threshold * 0.7) return '✅';
    if (value <= threshold) return '⚠️';
    return '❌';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Performance Optimization Demo
        </h1>
        <p className="text-gray-600">
          Monitor and optimize application performance with real-time metrics, caching, and analytics
        </p>
      </div>

      {/* Status Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={updateMetrics}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={clearCache}
              className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'metrics', label: 'Real-time Metrics', icon: '📊' },
              { id: 'cache', label: 'Cache Management', icon: '💾' },
              { id: 'optimization', label: 'Optimization Tools', icon: '⚡' },
              { id: 'analytics', label: 'Analytics', icon: '📈' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Real-time Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Page Load Time</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(performanceSummary.averageLoadTime, thresholds.pageLoadTime)}`}>
                        {formatTime(performanceSummary.averageLoadTime)}
                      </p>
                    </div>
                    <span className="text-2xl">{getStatusIcon(performanceSummary.averageLoadTime, thresholds.pageLoadTime)}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Threshold: {formatTime(thresholds.pageLoadTime)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Search Response</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(performanceSummary.averageSearchTime, thresholds.searchResponseTime)}`}>
                        {formatTime(performanceSummary.averageSearchTime)}
                      </p>
                    </div>
                    <span className="text-2xl">{getStatusIcon(performanceSummary.averageSearchTime, thresholds.searchResponseTime)}</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Threshold: {formatTime(thresholds.searchResponseTime)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Render Time</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(performanceSummary.averageRenderTime, thresholds.renderTime)}`}>
                        {formatTime(performanceSummary.averageRenderTime)}
                      </p>
                    </div>
                    <span className="text-2xl">{getStatusIcon(performanceSummary.averageRenderTime, thresholds.renderTime)}</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">
                    Threshold: {formatTime(thresholds.renderTime)}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600">Memory Usage</p>
                      <p className={`text-2xl font-bold ${getPerformanceColor(performanceSummary.averageMemoryUsage, thresholds.memoryUsage)}`}>
                        {formatBytes(performanceSummary.averageMemoryUsage)}
                      </p>
                    </div>
                    <span className="text-2xl">{getStatusIcon(performanceSummary.averageMemoryUsage, thresholds.memoryUsage)}</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Threshold: {formatBytes(thresholds.memoryUsage)}
                  </p>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends (Last Hour)</h3>
                <canvas ref={chartRef} className="w-full h-64"></canvas>
              </div>

              {/* Recent Metrics Table */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Metrics</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Load Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Search Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Render Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Memory</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cache Hit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {metrics.slice(-10).reverse().map((metric, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {metric.timestamp.toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatTime(metric.pageLoadTime)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatTime(metric.searchResponseTime)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatTime(metric.renderTime)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatBytes(metric.memoryUsage)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {(metric.cacheHitRate * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Cache Management Tab */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cache Statistics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cache Statistics</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cache Size:</span>
                      <span className="text-sm font-medium">{cacheStats.size} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hit Rate:</span>
                      <span className="text-sm font-medium">{(cacheStats.hitRate * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Memory Usage:</span>
                      <span className="text-sm font-medium">{formatBytes(cacheStats.memoryUsage)}</span>
                    </div>
                  </div>
                </div>

                {/* Cache Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cache Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Size
                      </label>
                      <input
                        type="number"
                        value={cacheConfig.maxSize}
                        onChange={(e) => setCacheConfig({
                          ...cacheConfig,
                          maxSize: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        TTL (minutes)
                      </label>
                      <input
                        type="number"
                        value={cacheConfig.ttl / (60 * 1000)}
                        onChange={(e) => setCacheConfig({
                          ...cacheConfig,
                          ttl: parseInt(e.target.value) * 60 * 1000
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Strategy
                      </label>
                      <select
                        value={cacheConfig.strategy}
                        onChange={(e) => setCacheConfig({
                          ...cacheConfig,
                          strategy: e.target.value as any
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="lru">LRU (Least Recently Used)</option>
                        <option value="lfu">LFU (Least Frequently Used)</option>
                        <option value="fifo">FIFO (First In, First Out)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cache Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cache Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={clearCache}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Clear All Cache
                    </button>
                    <button
                      onClick={() => {
                        // Test cache performance
                        runPerformanceTest('cache');
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Test Cache Performance
                    </button>
                    <button
                      onClick={() => {
                        // Fill cache with test data
                        for (let i = 0; i < 100; i++) {
                          performanceOptimizationService.setCache(`demo-${i}`, {
                            id: i,
                            data: `Test data ${i}`,
                            timestamp: new Date()
                          });
                        }
                        updateMetrics();
                      }}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Fill Cache with Test Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Optimization Tools Tab */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Thresholds */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Thresholds</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Load Time (ms)
                      </label>
                      <input
                        type="number"
                        value={thresholds.pageLoadTime}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          pageLoadTime: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Response Time (ms)
                      </label>
                      <input
                        type="number"
                        value={thresholds.searchResponseTime}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          searchResponseTime: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Render Time (ms)
                      </label>
                      <input
                        type="number"
                        value={thresholds.renderTime}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          renderTime: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Memory Usage (bytes)
                      </label>
                      <input
                        type="number"
                        value={thresholds.memoryUsage}
                        onChange={(e) => setThresholds({
                          ...thresholds,
                          memoryUsage: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Tests */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Tests</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'search', label: 'Search Performance', color: 'bg-blue-600' },
                      { key: 'render', label: 'Render Performance', color: 'bg-green-600' },
                      { key: 'cache', label: 'Cache Performance', color: 'bg-purple-600' },
                      { key: 'memory', label: 'Memory Performance', color: 'bg-orange-600' }
                    ].map(test => (
                      <div key={test.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{test.label}</p>
                          {testResults[test.key] && (
                            <p className="text-sm text-gray-600">
                              {formatTime(testResults[test.key])}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => runPerformanceTest(test.key)}
                          className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${test.color}`}
                        >
                          Run Test
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optimization Recommendations */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Optimization Recommendations</h3>
                <div className="space-y-2">
                  {analytics.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600">💡</span>
                      <p className="text-sm text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Bottlenecks */}
              {analytics.bottlenecks.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">Performance Bottlenecks</h3>
                  <div className="space-y-2">
                    {analytics.bottlenecks.map((bottleneck, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-red-600">⚠️</span>
                        <p className="text-sm text-red-800">{bottleneck}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Trends */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <canvas className="w-full h-48"></canvas>
                  </div>
                </div>

                {/* Cache Analytics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cache Analytics</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Requests:</span>
                        <span className="text-sm font-medium">{performanceSummary.totalRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cache Hit Rate:</span>
                        <span className="text-sm font-medium">{(performanceSummary.cacheHitRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Load Time:</span>
                        <span className="text-sm font-medium">{formatTime(performanceSummary.averageLoadTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Average Search Time:</span>
                        <span className="text-sm font-medium">{formatTime(performanceSummary.averageSearchTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-white rounded-lg border">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatTime(performanceSummary.averageLoadTime)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Load Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatTime(performanceSummary.averageSearchTime)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Search Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatTime(performanceSummary.averageRenderTime)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Render Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatBytes(performanceSummary.averageMemoryUsage)}
                      </div>
                      <div className="text-sm text-gray-600">Avg Memory Usage</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              performanceOptimizationService.cleanup();
              updateMetrics();
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            🧹 Cleanup Resources
          </button>
          <button
            onClick={() => {
              // Simulate performance warning
              performanceOptimizationService.recordMetric('pageLoadTime', 3000);
              updateMetrics();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            ⚠️ Simulate Warning
          </button>
          <button
            onClick={() => {
              // Reset all metrics
              setMetrics([]);
              setTestResults({});
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            🔄 Reset Metrics
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizationDemo; 