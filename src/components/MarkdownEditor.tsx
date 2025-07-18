/**
 * MarkdownEditor - A comprehensive markdown editor with preview, tag management, and rich features.
 * 
 * This component uses custom hooks to manage complex logic:
 * - useInternalLinks: Handles internal link parsing and navigation
 * - useMarkdownComponents: Manages markdown component configuration
 * - useAutoSave: Handles automatic saving functionality
 * - useMarkdownEditorShortcuts: Manages keyboard shortcuts
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { useNoteStore } from '../store/noteStore';
import { useAutoSave } from '../hooks/useAutoSave';
import { useInternalLinks } from '../hooks/useInternalLinks';
import { useMarkdownComponents } from '../hooks/useMarkdownComponents';
import SaveStatus from './SaveStatus';
import TagManager from './TagManager';
import MarkdownPreview from './MarkdownPreview';
import WYSIWYGMarkdownEditor from './WYSIWYGMarkdownEditor';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { useMarkdownEditorShortcuts } from '../hooks/useMarkdownEditorShortcuts';

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
  const [isWYSIWYG, setIsWYSIWYG] = useState(false);
  const [parseError, setParseError] = useState<Error | null>(null);
  const { updateNote, getNote } = useNoteStore();

  // Note for tag management
  const note = noteId ? getNote(noteId) : null;

  // Custom hooks for complex logic
  const { handleInternalLinkClick, parseInternalLinks, noteExists } = useInternalLinks();
  const { components: markdownComponents } = useMarkdownComponents({
    onInternalLinkClick: handleInternalLinkClick,
    parseInternalLinks,
    noteExists,
    enableGistEmbeds: true,
    enableEnhancedCodeBlocks: true
  });

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

  // Keyboard shortcut handler (extracted)
  const { handleKeyDown } = useMarkdownEditorShortcuts({ 
    isPreview, 
    setIsPreview, 
    isWYSIWYG, 
    setIsWYSIWYG 
  });

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div role="tablist" aria-label="Editor mode">
          <button
            onClick={() => {
              setIsPreview(false);
              setIsWYSIWYG(false);
            }}
            onKeyDown={handleKeyDown}
            style={{
              background: !isPreview && !isWYSIWYG ? '#007bff' : 'transparent',
              color: !isPreview && !isWYSIWYG ? 'white' : '#007bff',
              border: '1px solid #007bff',
              padding: '4px 12px',
              marginRight: '8px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            role="tab"
            aria-selected={!isPreview && !isWYSIWYG}
            aria-label="Edit mode"
            title="Edit mode (Ctrl+Enter)"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setIsPreview(false);
              setIsWYSIWYG(true);
            }}
            onKeyDown={handleKeyDown}
            style={{
              background: isWYSIWYG ? '#28a745' : 'transparent',
              color: isWYSIWYG ? 'white' : '#28a745',
              border: '1px solid #28a745',
              padding: '4px 12px',
              marginRight: '8px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
            role="tab"
            aria-selected={isWYSIWYG}
            aria-label="WYSIWYG mode"
            title="WYSIWYG mode (Ctrl+Shift+Enter)"
          >
            WYSIWYG
          </button>
          <button
            onClick={() => {
              setIsPreview(true);
              setIsWYSIWYG(false);
            }}
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
            <MarkdownPreview 
              markdown={value} 
              onInternalLinkClick={handleInternalLinkClick}
              noteExists={noteExists}
              debounceMs={300} // Match the editor debounce for consistency
            />
          </div>
        ) : isWYSIWYG ? (
          <div 
            style={{ height: '100%' }}
            role="tabpanel"
            aria-label="WYSIWYG editor"
          >
            <WYSIWYGMarkdownEditor
              value={value}
              onChange={debouncedOnChange}
              placeholder={placeholder}
              noteId={noteId}
              autoSave={autoSave}
              aria-label="WYSIWYG Markdown editor"
              aria-describedby={ariaDescribedBy}
            />
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

export default MarkdownEditor; 