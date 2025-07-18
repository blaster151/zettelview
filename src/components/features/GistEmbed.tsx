import React, { useState, useEffect } from 'react';
import AsyncErrorBoundary from '../AsyncErrorBoundary';

interface GistData {
  id: string;
  description: string;
  files: Record<string, {
    filename: string;
    content: string;
    language?: string;
  }>;
  html_url: string;
  created_at: string;
}

interface GistEmbedProps {
  url: string;
}

const GistEmbedContent: React.FC<GistEmbedProps> = ({ url }) => {
  const [gistData, setGistData] = useState<GistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract gist ID from URL - more flexible regex
  const gistId = url.match(/gist\.github\.com\/[^\/]+\/([a-zA-Z0-9_-]+)/)?.[1];

  useEffect(() => {
    if (!gistId) {
      setError('Invalid Gist URL');
      setLoading(false);
      return;
    }

    const fetchGist = async () => {
      try {
        // Use GitHub's Gist API
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Gist: ${response.status}`);
        }
        
        const data: GistData = await response.json();
        setGistData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Gist');
      } finally {
        setLoading(false);
      }
    };

    fetchGist();
  }, [gistId]);

  if (loading) {
    return (
      <div className="gist-embed loading">
        <div className="loading-spinner">Loading Gist...</div>
      </div>
    );
  }

  if (error || !gistData) {
    return (
      <div className="gist-embed error">
        <div className="error-message">
          <strong>Failed to load Gist:</strong> {error || 'Unknown error'}
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="fallback-link">
          View on GitHub →
        </a>
      </div>
    );
  }

  const files = Object.values(gistData.files);

  return (
    <div className="gist-embed">
      <div className="gist-header">
        <h4>{gistData.description || 'Gist'}</h4>
        <a href={gistData.html_url} target="_blank" rel="noopener noreferrer">
          View on GitHub →
        </a>
      </div>
      
      {files.map((file, index) => (
        <div key={index} className="gist-file">
          <div className="file-header">
            <span className="filename">{file.filename}</span>
            {file.language && <span className="language">{file.language}</span>}
          </div>
          <pre className="file-content">
            <code>{file.content}</code>
          </pre>
        </div>
      ))}
    </div>
  );
};

const GistEmbed: React.FC<GistEmbedProps> = ({ url }) => {
  return (
    <AsyncErrorBoundary
      onError={(error) => {
        console.error('GistEmbed error:', error);
      }}
      fallback={(error, errorInfo, retry) => (
        <div className="gist-embed error-boundary">
          <div className="error-message">
            <strong>Failed to load Gist:</strong> {error.message}
          </div>
          <div className="error-actions">
            <button onClick={retry} className="retry-button">
              Retry
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="fallback-link">
              View on GitHub →
            </a>
          </div>
        </div>
      )}
    >
      <GistEmbedContent url={url} />
    </AsyncErrorBoundary>
  );
};

export default GistEmbed; 