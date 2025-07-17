import { renderHook, act } from '@testing-library/react';
import { usePlugins, usePluginSettings, usePluginEvents } from './usePlugins';
import { pluginManager } from '../services/pluginManager';
import { Plugin } from '../types/plugins';

// Mock plugin manager
jest.mock('../services/pluginManager', () => ({
  pluginManager: {
    getAllPlugins: jest.fn(),
    getEnabledPlugins: jest.fn(),
    getPluginsByCategory: jest.fn(),
    enablePlugin: jest.fn(),
    disablePlugin: jest.fn(),
    updateSettings: jest.fn(),
    getSettings: jest.fn(),
    getEvents: jest.fn(),
    clearEvents: jest.fn()
  }
}));

const mockPluginManager = pluginManager as jest.Mocked<typeof pluginManager>;

describe('usePlugins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty plugins and loading state', () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);

      const { result } = renderHook(() => usePlugins());

      expect(result.current.plugins).toEqual([]);
      expect(result.current.enabledPlugins).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should load plugins on mount', () => {
      const mockPlugins: Plugin[] = [
        {
          id: 'test-plugin',
          name: 'Test Plugin',
          description: 'A test plugin',
          version: '1.0.0',
          author: 'Test Author',
          category: 'feature',
          isEnabled: true,
          isBuiltIn: false,
          metadata: {
            created: new Date(),
            lastUpdated: new Date(),
            downloadCount: 0,
            rating: 0,
            size: 0
          }
        }
      ];

      mockPluginManager.getAllPlugins.mockReturnValue(mockPlugins);
      mockPluginManager.getEnabledPlugins.mockReturnValue(mockPlugins);

      const { result } = renderHook(() => usePlugins());

      expect(mockPluginManager.getAllPlugins).toHaveBeenCalled();
      expect(mockPluginManager.getEnabledPlugins).toHaveBeenCalled();
    });
  });

  describe('Plugin Operations', () => {
    it('should enable a plugin successfully', async () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.enablePlugin.mockResolvedValue();

      const { result } = renderHook(() => usePlugins());

      await act(async () => {
        await result.current.enablePlugin('test-plugin');
      });

      expect(mockPluginManager.enablePlugin).toHaveBeenCalledWith('test-plugin');
      expect(mockPluginManager.getAllPlugins).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should disable a plugin successfully', async () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.disablePlugin.mockResolvedValue();

      const { result } = renderHook(() => usePlugins());

      await act(async () => {
        await result.current.disablePlugin('test-plugin');
      });

      expect(mockPluginManager.disablePlugin).toHaveBeenCalledWith('test-plugin');
      expect(mockPluginManager.getAllPlugins).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should handle enable plugin error', async () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.enablePlugin.mockRejectedValue(new Error('Enable failed'));

      const { result } = renderHook(() => usePlugins());

      await act(async () => {
        try {
          await result.current.enablePlugin('test-plugin');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Enable failed');
    });

    it('should handle disable plugin error', async () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.disablePlugin.mockRejectedValue(new Error('Disable failed'));

      const { result } = renderHook(() => usePlugins());

      await act(async () => {
        try {
          await result.current.disablePlugin('test-plugin');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Disable failed');
    });
  });

  describe('Settings Management', () => {
    it('should update plugin settings', () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.updateSettings.mockImplementation(() => {});

      const { result } = renderHook(() => usePlugins());

      act(() => {
        result.current.updatePluginSettings('test-plugin', { setting: 'value' });
      });

      expect(mockPluginManager.updateSettings).toHaveBeenCalledWith('test-plugin', { setting: 'value' });
    });

    it('should get plugin settings', () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.getSettings.mockReturnValue({ setting: 'value' });

      const { result } = renderHook(() => usePlugins());

      const settings = result.current.getPluginSettings('test-plugin');

      expect(mockPluginManager.getSettings).toHaveBeenCalledWith('test-plugin');
      expect(settings).toEqual({ setting: 'value' });
    });

    it('should handle settings update error', () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.updateSettings.mockImplementation(() => {
        throw new Error('Settings update failed');
      });

      const { result } = renderHook(() => usePlugins());

      act(() => {
        try {
          result.current.updatePluginSettings('test-plugin', { setting: 'value' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Settings update failed');
    });
  });

  describe('Plugin Queries', () => {
    it('should get plugins by category', () => {
      const mockPlugins: Plugin[] = [
        {
          id: 'theme-plugin',
          name: 'Theme Plugin',
          description: 'A theme plugin',
          version: '1.0.0',
          author: 'Test Author',
          category: 'theme',
          isEnabled: true,
          isBuiltIn: false,
          metadata: {
            created: new Date(),
            lastUpdated: new Date(),
            downloadCount: 0,
            rating: 0,
            size: 0
          }
        }
      ];

      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);
      mockPluginManager.getPluginsByCategory.mockReturnValue(mockPlugins);

      const { result } = renderHook(() => usePlugins());

      const themePlugins = result.current.getPluginsByCategory('theme');

      expect(mockPluginManager.getPluginsByCategory).toHaveBeenCalledWith('theme');
      expect(themePlugins).toEqual(mockPlugins);
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh plugins', () => {
      mockPluginManager.getAllPlugins.mockReturnValue([]);
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);

      const { result } = renderHook(() => usePlugins());

      act(() => {
        result.current.refreshPlugins();
      });

      expect(mockPluginManager.getAllPlugins).toHaveBeenCalledTimes(2); // Initial + refresh
      expect(mockPluginManager.getEnabledPlugins).toHaveBeenCalledTimes(2); // Initial + refresh
    });

    it('should handle refresh error', () => {
      mockPluginManager.getAllPlugins.mockImplementation(() => {
        throw new Error('Refresh failed');
      });
      mockPluginManager.getEnabledPlugins.mockReturnValue([]);

      const { result } = renderHook(() => usePlugins());

      act(() => {
        result.current.refreshPlugins();
      });

      expect(result.current.error).toBe('Refresh failed');
    });
  });
});

describe('usePluginSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load plugin settings on mount', () => {
    const mockSettings = { setting: 'value' };
    mockPluginManager.getSettings.mockReturnValue(mockSettings);

    const { result } = renderHook(() => usePluginSettings('test-plugin'));

    expect(mockPluginManager.getSettings).toHaveBeenCalledWith('test-plugin');
    expect(result.current.settings).toEqual(mockSettings);
  });

  it('should update settings', () => {
    mockPluginManager.getSettings.mockReturnValue({});
    mockPluginManager.updateSettings.mockImplementation(() => {});

    const { result } = renderHook(() => usePluginSettings('test-plugin'));

    act(() => {
      result.current.updateSettings({ newSetting: 'newValue' });
    });

    expect(mockPluginManager.updateSettings).toHaveBeenCalledWith('test-plugin', { newSetting: 'newValue' });
    expect(result.current.settings).toEqual({ newSetting: 'newValue' });
  });

  it('should update individual setting', () => {
    mockPluginManager.getSettings.mockReturnValue({ setting1: 'value1' });
    mockPluginManager.updateSettings.mockImplementation(() => {});

    const { result } = renderHook(() => usePluginSettings('test-plugin'));

    act(() => {
      result.current.updateSetting('setting2', 'value2');
    });

    expect(mockPluginManager.updateSettings).toHaveBeenCalledWith('test-plugin', { setting1: 'value1', setting2: 'value2' });
  });

  it('should handle settings error', () => {
    mockPluginManager.getSettings.mockImplementation(() => {
      throw new Error('Settings load failed');
    });

    const { result } = renderHook(() => usePluginSettings('test-plugin'));

    expect(result.current.error).toBe('Settings load failed');
  });

  it('should reload settings', () => {
    mockPluginManager.getSettings.mockReturnValue({});

    const { result } = renderHook(() => usePluginSettings('test-plugin'));

    act(() => {
      result.current.reload();
    });

    expect(mockPluginManager.getSettings).toHaveBeenCalledTimes(2); // Initial + reload
  });
});

describe('usePluginEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load plugin events on mount', () => {
    const mockEvents = [
      {
        type: 'test-event',
        data: { test: 'data' },
        timestamp: new Date(),
        source: 'test'
      }
    ];

    mockPluginManager.getEvents.mockReturnValue(mockEvents);

    const { result } = renderHook(() => usePluginEvents());

    expect(mockPluginManager.getEvents).toHaveBeenCalled();
    expect(result.current.events).toEqual(mockEvents);
  });

  it('should clear events', () => {
    mockPluginManager.getEvents.mockReturnValue([]);
    mockPluginManager.clearEvents.mockImplementation(() => {});

    const { result } = renderHook(() => usePluginEvents());

    act(() => {
      result.current.clearEvents();
    });

    expect(mockPluginManager.clearEvents).toHaveBeenCalled();
    expect(result.current.events).toEqual([]);
  });

  it('should listen for new events', () => {
    mockPluginManager.getEvents.mockReturnValue([]);

    const { result } = renderHook(() => usePluginEvents());

    // Simulate new event
    act(() => {
      mockPluginManager.getEvents.mockReturnValue([
        {
          type: 'new-event',
          data: { new: 'data' },
          timestamp: new Date(),
          source: 'test'
        }
      ]);
      
      // Trigger event listener
      document.dispatchEvent(new Event('plugin-event'));
    });

    expect(mockPluginManager.getEvents).toHaveBeenCalledTimes(2); // Initial + event
  });
}); 