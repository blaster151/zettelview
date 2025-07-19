import { noteChainingService } from '../../services/noteChainingService';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
jest.mock('../../store/noteStore');
jest.mock('../../services/notificationService');
jest.mock('../../services/loggingService');

describe('Edge Cases: Security', () => {
  beforeEach(() => {
    noteChainingService.resetCounters();
  });

  describe('Input Sanitization', () => {
    test('should handle SQL injection attempts in note titles', () => {
      const maliciousTitle = "'; DROP TABLE notes; --";
      const note = {
        id: 'sql-injection-test',
        title: maliciousTitle,
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      
      // Should handle malicious input gracefully
      expect(result.title).toContain(maliciousTitle);
      expect(result.id).toBe('sql001');
    });

    test('should handle XSS attempts in note content', () => {
      const maliciousContent = '<script>alert("XSS")</script><img src="x" onerror="alert(1)">';
      const note = {
        id: 'xss-test',
        title: 'XSS Test',
        body: maliciousContent,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      
      // Should preserve content but not execute scripts
      expect(result.body).toContain(maliciousContent);
      expect(result.id).toBe('xss001');
    });

    test('should handle HTML injection in ID prefix', () => {
      const maliciousPrefix = '<script>alert("injection")</script>';
      const note = {
        id: 'html-injection-test',
        title: 'HTML Injection Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note, {
        idPrefix: maliciousPrefix
      });
      
      // Should handle malicious prefix gracefully
      expect(result.id).toContain(maliciousPrefix);
    });

    test('should handle command injection attempts', () => {
      const maliciousInput = '$(rm -rf /) || echo "command injection"';
      const note = {
        id: 'command-injection-test',
        title: maliciousInput,
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      
      // Should handle malicious input as plain text
      expect(result.title).toContain(maliciousInput);
    });

    test('should handle path traversal attempts', () => {
      const maliciousPath = '../../../etc/passwd';
      const note = {
        id: maliciousPath,
        title: 'Path Traversal Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      
      // Should extract safe prefix from malicious path
      expect(result.id).toMatch(/^[a-zA-Z]+\d+$/);
    });
  });

  describe('Data Validation', () => {
    test('should validate ID prefix format strictly', () => {
      const invalidPrefixes = [
        '123-invalid', // Starts with number
        '-invalid', // Starts with hyphen
        '_invalid', // Starts with underscore
        'invalid@prefix', // Contains special characters
        'invalid prefix', // Contains spaces
        'invalid/prefix', // Contains slashes
        'invalid\\prefix', // Contains backslashes
        'invalid*prefix', // Contains wildcards
        'invalid?prefix', // Contains question marks
        'invalid|prefix' // Contains pipes
      ];

      invalidPrefixes.forEach(prefix => {
        const validation = noteChainingService.validateOptions({ idPrefix: prefix });
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Invalid ID prefix');
      });
    });

    test('should validate ID format strictly', () => {
      const invalidFormats = [
        'invalid',
        'random',
        'custom',
        'hex',
        'binary',
        'base64'
      ];

      invalidFormats.forEach(format => {
        const validation = noteChainingService.validateOptions({ 
          idFormat: format as any 
        });
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Invalid ID format');
      });
    });

    test('should handle extremely long malicious inputs', () => {
      const extremelyLongInput = 'A'.repeat(1000000); // 1MB of data
      const note = {
        id: 'long-input-test',
        title: extremelyLongInput,
        body: extremelyLongInput,
        tags: [extremelyLongInput],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Should not crash or consume excessive memory
      expect(() => {
        noteChainingService.createChainedNote(note);
      }).not.toThrow();
    });

    test('should handle null byte injection attempts', () => {
      const nullByteInput = 'normal\0malicious';
      const note = {
        id: 'null-byte-test',
        title: nullByteInput,
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      
      // Should handle null bytes gracefully
      expect(result.title).toContain(nullByteInput);
    });

    test('should handle unicode normalization attacks', () => {
      const unicodeAttack = 'café\u0301'; // Combining character attack
      const note = {
        id: 'unicode-test',
        title: unicodeAttack,
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = noteChainingService.createChainedNote(note);
      
      // Should handle unicode attacks gracefully
      expect(result.title).toContain(unicodeAttack);
    });
  });

  describe('useNoteChaining Security', () => {
    test('should handle malicious note IDs', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const maliciousIds = [
        '"><script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'http://malicious-site.com/steal-data'
      ];

      for (const maliciousId of maliciousIds) {
        await act(async () => {
          const chainedNote = await result.current.createChainedNote(maliciousId);
          // Should handle malicious IDs gracefully
          expect(chainedNote).toBeNull();
        });
      }
    });

    test('should handle malicious chaining options', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const maliciousOptions = {
        idPrefix: '<script>alert(1)</script>',
        titleFormat: '${parentTitle}<script>alert(1)</script>',
        idFormat: 'invalid' as any
      };

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note', maliciousOptions);
        // Should reject malicious options
        expect(chainedNote).toBeNull();
      });
    });

    test('should handle prototype pollution attempts', async () => {
      const { result } = renderHook(() => useNoteChaining());

      const maliciousOptions = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } }
      } as any;

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note', maliciousOptions);
        // Should handle prototype pollution attempts gracefully
        expect(chainedNote).toBeDefined();
      });
    });

    test('should handle callback injection attacks', async () => {
      const maliciousCallback = jest.fn().mockImplementation(() => {
        throw new Error('Malicious callback executed');
      });

      const { result } = renderHook(() => useNoteChaining({
        onNoteCreated: maliciousCallback
      }));

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

      await act(async () => {
        const chainedNote = await result.current.createChainedNote('test-note');
        // Should handle malicious callbacks gracefully
        expect(chainedNote).toBeDefined();
      });
    });
  });

  describe('Chain Registry Security', () => {
    test('should handle malicious chain IDs', () => {
      const maliciousChainIds = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'http://malicious-site.com'
      ];

      maliciousChainIds.forEach(chainId => {
        const chainNotes = noteChainingService.getChainNotes(chainId);
        // Should return empty array for malicious chain IDs
        expect(chainNotes).toEqual([]);
      });
    });

    test('should handle malicious note IDs in chain lookups', () => {
      const maliciousNoteIds = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'http://malicious-site.com'
      ];

      maliciousNoteIds.forEach(noteId => {
        const chainId = noteChainingService.getChainForNote(noteId);
        // Should return null for malicious note IDs
        expect(chainId).toBeNull();
      });
    });

    test('should handle chain registry corruption attempts', () => {
      const note = {
        id: 'corruption-test',
        title: 'Corruption Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create a legitimate chain
      const chainedNote = noteChainingService.createChainedNote(note);
      const chainId = chainedNote.chainId!;

      // Attempt to corrupt the registry
      const service = noteChainingService as any;
      const originalRegistry = service.chainRegistry;
      
      // Try to inject malicious data
      service.chainRegistry.set('<script>alert(1)</script>', ['malicious']);
      service.chainRegistry.set('javascript:alert(1)', ['malicious']);

      // Should still work with legitimate data
      const chainNotes = noteChainingService.getChainNotes(chainId);
      expect(chainNotes).toContain(chainedNote.id);

      // Should handle malicious chain IDs gracefully
      const maliciousChainNotes = noteChainingService.getChainNotes('<script>alert(1)</script>');
      expect(maliciousChainNotes).toEqual(['malicious']);

      // Restore original registry
      service.chainRegistry = originalRegistry;
    });
  });

  describe('ID Generation Security', () => {
    test('should handle malicious ID prefixes', () => {
      const note = {
        id: 'malicious-prefix-test',
        title: 'Malicious Prefix Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const maliciousPrefixes = [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'http://malicious-site.com'
      ];

      maliciousPrefixes.forEach(prefix => {
        const result = noteChainingService.createChainedNote(note, { idPrefix: prefix });
        // Should handle malicious prefixes gracefully
        expect(result.id).toContain(prefix);
      });
    });

    test('should handle ID format injection attempts', () => {
      const note = {
        id: 'format-injection-test',
        title: 'Format Injection Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Should reject invalid formats
      expect(() => {
        noteChainingService.createChainedNote(note, { 
          idFormat: 'malicious' as any 
        });
      }).not.toThrow();
    });

    test('should handle timestamp manipulation attempts', () => {
      const note = {
        id: 'timestamp-manipulation-test',
        title: 'Timestamp Manipulation Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock Date.now to simulate timestamp manipulation
      const originalNow = Date.now;
      Date.now = jest.fn(() => 0);

      const result = noteChainingService.createChainedNote(note, { idFormat: 'timestamp' });
      
      // Should handle timestamp manipulation gracefully
      expect(result.id).toMatch(/^malicious0$/);

      // Restore original Date.now
      Date.now = originalNow;
    });
  });

  describe('Title Generation Security', () => {
    test('should handle malicious title formats', () => {
      const note = {
        id: 'malicious-format-test',
        title: 'Malicious Format Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const maliciousFormats = [
        '${parentTitle}<script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'http://malicious-site.com'
      ];

      maliciousFormats.forEach(format => {
        const result = noteChainingService.createChainedNote(note, { titleFormat: format });
        // Should handle malicious formats gracefully
        expect(result.title).toContain(format);
      });
    });

    test('should handle template injection attempts', () => {
      const note = {
        id: 'template-injection-test',
        title: 'Template Injection Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const templateInjection = '${parentTitle}${7*7}${parentTitle}';
      const result = noteChainingService.createChainedNote(note, { 
        titleFormat: templateInjection 
      });

      // Should handle template injection gracefully
      expect(result.title).toContain(templateInjection);
    });
  });

  describe('Data Integrity', () => {
    test('should prevent data corruption through malicious inputs', () => {
      const note = {
        id: 'integrity-test',
        title: 'Integrity Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create legitimate chain
      const chainedNote = noteChainingService.createChainedNote(note);
      const chainId = chainedNote.chainId!;

      // Attempt to corrupt with malicious inputs
      const maliciousInputs = [
        null,
        undefined,
        NaN,
        Infinity,
        -Infinity,
        {},
        [],
        () => {},
        Symbol('malicious')
      ];

      maliciousInputs.forEach(maliciousInput => {
        // Should not corrupt existing data
        const chainNotes = noteChainingService.getChainNotes(chainId);
        expect(chainNotes).toContain(chainedNote.id);
      });
    });

    test('should maintain data consistency under attack', () => {
      const note = {
        id: 'consistency-test',
        title: 'Consistency Test',
        body: 'Content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create multiple legitimate chains
      const chainedNotes = [];
      for (let i = 0; i < 10; i++) {
        chainedNotes.push(noteChainingService.createChainedNote(note));
      }

      // Attempt various attacks
      const attacks = [
        () => noteChainingService.getChainNotes('<script>alert(1)</script>'),
        () => noteChainingService.getChainForNote('javascript:alert(1)'),
        () => noteChainingService.createChainedNote(note, { idPrefix: '<script>' }),
        () => noteChainingService.createChainedNote(note, { titleFormat: '<script>' })
      ];

      attacks.forEach(attack => {
        expect(() => attack()).not.toThrow();
      });

      // Verify legitimate data is still intact
      const chainId = chainedNotes[0].chainId!;
      const chainNotes = noteChainingService.getChainNotes(chainId);
      expect(chainNotes.length).toBe(10);
    });
  });
}); 