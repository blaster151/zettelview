import { vi, describe, test, expect, beforeEach } from 'vitest';
import { noteChainingService, NoteChainingService } from '../../services/noteChainingService';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('../../store/noteStore');
vi.mock('../../services/notificationService');
vi.mock('../../services/loggingService');

describe('Edge Cases: Error Handling', () => {
  beforeEach(() => {
    noteChainingService.resetCounters();
  });

  describe('Service Layer Error Handling', () => {
    test('should handle logging service failure gracefully', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock logging service to throw error
      const { loggingService } = require('../../services/loggingService');
      loggingService.info.mockImplementation(() => {
        throw new Error('Logging service unavailable');
      });

      // Should not throw error, should continue execution
      expect(() => {
        noteChainingService.createChainedNote(note);
      }).not.toThrow();
    });

    test('should handle notification service failure gracefully', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock notification service to throw error
      const { notificationService } = require('../../services/notificationService');
      notificationService.success.mockImplementation(() => {
        throw new Error('Notification service unavailable');
      });

      // Should not throw error, should continue execution
      expect(() => {
        noteChainingService.createChainedNote(note);
      }).not.toThrow();
    });

    test('should handle invalid note object gracefully', () => {
      // Test with completely invalid note object
      const invalidNote = null as any;

      expect(() => {
        noteChainingService.createChainedNote(invalidNote);
      }).toThrow();
    });

    test('should handle note with missing required properties', () => {
      const incompleteNote = {
        id: 'test-note',
        // Missing title, body, etc.
      } as any;

      expect(() => {
        noteChainingService.createChainedNote(incompleteNote);
      }).toThrow();
    });

    test('should handle chain registry corruption', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Corrupt the chain registry
      const service = noteChainingService as any;
      service.chainRegistry = null;

      // Should handle gracefully and create new registry
      const result = noteChainingService.createChainedNote(note);
      expect(result.chainId).toBeDefined();
    });

    test('should handle ID counter corruption', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Corrupt the ID counter
      const service = noteChainingService as any;
      service.idCounter = null;

      // Should handle gracefully and create new counter
      const result = noteChainingService.createChainedNote(note);
      expect(result.id).toBeDefined();
    });
  });

  describe('useNoteChaining Error Handling', () => {
    test('should handle store getNote failure', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store to throw error
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn(),
        updateNote: vi.fn(),
        getNote: vi.fn().mockImplementation(() => {
          throw new Error('Store getNote failed');
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle store addNote failure', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store to throw error on addNote
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockRejectedValue(new Error('Store addNote failed')),
        updateNote: vi.fn(),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle store updateNote failure', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store to throw error on updateNote
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockResolvedValue(undefined),
        updateNote: vi.fn().mockRejectedValue(new Error('Store updateNote failed')),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle validation service failure', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockResolvedValue(undefined),
        updateNote: vi.fn().mockResolvedValue(undefined),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      // Mock validation service to throw error
      const mockNoteChainingService = noteChainingService as any;
      mockNoteChainingService.validateOptions.mockImplementation(() => {
        throw new Error('Validation service failed');
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle chaining service failure', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockResolvedValue(undefined),
        updateNote: vi.fn().mockResolvedValue(undefined),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      // Mock chaining service to throw error
      const mockNoteChainingService = noteChainingService as any;
      mockNoteChainingService.createChainedNote.mockImplementation(() => {
        throw new Error('Chaining service failed');
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle error in onNoteCreated callback', async () => {
      const onNoteCreated = vi.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const { result } = renderHook(() => useNoteChaining({
        onNoteCreated
      }));

      // Mock store
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockResolvedValue(undefined),
        updateNote: vi.fn().mockResolvedValue(undefined),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        // Should still return the note even if callback fails
        expect(chainedNote).toBeDefined();
      });
    });

    test('should handle error in onError callback', async () => {
      const onError = vi.fn().mockImplementation(() => {
        throw new Error('Error callback failed');
      });

      const { result } = renderHook(() => useNoteChaining({
        onError
      }));

      // Mock store to throw error
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockRejectedValue(new Error('Store error')),
        updateNote: vi.fn(),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
        // Should not throw even if onError callback fails
      });
    });
  });

  describe('Recovery Mechanisms', () => {
    test('should recover from temporary store failures', async () => {
      const { result } = renderHook(() => useNoteChaining());

      let callCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('Temporary failure'));
          }
          return Promise.resolve(undefined);
        }),
        updateNote: vi.fn().mockResolvedValue(undefined),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        // First call should fail
        const chainedNote1 = await result.current.createChainedNote('test-note');
        expect(chainedNote1).toBeNull();

        // Second call should succeed
        const chainedNote2 = await result.current.createChainedNote('test-note');
        expect(chainedNote2).toBeDefined();
      });
    });

    test('should handle partial success scenarios', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockResolvedValue(undefined),
        updateNote: vi.fn().mockRejectedValue(new Error('Update failed')),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        // Should return null because updateNote failed
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle service initialization failures', () => {
      // Test singleton pattern resilience
      const originalGetInstance = NoteChainingService.getInstance;
      
      // Simulate initialization failure
      jest.spyOn(NoteChainingService, 'getInstance').mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      expect(() => {
        NoteChainingService.getInstance();
      }).toThrow('Initialization failed');

      // Restore original
      jest.restoreAllMocks();
    });
  });

  describe('Error Propagation', () => {
    test('should propagate specific error types correctly', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const specificError = new TypeError('Type error');
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockRejectedValue(specificError),
        updateNote: vi.fn(),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      const onError = vi.fn();

      await act(async () => {
        await result.current.createChainedNote('test-note');
      });

      // Error should be propagated to onError callback
      expect(onError).toHaveBeenCalledWith(specificError);
    });

    test('should handle async error in error callback', async () => {
      const onError = vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error('Async error in callback');
      });

      const { result } = renderHook(() => useNoteChaining({
        onError
      }));

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: vi.fn().mockRejectedValue(new Error('Store error')),
        updateNote: vi.fn(),
        getNote: vi.fn().mockReturnValue({
          id: 'test-note',
          title: 'Test Note',
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
        // Should not throw even if onError callback throws async error
      });
    });
  });

  describe('Boundary Error Conditions', () => {
    test('should handle memory pressure scenarios', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate memory pressure by creating many chains
      for (let i = 0; i < 1000; i++) {
        const testNote = { ...note, id: `test-note-${i}` };
        expect(() => {
          noteChainingService.createChainedNote(testNote);
        }).not.toThrow();
      }

      // Should still be able to create new chains
      const result = noteChainingService.createChainedNote(note);
      expect(result.chainId).toBeDefined();
    });

    test('should handle extremely large note content', () => {
      const largeContent = 'A'.repeat(1000000); // 1MB of content
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: largeContent,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => {
        noteChainingService.createChainedNote(note);
      }).not.toThrow();
    });

    test('should handle circular reference scenarios', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a chain and then try to create circular references
      const chainedNote = noteChainingService.createChainedNote(note);
      
      // Try to create a chain from the chained note back to the original
      const circularNote = {
        ...chainedNote,
        id: chainedNote.id,
        parentId: note.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => {
        noteChainingService.createChainedNote(circularNote);
      }).not.toThrow();
    });
  });
}); 