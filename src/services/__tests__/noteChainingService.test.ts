import { NoteChainingService, ChainingOptions, ChainedNote } from '../noteChainingService';
import { Note } from '../../types/domain';

// Mock the services
jest.mock('../loggingService', () => ({
  loggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../notificationService', () => ({
  notificationService: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

describe('NoteChainingService', () => {
  let service: NoteChainingService;
  let mockParentNote: Note;

  beforeEach(() => {
    service = NoteChainingService.getInstance();
    service.resetCounters(); // Reset for each test
    
    mockParentNote = {
      id: 'parent-note-001',
      title: 'Parent Note',
      body: 'This is the parent note content',
      tags: ['parent', 'test', 'example'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    };
  });

  afterEach(() => {
    service.resetCounters();
  });

  describe('getInstance', () => {
    test('should return the same instance', () => {
      const instance1 = NoteChainingService.getInstance();
      const instance2 = NoteChainingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateSequentialId', () => {
    test('should generate numeric IDs with default format', () => {
      const id1 = service.generateSequentialId(mockParentNote);
      const id2 = service.generateSequentialId(mockParentNote);
      
      expect(id1).toBe('parent001');
      expect(id2).toBe('parent002');
    });

    test('should generate IDs with custom prefix', () => {
      const options: ChainingOptions = { idPrefix: 'custom' };
      const id = service.generateSequentialId(mockParentNote, options);
      
      expect(id).toBe('custom001');
    });

    test('should generate alphanumeric IDs', () => {
      const options: ChainingOptions = { idFormat: 'alphanumeric' };
      const id = service.generateSequentialId(mockParentNote, options);
      
      expect(id).toMatch(/^parent[0-9A-Z]+$/);
    });

    test('should generate timestamp IDs', () => {
      const options: ChainingOptions = { idFormat: 'timestamp' };
      const id = service.generateSequentialId(mockParentNote, options);
      
      expect(id).toMatch(/^parent\d+$/);
      expect(parseInt(id.replace('parent', ''))).toBeGreaterThan(Date.now() - 1000);
    });

    test('should extract prefix from various ID patterns', () => {
      const note1 = { ...mockParentNote, id: 'project-123' };
      const note2 = { ...mockParentNote, id: 'task_456' };
      const note3 = { ...mockParentNote, id: 'note789' };
      
      expect(service.generateSequentialId(note1)).toBe('project001');
      expect(service.generateSequentialId(note2)).toBe('task001');
      expect(service.generateSequentialId(note3)).toBe('note001');
    });
  });

  describe('generateAutoTitle', () => {
    test('should generate title with default format', () => {
      const title = service.generateAutoTitle(mockParentNote);
      
      expect(title).toBe('Parent Note - Part 1');
    });

    test('should generate title with custom format', () => {
      const options: ChainingOptions = { 
        titleFormat: '${parentTitle} - Chapter ${sequence} - ${date}'
      };
      const title = service.generateAutoTitle(mockParentNote, options);
      
      expect(title).toMatch(/^Parent Note - Chapter 1 - \d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    test('should handle multiple chained notes in sequence', () => {
      // Create first chained note to establish chain
      service.createChainedNote(mockParentNote);
      
      // Generate title for second note
      const title = service.generateAutoTitle(mockParentNote);
      
      expect(title).toBe('Parent Note - Part 2');
    });
  });

  describe('createChainedNote', () => {
    test('should create chained note with default options', () => {
      const chainedNote = service.createChainedNote(mockParentNote);
      
      expect(chainedNote.id).toBe('parent001');
      expect(chainedNote.title).toBe('Parent Note - Part 1');
      expect(chainedNote.tags).toEqual(['parent', 'test', 'example']);
      expect(chainedNote.parentId).toBe('parent-note-001');
      expect(chainedNote.chainId).toBeDefined();
      expect(chainedNote.body).toContain('[[Parent Note]]');
    });

    test('should create chained note without inheriting tags', () => {
      const options: ChainingOptions = { inheritTags: false };
      const chainedNote = service.createChainedNote(mockParentNote, options);
      
      expect(chainedNote.tags).toEqual([]);
    });

    test('should create chained note without backlink', () => {
      const options: ChainingOptions = { addBacklink: false };
      const chainedNote = service.createChainedNote(mockParentNote, options);
      
      expect(chainedNote.body).not.toContain('**Parent Note**:');
    });

    test('should create chained note without sequential ID', () => {
      const options: ChainingOptions = { sequentialId: false };
      const chainedNote = service.createChainedNote(mockParentNote, options);
      
      expect(chainedNote.id).toMatch(/^parent-note-001-\d+$/);
    });

    test('should create chained note with custom title', () => {
      const options: ChainingOptions = { autoTitle: false };
      const chainedNote = service.createChainedNote(mockParentNote, options);
      
      expect(chainedNote.title).toBe('New Note from Parent Note');
    });

    test('should register note in chain', () => {
      const chainedNote = service.createChainedNote(mockParentNote);
      const chainId = chainedNote.chainId!;
      
      const chainNotes = service.getChainNotes(chainId);
      expect(chainNotes).toContain(chainedNote.id);
    });
  });

  describe('getChainNotes', () => {
    test('should return empty array for non-existent chain', () => {
      const notes = service.getChainNotes('non-existent');
      expect(notes).toEqual([]);
    });

    test('should return all notes in chain', () => {
      const note1 = service.createChainedNote(mockParentNote);
      const note2 = service.createChainedNote(mockParentNote);
      
      const chainNotes = service.getChainNotes(note1.chainId!);
      expect(chainNotes).toContain(note1.id);
      expect(chainNotes).toContain(note2.id);
    });
  });

  describe('getChainForNote', () => {
    test('should return null for note not in any chain', () => {
      const chainId = service.getChainForNote('non-existent');
      expect(chainId).toBeNull();
    });

    test('should return chain ID for note in chain', () => {
      const chainedNote = service.createChainedNote(mockParentNote);
      const chainId = service.getChainForNote(chainedNote.id);
      
      expect(chainId).toBe(chainedNote.chainId);
    });
  });

  describe('getAllChains', () => {
    test('should return empty map when no chains exist', () => {
      const chains = service.getAllChains();
      expect(chains.size).toBe(0);
    });

    test('should return all chains', () => {
      const note1 = service.createChainedNote(mockParentNote);
      const note2 = service.createChainedNote(mockParentNote);
      
      const chains = service.getAllChains();
      expect(chains.size).toBe(1);
      
      const chainNotes = chains.get(note1.chainId!);
      expect(chainNotes).toContain(note1.id);
      expect(chainNotes).toContain(note2.id);
    });
  });

  describe('updateParentWithChildLink', () => {
    test('should add child link to parent note', () => {
      const chainedNote: ChainedNote = {
        id: 'child-001',
        title: 'Child Note',
        body: 'Child content',
        tags: [],
        parentId: mockParentNote.id
      };
      
      const updatedBody = service.updateParentWithChildLink(mockParentNote, chainedNote);
      
      expect(updatedBody).toContain('## Related Notes');
      expect(updatedBody).toContain('[[Child Note]]');
    });

    test('should not add duplicate links', () => {
      const chainedNote: ChainedNote = {
        id: 'child-001',
        title: 'Child Note',
        body: 'Child content',
        tags: [],
        parentId: mockParentNote.id
      };
      
      const parentWithLink = {
        ...mockParentNote,
        body: mockParentNote.body + '\n\n## Related Notes\n\n- [[Child Note]]\n'
      };
      
      const updatedBody = service.updateParentWithChildLink(parentWithLink, chainedNote);
      
      // Should not add another link
      const linkCount = (updatedBody.match(/\[\[Child Note\]\]/g) || []).length;
      expect(linkCount).toBe(1);
    });
  });

  describe('validateOptions', () => {
    test('should validate correct options', () => {
      const options: ChainingOptions = {
        idFormat: 'numeric',
        idPrefix: 'valid-prefix'
      };
      
      const result = service.validateOptions(options);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject invalid ID format', () => {
      const options: ChainingOptions = {
        idFormat: 'invalid' as any
      };
      
      const result = service.validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid ID format. Must be numeric, alphanumeric, or timestamp');
    });

    test('should reject invalid ID prefix', () => {
      const options: ChainingOptions = {
        idPrefix: '123-invalid'
      };
      
      const result = service.validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid ID prefix. Must start with letter and contain only alphanumeric, underscore, or hyphen');
    });

    test('should reject multiple invalid options', () => {
      const options: ChainingOptions = {
        idFormat: 'invalid' as any,
        idPrefix: '123-invalid'
      };
      
      const result = service.validateOptions(options);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('resetCounters', () => {
    test('should reset all counters and chains', () => {
      // Create some chained notes
      service.createChainedNote(mockParentNote);
      service.createChainedNote(mockParentNote);
      
      // Reset
      service.resetCounters();
      
      // Verify reset
      const chains = service.getAllChains();
      expect(chains.size).toBe(0);
      
      // Next ID should start from 1 again
      const newId = service.generateSequentialId(mockParentNote);
      expect(newId).toBe('parent001');
    });
  });
}); 