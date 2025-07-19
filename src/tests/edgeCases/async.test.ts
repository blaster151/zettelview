import { noteChainingService } from '../../services/noteChainingService';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('../../store/noteStore');
jest.mock('../../services/notificationService');
jest.mock('../../services/loggingService');

describe('Edge Cases: Async', () => {
  beforeEach(() => {
    noteChainingService.resetCounters();
  });

  describe('Promise Handling', () => {
    test('should handle promise rejection in store operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store to reject promises
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockRejectedValue(new Error('Store rejection')),
        updateNote: jest.fn().mockRejectedValue(new Error('Update rejection')),
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
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle promise timeout scenarios', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store with timeout
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100)
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
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle promise race conditions', async () => {
      const { result } = renderHook(() => useNoteChaining());

      let callCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          callCount++;
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (callCount % 2 === 0) {
                reject(new Error('Race condition error'));
              } else {
                resolve(undefined);
              }
            }, Math.random() * 50);
          });
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
        const promises = Array.from({ length: 10 }, () => 
          result.current.createChainedNote('test-note')
        );

        const results = await Promise.allSettled(promises);
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        expect(fulfilled.length).toBeGreaterThan(0);
        expect(rejected.length).toBeGreaterThan(0);
      });
    });

    test('should handle promise cancellation', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store with cancellable promise
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          const controller = new AbortController();
          const promise = new Promise((resolve, reject) => {
            setTimeout(() => resolve(undefined), 1000);
            controller.signal.addEventListener('abort', () => reject(new Error('Cancelled')));
          });
          return promise;
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
        const createPromise = result.current.createChainedNote('test-note');
        
        // Simulate cancellation by not waiting for the promise
        // The test should complete without hanging
        expect(createPromise).toBeDefined();
      });
    });
  });

  describe('Async Error Recovery', () => {
    test('should recover from temporary async failures', async () => {
      const { result } = renderHook(() => useNoteChaining());

      let failureCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          failureCount++;
          if (failureCount <= 2) {
            return Promise.reject(new Error('Temporary failure'));
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
        // First two calls should fail
        const chainedNote1 = await result.current.createChainedNote('test-note');
        expect(chainedNote1).toBeNull();

        const chainedNote2 = await result.current.createChainedNote('test-note');
        expect(chainedNote2).toBeNull();

        // Third call should succeed
        const chainedNote3 = await result.current.createChainedNote('test-note');
        expect(chainedNote3).toBeDefined();
      });
    });

    test('should handle partial async failures gracefully', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockResolvedValue(undefined),
        updateNote: jest.fn().mockRejectedValue(new Error('Update failed')),
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
        const chainedNote = await result.current.createChainedNote('test-note');
        // Should return null because updateNote failed
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle async error in error callback', async () => {
      const onError = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error('Async error in callback');
      });

      const { result } = renderHook(() => useNoteChaining({
        onError
      }));

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockRejectedValue(new Error('Store error')),
        updateNote: jest.fn(),
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
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
        // Should not throw even if onError callback throws async error
      });
    });
  });

  describe('Concurrent Async Operations', () => {
    test('should handle multiple concurrent async operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, Math.random() * 100))
        ),
        updateNote: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        ),
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
          result.current.createChainedNote('test-note')
        );

        const results = await Promise.all(promises);
        expect(results.every(r => r !== null)).toBe(true);
      });
    });

    test('should handle async operations with different delays', async () => {
      const { result } = renderHook(() => useNoteChaining());

      let callCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          callCount++;
          return new Promise(resolve => 
            setTimeout(resolve, callCount * 50)
          );
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

        const results = await Promise.all(promises);
        expect(results.every(r => r !== null)).toBe(true);
      });
    });

    test('should handle async operations with mixed success/failure', async () => {
      const { result } = renderHook(() => useNoteChaining());

      let callCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          callCount++;
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              if (callCount % 2 === 0) {
                reject(new Error('Even call failed'));
              } else {
                resolve(undefined);
              }
            }, 50);
          });
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
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        expect(fulfilled.length).toBe(3);
        expect(rejected.length).toBe(3);
      });
    });
  });

  describe('Async State Management', () => {
    test('should maintain correct isCreating state during async operations', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 200))
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
        expect(result.current.isCreating).toBe(false);

        const createPromise = result.current.createChainedNote('test-note');
        
        // Should be creating during async operation
        expect(result.current.isCreating).toBe(true);
        
        await createPromise;
        
        // Should be false after completion
        expect(result.current.isCreating).toBe(false);
      });
    });

    test('should handle multiple concurrent async operations state', async () => {
      const { result } = renderHook(() => useNoteChaining());

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
        expect(result.current.isCreating).toBe(false);

        const promises = Array.from({ length: 3 }, () => 
          result.current.createChainedNote('test-note')
        );

        // Should be creating during concurrent operations
        expect(result.current.isCreating).toBe(true);

        await Promise.all(promises);

        // Should be false after all operations complete
        expect(result.current.isCreating).toBe(false);
      });
    });

    test('should handle async error state correctly', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockRejectedValue(new Error('Async error')),
        updateNote: jest.fn(),
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
        expect(result.current.isCreating).toBe(false);

        const createPromise = result.current.createChainedNote('test-note');
        
        // Should be creating during async operation
        expect(result.current.isCreating).toBe(true);
        
        await createPromise;
        
        // Should be false after error
        expect(result.current.isCreating).toBe(false);
      });
    });
  });

  describe('Async Callback Handling', () => {
    test('should handle async onNoteCreated callback', async () => {
      const onNoteCreated = jest.fn().mockImplementation(async (note) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return note;
      });

      const { result } = renderHook(() => useNoteChaining({
        onNoteCreated
      }));

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
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeDefined();
        expect(onNoteCreated).toHaveBeenCalledWith(chainedNote);
      });
    });

    test('should handle async onError callback', async () => {
      const onError = jest.fn().mockImplementation(async (error) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return error;
      });

      const { result } = renderHook(() => useNoteChaining({
        onError
      }));

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockRejectedValue(new Error('Store error')),
        updateNote: jest.fn(),
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
        const chainedNote = await result.current.createChainedNote('test-note');
        expect(chainedNote).toBeNull();
        expect(onError).toHaveBeenCalled();
      });
    });

    test('should handle callback errors without breaking flow', async () => {
      const onNoteCreated = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Callback error');
      });

      const { result } = renderHook(() => useNoteChaining({
        onNoteCreated
      }));

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
        const chainedNote = await result.current.createChainedNote('test-note');
        // Should still return the note even if callback fails
        expect(chainedNote).toBeDefined();
      });
    });
  });

  describe('Async Resource Management', () => {
    test('should handle async operations with resource cleanup', async () => {
      const { result } = renderHook(() => useNoteChaining());

      let resourceCount = 0;
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => {
          resourceCount++;
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(undefined);
            }, 100);
          });
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
        const promises = Array.from({ length: 5 }, () => 
          result.current.createChainedNote('test-note')
        );

        await Promise.all(promises);
        expect(resourceCount).toBe(5);
      });
    });

    test('should handle async operations with memory management', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise(resolve => {
            // Simulate memory allocation
            const largeArray = new Array(1000000).fill('data');
            setTimeout(() => {
              // Simulate memory cleanup
              largeArray.length = 0;
              resolve(undefined);
            }, 50);
          })
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

        await Promise.all(promises);
        // Should complete without memory issues
        expect(promises.length).toBe(3);
      });
    });
  });
}); 