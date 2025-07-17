import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import EnhancedCodeBlock from './EnhancedCodeBlock';
import GistEmbed from './GistEmbed';
import { useDebouncedPreview } from '../hooks/useDebouncedPreview';

// Error boundary for markdown preview
class MarkdownErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Markdown preview error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{
            padding: '16px',
            border: '1px solid #dc3545',
            borderRadius: '4px',
            backgroundColor: '#f8d7da',
            color: '#721c24'
          }}
        >
          <h3>Markdown Preview Error</h3>
          <p>There was an error rendering the markdown preview. Please check your markdown syntax.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const INTERNAL_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;
const GIST_URL_PATTERN = /^https?:\/\/gist\.github\.com\/[^\/]+\/[a-f0-9]+$/i;

const isValidGistUrl = (url: string): boolean => {
  return GIST_URL_PATTERN.test(url);
};

const parseInternalLinks = (text: string): Array<{ type: 'text' | 'link'; content: string; noteTitle?: string }> => {
  const parts: Array<{ type: 'text' | 'link'; content: string; noteTitle?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = INTERNAL_LINK_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }
    parts.push({
      type: 'link',
      content: match[0],
      noteTitle: match[1].trim()
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }
  return parts;
};

interface MarkdownPreviewProps {
  markdown: string;
  onInternalLinkClick?: (noteTitle: string) => void;
  debounceMs?: number;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ 
  markdown, 
  onInternalLinkClick,
  debounceMs = 500
}) => {
  // Use the debounced preview hook
  const { debouncedValue, isUpdating } = useDebouncedPreview(markdown, {
    debounceMs,
    immediateForShortContent: true,
    shortContentThreshold: 200 // Render short content immediately
  });

  // Custom component for internal links
  const InternalLink: React.FC<{ children: string; noteTitle: string }> = React.memo(({ children, noteTitle }) => {
    const handleClick = useCallback(() => {
      if (onInternalLinkClick) onInternalLinkClick(noteTitle);
    }, [noteTitle, onInternalLinkClick]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    }, [handleClick]);

    return (
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          background: 'none',
          border: 'none',
          color: '#007bff',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '3px',
          fontFamily: 'inherit',
          fontSize: 'inherit'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label={`Link to note: ${noteTitle}`}
      >
        {children}
      </button>
    );
  });

  // Markdown components
  const markdownComponents: Components = useMemo(() => ({
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      if (language) {
        return (
          <EnhancedCodeBlock language={language}>
            {children as string}
          </EnhancedCodeBlock>
        );
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }) => {
      if (typeof children === 'string') {
        const parts = parseInternalLinks(children);
        return (
          <p>
            {parts.map((part, index) => {
              if (part.type === 'link' && part.noteTitle) {
                return <InternalLink key={index} noteTitle={part.noteTitle}>{part.content}</InternalLink>;
              }
              return <span key={index}>{part.content}</span>;
            })}
          </p>
        );
      }
      return <p>{children}</p>;
    },
    a: ({ href, children }) => {
      if (href && typeof href === 'string' && isValidGistUrl(href)) {
        return <GistEmbed url={href} />;
      }
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`External link: ${typeof children === 'string' ? children : 'Link'}`}
        >
          {children}
        </a>
      );
    },
    // Enhanced table support
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', margin: '16px 0' }}>
        <table style={{
          borderCollapse: 'collapse',
          width: '100%',
          border: '1px solid #e1e4e8',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead style={{ backgroundColor: '#f6f8fa' }}>
        {children}
      </thead>
    ),
    tbody: ({ children }) => (
      <tbody>
        {children}
      </tbody>
    ),
    tr: ({ children }) => (
      <tr style={{ borderBottom: '1px solid #e1e4e8' }}>
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th style={{
        padding: '12px 16px',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: '14px',
        color: '#24292e',
        borderBottom: '2px solid #e1e4e8'
      }}>
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td style={{
        padding: '12px 16px',
        fontSize: '14px',
        color: '#24292e',
        borderBottom: '1px solid #e1e4e8'
      }}>
        {children}
      </td>
    ),
    // Enhanced image support
    img: ({ src, alt, title }) => (
      <div style={{ margin: '16px 0', textAlign: 'center' }}>
        <img
          src={src}
          alt={alt || 'Image'}
          title={title}
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e1e4e8'
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
              padding: 16px;
              background: #f6f8fa;
              border: 1px solid #e1e4e8;
              border-radius: 6px;
              color: #586069;
              text-align: center;
              font-size: 14px;
            `;
            errorDiv.textContent = `Failed to load image: ${alt || src}`;
            e.currentTarget.parentNode?.appendChild(errorDiv);
          }}
        />
        {alt && (
          <div style={{
            marginTop: '8px',
            fontSize: '12px',
            color: '#586069',
            fontStyle: 'italic'
          }}>
            {alt}
          </div>
        )}
      </div>
    ),
    // Enhanced heading support
    h1: ({ children }) => (
      <h1 style={{
        fontSize: '2em',
        fontWeight: '600',
        margin: '24px 0 16px 0',
        paddingBottom: '8px',
        borderBottom: '1px solid #e1e4e8',
        color: '#24292e'
      }}>
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 style={{
        fontSize: '1.5em',
        fontWeight: '600',
        margin: '20px 0 12px 0',
        paddingBottom: '6px',
        borderBottom: '1px solid #e1e4e8',
        color: '#24292e'
      }}>
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 style={{
        fontSize: '1.25em',
        fontWeight: '600',
        margin: '16px 0 8px 0',
        color: '#24292e'
      }}>
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 style={{
        fontSize: '1em',
        fontWeight: '600',
        margin: '12px 0 6px 0',
        color: '#24292e'
      }}>
        {children}
      </h4>
    ),
    h5: ({ children }) => (
      <h5 style={{
        fontSize: '0.875em',
        fontWeight: '600',
        margin: '10px 0 4px 0',
        color: '#24292e'
      }}>
        {children}
      </h5>
    ),
    h6: ({ children }) => (
      <h6 style={{
        fontSize: '0.85em',
        fontWeight: '600',
        margin: '8px 0 4px 0',
        color: '#24292e'
      }}>
        {children}
      </h6>
    ),
    // Enhanced list support
    ul: ({ children }) => (
      <ul style={{
        paddingLeft: '24px',
        margin: '12px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol style={{
        paddingLeft: '24px',
        margin: '12px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li style={{
        margin: '4px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </li>
    ),
    // Enhanced blockquote support
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: '16px 0',
        padding: '12px 16px',
        borderLeft: '4px solid #007bff',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        fontStyle: 'italic',
        color: '#495057'
      }}>
        {children}
      </blockquote>
    ),
    // Enhanced text formatting
    strong: ({ children }) => (
      <strong style={{ fontWeight: '600', color: '#24292e' }}>
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em style={{ fontStyle: 'italic', color: '#24292e' }}>
        {children}
      </em>
    ),
  }), [onInternalLinkClick]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Loading indicator during debounce */}
      {isUpdating && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 123, 255, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Updating...
        </div>
      )}
      
      <MarkdownErrorBoundary>
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {debouncedValue}
        </ReactMarkdown>
      </MarkdownErrorBoundary>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MarkdownPreview; 