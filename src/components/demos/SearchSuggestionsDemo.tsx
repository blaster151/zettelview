import React, { useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import EnhancedSearchSuggestions from '../features/EnhancedSearchSuggestions';
import { SearchSuggestion } from '../../services/searchSuggestionsService';
import { SearchSuggestionsService } from '../../services/searchSuggestionsService';

const SearchSuggestionsDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const { notes } = useNoteStore();
  
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SearchSuggestion | null>(null);
  const [suggestionStats, setSuggestionStats] = useState<any>(null);

  // Sample queries for demonstration
  const sampleQueries = [
    'project',
    'meeting',
    'ideas',
    'todo',
    'research',
    'tag:',
    'recent',
    'linked'
  ];

  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setSelectedSuggestion(null);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
  }, []);

  const handleSampleQueryClick = useCallback((sampleQuery: string) => {
    setQuery(sampleQuery);
    setShowSuggestions(true);
    setSelectedSuggestion(null);
  }, []);

  const handleGetStats = useCallback(() => {
    const stats = SearchSuggestionsService.getSuggestionStats();
    setSuggestionStats(stats);
  }, []);

  const handleClearCache = useCallback(() => {
    SearchSuggestionsService.clearCache();
    setSuggestionStats(null);
  }, []);

  // Initialize suggestions service
  React.useEffect(() => {
    SearchSuggestionsService.initialize(notes);
  }, [notes]);

  return (
    <div style={{
      padding: '24px',
      background: colors.background,
      minHeight: '100vh',
      color: colors.text
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: '8px'
          }}>
            🔍 Enhanced Search Suggestions Demo
          </h1>
          <p style={{
            fontSize: '16px',
            color: colors.textSecondary,
            lineHeight: '1.5'
          }}>
            Experience intelligent, AI-powered search suggestions that learn from your content and behavior
          </p>
        </div>

        {/* Main Search Interface */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: colors.text
          }}>
            Interactive Search
          </h2>
          
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={handleQueryChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Start typing to see intelligent suggestions..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.background,
                color: colors.text,
                outline: 'none'
              }}
            />
            
            {/* Enhanced Search Suggestions */}
            <EnhancedSearchSuggestions
              query={query}
              isVisible={showSuggestions}
              onSuggestionSelect={handleSuggestionSelect}
              onClose={() => setShowSuggestions(false)}
              maxSuggestions={10}
            />
          </div>

          {/* Selected Suggestion Display */}
          {selectedSuggestion && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: `${colors.primary}10`,
              border: `1px solid ${colors.primary}`,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '4px'
              }}>
                Selected Suggestion:
              </div>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                {selectedSuggestion.text}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary,
                display: 'flex',
                gap: '12px'
              }}>
                <span>Type: {selectedSuggestion.type}</span>
                <span>Source: {selectedSuggestion.source}</span>
                <span>Relevance: {Math.round(selectedSuggestion.relevance * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Sample Queries */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: colors.text
          }}>
            Try These Sample Queries
          </h2>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {sampleQueries.map((sampleQuery) => (
              <button
                key={sampleQuery}
                onClick={() => handleSampleQueryClick(sampleQuery)}
                style={{
                  padding: '8px 16px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.primary;
                }}
              >
                {sampleQuery}
              </button>
            ))}
          </div>
        </div>

        {/* Features Overview */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: colors.text
          }}>
            🚀 Smart Features
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                Contextual Matching
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                Suggests based on note titles, content, and tags with relevance scoring
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧠</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                AI-Enhanced
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                Learns from your search patterns and suggests related concepts
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                Smart Caching
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                Intelligent caching for fast responses and reduced computation
              </p>
            </div>

            <div style={{
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⌨️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                Keyboard Navigation
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                Full keyboard support with arrow keys, enter, and escape
              </p>
            </div>
          </div>
        </div>

        {/* Suggestion Types */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: colors.text
          }}>
            📋 Suggestion Types
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: colors.background,
              borderRadius: '6px'
            }}>
              <span>📄</span>
              <span style={{ fontSize: '14px' }}>Title Matches</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: colors.background,
              borderRadius: '6px'
            }}>
              <span>🏷️</span>
              <span style={{ fontSize: '14px' }}>Tag Suggestions</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: colors.background,
              borderRadius: '6px'
            }}>
              <span>🔍</span>
              <span style={{ fontSize: '14px' }}>Query Patterns</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: colors.background,
              borderRadius: '6px'
            }}>
              <span>💡</span>
              <span style={{ fontSize: '14px' }}>Related Concepts</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: colors.background,
              borderRadius: '6px'
            }}>
              <span>🔗</span>
              <span style={{ fontSize: '14px' }}>Related Items</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              background: colors.background,
              borderRadius: '6px'
            }}>
              <span>📈</span>
              <span style={{ fontSize: '14px' }}>Popular Searches</span>
            </div>
          </div>
        </div>

        {/* Statistics and Controls */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: colors.text
          }}>
            📊 Statistics & Controls
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '16px'
          }}>
            <button
              onClick={handleGetStats}
              style={{
                padding: '8px 16px',
                background: colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Get Stats
            </button>
            <button
              onClick={handleClearCache}
              style={{
                padding: '8px 16px',
                background: colors.warning,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Clear Cache
            </button>
          </div>

          {suggestionStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px'
            }}>
              <div style={{
                padding: '12px',
                background: colors.background,
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                  {suggestionStats.totalSuggestions}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Total Suggestions
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: colors.background,
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.secondary }}>
                  {suggestionStats.cacheSize}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Cache Entries
                </div>
              </div>
              <div style={{
                padding: '12px',
                background: colors.background,
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.accent }}>
                  {Math.round(suggestionStats.averageRelevance * 100)}%
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Avg Relevance
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Usage Tips */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: colors.text
          }}>
            💡 Usage Tips
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Keyboard Shortcuts
              </h3>
              <ul style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6' }}>
                <li>↑↓ Arrow keys to navigate suggestions</li>
                <li>Enter to select highlighted suggestion</li>
                <li>Escape to close suggestions</li>
                <li>Tab to move between elements</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                Search Patterns
              </h3>
              <ul style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6' }}>
                <li>Type partial words for fuzzy matching</li>
                <li>Use "tag:" prefix for tag searches</li>
                <li>Try related concepts for broader results</li>
                <li>Check popular suggestions for common queries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchSuggestionsDemo; 