import { useState, useEffect, useCallback } from 'react';

interface UseDebouncedPreviewOptions {
  debounceMs?: number;
  immediateForShortContent?: boolean; // Render immediately for short content
  shortContentThreshold?: number; // Character threshold for immediate rendering
}

interface UseDebouncedPreviewReturn {
  debouncedValue: string;
  isUpdating: boolean;
  lastUpdateTime: number;
  forceUpdate: () => void;
}

/**
 * Custom hook for debounced markdown preview rendering
 * Provides performance optimization and user feedback during live typing
 */
export const useDebouncedPreview = (
  value: string,
  options: UseDebouncedPreviewOptions = {}
): UseDebouncedPreviewReturn => {
  const {
    debounceMs = 500,
    immediateForShortContent = true,
    shortContentThreshold = 100
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  // Force immediate update (useful for programmatic updates)
  const forceUpdate = useCallback(() => {
    setDebouncedValue(value);
    setIsUpdating(false);
    setLastUpdateTime(Date.now());
  }, [value]);

  useEffect(() => {
    // Handle immediate rendering for short content
    if (immediateForShortContent && value.length <= shortContentThreshold) {
      setDebouncedValue(value);
      setIsUpdating(false);
      setLastUpdateTime(Date.now());
      return;
    }

    // Set updating state for longer content
    setIsUpdating(true);
    
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      setIsUpdating(false);
      setLastUpdateTime(Date.now());
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsUpdating(false);
    };
  }, [value, debounceMs, immediateForShortContent, shortContentThreshold]);

  return {
    debouncedValue,
    isUpdating,
    lastUpdateTime,
    forceUpdate
  };
};

/**
 * Enhanced debounced preview hook with performance metrics
 */
export const useEnhancedDebouncedPreview = (
  value: string,
  options: UseDebouncedPreviewOptions & {
    trackPerformance?: boolean;
  } = {}
) => {
  const {
    trackPerformance = false,
    ...debounceOptions
  } = options;

  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  });

  const debouncedResult = useDebouncedPreview(value, debounceOptions);

  // Track performance if enabled
  useEffect(() => {
    if (trackPerformance && !debouncedResult.isUpdating) {
      const renderTime = Date.now() - debouncedResult.lastUpdateTime;
      setPerformanceMetrics(prev => ({
        renderCount: prev.renderCount + 1,
        averageRenderTime: (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1),
        lastRenderTime: renderTime
      }));
    }
  }, [debouncedResult.isUpdating, debouncedResult.lastUpdateTime, trackPerformance]);

  return {
    ...debouncedResult,
    performanceMetrics: trackPerformance ? performanceMetrics : null
  };
}; 