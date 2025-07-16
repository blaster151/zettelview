import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsyncErrorBoundary from './AsyncErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Async test error message');
  }
  return <div>Normal async content</div>;
};

// Component that throws an error in useEffect (simulating async error)
const ThrowAsyncError = () => {
  React.useEffect(() => {
    setTimeout(() => {
      throw new Error('Async effect error');
    }, 0);
  }, []);
  return <div>Async component</div>;
};

describe('AsyncErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('renders children when no error occurs', () => {
    render(
      <AsyncErrorBoundary>
        <div>Test async content</div>
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Test async content')).toBeInTheDocument();
  });

  test('renders async error UI when child throws error', () => {
    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data. This might be a network issue or temporary service problem.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  test('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <AsyncErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  test('calls onRetry callback when retry is clicked', () => {
    const onRetry = jest.fn();
    
    render(
      <AsyncErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalled();
  });

  test('resets error state after retry delay', async () => {
    const { rerender } = render(
      <AsyncErrorBoundary retryDelay={100}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Should show retrying state
    expect(screen.getByText('Retrying...')).toBeInTheDocument();

    // Fast-forward time to trigger retry
    jest.advanceTimersByTime(100);

    // Re-render with shouldThrow=false to test recovery
    rerender(
      <AsyncErrorBoundary retryDelay={100}>
        <ThrowError shouldThrow={false} />
      </AsyncErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('Normal async content')).toBeInTheDocument();
    });
  });

  test('tracks retry count and shows attempt information', () => {
    render(
      <AsyncErrorBoundary maxRetries={3}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Connection Error')).toBeInTheDocument();

    // First retry
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    jest.advanceTimersByTime(1000);

    expect(screen.getByText('Attempt 1 of 3')).toBeInTheDocument();
  });

  test('disables retry button after max retries', () => {
    render(
      <AsyncErrorBoundary maxRetries={1}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    jest.advanceTimersByTime(1000);

    expect(screen.getByText('Max Retries Reached')).toBeInTheDocument();
    expect(retryButton).toBeDisabled();
  });

  test('renders custom fallback when provided', () => {
    const customFallback = <div>Custom async error message</div>;
    
    render(
      <AsyncErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Custom async error message')).toBeInTheDocument();
    expect(screen.queryByText('Connection Error')).not.toBeInTheDocument();
  });

  test('renders function fallback with retry function', () => {
    const fallbackFunction = (error: Error, errorInfo: React.ErrorInfo, retry: () => void) => (
      <div>
        <p>Custom async error: {error.message}</p>
        <button onClick={retry}>Custom Retry</button>
      </div>
    );
    
    render(
      <AsyncErrorBoundary fallback={fallbackFunction}>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Custom async error: Async test error message')).toBeInTheDocument();
    expect(screen.getByText('Custom Retry')).toBeInTheDocument();
  });

  test('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    expect(screen.getByText(/Async test error message/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();
    expect(screen.queryByText(/Async test error message/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test('handles async errors in useEffect', () => {
    render(
      <AsyncErrorBoundary>
        <ThrowAsyncError />
      </AsyncErrorBoundary>
    );

    // Fast-forward to trigger the async error
    jest.runAllTimers();

    expect(screen.getByText('Connection Error')).toBeInTheDocument();
  });

  test('reloads page when Reload Page is clicked', () => {
    const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation(() => {});
    
    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    fireEvent.click(reloadButton);

    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });

  test('has proper accessibility attributes', () => {
    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const errorDiv = screen.getByText('Connection Error').closest('div');
    expect(errorDiv).toHaveAttribute('role', 'alert');
    expect(errorDiv).toHaveAttribute('aria-live', 'assertive');
  });

  test('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount } = render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  test('uses default retry delay when not specified', () => {
    render(
      <AsyncErrorBoundary>
        <ThrowError shouldThrow={true} />
      </AsyncErrorBoundary>
    );

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Should show retrying state
    expect(screen.getByText('Retrying...')).toBeInTheDocument();

    // Fast-forward default delay (1000ms)
    jest.advanceTimersByTime(1000);

    // Should be ready for next retry
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
}); 