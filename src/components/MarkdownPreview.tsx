import React, { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import EnhancedCodeBlock from './EnhancedCodeBlock';
import GistEmbed from './GistEmbed';

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
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, onInternalLinkClick }) => {
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
    // ...other components as in MarkdownEditor
  }), [onInternalLinkClick]);

  return (
    <MarkdownErrorBoundary>
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </MarkdownErrorBoundary>
  );
};

export default MarkdownPreview; 