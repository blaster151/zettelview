import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface EnhancedCodeBlockProps {
  children: string;
  className?: string;
  language?: string;
}

interface GistResponse {
  html_url: string;
  id: string;
}

const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = ({ 
  children, 
  className = '', 
  language = 'text' 
}) => {
  const [isCopying, setIsCopying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract language from className (format: language-{lang})
  const detectedLanguage = (className.replace('language-', '') || language).toUpperCase();

  const handleCopy = async () => {
    setIsCopying(true);
    setError(null);
    
    try {
      await navigator.clipboard.writeText(children);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    } finally {
      setIsCopying(false);
    }
  };

  const handleExportToGist = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      // Note: In a real implementation, you'd need a GitHub token
      // For now, we'll simulate the API call and show the expected behavior
      const gistData = {
        description: `Code block from ZettelView - ${detectedLanguage}`,
        public: true,
        files: {
          [`code.${detectedLanguage === 'text' ? 'txt' : detectedLanguage}`]: {
            content: children
          }
        }
      };

      // Simulate API call (replace with actual GitHub API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const mockResponse: GistResponse = {
        html_url: `https://gist.github.com/mock/${Date.now()}`,
        id: `mock-${Date.now()}`
      };

      setExportSuccess(mockResponse.html_url);
      setTimeout(() => setExportSuccess(null), 5000);
    } catch (err) {
      setError('Failed to export to Gist. Please check your GitHub token.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="enhanced-code-block">
      <div className="code-block-header">
        <span className="language-label">{detectedLanguage}</span>
        <div className="code-block-actions">
          <button
            onClick={handleCopy}
            disabled={isCopying}
            className={`action-button copy-button ${copySuccess ? 'success' : ''}`}
            title="Copy to clipboard"
          >
            {isCopying ? 'Copying...' : copySuccess ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleExportToGist}
            disabled={isExporting}
            className={`action-button export-button ${exportSuccess ? 'success' : ''}`}
            title="Export to Gist"
          >
            {isExporting ? 'Exporting...' : exportSuccess ? 'Exported!' : 'Export to Gist'}
          </button>
        </div>
      </div>
      
      <SyntaxHighlighter
        language={detectedLanguage}
        style={tomorrow}
        customStyle={{
          margin: 0,
          borderRadius: '0 0 4px 4px',
          fontSize: '14px',
          lineHeight: '1.4'
        }}
      >
        {children}
      </SyntaxHighlighter>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {exportSuccess && (
        <div className="success-message">
          <a href={exportSuccess} target="_blank" rel="noopener noreferrer">
            View Gist →
          </a>
        </div>
      )}
      
      <style>{`
        .enhanced-code-block {
          position: relative;
          margin: 1rem 0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .code-block-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #2d3748;
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 500;
        }
        
        .language-label {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .code-block-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          background: #4a5568;
          color: #e2e8f0;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .action-button:hover:not(:disabled) {
          background: #718096;
        }
        
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .action-button.success {
          background: #48bb78;
          color: white;
        }
        
        .error-message {
          padding: 8px 12px;
          background: #fed7d7;
          color: #c53030;
          font-size: 12px;
          border-top: 1px solid #feb2b2;
        }
        
        .success-message {
          padding: 8px 12px;
          background: #c6f6d5;
          color: #2f855a;
          font-size: 12px;
          border-top: 1px solid #9ae6b4;
        }
        
        .success-message a {
          color: #2f855a;
          text-decoration: none;
          font-weight: 500;
        }
        
        .success-message a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default EnhancedCodeBlock; 