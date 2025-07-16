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
  const { findOrCreateNote, selectNote, updateNote, getNote } = useNoteStore();

  // Tag management state
  const note = noteId ? getNote(noteId) : null;
  const [tagInput, setTagInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

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
        {children}
      </button>
    );
  });

  // Memoized markdown components
  const markdownComponents = useMemo((): Components => ({
    code({ className, children, ...props }: any): React.JSX.Element {
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
    },
    // Enhanced table support
    table: ({ children }: any) => (
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
    thead: ({ children }: any) => (
      <thead style={{ backgroundColor: '#f6f8fa' }}>
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody>
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr style={{ borderBottom: '1px solid #e1e4e8' }}>
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
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
    td: ({ children }: any) => (
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
    img: ({ src, alt, title }: any) => (
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
    // Enhanced typography
    h1: ({ children }: any) => (
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
    h2: ({ children }: any) => (
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
    h3: ({ children }: any) => (
      <h3 style={{
        fontSize: '1.25em',
        fontWeight: '600',
        margin: '16px 0 8px 0',
        color: '#24292e'
      }}>
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 style={{
        fontSize: '1em',
        fontWeight: '600',
        margin: '12px 0 6px 0',
        color: '#24292e'
      }}>
        {children}
      </h4>
    ),
    h5: ({ children }: any) => (
      <h5 style={{
        fontSize: '0.875em',
        fontWeight: '600',
        margin: '10px 0 4px 0',
        color: '#24292e'
      }}>
        {children}
      </h5>
    ),
    h6: ({ children }: any) => (
      <h6 style={{
        fontSize: '0.85em',
        fontWeight: '600',
        margin: '8px 0 4px 0',
        color: '#24292e'
      }}>
        {children}
      </h6>
    ),
    // Enhanced list styling
    ul: ({ children }: any) => (
      <ul style={{
        margin: '16px 0',
        paddingLeft: '24px',
        lineHeight: '1.6'
      }}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol style={{
        margin: '16px 0',
        paddingLeft: '24px',
        lineHeight: '1.6'
      }}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li style={{
        margin: '4px 0',
        lineHeight: '1.6'
      }}>
        {children}
      </li>
    ),
    // Enhanced blockquote styling
    blockquote: ({ children }: any) => (
      <blockquote style={{
        margin: '16px 0',
        padding: '12px 16px',
        borderLeft: '4px solid #0366d6',
        backgroundColor: '#f6f8fa',
        borderRadius: '0 6px 6px 0',
        fontStyle: 'italic',
        color: '#24292e'
      }}>
        {children}
      </blockquote>
    ),
    // Enhanced horizontal rule
    hr: () => (
      <hr style={{
        margin: '24px 0',
        border: 'none',
        height: '1px',
        backgroundColor: '#e1e4e8'
      }} />
    ),
    // Enhanced inline code
    strong: ({ children }: any) => (
      <strong style={{ fontWeight: '600', color: '#24292e' }}>
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em style={{ fontStyle: 'italic', color: '#24292e' }}>
        {children}
      </em>
    )
  }), [handleInternalLink]);

  // Tag management handlers
  const handleAddTag = async () => {
    if (!noteId || !tagInput.trim()) return;
    const newTag = tagInput.trim();
    if (note && !note.tags.includes(newTag)) {
      await updateNote(noteId, { tags: [...note.tags, newTag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = async (index: number) => {
    if (!noteId || !note) return;
    const newTags = note.tags.filter((_, i) => i !== index);
    await updateNote(noteId, { tags: newTags });
  };

  const handleEditTag = (index: number) => {
    if (!note) return;
    setEditingTagIndex(index);
    setEditingTagValue(note.tags[index]);
  };

  const handleEditTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTagValue(e.target.value);
  };

  const handleEditTagSave = async (index: number) => {
    if (!noteId || !note) return;
    const newTag = editingTagValue.trim();
    if (!newTag) return;
    const newTags = note.tags.map((tag, i) => (i === index ? newTag : tag));
    await updateNote(noteId, { tags: newTags });
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleEditTagKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      await handleEditTagSave(index);
    } else if (e.key === 'Escape') {
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  };

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
                remarkPlugins={[remarkGfm]}
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

      {/* Tag management UI */}
      {note && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #eee',
          background: '#fafbfc',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontWeight: 500, fontSize: '13px', color: '#555' }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {note.tags.map((tag, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', background: '#e3e7ed', borderRadius: '12px', padding: '2px 8px', fontSize: '12px' }}>
                {editingTagIndex === i ? (
                  <input
                    value={editingTagValue}
                    onChange={handleEditTagChange}
                    onBlur={() => handleEditTagSave(i)}
                    onKeyDown={(e) => handleEditTagKeyDown(e, i)}
                    autoFocus
                    style={{ fontSize: '12px', border: '1px solid #bbb', borderRadius: '8px', padding: '2px 4px', marginRight: '4px' }}
                    aria-label={`Edit tag ${tag}`}
                  />
                ) : (
                  <span
                    tabIndex={0}
                    style={{ outline: 'none', cursor: 'pointer', marginRight: '4px' }}
                    onClick={() => handleEditTag(i)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleEditTag(i);
                    }}
                    aria-label={`Edit tag ${tag}`}
                    role="button"
                  >
                    {tag}
                  </span>
                )}
                <button
                  onClick={() => handleRemoveTag(i)}
                  style={{ background: 'none', border: 'none', color: '#c00', marginLeft: '2px', cursor: 'pointer', fontSize: '14px', padding: 0 }}
                  aria-label={`Remove tag ${tag}`}
                  title="Remove tag"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') await handleAddTag();
              }}
              placeholder="Add tag..."
              style={{ fontSize: '12px', padding: '4px 8px', border: '1px solid #bbb', borderRadius: '8px', minWidth: '80px' }}
              aria-label="Add tag"
            />
            <button
              onClick={handleAddTag}
              disabled={!tagInput.trim() || (note.tags.includes(tagInput.trim()))}
              style={{ fontSize: '12px', padding: '4px 12px', borderRadius: '8px', border: 'none', background: '#007bff', color: 'white', cursor: tagInput.trim() && !note.tags.includes(tagInput.trim()) ? 'pointer' : 'not-allowed', opacity: tagInput.trim() && !note.tags.includes(tagInput.trim()) ? 1 : 0.6 }}
              aria-label="Add tag button"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MarkdownEditor); 