import React, { Component, ErrorInfo, ReactNode } from 'react';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  retryDelay?: number;
  maxRetries?: number;
}

interface AsyncErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isRetrying: boolean;
}

class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: AsyncErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AsyncErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    const { retryDelay = 1000, maxRetries = 3, onRetry } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('Max retries reached');
      return;
    }

    this.setState({ isRetrying: true });

    // Call the onRetry callback if provided
    if (onRetry) {
      onRetry();
    }

    // Reset error state after delay
    this.retryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: retryCount + 1,
        isRetrying: false
      });
    }, retryDelay);
  };

  render() {
    const { hasError, error, errorInfo, retryCount, isRetrying } = this.state;
    const { fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error!, errorInfo!, this.handleRetry);
        }
        return fallback;
      }

      // Default async error UI
      return (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{
            padding: '24px',
            margin: '16px',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🔄</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
              Connection Error
            </h3>
          </div>
          
          <p style={{ margin: '0 0 16px 0', lineHeight: '1.5' }}>
            Failed to load data. This might be a network issue or temporary service problem.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                Error Details (Development)
              </summary>
              <pre style={{
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                border: '1px solid #e1e4e8'
              }}>
                <strong>Error:</strong> {error.message}
                {errorInfo && (
                  <>
                    {'\n\n'}
                    <strong>Component Stack:</strong>
                    {'\n'}
                    {errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={this.handleRetry}
              disabled={isRetrying || retryCount >= maxRetries}
              style={{
                background: isRetrying || retryCount >= maxRetries ? '#6c757d' : '#ffc107',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: isRetrying || retryCount >= maxRetries ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isRetrying || retryCount >= maxRetries ? 0.6 : 1
              }}
            >
              {isRetrying ? 'Retrying...' : retryCount >= maxRetries ? 'Max Retries Reached' : 'Retry'}
            </button>
            
            {retryCount > 0 && (
              <span style={{ fontSize: '12px', color: '#6c757d' }}>
                Attempt {retryCount} of {maxRetries}
              </span>
            )}
            
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AsyncErrorBoundary; 