import React, { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import SearchSuggestionsDemo from './SearchSuggestionsDemo';
import QueryTemplatesDemo from './QueryTemplatesDemo';
import KeyboardNavigationDemo from './KeyboardNavigationDemo';
import EnhancedSearch from '../features/EnhancedSearch';
import SearchHistoryPanel from '../features/SearchHistoryPanel';
import AdvancedFilters from '../features/AdvancedFilters';
import SearchAnalytics from '../features/SearchAnalytics';
import SearchTemplatesButton from '../features/SearchTemplatesButton';

const SearchFeaturesDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const { notes, searchNotes } = useNoteStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const results = searchNotes(query);
    setSearchResults(results);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'suggestions', label: 'Smart Suggestions', icon: '🔍' },
    { id: 'templates', label: 'Query Templates', icon: '📋' },
    { id: 'keyboard', label: 'Keyboard Navigation', icon: '⌨️' }
  ];

  const features = [
    {
      title: 'AI-Powered Suggestions',
      description: 'Intelligent search suggestions based on content, history, and user behavior',
      icon: '🧠',
      color: colors.primary
    },
    {
      title: 'Query Templates',
      description: 'Save and reuse complex search queries with variables and categories',
      icon: '📋',
      color: colors.secondary
    },
    {
      title: 'Search History',
      description: 'Track and analyze your search patterns with detailed analytics',
      icon: '📊',
      color: colors.accent
    },
    {
      title: 'Advanced Filters',
      description: 'Filter by date ranges, content types, tags, and more',
      icon: '🔧',
      color: colors.warning
    },
    {
      title: 'Search Analytics',
      description: 'Visualize search trends and performance metrics',
      icon: '📈',
      color: colors.success
    },
    {
      title: 'Keyboard Navigation',
      description: 'Full keyboard support for power users and accessibility',
      icon: '⌨️',
      color: colors.textSecondary
    }
  ];

  return (
    <div style={{
      padding: '24px',
      background: colors.background,
      minHeight: '100vh',
      color: colors.text
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: '8px'
          }}>
            🚀 Advanced Search Features Demo
          </h1>
          <p style={{
            fontSize: '18px',
            color: colors.textSecondary,
            lineHeight: '1.5',
            marginBottom: '16px'
          }}>
            Experience the full power of ZettelView's intelligent search capabilities
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab.id ? colors.primary : colors.surface,
                  color: activeTab === tab.id ? 'white' : colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '20px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Features Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    padding: '24px',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: '32px',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${feature.color}20`,
                      borderRadius: '12px'
                    }}>
                      {feature.icon}
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: colors.text,
                      margin: 0
                    }}>
                      {feature.title}
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: colors.textSecondary,
                    lineHeight: '1.6',
                    margin: 0
                  }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive Search Demo */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: colors.text
              }}>
                🎯 Try the Enhanced Search
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <EnhancedSearch
                  onSearch={handleSearch}
                  placeholder="Type to see smart suggestions, templates, and more..."
                  className="demo-search"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginTop: '16px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    color: colors.text
                  }}>
                    Search Results ({searchResults.length})
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px'
                  }}>
                    {searchResults.slice(0, 6).map((result, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '12px',
                          background: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px'
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          color: colors.text
                        }}>
                          {result.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: colors.textSecondary,
                          marginBottom: '4px'
                        }}>
                          {result.body.substring(0, 60)}...
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '4px',
                          flexWrap: 'wrap'
                        }}>
                          {result.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                background: colors.primary,
                                color: 'white',
                                borderRadius: '10px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '16px',
                color: colors.text
              }}>
                ⚡ Quick Actions
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <button
                  onClick={() => setShowHistory(true)}
                  style={{
                    padding: '12px 16px',
                    background: colors.accent,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  📊 View Search History
                </button>
                
                <button
                  onClick={() => setShowFilters(true)}
                  style={{
                    padding: '12px 16px',
                    background: colors.warning,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  🔧 Advanced Filters
                </button>
                
                <button
                  onClick={() => setShowAnalytics(true)}
                  style={{
                    padding: '12px 16px',
                    background: colors.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  📈 Search Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <SearchSuggestionsDemo />
        )}

        {activeTab === 'templates' && (
          <QueryTemplatesDemo />
        )}

        {activeTab === 'keyboard' && (
          <KeyboardNavigationDemo />
        )}

        {/* Modals */}
        {showHistory && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              width: '90%'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, color: colors.text }}>Search History</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: colors.textSecondary
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <SearchHistoryPanel
                  isOpen={showHistory}
                  onClose={() => setShowHistory(false)}
                  onSearchSelect={handleSearch}
                />
              </div>
            </div>
          </div>
        )}

        {showFilters && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              width: '90%'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, color: colors.text }}>Advanced Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: colors.textSecondary
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <AdvancedFilters
                  isOpen={showFilters}
                  onClose={() => setShowFilters(false)}
                  onApplyFilters={(filters) => {
                    console.log('Applied filters:', filters);
                    setShowFilters(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {showAnalytics && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'auto',
              width: '90%'
            }}>
              <div style={{
                padding: '20px',
                borderBottom: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, color: colors.text }}>Search Analytics</h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: colors.textSecondary
                  }}
                >
                  ×
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <SearchAnalytics />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFeaturesDemo; 