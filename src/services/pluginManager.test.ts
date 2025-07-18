import { pluginManager } from './pluginManager';
import { Plugin, PluginManifest, PluginContext } from '../types/plugins';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PluginManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Reset plugin manager state
    const allPlugins = pluginManager.getAllPlugins();
    allPlugins.forEach(plugin => {
      if (!plugin.isBuiltIn) {
        pluginManager.unregisterPlugin(plugin.id).catch(() => {});
      }
    });
  });

  describe('Plugin Registration', () => {
    it('should register a new plugin successfully', async () => {
      const manifest: PluginManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        description: 'A test plugin',
        version: '1.0.0',
        author: 'Test Author',
        category: 'feature',
        entryPoint: 'test.js'
      };

      const pluginModule = {
        init: jest.fn(),
        hooks: []
      };

      await pluginManager.registerPlugin(manifest, pluginModule);

      const plugin = pluginManager.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('Test Plugin');
      expect(plugin?.isEnabled).toBe(false);
      expect(plugin?.isBuiltIn).toBe(false);
    });

    it('should throw error for invalid manifest', async () => {
      const invalidManifest = {
        id: '',
        name: 'Test Plugin',
        version: '1.0.0',
        author: 'Test Author',
        category: 'feature' as const,
        entryPoint: 'test.js'
      };

      await expect(pluginManager.registerPlugin(invalidManifest as any, {}))
        .rejects.toThrow('Invalid plugin manifest: missing required fields');
    });

    it('should throw error for duplicate plugin ID', async () => {
      const manifest: PluginManifest = {
        id: 'duplicate-plugin',
        name: 'Duplicate Plugin',
        description: 'A duplicate plugin',
        version: '1.0.0',
        author: 'Test Author',
        category: 'feature',
        entryPoint: 'test.js'
      };

      await pluginManager.registerPlugin(manifest, {});
      
      await expect(pluginManager.registerPlugin(manifest, {}))
        .rejects.toThrow('Plugin duplicate-plugin is already registered');
    });
  });

  describe('Plugin Lifecycle', () => {
    let testPlugin: Plugin;

    beforeEach(async () => {
      const manifest: PluginManifest = {
        id: 'lifecycle-test',
        name: 'Lifecycle Test',
        description: 'Test plugin lifecycle',
        version: '1.0.0',
        author: 'Test Author',
        category: 'feature',
        entryPoint: 'test.js'
      };

      await pluginManager.registerPlugin(manifest, {});
      testPlugin = pluginManager.getPlugin('lifecycle-test')!;
    });

    it('should enable a plugin successfully', async () => {
      await pluginManager.enablePlugin('lifecycle-test');
      
      const plugin = pluginManager.getPlugin('lifecycle-test');
      expect(plugin?.isEnabled).toBe(true);
    });

    it('should disable a plugin successfully', async () => {
      await pluginManager.enablePlugin('lifecycle-test');
      await pluginManager.disablePlugin('lifecycle-test');
      
      const plugin = pluginManager.getPlugin('lifecycle-test');
      expect(plugin?.isEnabled).toBe(false);
    });

    it('should throw error when enabling non-existent plugin', async () => {
      await expect(pluginManager.enablePlugin('non-existent'))
        .rejects.toThrow('Plugin non-existent not found');
    });

    it('should throw error when enabling plugin with missing dependencies', async () => {
      const manifest: PluginManifest = {
        id: 'dependent-plugin',
        name: 'Dependent Plugin',
        description: 'Plugin with dependencies',
        version: '1.0.0',
        author: 'Test Author',
        category: 'feature',
        entryPoint: 'test.js',
        dependencies: ['missing-dependency']
      };

      await pluginManager.registerPlugin(manifest, {});
      
      await expect(pluginManager.enablePlugin('dependent-plugin'))
        .rejects.toThrow('Plugin dependent-plugin depends on missing-dependency which is not enabled');
    });
  });

  describe('Plugin Queries', () => {
    beforeEach(async () => {
      const plugins = [
        {
          id: 'theme-plugin',
          name: 'Theme Plugin',
          description: 'A theme plugin',
          version: '1.0.0',
          author: 'Test Author',
          category: 'theme' as const,
          entryPoint: 'theme.js'
        },
        {
          id: 'feature-plugin',
          name: 'Feature Plugin',
          description: 'A feature plugin',
          version: '1.0.0',
          author: 'Test Author',
          category: 'feature' as const,
          entryPoint: 'feature.js'
        },
        {
          id: 'utility-plugin',
          name: 'Utility Plugin',
          description: 'A utility plugin',
          version: '1.0.0',
          author: 'Test Author',
          category: 'utility' as const,
          entryPoint: 'utility.js'
        }
      ];

      for (const manifest of plugins) {
        await pluginManager.registerPlugin(manifest, {});
      }
    });

    it('should get all plugins', () => {
      const allPlugins = pluginManager.getAllPlugins();
      expect(allPlugins.length).toBeGreaterThan(0);
      expect(allPlugins.some(p => p.id === 'theme-plugin')).toBe(true);
      expect(allPlugins.some(p => p.id === 'feature-plugin')).toBe(true);
      expect(allPlugins.some(p => p.id === 'utility-plugin')).toBe(true);
    });

    it('should get enabled plugins', async () => {
      await pluginManager.enablePlugin('theme-plugin');
      await pluginManager.enablePlugin('feature-plugin');
      
      const enabledPlugins = pluginManager.getEnabledPlugins();
      expect(enabledPlugins.length).toBeGreaterThanOrEqual(2);
      expect(enabledPlugins.every(p => p.isEnabled)).toBe(true);
    });

    it('should get plugins by category', () => {
      const themePlugins = pluginManager.getPluginsByCategory('theme');
      const featurePlugins = pluginManager.getPluginsByCategory('feature');
      const utilityPlugins = pluginManager.getPluginsByCategory('utility');

      expect(themePlugins.every(p => p.category === 'theme')).toBe(true);
      expect(featurePlugins.every(p => p.category === 'feature')).toBe(true);
      expect(utilityPlugins.every(p => p.category === 'utility')).toBe(true);
    });

    it('should get specific plugin by ID', () => {
      const plugin = pluginManager.getPlugin('theme-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.name).toBe('Theme Plugin');
    });
  });

  describe('Hooks System', () => {
    it('should add and execute hooks', () => {
      const mockCallback = jest.fn();
      const context = pluginManager.getContext();

      pluginManager.addHook('test-hook', mockCallback, 1);
      pluginManager.executeHook('test-hook', context, 'test-data');

      expect(mockCallback).toHaveBeenCalledWith(context, 'test-data');
    });

    it('should execute hooks in priority order', () => {
      const calls: number[] = [];
      const context = pluginManager.getContext();

      pluginManager.addHook('priority-test', () => calls.push(1), 1);
      pluginManager.addHook('priority-test', () => calls.push(2), 3);
      pluginManager.addHook('priority-test', () => calls.push(3), 2);

      pluginManager.executeHook('priority-test', context);

      expect(calls).toEqual([2, 3, 1]); // Higher priority first
    });

    it('should remove hooks', () => {
      const mockCallback = jest.fn();
      const context = pluginManager.getContext();

      pluginManager.addHook('remove-test', mockCallback);
      pluginManager.removeHook('remove-test', mockCallback);
      pluginManager.executeHook('remove-test', context);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    it('should emit and track events', () => {
      const event = {
        type: 'test-event',
        data: { test: 'data' },
        source: 'test'
      };

      pluginManager.emitEvent(event);
      const events = pluginManager.getEvents();

      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].type).toBe('test-event');
      expect(events[events.length - 1].data).toEqual({ test: 'data' });
    });

    it('should limit event history to 100 events', () => {
      for (let i = 0; i < 150; i++) {
        pluginManager.emitEvent({
          type: 'test-event',
          data: { index: i },
          source: 'test'
        });
      }

      const events = pluginManager.getEvents();
      expect(events.length).toBeLessThanOrEqual(100);
    });

    it('should clear events', () => {
      pluginManager.emitEvent({
        type: 'test-event',
        data: {},
        source: 'test'
      });

      expect(pluginManager.getEvents().length).toBeGreaterThan(0);
      
      pluginManager.clearEvents();
      expect(pluginManager.getEvents().length).toBe(0);
    });
  });

  describe('Settings Management', () => {
    let testPlugin: Plugin;

    beforeEach(async () => {
      const manifest: PluginManifest = {
        id: 'settings-test',
        name: 'Settings Test',
        description: 'Test plugin settings',
        version: '1.0.0',
        author: 'Test Author',
        category: 'feature',
        entryPoint: 'test.js',
        settings: [
          {
            id: 'test-setting',
            name: 'Test Setting',
            description: 'A test setting',
            type: 'string',
            defaultValue: 'default'
          }
        ]
      };

      await pluginManager.registerPlugin(manifest, {});
      testPlugin = pluginManager.getPlugin('settings-test')!;
    });

    it('should get plugin settings', () => {
      const settings = pluginManager.getSettings('settings-test');
      expect(settings).toEqual({});
    });

    it('should update plugin settings', () => {
      const newSettings = { 'test-setting': 'new-value' };
      
      pluginManager.updateSettings('settings-test', newSettings);
      const settings = pluginManager.getSettings('settings-test');
      
      expect(settings).toEqual(newSettings);
    });

    it('should throw error when updating settings for non-existent plugin', () => {
      expect(() => {
        pluginManager.updateSettings('non-existent', {});
      }).toThrow('Plugin non-existent not found');
    });
  });

  describe('Built-in Plugins', () => {
    it('should load built-in plugins on initialization', () => {
      const allPlugins = pluginManager.getAllPlugins();
      const builtInPlugins = allPlugins.filter(p => p.isBuiltIn);
      
      expect(builtInPlugins.length).toBeGreaterThan(0);
      expect(builtInPlugins.some(p => p.id === 'dark-theme')).toBe(true);
      expect(builtInPlugins.some(p => p.id === 'word-count')).toBe(true);
      expect(builtInPlugins.some(p => p.id === 'export-markdown')).toBe(true);
    });

    it('should not allow unregistering built-in plugins', async () => {
      await expect(pluginManager.unregisterPlugin('dark-theme'))
        .rejects.toThrow('Cannot unregister built-in plugins');
    });
  });

  describe('Context', () => {
    it('should provide plugin context', () => {
      const context = pluginManager.getContext();
      
      expect(context.app).toBeDefined();
      expect(context.notes).toBeDefined();
      expect(context.ui).toBeDefined();
      expect(context.storage).toBeDefined();
      expect(context.api).toBeDefined();
    });

    it('should provide working storage methods', () => {
      const context = pluginManager.getContext();
      
      context.storage.set('test-key', 'test-value');
      const value = context.storage.get('test-key');
      
      expect(value).toBe('test-value');
    });

    it('should provide working notification method', () => {
      const context = pluginManager.getContext();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      context.ui.showNotification('Test message', 'info');
      
      expect(consoleSpy).toHaveBeenCalledWith('[INFO] Test message');
      consoleSpy.mockRestore();
    });
  });
}); 