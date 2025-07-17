import React, { useState } from 'react';
import { usePlugins, usePluginSettings } from '../../hooks/usePlugins';
import { Plugin } from '../../types/plugins';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Tabs, Tab } from '../ui/Tabs';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { ColorPicker } from '../ui/ColorPicker';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginManager({ isOpen, onClose }: PluginManagerProps) {
  const {
    plugins,
    enabledPlugins,
    loading,
    error,
    enablePlugin,
    disablePlugin,
    updatePluginSettings,
    getPluginsByCategory
  } = usePlugins();

  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'enabled' | 'themes' | 'features' | 'utilities'>('all');

  const handleTogglePlugin = async (plugin: Plugin) => {
    try {
      if (plugin.isEnabled) {
        await disablePlugin(plugin.id);
      } else {
        await enablePlugin(plugin.id);
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  const handleOpenSettings = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
  };

  const getFilteredPlugins = () => {
    switch (activeTab) {
      case 'enabled':
        return enabledPlugins;
      case 'themes':
        return getPluginsByCategory('theme');
      case 'features':
        return getPluginsByCategory('feature');
      case 'utilities':
        return getPluginsByCategory('utility');
      default:
        return plugins;
    }
  };

  const getCategoryIcon = (category: Plugin['category']) => {
    switch (category) {
      case 'theme':
        return '🎨';
      case 'feature':
        return '⚡';
      case 'integration':
        return '🔗';
      case 'utility':
        return '🛠️';
      default:
        return '📦';
    }
  };

  const getCategoryColor = (category: Plugin['category']) => {
    switch (category) {
      case 'theme':
        return 'purple';
      case 'feature':
        return 'blue';
      case 'integration':
        return 'green';
      case 'utility':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Plugin Manager">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3">Loading plugins...</span>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Plugin Manager" size="large">
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <Icon name="alert-circle" className="text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tab value="all" label="All Plugins" />
            <Tab value="enabled" label="Enabled" />
            <Tab value="themes" label="Themes" />
            <Tab value="features" label="Features" />
            <Tab value="utilities" label="Utilities" />
          </Tabs>

          <div className="grid gap-4">
            {getFilteredPlugins().map((plugin) => (
              <div
                key={plugin.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(plugin.category)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">{plugin.name}</h3>
                          <Badge color={getCategoryColor(plugin.category)}>
                            {plugin.category}
                          </Badge>
                          {plugin.isBuiltIn && (
                            <Badge color="gray">Built-in</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{plugin.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>v{plugin.version}</span>
                          <span>by {plugin.author}</span>
                          <span>⭐ {plugin.metadata.rating}</span>
                          <span>📥 {plugin.metadata.downloadCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {plugin.settings && plugin.settings.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSettings(plugin)}
                      >
                        <Icon name="settings" className="w-4 h-4" />
                        Settings
                      </Button>
                    )}
                    
                    <Switch
                      checked={plugin.isEnabled}
                      onChange={() => handleTogglePlugin(plugin)}
                      disabled={plugin.isBuiltIn}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getFilteredPlugins().length === 0 && (
            <div className="text-center py-8">
              <Icon name="package" className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'enabled' 
                  ? 'No plugins are currently enabled.'
                  : 'No plugins match the current filter.'
                }
              </p>
            </div>
          )}
        </div>
      </Modal>

      {selectedPlugin && (
        <PluginSettings
          plugin={selectedPlugin}
          isOpen={!!selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onUpdate={(settings) => {
            updatePluginSettings(selectedPlugin.id, settings);
            setSelectedPlugin(null);
          }}
        />
      )}
    </>
  );
}

interface PluginSettingsProps {
  plugin: Plugin;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (settings: any) => void;
}

function PluginSettings({ plugin, isOpen, onClose, onUpdate }: PluginSettingsProps) {
  const { settings, updateSettings } = usePluginSettings(plugin.id);
  const [formData, setFormData] = useState<any>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleInputChange = (settingId: string, value: any) => {
    setFormData(prev => ({ ...prev, [settingId]: value }));
  };

  const renderSettingInput = (setting: any) => {
    switch (setting.type) {
      case 'string':
        return (
          <Input
            value={formData[setting.id] || ''}
            onChange={(e) => handleInputChange(setting.id, e.target.value)}
            placeholder={setting.description}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={formData[setting.id] || ''}
            onChange={(e) => handleInputChange(setting.id, Number(e.target.value))}
            min={setting.validation?.min}
            max={setting.validation?.max}
          />
        );
      
      case 'boolean':
        return (
          <Switch
            checked={formData[setting.id] || false}
            onChange={(checked) => handleInputChange(setting.id, checked)}
          />
        );
      
      case 'select':
        return (
          <Select
            value={formData[setting.id] || ''}
            onChange={(value) => handleInputChange(setting.id, value)}
            options={setting.options || []}
          />
        );
      
      case 'color':
        return (
          <ColorPicker
            value={formData[setting.id] || '#000000'}
            onChange={(color) => handleInputChange(setting.id, color)}
          />
        );
      
      case 'file':
        return (
          <Input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleInputChange(setting.id, file);
              }
            }}
          />
        );
      
      default:
        return (
          <Input
            value={formData[setting.id] || ''}
            onChange={(e) => handleInputChange(setting.id, e.target.value)}
          />
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${plugin.name} Settings`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {plugin.settings?.map((setting) => (
            <div key={setting.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {setting.name}
                {setting.validation?.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <p className="text-sm text-gray-500">{setting.description}</p>
              {renderSettingInput(setting)}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Settings
          </Button>
        </div>
      </form>
    </Modal>
  );
} 