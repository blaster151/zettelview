import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineSupportService } from '../offlineSupportService';
import { Note } from '../../types/domain';

describe('Offline Support Service - Conflict Resolution', () => {
  let offlineService: OfflineSupportService;
  let mockLocalStorage: Storage;
  let mockIndexedDB: IDBDatabase;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    };

    // Mock IndexedDB
    mockIndexedDB = {
      name: 'test-db',
      version: 1,
      objectStoreNames: ['notes', 'sync-queue'],
      close: vi.fn(),
      createObjectStore: vi.fn(),
      deleteObjectStore: vi.fn(),
      transaction: vi.fn()
    } as any;

    offlineService = new OfflineSupportService();
    
    // Mock global objects
    global.localStorage = mockLocalStorage;
    global.indexedDB = {
      open: vi.fn().mockResolvedValue(mockIndexedDB)
    } as any;
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Conflict Detection', () => {
    test('should detect concurrent modification conflicts', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        body: 'Remote content',
        updatedAt: new Date('2023-01-01T11:30:00Z'),
        version: 2
      };

      const hasConflict = offlineService.detectConflict(baseNote, localChange, remoteChange);
      expect(hasConflict).toBe(true);
    });

    test('should not detect conflicts for sequential changes', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...localChange,
        body: 'Remote content',
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        version: 3
      };

      const hasConflict = offlineService.detectConflict(baseNote, localChange, remoteChange);
      expect(hasConflict).toBe(false);
    });

    test('should detect deletion conflicts', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange = null; // Note was deleted remotely

      const hasConflict = offlineService.detectConflict(baseNote, localChange, remoteChange);
      expect(hasConflict).toBe(true);
    });

    test('should detect creation conflicts', async () => {
      const localNote: Note = {
        id: 'test-note',
        title: 'Local Title',
        body: 'Local content',
        tags: ['local'],
        createdAt: new Date('2023-01-01T10:00:00Z'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const remoteNote: Note = {
        id: 'test-note', // Same ID
        title: 'Remote Title',
        body: 'Remote content',
        tags: ['remote'],
        createdAt: new Date('2023-01-01T10:30:00Z'),
        updatedAt: new Date('2023-01-01T10:30:00Z'),
        version: 1
      };

      const hasConflict = offlineService.detectConflict(null, localNote, remoteNote);
      expect(hasConflict).toBe(true);
    });
  });

  describe('Conflict Resolution Strategies', () => {
    test('should resolve conflicts using last-writer-wins strategy', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        body: 'Remote content',
        updatedAt: new Date('2023-01-01T12:00:00Z'), // Later timestamp
        version: 2
      };

      const resolved = offlineService.resolveConflict('last-writer-wins', baseNote, localChange, remoteChange);
      
      expect(resolved.title).toBe('Local Title'); // Local wins for title
      expect(resolved.body).toBe('Remote content'); // Remote wins for body (later timestamp)
      expect(resolved.version).toBe(3);
    });

    test('should resolve conflicts using manual merge strategy', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        body: 'Local content',
        tags: ['local'],
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        title: 'Remote Title',
        body: 'Remote content',
        tags: ['remote'],
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        version: 2
      };

      const resolved = offlineService.resolveConflict('manual-merge', baseNote, localChange, remoteChange);
      
      // Should preserve both changes and require manual resolution
      expect(resolved.conflict).toBeDefined();
      expect(resolved.conflict?.localChange).toEqual(localChange);
      expect(resolved.conflict?.remoteChange).toEqual(remoteChange);
    });

    test('should resolve conflicts using field-level merge strategy', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        tags: ['local', 'original'],
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        body: 'Remote content',
        tags: ['remote', 'original'],
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        version: 2
      };

      const resolved = offlineService.resolveConflict('field-merge', baseNote, localChange, remoteChange);
      
      expect(resolved.title).toBe('Local Title');
      expect(resolved.body).toBe('Remote content');
      expect(resolved.tags).toContain('local');
      expect(resolved.tags).toContain('remote');
      expect(resolved.tags).toContain('original');
      expect(resolved.version).toBe(3);
    });

    test('should handle deletion conflicts appropriately', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange = null; // Deleted remotely

      const resolved = offlineService.resolveConflict('last-writer-wins', baseNote, localChange, remoteChange);
      
      // Should preserve local changes and mark as conflicted
      expect(resolved.conflict).toBeDefined();
      expect(resolved.conflict?.type).toBe('deletion-conflict');
    });
  });

  describe('Offline Queue Management', () => {
    test('should queue operations when offline', async () => {
      const note: Note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Simulate offline state
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

      await offlineService.saveNote(note);

      const queue = await offlineService.getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].operation).toBe('save');
      expect(queue[0].data).toEqual(note);
    });

    test('should process queue when coming back online', async () => {
      const note: Note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Add to queue while offline
      await offlineService.addToSyncQueue('save', note);

      // Simulate coming back online
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      
      const mockSyncFunction = vi.fn().mockResolvedValue({ success: true });
      offlineService.setSyncFunction(mockSyncFunction);

      await offlineService.processSyncQueue();

      expect(mockSyncFunction).toHaveBeenCalledWith('save', note);
    });

    test('should handle queue processing failures', async () => {
      const note: Note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      await offlineService.addToSyncQueue('save', note);

      // Simulate sync failure
      const mockSyncFunction = vi.fn().mockRejectedValue(new Error('Network error'));
      offlineService.setSyncFunction(mockSyncFunction);

      await offlineService.processSyncQueue();

      // Failed operations should remain in queue
      const queue = await offlineService.getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].retryCount).toBe(1);
    });

    test('should limit retry attempts for failed operations', async () => {
      const note: Note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      await offlineService.addToSyncQueue('save', note);

      // Simulate repeated sync failures
      const mockSyncFunction = vi.fn().mockRejectedValue(new Error('Network error'));
      offlineService.setSyncFunction(mockSyncFunction);

      // Process queue multiple times
      for (let i = 0; i < 5; i++) {
        await offlineService.processSyncQueue();
      }

      // Should stop retrying after max attempts
      const queue = await offlineService.getSyncQueue();
      expect(queue[0].retryCount).toBeLessThanOrEqual(3); // Max 3 retries
    });
  });

  describe('Data Synchronization', () => {
    test('should sync local changes to remote', async () => {
      const localNotes: Note[] = [
        {
          id: 'note-1',
          title: 'Local Note 1',
          body: 'Local content 1',
          tags: ['local'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        },
        {
          id: 'note-2',
          title: 'Local Note 2',
          body: 'Local content 2',
          tags: ['local'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      ];

      const mockSyncFunction = vi.fn().mockResolvedValue({ success: true });
      offlineService.setSyncFunction(mockSyncFunction);

      await offlineService.syncToRemote(localNotes);

      expect(mockSyncFunction).toHaveBeenCalledTimes(2);
      expect(mockSyncFunction).toHaveBeenCalledWith('save', localNotes[0]);
      expect(mockSyncFunction).toHaveBeenCalledWith('save', localNotes[1]);
    });

    test('should sync remote changes to local', async () => {
      const remoteNotes: Note[] = [
        {
          id: 'note-1',
          title: 'Remote Note 1',
          body: 'Remote content 1',
          tags: ['remote'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        },
        {
          id: 'note-2',
          title: 'Remote Note 2',
          body: 'Remote content 2',
          tags: ['remote'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      ];

      const mockSyncFunction = vi.fn().mockResolvedValue(remoteNotes);
      offlineService.setSyncFunction(mockSyncFunction);

      const syncedNotes = await offlineService.syncFromRemote();

      expect(mockSyncFunction).toHaveBeenCalledWith('fetch');
      expect(syncedNotes).toEqual(remoteNotes);
    });

    test('should handle partial sync failures', async () => {
      const localNotes: Note[] = [
        {
          id: 'note-1',
          title: 'Local Note 1',
          body: 'Local content 1',
          tags: ['local'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        },
        {
          id: 'note-2',
          title: 'Local Note 2',
          body: 'Local content 2',
          tags: ['local'],
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1
        }
      ];

      const mockSyncFunction = vi.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Network error'));

      offlineService.setSyncFunction(mockSyncFunction);

      const results = await offlineService.syncToRemote(localNotes);

      expect(results.successCount).toBe(1);
      expect(results.failureCount).toBe(1);
      expect(results.failures).toHaveLength(1);
    });
  });

  describe('Conflict Resolution UI Integration', () => {
    test('should provide conflict resolution options', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        body: 'Remote content',
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        version: 2
      };

      const conflict = offlineService.createConflict(baseNote, localChange, remoteChange);

      expect(conflict.id).toBe('test-note');
      expect(conflict.localChange).toEqual(localChange);
      expect(conflict.remoteChange).toEqual(remoteChange);
      expect(conflict.baseNote).toEqual(baseNote);
      expect(conflict.resolutionOptions).toContain('keep-local');
      expect(conflict.resolutionOptions).toContain('keep-remote');
      expect(conflict.resolutionOptions).toContain('manual-merge');
    });

    test('should resolve conflicts based on user choice', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        body: 'Remote content',
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        version: 2
      };

      const resolved = offlineService.resolveConflictByChoice('keep-local', baseNote, localChange, remoteChange);
      
      expect(resolved).toEqual(localChange);
      expect(resolved.version).toBe(3);
    });

    test('should handle manual merge resolution', async () => {
      const baseNote: Note = {
        id: 'test-note',
        title: 'Original Title',
        body: 'Original content',
        tags: ['original'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01T10:00:00Z'),
        version: 1
      };

      const localChange: Note = {
        ...baseNote,
        title: 'Local Title',
        updatedAt: new Date('2023-01-01T11:00:00Z'),
        version: 2
      };

      const remoteChange: Note = {
        ...baseNote,
        body: 'Remote content',
        updatedAt: new Date('2023-01-01T12:00:00Z'),
        version: 2
      };

      const manualMerge: Note = {
        ...baseNote,
        title: 'Merged Title',
        body: 'Merged content',
        tags: ['merged'],
        updatedAt: new Date('2023-01-01T13:00:00Z'),
        version: 3
      };

      const resolved = offlineService.resolveConflictByChoice('manual-merge', baseNote, localChange, remoteChange, manualMerge);
      
      expect(resolved).toEqual(manualMerge);
    });
  });

  describe('Offline State Management', () => {
    test('should detect offline state changes', async () => {
      const onlineHandler = vi.fn();
      const offlineHandler = vi.fn();

      offlineService.onOnline(onlineHandler);
      offlineService.onOffline(offlineHandler);

      // Simulate going offline
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      window.dispatchEvent(new Event('offline'));

      expect(offlineHandler).toHaveBeenCalled();

      // Simulate coming back online
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      window.dispatchEvent(new Event('online'));

      expect(onlineHandler).toHaveBeenCalled();
    });

    test('should maintain offline state across page reloads', async () => {
      const note: Note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Save note while offline
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      await offlineService.saveNote(note);

      // Simulate page reload
      const newOfflineService = new OfflineSupportService();
      
      // Should still have the note in local storage
      const savedNotes = await newOfflineService.getLocalNotes();
      expect(savedNotes).toContainEqual(note);
    });

    test('should handle storage quota exceeded', async () => {
      const largeNote: Note = {
        id: 'large-note',
        title: 'Large Note',
        body: 'A'.repeat(1000000), // 1MB content
        tags: ['large'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      // Mock storage quota exceeded
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(offlineService.saveNote(largeNote)).rejects.toThrow('QuotaExceededError');
    });
  });

  describe('Data Integrity', () => {
    test('should validate data integrity during sync', async () => {
      const corruptedNote = {
        id: 'corrupted-note',
        title: 'Corrupted Note',
        body: 'Corrupted content',
        tags: ['corrupted'],
        createdAt: 'invalid-date', // Invalid date
        updatedAt: new Date(),
        version: 1
      };

      const validationResult = offlineService.validateNote(corruptedNote as any);
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toContain('Invalid date format');
    });

    test('should handle corrupted local storage data', async () => {
      // Mock corrupted data in localStorage
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data');

      const notes = await offlineService.getLocalNotes();
      expect(notes).toEqual([]); // Should return empty array for corrupted data
    });

    test('should backup data before sync operations', async () => {
      const note: Note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };

      await offlineService.saveNote(note);

      // Verify backup was created
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('backup'),
        expect.any(String)
      );
    });
  });
}); 