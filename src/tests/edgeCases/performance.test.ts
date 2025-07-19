import { noteChainingService } from '../../services/noteChainingService';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('../../store/noteStore');
jest.mock('../../services/notificationService');
jest.mock('../../services/loggingService');

describe('Edge Cases: Performance', () => {
  beforeEach(() => {
    noteChainingService.resetCounters();
  });

  describe('Large Dataset Performance', () => {
    test('should handle creating 1000 chained notes efficiently', () => {
      const note = {
        id: 'performance-test',
        title: 'Performance Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        noteChainingService.createChainedNote(note);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      
      // Verify all notes were created with unique IDs
      const chainId = noteChainingService.getChainForNote('performance001');
      const chainNotes = noteChainingService.getChainNotes(chainId!);
      expect(chainNotes.length).toBe(1000);
    });

    test('should handle large number of different chains efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        const note = {
          id: `chain-${i}`,
          title: `Chain ${i} Note`,
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Create 10 chained notes for each parent
        for (let j = 0; j < 10; j++) {
          noteChainingService.createChainedNote(note);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(2000);
      
      // Verify all chains were created
      const allChains = noteChainingService.getAllChains();
      expect(allChains.size).toBe(100);
    });

    test('should handle memory usage with large note content', () => {
      const largeContent = 'A'.repeat(100000); // 100KB content
      const note = {
        id: 'large-content-test',
        title: 'Large Content Test',
        body: largeContent,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const startTime = performance.now();
      
      // Create 100 notes with large content
      for (let i = 0; i < 100; i++) {
        noteChainingService.createChainedNote(note);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time despite large content
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Management', () => {
    test('should not leak memory with repeated operations', () => {
      const note = {
        id: 'memory-test',
        title: 'Memory Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        noteChainingService.createChainedNote(note);
        noteChainingService.getChainNotes('chain_123');
        noteChainingService.getChainForNote('test001');
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      if (initialMemory > 0 && finalMemory > 0) {
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('should handle garbage collection scenarios', () => {
      const note = {
        id: 'gc-test',
        title: 'GC Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create many objects that could be garbage collected
      for (let i = 0; i < 1000; i++) {
        const chainedNote = noteChainingService.createChainedNote(note);
        
        // Access chain information to create references
        noteChainingService.getChainNotes(chainedNote.chainId!);
        noteChainingService.getChainForNote(chainedNote.id);
      }
      
      // Reset counters to clear references
      noteChainingService.resetCounters();
      
      // Should still be able to create new notes
      const newNote = noteChainingService.createChainedNote(note);
      expect(newNote.chainId).toBeDefined();
    });
  });

  describe('useNoteChaining Performance', () => {
    test('should handle rapid successive calls efficiently', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store for fast operations
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

      const startTime = performance.now();
      
      await act(async () => {
        const promises = Array.from({ length: 100 }, () => 
          result.current.createChainedNote('test-note')
        );
        await Promise.all(promises);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete efficiently
      expect(duration).toBeLessThan(2000);
    });

    test('should handle concurrent operations without performance degradation', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store with slight delays to simulate real operations
      const { useNoteStore } = require('../../store/noteStore');
      useNoteStore.mockReturnValue({
        addNote: jest.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 10))
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

      const startTime = performance.now();
      
      await act(async () => {
        const promises = Array.from({ length: 50 }, () => 
          result.current.createChainedNote('test-note')
        );
        await Promise.all(promises);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time even with delays
      expect(duration).toBeLessThan(3000);
    });

    test('should maintain performance with large option objects', async () => {
      const { result } = renderHook(() => useNoteChaining());

      // Mock store
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

      const largeOptions = {
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        autoTitle: true,
        idFormat: 'numeric' as const,
        idPrefix: 'A'.repeat(1000), // Large prefix
        titleFormat: 'B'.repeat(1000) // Large format
      };

      const startTime = performance.now();
      
      await act(async () => {
        const promises = Array.from({ length: 10 }, () => 
          result.current.createChainedNote('test-note', largeOptions)
        );
        await Promise.all(promises);
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time despite large options
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Chain Registry Performance', () => {
    test('should handle large chain lookups efficiently', () => {
      const note = {
        id: 'lookup-test',
        title: 'Lookup Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a large chain
      const chainedNotes = [];
      for (let i = 0; i < 1000; i++) {
        chainedNotes.push(noteChainingService.createChainedNote(note));
      }

      const chainId = chainedNotes[0].chainId!;
      
      const startTime = performance.now();
      
      // Perform many lookups
      for (let i = 0; i < 1000; i++) {
        noteChainingService.getChainNotes(chainId);
        noteChainingService.getChainForNote(chainedNotes[i % chainedNotes.length].id);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete efficiently
      expect(duration).toBeLessThan(1000);
    });

    test('should handle chain registry cleanup efficiently', () => {
      // Create many chains
      for (let i = 0; i < 100; i++) {
        const note = {
          id: `cleanup-test-${i}`,
          title: `Cleanup Test ${i}`,
          body: 'Content',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        for (let j = 0; j < 10; j++) {
          noteChainingService.createChainedNote(note);
        }
      }

      const startTime = performance.now();
      
      // Reset counters (cleanup operation)
      noteChainingService.resetCounters();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly
      expect(duration).toBeLessThan(100);
      
      // Verify cleanup was successful
      const allChains = noteChainingService.getAllChains();
      expect(allChains.size).toBe(0);
    });
  });

  describe('ID Generation Performance', () => {
    test('should handle large ID counter values efficiently', () => {
      const note = {
        id: 'counter-test',
        title: 'Counter Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Set a large counter value
      const service = noteChainingService as any;
      service.idCounter.set('counter', 1000000);

      const startTime = performance.now();
      
      // Generate many IDs
      for (let i = 0; i < 1000; i++) {
        noteChainingService.generateSequentialId(note);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete efficiently even with large counter
      expect(duration).toBeLessThan(1000);
    });

    test('should handle different ID formats efficiently', () => {
      const note = {
        id: 'format-test',
        title: 'Format Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const formats = ['numeric', 'alphanumeric', 'timestamp'] as const;
      
      const startTime = performance.now();
      
      // Generate IDs with different formats
      for (let i = 0; i < 1000; i++) {
        const format = formats[i % formats.length];
        noteChainingService.generateSequentialId(note, { idFormat: format });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete efficiently
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Title Generation Performance', () => {
    test('should handle complex title formats efficiently', () => {
      const note = {
        id: 'title-test',
        title: 'Title Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const complexFormat = '${parentTitle} - Part ${sequence} - ${date} - ${time} - [${sequence}] - (${date})';
      
      const startTime = performance.now();
      
      // Generate many titles with complex format
      for (let i = 0; i < 1000; i++) {
        noteChainingService.generateAutoTitle(note, { titleFormat: complexFormat });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete efficiently
      expect(duration).toBeLessThan(1000);
    });

    test('should handle title generation with large parent titles', () => {
      const largeTitle = 'A'.repeat(10000); // 10KB title
      const note = {
        id: 'large-title-test',
        title: largeTitle,
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const startTime = performance.now();
      
      // Generate titles with large parent title
      for (let i = 0; i < 100; i++) {
        noteChainingService.generateAutoTitle(note);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time
      expect(duration).toBeLessThan(2000);
    });
  });
}); 