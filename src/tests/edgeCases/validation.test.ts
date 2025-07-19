import { noteChainingService } from '../../services/noteChainingService';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('../../store/noteStore');
jest.mock('../../services/notificationService');
jest.mock('../../services/loggingService');

describe('Edge Cases: Validation', () => {
  beforeEach(() => {
    noteChainingService.resetCounters();
  });

  describe('NoteChainingService Validation Edge Cases', () => {
    test('should handle empty note ID', () => {
      const note = {
        id: '',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      expect(result.id).toBe('note001'); // Should fallback to 'note' prefix
    });

    test('should handle note with only numbers in ID', () => {
      const note = {
        id: '12345',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      expect(result.id).toBe('note001'); // Should fallback to 'note' prefix
    });

    test('should handle extremely long note titles', () => {
      const longTitle = 'A'.repeat(1000);
      const note = {
        id: 'test-note',
        title: longTitle,
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      expect(result.title).toContain(longTitle.substring(0, 100)); // Should truncate or handle gracefully
    });

    test('should handle note with special characters in ID', () => {
      const note = {
        id: 'test@note#123',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      expect(result.id).toBe('test001'); // Should extract valid prefix
    });

    test('should handle note with unicode characters in title', () => {
      const note = {
        id: 'test-note',
        title: '测试笔记 🚀 特殊字符',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      expect(result.title).toContain('测试笔记 🚀 特殊字符');
    });

    test('should handle empty tags array', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, { inheritTags: true });
      expect(result.tags).toEqual([]);
    });

    test('should handle tags with special characters', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: ['tag@123', 'tag#456', 'tag$789'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, { inheritTags: true });
      expect(result.tags).toEqual(['tag@123', 'tag#456', 'tag$789']);
    });

    test('should handle extremely long tag names', () => {
      const longTag = 'A'.repeat(500);
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [longTag],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, { inheritTags: true });
      expect(result.tags).toContain(longTag);
    });

    test('should handle duplicate tags gracefully', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: ['tag1', 'tag1', 'tag2', 'tag2'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, { inheritTags: true });
      expect(result.tags).toEqual(['tag1', 'tag1', 'tag2', 'tag2']); // Should preserve duplicates
    });

    test('should handle null/undefined note properties', () => {
      const note = {
        id: 'test-note',
        title: null as any,
        body: undefined as any,
        tags: null as any,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      expect(result.title).toBe('New Note from null');
      expect(result.body).toContain('Start writing your chained note here');
      expect(result.tags).toEqual([]);
    });
  });

  describe('useNoteChaining Validation Edge Cases', () => {
    test('should handle invalid parent note ID', async () => {
      const { result } = renderHook(() => useNoteChaining());

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('invalid-id');
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle malformed chaining options', async () => {
      const { result } = renderHook(() => useNoteChaining());

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note', {
          idFormat: 'invalid-format' as any,
          idPrefix: '123-invalid'
        });
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle empty string options', async () => {
      const { result } = renderHook(() => useNoteChaining());

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note', {
          idPrefix: '',
          titleFormat: ''
        });
        // Should handle gracefully without throwing
        expect(chainedNote).toBeDefined();
      });
    });

    test('should handle extremely large ID prefix', async () => {
      const largePrefix = 'A'.repeat(1000);
      const { result } = renderHook(() => useNoteChaining());

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note', {
          idPrefix: largePrefix
        });
        expect(chainedNote).toBeNull(); // Should fail validation
      });
    });

    test('should handle invalid hotkey format', async () => {
      const { result } = renderHook(() => useNoteChaining());

      await act(async () => {
        const chainedNote = await result.current.createChainedNoteWithHotkey('test-note', 'Invalid-Hotkey');
        // Should use default options for unknown hotkey
        expect(chainedNote).toBeDefined();
      });
    });
  });

  describe('ID Generation Validation Edge Cases', () => {
    test('should handle ID counter overflow', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Simulate counter overflow by setting a very large number
      const service = noteChainingService as any;
      service.idCounter.set('test', Number.MAX_SAFE_INTEGER);

      const result = noteChainingService.createChainedNote(note);
      expect(result.id).toBe('test' + (Number.MAX_SAFE_INTEGER + 1).toString().padStart(3, '0'));
    });

    test('should handle timestamp format with very fast creation', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result1 = noteChainingService.createChainedNote(note, { idFormat: 'timestamp' });
      const result2 = noteChainingService.createChainedNote(note, { idFormat: 'timestamp' });

      expect(result1.id).not.toBe(result2.id);
    });

    test('should handle alphanumeric format with large numbers', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Set counter to a large number
      const service = noteChainingService as any;
      service.idCounter.set('test', 1000000);

      const result = noteChainingService.createChainedNote(note, { idFormat: 'alphanumeric' });
      expect(result.id).toMatch(/^test[0-9A-Z]+$/);
    });
  });

  describe('Title Generation Validation Edge Cases', () => {
    test('should handle title format with missing variables', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, {
        titleFormat: '${parentTitle} - ${nonexistent} - ${sequence}'
      });

      expect(result.title).toBe('Test Note - ${nonexistent} - 1');
    });

    test('should handle title format with only variables', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, {
        titleFormat: '${sequence}'
      });

      expect(result.title).toBe('1');
    });

    test('should handle empty title format', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, {
        titleFormat: ''
      });

      expect(result.title).toBe('');
    });

    test('should handle title format with special regex characters', () => {
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, {
        titleFormat: '${parentTitle} - [Part ${sequence}] - (${date})'
      });

      expect(result.title).toMatch(/^Test Note - \[Part 1\] - \(\d{1,2}\/\d{1,2}\/\d{4}\)$/);
    });
  });
}); 