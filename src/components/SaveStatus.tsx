import React from 'react';

interface SaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
  onRetry?: () => void;
}

const SaveStatus: React.FC<SaveStatusProps> = ({
  isSaving,
  lastSaved,
  error,
  onRetry
}) => {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return date.toLocaleDateString();
  };

  if (isSaving) {
    return (
      <div className="save-status saving">
        <div className="save-indicator">
          <div className="spinner"></div>
          <span>Saving...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="save-status error">
        <div className="save-indicator">
          <span className="error-icon">⚠️</span>
          <span>Save failed</span>
          {onRetry && (
            <button onClick={onRetry} className="retry-button">
              Retry
            </button>
          )}
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="save-status saved">
        <div className="save-indicator">
          <span className="saved-icon">✓</span>
          <span>Saved {formatTime(lastSaved)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="save-status unsaved">
      <div className="save-indicator">
        <span className="unsaved-icon">●</span>
        <span>Unsaved changes</span>
      </div>
    </div>
  );
};

// Add styles
const styles = `
  .save-status {
    display: flex;
    align-items: center;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .save-status.saving {
    background: #e3f2fd;
    color: #1976d2;
  }

  .save-status.saved {
    background: #e8f5e8;
    color: #2e7d32;
  }

  .save-status.error {
    background: #ffebee;
    color: #c62828;
  }

  .save-status.unsaved {
    background: #fff3e0;
    color: #f57c00;
  }

  .save-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid #1976d2;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .saved-icon {
    color: #2e7d32;
    font-weight: bold;
  }

  .error-icon {
    font-size: 14px;
  }

  .unsaved-icon {
    color: #f57c00;
    font-size: 8px;
  }

  .retry-button {
    background: #c62828;
    color: white;
    border: none;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    cursor: pointer;
    margin-left: 8px;
  }

  .retry-button:hover {
    background: #b71c1c;
  }

  .error-message {
    font-size: 10px;
    margin-top: 2px;
    opacity: 0.8;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default SaveStatus; 