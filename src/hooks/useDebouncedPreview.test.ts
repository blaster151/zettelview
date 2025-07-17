import { renderHook, act } from '@testing-library/react';
import { useDebouncedPreview, useEnhancedDebouncedPreview } from './useDebouncedPreview';

// Mock timers for testing
jest.useFakeTimers();

describe('useDebouncedPreview', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedPreview(value, { debounceMs: 500 }),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current.debouncedValue).toBe('initial');
    expect(result.current.isUpdating).toBe(false);

    // Update value
    rerender({ value: 'updated' });
    expect(result.current.isUpdating).toBe(true);
    expect(result.current.debouncedValue).toBe('initial'); // Still old value

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.debouncedValue).toBe('updated');
    expect(result.current.isUpdating).toBe(false);
  });

  test('should render short content immediately', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedPreview(value, { 
        debounceMs: 500,
        immediateForShortContent: true,
        shortContentThreshold: 50
      }),
      { initialProps: { value: 'short' } }
    );

    expect(result.current.debouncedValue).toBe('short');
    expect(result.current.isUpdating).toBe(false);

    // Update with short content
    rerender({ value: 'still short' });
    expect(result.current.debouncedValue).toBe('still short');
    expect(result.current.isUpdating).toBe(false);
  });

  test('should debounce long content even with immediate option', () => {
    const longContent = 'a'.repeat(200); // Longer than threshold
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedPreview(value, { 
        debounceMs: 500,
        immediateForShortContent: true,
        shortContentThreshold: 100
      }),
      { initialProps: { value: 'short' } }
    );

    // Update with long content
    rerender({ value: longContent });
    expect(result.current.isUpdating).toBe(true);
    expect(result.current.debouncedValue).toBe('short'); // Still old value

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.debouncedValue).toBe(longContent);
    expect(result.current.isUpdating).toBe(false);
  });

  test('should handle force update', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedPreview(value, { debounceMs: 1000 }),
      { initialProps: { value: 'initial' } }
    );

    // Update value
    rerender({ value: 'updated' });
    expect(result.current.isUpdating).toBe(true);

    // Force update
    act(() => {
      result.current.forceUpdate();
    });

    expect(result.current.debouncedValue).toBe('updated');
    expect(result.current.isUpdating).toBe(false);
  });

  test('should track last update time', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedPreview(value, { debounceMs: 100 }),
      { initialProps: { value: 'initial' } }
    );

    const initialTime = result.current.lastUpdateTime;

    // Update value
    rerender({ value: 'updated' });

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.lastUpdateTime).toBeGreaterThan(initialTime);
  });

  test('should cancel previous timer on new updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedPreview(value, { debounceMs: 500 }),
      { initialProps: { value: 'initial' } }
    );

    // Multiple rapid updates
    rerender({ value: 'update1' });
    rerender({ value: 'update2' });
    rerender({ value: 'update3' });

    expect(result.current.isUpdating).toBe(true);
    expect(result.current.debouncedValue).toBe('initial');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should only have the last value
    expect(result.current.debouncedValue).toBe('update3');
    expect(result.current.isUpdating).toBe(false);
  });
});

describe('useEnhancedDebouncedPreview', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should track performance metrics when enabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useEnhancedDebouncedPreview(value, { 
        debounceMs: 100,
        trackPerformance: true
      }),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current.performanceMetrics).toBeNull(); // No metrics yet

    // Update value
    rerender({ value: 'updated' });

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.performanceMetrics).not.toBeNull();
    expect(result.current.performanceMetrics?.renderCount).toBe(1);
    expect(result.current.performanceMetrics?.lastRenderTime).toBeGreaterThan(0);
  });

  test('should not track performance when disabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useEnhancedDebouncedPreview(value, { 
        debounceMs: 100,
        trackPerformance: false
      }),
      { initialProps: { value: 'initial' } }
    );

    // Update value
    rerender({ value: 'updated' });

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.performanceMetrics).toBeNull();
  });

  test('should calculate average render time correctly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useEnhancedDebouncedPreview(value, { 
        debounceMs: 50,
        trackPerformance: true
      }),
      { initialProps: { value: 'initial' } }
    );

    // Multiple updates
    for (let i = 1; i <= 3; i++) {
      rerender({ value: `update${i}` });
      
      act(() => {
        jest.advanceTimersByTime(50);
      });
    }

    expect(result.current.performanceMetrics?.renderCount).toBe(3);
    expect(result.current.performanceMetrics?.averageRenderTime).toBeGreaterThan(0);
  });
}); 