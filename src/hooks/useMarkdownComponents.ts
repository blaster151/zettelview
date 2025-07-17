import { useMemo, useCallback } from 'react';
import { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EnhancedCodeBlock from '../components/EnhancedCodeBlock';
import GistEmbed from '../components/GistEmbed';
import { ParsedLink } from './useInternalLinks';

// Constants
const GIST_URL_PATTERN = /^https?:\/\/gist\.github\.com\/[^\/]+\/[a-f0-9]+$/i;

export interface MarkdownComponentOptions {
  onInternalLinkClick?: (noteTitle: string) => void;
  parseInternalLinks?: (text: string) => ParsedLink[];
  enableGistEmbeds?: boolean;
  enableEnhancedCodeBlocks?: boolean;
  customStyles?: {
    table?: React.CSSProperties;
    code?: React.CSSProperties;
    link?: React.CSSProperties;
  };
}

export interface MarkdownComponentHandlers {
  components: Components;
  isValidGistUrl: (url: string) => boolean;
  createInternalLinkComponent: (noteTitle: string) => React.ReactElement;
}

/**
 * Custom hook for creating and managing markdown components
 * 
 * Provides:
 * - Pre-configured markdown components
 * - Internal link component factory
 * - Gist URL validation
 * - Customizable styling options
 */
export const useMarkdownComponents = (options: MarkdownComponentOptions = {}): MarkdownComponentHandlers => {
  const {
    onInternalLinkClick,
    parseInternalLinks,
    enableGistEmbeds = true,
    enableEnhancedCodeBlocks = true,
    customStyles = {}
  } = options;

  /**
   * Validate if URL is a GitHub Gist
   */
  const isValidGistUrl = useCallback((url: string): boolean => {
    return GIST_URL_PATTERN.test(url);
  }, []);

  /**
   * Create internal link component
   */
  const createInternalLinkComponent = useCallback((noteTitle: string) => {
    const handleClick = () => {
      if (onInternalLinkClick) {
        onInternalLinkClick(noteTitle);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    };

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
          fontSize: 'inherit',
          ...customStyles.link
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8f9fa';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label={`Link to note: ${noteTitle}`}
      >
        {`[[${noteTitle}]]`}
      </button>
    );
  }, [onInternalLinkClick, customStyles.link]);

  /**
   * Create markdown components with all features
   */
  const components = useMemo((): Components => ({
    // Code blocks with syntax highlighting
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (language && enableEnhancedCodeBlocks) {
        return (
          <EnhancedCodeBlock language={language}>
            {children as string}
          </EnhancedCodeBlock>
        );
      }
      
      return (
        <code 
          className={className} 
          style={{ ...customStyles.code }}
          {...props}
        >
          {children}
        </code>
      );
    },

    // Paragraphs with internal link parsing
    p: ({ children }) => {
      if (typeof children === 'string' && parseInternalLinks) {
        const parts = parseInternalLinks(children);
        return (
          <p>
            {parts.map((part, index) => {
              if (part.type === 'link' && part.noteTitle) {
                return (
                  <span key={index}>
                    {createInternalLinkComponent(part.noteTitle)}
                  </span>
                );
              }
              return <span key={index}>{part.content}</span>;
            })}
          </p>
        );
      }
      return <p>{children}</p>;
    },

    // Links with Gist embed support
    a: ({ href, children }) => {
      if (href && typeof href === 'string' && isValidGistUrl(href) && enableGistEmbeds) {
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
          overflow: 'hidden',
          ...customStyles.table
        }}>
          {children}
        </table>
      </div>
    ),

    // Table headers
    th: ({ children }) => (
      <th style={{
        background: '#f6f8fa',
        border: '1px solid #e1e4e8',
        padding: '8px 12px',
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: '14px'
      }}>
        {children}
      </th>
    ),

    // Table cells
    td: ({ children }) => (
      <td style={{
        border: '1px solid #e1e4e8',
        padding: '8px 12px',
        fontSize: '14px'
      }}>
        {children}
      </td>
    ),

    // Headings with proper hierarchy
    h1: ({ children }) => (
      <h1 style={{
        fontSize: '2em',
        fontWeight: 'bold',
        margin: '24px 0 16px 0',
        color: '#24292e',
        borderBottom: '1px solid #e1e4e8',
        paddingBottom: '8px'
      }}>
        {children}
      </h1>
    ),

    h2: ({ children }) => (
      <h2 style={{
        fontSize: '1.5em',
        fontWeight: 'bold',
        margin: '20px 0 12px 0',
        color: '#24292e',
        borderBottom: '1px solid #e1e4e8',
        paddingBottom: '6px'
      }}>
        {children}
      </h2>
    ),

    h3: ({ children }) => (
      <h3 style={{
        fontSize: '1.25em',
        fontWeight: 'bold',
        margin: '16px 0 8px 0',
        color: '#24292e'
      }}>
        {children}
      </h3>
    ),

    h4: ({ children }) => (
      <h4 style={{
        fontSize: '1.1em',
        fontWeight: 'bold',
        margin: '12px 0 6px 0',
        color: '#24292e'
      }}>
        {children}
      </h4>
    ),

    h5: ({ children }) => (
      <h5 style={{
        fontSize: '1em',
        fontWeight: 'bold',
        margin: '8px 0 4px 0',
        color: '#24292e'
      }}>
        {children}
      </h5>
    ),

    h6: ({ children }) => (
      <h6 style={{
        fontSize: '0.9em',
        fontWeight: 'bold',
        margin: '6px 0 3px 0',
        color: '#24292e'
      }}>
        {children}
      </h6>
    ),

    // Lists
    ul: ({ children }) => (
      <ul style={{
        margin: '8px 0',
        paddingLeft: '24px'
      }}>
        {children}
      </ul>
    ),

    ol: ({ children }) => (
      <ol style={{
        margin: '8px 0',
        paddingLeft: '24px'
      }}>
        {children}
      </ol>
    ),

    li: ({ children }) => (
      <li style={{
        margin: '4px 0',
        lineHeight: '1.5'
      }}>
        {children}
      </li>
    ),

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: '16px 0',
        padding: '12px 16px',
        borderLeft: '4px solid #007bff',
        background: '#f8f9fa',
        borderRadius: '4px',
        fontStyle: 'italic'
      }}>
        {children}
      </blockquote>
    ),

    // Horizontal rules
    hr: () => (
      <hr style={{
        border: 'none',
        borderTop: '1px solid #e1e4e8',
        margin: '24px 0'
      }} />
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

    // Inline code
    code: ({ children, className }) => {
      if (className) {
        // This is a code block, handled above
        return null;
      }
      return (
        <code style={{
          background: '#f6f8fa',
          padding: '2px 4px',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '0.9em',
          color: '#e36209'
        }}>
          {children}
        </code>
      );
    },

    // Images
    img: ({ src, alt }) => (
      <img 
        src={src} 
        alt={alt || ''} 
        style={{
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '6px',
          margin: '8px 0'
        }}
      />
    )
  }), [
    onInternalLinkClick,
    parseInternalLinks,
    enableGistEmbeds,
    enableEnhancedCodeBlocks,
    customStyles,
    isValidGistUrl,
    createInternalLinkComponent
  ]);

  return {
    components,
    isValidGistUrl,
    createInternalLinkComponent
  };
}; 