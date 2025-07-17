import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { detectLanguage, getLanguageDisplayName } from '../utils/languageDetection';

interface EnhancedCodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

interface GistResponse {
  html_url: string;
  id: string;
}

// Performance constants
const PERFORMANCE_CONSTANTS = {
  LARGE_BLOCK_THRESHOLD: 1000, // Lines threshold for large blocks
  CHAR_THRESHOLD: 5000, // Character threshold for optimization
  DEBOUNCE_DELAY: 300, // Debounce delay for highlighting
  MAX_HIGHLIGHT_LINES: 500, // Maximum lines to highlight at once
} as const;

// Memoized syntax highlighter component
const MemoizedSyntaxHighlighter = React.memo(SyntaxHighlighter);

const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = ({ 
  children, 
  className = '', 
  language = 'text' 
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightingProgress, setHighlightingProgress] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Extract language from className (format: language-{lang})
  const specifiedLanguage = (className.replace('language-', '') || language).toLowerCase();
  
  // Use automatic detection if no language is specified or if it's 'text'
  const detectedLanguage = useMemo(() => {
    return specifiedLanguage === 'text' || specifiedLanguage === '' 
      ? detectLanguage(children)
      : specifiedLanguage;
  }, [specifiedLanguage, children]);
  
  // Get display name for the language
  const languageDisplayName = useMemo(() => {
    return getLanguageDisplayName(detectedLanguage);
  }, [detectedLanguage]);

  // Performance optimizations
  const isLargeBlock = useMemo(() => {
    const lines = children.split('\n').length;
    const chars = children.length;
    return lines > PERFORMANCE_CONSTANTS.LARGE_BLOCK_THRESHOLD || 
           chars > PERFORMANCE_CONSTANTS.CHAR_THRESHOLD;
  }, [children]);

  const shouldOptimize = useMemo(() => {
    return isLargeBlock && detectedLanguage !== 'text';
  }, [isLargeBlock, detectedLanguage]);

  // Intersection Observer for lazy highlighting
  useEffect(() => {
    if (!shouldOptimize || !containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Delay highlighting to prevent blocking the UI
            setTimeout(() => setShouldHighlight(true), PERFORMANCE_CONSTANTS.DEBOUNCE_DELAY);
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [shouldOptimize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  // Simulate highlighting progress for large blocks
  useEffect(() => {
    if (shouldHighlight && isLargeBlock) {
      const interval = setInterval(() => {
        setHighlightingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [shouldHighlight, isLargeBlock]);

  // Optimized content rendering
  const renderContent = useMemo(() => {
    if (!shouldOptimize || !shouldHighlight) {
      // Show plain text for large blocks that haven't been highlighted yet
      return (
        <pre style={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          borderRadius: '0 0 4px 4px',
          fontSize: '14px',
          lineHeight: '1.4',
          fontFamily: 'monospace',
          overflow: 'auto',
          maxHeight: '400px'
        }}>
          <code>{children}</code>
        </pre>
      );
    }

    // Show progress indicator for large blocks
    if (isLargeBlock && highlightingProgress < 100) {
      return (
        <div style={{
          margin: 0,
          padding: '16px',
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          borderRadius: '0 0 4px 4px',
          fontSize: '14px',
          lineHeight: '1.4',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid transparent',
            borderTop: '2px solid #e2e8f0',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span>Highlighting... {highlightingProgress}%</span>
        </div>
      );
    }

    // Render syntax highlighted content
    return (
      <MemoizedSyntaxHighlighter
        language={detectedLanguage}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 4px 4px',
          fontSize: '14px',
          lineHeight: '1.4'
        }}
        showLineNumbers={isLargeBlock}
        wrapLines={true}
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          textAlign: 'right',
          userSelect: 'none',
          color: '#718096'
        }}
      >
        {children}
      </MemoizedSyntaxHighlighter>
    );
  }, [children, detectedLanguage, shouldOptimize, shouldHighlight, isLargeBlock, highlightingProgress]);

  const handleCopy = useCallback(async () => {
    setIsCopying(true);
    setError(null);
    
    try {
      await navigator.clipboard.writeText(children);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    } finally {
      setIsCopying(false);
    }
  }, [children]);

  // TODO: Integrate with GitHub Gist API for real export functionality.
  const handleExportToGist = useCallback(async () => {
    setIsExporting(true);
    setError(null);
    setExportSuccess(null);
    
    try {
      // Note: In a real implementation, you'd need a GitHub token
      // For now, we'll simulate the API call and show the expected behavior
      const gistData = {
        description: `Code block from ZettelView - ${languageDisplayName}`,
        public: true,
        files: {
          [`code.${detectedLanguage === 'text' ? 'txt' : detectedLanguage}`]: {
            content: children
          }
        }
      };

      // Simulate API call (replace with actual GitHub API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockResponse: GistResponse = {
        html_url: `https://gist.github.com/mock/${Date.now()}`,
        id: `mock-${Date.now()}`
      };

      setExportSuccess(mockResponse.html_url);
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      setError('Failed to export to Gist. Please check your GitHub token.');
    } finally {
      setIsExporting(false);
    }
  }, [children, detectedLanguage, languageDisplayName]);

  // Performance indicator
  const performanceIndicator = useMemo(() => {
    if (!shouldOptimize) return null;
    
    return (
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'rgba(255, 193, 7, 0.9)',
        color: '#000',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontWeight: 'bold'
      }}>
        {isLargeBlock ? 'LARGE' : 'OPT'}
      </div>
    );
  }, [shouldOptimize, isLargeBlock]);

  return (
    <div className="enhanced-code-block" ref={containerRef}>
      {performanceIndicator}
      
      <div className="code-block-header">
        <span className="language-label">{languageDisplayName}</span>
        <div className="code-block-actions">
          <button
            onClick={handleCopy}
            disabled={isCopying}
            className={`action-button copy-button ${copySuccess ? 'success' : ''}`}
            title="Copy to clipboard"
          >
            {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleExportToGist}
            disabled={isExporting}
            className={`action-button export-button ${exportSuccess ? 'success' : ''}`}
            title="Export to Gist (mocked, does not create a real Gist)"
            aria-label="Export code block to GitHub Gist (mocked)"
          >
            {isExporting ? 'Exporting...' : exportSuccess ? 'Exported!' : 'Export to Gist'}
          </button>
        </div>
      </div>
      
      {renderContent}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {exportSuccess && (
        <div className="success-message">
          <a href={exportSuccess} target="_blank" rel="noopener noreferrer">
            View Gist →
          </a>
        </div>
      )}
      
      <style>{`
        .enhanced-code-block {
          position: relative;
          margin: 1rem 0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d3748;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 500;
        }
        
        .language-label {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .code-block-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          background: #4a5568;
          color: #e2e8f0;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-button:hover:not(:disabled) {
          background: #718096;
        }
        
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .action-button.success {
          background: #48bb78;
          color: white;
        }
        
        .error-message {
          padding: 8px 12px;
          background: #fed7d7;
          color: #c53030;
          font-size: 12px;
          border-top: 1px solid #feb2b2;
        }
        
        .success-message {
          padding: 8px 12px;
          background: #c6f6d5;
          color: #2f855a;
          font-size: 12px;
          border-top: 1px solid #9ae6b4;
        }
        
        .success-message a {
          color: #2f855a;
          text-decoration: none;
          font-weight: 500;
        }
        
        .success-message a:hover {
          text-decoration: underline;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default React.memo(EnhancedCodeBlock); 