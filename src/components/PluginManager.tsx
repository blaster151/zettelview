import React, { useState, useEffect } from 'react';
import { PluginSystem, Plugin, PluginManifest, PluginSetting } from '../services/pluginSystem';

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginManager: React.FC<PluginManagerProps> = ({
  isOpen,
  onClose
}) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace' | 'settings'>('installed');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    if (isOpen) {
      loadPlugins();
    }
  }, [isOpen]);

  const loadPlugins = () => {
    const allPlugins = PluginSystem.getPlugins();
    setPlugins(allPlugins);
  };

  const handleEnablePlugin = async (pluginId: string) => {
    setIsLoading(true);
    try {
      await PluginSystem.enablePlugin(pluginId);
      loadPlugins();
    } catch (error) {
      console.error('Failed to enable plugin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePlugin = async (pluginId: string) => {
    setIsLoading(true);
    try {
      await PluginSystem.disablePlugin(pluginId);
      loadPlugins();
    } catch (error) {
      console.error('Failed to disable plugin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUninstallPlugin = (pluginId: string) => {
    if (window.confirm('Are you sure you want to uninstall this plugin? This action cannot be undone.')) {
      PluginSystem.unloadPlugin(pluginId);
      loadPlugins();
      setSelectedPlugin(null);
    }
  };

  const handlePluginConfigChange = (pluginId: string, key: string, value: any) => {
    PluginSystem.setPluginSetting(pluginId, key, value);
    loadPlugins();
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEnabled === 'all' ||
                         (filterEnabled === 'enabled' && plugin.enabled) ||
                         (filterEnabled === 'disabled' && !plugin.enabled);
    return matchesSearch && matchesFilter;
  });

  const getPluginStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-gray-500';
  };

  const getPluginStatusIcon = (enabled: boolean) => {
    return enabled ? '●' : '○';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Plugin Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close plugin manager"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('installed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'installed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Installed Plugins
            </button>
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Plugin Marketplace
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Global Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'installed' && (
            <div className="h-full flex">
              {/* Plugin List */}
              <div className="w-1/2 p-6 border-r overflow-y-auto">
                <div className="mb-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search plugins..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={filterEnabled}
                      onChange={(e) => setFilterEnabled(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Plugins</option>
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredPlugins.map(plugin => (
                    <div
                      key={plugin.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPlugin?.id === plugin.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPlugin(plugin)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-sm ${getPluginStatusColor(plugin.enabled)}`}>
                              {getPluginStatusIcon(plugin.enabled)}
                            </span>
                            <h3 className="font-medium text-gray-900">{plugin.name}</h3>
                            <span className="text-xs text-gray-500">v{plugin.version}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{plugin.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">by {plugin.author}</span>
                            {plugin.homepage && (
                              <a
                                href={plugin.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Homepage
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (plugin.enabled) {
                                handleDisablePlugin(plugin.id);
                              } else {
                                handleEnablePlugin(plugin.id);
                              }
                            }}
                            disabled={isLoading}
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              plugin.enabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } disabled:opacity-50`}
                          >
                            {plugin.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPlugins.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p>No plugins found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>

              {/* Plugin Details */}
              <div className="w-1/2 p-6 overflow-y-auto">
                {selectedPlugin ? (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{selectedPlugin.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedPlugin.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedPlugin.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <button
                            onClick={() => handleUninstallPlugin(selectedPlugin.id)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Uninstall
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{selectedPlugin.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Version</h4>
                            <p className="text-sm text-gray-600">{selectedPlugin.version}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Author</h4>
                            <p className="text-sm text-gray-600">{selectedPlugin.author}</p>
                          </div>
                          {selectedPlugin.homepage && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">Homepage</h4>
                              <a
                                href={selectedPlugin.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Visit Homepage
                              </a>
                            </div>
                          )}
                          {selectedPlugin.license && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-1">License</h4>
                              <p className="text-sm text-gray-600">{selectedPlugin.license}</p>
                            </div>
                          )}
                        </div>

                        {selectedPlugin.dependencies && selectedPlugin.dependencies.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Dependencies</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedPlugin.dependencies.map(dep => (
                                <span key={dep} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                  {dep}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plugin Settings */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Settings</h4>
                      <PluginSettings
                        plugin={selectedPlugin}
                        onSettingChange={handlePluginConfigChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>Select a plugin to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Plugin Marketplace</h3>
                <p className="text-gray-600 mb-4">
                  Browse and install plugins from the marketplace
                </p>
                <p className="text-sm text-gray-500">
                  Coming soon! The plugin marketplace will allow you to discover and install new plugins.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plugin System Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enable plugin system</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked={true}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-update plugins</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked={false}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Allow experimental plugins</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plugin Storage Location
                      </label>
                      <input
                        type="text"
                        defaultValue="./plugins"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Plugin Memory Usage (MB)
                      </label>
                      <input
                        type="number"
                        defaultValue={100}
                        min={10}
                        max={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Plugin Statistics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{plugins.length}</div>
                      <div className="text-sm text-gray-600">Total Plugins</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {plugins.filter(p => p.enabled).length}
                      </div>
                      <div className="text-sm text-gray-600">Enabled Plugins</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {plugins.length} plugin{plugins.length !== 1 ? 's' : ''} installed
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Plugin Settings Component
interface PluginSettingsProps {
  plugin: Plugin;
  onSettingChange: (pluginId: string, key: string, value: any) => void;
}

const PluginSettings: React.FC<PluginSettingsProps> = ({ plugin, onSettingChange }) => {
  const manifest = PluginSystem.getPluginManifest(plugin.id);
  const settings = manifest?.settings || [];

  if (settings.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        <p className="text-sm">This plugin has no configurable settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {settings.map(setting => (
        <div key={setting.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {setting.label}
            {setting.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {setting.type === 'string' && (
            <input
              type="text"
              value={plugin.config[setting.key] || setting.default}
              onChange={(e) => onSettingChange(plugin.id, setting.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={setting.description}
            />
          )}

          {setting.type === 'number' && (
            <input
              type="number"
              value={plugin.config[setting.key] || setting.default}
              onChange={(e) => onSettingChange(plugin.id, setting.key, Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}

          {setting.type === 'boolean' && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={plugin.config[setting.key] ?? setting.default}
                onChange={(e) => onSettingChange(plugin.id, setting.key, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{setting.description}</span>
            </label>
          )}

          {setting.type === 'select' && setting.options && (
            <select
              value={plugin.config[setting.key] || setting.default}
              onChange={(e) => onSettingChange(plugin.id, setting.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {setting.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {setting.type === 'textarea' && (
            <textarea
              value={plugin.config[setting.key] || setting.default}
              onChange={(e) => onSettingChange(plugin.id, setting.key, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={setting.description}
            />
          )}

          {setting.description && setting.type !== 'boolean' && (
            <p className="mt-1 text-xs text-gray-500">{setting.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}; 