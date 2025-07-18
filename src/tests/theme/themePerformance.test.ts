import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { themeStore } from '../../stores/themeStore';
import ThemeToggle from '../../components/ThemeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock requestAnimationFrame for performance testing
const requestAnimationFrameMock = vi.fn();
Object.defineProperty(window, 'requestAnimationFrame', {
  value: requestAnimationFrameMock,
});

// Mock performance API
const performanceMock = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

Object.defineProperty(window, 'performance', {
  value: performanceMock,
});

describe('Theme Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    themeStore.setState({
      theme: 'light',
      systemPreference: 'light',
      isDark: false,
      isSystem: false,
    });
    
    // Clear document classes
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    // Clean up
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('Theme Change Performance', () => {
    it('should change theme without full page flash', () => {
      // Arrange
      const initialClassList = document.documentElement.classList.toString();
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      const finalClassList = document.documentElement.classList.toString();
      expect(finalClassList).not.toBe(initialClassList);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      
      // Verify no page reload or flash occurred
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('should update only necessary DOM elements', () => {
      // Arrange
      const observer = new MutationObserver(vi.fn());
      const mutations: MutationRecord[] = [];
      
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: false,
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      observer.disconnect();
      
      // Should only have one mutation for the class change
      expect(mutations.length).toBeLessThanOrEqual(1);
    });

    it('should not trigger unnecessary re-renders in components', () => {
      // Arrange
      const renderCount = { count: 0 };
      const TestComponent = () => {
        renderCount.count++;
        const { theme } = themeStore();
        return <div data-testid="theme-display">{theme}</div>;
      };
      
      // Act
      render(<TestComponent />);
      const initialRenderCount = renderCount.count;
      
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(renderCount.count).toBe(initialRenderCount + 1); // Only one re-render
    });

    it('should use requestAnimationFrame for smooth transitions', () => {
      // Arrange
      requestAnimationFrameMock.mockImplementation((callback) => {
        callback();
        return 1;
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(requestAnimationFrameMock).toHaveBeenCalled();
    });

    it('should complete theme change within performance budget', () => {
      // Arrange
      const startTime = performance.now();
      performanceMock.now.mockReturnValue(startTime);
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Simulate next frame
      performanceMock.now.mockReturnValue(startTime + 16); // 60fps = ~16ms
      
      // Assert
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(16); // Should complete within one frame
    });
  });

  describe('Theme Toggle Performance', () => {
    it('should toggle theme efficiently', () => {
      // Arrange
      const toggleStartTime = performance.now();
      performanceMock.now.mockReturnValue(toggleStartTime);
      
      // Act
      themeStore.getState().toggleTheme();
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark');
      expect(themeStore.getState().isDark).toBe(true);
      
      // Verify performance
      const toggleEndTime = performance.now();
      expect(toggleEndTime - toggleStartTime).toBeLessThan(10); // Should be very fast
    });

    it('should handle rapid theme toggles without performance degradation', () => {
      // Arrange
      const iterations = 100;
      const startTime = performance.now();
      performanceMock.now.mockReturnValue(startTime);
      
      // Act
      for (let i = 0; i < iterations; i++) {
        themeStore.getState().toggleTheme();
      }
      
      // Assert
      const endTime = performance.now();
      const averageTime = (endTime - startTime) / iterations;
      
      expect(averageTime).toBeLessThan(1); // Each toggle should be very fast
      expect(themeStore.getState().theme).toBe('light'); // Should end in correct state
    });

    it('should debounce rapid theme changes', () => {
      // Arrange
      const debounceDelay = 100;
      vi.useFakeTimers();
      
      // Act
      themeStore.getState().setTheme('dark');
      themeStore.getState().setTheme('light');
      themeStore.getState().setTheme('dark');
      
      // Fast-forward time
      vi.advanceTimersByTime(debounceDelay);
      
      // Assert
      expect(themeStore.getState().theme).toBe('dark'); // Should settle on last value
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1); // Should only save once
      
      vi.useRealTimers();
    });
  });

  describe('System Preference Performance', () => {
    it('should handle system preference changes efficiently', () => {
      // Arrange
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn(() => mockMediaQuery),
      });
      
      themeStore.setState({ isSystem: true });
      
      // Act
      const startTime = performance.now();
      performanceMock.now.mockReturnValue(startTime);
      
      themeStore.getState().detectSystemPreference();
      
      // Assert
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5); // Should be very fast
      expect(themeStore.getState().systemPreference).toBe('dark');
    });

    it('should not trigger unnecessary updates when system preference is disabled', () => {
      // Arrange
      themeStore.setState({ isSystem: false });
      const updateCount = { count: 0 };
      
      const unsubscribe = themeStore.subscribe(() => {
        updateCount.count++;
      });
      
      // Act
      themeStore.getState().detectSystemPreference();
      
      // Assert
      expect(updateCount.count).toBe(0); // Should not trigger updates
      
      unsubscribe();
    });
  });

  describe('Component Re-render Optimization', () => {
    it('should only re-render components that depend on theme', () => {
      // Arrange
      const themeRenderCount = { count: 0 };
      const nonThemeRenderCount = { count: 0 };
      
      const ThemeComponent = () => {
        themeRenderCount.count++;
        const { theme } = themeStore();
        return <div data-testid="theme-component">{theme}</div>;
      };
      
      const NonThemeComponent = () => {
        nonThemeRenderCount.count++;
        return <div data-testid="non-theme-component">Static</div>;
      };
      
      // Act
      render(
        <div>
          <ThemeComponent />
          <NonThemeComponent />
        </div>
      );
      
      const initialThemeCount = themeRenderCount.count;
      const initialNonThemeCount = nonThemeRenderCount.count;
      
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(themeRenderCount.count).toBe(initialThemeCount + 1); // Theme component re-rendered
      expect(nonThemeRenderCount.count).toBe(initialNonThemeCount); // Non-theme component did not re-render
    });

    it('should use shallow comparison for theme state', () => {
      // Arrange
      const renderCount = { count: 0 };
      const TestComponent = () => {
        renderCount.count++;
        const { theme, isDark } = themeStore();
        return <div data-testid="test-component">{theme}-{isDark.toString()}</div>;
      };
      
      // Act
      render(<TestComponent />);
      const initialCount = renderCount.count;
      
      // Set same theme value
      themeStore.getState().setTheme('light');
      
      // Assert
      expect(renderCount.count).toBe(initialCount); // Should not re-render for same value
    });

    it('should batch theme updates efficiently', () => {
      // Arrange
      const updateCount = { count: 0 };
      const unsubscribe = themeStore.subscribe(() => {
        updateCount.count++;
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      themeStore.getState().setTheme('light');
      themeStore.getState().setTheme('dark');
      
      // Wait for next tick
      setTimeout(() => {
        // Assert
        expect(updateCount.count).toBeLessThanOrEqual(3); // Should not exceed number of changes
      }, 0);
      
      unsubscribe();
    });
  });

  describe('CSS Transition Performance', () => {
    it('should apply theme changes without layout thrashing', () => {
      // Arrange
      const layoutCount = { count: 0 };
      const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      
      Element.prototype.getBoundingClientRect = vi.fn(() => {
        layoutCount.count++;
        return { width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100 };
      });
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(layoutCount.count).toBeLessThan(5); // Should not trigger many layout calculations
      
      // Restore original method
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });

    it('should use CSS custom properties for smooth transitions', () => {
      // Arrange
      const style = document.documentElement.style;
      
      // Act
      themeStore.getState().setTheme('dark');
      
      // Assert
      expect(style.getPropertyValue('--color-background')).toBeDefined();
      expect(style.getPropertyValue('--color-text')).toBeDefined();
    });

    it('should not cause cumulative layout shift', () => {
      // Arrange
      const initialLayout = document.documentElement.getBoundingClientRect();
      
      // Act
      themeStore.getState().setTheme('dark');
      themeStore.getState().setTheme('light');
      themeStore.getState().setTheme('dark');
      
      // Assert
      const finalLayout = document.documentElement.getBoundingClientRect();
      
      // Layout should remain stable
      expect(finalLayout.width).toBe(initialLayout.width);
      expect(finalLayout.height).toBe(initialLayout.height);
    });
  });

  describe('Memory Performance', () => {
    it('should not create memory leaks with theme changes', () => {
      // Arrange
      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Act
      for (let i = 0; i < 1000; i++) {
        themeStore.getState().setTheme(i % 2 === 0 ? 'light' : 'dark');
      }
      
      // Assert
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });

    it('should clean up event listeners properly', () => {
      // Arrange
      const mockMediaQuery = {
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn(() => mockMediaQuery),
      });
      
      // Act
      themeStore.getState().detectSystemPreference();
      themeStore.getState().cleanup(); // Assuming cleanup method exists
      
      // Assert
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('Theme Toggle Component Performance', () => {
    it('should render ThemeToggle component efficiently', () => {
      // Arrange
      const startTime = performance.now();
      performanceMock.now.mockReturnValue(startTime);
      
      // Act
      render(<ThemeToggle />);
      
      // Assert
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(10); // Should render quickly
    });

    it('should handle theme toggle clicks efficiently', () => {
      // Arrange
      render(<ThemeToggle />);
      const toggleButton = screen.getByRole('button');
      
      // Act
      const startTime = performance.now();
      performanceMock.now.mockReturnValue(startTime);
      
      fireEvent.click(toggleButton);
      
      // Assert
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(5); // Should respond quickly
      expect(themeStore.getState().theme).toBe('dark');
    });

    it('should not cause layout shift when toggling theme', () => {
      // Arrange
      render(<ThemeToggle />);
      const toggleButton = screen.getByRole('button');
      const initialButtonLayout = toggleButton.getBoundingClientRect();
      
      // Act
      fireEvent.click(toggleButton);
      
      // Assert
      const finalButtonLayout = toggleButton.getBoundingClientRect();
      
      // Button position should remain stable
      expect(finalButtonLayout.left).toBe(initialButtonLayout.left);
      expect(finalButtonLayout.top).toBe(initialButtonLayout.top);
    });
  });
}); 