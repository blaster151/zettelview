import React, { useState, useEffect } from 'react';

interface GistEmbedProps {
  url: string;
}

interface GistFile {
  filename: string;
  language: string;
  content: string;
  size: number;
}

interface GistData {
  id: string;
  description: string;
  files: Record<string, GistFile>;
  created_at: string;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

const GistEmbed: React.FC<GistEmbedProps> = ({ url }) => {
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
        <div className="gist-info">
          <img 
            src={gistData.owner.avatar_url} 
            alt={gistData.owner.login}
            className="owner-avatar"
          />
          <div className="gist-details">
            <div className="gist-title">
              {gistData.description || 'Untitled Gist'}
            </div>
            <div className="gist-meta">
              by {gistData.owner.login} • {files.length} file{files.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="view-on-github"
        >
          View on GitHub →
        </a>
      </div>
      
      <div className="gist-files">
        {files.map((file, index) => (
          <div key={index} className="gist-file">
            <div className="file-header">
              <span className="filename">{file.filename}</span>
              <span className="file-size">({Math.round(file.size / 1024)} KB)</span>
            </div>
            <pre className="file-content">
              <code>{file.content}</code>
            </pre>
          </div>
        ))}
      </div>
      
      <style>{`
        .gist-embed {
          border: 1px solid #e1e4e8;
          border-radius: 6px;
          margin: 1rem 0;
          background: #f6f8fa;
          overflow: hidden;
        }
        
        .gist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f1f3f4;
          border-bottom: 1px solid #e1e4e8;
        }
        
        .gist-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .owner-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }
        
        .gist-title {
          font-weight: 600;
          color: #24292e;
          margin-bottom: 2px;
        }
        
        .gist-meta {
          font-size: 12px;
          color: #586069;
        }
        
        .view-on-github {
          color: #0366d6;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }
        
        .view-on-github:hover {
          text-decoration: underline;
        }
        
        .gist-files {
          background: white;
        }
        
        .gist-file {
          border-bottom: 1px solid #e1e4e8;
        }
        
        .gist-file:last-child {
          border-bottom: none;
        }
        
        .file-header {
          padding: 8px 16px;
          background: #f6f8fa;
          border-bottom: 1px solid #e1e4e8;
          font-size: 12px;
          color: #586069;
        }
        
        .filename {
          font-weight: 600;
          color: #24292e;
        }
        
        .file-size {
          margin-left: 8px;
        }
        
        .file-content {
          margin: 0;
          padding: 16px;
          background: white;
          overflow-x: auto;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 13px;
          line-height: 1.45;
        }
        
        .file-content code {
          background: none;
          padding: 0;
          border: none;
          font-size: inherit;
        }
        
        .loading {
          padding: 2rem;
          text-align: center;
          color: #586069;
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid #e1e4e8;
          border-radius: 50%;
          border-top-color: #0366d6;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error {
          padding: 1rem;
          background: #fef2f2;
          border-color: #fecaca;
        }
        
        .error-message {
          color: #dc2626;
          margin-bottom: 8px;
        }
        
        .fallback-link {
          color: #0366d6;
          text-decoration: none;
          font-size: 14px;
        }
        
        .fallback-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default GistEmbed; 