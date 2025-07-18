import React, { useState } from 'react';
import { usePlugins, usePluginSettings } from '../../hooks/usePlugins';
import { Plugin } from '../../types/plugins';
import { useThemeStore } from '../../store/themeStore';

interface PluginManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PluginManager({ isOpen, onClose }: PluginManagerProps) {
  const { colors } = useThemeStore();
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

  if (!isOpen) return null;

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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
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
          <div>
            <h2 style={{
              color: colors.text,
              margin: '0 0 4px 0',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              Plugin Manager
            </h2>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: colors.textSecondary
            }}>
              {plugins.length} total plugins, {enabledPlugins.length} enabled
            </p>
          </div>
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
            title="Close plugin manager"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div style={{
            padding: '12px',
            margin: '16px 24px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            color: '#c33'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          padding: '0 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          gap: '8px'
        }}>
          {[
            { id: 'all', label: 'All Plugins' },
            { id: 'enabled', label: 'Enabled' },
            { id: 'themes', label: 'Themes' },
            { id: 'features', label: 'Features' },
            { id: 'utilities', label: 'Utilities' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? colors.primary : 'transparent',
                color: activeTab === tab.id ? 'white' : colors.text,
                border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = colors.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

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