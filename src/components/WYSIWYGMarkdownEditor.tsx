import React, { useEffect, useRef, useCallback } from 'react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/core';
import { nord } from '@milkdown/theme-nord';
import { commonmark, paragraph, text, heading, bold, italic, code, codeBlock, listItem, bulletList, orderedList, blockquote, hr, image, link } from '@milkdown/preset-commonmark';
import { gfm, table, tableRow, tableCell, tableHeader, strikethrough, tasklist, tasklistItem } from '@milkdown/preset-gfm';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { slash, slashCtx } from '@milkdown/plugin-slash';
import { history, historyCtx } from '@milkdown/plugin-history';
import { clipboard, clipboardCtx } from '@milkdown/plugin-clipboard';
import { ReactEditor, useEditor } from '@milkdown/react';
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

// Custom internal link node for Milkdown
const internalLinkNode = {
  id: 'internalLink',
  schema: {
    group: 'inline',
    inline: true,
    content: 'text*',
    parseDOM: [{ tag: 'span[data-type="internal-link"]' }],
    toDOM: () => ['span', { 'data-type': 'internal-link', class: 'internal-link' }, 0],
  },
  parser: {
    match: (node: any) => node.type === 'text' && /\[\[([^[\]]+)\]\]/.test(node.value),
    runner: (state: any, node: any) => {
      const match = node.value.match(/\[\[([^[\]]+)\]\]/);
      if (match) {
        const noteTitle = match[1];
        state.openNode('internalLink');
        state.addText(noteTitle);
        state.closeNode();
      }
    },
  },
  serializer: {
    match: (node: any) => node.type.name === 'internalLink',
    runner: (state: any, node: any) => {
      const noteTitle = node.content.content[0]?.text || '';
      state.addText(`[[${noteTitle}]]`);
    },
  },
};

const WYSIWYGMarkdownEditor: React.FC<WYSIWYGMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your note...',
  noteId,
  autoSave = false,
  'aria-label': ariaLabel = 'WYSIWYG Markdown editor',
  'aria-describedby': ariaDescribedBy
}) => {
  const { handleInternalLinkClick, noteExists } = useInternalLinks();
  const editorRef = useRef<HTMLDivElement>(null);

  const { editor } = useEditor(
    (root) =>
      Editor.make(root, {
        defaultValue: value,
        placeholder,
      })
        .config((ctx) => {
          ctx.set(rootCtx, editorRef.current);
          ctx.set(defaultValueCtx, value);
          
          // Configure listener for content changes
          ctx.get(listenerCtx).markdownUpdated((ctx, markdown) => {
            onChange(markdown);
          });

          // Configure slash commands
          ctx.get(slashCtx).configure((ctx, utils) => {
            return [
              {
                id: 'internal-link',
                title: 'Internal Link',
                keywords: ['link', 'internal', 'note'],
                command: () => {
                  const noteTitle = prompt('Enter note title:');
                  if (noteTitle) {
                    utils.get(historyCtx).command.execute((state, dispatch) => {
                      const { tr } = state;
                      const text = `[[${noteTitle}]]`;
                      tr.insertText(text);
                      if (dispatch) dispatch(tr);
                    });
                  }
                },
              },
              {
                id: 'heading-1',
                title: 'Heading 1',
                keywords: ['h1', 'heading', 'title'],
                command: () => {
                  utils.get(historyCtx).command.execute((state, dispatch) => {
                    const { tr } = state;
                    tr.insertText('# ');
                    if (dispatch) dispatch(tr);
                  });
                },
              },
              {
                id: 'heading-2',
                title: 'Heading 2',
                keywords: ['h2', 'heading', 'subtitle'],
                command: () => {
                  utils.get(historyCtx).command.execute((state, dispatch) => {
                    const { tr } = state;
                    tr.insertText('## ');
                    if (dispatch) dispatch(tr);
                  });
                },
              },
              {
                id: 'code-block',
                title: 'Code Block',
                keywords: ['code', 'block', 'syntax'],
                command: () => {
                  utils.get(historyCtx).command.execute((state, dispatch) => {
                    const { tr } = state;
                    tr.insertText('```\n\n```');
                    if (dispatch) dispatch(tr);
                  });
                },
              },
            ];
          });

          // Configure clipboard for better paste handling
          ctx.get(clipboardCtx).configure((ctx, utils) => {
            return {
              transformPastedText: (text) => {
                // Convert internal links to proper format
                return text.replace(/\[\[([^[\]]+)\]\]/g, '[[$1]]');
              },
            };
          });
        })
        .use(nord)
        .use(commonmark)
        .use(gfm)
        .use(listener)
        .use(slash)
        .use(history)
        .use(clipboard),
    [value, placeholder]
  );

  // Handle internal link clicks
  const handleInternalLinkClick = useCallback((noteTitle: string) => {
    try {
      handleInternalLinkClick(noteTitle);
    } catch (error) {
      notificationService.error(
        'Link Navigation Failed',
        `Unable to navigate to "${noteTitle}". Please try again or create the note manually.`
      );
    }
  }, [handleInternalLinkClick]);

  // Add custom CSS for internal links
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
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
      
      .milkdown {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #24292e;
      }
      
      .milkdown .ProseMirror {
        outline: none;
        padding: 16px;
        min-height: 400px;
      }
      
      .milkdown .ProseMirror p {
        margin: 0 0 16px 0;
      }
      
      .milkdown .ProseMirror h1,
      .milkdown .ProseMirror h2,
      .milkdown .ProseMirror h3,
      .milkdown .ProseMirror h4,
      .milkdown .ProseMirror h5,
      .milkdown .ProseMirror h6 {
        margin: 24px 0 16px 0;
        font-weight: 600;
        line-height: 1.25;
      }
      
      .milkdown .ProseMirror h1 {
        font-size: 2em;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 8px;
      }
      
      .milkdown .ProseMirror h2 {
        font-size: 1.5em;
        border-bottom: 1px solid #e1e4e8;
        padding-bottom: 6px;
      }
      
      .milkdown .ProseMirror code {
        background-color: #f6f8fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 0.9em;
      }
      
      .milkdown .ProseMirror pre {
        background-color: #f6f8fa;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;
        margin: 16px 0;
      }
      
      .milkdown .ProseMirror pre code {
        background-color: transparent;
        padding: 0;
      }
      
      .milkdown .ProseMirror blockquote {
        border-left: 4px solid #dfe2e5;
        margin: 16px 0;
        padding: 0 16px;
        color: #6a737d;
      }
      
      .milkdown .ProseMirror ul,
      .milkdown .ProseMirror ol {
        margin: 16px 0;
        padding-left: 24px;
      }
      
      .milkdown .ProseMirror li {
        margin: 4px 0;
      }
      
      .milkdown .ProseMirror table {
        border-collapse: collapse;
        width: 100%;
        margin: 16px 0;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        overflow: hidden;
      }
      
      .milkdown .ProseMirror th,
      .milkdown .ProseMirror td {
        border: 1px solid #e1e4e8;
        padding: 8px 12px;
        text-align: left;
      }
      
      .milkdown .ProseMirror th {
        background-color: #f6f8fa;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add click handlers for internal links
  useEffect(() => {
    if (!editorRef.current) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('internal-link')) {
        const noteTitle = target.textContent;
        if (noteTitle) {
          event.preventDefault();
          handleInternalLinkClick(noteTitle);
        }
      }
    };

    editorRef.current.addEventListener('click', handleClick);
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', handleClick);
      }
    };
  }, [handleInternalLinkClick]);

  // Update internal link styling based on existence
  useEffect(() => {
    if (!editorRef.current) return;

    const updateInternalLinkStyling = () => {
      const internalLinks = editorRef.current?.querySelectorAll('.internal-link');
      internalLinks?.forEach((link) => {
        const noteTitle = link.textContent;
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

    // Update styling after a short delay to allow editor to render
    const timeoutId = setTimeout(updateInternalLinkStyling, 100);
    return () => clearTimeout(timeoutId);
  }, [value, noteExists]);

  return (
    <div 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div ref={editorRef} className="milkdown" />
      </div>
    </div>
  );
};

export default WYSIWYGMarkdownEditor; 