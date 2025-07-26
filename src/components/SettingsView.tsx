import React, { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useUIStore } from '../store/uiStore';
import { cn } from '../lib/utils';

interface SettingsViewProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  isOpen = true, 
  onClose, 
  className = '' 
}) => {
  const { theme, setTheme, colors } = useThemeStore();
  const { viewMode, setViewMode } = useUIStore();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'editor' | 'sync' | 'advanced'>('general');

  if (!isOpen) {
    return null;
  }

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'editor', label: 'Editor', icon: '✏️' },
    { id: 'sync', label: 'Sync', icon: '🔄' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ] as const;

  return (
    <div className={cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4',
      className
    )}>
      <div className="w-full max-w-4xl h-[80vh] bg-surface border border-border rounded-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Close settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-muted/50">
            <nav className="p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-1',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent'
                  )}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">General Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Default View Mode
                      </label>
                      <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'editor' | 'graph' | 'calendar')}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="editor">Editor</option>
                        <option value="graph">Graph</option>
                        <option value="calendar">Calendar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Auto-save Interval (seconds)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="300"
                        defaultValue="30"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Enable keyboard shortcuts
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Show welcome screen on startup
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['light', 'dark', 'system'] as const).map((themeOption) => (
                          <button
                            key={themeOption}
                            onClick={() => setTheme(themeOption)}
                            className={cn(
                              'p-3 border rounded-md text-sm transition-colors',
                              theme === themeOption
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-background text-foreground hover:bg-accent'
                            )}
                          >
                            {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Font Size
                      </label>
                      <select
                        defaultValue="medium"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Line Height
                      </label>
                      <select
                        defaultValue="1.5"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="1.2">Compact</option>
                        <option value="1.5">Normal</option>
                        <option value="1.8">Relaxed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editor' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Editor Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Enable spell check
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Show line numbers
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Enable word wrap
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Tab Size
                      </label>
                      <select
                        defaultValue="2"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="2">2 spaces</option>
                        <option value="4">4 spaces</option>
                        <option value="8">8 spaces</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Sync Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Enable cloud sync
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Sync on startup
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Sync Interval (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        defaultValue="5"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Sync Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Advanced Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Enable debug mode
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Enable analytics
                        </span>
                      </label>
                    </div>

                    <div>
                      <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors">
                        Clear All Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground hover:bg-accent rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView; 