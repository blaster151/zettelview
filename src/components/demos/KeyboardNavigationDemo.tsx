import React, { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import EnhancedSearch from '../features/EnhancedSearch';

const KeyboardNavigationDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'overview' | 'search' | 'filters' | 'history'>('overview');

  const handleSearch = (query: string) => {
    setSearchResults([`Search result for: "${query}"`]);
  };

  const keyboardShortcuts = [
    { key: 'Tab', description: 'Navigate between interactive elements' },
    { key: 'Shift + Tab', description: 'Navigate backwards between elements' },
    { key: 'Arrow Keys', description: 'Navigate through dropdowns and lists' },
    { key: 'Enter', description: 'Activate buttons or select items' },
    { key: 'Space', description: 'Select items in lists' },
    { key: 'Escape', description: 'Close dropdowns, modals, and panels' },
    { key: 'Ctrl/Cmd + K', description: 'Focus search input (if implemented)' },
  ];

  const searchFeatures = [
    '🔍 Enhanced Search with keyboard navigation',
    '📜 Search History with arrow key navigation',
    '🔧 Advanced Filters with tab navigation',
    '📊 Search Analytics with keyboard access',
    '⚡ Real-time suggestions with arrow key selection',
    '🎯 Focus management and screen reader support',
  ];

  const accessibilityFeatures = [
    'ARIA labels for all interactive elements',
    'Role attributes for semantic structure',
    'Focus indicators and keyboard traps',
    'Screen reader announcements',
    'Logical tab order',
    'Escape key handling for all modals',
  ];

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: colors.text
    }}>
      <h1 style={{
        color: colors.text,
        fontSize: '24px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        ⌨️ Keyboard Navigation Demo
      </h1>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: '8px'
      }}
      role="tablist"
      aria-label="Demo sections"
      >
        {[
          { id: 'overview', label: 'Overview', icon: '📋' },
          { id: 'search', label: 'Search', icon: '🔍' },
          { id: 'filters', label: 'Filters', icon: '🔧' },
          { id: 'history', label: 'History', icon: '📜' }
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            style={{
              padding: '8px 16px',
              background: activeSection === id ? colors.primary : 'transparent',
              color: activeSection === id ? 'white' : colors.text,
              border: 'none',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            role="tab"
            aria-selected={activeSection === id}
            aria-controls={`panel-${id}`}
            tabIndex={0}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {/* Keyboard Shortcuts */}
            <div style={{
              background: colors.surface,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h2 style={{
                color: colors.text,
                fontSize: '18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⌨️ Keyboard Shortcuts
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              role="list"
              aria-label="Available keyboard shortcuts"
              >
                {keyboardShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: colors.background,
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    role="listitem"
                  >
                    <kbd style={{
                      background: colors.border,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {shortcut.key}
                    </kbd>
                    <span>{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search Features */}
            <div style={{
              background: colors.surface,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h2 style={{
                color: colors.text,
                fontSize: '18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔍 Search Features
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              role="list"
              aria-label="Search features with keyboard support"
              >
                {searchFeatures.map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      background: colors.background,
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    role="listitem"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Accessibility Features */}
            <div style={{
              background: colors.surface,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <h2 style={{
                color: colors.text,
                fontSize: '18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ♿ Accessibility Features
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              role="list"
              aria-label="Accessibility features implemented"
              >
                {accessibilityFeatures.map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      background: colors.background,
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                    role="listitem"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            marginTop: '24px',
            padding: '20px',
            background: colors.surface,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <h2 style={{
              color: colors.text,
              fontSize: '18px',
              marginBottom: '16px'
            }}>
              🎯 How to Test Keyboard Navigation
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Search Input
                </h3>
                <ul style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
                  <li>Tab to focus the search input</li>
                  <li>Type to see suggestions</li>
                  <li>Use arrow keys to navigate suggestions</li>
                  <li>Press Enter to select or search</li>
                  <li>Press Escape to close suggestions</li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Action Buttons
                </h3>
                <ul style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
                  <li>Tab between history, filters, and analytics buttons</li>
                  <li>Press Enter to activate buttons</li>
                  <li>Use Shift+Tab to navigate backwards</li>
                  <li>Press Escape to close any open panels</li>
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Modals & Panels
                </h3>
                <ul style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
                  <li>Focus is trapped within modals</li>
                  <li>Tab cycles through all interactive elements</li>
                  <li>Arrow keys navigate lists and dropdowns</li>
                  <li>Escape closes the modal</li>
                  <li>Enter activates buttons and selects items</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Section */}
      {activeSection === 'search' && (
        <div
          role="tabpanel"
          id="panel-search"
          aria-labelledby="tab-search"
        >
          <div style={{
            background: colors.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <h2 style={{
              color: colors.text,
              fontSize: '20px',
              marginBottom: '16px'
            }}>
              🔍 Enhanced Search with Keyboard Navigation
            </h2>
            <p style={{
              color: colors.textSecondary,
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              Try using the search input below with keyboard navigation. Use Tab to focus, 
              arrow keys to navigate suggestions, and Enter to search.
            </p>
            
            <EnhancedSearch
              onSearch={handleSearch}
              placeholder="Type to search with keyboard navigation..."
              className="demo-search"
            />

            {searchResults.length > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{
                  color: colors.text,
                  fontSize: '16px',
                  marginBottom: '12px'
                }}>
                  Search Results:
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: colors.textSecondary
                }}>
                  {searchResults.map((result, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {result}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters Section */}
      {activeSection === 'filters' && (
        <div
          role="tabpanel"
          id="panel-filters"
          aria-labelledby="tab-filters"
        >
          <div style={{
            background: colors.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <h2 style={{
              color: colors.text,
              fontSize: '20px',
              marginBottom: '16px'
            }}>
              🔧 Advanced Filters with Keyboard Navigation
            </h2>
            <p style={{
              color: colors.textSecondary,
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              The Advanced Filters modal includes comprehensive keyboard navigation:
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Modal Navigation
                </h3>
                <ul style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, paddingLeft: '16px' }}>
                  <li>Tab cycles through all controls</li>
                  <li>Shift+Tab moves backwards</li>
                  <li>Escape closes the modal</li>
                  <li>Enter activates buttons</li>
                </ul>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Form Controls
                </h3>
                <ul style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, paddingLeft: '16px' }}>
                  <li>Arrow keys for dropdowns</li>
                  <li>Space for checkboxes</li>
                  <li>Enter for buttons</li>
                  <li>Tab for text inputs</li>
                </ul>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Focus Management
                </h3>
                <ul style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, paddingLeft: '16px' }}>
                  <li>Auto-focus on open</li>
                  <li>Focus trapped in modal</li>
                  <li>Logical tab order</li>
                  <li>Clear focus indicators</li>
                </ul>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: colors.background,
              borderRadius: '6px',
              border: `2px dashed ${colors.border}`,
              textAlign: 'center',
              color: colors.textSecondary
            }}>
              💡 Click the filters button (🔧) in the search bar above to test the Advanced Filters modal
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      {activeSection === 'history' && (
        <div
          role="tabpanel"
          id="panel-history"
          aria-labelledby="tab-history"
        >
          <div style={{
            background: colors.surface,
            padding: '24px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <h2 style={{
              color: colors.text,
              fontSize: '20px',
              marginBottom: '16px'
            }}>
              📜 Search History with Keyboard Navigation
            </h2>
            <p style={{
              color: colors.textSecondary,
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              The Search History panel includes advanced keyboard navigation features:
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  List Navigation
                </h3>
                <ul style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, paddingLeft: '16px' }}>
                  <li>Arrow Up/Down to navigate items</li>
                  <li>Enter to select item</li>
                  <li>Space to select item</li>
                  <li>Tab to move between sections</li>
                </ul>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Bulk Operations
                </h3>
                <ul style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, paddingLeft: '16px' }}>
                  <li>Tab to select checkboxes</li>
                  <li>Space to toggle selection</li>
                  <li>Enter to activate buttons</li>
                  <li>Escape to close panel</li>
                </ul>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '6px',
                border: `1px solid ${colors.border}`
              }}>
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
                  Analytics Section
                </h3>
                <ul style={{ fontSize: '12px', color: colors.textSecondary, margin: 0, paddingLeft: '16px' }}>
                  <li>Tab to navigate statistics</li>
                  <li>Arrow keys for chart navigation</li>
                  <li>Enter to toggle analytics</li>
                  <li>Screen reader friendly</li>
                </ul>
              </div>
            </div>

            <div style={{
              padding: '16px',
              background: colors.background,
              borderRadius: '6px',
              border: `2px dashed ${colors.border}`,
              textAlign: 'center',
              color: colors.textSecondary
            }}>
              💡 Click the history button (📜) in the search bar above to test the Search History panel
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardNavigationDemo; 