export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'theme' | 'feature' | 'integration' | 'utility';
  isEnabled: boolean;
  isBuiltIn: boolean;
  dependencies?: string[];
  settings?: PluginSetting[];
  metadata: {
    created: Date;
    lastUpdated: Date;
    downloadCount: number;
    rating: number;
    size: number;
  };
}

export interface PluginSetting {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'file';
  defaultValue: any;
  value: any;
  options?: { label: string; value: any }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: Plugin['category'];
  entryPoint: string;
  dependencies?: string[];
  settings?: Omit<PluginSetting, 'value'>[];
  permissions?: string[];
  minAppVersion?: string;
  maxAppVersion?: string;
}

export interface PluginContext {
  app: {
    version: string;
    theme: 'light' | 'dark';
    locale: string;
  };
  notes: {
    getAll: () => any[];
    getById: (id: string) => any;
    create: (title: string, body: string, tags?: string[]) => any;
    update: (id: string, updates: any) => void;
    delete: (id: string) => void;
  };
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    openModal: (component: React.ComponentType<any>, props?: any) => void;
    closeModal: () => void;
  };
  storage: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    remove: (key: string) => void;
  };
  api: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
}

export interface PluginHook {
  name: string;
  callback: (context: PluginContext, ...args: any[]) => any;
  priority: number;
}

export interface PluginEvent {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

export interface PluginRegistry {
  plugins: Map<string, Plugin>;
  hooks: Map<string, PluginHook[]>;
  events: PluginEvent[];
  settings: Map<string, any>;
}

export interface PluginManager {
  registerPlugin: (manifest: PluginManifest, pluginModule: any) => Promise<void>;
  unregisterPlugin: (pluginId: string) => Promise<void>;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
  getPlugin: (pluginId: string) => Plugin | undefined;
  getAllPlugins: () => Plugin[];
  getEnabledPlugins: () => Plugin[];
  getPluginsByCategory: (category: Plugin['category']) => Plugin[];
  addHook: (hookName: string, callback: PluginHook['callback'], priority?: number) => void;
  removeHook: (hookName: string, callback: PluginHook['callback']) => void;
  executeHook: (hookName: string, context: PluginContext, ...args: any[]) => any[];
  emitEvent: (event: Omit<PluginEvent, 'timestamp'>) => void;
  getSettings: (pluginId: string) => any;
  updateSettings: (pluginId: string, settings: any) => void;
} 