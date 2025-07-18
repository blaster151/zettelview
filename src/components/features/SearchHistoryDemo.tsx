import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import SearchHistoryPanel from './SearchHistoryPanel';
import SearchHistoryButton from './SearchHistoryButton';
import { SearchHistory } from '../../services/searchService';

const SearchHistoryDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const [showPanel, setShowPanel] = useState(false);
  const [demoHistory, setDemoHistory] = useState<Array<{
    query: string;
    timestamp: number;
    resultCount: number;
  }>>([]);

  // Initialize demo data
  useEffect(() => {
    const sampleQueries = [
      'javascript tutorial',
      'react hooks',
      'typescript interface',
      'node.js express',
      'mongodb aggregation',
      'docker container',
      'kubernetes deployment',
      'aws lambda',
      'graphql schema',
      'redux state management',
      'webpack configuration',
      'jest testing',
      'git workflow',
      'css grid layout',
      'responsive design'
    ];

    const history = sampleQueries.map((query, index) => ({
      query,
      timestamp: Date.now() - (index * 1000 * 60 * 60), // 1 hour apart
      resultCount: Math.floor(Math.random() * 20) + 1
    }));

    setDemoHistory(history);

    // Mock the SearchHistory.getHistory to return our demo data
    const originalGetHistory = SearchHistory.getHistory;
    SearchHistory.getHistory = () => history;

    return () => {
      SearchHistory.getHistory = originalGetHistory;
    };
  }, []);

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // In a real app, this would trigger the search
    alert(`Searching for: ${query}`);
  };

  const handleAddDemoSearch = () => {
    const newQueries = [
      'machine learning',
      'artificial intelligence',
      'data science',
      'python pandas',
      'tensorflow neural network'
    ];
    
    const randomQuery = newQueries[Math.floor(Math.random() * newQueries.length)];
    const newHistoryItem = {
      query: randomQuery,
      timestamp: Date.now(),
      resultCount: Math.floor(Math.random() * 20) + 1
    };

    setDemoHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]); // Keep max 20 items
  };

  const handleClearDemoHistory = () => {
    if (window.confirm('Clear all demo search history?')) {
      setDemoHistory([]);
    }
  };

  return (
    <div style={{
      padding: '20px',
      background: colors.background,
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          color: colors.text,
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          🔍 Search History Demo
        </h1>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <h2 style={{
            color: colors.text,
            marginBottom: '16px'
          }}>
            Features
          </h2>
          <ul style={{
            color: colors.textSecondary,
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>📊 <strong>Search Analytics:</strong> View total searches, unique queries, average results, and trends</li>
            <li>🔍 <strong>Quick Access:</strong> Click any search to instantly re-run it</li>
            <li>📅 <strong>Date Filtering:</strong> Filter by today, this week, this month, or all time</li>
            <li>🔢 <strong>Smart Sorting:</strong> Sort by most recent, most frequent, or most results</li>
            <li>🎯 <strong>Search Filtering:</strong> Find specific searches in your history</li>
            <li>📈 <strong>Visual Trends:</strong> See your search activity over the last 7 days</li>
            <li>⚡ <strong>Bulk Operations:</strong> Select multiple searches for batch actions</li>
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          <SearchHistoryButton
            onSearch={handleSearch}
            size="large"
            showCount={true}
          />

          <button
            onClick={() => setShowPanel(true)}
            style={{
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📊 Open Full Panel
          </button>

          <button
            onClick={handleAddDemoSearch}
            style={{
              padding: '12px 24px',
              background: colors.success,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ➕ Add Demo Search
          </button>

          <button
            onClick={handleClearDemoHistory}
            style={{
              padding: '12px 24px',
              background: colors.error,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            🗑️ Clear History
          </button>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{
            color: colors.text,
            marginBottom: '16px'
          }}>
            Demo Search History ({demoHistory.length} items)
          </h3>
          
          {demoHistory.length === 0 ? (
            <p style={{
              color: colors.textSecondary,
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              No search history yet. Click "Add Demo Search" to populate with sample data.
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gap: '8px',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {demoHistory.map((item, index) => (
                <div
                  key={`${item.query}-${item.timestamp}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleSearch(item.query)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.background;
                  }}
                >
                  <div>
                    <div style={{
                      color: colors.text,
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {item.query}
                    </div>
                    <div style={{
                      color: colors.textSecondary,
                      fontSize: '12px'
                    }}>
                      {new Date(item.timestamp).toLocaleString()} • {item.resultCount} results
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearch(item.query);
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

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          fontSize: '14px',
          color: colors.textSecondary
        }}>
          <h4 style={{
            color: colors.text,
            marginBottom: '12px'
          }}>
            How to Use
          </h4>
          <ol style={{
            lineHeight: '1.6',
            paddingLeft: '20px'
          }}>
            <li>Click the <strong>History</strong> button to see recent searches</li>
            <li>Click <strong>Open Full Panel</strong> for advanced features and analytics</li>
            <li>Use the <strong>Add Demo Search</strong> button to populate with sample data</li>
            <li>Try filtering by date range or search terms</li>
            <li>Sort by different criteria to find what you need</li>
            <li>Click any search to re-run it instantly</li>
          </ol>
        </div>
      </div>

      {/* Full Search History Panel */}
      <SearchHistoryPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onSearch={handleSearch}
      />
    </div>
  );
};

export default SearchHistoryDemo; 