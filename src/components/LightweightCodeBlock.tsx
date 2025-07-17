import React, { useMemo } from 'react';

interface LightweightCodeBlockProps {
  children: string;
  language?: string;
  maxLines?: number;
}

// Simple token highlighting for common patterns
const simpleHighlight = (code: string, language: string): string => {
  if (language === 'text' || language === 'plaintext') {
    return code;
  }

  // Very basic highlighting patterns to avoid heavy regex
  let highlighted = code
    // Comments (basic patterns)
    .replace(/(\/\/.*$)/gm, '<span style="color: #6a737d;">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a737d;">$1</span>')
    // Strings (basic patterns)
    .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, '<span style="color: #032f62;">$1$2$1</span>')
    // Numbers
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span style="color: #005cc5;">$1</span>')
    // Keywords (very basic)
    .replace(/\b(function|if|else|for|while|return|const|let|var|class|import|export|from|default)\b/g, 
      '<span style="color: #d73a49;">$1</span>');

  return highlighted;
};

const LightweightCodeBlock: React.FC<LightweightCodeBlockProps> = ({ 
  children, 
  language = 'text',
  maxLines = 1000
}) => {
  const lines = children.split('\n');
  const isTruncated = lines.length > maxLines;
  const displayLines = isTruncated ? lines.slice(0, maxLines) : lines;

  const highlightedCode = useMemo(() => {
    if (language === 'text' || language === 'plaintext') {
      return displayLines.join('\n');
    }
    return simpleHighlight(displayLines.join('\n'), language);
  }, [displayLines, language]);

  const lineNumbers = useMemo(() => {
    return displayLines.map((_, index) => index + 1);
  }, [displayLines]);

  return (
    <div style={{
      position: 'relative',
      backgroundColor: '#f6f8fa',
      border: '1px solid #e1e4e8',
      borderRadius: '6px',
      overflow: 'auto',
      maxHeight: '600px'
    }}>
      {/* Line numbers */}
      <div style={{
        position: 'sticky',
        left: 0,
        backgroundColor: '#f6f8fa',
        borderRight: '1px solid #e1e4e8',
        padding: '16px 8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6a737d',
        userSelect: 'none',
        minWidth: '3em',
        textAlign: 'right'
      }}>
        {lineNumbers.map(num => (
          <div key={num} style={{ lineHeight: '1.5' }}>
            {num}
          </div>
        ))}
        {isTruncated && (
          <div style={{ 
            lineHeight: '1.5', 
            color: '#d73a49',
            fontWeight: 'bold'
          }}>
            ...
          </div>
        )}
      </div>

      {/* Code content */}
      <div style={{
        padding: '16px',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#24292e',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
      dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />

      {/* Truncation notice */}
      {isTruncated && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#fff3cd',
          borderTop: '1px solid #ffeaa7',
          padding: '8px 16px',
          fontSize: '12px',
          color: '#856404',
          textAlign: 'center'
        }}>
          Large code block truncated. Showing first {maxLines} lines of {lines.length} total.
        </div>
      )}
    </div>
  );
};

export default React.memo(LightweightCodeBlock); 