import React, { useState, useEffect } from 'react';
import { PluginSystem, Plugin, PluginManifest } from '../services/pluginSystem';

// Example plugin manifests
const examplePlugins: PluginManifest[] = [
  {
    id: 'word-counter',
    name: 'Word Counter',
    version: '1.0.0',
    description: 'Counts words, characters, and paragraphs in your notes',
    author: 'ZettelView Team',
    license: 'MIT',
    main: 'word-counter.js',
    settings: [
      {
        key: 'countCharacters',
        label: 'Count Characters',
        type: 'boolean',
        default: true,
        description: 'Include character count in statistics'
      },
      {
        key: 'countParagraphs',
        label: 'Count Paragraphs',
        type: 'boolean',
        default: true,
        description: 'Include paragraph count in statistics'
      },
      {
        key: 'showInSidebar',
        label: 'Show in Sidebar',
        type: 'boolean',
        default: true,
        description: 'Display word count in the sidebar'
      }
    ]
  },
  {
    id: 'auto-save',
    name: 'Auto Save',
    version: '1.0.0',
    description: 'Automatically saves your notes at regular intervals',
    author: 'ZettelView Team',
    license: 'MIT',
    main: 'auto-save.js',
    settings: [
      {
        key: 'saveInterval',
        label: 'Save Interval (seconds)',
        type: 'number',
        default: 30,
        description: 'How often to auto-save notes'
      },
      {
        key: 'showNotifications',
        label: 'Show Notifications',
        type: 'boolean',
        default: false,
        description: 'Show notifications when auto-saving'
      }
    ]
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    version: '1.0.0',
    description: 'Adds dark mode support to the application',
    author: 'ZettelView Team',
    license: 'MIT',
    main: 'dark-mode.js',
    settings: [
      {
        key: 'autoSwitch',
        label: 'Auto Switch',
        type: 'boolean',
        default: true,
        description: 'Automatically switch based on system preference'
      },
      {
        key: 'theme',
        label: 'Theme',
        type: 'select',
        default: 'system',
        options: [
          { label: 'System', value: 'system' },
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' }
        ],
        description: 'Choose your preferred theme'
      }
    ]
  },
  {
    id: 'export-scheduler',
    name: 'Export Scheduler',
    version: '1.0.0',
    description: 'Automatically exports your notes on a schedule',
    author: 'ZettelView Team',
    license: 'MIT',
    main: 'export-scheduler.js',
    settings: [
      {
        key: 'schedule',
        label: 'Export Schedule',
        type: 'select',
        default: 'daily',
        options: [
          { label: 'Daily', value: 'daily' },
          { label: 'Weekly', value: 'weekly' },
          { label: 'Monthly', value: 'monthly' }
        ],
        description: 'How often to export notes'
      },
      {
        key: 'format',
        label: 'Export Format',
        type: 'select',
        default: 'json',
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Markdown', value: 'markdown' },
          { label: 'HTML', value: 'html' }
        ],
        description: 'Format for exported files'
      },
      {
        key: 'destination',
        label: 'Export Destination',
        type: 'string',
        default: './exports',
        description: 'Folder to save exported files'
      }
    ]
  },
  {
    id: 'note-templates',
    name: 'Note Templates',
    version: '1.0.0',
    description: 'Provides templates for common note types',
    author: 'ZettelView Team',
    license: 'MIT',
    main: 'note-templates.js',
    settings: [
      {
        key: 'defaultTemplate',
        label: 'Default Template',
        type: 'select',
        default: 'blank',
        options: [
          { label: 'Blank', value: 'blank' },
          { label: 'Meeting Notes', value: 'meeting' },
          { label: 'Project Plan', value: 'project' },
          { label: 'Research Notes', value: 'research' }
        ],
        description: 'Default template for new notes'
      },
      {
        key: 'showTemplatePicker',
        label: 'Show Template Picker',
        type: 'boolean',
        default: true,
        description: 'Show template picker when creating notes'
      }
    ]
  },
  {
    id: 'search-highlighter',
    name: 'Search Highlighter',
    version: '1.0.0',
    description: 'Highlights search terms in note content',
    author: 'ZettelView Team',
    license: 'MIT',
    main: 'search-highlighter.js',
    settings: [
      {
        key: 'highlightColor',
        label: 'Highlight Color',
        type: 'select',
        default: 'yellow',
        options: [
          { label: 'Yellow', value: 'yellow' },
          { label: 'Green', value: 'green' },
          { label: 'Blue', value: 'blue' },
          { label: 'Pink', value: 'pink' }
        ],
        description: 'Color for search term highlights'
      },
      {
        key: 'caseSensitive',
        label: 'Case Sensitive',
        type: 'boolean',
        default: false,
        description: 'Make search highlighting case sensitive'
      }
    ]
  }
];

// Example plugin code snippets
const pluginCodeExamples = {
  'word-counter': `
// Word Counter Plugin
const hooks = {
  onNoteUpdate: (note) => {
    const wordCount = note.body.split(\\s+/).length;
    const charCount = note.body.length;
    const paragraphCount = note.body.split('\\n\\n').length;
    
    api.ui.showNotification(\`Word count: \${wordCount}\`);
  }
};

const api = {
  notes: {
    getAll: () => [],
    getById: (id) => null,
    create: (note) => note,
    update: (id, updates) => updates,
    delete: (id) => true,
    search: (query) => []
  },
  ui: {
    showNotification: (message) => console.log(message),
    showModal: (title, content) => console.log(title, content),
    addMenuItem: (label, action) => console.log('Menu item:', label),
    addToolbarButton: (label, icon, action) => console.log('Toolbar button:', label),
    addSidebarPanel: (title, content) => console.log('Sidebar panel:', title)
  },
  storage: {
    get: (key) => null,
    set: (key, value) => console.log('Set:', key, value),
    remove: (key) => console.log('Remove:', key),
    clear: () => console.log('Clear storage')
  },
  utils: {
    debounce: (func, wait) => func,
    throttle: (func, limit) => func,
    formatDate: (date) => date.toISOString(),
    generateId: () => Math.random().toString(36),
    sanitizeHtml: (html) => html,
    markdownToHtml: (markdown) => markdown,
    htmlToMarkdown: (html) => html
  }
};
  `,
  'auto-save': `
// Auto Save Plugin
let saveInterval;

const hooks = {
  onAppStart: () => {
    const interval = api.storage.get('saveInterval') || 30;
    saveInterval = setInterval(() => {
      const notes = api.notes.getAll();
      // Auto-save logic here
      if (api.storage.get('showNotifications')) {
        api.ui.showNotification('Auto-saved notes');
      }
    }, interval * 1000);
  },
  
  onAppShutdown: () => {
    if (saveInterval) {
      clearInterval(saveInterval);
    }
  }
};
  `,
  'dark-mode': `
// Dark Mode Plugin
const hooks = {
  onAppStart: () => {
    const theme = api.storage.get('theme') || 'system';
    applyTheme(theme);
  },
  
  onThemeChange: (theme) => {
    applyTheme(theme);
  }
};

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
  `
};

export const PluginDemo: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginManifest | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'examples' | 'development'>('overview');
  const [isInstalling, setIsInstalling] = useState(false);
  const [pluginEvents, setPluginEvents] = useState<any[]>([]);

  useEffect(() => {
    loadPlugins();
    setupEventListeners();
  }, []);

  const loadPlugins = () => {
    const allPlugins = PluginSystem.getPlugins();
    setPlugins(allPlugins);
  };

  const setupEventListeners = () => {
    PluginSystem.onEvent('plugin_error', (event) => {
      setPluginEvents(prev => [...prev, { ...event, type: 'error' }]);
    });

    PluginSystem.onEvent('plugin_action', (event) => {
      setPluginEvents(prev => [...prev, { ...event, type: 'action' }]);
    });
  };

  const handleInstallPlugin = async (manifest: PluginManifest) => {
    setIsInstalling(true);
    try {
      // Simulate plugin installation
      const pluginCode = pluginCodeExamples[manifest.id as keyof typeof pluginCodeExamples] || '';
      
      const plugin = await PluginSystem.loadPlugin(manifest, pluginCode);
      await PluginSystem.enablePlugin(plugin.id);
      
      loadPlugins();
      setSelectedPlugin(null);
    } catch (error) {
      console.error('Failed to install plugin:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstallPlugin = (pluginId: string) => {
    PluginSystem.unloadPlugin(pluginId);
    loadPlugins();
  };

  const getPluginStatus = (pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId);
    return plugin ? (plugin.enabled ? 'enabled' : 'disabled') : 'not-installed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enabled': return 'text-green-600';
      case 'disabled': return 'text-yellow-600';
      case 'not-installed': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enabled': return '●';
      case 'disabled': return '○';
      case 'not-installed': return '○';
      default: return '○';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Plugin System Demo</h1>
        <p className="text-lg text-gray-600">
          Explore the extensible plugin system and see how it can enhance ZettelView
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'examples'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Example Plugins
          </button>
          <button
            onClick={() => setActiveTab('development')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'development'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Development Guide
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Plugin System Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Key Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Hot-reloadable plugin system
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Comprehensive API for plugins
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Event-driven architecture
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Sandboxed execution environment
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Plugin Capabilities</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Extend note functionality
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Add UI components
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Integrate external services
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Customize workflows
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Plugin Statistics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{plugins.length}</div>
                <div className="text-sm text-gray-600">Installed Plugins</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {plugins.filter(p => p.enabled).length}
                </div>
                <div className="text-sm text-gray-600">Enabled Plugins</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{examplePlugins.length}</div>
                <div className="text-sm text-gray-600">Available Examples</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{pluginEvents.length}</div>
                <div className="text-sm text-gray-600">Plugin Events</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Plugin Events</h2>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pluginEvents.length > 0 ? (
                pluginEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.type}
                      </span>
                      <span className="ml-2 text-sm text-gray-600">{event.pluginId}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No plugin events yet</p>
                  <p className="text-sm">Install and use plugins to see events here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Example Plugins</h2>
            <p className="text-gray-600 mb-6">
              Explore these example plugins to understand the plugin system capabilities
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {examplePlugins.map(manifest => {
                const status = getPluginStatus(manifest.id);
                return (
                  <div key={manifest.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-sm ${getStatusColor(status)}`}>
                            {getStatusIcon(status)}
                          </span>
                          <h3 className="font-medium text-gray-900">{manifest.name}</h3>
                          <span className="text-xs text-gray-500">v{manifest.version}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{manifest.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>by {manifest.author}</span>
                          {manifest.license && (
                            <span>• {manifest.license}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {manifest.settings && manifest.settings.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Settings</h4>
                        <div className="flex flex-wrap gap-1">
                          {manifest.settings.slice(0, 3).map(setting => (
                            <span key={setting.key} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {setting.label}
                            </span>
                          ))}
                          {manifest.settings.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              +{manifest.settings.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        status === 'enabled' ? 'bg-green-100 text-green-800' :
                        status === 'disabled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {status.replace('-', ' ')}
                      </span>
                      
                      <div className="flex space-x-2">
                        {status === 'not-installed' ? (
                          <button
                            onClick={() => handleInstallPlugin(manifest)}
                            disabled={isInstalling}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isInstalling ? 'Installing...' : 'Install'}
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedPlugin(manifest)}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              Configure
                            </button>
                            <button
                              onClick={() => handleUninstallPlugin(manifest.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                            >
                              Uninstall
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plugin Configuration Modal */}
          {selectedPlugin && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-5/6 overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Configure {selectedPlugin.name}</h3>
                    <button
                      onClick={() => setSelectedPlugin(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {selectedPlugin.settings?.map(setting => (
                      <div key={setting.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {setting.label}
                        </label>
                        
                        {setting.type === 'string' && (
                          <input
                            type="text"
                            defaultValue={setting.default}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={setting.description}
                          />
                        )}

                        {setting.type === 'number' && (
                          <input
                            type="number"
                            defaultValue={setting.default}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}

                        {setting.type === 'boolean' && (
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              defaultChecked={setting.default}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{setting.description}</span>
                          </label>
                        )}

                        {setting.type === 'select' && setting.options && (
                          <select
                            defaultValue={setting.default}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {setting.options.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {setting.description && setting.type !== 'boolean' && (
                          <p className="mt-1 text-xs text-gray-500">{setting.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setSelectedPlugin(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setSelectedPlugin(null)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'development' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Plugin Development Guide</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Creating a Plugin</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
                    <code>{`// Basic plugin structure
const manifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'Description of my plugin',
  author: 'Your Name',
  license: 'MIT',
  main: 'my-plugin.js',
  settings: [
    {
      key: 'enabled',
      label: 'Enable Plugin',
      type: 'boolean',
      default: true
    }
  ]
};

const hooks = {
  onNoteCreate: (note) => {
    // Handle new note creation
  },
  onNoteUpdate: (note, previousNote) => {
    // Handle note updates
  }
};`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Available Hooks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">Note Events</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• onNoteCreate</li>
                      <li>• onNoteUpdate</li>
                      <li>• onNoteDelete</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">App Events</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• onAppStart</li>
                      <li>• onAppShutdown</li>
                      <li>• onThemeChange</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Plugin API</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
                    <code>{`// Available API methods
api.notes.getAll()           // Get all notes
api.notes.getById(id)        // Get note by ID
api.notes.create(note)       // Create new note
api.notes.update(id, data)   // Update note
api.notes.delete(id)         // Delete note
api.notes.search(query)      // Search notes

api.ui.showNotification(msg) // Show notification
api.ui.showModal(title, content) // Show modal
api.ui.addMenuItem(label, action) // Add menu item
api.ui.addToolbarButton(label, icon, action) // Add toolbar button

api.storage.get(key)         // Get stored value
api.storage.set(key, value)  // Store value
api.storage.remove(key)      // Remove stored value
api.storage.clear()          // Clear all stored values

api.utils.debounce(func, wait)   // Debounce function
api.utils.throttle(func, limit)  // Throttle function
api.utils.formatDate(date)       // Format date
api.utils.generateId()           // Generate unique ID`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Example Plugin Code</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm">
                    <code>{pluginCodeExamples['word-counter']}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 