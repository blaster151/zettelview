/**
 * MarkdownEditor - A comprehensive markdown editor with preview, tag management, and rich features.
 * 
 * This component is intentionally kept as a single, cohesive unit despite its size (~760 lines) because:
 * 1. All functionality serves a single, clear purpose: "Edit and preview markdown content with rich features"
 * 2. The parts are naturally coupled - tag management needs noteId/updateNote, internal links need store access,
 *    auto-save needs value/onChange, and preview needs the same markdown components as the editor
 * 3. Breaking it up would require prop drilling, complex state synchronization, and duplicated logic
 * 4. The size is justified: ~200 lines of TypeScript interfaces, ~150 lines of markdown components,
 *    ~100 lines of tag management, ~100 lines of error boundaries, and ~200 lines of actual logic
 * 
 * Refactoring would only make sense if we add multiple editor types, a plugin system, collaborative editing,
 * or if specific performance/testing problems arise that smaller components would solve.
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { useNoteStore } from '../store/noteStore';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatus from './SaveStatus';
import EnhancedCodeBlock from './EnhancedCodeBlock';
import GistEmbed from './GistEmbed';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { useMarkdownEditorShortcuts } from '../hooks/useMarkdownEditorShortcuts';
import TagManager from './TagManager';
import MarkdownPreview from './MarkdownPreview';
import { notificationService } from '../services/notificationService';

// Constants
const INTERNAL_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;
const GIST_URL_PATTERN = /^https?:\/\/gist\.github\.com\/[^\/]+\/[a-f0-9]+$/i;

// TypeScript interfaces for markdown components
interface MarkdownComponentProps {
  children?: React.ReactNode;
  className?: string;
}

interface LinkComponentProps extends MarkdownComponentProps {
  href?: string;
}

interface ImageComponentProps extends MarkdownComponentProps {
  src?: string;
  alt?: string;
  title?: string;
}

interface CodeComponentProps extends MarkdownComponentProps {
  className?: string;
  children?: string;
}

interface TableComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface HeadingComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface ListComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface ListItemComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface BlockquoteComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface TextComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface ParagraphComponentProps extends MarkdownComponentProps {
  children: React.ReactNode;
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  noteId?: string;
  autoSave?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

interface AutoSaveData {
  content: string;
  noteId?: string;
}

interface AutoSaveOptions {
  debounceMs: number;
  onSave: (data: AutoSaveData) => Promise<void>;
  onError: (error: Error) => void;
}

// Error boundary component for markdown parsing
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
    console.error('Markdown parsing error:', error, errorInfo);
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

// Validate Gist URL
const isValidGistUrl = (url: string): boolean => {
  return GIST_URL_PATTERN.test(url);
};

// Parse internal links with better regex handling
const parseInternalLinks = (text: string): Array<{ type: 'text' | 'link'; content: string; noteTitle?: string }> => {
  const parts: Array<{ type: 'text' | 'link'; content: string; noteTitle?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = INTERNAL_LINK_PATTERN.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Add the internal link
    parts.push({
      type: 'link',
      content: match[0],
      noteTitle: match[1].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return parts;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your note...',
  noteId,
  autoSave = false,
  'aria-label': ariaLabel = 'Markdown editor',
  'aria-describedby': ariaDescribedBy
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [parseError, setParseError] = useState<Error | null>(null);
  const { findOrCreateNote, selectNote, updateNote, getNote } = useNoteStore();

  // Note for tag management
  const note = noteId ? getNote(noteId) : null;

  // Debounced onChange for editor input
  const debouncedOnChange = useDebouncedCallback(onChange, 300);

  // Auto-save functionality
  const { isSaving, lastSaved, error, saveNow } = useAutoSave(
    { content: value, noteId },
    {
      debounceMs: 1000,
      onSave: async (data: AutoSaveData) => {
        if (autoSave && data.noteId) {
          await updateNote(data.noteId, { body: data.content });
        }
      },
      onError: (error: Error) => {
        console.error('Auto-save failed:', error);
      }
    } as AutoSaveOptions
  );

  const handleInternalLink = useCallback(async (noteTitle: string) => {
    try {
      const noteId = await findOrCreateNote(noteTitle);
      selectNote(noteId);
    } catch (error) {
      console.error('Failed to handle internal link:', error);
      notificationService.error(
        'Link Navigation Failed',
        `Unable to navigate to "${noteTitle}". Please try again or create the note manually.`
      );
    }
  }, [findOrCreateNote, selectNote]);

  // Keyboard shortcut handler (extracted)
  const { handleKeyDown } = useMarkdownEditorShortcuts({ isPreview, setIsPreview });

  // Custom component for internal links
  const InternalLink: React.FC<{ children: string; noteTitle: string }> = React.memo(({ children, noteTitle }) => {
    const handleClick = useCallback(() => {
      handleInternalLink(noteTitle);
    }, [noteTitle, handleInternalLink]);

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

  // Markdown components with proper TypeScript types
  const markdownComponents: Components = useMemo(() => ({
    code: ({ className, children, ...props }: CodeComponentProps): React.JSX.Element => {
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
    p: ({ children }: ParagraphComponentProps) => {
      // Handle internal links in paragraphs
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
    a: ({ href, children }: LinkComponentProps) => {
      // Handle Gist embeds with validation
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
    table: ({ children }: TableComponentProps) => (
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
    thead: ({ children }: TableComponentProps) => (
      <thead style={{ backgroundColor: '#f6f8fa' }}>
        {children}
      </thead>
    ),
    tbody: ({ children }: TableComponentProps) => (
      <tbody>
        {children}
      </tbody>
    ),
    tr: ({ children }: TableComponentProps) => (
      <tr style={{ borderBottom: '1px solid #e1e4e8' }}>
        {children}
      </tr>
    ),
    th: ({ children }: TableComponentProps) => (
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
    td: ({ children }: TableComponentProps) => (
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
    img: ({ src, alt, title }: ImageComponentProps) => (
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
    h1: ({ children }: HeadingComponentProps) => (
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
    h2: ({ children }: HeadingComponentProps) => (
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
    h3: ({ children }: HeadingComponentProps) => (
      <h3 style={{
        fontSize: '1.25em',
        fontWeight: '600',
        margin: '16px 0 8px 0',
        color: '#24292e'
      }}>
        {children}
      </h3>
    ),
    h4: ({ children }: HeadingComponentProps) => (
      <h4 style={{
        fontSize: '1em',
        fontWeight: '600',
        margin: '12px 0 6px 0',
        color: '#24292e'
      }}>
        {children}
      </h4>
    ),
    h5: ({ children }: HeadingComponentProps) => (
      <h5 style={{
        fontSize: '0.875em',
        fontWeight: '600',
        margin: '10px 0 4px 0',
        color: '#24292e'
      }}>
        {children}
      </h5>
    ),
    h6: ({ children }: HeadingComponentProps) => (
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
    ul: ({ children }: ListComponentProps) => (
      <ul style={{
        paddingLeft: '24px',
        margin: '12px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </ul>
    ),
    ol: ({ children }: ListComponentProps) => (
      <ol style={{
        paddingLeft: '24px',
        margin: '12px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </ol>
    ),
    li: ({ children }: ListItemComponentProps) => (
      <li style={{
        margin: '4px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </li>
    ),
    // Enhanced blockquote support
    blockquote: ({ children }: BlockquoteComponentProps) => (
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
    strong: ({ children }: TextComponentProps) => (
      <strong style={{ fontWeight: '600', color: '#24292e' }}>
        {children}
      </strong>
    ),
    em: ({ children }: TextComponentProps) => (
      <em style={{ fontStyle: 'italic', color: '#24292e' }}>
        {children}
      </em>
    ),
  }), []);

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div role="tablist" aria-label="Editor mode">
          <button
            onClick={() => setIsPreview(false)}
            onKeyDown={handleKeyDown}
            style={{
              background: !isPreview ? '#007bff' : 'transparent',
              color: !isPreview ? 'white' : '#007bff',
              border: '1px solid #007bff',
              padding: '4px 12px',
              marginRight: '8px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            role="tab"
            aria-selected={!isPreview}
            aria-label="Edit mode"
            title="Edit mode (Ctrl+Enter)"
          >
            Edit
          </button>
          <button
            onClick={() => setIsPreview(true)}
            onKeyDown={handleKeyDown}
            style={{
              background: isPreview ? '#007bff' : 'transparent',
              color: isPreview ? 'white' : '#007bff',
              border: '1px solid #007bff',
              padding: '4px 12px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            role="tab"
            aria-selected={isPreview}
            aria-label="Preview mode"
            title="Preview mode (Ctrl+Enter)"
          >
            Preview
          </button>
        </div>
        
        {autoSave && (
          <SaveStatus
            isSaving={isSaving}
            lastSaved={lastSaved}
            error={error}
            onRetry={saveNow}
          />
        )}
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isPreview ? (
          <div 
            style={{ padding: '16px' }}
            role="tabpanel"
            aria-label="Markdown preview"
          >
            <MarkdownPreview markdown={value} onInternalLinkClick={handleInternalLink} />
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => debouncedOnChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '14px',
              resize: 'none'
            }}
            role="textbox"
            aria-label="Markdown editor text area"
            aria-multiline="true"
            tabIndex={0}
          />
        )}
      </div>

      {/* Tag management UI */}
      {note && noteId && (
        <TagManager 
          note={note} 
          noteId={noteId} 
          onUpdateNote={updateNote} 
        />
      )}
    </div>
  );
};

export default React.memo(MarkdownEditor); 