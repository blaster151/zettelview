import { SmartBlock, SmartBlockMetadata, AIMetadata, UsageStats, BlockRelationship } from './types';

export class BlockParser {
  private static instance: BlockParser;

  private constructor() {}

  static getInstance(): BlockParser {
    if (!BlockParser.instance) {
      BlockParser.instance = new BlockParser();
    }
    return BlockParser.instance;
  }

  /**
   * Parse smart blocks from markdown content
   */
  parseBlocksFromMarkdown(content: string): SmartBlock[] {
    const blocks: SmartBlock[] = [];
    const lines = content.split('\n');
    let currentBlock: Partial<SmartBlock> | null = null;
    let blockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const markerMatch = this.parseBlockMarker(line);

      if (markerMatch) {
        // Save previous block if exists
        if (currentBlock && blockContent.length > 0) {
          currentBlock.content = blockContent.join('\n').trim();
          blocks.push(this.createCompleteBlock(currentBlock));
          blockContent = [];
        }

        // Start new block
        currentBlock = {
          id: markerMatch.id,
          type: markerMatch.type as 'note' | 'summary' | 'extract' | 'embedding' | 'custom',
          position: blocks.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: markerMatch.tags || [],
          children: [],
          aiGenerated: markerMatch.aiGenerated || false,
          confidence: markerMatch.confidence,
          version: 1,
          metadata: this.createDefaultMetadata(markerMatch)
        };
      } else if (currentBlock) {
        // Add line to current block content
        blockContent.push(line);
      }
    }

    // Save final block
    if (currentBlock && blockContent.length > 0) {
      currentBlock.content = blockContent.join('\n').trim();
      blocks.push(this.createCompleteBlock(currentBlock));
    }

    return blocks;
  }

  /**
   * Parse a single block marker line
   */
  parseBlockMarker(line: string): {
    id: string;
    type: string;
    tags?: string[];
    aiGenerated?: boolean;
    confidence?: number;
    customAttributes?: any;
  } | null {
    const markerRegex = /<!--\s*@block\s+([^>]+)\s*-->/;
    const match = line.match(markerRegex);
    
    if (!match) return null;

    const attributes = match[1];
    const parsed = this.parseAttributes(attributes);
    
    if (!parsed.id || !parsed.type) {
      throw new Error(`Invalid block marker: missing required attributes (id, type) in "${line}"`);
    }

    return {
      id: parsed.id,
      type: parsed.type,
      tags: parsed.tags ? parsed.tags.split(',').map(t => t.trim()) : undefined,
      aiGenerated: parsed.aiGenerated === 'true',
      confidence: parsed.confidence ? parseFloat(parsed.confidence) : undefined,
      customAttributes: parsed.customAttributes
    };
  }

  /**
   * Parse attributes from block marker
   */
  private parseAttributes(attributes: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = attributes.split(/\s+/);
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        result[key] = cleanValue;
      }
    }
    
    return result;
  }

  /**
   * Generate block marker for a smart block
   */
  generateBlockMarker(block: SmartBlock): string {
    const attributes = [
      `id=${block.id}`,
      `type=${block.type}`
    ];

    if (block.tags.length > 0) {
      attributes.push(`tags="${block.tags.join(',')}"`);
    }

    if (block.aiGenerated) {
      attributes.push('aiGenerated=true');
    }

    if (block.confidence !== undefined) {
      attributes.push(`confidence=${block.confidence}`);
    }

    // Add custom metadata as attributes
    Object.entries(block.metadata.customFields).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        attributes.push(`${key}="${value}"`);
      }
    });

    return `<!-- @block ${attributes.join(' ')} -->`;
  }

  /**
   * Insert block into markdown content
   */
  insertBlockIntoMarkdown(content: string, block: SmartBlock, position?: number): string {
    const lines = content.split('\n');
    const marker = this.generateBlockMarker(block);
    const blockLines = [marker, ...block.content.split('\n'), ''];
    
    if (position === undefined || position >= lines.length) {
      // Append to end
      return content + '\n' + blockLines.join('\n');
    } else {
      // Insert at specific position
      lines.splice(position, 0, ...blockLines);
      return lines.join('\n');
    }
  }

  /**
   * Extract block from markdown content
   */
  extractBlockFromMarkdown(content: string, blockId: string): {
    block: SmartBlock | null;
    remainingContent: string;
  } {
    const lines = content.split('\n');
    const result: string[] = [];
    let currentBlock: SmartBlock | null = null;
    let inTargetBlock = false;
    let blockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const markerMatch = this.parseBlockMarker(line);

      if (markerMatch) {
        // Save previous block if it was the target
        if (inTargetBlock && currentBlock) {
          currentBlock.content = blockContent.join('\n').trim();
          break;
        }

        // Check if this is the target block
        if (markerMatch.id === blockId) {
          inTargetBlock = true;
          currentBlock = {
            id: markerMatch.id,
            type: markerMatch.type as any,
            content: '', // Will be filled later
            position: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: markerMatch.tags || [],
            children: [],
            aiGenerated: markerMatch.aiGenerated || false,
            confidence: markerMatch.confidence,
            version: 1,
            metadata: this.createDefaultMetadata(markerMatch)
          };
          blockContent = [];
        } else {
          // Not the target block, keep the line
          if (!inTargetBlock) {
            result.push(line);
          }
        }
      } else if (inTargetBlock) {
        // Add line to target block content
        blockContent.push(line);
      } else {
        // Keep line in remaining content
        result.push(line);
      }
    }

    return {
      block: currentBlock,
      remainingContent: result.join('\n')
    };
  }

  /**
   * Update block in markdown content
   */
  updateBlockInMarkdown(content: string, block: SmartBlock): string {
    const { block: existingBlock, remainingContent } = this.extractBlockFromMarkdown(content, block.id);
    
    if (!existingBlock) {
      throw new Error(`Block with id ${block.id} not found in content`);
    }

    const marker = this.generateBlockMarker(block);
    const blockLines = [marker, ...block.content.split('\n')];
    
    return remainingContent + '\n' + blockLines.join('\n');
  }

  /**
   * Remove block from markdown content
   */
  removeBlockFromMarkdown(content: string, blockId: string): string {
    const { remainingContent } = this.extractBlockFromMarkdown(content, blockId);
    return remainingContent;
  }

  /**
   * Validate block structure
   */
  validateBlock(block: SmartBlock): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!block.id || block.id.trim() === '') {
      errors.push('Block ID is required');
    }

    if (!block.type || !['note', 'summary', 'extract', 'embedding', 'custom'].includes(block.type)) {
      errors.push('Block type must be one of: note, summary, extract, embedding, custom');
    }

    if (!block.content || block.content.trim() === '') {
      errors.push('Block content is required');
    }

    if (!block.metadata) {
      errors.push('Block metadata is required');
    }

    if (block.confidence !== undefined && (block.confidence < 0 || block.confidence > 1)) {
      errors.push('Confidence must be between 0 and 1');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create complete block with default values
   */
  private createCompleteBlock(partialBlock: Partial<SmartBlock>): SmartBlock {
    return {
      id: partialBlock.id!,
      type: partialBlock.type!,
      content: partialBlock.content!,
      metadata: partialBlock.metadata!,
      createdAt: partialBlock.createdAt!,
      updatedAt: partialBlock.updatedAt!,
      tags: partialBlock.tags || [],
      children: partialBlock.children || [],
      position: partialBlock.position!,
      aiGenerated: partialBlock.aiGenerated || false,
      confidence: partialBlock.confidence,
      version: partialBlock.version || 1
    };
  }

  /**
   * Create default metadata for a block
   */
  private createDefaultMetadata(markerMatch: any): SmartBlockMetadata {
    const aiMetadata: AIMetadata = {
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
    };

    const usage: UsageStats = {
      viewCount: 0,
      editCount: 0,
      extractCount: 0,
      lastViewed: new Date(),
      lastEdited: new Date(),
      popularity: 0
    };

    return {
      title: markerMatch.customAttributes?.title,
      description: markerMatch.customAttributes?.description,
      keywords: markerMatch.tags || [],
      category: markerMatch.customAttributes?.category,
      priority: 'medium',
      status: 'active',
      customFields: markerMatch.customAttributes || {},
      aiMetadata,
      relationships: [],
      usage
    };
  }
} 