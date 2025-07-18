import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useSearchHistory } from '../../hooks/useSearchHistory';

interface SearchHistoryButtonProps {
  onSearch: (query: string) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

const SearchHistoryButton: React.FC<SearchHistoryButtonProps> = ({
  onSearch,
  className = '',
  size = 'medium',
  showCount = true
}) => {
  const { colors } = useThemeStore();
  const { history, getRecentQueries, getStats } = useSearchHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const recentQueries = getRecentQueries(5);
  const stats = getStats();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowFullHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowFullHistory(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleHistoryClick = (query: string) => {
    onSearch(query);
    setIsOpen(false);
    setShowFullHistory(false);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { padding: '4px 8px', fontSize: '12px' };
      case 'large':
        return { padding: '8px 16px', fontSize: '16px' };
      default:
        return { padding: '6px 12px', fontSize: '14px' };
    }
  };

  const buttonStyle = getButtonSize();

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={className}
        style={{
          ...buttonStyle,
          background: isOpen ? colors.primary : colors.surface,
          color: isOpen ? 'white' : colors.text,
          border: `1px solid ${isOpen ? colors.primary : colors.border}`,
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease'
        }}
        aria-label="Search history"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>🕒</span>
        <span>History</span>
        {showCount && history.length > 0 && (
          <span style={{
            background: colors.primary,
            color: 'white',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '10px',
            minWidth: '16px',
            textAlign: 'center'
          }}>
            {history.length}
          </span>
        )}
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '280px',
            maxWidth: '400px',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 'bold',
              color: colors.text
            }}>
              Search History
            </h3>
            <div style={{
              fontSize: '11px',
              color: colors.textSecondary
            }}>
              {stats.totalSearches} searches
            </div>
          </div>

          {/* Quick Stats */}
          {stats.totalSearches > 0 && (
            <div style={{
              padding: '8px 16px',
              background: colors.surface,
              borderBottom: `1px solid ${colors.border}`,
              fontSize: '11px',
              color: colors.textSecondary
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Unique queries:</span>
                <span>{stats.uniqueQueries}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Today's searches:</span>
                <span>{stats.recentActivity}</span>
              </div>
            </div>
          )}

          {/* History Items */}
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {history.length === 0 ? (
              <div style={{
                padding: '20px 16px',
                textAlign: 'center',
                color: colors.textSecondary,
                fontSize: '12px'
              }}>
                No search history yet
              </div>
            ) : (
              <div>
                {(showFullHistory ? history : recentQueries.map(query => 
                  history.find(item => item.query === query)
                ).filter(Boolean)).map((item, index) => (
                  <div
                    key={`${item.query}-${item.timestamp}`}
                    style={{
                      padding: '8px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: index < (showFullHistory ? history.length : recentQueries.length) - 1 
                        ? `1px solid ${colors.border}` 
                        : 'none'
                    }}
                    onClick={() => handleHistoryClick(item.query)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.surfaceHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        color: colors.text,
                        marginBottom: '2px'
                      }}>
                        {item.query}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.textSecondary
                      }}>
                        {new Date(item.timestamp).toLocaleDateString()} • {item.resultCount} results
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHistoryClick(item.query);
                      }}
                      style={{
                        padding: '4px 8px',
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Search
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div style={{
              padding: '8px 16px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.primary,
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
              >
                {showFullHistory ? 'Show recent' : `Show all (${history.length})`}
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Clear all search history?')) {
                    // This would need to be connected to the clear function
                    setIsOpen(false);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchHistoryButton; 