import { Note } from '../types/domain';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  license?: string;
  dependencies?: string[];
  enabled: boolean;
  config: Record<string, any>;
  hooks: PluginHooks;
  api: PluginAPI;
}

export interface PluginHooks {
  onNoteCreate?: (note: Note) => void;
  onNoteUpdate?: (note: Note, previousNote: Note) => void;
  onNoteDelete?: (note: Note) => void;
  onSearch?: (query: string, results: Note[]) => void;
  onExport?: (notes: Note[], format: string) => void;
  onImport?: (notes: Note[], format: string) => void;
  onAppStart?: () => void;
  onAppShutdown?: () => void;
  onThemeChange?: (theme: string) => void;
  onUserAction?: (action: string, data: any) => void;
}

export interface PluginAPI {
  notes: {
    getAll: () => Note[];
    getById: (id: string) => Note | undefined;
    create: (note: Partial<Note>) => Note;
    update: (id: string, updates: Partial<Note>) => Note | undefined;
    delete: (id: string) => boolean;
    search: (query: string) => Note[];
  };
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showModal: (title: string, content: string) => void;
    addMenuItem: (label: string, action: () => void, location?: string) => void;
    addToolbarButton: (label: string, icon: string, action: () => void) => void;
    addSidebarPanel: (title: string, content: React.ReactNode) => void;
  };
  storage: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
  };
  utils: {
    debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => T;
    throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => T;
    formatDate: (date: Date, format?: string) => string;
    generateId: () => string;
    sanitizeHtml: (html: string) => string;
    markdownToHtml: (markdown: string) => string;
    htmlToMarkdown: (html: string) => string;
  };
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  license?: string;
  dependencies?: string[];
  main: string;
  icon?: string;
  permissions?: string[];
  settings?: PluginSetting[];
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
  default: any;
  options?: { label: string; value: any }[];
  description?: string;
  required?: boolean;
}

export interface PluginEvent {
  type: string;
  data: any;
  timestamp: Date;
  pluginId: string;
}

class PluginSystem {
  private plugins: Map<string, Plugin> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private pluginRegistry: Map<string, PluginManifest> = new Map();
  private enabledPlugins: Set<string> = new Set();
  private pluginStorage: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.initializePluginAPI();
  }

  // Plugin Management
  async loadPlugin(manifest: PluginManifest, pluginCode: string): Promise<Plugin> {
    try {
      // Validate plugin manifest
      this.validateManifest(manifest);

      // Check dependencies
      await this.checkDependencies(manifest.dependencies || []);

      // Create plugin context
      const pluginContext = this.createPluginContext(manifest.id);

      // Execute plugin code
      const pluginModule = this.executePluginCode(pluginCode, pluginContext);

      // Create plugin instance
      const plugin: Plugin = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        homepage: manifest.homepage,
        license: manifest.license,
        dependencies: manifest.dependencies,
        enabled: false,
        config: this.loadPluginConfig(manifest.id),
        hooks: pluginModule.hooks || {},
        api: pluginContext.api
      };

      // Register plugin
      this.plugins.set(manifest.id, plugin);
      this.pluginRegistry.set(manifest.id, manifest);

      // Load default settings
      this.initializePluginSettings(plugin, manifest.settings || []);

      return plugin;
    } catch (error) {
      console.error(`Failed to load plugin ${manifest.id}:`, error);
      throw error;
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // Call onAppStart hook if available
      if (plugin.hooks.onAppStart) {
        await plugin.hooks.onAppStart();
      }

      plugin.enabled = true;
      this.enabledPlugins.add(pluginId);

      // Save plugin state
      this.savePluginState(pluginId);

      console.log(`Plugin ${pluginId} enabled successfully`);
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      // Call onAppShutdown hook if available
      if (plugin.hooks.onAppShutdown) {
        await plugin.hooks.onAppShutdown();
      }

      plugin.enabled = false;
      this.enabledPlugins.delete(pluginId);

      // Save plugin state
      this.savePluginState(pluginId);

      console.log(`Plugin ${pluginId} disabled successfully`);
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
      throw error;
    }
  }

  unloadPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Disable plugin if enabled
    if (plugin.enabled) {
      this.disablePlugin(pluginId);
    }

    // Clean up plugin resources
    this.plugins.delete(pluginId);
    this.pluginRegistry.delete(pluginId);
    this.pluginStorage.delete(pluginId);

    console.log(`Plugin ${pluginId} unloaded successfully`);
  }

  // Plugin Hooks
  async triggerHook(hookName: keyof PluginHooks, ...args: any[]): Promise<void> {
    for (const pluginId of this.enabledPlugins) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.hooks[hookName]) continue;

      try {
        await plugin.hooks[hookName]!(...args);
      } catch (error) {
        console.error(`Error in plugin ${pluginId} hook ${hookName}:`, error);
        this.handlePluginError(pluginId, error);
      }
    }
  }

  // Plugin Events
  emitEvent(eventType: string, data: any, pluginId?: string): void {
    const event: PluginEvent = {
      type: eventType,
      data,
      timestamp: new Date(),
      pluginId: pluginId || 'system'
    };

    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });
  }

  onEvent(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  offEvent(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Plugin Configuration
  getPluginConfig(pluginId: string): Record<string, any> {
    const plugin = this.plugins.get(pluginId);
    return plugin ? plugin.config : {};
  }

  updatePluginConfig(pluginId: string, config: Record<string, any>): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.config = { ...plugin.config, ...config };
    this.savePluginConfig(pluginId, plugin.config);
  }

  getPluginSetting(pluginId: string, key: string): any {
    const config = this.getPluginConfig(pluginId);
    return config[key];
  }

  setPluginSetting(pluginId: string, key: string, value: any): void {
    const config = this.getPluginConfig(pluginId);
    config[key] = value;
    this.updatePluginConfig(pluginId, config);
  }

  // Plugin Information
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getEnabledPlugins(): Plugin[] {
    return this.getPlugins().filter(plugin => plugin.enabled);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getPluginManifest(pluginId: string): PluginManifest | undefined {
    return this.pluginRegistry.get(pluginId);
  }

  // Plugin Storage
  getPluginStorage(pluginId: string): Map<string, any> {
    if (!this.pluginStorage.has(pluginId)) {
      this.pluginStorage.set(pluginId, new Map());
    }
    return this.pluginStorage.get(pluginId)!;
  }

  // Utility Methods
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }

    if (!/^[a-z0-9-]+$/.test(manifest.id)) {
      throw new Error('Invalid plugin ID: must contain only lowercase letters, numbers, and hyphens');
    }

    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} already exists`);
    }
  }

  private async checkDependencies(dependencies: string[]): Promise<void> {
    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
  }

  private createPluginContext(pluginId: string): any {
    const api: PluginAPI = {
      notes: {
        getAll: () => this.getNotes(),
        getById: (id: string) => this.getNoteById(id),
        create: (note: Partial<Note>) => this.createNote(note),
        update: (id: string, updates: Partial<Note>) => this.updateNote(id, updates),
        delete: (id: string) => this.deleteNote(id),
        search: (query: string) => this.searchNotes(query)
      },
      ui: {
        showNotification: (message: string, type = 'info') => this.showNotification(message, type),
        showModal: (title: string, content: string) => this.showModal(title, content),
        addMenuItem: (label: string, action: () => void, location = 'main') => this.addMenuItem(label, action, location),
        addToolbarButton: (label: string, icon: string, action: () => void) => this.addToolbarButton(label, icon, action),
        addSidebarPanel: (title: string, content: React.ReactNode) => this.addSidebarPanel(title, content)
      },
      storage: {
        get: (key: string) => this.getPluginStorageValue(pluginId, key),
        set: (key: string, value: any) => this.setPluginStorageValue(pluginId, key, value),
        remove: (key: string) => this.removePluginStorageValue(pluginId, key),
        clear: () => this.clearPluginStorage(pluginId)
      },
      utils: {
        debounce: this.debounce,
        throttle: this.throttle,
        formatDate: this.formatDate,
        generateId: this.generateId,
        sanitizeHtml: this.sanitizeHtml,
        markdownToHtml: this.markdownToHtml,
        htmlToMarkdown: this.htmlToMarkdown
      }
    };

    return { api };
  }

  private executePluginCode(code: string, context: any): any {
    // Create a safe execution environment
    const sandbox = {
      ...context,
      console: {
        log: (...args: any[]) => console.log(`[Plugin]`, ...args),
        error: (...args: any[]) => console.error(`[Plugin]`, ...args),
        warn: (...args: any[]) => console.warn(`[Plugin]`, ...args)
      },
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval
    };

    // Execute plugin code in sandbox
    const func = new Function('api', 'hooks', code);
    const result = func(context.api, {});
    
    return result;
  }

  private initializePluginSettings(plugin: Plugin, settings: PluginSetting[]): void {
    for (const setting of settings) {
      if (plugin.config[setting.key] === undefined) {
        plugin.config[setting.key] = setting.default;
      }
    }
  }

  private loadPluginConfig(pluginId: string): Record<string, any> {
    try {
      const stored = localStorage.getItem(`plugin_config_${pluginId}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private savePluginConfig(pluginId: string, config: Record<string, any>): void {
    try {
      localStorage.setItem(`plugin_config_${pluginId}`, JSON.stringify(config));
    } catch (error) {
      console.error(`Failed to save plugin config for ${pluginId}:`, error);
    }
  }

  private savePluginState(pluginId: string): void {
    try {
      const plugin = this.plugins.get(pluginId);
      if (plugin) {
        localStorage.setItem(`plugin_state_${pluginId}`, JSON.stringify({
          enabled: plugin.enabled,
          config: plugin.config
        }));
      }
    } catch (error) {
      console.error(`Failed to save plugin state for ${pluginId}:`, error);
    }
  }

  private handlePluginError(pluginId: string, error: any): void {
    console.error(`Plugin ${pluginId} error:`, error);
    this.emitEvent('plugin_error', { pluginId, error }, 'system');
  }

  // Mock methods for plugin API (these would be implemented in the main app)
  private getNotes(): Note[] {
    // This would be implemented to return actual notes from the app
    return [];
  }

  private getNoteById(id: string): Note | undefined {
    // This would be implemented to return actual note from the app
    return undefined;
  }

  private createNote(note: Partial<Note>): Note {
    // This would be implemented to create actual note in the app
    return {} as Note;
  }

  private updateNote(id: string, updates: Partial<Note>): Note | undefined {
    // This would be implemented to update actual note in the app
    return undefined;
  }

  private deleteNote(id: string): boolean {
    // This would be implemented to delete actual note in the app
    return false;
  }

  private searchNotes(query: string): Note[] {
    // This would be implemented to search actual notes in the app
    return [];
  }

  private showNotification(message: string, type: string): void {
    // This would be implemented to show notification in the app
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  private showModal(title: string, content: string): void {
    // This would be implemented to show modal in the app
    console.log(`Modal: ${title} - ${content}`);
  }

  private addMenuItem(label: string, action: () => void, location: string): void {
    // This would be implemented to add menu item in the app
    console.log(`Menu item added: ${label} at ${location}`);
  }

  private addToolbarButton(label: string, icon: string, action: () => void): void {
    // This would be implemented to add toolbar button in the app
    console.log(`Toolbar button added: ${label} with icon ${icon}`);
  }

  private addSidebarPanel(title: string, content: React.ReactNode): void {
    // This would be implemented to add sidebar panel in the app
    console.log(`Sidebar panel added: ${title}`);
  }

  private getPluginStorageValue(pluginId: string, key: string): any {
    const storage = this.getPluginStorage(pluginId);
    return storage.get(key);
  }

  private setPluginStorageValue(pluginId: string, key: string, value: any): void {
    const storage = this.getPluginStorage(pluginId);
    storage.set(key, value);
  }

  private removePluginStorageValue(pluginId: string, key: string): void {
    const storage = this.getPluginStorage(pluginId);
    storage.delete(key);
  }

  private clearPluginStorage(pluginId: string): void {
    this.pluginStorage.delete(pluginId);
  }

  // Utility functions
  private debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  }

  private throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }

  private formatDate(date: Date, format = 'YYYY-MM-DD'): string {
    // Simple date formatting
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private sanitizeHtml(html: string): string {
    // Simple HTML sanitization
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  private markdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  private htmlToMarkdown(html: string): string {
    // Simple HTML to markdown conversion
    return html
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<br>/g, '\n');
  }

  private initializePluginAPI(): void {
    // Initialize the plugin API with the main app's functionality
    // This would be called when the main app starts
  }
}

export const PluginSystem = new PluginSystem(); 