import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useInternalLinks } from '../hooks/useInternalLinks';
import { notificationService } from '../services/notificationService';

interface WYSIWYGMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  noteId?: string;
  autoSave?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const WYSIWYGMarkdownEditor: React.FC<WYSIWYGMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your note...',
  noteId,
  autoSave = false,
  'aria-label': ariaLabel = 'WYSIWYG Markdown editor',
  'aria-describedby': ariaDescribedBy
}) => {
  const { handleInternalLinkClick: handleLinkClick, noteExists } = useInternalLinks();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Convert markdown to HTML for display
  const convertMarkdownToHtml = useCallback((markdown: string): string => {
    return markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Internal links
      .replace(/\[\[([^[\]]+)\]\]/g, '<span class="internal-link" data-note="$1">[[$1]]</span>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }, []);

  // Convert HTML back to markdown
  const convertHtmlToMarkdown = useCallback((html: string): string => {
    return html
      // Headers
      .replace(/<h3>(.*?)<\/h3>/g, '### $1\n')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1\n')
      .replace(/<h1>(.*?)<\/h1>/g, '# $1\n')
      // Bold
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      // Italic
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      // Code blocks
      .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```')
      // Inline code
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      // Links
      .replace(/<a href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
      // Internal links
      .replace(/<span class="internal-link"[^>]*>\[\[(.*?)\]\]<\/span>/g, '[[$1]]')
      // Lists
      .replace(/<li>(.*?)<\/li>/g, '* $1\n')
      // Line breaks
      .replace(/<br>/g, '\n')
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '');
  }, []);

  // Handle content changes
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const markdown = convertHtmlToMarkdown(html);
      onChange(markdown);
    }
  }, [onChange, convertHtmlToMarkdown]);

  // Handle internal link clicks
  const handleLocalInternalLinkClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('internal-link')) {
      const noteTitle = target.getAttribute('data-note');
      if (noteTitle) {
        event.preventDefault();
        handleLinkClick(noteTitle);
      }
    }
  }, [handleLinkClick]);

  // Update editor content when value changes
  useEffect(() => {
    if (editorRef.current && !isEditing) {
      const html = convertMarkdownToHtml(value);
      editorRef.current.innerHTML = html;
    }
  }, [value, convertMarkdownToHtml, isEditing]);

  // Update internal link styling
  useEffect(() => {
    if (!editorRef.current) return;

    const updateInternalLinkStyling = () => {
      const internalLinks = editorRef.current?.querySelectorAll('.internal-link');
      internalLinks?.forEach((link) => {
        const noteTitle = link.getAttribute('data-note');
        if (noteTitle && noteExists) {
          const exists = noteExists(noteTitle);
          if (!exists) {
            link.classList.add('missing');
            link.setAttribute('title', `Click to create "${noteTitle}"`);
          } else {
            link.classList.remove('missing');
            link.setAttribute('title', `Link to note: ${noteTitle}`);
          }
        }
      });
    };

    const timeoutId = setTimeout(updateInternalLinkStyling, 100);
    return () => clearTimeout(timeoutId);
  }, [value, noteExists]);

  return (
    <div
      style={{
        height: '100%',
        border: '1px solid #e1e4e8',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid #e1e4e8',
          backgroundColor: '#f6f8fa',
          display: 'flex',
          gap: '4px'
        }}
      >
        <button
          onClick={() => {
            document.execCommand('bold', false);
            handleContentChange();
          }}
          style={{
            padding: '4px 8px',
            border: '1px solid #d1d5da',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => {
            document.execCommand('italic', false);
            handleContentChange();
          }}
          style={{
            padding: '4px 8px',
            border: '1px solid #d1d5da',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontStyle: 'italic'
          }}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => {
            const noteTitle = prompt('Enter note title:');
            if (noteTitle) {
              const linkText = `[[${noteTitle}]]`;
              document.execCommand('insertText', false, linkText);
              handleContentChange();
            }
          }}
          style={{
            padding: '4px 8px',
            border: '1px solid #d1d5da',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
          title="Internal Link"
        >
          🔗
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onClick={handleLocalInternalLinkClick}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        style={{
          flex: 1,
          padding: '16px',
          outline: 'none',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          overflow: 'auto'
        }}
        role="textbox"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #6a737d;
          pointer-events: none;
        }
        
        .internal-link {
          color: #007bff;
          text-decoration: underline;
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          background-color: transparent;
          transition: background-color 0.2s;
        }
        
        .internal-link:hover {
          background-color: #f8f9fa;
        }
        
        .internal-link.missing {
          color: #dc3545;
          text-decoration: none;
          background-color: #fff5f5;
        }
        
        .internal-link.missing:hover {
          background-color: #ffe6e6;
        }
        
        code {
          background-color: #f6f8fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 0.9em;
        }
        
        pre {
          background-color: #f6f8fa;
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          padding: 16px;
          overflow-x: auto;
          margin: 16px 0;
        }
        
        pre code {
          background-color: transparent;
          padding: 0;
        }
        
        h1, h2, h3 {
          margin: 24px 0 16px 0;
          font-weight: 600;
          line-height: 1.25;
        }
        
        h1 {
          font-size: 2em;
          border-bottom: 1px solid #e1e4e8;
          padding-bottom: 8px;
        }
        
        h2 {
          font-size: 1.5em;
          border-bottom: 1px solid #e1e4e8;
          padding-bottom: 6px;
        }
        
        h3 {
          font-size: 1.25em;
        }
      `}</style>
    </div>
  );
};

export default WYSIWYGMarkdownEditor; 