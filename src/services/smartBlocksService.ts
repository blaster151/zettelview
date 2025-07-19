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
import { Note } from '../types/domain';
import { loggingService } from './loggingService';
import { notificationService } from './notificationService';
import { createHash } from 'crypto';

export class SmartBlocksService {
  private static instance: SmartBlocksService;
  private config: SmartBlockConfig;
  private eventListeners: Map<string, (event: BlockEvent) => void> = new Map();

  static getInstance(): SmartBlocksService {
    if (!SmartBlocksService.instance) {
      SmartBlocksService.instance = new SmartBlocksService();
    }
    return SmartBlocksService.instance;
  }

  constructor() {
    this.config = {
      autoGenerateIds: true,
      defaultType: 'note',
      enableReorderable: true,
      enableExtraction: true,
      enableSummarization: true,
      sidecarLocation: 'adjacent',
      blockTypes: ['summary', 'zettel', 'quote', 'argument', 'definition', 'example', 'question', 'insight', 'todo', 'note'],
      maxBlockLength: 10000,
      minBlockLength: 10
    };
  }

  /**
   * Parse markdown content and extract smart blocks
   */
  parseBlocks(content: string): SmartBlock[] {
    const blocks: SmartBlock[] = [];
    const lines = content.split('\n');
    let currentBlock: Partial<SmartBlock> | null = null;
    let blockStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const blockStartMatch = line.match(/<!--\s*block:id=([^\s]+)\s+type=([^\s]+)(?:\s+([^>]+))?\s*-->/);
      const blockEndMatch = line.match(/<!--\s*\/block\s*-->/);

      if (blockStartMatch) {
        // Start of a new block
        const [, id, type, attributes] = blockStartMatch;
        const attrs = this.parseBlockAttributes(attributes || '');
        
        currentBlock = {
          id,
          type: type as BlockType,
          title: attrs.title,
          tags: attrs.tags,
          reorderable: attrs.reorderable,
          content: '',
          lineRange: [i + 1, 0] // +1 because line numbers are 1-indexed
        };
        blockStartLine = i + 1;
      } else if (blockEndMatch && currentBlock) {
        // End of current block
        currentBlock.lineRange![1] = i + 1;
        currentBlock.content = this.extractBlockContent(lines, blockStartLine, i);
        currentBlock.contentHash = this.generateContentHash(currentBlock.content);
        
        const block = currentBlock as SmartBlock;
        if (this.validateBlock(block).isValid) {
          blocks.push(block);
        }
        
        currentBlock = null;
      } else if (currentBlock) {
        // Inside a block, content will be collected
        continue;
      }
    }

    // Handle orphaned blocks (missing closing tag)
    if (currentBlock) {
      loggingService.warn('Found orphaned block without closing tag', { blockId: currentBlock.id });
    }

    return blocks;
  }

  /**
   * Generate markdown with smart block markers
   */
  generateMarkdown(blocks: SmartBlock[], content: string): string {
    let result = content;
    const lines = result.split('\n');

    // Sort blocks by line range in reverse order to avoid offset issues
    const sortedBlocks = [...blocks].sort((a, b) => 
      (b.lineRange?.[0] || 0) - (a.lineRange?.[0] || 0)
    );

    for (const block of sortedBlocks) {
      if (!block.lineRange) continue;

      const [startLine, endLine] = block.lineRange;
      const startMarker = this.generateBlockStartMarker(block);
      const endMarker = '<!-- /block -->';

      // Insert markers
      lines.splice(startLine - 1, 0, startMarker);
      lines.splice(endLine + 1, 0, endMarker);
    }

    return lines.join('\n');
  }

  /**
   * Create a new smart block
   */
  createBlock(content: string, options: BlockInsertionOptions = {}): SmartBlock {
    const id = options.id || this.generateBlockId();
    const block: SmartBlock = {
      id,
      type: options.type || this.config.defaultType,
      title: options.title,
      tags: options.tags || [],
      reorderable: options.reorderable ?? this.config.enableReorderable,
      content: content.trim(),
      contentHash: this.generateContentHash(content)
    };

    const validation = this.validateBlock(block);
    if (!validation.isValid) {
      throw new Error(`Invalid block: ${validation.errors.join(', ')}`);
    }

    this.emitEvent({
      type: 'created',
      blockId: block.id,
      timestamp: new Date().toISOString(),
      data: { block }
    });

    return block;
  }

  /**
   * Update an existing block
   */
  updateBlock(blockId: string, updates: Partial<SmartBlock>): SmartBlock {
    // This would typically be called after finding the block in the document
    // For now, we'll create a new block with the updates
    const updatedBlock: SmartBlock = {
      id: blockId,
      type: updates.type || 'note',
      title: updates.title,
      tags: updates.tags || [],
      reorderable: updates.reorderable ?? false,
      content: updates.content || '',
      contentHash: updates.content ? this.generateContentHash(updates.content) : undefined
    };

    this.emitEvent({
      type: 'updated',
      blockId,
      timestamp: new Date().toISOString(),
      data: { block: updatedBlock }
    });

    return updatedBlock;
  }

  /**
   * Extract a block to a new note
   */
  async extractBlock(block: SmartBlock, options: BlockExtractionOptions = {}): Promise<Note> {
    const extractedNote: Note = {
      id: this.generateNoteId(),
      title: block.title || `Extracted: ${block.content.substring(0, 50)}...`,
      body: this.generateExtractedNoteBody(block, options),
      tags: options.inheritTags ? [...block.tags] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.emitEvent({
      type: 'extracted',
      blockId: block.id,
      timestamp: new Date().toISOString(),
      data: {
        targetNoteId: extractedNote.id,
        backlinkId: options.createBacklink ? block.id : undefined,
        options
      }
    } as BlockExtractionEvent);

    loggingService.info('Block extracted to new note', {
      blockId: block.id,
      noteId: extractedNote.id,
      options
    });

    return extractedNote;
  }

  /**
   * Suggest reordering for blocks
   */
  async suggestReorder(blocks: SmartBlock[], options: BlockReorderOptions = {}): Promise<number[]> {
    const reorderableBlocks = blocks.filter(b => b.reorderable);
    
    if (reorderableBlocks.length < 2) {
      return blocks.map((_, index) => index);
    }

    // Simple similarity-based reordering (placeholder for AI)
    const suggestions = await this.aiReorderBlocks(reorderableBlocks, options);
    
    // Map suggestions back to original block indices
    const originalIndices = blocks.map((_, index) => index);
    const reorderableIndices = blocks
      .map((block, index) => ({ block, index }))
      .filter(({ block }) => block.reorderable)
      .map(({ index }) => index);

    const result = [...originalIndices];
    suggestions.forEach((suggestedIndex, aiIndex) => {
      const originalIndex = reorderableIndices[aiIndex];
      const targetIndex = reorderableIndices[suggestedIndex];
      if (originalIndex !== undefined && targetIndex !== undefined) {
        result[originalIndex] = targetIndex;
      }
    });

    return result;
  }

  /**
   * Summarize a block using AI
   */
  async summarizeBlock(block: SmartBlock, options: BlockSummarizationOptions = {}): Promise<string> {
    if (!this.config.enableSummarization) {
      throw new Error('Summarization is disabled');
    }

    try {
      const summary = await this.aiSummarizeBlock(block, options);
      
      loggingService.info('Block summarized', {
        blockId: block.id,
        summaryLength: summary.length,
        options
      });

      return summary;
    } catch (error) {
      loggingService.error('Failed to summarize block', {
        blockId: block.id,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Process blocks with AI (batch operation)
   */
  async processBlocks(blocks: SmartBlock[], operations: string[]): Promise<BlockProcessingJob[]> {
    const jobs: BlockProcessingJob[] = blocks.map(block => ({
      id: this.generateJobId(),
      blockId: block.id,
      type: 'summarize' as const, // Default operation
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Process jobs in batches
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      await Promise.all(batch.map(job => this.processJob(job)));
    }

    return jobs;
  }

  /**
   * Find similar blocks
   */
  async findSimilarBlocks(block: SmartBlock, allBlocks: SmartBlock[]): Promise<BlockMatchResult[]> {
    const results: BlockMatchResult[] = [];

    for (const otherBlock of allBlocks) {
      if (otherBlock.id === block.id) continue;

      const similarity = this.calculateSimilarity(block, otherBlock);
      if (similarity > 0.3) { // Threshold for similarity
        results.push({
          block: otherBlock,
          confidence: similarity,
          matchType: 'fuzzy'
        });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate a smart block
   */
  validateBlock(block: SmartBlock): BlockValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!block.id) {
      errors.push('Block ID is required');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(block.id)) {
      errors.push('Block ID must contain only alphanumeric characters, hyphens, and underscores');
    }

    if (!block.type) {
      errors.push('Block type is required');
    } else if (!this.config.blockTypes.includes(block.type)) {
      errors.push(`Invalid block type: ${block.type}`);
    }

    if (!block.content) {
      errors.push('Block content is required');
    } else if (block.content.length < this.config.minBlockLength) {
      errors.push(`Block content must be at least ${this.config.minBlockLength} characters`);
    } else if (block.content.length > this.config.maxBlockLength) {
      errors.push(`Block content must be less than ${this.config.maxBlockLength} characters`);
    }

    // Warnings
    if (block.tags.length > 10) {
      warnings.push('Block has many tags, consider consolidating');
    }

    if (block.content.length > 1000) {
      warnings.push('Block is quite long, consider breaking it down');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load sidecar metadata
   */
  async loadSidecarMetadata(noteId: string): Promise<SidecarMetadata> {
    try {
      // This would typically load from file system
      // For now, return empty metadata
      return {
        blocks: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      loggingService.error('Failed to load sidecar metadata', { noteId, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
      return {
        blocks: {},
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      };
    }
  }

  /**
   * Save sidecar metadata
   */
  async saveSidecarMetadata(noteId: string, metadata: SidecarMetadata): Promise<void> {
    try {
      metadata.lastUpdated = new Date().toISOString();
      // This would typically save to file system
      loggingService.info('Sidecar metadata saved', { noteId, blockCount: Object.keys(metadata.blocks).length });
    } catch (error) {
      loggingService.error('Failed to save sidecar metadata', { noteId, errorMessage: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Subscribe to block events
   */
  subscribe(eventType: string, listener: (event: BlockEvent) => void): () => void {
    this.eventListeners.set(eventType, listener);
    return () => this.eventListeners.delete(eventType);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SmartBlockConfig>): void {
    this.config = { ...this.config, ...newConfig };
    loggingService.info('Smart blocks configuration updated', { config: this.config });
  }

  // Private helper methods

  private parseBlockAttributes(attributes: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Parse attributes like "reorderable=true tags=ethics,systems title=My Block"
    const attrRegex = /(\w+)=([^\s]+)/g;
    let match;
    
    while ((match = attrRegex.exec(attributes)) !== null) {
      const [, key, value] = match;
      
      if (key === 'reorderable') {
        result[key] = value === 'true';
      } else if (key === 'tags') {
        result[key] = value.split(',').map(tag => tag.trim());
      } else if (key === 'title') {
        result[key] = decodeURIComponent(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  private extractBlockContent(lines: string[], startLine: number, endLine: number): string {
    return lines.slice(startLine, endLine).join('\n').trim();
  }

  private generateBlockStartMarker(block: SmartBlock): string {
    const attrs = [
      `id=${block.id}`,
      `type=${block.type}`,
      block.reorderable ? 'reorderable=true' : '',
      block.tags.length > 0 ? `tags=${block.tags.join(',')}` : '',
      block.title ? `title=${encodeURIComponent(block.title)}` : ''
    ].filter(Boolean).join(' ');
    
    return `<!-- block:${attrs} -->`;
  }

  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 8);
  }

  private generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateNoteId(): string {
    return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExtractedNoteBody(block: SmartBlock, options: BlockExtractionOptions): string {
    let body = `# ${block.title || 'Extracted Block'}\n\n`;
    
    if (options.addSourceReference) {
      body += `> **Source**: Extracted from block \`${block.id}\`\n\n`;
    }
    
    body += block.content;
    
    if (options.createBacklink) {
      body += `\n\n## Related\n\n- [[Original Note]]\n`;
    }
    
    return body;
  }

  private async aiReorderBlocks(blocks: SmartBlock[], options: BlockReorderOptions): Promise<number[]> {
    // Placeholder for AI reordering logic
    // In a real implementation, this would call an AI service
    return blocks.map((_, index) => index);
  }

  private async aiSummarizeBlock(block: SmartBlock, options: BlockSummarizationOptions): Promise<string> {
    // Placeholder for AI summarization logic
    // In a real implementation, this would call an AI service
    const maxLength = options.maxLength || 150;
    return block.content.length > maxLength 
      ? block.content.substring(0, maxLength) + '...'
      : block.content;
  }

  private async processJob(job: BlockProcessingJob): Promise<void> {
    job.status = 'processing';
    job.updatedAt = new Date().toISOString();
    
    try {
      // Process the job based on type
      switch (job.type) {
        case 'summarize':
          // Implementation would call AI service
          job.result = 'Summary placeholder';
          break;
        case 'embed':
          // Implementation would generate embeddings
          job.result = [0.1, 0.2, 0.3]; // Placeholder vector
          break;
        case 'reorder':
          // Implementation would suggest reordering
          job.result = [0, 1, 2]; // Placeholder order
          break;
        case 'extract':
          // Implementation would suggest extraction
          job.result = { title: 'Suggested Title', tags: [], type: 'note' as BlockType };
          break;
      }
      
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    job.updatedAt = new Date().toISOString();
  }

  private calculateSimilarity(block1: SmartBlock, block2: SmartBlock): number {
    // Simple similarity calculation based on content overlap
    const words1 = new Set(block1.content.toLowerCase().split(/\s+/));
    const words2 = new Set(block2.content.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);
    
    return intersection.size / union.size;
  }

  private emitEvent(event: BlockEvent): void {
    const listener = this.eventListeners.get(event.type);
    if (listener) {
      try {
        listener(event);
      } catch (error) {
        loggingService.error('Error in block event listener', { 
          eventType: event.type, 
          blockId: event.blockId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }
}

export const smartBlocksService = SmartBlocksService.getInstance(); 