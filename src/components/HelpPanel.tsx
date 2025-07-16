import React, { useState } from 'react';
import { useThemeStore } from '../store/themeStore';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    key: string;
    description: string;
    category: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: 'Ctrl+N', description: 'Create new note', category: 'Navigation' },
      { key: 'Ctrl+P', description: 'Previous note', category: 'Navigation' },
      { key: 'Ctrl+Shift+P', description: 'Next note', category: 'Navigation' },
      { key: 'Ctrl+G', description: 'Toggle graph view', category: 'Navigation' }
    ]
  },
  {
    title: 'Search & Editing',
    shortcuts: [
      { key: 'Ctrl+F', description: 'Focus search', category: 'Search' },
      { key: 'Ctrl+Shift+N', description: 'Focus new note input', category: 'Search' },
      { key: 'Ctrl+S', description: 'Save note', category: 'Editing' },
      { key: 'Ctrl+Shift+C', description: 'Command palette', category: 'Search' }
    ]
  },
  {
    title: 'Features',
    shortcuts: [
      { key: 'Ctrl+Shift+A', description: 'AI Analysis', category: 'Features' },
      { key: 'Ctrl+Shift+E', description: 'Export/Import', category: 'Features' },
      { key: 'Ctrl+Shift+T', description: 'Toggle theme', category: 'Features' }
    ]
  }
];

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'features' | 'tips'>('shortcuts');

  if (!isOpen) {
    return null;
  }

  const tabs = [
    { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️' },
    { id: 'features', label: 'Features Guide', icon: '📚' },
    { id: 'tips', label: 'Tips & Tricks', icon: '💡' }
  ] as const;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            color: colors.text,
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            Help & Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Close help"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          padding: '0 24px'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? colors.primary : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? 'white' : colors.text,
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          overflow: 'auto',
          flex: 1
        }}>
          {activeTab === 'shortcuts' && (
            <div>
              {shortcutGroups.map(group => (
                <div key={group.title} style={{ marginBottom: '24px' }}>
                  <h3 style={{
                    color: colors.text,
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {group.title}
                  </h3>
                  <div style={{
                    display: 'grid',
                    gap: '8px'
                  }}>
                    {group.shortcuts.map(shortcut => (
                      <div key={shortcut.key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: colors.surfaceHover,
                        borderRadius: '4px',
                        border: `1px solid ${colors.border}`
                      }}>
                        <span style={{
                          color: colors.text,
                          fontSize: '14px'
                        }}>
                          {shortcut.description}
                        </span>
                        <kbd style={{
                          background: colors.background,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '3px',
                          padding: '2px 6px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          color: colors.text
                        }}>
                          {shortcut.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'features' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  color: colors.text,
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  📝 Markdown Editor
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Write notes using Markdown syntax. Use # for headings, ** for bold, - for lists, and [[Note Title]] for internal links.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  color: colors.text,
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  🔍 Enhanced Search
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Find notes with fuzzy matching, search history, and real-time suggestions. Search across titles, content, and tags.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  color: colors.text,
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  🕸️ Knowledge Graph
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Visualize your notes and their connections. Drag nodes to rearrange, zoom to explore, and see relationship patterns.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  color: colors.text,
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  🤖 AI Analysis
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Get AI-powered summaries, ask questions about your notes, and discover insights about your knowledge base.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{
                  color: colors.text,
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  📤 Export & Import
                </h3>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Backup your notes as JSON or CSV files. Import notes from other devices while maintaining all metadata.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  color: colors.text,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  💡 Pro Tips
                </h4>
                <ul style={{
                  color: colors.textSecondary,
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  <li>Use tags consistently to organize related notes</li>
                  <li>Create internal links to build a connected knowledge base</li>
                  <li>Use the graph view to discover hidden connections</li>
                  <li>Export your notes regularly as backup</li>
                  <li>Use keyboard shortcuts for faster navigation</li>
                </ul>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  color: colors.text,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🔗 Internal Linking
                </h4>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Use double brackets to create links: <code style={{
                    background: colors.surfaceHover,
                    padding: '2px 4px',
                    borderRadius: '3px',
                    fontSize: '12px'
                  }}>[[Note Title]]</code>
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  color: colors.text,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🏷️ Tagging Strategy
                </h4>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Use descriptive tags like "programming", "javascript", "tutorial" to make notes easily discoverable.
                </p>
              </div>

              <div>
                <h4 style={{
                  color: colors.text,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  🔄 Workflow
                </h4>
                <p style={{
                  color: colors.textSecondary,
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  1. Create notes with clear titles<br/>
                  2. Add relevant tags for organization<br/>
                  3. Link related notes together<br/>
                  4. Use search to find what you need<br/>
                  5. Explore connections in graph view
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HelpPanel; 