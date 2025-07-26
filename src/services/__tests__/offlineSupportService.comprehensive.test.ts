import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflineSupportService } from '../offlineSupportService';
import { Note, SyncConflict, SyncStatus, OfflineQueue } from '../../types/domain';

describe('Offline Support Service - Comprehensive Sync Testing', () => {
  let offlineService: OfflineSupportService;
  let mockNote: Note;

  beforeEach(() => {
    offlineService = new OfflineSupportService();
    
    mockNote = {
      id: 'test-note-1',
      title: 'Test Note',
      content: 'Test content',
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      syncStatus: 'synced'
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complex Conflict Resolution Scenarios', () => {
    test('should handle three-way merge conflicts', async () => {
      // Base version
      const baseNote: Note = {
        ...mockNote,
        content: 'Original content\nLine 2\nLine 3',
        version: 1
      };

      // Local changes
      const localNote: Note = {
        ...baseNote,
        content: 'Original content\nLine 2 modified\nLine 3\nLine 4 added',
        version: 2,
        updatedAt: new Date(Date.now() + 1000)
      };

      // Remote changes
      const remoteNote: Note = {
        ...baseNote,
        content: 'Original content\nLine 2\nLine 3 modified\nLine 5 added',
        version: 2,
        updatedAt: new Date(Date.now() + 2000)
      };

      const result = await offlineService.resolveThreeWayConflict(baseNote, localNote, remoteNote);

      expect(result.resolved).toBe(true);
      expect(result.mergedContent).toContain('Line 2 modified');
      expect(result.mergedContent).toContain('Line 3 modified');
      expect(result.mergedContent).toContain('Line 4 added');
      expect(result.mergedContent).toContain('Line 5 added');
      expect(result.conflictMarkers).toBeDefined();
    });

    test('should handle field-level conflict resolution', async () => {
      const baseNote: Note = {
        ...mockNote,
        title: 'Original Title',
        content: 'Original content',
        tags: ['original'],
        version: 1
      };

      const localNote: Note = {
        ...baseNote,
        title: 'Local Title',
        content: 'Local content',
        tags: ['local'],
        version: 2
      };

      const remoteNote: Note = {
        ...baseNote,
        title: 'Remote Title',
        content: 'Remote content',
        tags: ['remote'],
        version: 2
      };

      const resolutionStrategy = {
        title: 'remote', // Prefer remote title
        content: 'merge', // Merge content
        tags: 'union' // Combine tags
      };

      const result = await offlineService.resolveFieldLevelConflict(
        baseNote, localNote, remoteNote, resolutionStrategy
      );

      expect(result.resolved).toBe(true);
      expect(result.mergedNote.title).toBe('Remote Title');
      expect(result.mergedNote.content).toContain('Local content');
      expect(result.mergedNote.content).toContain('Remote content');
      expect(result.mergedNote.tags).toContain('local');
      expect(result.mergedNote.tags).toContain('remote');
    });

    test('should handle deletion conflicts', async () => {
      const baseNote: Note = { ...mockNote, version: 1 };
      const localNote: Note = { ...baseNote, deleted: true, version: 2 };
      const remoteNote: Note = { ...baseNote, content: 'Remote changes', version: 2 };

      const result = await offlineService.resolveDeletionConflict(baseNote, localNote, remoteNote);

      expect(result.resolved).toBe(true);
      expect(result.action).toBe('keep_remote');
      expect(result.mergedNote.deleted).toBe(false);
      expect(result.mergedNote.content).toBe('Remote changes');
    });

    test('should handle concurrent creation conflicts', async () => {
      const localNote: Note = {
        ...mockNote,
        id: 'local-generated-id',
        title: 'Local Note',
        createdAt: new Date()
      };

      const remoteNote: Note = {
        ...mockNote,
        id: 'remote-generated-id',
        title: 'Remote Note',
        createdAt: new Date()
      };

      const result = await offlineService.resolveCreationConflict(localNote, remoteNote);

      expect(result.resolved).toBe(true);
      expect(result.action).toBe('merge_and_rename');
      expect(result.mergedNote.title).toContain('Local Note');
      expect(result.mergedNote.title).toContain('Remote Note');
      expect(result.mergedNote.id).toBeDefined();
    });

    test('should handle circular reference conflicts', async () => {
      const noteA: Note = {
        ...mockNote,
        id: 'note-a',
        content: 'Content A\n[[note-b]]',
        links: ['note-b']
      };

      const noteB: Note = {
        ...mockNote,
        id: 'note-b',
        content: 'Content B\n[[note-a]]',
        links: ['note-a']
      };

      const result = await offlineService.resolveCircularReferenceConflict([noteA, noteB]);

      expect(result.resolved).toBe(true);
      expect(result.actions).toContain('break_circular_reference');
      expect(result.notes[0].links).not.toContain('note-b');
      expect(result.notes[1].links).not.toContain('note-a');
    });

    test('should handle metadata conflict resolution', async () => {
      const baseNote: Note = {
        ...mockNote,
        metadata: { author: 'original', category: 'general' },
        version: 1
      };

      const localNote: Note = {
        ...baseNote,
        metadata: { author: 'local', category: 'general', tags: ['local'] },
        version: 2
      };

      const remoteNote: Note = {
        ...baseNote,
        metadata: { author: 'remote', category: 'specific', priority: 'high' },
        version: 2
      };

      const result = await offlineService.resolveMetadataConflict(baseNote, localNote, remoteNote);

      expect(result.resolved).toBe(true);
      expect(result.mergedMetadata.author).toBe('remote'); // Remote wins
      expect(result.mergedMetadata.category).toBe('specific'); // Remote wins
      expect(result.mergedMetadata.tags).toContain('local'); // Union
      expect(result.mergedMetadata.priority).toBe('high'); // Remote wins
    });
  });

  describe('Network Interruption Recovery', () => {
    test('should handle intermittent network failures', async () => {
      const notes = Array.from({ length: 10 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        syncStatus: 'pending' as const
      }));

      // Mock network failures on specific attempts
      let attemptCount = 0;
      vi.spyOn(global, 'fetch').mockImplementation(() => {
        attemptCount++;
        if (attemptCount % 3 === 0) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(new Response(JSON.stringify({ success: true })));
      });

      const result = await offlineService.syncNotesWithRetry(notes);

      expect(result.success).toBe(true);
      expect(result.syncedNotes).toHaveLength(10);
      expect(result.retryCount).toBeGreaterThan(0);
      expect(result.failedNotes).toHaveLength(0);
    });

    test('should implement exponential backoff for network failures', async () => {
      const note = { ...mockNote, syncStatus: 'pending' as const };

      const delays: number[] = [];
      let attemptCount = 0;

      vi.spyOn(global, 'fetch').mockImplementation(() => {
        attemptCount++;
        delays.push(Date.now());
        return Promise.reject(new Error('Network error'));
      });

      const startTime = Date.now();
      await offlineService.syncNoteWithBackoff(note, { maxRetries: 3 });
      const endTime = Date.now();

      // Should have exponential delays: 1s, 2s, 4s
      expect(delays.length).toBe(4); // Initial + 3 retries
      expect(endTime - startTime).toBeGreaterThan(7000); // At least 7 seconds total
    });

    test('should handle partial sync failures', async () => {
      const notes = Array.from({ length: 5 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        syncStatus: 'pending' as const
      }));

      // Mock partial network failures
      vi.spyOn(global, 'fetch').mockImplementation((url) => {
        const noteId = url.toString().split('/').pop();
        if (noteId === 'note-2' || noteId === 'note-4') {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(new Response(JSON.stringify({ success: true })));
      });

      const result = await offlineService.syncNotesBatch(notes);

      expect(result.success).toBe(false);
      expect(result.syncedNotes).toHaveLength(3);
      expect(result.failedNotes).toHaveLength(2);
      expect(result.failedNotes.map(n => n.id)).toContain('note-2');
      expect(result.failedNotes.map(n => n.id)).toContain('note-4');
    });

    test('should handle connection timeout scenarios', async () => {
      const note = { ...mockNote, syncStatus: 'pending' as const };

      // Mock timeout
      vi.spyOn(global, 'fetch').mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      const result = await offlineService.syncNoteWithTimeout(note, { timeout: 50 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timeout');
      expect(result.retryable).toBe(true);
    });

    test('should handle offline queue management during network outages', async () => {
      const notes = Array.from({ length: 20 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        syncStatus: 'pending' as const
      }));

      // Simulate network outage
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network unavailable'));

      // Add notes to offline queue
      for (const note of notes) {
        await offlineService.addToOfflineQueue(note);
      }

      const queueStatus = await offlineService.getOfflineQueueStatus();
      expect(queueStatus.pendingItems).toBe(20);
      expect(queueStatus.queueSize).toBe(20);

      // Simulate network recovery
      vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true })));

      const syncResult = await offlineService.processOfflineQueue();

      expect(syncResult.success).toBe(true);
      expect(syncResult.processedItems).toBe(20);
      expect(syncResult.failedItems).toBe(0);
    });
  });

  describe('Data Corruption Detection', () => {
    test('should detect corrupted note content', async () => {
      const corruptedNotes = [
        { ...mockNote, content: null },
        { ...mockNote, content: undefined },
        { ...mockNote, content: '' },
        { ...mockNote, content: 'A'.repeat(1000000) }, // Too large
        { ...mockNote, content: 'Invalid UTF-8: \xFF\xFE\xFD' }
      ];

      for (const note of corruptedNotes) {
        const result = await offlineService.validateNoteIntegrity(note);
        expect(result.valid).toBe(false);
        expect(result.corruptionType).toBeDefined();
      }
    });

    test('should detect corrupted metadata', async () => {
      const corruptedNotes = [
        { ...mockNote, metadata: { invalid: 'data', circular: null } },
        { ...mockNote, metadata: { deeply: { nested: { circular: null } } } },
        { ...mockNote, metadata: { function: () => {} } }, // Functions not allowed
        { ...mockNote, metadata: { date: new Date('invalid') } }
      ];

      for (const note of corruptedNotes) {
        const result = await offlineService.validateMetadataIntegrity(note);
        expect(result.valid).toBe(false);
        expect(result.corruptionType).toBeDefined();
      }
    });

    test('should detect corrupted file references', async () => {
      const corruptedNotes = [
        { ...mockNote, attachments: [{ path: '/etc/passwd', size: -1 }] },
        { ...mockNote, attachments: [{ path: 'relative/../path', size: 1000 }] },
        { ...mockNote, attachments: [{ path: '', size: 1000 }] },
        { ...mockNote, attachments: [{ path: 'valid/path', size: null }] }
      ];

      for (const note of corruptedNotes) {
        const result = await offlineService.validateAttachmentIntegrity(note);
        expect(result.valid).toBe(false);
        expect(result.corruptionType).toBeDefined();
      }
    });

    test('should detect corrupted sync state', async () => {
      const corruptedStates = [
        { ...mockNote, version: -1 },
        { ...mockNote, version: null },
        { ...mockNote, syncStatus: 'invalid_status' as any },
        { ...mockNote, updatedAt: new Date('invalid') },
        { ...mockNote, createdAt: new Date(Date.now() + 86400000) } // Future date
      ];

      for (const note of corruptedStates) {
        const result = await offlineService.validateSyncStateIntegrity(note);
        expect(result.valid).toBe(false);
        expect(result.corruptionType).toBeDefined();
      }
    });

    test('should implement data recovery mechanisms', async () => {
      const corruptedNote: Note = {
        ...mockNote,
        content: null,
        metadata: { corrupted: 'data' },
        version: -1
      };

      const recoveryResult = await offlineService.recoverCorruptedNote(corruptedNote);

      expect(recoveryResult.recovered).toBe(true);
      expect(recoveryResult.recoveredNote.content).toBeDefined();
      expect(recoveryResult.recoveredNote.metadata).toBeDefined();
      expect(recoveryResult.recoveredNote.version).toBeGreaterThan(0);
      expect(recoveryResult.recoveryActions).toBeDefined();
    });

    test('should detect and handle checksum mismatches', async () => {
      const note = { ...mockNote, checksum: 'original-checksum' };
      
      // Simulate content change without checksum update
      const modifiedNote = { ...note, content: 'Modified content' };

      const result = await offlineService.validateChecksum(modifiedNote);

      expect(result.valid).toBe(false);
      expect(result.checksumMismatch).toBe(true);
      expect(result.expectedChecksum).toBeDefined();
      expect(result.actualChecksum).toBeDefined();
    });
  });

  describe('Sync Performance Under Load', () => {
    test('should handle large batch synchronization', async () => {
      const largeNoteSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        content: `Content for note ${i}`.repeat(10), // ~200 chars per note
        syncStatus: 'pending' as const
      }));

      const startTime = performance.now();
      const result = await offlineService.syncLargeBatch(largeNoteSet);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.syncedNotes).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(result.batchSize).toBeGreaterThan(0);
      expect(result.processingTime).toBeDefined();
    });

    test('should implement concurrent sync operations', async () => {
      const noteBatches = Array.from({ length: 5 }, (_, batchIndex) =>
        Array.from({ length: 100 }, (_, noteIndex) => ({
          ...mockNote,
          id: `batch-${batchIndex}-note-${noteIndex}`,
          title: `Batch ${batchIndex} Note ${noteIndex}`,
          syncStatus: 'pending' as const
        }))
      );

      const startTime = performance.now();
      const results = await Promise.all(
        noteBatches.map(batch => offlineService.syncNotesBatch(batch))
      );
      const endTime = performance.now();

      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(15000); // Should be faster than sequential
      expect(results.reduce((total, r) => total + r.syncedNotes.length, 0)).toBe(500);
    });

    test('should handle memory-efficient streaming sync', async () => {
      const largeNoteSet = Array.from({ length: 10000 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        content: `Content for note ${i}`.repeat(50), // ~1KB per note
        syncStatus: 'pending' as const
      }));

      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      const result = await offlineService.syncWithStreaming(largeNoteSet);
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.success).toBe(true);
      expect(result.syncedNotes).toHaveLength(10000);
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(result.streamingBatches).toBeGreaterThan(0);
    });

    test('should implement sync rate limiting', async () => {
      const notes = Array.from({ length: 100 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        syncStatus: 'pending' as const
      }));

      const rateLimitConfig = { requestsPerSecond: 10, burstSize: 20 };

      const startTime = performance.now();
      const result = await offlineService.syncWithRateLimit(notes, rateLimitConfig);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(result.syncedNotes).toHaveLength(100);
      expect(endTime - startTime).toBeGreaterThan(9000); // At least 9 seconds (100 notes / 10 per second)
      expect(result.rateLimitDelays).toBeDefined();
    });

    test('should handle sync priority queuing', async () => {
      const highPriorityNotes = Array.from({ length: 10 }, (_, i) => ({
        ...mockNote,
        id: `high-${i}`,
        priority: 'high' as const,
        syncStatus: 'pending' as const
      }));

      const lowPriorityNotes = Array.from({ length: 50 }, (_, i) => ({
        ...mockNote,
        id: `low-${i}`,
        priority: 'low' as const,
        syncStatus: 'pending' as const
      }));

      const result = await offlineService.syncWithPriority([...lowPriorityNotes, ...highPriorityNotes]);

      expect(result.success).toBe(true);
      expect(result.syncedNotes).toHaveLength(60);
      
      // High priority notes should be synced first
      const highPrioritySynced = result.syncedNotes.filter(n => n.id.startsWith('high-'));
      const lowPrioritySynced = result.syncedNotes.filter(n => n.id.startsWith('low-'));
      
      expect(highPrioritySynced.length).toBe(10);
      expect(lowPrioritySynced.length).toBe(50);
    });
  });

  describe('Memory Pressure During Sync', () => {
    test('should handle memory pressure during large syncs', async () => {
      const largeNoteSet = Array.from({ length: 5000 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        content: `Large content for note ${i}`.repeat(100), // ~2KB per note
        attachments: Array.from({ length: 5 }, (_, j) => ({
          path: `attachment-${i}-${j}.txt`,
          size: 1024 * 1024 // 1MB per attachment
        })),
        syncStatus: 'pending' as const
      }));

      const memoryMonitor = await offlineService.syncWithMemoryMonitoring(largeNoteSet);

      expect(memoryMonitor.success).toBe(true);
      expect(memoryMonitor.syncedNotes).toHaveLength(5000);
      expect(memoryMonitor.memoryUsage).toBeDefined();
      expect(memoryMonitor.garbageCollections).toBeGreaterThan(0);
      expect(memoryMonitor.memoryPressureEvents).toBeDefined();
    });

    test('should implement memory-efficient conflict resolution', async () => {
      const conflictSet = Array.from({ length: 1000 }, (_, i) => ({
        baseNote: { ...mockNote, id: `note-${i}`, version: 1 },
        localNote: { ...mockNote, id: `note-${i}`, version: 2, content: `Local ${i}` },
        remoteNote: { ...mockNote, id: `note-${i}`, version: 2, content: `Remote ${i}` }
      }));

      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      const result = await offlineService.resolveConflictsWithMemoryOptimization(conflictSet);
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.resolvedConflicts).toHaveLength(1000);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      expect(result.memoryOptimizations).toBeDefined();
    });

    test('should handle memory leaks in offline queue', async () => {
      // Add many items to offline queue
      for (let i = 0; i < 10000; i++) {
        await offlineService.addToOfflineQueue({
          ...mockNote,
          id: `queue-note-${i}`,
          title: `Queue Note ${i}`
        });
      }

      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      // Process queue
      await offlineService.processOfflineQueue();
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });

    test('should implement memory-aware batch processing', async () => {
      const largeNoteSet = Array.from({ length: 20000 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        title: `Note ${i}`,
        content: `Content ${i}`.repeat(20),
        syncStatus: 'pending' as const
      }));

      const memoryConfig = {
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        batchSize: 100,
        pauseBetweenBatches: 100
      };

      const result = await offlineService.syncWithMemoryAwareBatching(largeNoteSet, memoryConfig);

      expect(result.success).toBe(true);
      expect(result.syncedNotes).toHaveLength(20000);
      expect(result.memoryUsage).toBeLessThan(memoryConfig.maxMemoryUsage);
      expect(result.batchCount).toBeGreaterThan(0);
      expect(result.pauseEvents).toBeDefined();
    });

    test('should handle memory pressure during conflict resolution', async () => {
      const complexConflicts = Array.from({ length: 500 }, (_, i) => ({
        baseNote: { ...mockNote, id: `note-${i}`, content: 'Base content'.repeat(100) },
        localNote: { ...mockNote, id: `note-${i}`, content: 'Local content'.repeat(100) },
        remoteNote: { ...mockNote, id: `note-${i}`, content: 'Remote content'.repeat(100) }
      }));

      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      const result = await offlineService.resolveConflictsWithMemoryPressureHandling(complexConflicts);
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.resolvedConflicts).toHaveLength(500);
      expect(memoryIncrease).toBeLessThan(25 * 1024 * 1024); // Less than 25MB increase
      expect(result.memoryPressureHandled).toBe(true);
      expect(result.garbageCollectionEvents).toBeGreaterThan(0);
    });
  });

  describe('Advanced Sync Features', () => {
    test('should implement incremental sync', async () => {
      const notes = Array.from({ length: 100 }, (_, i) => ({
        ...mockNote,
        id: `note-${i}`,
        version: i + 1,
        updatedAt: new Date(Date.now() - i * 60000) // Staggered updates
      }));

      const lastSyncTime = new Date(Date.now() - 300000); // 5 minutes ago
      
      const result = await offlineService.performIncrementalSync(notes, lastSyncTime);

      expect(result.success).toBe(true);
      expect(result.syncedNotes.length).toBeLessThan(100); // Only recent changes
      expect(result.syncWindow).toBeDefined();
      expect(result.incrementalChanges).toBeDefined();
    });

    test('should handle sync state persistence', async () => {
      const syncState = {
        lastSyncTime: new Date(),
        pendingChanges: 50,
        failedChanges: 5,
        syncVersion: '1.2.3'
      };

      await offlineService.persistSyncState(syncState);
      const retrievedState = await offlineService.getSyncState();

      expect(retrievedState.lastSyncTime).toEqual(syncState.lastSyncTime);
      expect(retrievedState.pendingChanges).toBe(syncState.pendingChanges);
      expect(retrievedState.failedChanges).toBe(syncState.failedChanges);
      expect(retrievedState.syncVersion).toBe(syncState.syncVersion);
    });

    test('should implement sync conflict notification', async () => {
      const conflict: SyncConflict = {
        noteId: 'conflict-note',
        localVersion: { content: 'Local content', version: 2 },
        remoteVersion: { content: 'Remote content', version: 2 },
        conflictType: 'content_conflict'
      };

      const notification = await offlineService.createConflictNotification(conflict);

      expect(notification.type).toBe('sync_conflict');
      expect(notification.severity).toBe('medium');
      expect(notification.noteId).toBe('conflict-note');
      expect(notification.resolutionOptions).toBeDefined();
      expect(notification.autoResolve).toBeDefined();
    });
  });
}); 