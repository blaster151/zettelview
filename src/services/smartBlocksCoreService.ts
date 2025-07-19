import { 
  SmartBlock, 
  SmartBlockMetadata, 
  AIResponse, 
  BlockExtractionResult, 
  BlockReorderResult, 
  ReorderSuggestion, 
  EditorState, 
  BlockCommand, 
  BlockEvent, 
  SmartBlocksConfig, 
  ValidationRule, 
  ProcessingOptions, 
  SearchFilters, 
  SortOptions, 
  BatchOperationResult, 
  FileInfo, 
  ProcessingStats 
} from '../../core/types';
import { blockParser, fileManager, summaryEngine } from '../../core';
import { Note } from '../types/domain';
import { loggingService } from './loggingService';
import { notificationService } from './notificationService';

export class SmartBlocksCoreService {
  private static instance: SmartBlocksCoreService;
  private config: SmartBlocksConfig;
  private eventListeners: Map<string, (event: BlockEvent) => void> = new Map();

  static getInstance(): SmartBlocksCoreService {
    if (!SmartBlocksCoreService.instance) {
      SmartBlocksCoreService.instance = new SmartBlocksCoreService();
    }
    return SmartBlocksCoreService.instance;
  }

  constructor() {
    this.config = {
      enabled: true,
      autoSave: true,
      autoSummarize: false,
      aiEnabled: true,
      maxBlocksPerFile: 100,
      supportedTypes: ['note', 'summary', 'extract', 'embedding', 'custom'],
      metadataPath: './metadata',
      backupEnabled: true,
      validationRules: []
    };
  }

  /**
   * Parse smart blocks from markdown content
   */
  parseBlocks(content: string): SmartBlock[] {
    try {
      return blockParser.parseBlocksFromMarkdown(content);
    } catch (error) {
      loggingService.error('Failed to parse blocks from markdown', error as Error);
      throw error;
    }
  }

  /**
   * Generate markdown with smart block markers
   */
  generateMarkdown(blocks: SmartBlock[], content: string): string {
    try {
      let result = content;
      
      // Remove existing blocks first
      for (const block of blocks) {
        result = blockParser.removeBlockFromMarkdown(result, block.id);
      }
      
      // Add blocks back in order
      for (let i = 0; i < blocks.length; i++) {
        result = blockParser.insertBlockIntoMarkdown(result, blocks[i], i);
      }
      
      return result;
    } catch (error) {
      loggingService.error('Failed to generate markdown', error as Error);
      throw error;
    }
  }

  /**
   * Create a new smart block
   */
  createBlock(content: string, options: {
    id?: string;
    type?: 'note' | 'summary' | 'extract' | 'embedding' | 'custom';
    tags?: string[];
    metadata?: Partial<SmartBlockMetadata>;
  } = {}): SmartBlock {
    try {
      const id = options.id || this.generateBlockId();
      const block: SmartBlock = {
        id,
        type: options.type || 'note',
        content: content.trim(),
        metadata: this.createDefaultMetadata(options.metadata),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: options.tags || [],
        children: [],
        position: 0,
        aiGenerated: false,
        version: 1
      };

      const validation = blockParser.validateBlock(block);
      if (!validation.isValid) {
        throw new Error(`Invalid block: ${validation.errors.join(', ')}`);
      }

      this.emitEvent({
        type: 'blockCreated',
        blockId: block.id,
        timestamp: new Date(),
        data: { block }
      });

      return block;
    } catch (error) {
      loggingService.error('Failed to create block', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing block
   */
  updateBlock(blockId: string, updates: Partial<SmartBlock>): SmartBlock {
    try {
      // This would typically load the current block from storage
      // For now, we'll create a new block with the updates
      const updatedBlock: SmartBlock = {
        id: blockId,
        type: updates.type || 'note',
        content: updates.content || '',
        metadata: updates.metadata || this.createDefaultMetadata(),
        createdAt: updates.createdAt || new Date(),
        updatedAt: new Date(),
        tags: updates.tags || [],
        children: updates.children || [],
        position: updates.position || 0,
        aiGenerated: updates.aiGenerated || false,
        version: (updates.version || 1) + 1
      };

      this.emitEvent({
        type: 'blockUpdated',
        blockId,
        timestamp: new Date(),
        data: { block: updatedBlock }
      });

      return updatedBlock;
    } catch (error) {
      loggingService.error('Failed to update block', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Extract a block to a new note
   */
  async extractBlock(block: SmartBlock, options: {
    inheritTags?: boolean;
    addContext?: boolean;
  } = {}): Promise<Note> {
    try {
      const extractedNote: Note = {
        id: this.generateNoteId(),
        title: block.metadata.title || `Extracted: ${block.content.substring(0, 50)}...`,
        body: this.generateExtractedNoteBody(block, options),
        tags: options.inheritTags ? [...block.tags] : [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.emitEvent({
        type: 'blockExtracted',
        blockId: block.id,
        timestamp: new Date(),
        data: { extractedNote, originalBlock: block }
      });

      return extractedNote;
    } catch (error) {
      loggingService.error('Failed to extract block', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Reorder blocks based on AI suggestions
   */
  async reorderBlocks(blocks: SmartBlock[]): Promise<BlockReorderResult> {
    try {
      const result = await summaryEngine.reorderBlocks(blocks);
      
      this.emitEvent({
        type: 'blockReordered',
        blockId: 'multiple',
        timestamp: new Date(),
        data: { result }
      });

      return result;
    } catch (error) {
      loggingService.error('Failed to reorder blocks', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Generate summary for a block
   */
  async summarizeBlock(block: SmartBlock): Promise<AIResponse> {
    try {
      const result = await summaryEngine.generateSummary(block);
      
      if (result.success) {
        notificationService.success('Summary generated successfully');
      } else {
        notificationService.error('Failed to generate summary', { error: result.error });
      }

      return result;
    } catch (error) {
      loggingService.error('Failed to summarize block', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Process multiple blocks with AI operations
   */
  async processBlocks(blocks: SmartBlock[], operations: string[]): Promise<BatchOperationResult> {
    try {
      const result = await summaryEngine.batchProcess(blocks, operations);
      
      if (result.stats.successful > 0) {
        notificationService.success(`Processed ${result.stats.successful} operations successfully`);
      }
      
      if (result.stats.failed > 0) {
        notificationService.warning(`${result.stats.failed} operations failed`);
      }

      return {
        success: result.stats.failed === 0,
        processed: result.stats.total,
        succeeded: result.stats.successful,
        failed: result.stats.failed,
        errors: result.results.filter(r => !r.success).map(r => r.error || 'Unknown error'),
        results: result.results
      };
    } catch (error) {
      loggingService.error('Failed to process blocks', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Load metadata for a file
   */
  async loadMetadata(filePath: string): Promise<Record<string, any> | null> {
    try {
      return await fileManager.loadMetadata(filePath);
    } catch (error) {
      loggingService.error('Failed to load metadata', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Save metadata for a file
   */
  async saveMetadata(filePath: string, metadata: Record<string, any>): Promise<void> {
    try {
      await fileManager.saveMetadata(filePath, metadata);
    } catch (error) {
      loggingService.error('Failed to save metadata', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Validate a block
   */
  validateBlock(block: SmartBlock): { isValid: boolean; errors: string[] } {
    return blockParser.validateBlock(block);
  }

  /**
   * Subscribe to block events
   */
  subscribe(eventType: string, listener: (event: BlockEvent) => void): () => void {
    this.eventListeners.set(eventType, listener);
    
    return () => {
      this.eventListeners.delete(eventType);
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SmartBlocksConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): SmartBlocksConfig {
    return { ...this.config };
  }

  // Private helper methods

  private createDefaultMetadata(overrides: Partial<SmartBlockMetadata> = {}): SmartBlockMetadata {
    return {
      title: overrides.title,
      description: overrides.description,
      keywords: overrides.keywords || [],
      category: overrides.category,
      priority: overrides.priority || 'medium',
      status: overrides.status || 'active',
      customFields: overrides.customFields || {},
      aiMetadata: {
        topics: [],
        entities: [],
        keywords: [],
        readability: {
          fleschKincaid: 0,
          gunningFog: 0,
          colemanLiau: 0,
          smog: 0,
          automatedReadability: 0,
          averageGrade: 0
        },
        lastProcessed: new Date(),
        processingVersion: '1.0.0'
      },
      relationships: [],
      usage: {
        viewCount: 0,
        editCount: 0,
        extractCount: 0,
        lastViewed: new Date(),
        lastEdited: new Date(),
        popularity: 0
      }
    };
  }

  private generateBlockId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNoteId(): string {
    return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExtractedNoteBody(block: SmartBlock, options: {
    inheritTags?: boolean;
    addContext?: boolean;
  }): string {
    let body = block.content;

    if (options.addContext) {
      body = `# ${block.metadata.title || 'Extracted Block'}\n\n${body}\n\n---\n\n**Source Block ID:** ${block.id}\n**Type:** ${block.type}\n**Extracted:** ${new Date().toISOString()}`;
    }

    if (options.inheritTags && block.tags.length > 0) {
      body += `\n\n**Tags:** ${block.tags.join(', ')}`;
    }

    return body;
  }

  private emitEvent(event: BlockEvent): void {
    const listener = this.eventListeners.get(event.type);
    if (listener) {
      listener(event);
    }
  }
}

export const smartBlocksCoreService = SmartBlocksCoreService.getInstance(); 