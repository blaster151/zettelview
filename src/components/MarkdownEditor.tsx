import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { useNoteStore } from '../store/noteStore';
import EnhancedCodeBlock from './EnhancedCodeBlock';
import GistEmbed from './GistEmbed';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatus from './SaveStatus';

// Constants
const INTERNAL_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;
const GIST_URL_PATTERN = /^https?:\/\/gist\.github\.com\/[^\/]+\/[a-f0-9]+$/i;

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
  const { findOrCreateNote, selectNote, updateNote } = useNoteStore();

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
      // Could add user notification here
    }
  }, [findOrCreateNote, selectNote]);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to toggle preview
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      setIsPreview(prev => !prev);
    }
    
    // Escape to exit preview mode
    if (event.key === 'Escape' && isPreview) {
      setIsPreview(false);
    }
  }, [isPreview]);

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
          padding: '0 2px',
          font: 'inherit',
          borderRadius: '2px'
        }}
        aria-label={`Navigate to note: ${noteTitle}`}
        role="link"
        tabIndex={0}
      >
        {noteTitle}
      </button>
    );
  });

  // Memoized markdown components
  const markdownComponents = useMemo((): Components => ({
    code({ className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !className || !match;
      return !isInline ? (
        <EnhancedCodeBlock className={className}>
          {String(children).replace(/\n$/, '')}
        </EnhancedCodeBlock>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    p: ({ children }: any) => {
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
    a: ({ href, children }: any) => {
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
    }
  }), [handleInternalLink]);

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
            <MarkdownErrorBoundary>
              <ReactMarkdown
                components={markdownComponents}
              >
                {value}
              </ReactMarkdown>
            </MarkdownErrorBoundary>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
    </div>
  );
};

export default React.memo(MarkdownEditor); 