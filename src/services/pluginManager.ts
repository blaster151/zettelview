import { 
  Plugin, 
  PluginManifest, 
  PluginContext, 
  PluginHook, 
  PluginEvent, 
  PluginRegistry 
} from '../types/plugins';
import { pluginAPI } from './pluginAPI';
import { pluginPermissionsService } from './pluginPermissions';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { useNotificationStore } from '../store/notificationStore';
import { SecurityMonitor } from '../utils/securityUtils';

class PluginManagerService implements PluginManager {
  private registry: PluginRegistry = {
    plugins: new Map(),
    hooks: new Map(),
    events: [],
    settings: new Map()
  };

  private context: PluginContext;
  private isInitialized = false;
  private securityMonitor: SecurityMonitor;

  constructor() {
    this.securityMonitor = new SecurityMonitor();
    this.context = this.createContext();
    this.loadBuiltInPlugins();
  }

  /**
   * Initialize the plugin manager with store references
   */
  initialize(): void {
    if (this.isInitialized) return;

    const noteStore = useNoteStore.getState();
    const themeStore = useThemeStore.getState();
    const notificationStore = useNotificationStore.getState();

    // Initialize the plugin API with store references
    pluginAPI.initialize(noteStore, themeStore, notificationStore);

    // Update context with actual store references
    this.context = this.createContext();
    this.isInitialized = true;

    this.securityMonitor.logViolation('PLUGIN_MANAGER_INITIALIZED', {}, 'low');
  }

  private createContext(): PluginContext {
    return {
      app: {
        version: '1.0.0',
        theme: 'light',
        locale: 'en'
      },
      notes: {
        getAll: () => {
          // This would be connected to the actual note store
          return [];
        },
        getById: (id: string) => {
          // This would be connected to the actual note store
          return null;
        },
        create: (title: string, body: string, tags?: string[]) => {
          // This would be connected to the actual note store
          return { id: Date.now().toString(), title, body, tags: tags || [] };
        },
        update: (id: string, updates: any) => {
          // This would be connected to the actual note store
          // Log plugin activity for security monitoring
          this.securityMonitor.logViolation('PLUGIN_NOTE_UPDATE', { 
            noteId: id, 
            updates 
          }, 'low');
        },
        delete: (id: string) => {
          // This would be connected to the actual note store
          this.securityMonitor.logViolation('PLUGIN_NOTE_DELETE', { 
            noteId: id 
          }, 'medium');
        }
      },
      ui: {
        showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
          // This would be connected to the actual UI notification system
          this.securityMonitor.logViolation('PLUGIN_NOTIFICATION', { 
            message, 
            type 
          }, 'low');
        },
        openModal: (component: React.ComponentType<any>, props?: any) => {
          // This would be connected to the actual modal system
          this.securityMonitor.logViolation('PLUGIN_MODAL_OPEN', { 
            component: component.name, 
            props 
          }, 'low');
        },
        closeModal: () => {
          // This would be connected to the actual modal system
          this.securityMonitor.logViolation('PLUGIN_MODAL_CLOSE', {}, 'low');
        }
      },
      storage: {
        get: (key: string) => {
          try {
            const item = localStorage.getItem(`plugin_${key}`);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.error('Plugin storage get error:', error);
            return null;
          }
        },
        set: (key: string, value: any) => {
          try {
            localStorage.setItem(`plugin_${key}`, JSON.stringify(value));
          } catch (error) {
            console.error('Plugin storage set error:', error);
          }
        },
        remove: (key: string) => {
          try {
            localStorage.removeItem(`plugin_${key}`);
          } catch (error) {
            console.error('Plugin storage remove error:', error);
          }
        }
      },
      api: {
        fetch: async (url: string, options?: RequestInit) => {
          // This would handle CORS and security for plugin API calls
          try {
            return await fetch(url, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...options?.headers
              }
            });
          } catch (error) {
            console.error('Plugin API fetch error:', error);
            throw error;
          }
        }
      }
    };
  }

  private loadBuiltInPlugins(): void {
    // Load built-in plugins
    const builtInPlugins: Plugin[] = [
      {
        id: 'dark-theme',
        name: 'Dark Theme',
        description: 'A beautiful dark theme for ZettelView',
        version: '1.0.0',
        author: 'ZettelView Team',
        category: 'theme',
        isEnabled: true,
        isBuiltIn: true,
        settings: [
          {
            id: 'accent-color',
            name: 'Accent Color',
            description: 'Primary accent color for the theme',
            type: 'color',
            defaultValue: '#007bff',
            value: '#007bff'
          }
        ],
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          downloadCount: 0,
          rating: 5,
          size: 1024
        }
      },
      {
        id: 'word-count',
        name: 'Word Count',
        description: 'Display word count and reading time for notes',
        version: '1.0.0',
        author: 'ZettelView Team',
        category: 'feature',
        isEnabled: true,
        isBuiltIn: true,
        settings: [
          {
            id: 'show-reading-time',
            name: 'Show Reading Time',
            description: 'Display estimated reading time',
            type: 'boolean',
            defaultValue: true,
            value: true
          }
        ],
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          downloadCount: 0,
          rating: 4,
          size: 512
        }
      },
      {
        id: 'export-markdown',
        name: 'Export to Markdown',
        description: 'Export notes as individual Markdown files',
        version: '1.0.0',
        author: 'ZettelView Team',
        category: 'utility',
        isEnabled: true,
        isBuiltIn: true,
        settings: [
          {
            id: 'include-metadata',
            name: 'Include Metadata',
            description: 'Include note metadata in exported files',
            type: 'boolean',
            defaultValue: true,
            value: true
          }
        ],
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          downloadCount: 0,
          rating: 4,
          size: 768
        }
      }
    ];

    builtInPlugins.forEach(plugin => {
      this.registry.plugins.set(plugin.id, plugin);
    });
  }

  async registerPlugin(manifest: PluginManifest, pluginModule: any): Promise<void> {
    try {
      // Validate manifest
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new Error('Invalid plugin manifest: missing required fields');
      }

      // Check for conflicts
      if (this.registry.plugins.has(manifest.id)) {
        throw new Error(`Plugin ${manifest.id} is already registered`);
      }

      // Create plugin instance
      const plugin: Plugin = {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        author: manifest.author,
        category: manifest.category,
        isEnabled: false,
        isBuiltIn: false,
        dependencies: manifest.dependencies,
        settings: manifest.settings?.map(setting => ({
          ...setting,
          value: setting.defaultValue
        })),
        metadata: {
          created: new Date(),
          lastUpdated: new Date(),
          downloadCount: 0,
          rating: 0,
          size: 0
        }
      };

      // Register plugin
      this.registry.plugins.set(plugin.id, plugin);

      // Initialize plugin if it has an init function
      if (pluginModule.init && typeof pluginModule.init === 'function') {
        await pluginModule.init(this.context);
      }

      // Register hooks if plugin provides them
      if (pluginModule.hooks && Array.isArray(pluginModule.hooks)) {
        pluginModule.hooks.forEach((hook: PluginHook) => {
          this.addHook(hook.name, hook.callback, hook.priority);
        });
      }

      this.securityMonitor.logViolation('PLUGIN_REGISTERED', { 
        pluginId: manifest.id, 
        pluginName: manifest.name 
      }, 'low');
    } catch (error) {
      this.securityMonitor.logViolation('PLUGIN_REGISTRATION_FAILED', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }, 'medium');
      throw error;
    }
  }

  async unregisterPlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.isBuiltIn) {
      throw new Error('Cannot unregister built-in plugins');
    }

    // Disable plugin first
    await this.disablePlugin(pluginId);

    // Remove plugin from registry
    this.registry.plugins.delete(pluginId);

    // Remove plugin settings
    this.registry.settings.delete(pluginId);

    this.securityMonitor.logViolation('PLUGIN_UNREGISTERED', { 
      pluginId, 
      pluginName: plugin.name 
    }, 'low');
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check dependencies
    if (plugin.dependencies) {
      for (const depId of plugin.dependencies) {
        const dep = this.registry.plugins.get(depId);
        if (!dep || !dep.isEnabled) {
          throw new Error(`Plugin ${pluginId} depends on ${depId} which is not enabled`);
        }
      }
    }

    plugin.isEnabled = true;
    this.registry.plugins.set(pluginId, plugin);

    // Emit plugin enabled event
    this.emitEvent({
      type: 'plugin.enabled',
      data: { pluginId },
      source: 'plugin-manager'
    });

    this.securityMonitor.logViolation('PLUGIN_ENABLED', { 
      pluginId, 
      pluginName: plugin.name 
    }, 'low');
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.registry.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.isEnabled = false;
    this.registry.plugins.set(pluginId, plugin);

    // Emit plugin disabled event
    this.emitEvent({
      type: 'plugin.disabled',
      data: { pluginId },
      source: 'plugin-manager'
    });

    this.securityMonitor.logViolation('PLUGIN_DISABLED', { 
      pluginId, 
      pluginName: plugin.name 
    }, 'low');
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.registry.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.registry.plugins.values());
  }

  getEnabledPlugins(): Plugin[] {
    return this.getAllPlugins().filter(plugin => plugin.isEnabled);
  }

  getPluginsByCategory(category: Plugin['category']): Plugin[] {
    return this.getAllPlugins().filter(plugin => plugin.category === category);
  }

  addHook(hookName: string, callback: PluginHook['callback'], priority: number = 0): void {
    if (!this.registry.hooks.has(hookName)) {
      this.registry.hooks.set(hookName, []);
    }

    const hooks = this.registry.hooks.get(hookName)!;
    hooks.push({ name: hookName, callback, priority });

    // Sort by priority (higher priority first)
    hooks.sort((a, b) => b.priority - a.priority);

    this.securityMonitor.logViolation('HOOK_ADDED', { 
      hookName, 
      priority 
    }, 'low');
  }

  removeHook(hookName: string, callback: PluginHook['callback']): void {
    const hooks = this.registry.hooks.get(hookName);
    if (!hooks) return;

    const index = hooks.findIndex(hook => hook.callback === callback);
    if (index !== -1) {
      hooks.splice(index, 1);
      this.securityMonitor.logViolation('HOOK_REMOVED', { 
        hookName 
      }, 'low');
    }
  }

  executeHook(hookName: string, context: PluginContext, ...args: any[]): any[] {
    const hooks = this.registry.hooks.get(hookName);
    if (!hooks) return [];

    const results: any[] = [];
    
    hooks.forEach(hook => {
      try {
        const result = hook.callback(context, ...args);
        if (result !== undefined) {
          results.push(result);
        }
      } catch (error) {
        this.securityMonitor.logViolation('HOOK_EXECUTION_FAILED', { 
          hookName, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'medium');
      }
    });

    return results;
  }

  emitEvent(event: Omit<PluginEvent, 'timestamp'>): void {
    const fullEvent: PluginEvent = {
      ...event,
      timestamp: new Date()
    };

    this.registry.events.push(fullEvent);

    // Keep only last 100 events
    if (this.registry.events.length > 100) {
      this.registry.events = this.registry.events.slice(-100);
    }

    // Execute event hooks
    this.executeHook('event', this.context, fullEvent);
  }

  getSettings(pluginId: string): any {
    return this.registry.settings.get(pluginId) || {};
  }

  updateSettings(pluginId: string, settings: any): void {
    const plugin = this.registry.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Update plugin settings
    if (plugin.settings) {
      plugin.settings.forEach(setting => {
        if (settings[setting.id] !== undefined) {
          setting.value = settings[setting.id];
        }
      });
    }

    // Store in registry
    this.registry.settings.set(pluginId, settings);

    // Emit settings changed event
    this.emitEvent({
      type: 'plugin.settings.changed',
      data: { pluginId, settings },
      source: 'plugin-manager'
    });

    this.securityMonitor.logViolation('PLUGIN_SETTINGS_UPDATED', { 
      pluginId, 
      settings 
    }, 'low');
  }

  // Utility methods
  getContext(): PluginContext {
    return this.context;
  }

  getEvents(): PluginEvent[] {
    return [...this.registry.events];
  }

  clearEvents(): void {
    this.registry.events = [];
  }
}

// Export singleton instance
export const pluginManager = new PluginManagerService(); 