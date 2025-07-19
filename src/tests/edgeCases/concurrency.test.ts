import { noteChainingService } from '../../services/noteChainingService';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('../../store/noteStore');
jest.mock('../../services/notificationService');
jest.mock('../../services/loggingService');

describe('Edge Cases: Concurrency', () => {
  beforeEach(() => {
    noteChainingService.resetCounters();
  });

  describe('Simultaneous Note Creation', () => {
    test('should handle multiple simultaneous chained note creations', async () => {
      const note = {
        id: 'parent-note',
        title: 'Parent Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create multiple chained notes simultaneously
      const promises = Array.from({ length: 5 }, () => 
        noteChainingService.createChainedNote(note)
      );

      const results = await Promise.all(promises);

      // All should have unique IDs
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);

      // Should be sequential
      expect(ids).toEqual(['parent001', 'parent002', 'parent003', 'parent004', 'parent005']);
    });

    test('should handle concurrent operations from different prefixes', async () => {
      const note1 = {
        id: 'project-001',
        title: 'Project Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const note2 = {
        id: 'task-001',
        title: 'Task Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create chained notes from different parents simultaneously
      const promises = [
        noteChainingService.createChainedNote(note1),
        noteChainingService.createChainedNote(note2),
        noteChainingService.createChainedNote(note1),
        noteChainingService.createChainedNote(note2)
      ];

      const results = await Promise.all(promises);

      // Should maintain separate counters for each prefix
      const projectIds = results.filter(r => r.id.startsWith('project')).map(r => r.id);
      const taskIds = results.filter(r => r.id.startsWith('task')).map(r => r.id);

      expect(projectIds).toEqual(['project001', 'project002']);
      expect(taskIds).toEqual(['task001', 'task002']);
    });

    test('should handle race condition in ID generation', async () => {
      const note = {
        id: 'race-note',
        title: 'Race Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate race condition by accessing the counter directly
      const service = noteChainingService as any;
      
      const promises = Array.from({ length: 10 }, async (_, index) => {
        // Simulate slight delays to create race conditions
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return noteChainingService.createChainedNote(note);
      });

      const results = await Promise.all(promises);

      // All IDs should be unique despite race conditions
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('useNoteChaining Concurrency Edge Cases', () => {
    test('should handle multiple simultaneous createChainedNote calls', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock the store to simulate async operations
      const mockAddNote = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 50))
      );
      const mockUpdateNote = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 30))
      );

      // Override the mock
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: mockAddNote,
        updateNote: mockUpdateNote,
        getNote: jest.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const promises = Array.from({ length: 3 }, () => 
          result.current.createChainedNote('test-note')
        );

        const results = await Promise.all(promises);
        expect(results.every(r => r !== null)).toBe(true);
      });
    });

    test('should handle concurrent quickChain operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock the store
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockResolvedValue(undefined),
        updateNote: jest.fn().mockResolvedValue(undefined),
        getNote: jest.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const promises = Array.from({ length: 5 }, () => 
          result.current.quickChain('test-note')
        );

        const results = await Promise.all(promises);
        expect(results.every(r => r !== null)).toBe(true);
      });
    });

    test('should handle isCreating state during concurrent operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock slow operations
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 100))
        ),
        updateNote: jest.fn().mockResolvedValue(undefined),
        getNote: jest.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const createPromise = result.current.createChainedNote('test-note');
        
        // Check isCreating state during operation
        expect(result.current.isCreating).toBe(true);
        
        await createPromise;
        
        // Check isCreating state after completion
        expect(result.current.isCreating).toBe(false);
      });
    });

    test('should handle error during concurrent operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store to throw error on second call
      let callCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            return Promise.reject(new Error('Concurrent error'));
          }
          return Promise.resolve(undefined);
        }),
        updateNote: jest.fn().mockResolvedValue(undefined),
        getNote: jest.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const promises = Array.from({ length: 3 }, () => 
          result.current.createChainedNote('test-note')
        );

        const results = await Promise.allSettled(promises);
        
        // One should be rejected, others should succeed
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');
        
        expect(fulfilled.length).toBe(2);
        expect(rejected.length).toBe(1);
      });
    });
  });

  describe('Chain Registry Concurrency', () => {
    test('should handle concurrent chain registration', async () => {
      const note = {
        id: 'chain-note',
        title: 'Chain Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create multiple chained notes to test chain registry
      const promises = Array.from({ length: 5 }, () => 
        noteChainingService.createChainedNote(note)
      );

      const results = await Promise.all(promises);

      // All should be in the same chain
      const chainId = results[0].chainId;
      expect(chainId).toBeDefined();

      const chainNotes = noteChainingService.getChainNotes(chainId!);
      expect(chainNotes.length).toBe(5);

      // All note IDs should be in the chain
      const noteIds = results.map(r => r.id);
      noteIds.forEach(id => {
        expect(chainNotes).toContain(id);
      });
    });

    test('should handle concurrent operations on different chains', async () => {
      const note1 = {
        id: 'chain1-note',
        title: 'Chain 1 Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const note2 = {
        id: 'chain2-note',
        title: 'Chain 2 Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create chained notes from different parents simultaneously
      const promises = [
        ...Array.from({ length: 3 }, () => noteChainingService.createChainedNote(note1)),
        ...Array.from({ length: 3 }, () => noteChainingService.createChainedNote(note2))
      ];

      const results = await Promise.all(promises);

      // Should have two separate chains
      const chain1Notes = results.filter(r => r.parentId === note1.id);
      const chain2Notes = results.filter(r => r.parentId === note2.id);

      expect(chain1Notes.length).toBe(3);
      expect(chain2Notes.length).toBe(3);

      // Each chain should have unique chain IDs
      const chain1Id = chain1Notes[0].chainId;
      const chain2Id = chain2Notes[0].chainId;
      expect(chain1Id).not.toBe(chain2Id);
    });

    test('should handle chain registry cleanup during concurrent operations', async () => {
      const note = {
        id: 'cleanup-note',
        title: 'Cleanup Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create some chained notes
      const results = await Promise.all(
        Array.from({ length: 3 }, () => noteChainingService.createChainedNote(note))
      );

      const chainId = results[0].chainId!;

      // Reset counters during concurrent operations
      const resetPromise = Promise.resolve().then(() => {
        noteChainingService.resetCounters();
      });

      const createPromise = noteChainingService.createChainedNote(note);

      await Promise.all([resetPromise, createPromise]);

      // Chain should be recreated after reset
      const newChainNotes = noteChainingService.getChainNotes(chainId);
      expect(newChainNotes.length).toBe(0); // Original chain should be cleared
    });
  });

  describe('Async Error Handling in Concurrency', () => {
    test('should handle timeout during concurrent operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store with timeout
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 50)
          )
        ),
        updateNote: jest.fn().mockResolvedValue(undefined),
        getNote: jest.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const promises = Array.from({ length: 3 }, () => 
          result.current.createChainedNote('test-note')
        );

        const results = await Promise.allSettled(promises);
        
        // All should be rejected due to timeout
        results.forEach(result => {
          expect(result.status).toBe('rejected');
        });
      });
    });

    test('should handle partial failures in concurrent operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store with intermittent failures
      let callCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount % 2 === 0) {
            return Promise.reject(new Error('Intermittent failure'));
          }
          return Promise.resolve(undefined);
        }),
        updateNote: jest.fn().mockResolvedValue(undefined),
        getNote: jest.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const promises = Array.from({ length: 6 }, () => 
          result.current.createChainedNote('test-note')
        );

        const results = await Promise.allSettled(promises);
        
        // Half should succeed, half should fail
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');
        
        expect(fulfilled.length).toBe(3);
        expect(rejected.length).toBe(3);
      });
    });
  });
}); 