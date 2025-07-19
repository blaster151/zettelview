import { Note } from '../types/domain';
import { loggingService } from './loggingService';
import { notificationService } from './notificationService';

export interface ChainingOptions {
  inheritTags?: boolean;
  addBacklink?: boolean;
  sequentialId?: boolean;
  idPrefix?: string;
  idFormat?: 'numeric' | 'alphanumeric' | 'timestamp';
  autoTitle?: boolean;
  titleFormat?: string;
}

export interface ChainedNote {
  id: string;
  title: string;
  body: string;
  tags: string[];
  parentId?: string;
  chainId?: string;
}

export class NoteChainingService {
  private static instance: NoteChainingService;
  private idCounter: Map<string, number> = new Map();
  private chainRegistry: Map<string, string[]> = new Map(); // chainId -> noteIds[]

  static getInstance(): NoteChainingService {
    if (!NoteChainingService.instance) {
      NoteChainingService.instance = new NoteChainingService();
    }
    return NoteChainingService.instance;
  }

  /**
   * Generate a sequential ID based on the parent note and chain
   */
  generateSequentialId(parentNote: Note, options: ChainingOptions = {}): string {
    const prefix = options.idPrefix || this.extractIdPrefix(parentNote.id);
    const format = options.idFormat || 'numeric';
    
    // Get current counter for this prefix
    const currentCount = this.idCounter.get(prefix) || 0;
    const nextCount = currentCount + 1;
    this.idCounter.set(prefix, nextCount);

    switch (format) {
      case 'numeric':
        return `${prefix}${nextCount.toString().padStart(3, '0')}`;
      case 'alphanumeric':
        return `${prefix}${nextCount.toString(36).toUpperCase()}`;
      case 'timestamp':
        return `${prefix}${Date.now()}`;
      default:
        return `${prefix}${nextCount.toString().padStart(3, '0')}`;
    }
  }

  /**
   * Extract ID prefix from parent note ID
   */
  private extractIdPrefix(parentId: string): string {
    // Extract prefix from patterns like "note-001", "project-1", etc.
    const match = parentId.match(/^([a-zA-Z]+)[-_]?\d*$/);
    return match ? match[1] : 'note';
  }

  /**
   * Generate automatic title for chained note
   */
  generateAutoTitle(parentNote: Note, options: ChainingOptions = {}): string {
    const format = options.titleFormat || '${parentTitle} - Part ${sequence}';
    const sequence = this.getNextSequenceInChain(parentNote.id);
    
    return format
      .replace('${parentTitle}', parentNote.title)
      .replace('${sequence}', sequence.toString())
      .replace('${date}', new Date().toLocaleDateString())
      .replace('${time}', new Date().toLocaleTimeString());
  }

  /**
   * Get next sequence number in a chain
   */
  private getNextSequenceInChain(parentId: string): number {
    const chainId = this.getChainId(parentId);
    const chainNotes = this.chainRegistry.get(chainId) || [];
    return chainNotes.length + 1;
  }

  /**
   * Get or create chain ID for a note
   */
  private getChainId(noteId: string): string {
    // Find existing chain or create new one
    const entries = Array.from(this.chainRegistry.entries());
    for (const [chainId, noteIds] of entries) {
      if (noteIds.includes(noteId)) {
        return chainId;
      }
    }
    
    // Create new chain
    const newChainId = `chain_${Date.now()}`;
    this.chainRegistry.set(newChainId, [noteId]);
    return newChainId;
  }

  /**
   * Create a chained note from parent
   */
  createChainedNote(parentNote: Note, options: ChainingOptions = {}): ChainedNote {
    const {
      inheritTags = true,
      addBacklink = true,
      sequentialId = true,
      autoTitle = true,
      ...otherOptions
    } = options;

    // Generate ID
    const id = sequentialId 
      ? this.generateSequentialId(parentNote, otherOptions)
      : `${parentNote.id}-${Date.now()}`;

    // Generate title
    const title = autoTitle 
      ? this.generateAutoTitle(parentNote, otherOptions)
      : `New Note from ${parentNote.title}`;

    // Inherit tags
    const tags = inheritTags ? [...parentNote.tags] : [];

    // Generate body with backlink
    let body = `# ${title}\n\n`;
    if (addBacklink) {
      body += `> **Parent Note**: [[${parentNote.title}]]\n\n`;
    }
    body += `Start writing your chained note here...\n\n`;
    body += `## Related\n\n- [[${parentNote.title}]]\n`;

    // Register in chain
    const chainId = this.getChainId(parentNote.id);
    const chainNotes = this.chainRegistry.get(chainId) || [];
    this.chainRegistry.set(chainId, [...chainNotes, id]);

    const chainedNote: ChainedNote = {
      id,
      title,
      body,
      tags,
      parentId: parentNote.id,
      chainId
    };

    loggingService.info('Chained note created', {
      parentId: parentNote.id,
      newId: id,
      chainId,
      options
    });

    return chainedNote;
  }

  /**
   * Get all notes in a chain
   */
  getChainNotes(chainId: string): string[] {
    return this.chainRegistry.get(chainId) || [];
  }

  /**
   * Get chain ID for a note
   */
  getChainForNote(noteId: string): string | null {
    const entries = Array.from(this.chainRegistry.entries());
    for (const [chainId, noteIds] of entries) {
      if (noteIds.includes(noteId)) {
        return chainId;
      }
    }
    return null;
  }

  /**
   * Get all chains
   */
  getAllChains(): Map<string, string[]> {
    return new Map(this.chainRegistry);
  }

  /**
   * Update parent note with link to child
   */
  updateParentWithChildLink(parentNote: Note, childNote: ChainedNote): string {
    const childLink = `[[${childNote.title}]]`;
    
    // Check if link already exists
    if (parentNote.body.includes(childLink)) {
      return parentNote.body;
    }

    // Add link to parent note
    const updatedBody = parentNote.body + `\n\n## Related Notes\n\n- ${childLink}\n`;
    
    loggingService.info('Parent note updated with child link', {
      parentId: parentNote.id,
      childId: childNote.id
    });

    return updatedBody;
  }

  /**
   * Validate chaining options
   */
  validateOptions(options: ChainingOptions): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.idFormat && !['numeric', 'alphanumeric', 'timestamp'].includes(options.idFormat)) {
      errors.push('Invalid ID format. Must be numeric, alphanumeric, or timestamp');
    }

    if (options.idPrefix && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.idPrefix)) {
      errors.push('Invalid ID prefix. Must start with letter and contain only alphanumeric, underscore, or hyphen');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset counters (useful for testing)
   */
  resetCounters(): void {
    this.idCounter.clear();
    this.chainRegistry.clear();
  }
}

export const noteChainingService = NoteChainingService.getInstance(); 