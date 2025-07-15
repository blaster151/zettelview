import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNoteStore } from '../store/noteStore';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your note...'
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const { findOrCreateNote, selectNote } = useNoteStore();

  const handleInternalLink = async (noteTitle: string) => {
    try {
      const noteId = await findOrCreateNote(noteTitle);
      selectNote(noteId);
    } catch (error) {
      console.error('Failed to handle internal link:', error);
    }
  };

  // Custom component for internal links
  const InternalLink: React.FC<{ children: string }> = ({ children }) => {
    const linkText = children.toString();
    if (linkText.startsWith('[[') && linkText.endsWith(']]')) {
      const noteTitle = linkText.slice(2, -2);
      return (
        <button
          onClick={() => handleInternalLink(noteTitle)}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit'
          }}
        >
          {noteTitle}
        </button>
      );
    }
    return <span>{children}</span>;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
        <button
          onClick={() => setIsPreview(false)}
          style={{
            background: !isPreview ? '#007bff' : 'transparent',
            color: !isPreview ? 'white' : '#007bff',
            border: '1px solid #007bff',
            padding: '4px 12px',
            marginRight: '8px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Edit
        </button>
        <button
          onClick={() => setIsPreview(true)}
          style={{
            background: isPreview ? '#007bff' : 'transparent',
            color: isPreview ? 'white' : '#007bff',
            border: '1px solid #007bff',
            padding: '4px 12px',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
        >
          Preview
        </button>
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isPreview ? (
          <div style={{ padding: '16px' }}>
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({ children }: any) => {
                  // Handle internal links in paragraphs
                  if (typeof children === 'string') {
                    const parts = children.split(/(\[\[.*?\]\])/);
                    return (
                      <p>
                        {parts.map((part: string, index: number) => {
                          if (part.match(/^\[\[.*?\]\]$/)) {
                            return <InternalLink key={index}>{part}</InternalLink>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  }
                  return <p>{children}</p>;
                }
              }}
            >
              {value}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
          />
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor; 