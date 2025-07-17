import { Note } from '../types/domain';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { useNotificationStore } from '../store/notificationStore';

// Plugin API Types
export interface PluginAPI {
  // Note Management
  notes: {
    getAll: () => Note[];
    getById: (id: string) => Note | undefined;
    create: (title: string, options?: { body?: string; tags?: string[] }) => Promise<string>;
    update: (id: string, updates: Partial<Note>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    search: (query: string, options?: { maxResults?: number }) => Promise<Note[]>;
    getByTag: (tag: string) => Note[];
    getTags: () => string[];
  };

  // UI Management
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number) => void;
    openModal: (component: React.ComponentType<any>, props?: any) => Promise<any>;
    closeModal: () => void;
    registerPanel: (id: string, component: React.ComponentType<any>, options?: PanelOptions) => void;
    unregisterPanel: (id: string) => void;
    registerCommand: (id: string, command: CommandDefinition) => void;
    unregisterCommand: (id: string) => void;
    registerMenuItem: (id: string, menuItem: MenuItemDefinition) => void;
    unregisterMenuItem: (id: string) => void;
  };

  // Storage Management
  storage: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
    clear: () => void;
    has: (key: string) => boolean;
  };

  // App Information
  app: {
    version: string;
    theme: 'light' | 'dark';
    locale: string;
    platform: 'web' | 'desktop' | 'mobile';
    isOnline: boolean;
    getConfig: (key: string) => any;
  };

  // External API Access
  api: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
    request: <T = any>(url: string, options?: RequestInit) => Promise<T>;
  };

  // Event System
  events: {
    on: (event: string, callback: (data: any) => void) => void;
    off: (event: string, callback: (data: any) => void) => void;
    emit: (event: string, data?: any) => void;
  };

  // Utilities
  utils: {
    debounce: <T extends (...args: any[]) => any>(func: T, delay: number) => T;
    throttle: <T extends (...args: any[]) => any>(func: T, delay: number) => T;
    generateId: () => string;
    formatDate: (date: Date, format?: string) => string;
    parseMarkdown: (markdown: string) => string;
    sanitizeHtml: (html: string) => string;
  };

  // Security and Permissions
  permissions: {
    hasPermission: (permission: string) => boolean;
    requestPermission: (permission: string) => Promise<boolean>;
    getGrantedPermissions: () => string[];
  };
}

export interface PanelOptions {
  title?: string;
  icon?: string;
  position?: 'left' | 'right' | 'bottom';
  defaultOpen?: boolean;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
}

export interface CommandDefinition {
  name: string;
  description: string;
  shortcut?: string;
  icon?: string;
  execute: (context: CommandContext) => void | Promise<void>;
  isEnabled?: (context: CommandContext) => boolean;
  isVisible?: (context: CommandContext) => boolean;
}

export interface CommandContext {
  selectedNoteId?: string;
  selectedText?: string;
  cursorPosition?: { line: number; column: number };
  clipboard?: string;
}

export interface MenuItemDefinition {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  isEnabled?: () => boolean;
  isVisible?: () => boolean;
  children?: MenuItemDefinition[];
}

// Plugin API Implementation
class PluginAPIService implements PluginAPI {
  private noteStore: ReturnType<typeof useNoteStore>;
  private themeStore: ReturnType<typeof useThemeStore>;
  private notificationStore: ReturnType<typeof useNotificationStore>;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private panels: Map<string, { component: React.ComponentType<any>; options: PanelOptions }> = new Map();
  private commands: Map<string, CommandDefinition> = new Map();
  private menuItems: Map<string, MenuItemDefinition> = new Map();
  private permissions: Set<string> = new Set();

  constructor() {
    // Initialize with default permissions
    this.permissions.add('notes.read');
    this.permissions.add('storage.read');
    this.permissions.add('ui.notifications');
  }

  // Note Management API
  notes = {
    getAll: (): Note[] => {
      if (!this.hasPermission('notes.read')) {
        throw new Error('Permission denied: notes.read');
      }
      return this.noteStore.getState().notes;
    },

    getById: (id: string): Note | undefined => {
      if (!this.hasPermission('notes.read')) {
        throw new Error('Permission denied: notes.read');
      }
      return this.noteStore.getState().getNote(id);
    },

    create: async (title: string, options?: { body?: string; tags?: string[] }): Promise<string> => {
      if (!this.hasPermission('notes.write')) {
        throw new Error('Permission denied: notes.write');
      }
      await this.noteStore.getState().addNote(title, options);
      return title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    },

    update: async (id: string, updates: Partial<Note>): Promise<void> => {
      if (!this.hasPermission('notes.write')) {
        throw new Error('Permission denied: notes.write');
      }
      await this.noteStore.getState().updateNote(id, updates);
    },

    delete: async (id: string): Promise<void> => {
      if (!this.hasPermission('notes.delete')) {
        throw new Error('Permission denied: notes.delete');
      }
      await this.noteStore.getState().deleteNote(id);
    },

    search: async (query: string, options?: { maxResults?: number }): Promise<Note[]> => {
      if (!this.hasPermission('notes.read')) {
        throw new Error('Permission denied: notes.read');
      }
      await this.noteStore.getState().searchNotes(query, options);
      return this.noteStore.getState().searchResults.map(result => 
        this.noteStore.getState().getNote(result.noteId)!
      );
    },

    getByTag: (tag: string): Note[] => {
      if (!this.hasPermission('notes.read')) {
        throw new Error('Permission denied: notes.read');
      }
      return this.noteStore.getState().notes.filter(note => 
        note.tags.includes(tag)
      );
    },

    getTags: (): string[] => {
      if (!this.hasPermission('notes.read')) {
        throw new Error('Permission denied: notes.read');
      }
      const tags = new Set<string>();
      this.noteStore.getState().notes.forEach(note => {
        note.tags.forEach(tag => tags.add(tag));
      });
      return Array.from(tags).sort();
    }
  };

  // UI Management API
  ui = {
    showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 5000): void => {
      if (!this.hasPermission('ui.notifications')) {
        throw new Error('Permission denied: ui.notifications');
      }
      this.notificationStore.getState().showNotification(message, type, duration);
    },

    openModal: async (component: React.ComponentType<any>, props?: any): Promise<any> => {
      if (!this.hasPermission('ui.modals')) {
        throw new Error('Permission denied: ui.modals');
      }
      // This would be implemented with the actual modal system
      console.log('Plugin opening modal:', component.name, props);
      return Promise.resolve();
    },

    closeModal: (): void => {
      if (!this.hasPermission('ui.modals')) {
        throw new Error('Permission denied: ui.modals');
      }
      // This would be implemented with the actual modal system
      console.log('Plugin closing modal');
    },

    registerPanel: (id: string, component: React.ComponentType<any>, options?: PanelOptions): void => {
      if (!this.hasPermission('ui.panels')) {
        throw new Error('Permission denied: ui.panels');
      }
      this.panels.set(id, { component, options: options || {} });
      this.emit('panel.registered', { id, options });
    },

    unregisterPanel: (id: string): void => {
      if (!this.hasPermission('ui.panels')) {
        throw new Error('Permission denied: ui.panels');
      }
      this.panels.delete(id);
      this.emit('panel.unregistered', { id });
    },

    registerCommand: (id: string, command: CommandDefinition): void => {
      if (!this.hasPermission('ui.commands')) {
        throw new Error('Permission denied: ui.commands');
      }
      this.commands.set(id, command);
      this.emit('command.registered', { id, command });
    },

    unregisterCommand: (id: string): void => {
      if (!this.hasPermission('ui.commands')) {
        throw new Error('Permission denied: ui.commands');
      }
      this.commands.delete(id);
      this.emit('command.unregistered', { id });
    },

    registerMenuItem: (id: string, menuItem: MenuItemDefinition): void => {
      if (!this.hasPermission('ui.menus')) {
        throw new Error('Permission denied: ui.menus');
      }
      this.menuItems.set(id, menuItem);
      this.emit('menuitem.registered', { id, menuItem });
    },

    unregisterMenuItem: (id: string): void => {
      if (!this.hasPermission('ui.menus')) {
        throw new Error('Permission denied: ui.menus');
      }
      this.menuItems.delete(id);
      this.emit('menuitem.unregistered', { id });
    }
  };

  // Storage Management API
  storage = {
    get: (key: string): any => {
      if (!this.hasPermission('storage.read')) {
        throw new Error('Permission denied: storage.read');
      }
      try {
        const item = localStorage.getItem(`plugin_${key}`);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Plugin storage get error:', error);
        return null;
      }
    },

    set: (key: string, value: any): void => {
      if (!this.hasPermission('storage.write')) {
        throw new Error('Permission denied: storage.write');
      }
      try {
        localStorage.setItem(`plugin_${key}`, JSON.stringify(value));
      } catch (error) {
        console.error('Plugin storage set error:', error);
        throw error;
      }
    },

    remove: (key: string): void => {
      if (!this.hasPermission('storage.write')) {
        throw new Error('Permission denied: storage.write');
      }
      try {
        localStorage.removeItem(`plugin_${key}`);
      } catch (error) {
        console.error('Plugin storage remove error:', error);
        throw error;
      }
    },

    clear: (): void => {
      if (!this.hasPermission('storage.write')) {
        throw new Error('Permission denied: storage.write');
      }
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('plugin_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error('Plugin storage clear error:', error);
        throw error;
      }
    },

    has: (key: string): boolean => {
      if (!this.hasPermission('storage.read')) {
        throw new Error('Permission denied: storage.read');
      }
      return localStorage.getItem(`plugin_${key}`) !== null;
    }
  };

  // App Information API
  app = {
    version: '1.0.0',
    theme: this.themeStore?.getState().theme || 'light',
    locale: navigator.language || 'en',
    platform: 'web',
    isOnline: navigator.onLine,
    getConfig: (key: string): any => {
      // This would return app configuration values
      const config: Record<string, any> = {
        'maxNotes': 1000,
        'maxNoteSize': 1024 * 1024, // 1MB
        'autoSave': true,
        'backupEnabled': true
      };
      return config[key];
    }
  };

  // External API Access
  api = {
    fetch: async (url: string, options?: RequestInit): Promise<Response> => {
      if (!this.hasPermission('api.external')) {
        throw new Error('Permission denied: api.external');
      }
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
    },

    request: async <T = any>(url: string, options?: RequestInit): Promise<T> => {
      const response = await this.api.fetch(url, options);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      return response.json();
    }
  };

  // Event System
  events = {
    on: (event: string, callback: (data: any) => void): void => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, new Set());
      }
      this.eventListeners.get(event)!.add(callback);
    },

    off: (event: string, callback: (data: any) => void): void => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    },

    emit: (event: string, data?: any): void => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
    }
  };

  // Utilities API
  utils = {
    debounce: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
      let timeoutId: NodeJS.Timeout;
      return ((...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
      }) as T;
    },

    throttle: <T extends (...args: any[]) => any>(func: T, delay: number): T => {
      let lastCall = 0;
      return ((...args: any[]) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func(...args);
        }
      }) as T;
    },

    generateId: (): string => {
      return Math.random().toString(36).substr(2, 9);
    },

    formatDate: (date: Date, format: string = 'YYYY-MM-DD'): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    },

    parseMarkdown: (markdown: string): string => {
      // This would use the actual markdown parser
      return markdown;
    },

    sanitizeHtml: (html: string): string => {
      // This would use a proper HTML sanitizer
      return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
  };

  // Security and Permissions API
  permissions = {
    hasPermission: (permission: string): boolean => {
      return this.permissions.has(permission);
    },

    requestPermission: async (permission: string): Promise<boolean> => {
      // This would show a permission request dialog
      console.log(`Requesting permission: ${permission}`);
      return true; // Mock implementation
    },

    getGrantedPermissions: (): string[] => {
      return Array.from(this.permissions);
    }
  };

  // Internal methods
  private hasPermission(permission: string): boolean {
    return this.permissions.hasPermission(permission);
  }

  private emit(event: string, data?: any): void {
    this.events.emit(event, data);
  }

  // Initialize the API with store references
  initialize(noteStore: ReturnType<typeof useNoteStore>, themeStore: ReturnType<typeof useThemeStore>, notificationStore: ReturnType<typeof useNotificationStore>): void {
    this.noteStore = noteStore;
    this.themeStore = themeStore;
    this.notificationStore = notificationStore;
  }

  // Get registered panels, commands, and menu items
  getRegisteredPanels(): Map<string, { component: React.ComponentType<any>; options: PanelOptions }> {
    return new Map(this.panels);
  }

  getRegisteredCommands(): Map<string, CommandDefinition> {
    return new Map(this.commands);
  }

  getRegisteredMenuItems(): Map<string, MenuItemDefinition> {
    return new Map(this.menuItems);
  }

  // Grant permissions to a plugin
  grantPermissions(permissions: string[]): void {
    permissions.forEach(permission => this.permissions.add(permission));
  }

  // Revoke permissions from a plugin
  revokePermissions(permissions: string[]): void {
    permissions.forEach(permission => this.permissions.delete(permission));
  }
}

// Create and export the plugin API instance
export const pluginAPI = new PluginAPIService();

// Make it available globally for plugins
if (typeof window !== 'undefined') {
  (window as any).pluginAPI = pluginAPI;
} 