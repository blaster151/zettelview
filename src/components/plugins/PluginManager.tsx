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
import PluginAPIDocumentation from '../PluginAPIDocumentation';

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
  const [showAPIDocs, setShowAPIDocs] = useState(false);

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

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Plugin Manager" size="large">
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header with API Docs button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                Manage Plugins
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                {plugins.length} total plugins, {enabledPlugins.length} enabled
              </p>
            </div>
            <Button
              onClick={() => setShowAPIDocs(true)}
              variant="outline"
              size="small"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="book" size={14} />
              API Docs
            </Button>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              borderRadius: '6px',
              color: 'var(--error-text)'
            }}>
              {error}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tab value="all" label="All Plugins" />
            <Tab value="enabled" label="Enabled" />
            <Tab value="themes" label="Themes" />
            <Tab value="features" label="Features" />
            <Tab value="utilities" label="Utilities" />
          </Tabs>

          {/* Plugin list */}
          <div style={{ flex: 1, overflow: 'auto', marginTop: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Loading plugins...
              </div>
            ) : getFilteredPlugins().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No plugins found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getFilteredPlugins().map(plugin => (
                  <div
                    key={plugin.id}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      background: 'var(--surface-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ fontSize: '24px' }}>
                        {getCategoryIcon(plugin.category)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                            {plugin.name}
                          </h4>
                          <Badge color={getCategoryColor(plugin.category)}>
                            {plugin.category}
                          </Badge>
                          {plugin.isBuiltIn && (
                            <Badge color="gray">Built-in</Badge>
                          )}
                          {plugin.isEnabled && (
                            <Badge color="green">Active</Badge>
                          )}
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {plugin.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>v{plugin.version}</span>
                          <span>by {plugin.author}</span>
                          <span>📥 {plugin.metadata.downloadCount}</span>
                          <span>⭐ {plugin.metadata.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!plugin.isBuiltIn && (
                        <Switch
                          checked={plugin.isEnabled}
                          onChange={() => handleTogglePlugin(plugin)}
                          disabled={loading}
                        />
                      )}
                      <Button
                        onClick={() => handleOpenSettings(plugin)}
                        variant="outline"
                        size="small"
                      >
                        Settings
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Plugin Settings Modal */}
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

      {/* API Documentation Modal */}
      <PluginAPIDocumentation
        isOpen={showAPIDocs}
        onClose={() => setShowAPIDocs(false)}
      />
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