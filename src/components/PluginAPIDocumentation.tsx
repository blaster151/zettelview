import React, { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { AVAILABLE_PERMISSIONS } from '../services/pluginPermissions';

interface PluginAPIDocumentationProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const PluginAPIDocumentation: React.FC<PluginAPIDocumentationProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'permissions' | 'examples'>('overview');

  if (!isOpen) return null;

  const apiExamples = [
    {
      title: 'Basic Plugin Structure',
      description: 'How to create a basic plugin',
      code: `// my-plugin.js
const MyPlugin = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  
  init: async (api) => {
    // Plugin initialization
    console.log('My plugin initialized');
  },
  
  destroy: () => {
    // Cleanup when plugin is disabled
    console.log('My plugin destroyed');
  }
};

// Register the plugin
window.pluginAPI.registerPlugin(MyPlugin);`
    },
    {
      title: 'Note Management',
      description: 'Working with notes',
      code: `// Create a new note
const noteId = await api.notes.create('My Note', {
  body: '# Hello World\\n\\nThis is my note content.',
  tags: ['example', 'plugin']
});

// Get all notes
const allNotes = api.notes.getAll();

// Search for notes
const searchResults = await api.notes.search('hello world');

// Update a note
await api.notes.update(noteId, {
  title: 'Updated Note Title',
  tags: ['updated', 'example']
});`
    },
    {
      title: 'UI Integration',
      description: 'Adding UI elements',
      code: `// Register a custom panel
api.ui.registerPanel('my-panel', MyPanelComponent, {
  title: 'My Panel',
  icon: '🔧',
  position: 'right',
  defaultOpen: false
});

// Register a command
api.ui.registerCommand('my-command', {
  name: 'My Command',
  description: 'Execute my custom command',
  shortcut: 'Ctrl+Shift+M',
  execute: (context) => {
    api.ui.showNotification('Command executed!', 'success');
  }
});

// Show notifications
api.ui.showNotification('Hello from plugin!', 'info', 3000);`
    },
    {
      title: 'Storage and Events',
      description: 'Using storage and events',
      code: `// Store plugin data
api.storage.set('my-setting', { enabled: true, count: 0 });

// Retrieve stored data
const settings = api.storage.get('my-setting');

// Listen for events
api.events.on('note.created', (data) => {
  console.log('New note created:', data.noteId);
});

// Emit custom events
api.events.emit('my-plugin.action', { action: 'completed' });`
    },
    {
      title: 'External API Access',
      description: 'Making external requests',
      code: `// Make API requests
try {
  const response = await api.api.request('https://api.example.com/data');
  const data = await response.json();
  
  // Process the data
  api.ui.showNotification('Data loaded successfully', 'success');
} catch (error) {
  api.ui.showNotification('Failed to load data', 'error');
}

// Using fetch directly
const response = await api.api.fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' })
});`
    }
  ];

  const permissionCategories = [
    { id: 'notes', name: 'Notes', icon: '📝' },
    { id: 'ui', name: 'User Interface', icon: '🎨' },
    { id: 'storage', name: 'Storage', icon: '💾' },
    { id: 'api', name: 'API Access', icon: '🌐' },
    { id: 'system', name: 'System', icon: '⚙️' }
  ];

  const getPermissionsByCategory = (category: string) => {
    return AVAILABLE_PERMISSIONS.filter(p => p.category === category);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return colors.textSecondary;
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          maxWidth: '900px',
          maxHeight: '90vh',
          width: '95%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: colors.text
          }}>
            Plugin API Documentation
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.textSecondary,
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
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`
        }}>
          {[
            { id: 'overview' as const, label: 'Overview' },
            { id: 'api' as const, label: 'API Reference' },
            { id: 'permissions' as const, label: 'Permissions' },
            { id: 'examples' as const, label: 'Examples' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? colors.primary : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#fff' : colors.text,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                Plugin API Overview
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Getting Started</h4>
                  <p style={{ margin: 0, color: colors.textSecondary, lineHeight: '1.5' }}>
                    The Plugin API provides a controlled interface for plugins to interact with ZettelView. 
                    All plugins have access to the API through the global <code>window.pluginAPI</code> object.
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Key Features</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: colors.textSecondary }}>
                    <li><strong>Note Management:</strong> Create, read, update, and delete notes</li>
                    <li><strong>UI Integration:</strong> Add panels, commands, and menu items</li>
                    <li><strong>Storage:</strong> Persistent data storage for plugins</li>
                    <li><strong>Events:</strong> Subscribe to and emit custom events</li>
                    <li><strong>External APIs:</strong> Make HTTP requests to external services</li>
                    <li><strong>Permissions:</strong> Granular permission system for security</li>
                  </ul>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Security</h4>
                  <p style={{ margin: 0, color: colors.textSecondary, lineHeight: '1.5' }}>
                    The Plugin API implements a permission-based security system. Plugins must request 
                    specific permissions to access different features. Users can grant or deny these 
                    permissions during plugin installation or runtime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                API Reference
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Notes API</h4>
                  <code style={{
                    display: 'block',
                    background: colors.surfaceActive,
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: colors.primary,
                    whiteSpace: 'pre-wrap'
                  }}>
{`api.notes.getAll()                    // Get all notes
api.notes.getById(id)                  // Get note by ID
api.notes.create(title, options)       // Create new note
api.notes.update(id, updates)          // Update note
api.notes.delete(id)                   // Delete note
api.notes.search(query, options)       // Search notes
api.notes.getByTag(tag)                // Get notes by tag
api.notes.getTags()                    // Get all tags`}
                  </code>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>UI API</h4>
                  <code style={{
                    display: 'block',
                    background: colors.surfaceActive,
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: colors.primary,
                    whiteSpace: 'pre-wrap'
                  }}>
{`api.ui.showNotification(message, type, duration)
api.ui.openModal(component, props)
api.ui.closeModal()
api.ui.registerPanel(id, component, options)
api.ui.unregisterPanel(id)
api.ui.registerCommand(id, command)
api.ui.unregisterCommand(id)
api.ui.registerMenuItem(id, menuItem)
api.ui.unregisterMenuItem(id)`}
                  </code>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Storage API</h4>
                  <code style={{
                    display: 'block',
                    background: colors.surfaceActive,
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: colors.primary,
                    whiteSpace: 'pre-wrap'
                  }}>
{`api.storage.get(key)                  // Get stored value
api.storage.set(key, value)             // Store value
api.storage.remove(key)                 // Remove value
api.storage.clear()                     // Clear all data
api.storage.has(key)                    // Check if key exists`}
                  </code>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Events API</h4>
                  <code style={{
                    display: 'block',
                    background: colors.surfaceActive,
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: colors.primary,
                    whiteSpace: 'pre-wrap'
                  }}>
{`api.events.on(event, callback)        // Listen for events
api.events.off(event, callback)         // Remove listener
api.events.emit(event, data)            // Emit custom event`}
                  </code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                Permissions Reference
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {permissionCategories.map(category => (
                  <div key={category.id} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    background: colors.background
                  }}>
                    <h4 style={{ 
                      margin: '0 0 12px 0', 
                      color: colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{category.icon}</span>
                      {category.name}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {getPermissionsByCategory(category.id).map(permission => (
                        <div key={permission.id} style={{
                          padding: '8px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.surface
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '4px'
                          }}>
                            <code style={{
                              background: colors.surfaceActive,
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '12px',
                              color: colors.primary
                            }}>
                              {permission.id}
                            </code>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#fff',
                              background: getRiskColor(permission.risk)
                            }}>
                              {permission.risk.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: colors.text, marginBottom: '4px' }}>
                            {permission.name}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {permission.description}
                          </div>
                          {permission.required && (
                            <div style={{
                              fontSize: '11px',
                              color: colors.primary,
                              fontWeight: '600',
                              marginTop: '4px'
                            }}>
                              Required
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                Code Examples
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {apiExamples.map((example, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    background: colors.background
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>
                      {example.title}
                    </h4>
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      color: colors.textSecondary,
                      fontSize: '14px'
                    }}>
                      {example.description}
                    </p>
                    <pre style={{
                      background: colors.surfaceActive,
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: colors.primary,
                      overflow: 'auto',
                      margin: 0,
                      whiteSpace: 'pre-wrap'
                    }}>
                      <code>{example.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`,
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: colors.primary,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary;
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PluginAPIDocumentation; 