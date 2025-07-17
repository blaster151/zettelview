import { useState, useEffect, useCallback } from 'react';
import { pluginManager } from '../services/pluginManager';
import { Plugin, PluginSetting } from '../types/plugins';

export interface UsePluginsReturn {
  plugins: Plugin[];
  enabledPlugins: Plugin[];
  loading: boolean;
  error: string | null;
  enablePlugin: (pluginId: string) => Promise<void>;
  disablePlugin: (pluginId: string) => Promise<void>;
  updatePluginSettings: (pluginId: string, settings: any) => void;
  getPluginSettings: (pluginId: string) => any;
  getPluginsByCategory: (category: Plugin['category']) => Plugin[];
  refreshPlugins: () => void;
}

export function usePlugins(): UsePluginsReturn {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [enabledPlugins, setEnabledPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPlugins = useCallback(() => {
    try {
      const allPlugins = pluginManager.getAllPlugins();
      const enabled = pluginManager.getEnabledPlugins();
      
      setPlugins(allPlugins);
      setEnabledPlugins(enabled);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
    }
  }, []);

  const enablePlugin = useCallback(async (pluginId: string) => {
    try {
      setLoading(true);
      await pluginManager.enablePlugin(pluginId);
      refreshPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable plugin');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPlugins]);

  const disablePlugin = useCallback(async (pluginId: string) => {
    try {
      setLoading(true);
      await pluginManager.disablePlugin(pluginId);
      refreshPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable plugin');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshPlugins]);

  const updatePluginSettings = useCallback((pluginId: string, settings: any) => {
    try {
      pluginManager.updateSettings(pluginId, settings);
      refreshPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plugin settings');
      throw err;
    }
  }, [refreshPlugins]);

  const getPluginSettings = useCallback((pluginId: string) => {
    return pluginManager.getSettings(pluginId);
  }, []);

  const getPluginsByCategory = useCallback((category: Plugin['category']) => {
    return pluginManager.getPluginsByCategory(category);
  }, []);

  useEffect(() => {
    refreshPlugins();
    setLoading(false);
  }, [refreshPlugins]);

  return {
    plugins,
    enabledPlugins,
    loading,
    error,
    enablePlugin,
    disablePlugin,
    updatePluginSettings,
    getPluginSettings,
    getPluginsByCategory,
    refreshPlugins
  };
}

// Hook for plugin settings management
export function usePluginSettings(pluginId: string) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(() => {
    try {
      const pluginSettings = pluginManager.getSettings(pluginId);
      setSettings(pluginSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugin settings');
    } finally {
      setLoading(false);
    }
  }, [pluginId]);

  const updateSettings = useCallback((newSettings: any) => {
    try {
      pluginManager.updateSettings(pluginId, newSettings);
      setSettings(newSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plugin settings');
      throw err;
    }
  }, [pluginId]);

  const updateSetting = useCallback((settingId: string, value: any) => {
    const newSettings = { ...settings, [settingId]: value };
    updateSettings(newSettings);
  }, [settings, updateSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateSetting,
    reload: loadSettings
  };
}

// Hook for plugin events
export function usePluginEvents() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadEvents = () => {
      const pluginEvents = pluginManager.getEvents();
      setEvents(pluginEvents);
    };

    loadEvents();

    // Set up event listener for new events
    const handleEvent = () => {
      loadEvents();
    };

    // Add event listener (this would be connected to the actual event system)
    document.addEventListener('plugin-event', handleEvent);

    return () => {
      document.removeEventListener('plugin-event', handleEvent);
    };
  }, []);

  const clearEvents = useCallback(() => {
    pluginManager.clearEvents();
    setEvents([]);
  }, []);

  return {
    events,
    clearEvents
  };
} 