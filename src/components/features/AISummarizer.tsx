import React, { useState, useEffect } from 'react';
import { useNoteStore } from '../../store/noteStore';
import AsyncErrorBoundary from '../AsyncErrorBoundary';

interface AISummaryPanelProps {
  noteId: string;
  onClose: () => void;
}

interface SummaryData {
  summary: string;
  keyPoints: string[];
  tags: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  readingTime: number;
}

const AISummaryPanelContent: React.FC<AISummaryPanelProps> = ({ noteId, onClose }) => {
  const { getNote } = useNoteStore();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const note = getNote(noteId);

  const generateSummary = async () => {
    if (!note || !note.body.trim()) {
      setError('No content to summarize');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate AI API call with timeout
      const result = await new Promise<SummaryData>((resolve, reject) => {
        setTimeout(() => {
          // Simulate AI processing
          const words = note.body.split(/\s+/).length;
          const readingTime = Math.ceil(words / 200); // 200 words per minute
          
          const sentences = note.body.split(/[.!?]+/).filter(s => s.trim().length > 10);
          const keyPoints = sentences.slice(0, 3).map(s => s.trim());
          
          const tags = note.tags.length > 0 ? note.tags : ['general'];
          
          const sentiment = Math.random() > 0.5 ? 'positive' : 'neutral';
          
          resolve({
            summary: `This note contains ${words} words and covers ${keyPoints.length} main points. It appears to be ${sentiment} in tone and would take approximately ${readingTime} minutes to read.`,
            keyPoints,
            tags,
            sentiment,
            readingTime
          });
        }, 2000);
      });

      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (note) {
      generateSummary();
    }
  }, [noteId]);

  if (!note) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Note not found</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '800px', 
      margin: '0 auto',
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
          AI Analysis: {note.title}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          ×
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>🤖</div>
          <p>Analyzing your note...</p>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f3f3', 
            borderTop: '4px solid #007bff', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: '16px', 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '4px', 
          color: '#721c24',
          marginBottom: '16px'
        }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button 
            onClick={generateSummary}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '8px'
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {summary && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Summary</h3>
            <p style={{ lineHeight: '1.6', color: '#333' }}>{summary.summary}</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Key Points</h3>
            <ul style={{ paddingLeft: '20px' }}>
              {summary.keyPoints.map((point, index) => (
                <li key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>Reading Time</h4>
              <p style={{ margin: 0, color: '#666' }}>{summary.readingTime} minutes</p>
            </div>
            
            <div>
              <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>Sentiment</h4>
              <p style={{ margin: 0, color: '#666', textTransform: 'capitalize' }}>
                {summary.sentiment}
              </p>
            </div>
            
            <div>
              <h4 style={{ marginBottom: '8px', fontSize: '16px' }}>Suggested Tags</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {summary.tags.map((tag, index) => (
                  <span 
                    key={index}
                    style={{
                      background: '#e9ecef',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#495057'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state placeholder */}
      {!summary && !loading && !error && (
        <div style={{ textAlign: 'center', color: '#888', margin: '32px 0' }}>
          <p>No summary available yet.</p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const AISummaryPanel: React.FC<AISummaryPanelProps> = ({ noteId, onClose }) => {
  return (
    <AsyncErrorBoundary
      onError={(error) => {
        console.error('AISummaryPanel error:', error);
      }}
      fallback={(error, errorInfo, retry) => (
        <div style={{ 
          padding: '24px', 
          maxWidth: '800px', 
          margin: '0 auto',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>AI Analysis</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            padding: '16px', 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px', 
            color: '#856404',
            marginBottom: '16px'
          }}>
            <p style={{ margin: '0 0 16px 0' }}>
              <strong>AI Service Error:</strong> {error.message}
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={retry}
                style={{
                  background: '#ffc107',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
              <button 
                onClick={onClose}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <AISummaryPanelContent noteId={noteId} onClose={onClose} />
    </AsyncErrorBoundary>
  );
};

export default AISummaryPanel; 