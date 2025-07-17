import React from 'react';
import { pluginAPI } from './pluginAPI';
import { pluginPermissionsService } from './pluginPermissions';

// Mock the stores
jest.mock('../store/noteStore', () => ({
  useNoteStore: {
    getState: jest.fn(() => ({
      notes: [
        { id: '1', title: 'Test Note 1', body: 'Content 1', tags: ['test'] },
        { id: '2', title: 'Test Note 2', body: 'Content 2', tags: ['test', 'example'] }
      ],
      getNote: jest.fn((id: string) => ({
        id: '1',
        title: 'Test Note 1',
        body: 'Content 1',
        tags: ['test']
      })),
      addNote: jest.fn(),
      updateNote: jest.fn(),
      deleteNote: jest.fn(),
      searchNotes: jest.fn(),
      searchResults: [{ noteId: '1', score: 0.8 }]
    }))
  }
}));

jest.mock('../store/themeStore', () => ({
  useThemeStore: {
    getState: jest.fn(() => ({
      theme: 'light'
    }))
  }
}));

jest.mock('../store/notificationStore', () => ({
  useNotificationStore: {
    getState: jest.fn(() => ({
      showNotification: jest.fn()
    }))
  }
}));

describe('PluginAPI', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset plugin permissions
    pluginPermissionsService.clearAllPermissions();
    
    // Initialize the API
    const noteStore = require('../store/noteStore').useNoteStore.getState();
    const themeStore = require('../store/themeStore').useThemeStore.getState();
    const notificationStore = require('../store/notificationStore').useNotificationStore.getState();
    
    pluginAPI.initialize(noteStore, themeStore, notificationStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Notes API', () => {
    it('should get all notes when permission is granted', () => {
      // Grant permission
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read']);
      
      const notes = pluginAPI.notes.getAll();
      expect(notes).toHaveLength(2);
      expect(notes[0].title).toBe('Test Note 1');
    });

    it('should throw error when notes.read permission is denied', () => {
      expect(() => pluginAPI.notes.getAll()).toThrow('Permission denied: notes.read');
    });

    it('should get note by ID when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read']);
      
      const note = pluginAPI.notes.getById('1');
      expect(note).toBeDefined();
      expect(note?.title).toBe('Test Note 1');
    });

    it('should create note when permission is granted', async () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.write']);
      
      const noteId = await pluginAPI.notes.create('New Note', {
        body: 'New content',
        tags: ['new']
      });
      
      expect(noteId).toBe('new-note');
    });

    it('should throw error when notes.write permission is denied', async () => {
      await expect(pluginAPI.notes.create('New Note')).rejects.toThrow('Permission denied: notes.write');
    });

    it('should update note when permission is granted', async () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.write']);
      
      await expect(pluginAPI.notes.update('1', { title: 'Updated Title' })).resolves.toBeUndefined();
    });

    it('should delete note when permission is granted', async () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.delete']);
      
      await expect(pluginAPI.notes.delete('1')).resolves.toBeUndefined();
    });

    it('should search notes when permission is granted', async () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read']);
      
      const results = await pluginAPI.notes.search('test');
      expect(results).toHaveLength(1);
    });

    it('should get notes by tag when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read']);
      
      const notes = pluginAPI.notes.getByTag('test');
      expect(notes).toHaveLength(2);
    });

    it('should get all tags when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read']);
      
      const tags = pluginAPI.notes.getTags();
      expect(tags).toContain('test');
      expect(tags).toContain('example');
    });
  });

  describe('UI API', () => {
    it('should show notification when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['ui.notifications']);
      
      expect(() => pluginAPI.ui.showNotification('Test message')).not.toThrow();
    });

    it('should throw error when ui.notifications permission is denied', () => {
      expect(() => pluginAPI.ui.showNotification('Test message')).toThrow('Permission denied: ui.notifications');
    });

    it('should register panel when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['ui.panels']);
      
      const MockPanel = () => React.createElement('div', null, 'Panel');
      expect(() => pluginAPI.ui.registerPanel('test-panel', MockPanel)).not.toThrow();
    });

    it('should throw error when ui.panels permission is denied', () => {
      const MockPanel = () => React.createElement('div', null, 'Panel');
      expect(() => pluginAPI.ui.registerPanel('test-panel', MockPanel)).toThrow('Permission denied: ui.panels');
    });

    it('should register command when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['ui.commands']);
      
      const command = {
        name: 'Test Command',
        description: 'Test command',
        execute: jest.fn()
      };
      
      expect(() => pluginAPI.ui.registerCommand('test-command', command)).not.toThrow();
    });

    it('should register menu item when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['ui.menus']);
      
      const menuItem = {
        id: 'test-menu',
        label: 'Test Menu',
        action: jest.fn()
      };
      
      expect(() => pluginAPI.ui.registerMenuItem('test-menu', menuItem)).not.toThrow();
    });
  });

  describe('Storage API', () => {
    it('should get stored value when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['storage.read']);
      
      localStorage.setItem('plugin_test-key', JSON.stringify({ value: 'test' }));
      const result = pluginAPI.storage.get('test-key');
      expect(result).toEqual({ value: 'test' });
    });

    it('should throw error when storage.read permission is denied', () => {
      expect(() => pluginAPI.storage.get('test-key')).toThrow('Permission denied: storage.read');
    });

    it('should set value when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['storage.write']);
      
      expect(() => pluginAPI.storage.set('test-key', { value: 'test' })).not.toThrow();
      expect(localStorage.getItem('plugin_test-key')).toBe('{"value":"test"}');
    });

    it('should throw error when storage.write permission is denied', () => {
      expect(() => pluginAPI.storage.set('test-key', 'value')).toThrow('Permission denied: storage.write');
    });

    it('should remove value when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['storage.write']);
      
      localStorage.setItem('plugin_test-key', 'value');
      expect(() => pluginAPI.storage.remove('test-key')).not.toThrow();
      expect(localStorage.getItem('plugin_test-key')).toBeNull();
    });

    it('should clear all plugin storage when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['storage.write']);
      
      localStorage.setItem('plugin_key1', 'value1');
      localStorage.setItem('plugin_key2', 'value2');
      localStorage.setItem('other_key', 'value3');
      
      expect(() => pluginAPI.storage.clear()).not.toThrow();
      expect(localStorage.getItem('plugin_key1')).toBeNull();
      expect(localStorage.getItem('plugin_key2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('value3'); // Should not be cleared
    });

    it('should check if key exists when permission is granted', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['storage.read']);
      
      localStorage.setItem('plugin_test-key', 'value');
      expect(pluginAPI.storage.has('test-key')).toBe(true);
      expect(pluginAPI.storage.has('non-existent')).toBe(false);
    });
  });

  describe('App API', () => {
    it('should provide app information', () => {
      expect(pluginAPI.app.version).toBe('1.0.0');
      expect(pluginAPI.app.theme).toBe('light');
      expect(pluginAPI.app.locale).toBeDefined();
      expect(pluginAPI.app.platform).toBe('web');
      expect(typeof pluginAPI.app.isOnline).toBe('boolean');
    });

    it('should get configuration values', () => {
      const maxNotes = pluginAPI.app.getConfig('maxNotes');
      expect(maxNotes).toBe(1000);
    });
  });

  describe('API Access', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should make API request when permission is granted', async () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['api.external']);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });
      
      const result = await pluginAPI.api.request('https://api.example.com/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should throw error when api.external permission is denied', async () => {
      await expect(pluginAPI.api.request('https://api.example.com/test')).rejects.toThrow('Permission denied: api.external');
    });

    it('should handle API errors', async () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['api.external']);
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(pluginAPI.api.request('https://api.example.com/test')).rejects.toThrow('API request failed: 404 Not Found');
    });
  });

  describe('Events API', () => {
    it('should register and emit events', () => {
      const callback = jest.fn();
      pluginAPI.events.on('test-event', callback);
      
      pluginAPI.events.emit('test-event', { data: 'test' });
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const callback = jest.fn();
      pluginAPI.events.on('test-event', callback);
      pluginAPI.events.off('test-event', callback);
      
      pluginAPI.events.emit('test-event', { data: 'test' });
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle errors in event listeners', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const callback = jest.fn(() => {
        throw new Error('Test error');
      });
      
      pluginAPI.events.on('test-event', callback);
      pluginAPI.events.emit('test-event', { data: 'test' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error in event listener for test-event:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Utils API', () => {
    it('should debounce functions', (done) => {
      const func = jest.fn();
      const debounced = pluginAPI.utils.debounce(func, 100);
      
      debounced();
      debounced();
      debounced();
      
      expect(func).not.toHaveBeenCalled();
      
      setTimeout(() => {
        expect(func).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    it('should throttle functions', (done) => {
      const func = jest.fn();
      const throttled = pluginAPI.utils.throttle(func, 100);
      
      throttled();
      throttled();
      throttled();
      
      expect(func).toHaveBeenCalledTimes(1);
      
      setTimeout(() => {
        throttled();
        expect(func).toHaveBeenCalledTimes(2);
        done();
      }, 150);
    });

    it('should generate unique IDs', () => {
      const id1 = pluginAPI.utils.generateId();
      const id2 = pluginAPI.utils.generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should format dates', () => {
      const date = new Date('2023-01-15T10:30:00');
      
      expect(pluginAPI.utils.formatDate(date, 'YYYY-MM-DD')).toBe('2023-01-15');
      expect(pluginAPI.utils.formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2023-01-15 10:30');
    });

    it('should sanitize HTML', () => {
      const html = '<p>Hello <script>alert("xss")</script> World</p>';
      const sanitized = pluginAPI.utils.sanitizeHtml(html);
      
      expect(sanitized).toBe('<p>Hello  World</p>');
    });
  });

  describe('Permissions API', () => {
    it('should check permissions', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read']);
      
      expect(pluginAPI.permissions.hasPermission('notes.read')).toBe(true);
      expect(pluginAPI.permissions.hasPermission('notes.write')).toBe(false);
    });

    it('should get granted permissions', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['notes.read', 'storage.read']);
      
      const permissions = pluginAPI.permissions.getGrantedPermissions();
      expect(permissions).toContain('notes.read');
      expect(permissions).toContain('storage.read');
    });

    it('should request permissions', async () => {
      const result = await pluginAPI.permissions.requestPermission('notes.write');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Plugin Management', () => {
    it('should get registered panels', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['ui.panels']);
      
      const MockPanel = () => React.createElement('div', null, 'Panel');
      pluginAPI.ui.registerPanel('test-panel', MockPanel);
      
      const panels = pluginAPI.getRegisteredPanels();
      expect(panels.has('test-panel')).toBe(true);
    });

    it('should get registered commands', () => {
      pluginPermissionsService.grantPermissions('test-plugin', ['ui.commands']);
      
      const command = {
        name: 'Test Command',
        description: 'Test command',
        execute: jest.fn()
      };
      
      pluginAPI.ui.registerCommand('test-command', command);
      
      const commands = pluginAPI.getRegisteredCommands();
      expect(commands.has('test-command')).toBe(true);
    });

    it('should grant and revoke permissions', () => {
      pluginAPI.grantPermissions(['notes.read', 'storage.write']);
      expect(pluginAPI.permissions.hasPermission('notes.read')).toBe(true);
      expect(pluginAPI.permissions.hasPermission('storage.write')).toBe(true);
      
      pluginAPI.revokePermissions(['notes.read']);
      expect(pluginAPI.permissions.hasPermission('notes.read')).toBe(false);
      expect(pluginAPI.permissions.hasPermission('storage.write')).toBe(true);
    });
  });
}); 