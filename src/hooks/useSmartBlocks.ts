import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SmartBlock, 
  BlockType, 
  BlockMetadata, 
  SidecarMetadata, 
  BlockInsertionOptions,
  BlockExtractionOptions,
  BlockReorderOptions,
  BlockSummarizationOptions,
  BlockProcessingJob,
  BlockRenderOptions,
  BlockFilter,
  BlockSort,
  BlockStatistics,
  BlockEvent,
  BlockEditorState
} from '../types/smartBlocks';
import { smartBlocksService } from '../services/smartBlocksService';
import { useNoteStore } from '../store/noteStore';
import { loggingService } from '../services/loggingService';
import { notificationService } from '../services/notificationService';

export interface UseSmartBlocksOptions {
  noteId?: string;
  autoParse?: boolean;
  autoSave?: boolean;
  renderOptions?: Partial<BlockRenderOptions>;
  onBlockEvent?: (event: BlockEvent) => void;
}

export interface UseSmartBlocksReturn {
  // State
  blocks: SmartBlock[];
  metadata: SidecarMetadata;
  selectedBlockId?: string;
  isReorderMode: boolean;
  showBlocks: boolean;
  processingJobs: BlockProcessingJob[];
  statistics: BlockStatistics;
  
  // Actions
  parseBlocks: (content: string) => SmartBlock[];
  createBlock: (content: string, options?: BlockInsertionOptions) => SmartBlock;
  updateBlock: (blockId: string, updates: Partial<SmartBlock>) => SmartBlock;
  deleteBlock: (blockId: string) => void;
  selectBlock: (blockId?: string) => void;
  toggleReorderMode: () => void;
  toggleShowBlocks: () => void;
  
  // AI Operations
  extractBlock: (blockId: string, options?: BlockExtractionOptions) => Promise<void>;
  summarizeBlock: (blockId: string, options?: BlockSummarizationOptions) => Promise<string>;
  suggestReorder: (options?: BlockReorderOptions) => Promise<number[]>;
  processBlocks: (operations: string[]) => Promise<BlockProcessingJob[]>;
  
  // Filtering and Sorting
  filterBlocks: (filter: BlockFilter) => SmartBlock[];
  sortBlocks: (sort: BlockSort) => SmartBlock[];
  getFilteredBlocks: (filter?: BlockFilter, sort?: BlockSort) => SmartBlock[];
  
  // Metadata Management
  loadMetadata: () => Promise<void>;
  saveMetadata: () => Promise<void>;
  updateBlockMetadata: (blockId: string, metadata: Partial<BlockMetadata>) => void;
  
  // Utilities
  getBlockById: (blockId: string) => SmartBlock | undefined;
  getBlockMetadata: (blockId: string) => BlockMetadata | undefined;
  validateBlock: (block: SmartBlock) => boolean;
  generateMarkdown: () => string;
  
  // Configuration
  updateRenderOptions: (options: Partial<BlockRenderOptions>) => void;
}

export function useSmartBlocks(options: UseSmartBlocksOptions = {}): UseSmartBlocksReturn {
  const {
    noteId,
    autoParse = true,
    autoSave = true,
    renderOptions: initialRenderOptions = {},
    onBlockEvent
  } = options;

  const { getNote, updateNote } = useNoteStore();
  
  // State
  const [blocks, setBlocks] = useState<SmartBlock[]>([]);
  const [metadata, setMetadata] = useState<SidecarMetadata>({
    blocks: {},
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  });
  const [selectedBlockId, setSelectedBlockId] = useState<string>();
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [showBlocks, setShowBlocks] = useState(true);
  const [processingJobs, setProcessingJobs] = useState<BlockProcessingJob[]>([]);
  const [renderOptions, setRenderOptions] = useState<BlockRenderOptions>({
    showBorders: true,
    showTypeIcons: true,
    showTags: true,
    showActions: true,
    highlightReorderable: true,
    showMetadata: false,
    ...initialRenderOptions
  });

  // Parse blocks from note content
  const parseBlocks = useCallback((content: string): SmartBlock[] => {
    try {
      const parsedBlocks = smartBlocksService.parseBlocks(content);
      setBlocks(parsedBlocks);
      return parsedBlocks;
    } catch (error) {
      loggingService.error('Failed to parse blocks', { 
        noteId, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
      return [];
    }
  }, [noteId]);

  // Create a new block
  const createBlock = useCallback((content: string, options: BlockInsertionOptions = {}): SmartBlock => {
    try {
      const block = smartBlocksService.createBlock(content, options);
      setBlocks(prev => [...prev, block]);
      
      notificationService.success('Block created successfully');
      return block;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create block';
      notificationService.error(message);
      throw error;
    }
  }, []);

  // Update an existing block
  const updateBlock = useCallback((blockId: string, updates: Partial<SmartBlock>): SmartBlock => {
    try {
      const updatedBlock = smartBlocksService.updateBlock(blockId, updates);
      setBlocks(prev => prev.map(block => 
        block.id === blockId ? updatedBlock : block
      ));
      
      notificationService.success('Block updated successfully');
      return updatedBlock;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update block';
      notificationService.error(message);
      throw error;
    }
  }, []);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    setMetadata(prev => {
      const newMetadata = { ...prev };
      delete newMetadata.blocks[blockId];
      return newMetadata;
    });
    
    if (selectedBlockId === blockId) {
      setSelectedBlockId(undefined);
    }
    
    notificationService.success('Block deleted successfully');
  }, [selectedBlockId]);

  // Extract a block to a new note
  const extractBlock = useCallback(async (blockId: string, options: BlockExtractionOptions = {}) => {
    try {
      const block = getBlockById(blockId);
      if (!block) {
        throw new Error('Block not found');
      }

      const extractedNote = await smartBlocksService.extractBlock(block, options);
      
      // Add the note to the store
      if (noteId) {
        // This would typically add the note to the store
        // For now, just show a notification
        notificationService.success(`Block extracted to new note: ${extractedNote.title}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to extract block';
      notificationService.error(message);
      throw error;
    }
  }, [noteId]);

  // Summarize a block
  const summarizeBlock = useCallback(async (blockId: string, options: BlockSummarizationOptions = {}): Promise<string> => {
    try {
      const block = getBlockById(blockId);
      if (!block) {
        throw new Error('Block not found');
      }

      const summary = await smartBlocksService.summarizeBlock(block, options);
      
      // Update metadata with the summary
      updateBlockMetadata(blockId, { aiSummary: summary });
      
      notificationService.success('Block summarized successfully');
      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to summarize block';
      notificationService.error(message);
      throw error;
    }
  }, []);

  // Suggest reordering
  const suggestReorder = useCallback(async (options: BlockReorderOptions = {}): Promise<number[]> => {
    try {
      const suggestions = await smartBlocksService.suggestReorder(blocks, options);
      notificationService.success('Reorder suggestions generated');
      return suggestions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate reorder suggestions';
      notificationService.error(message);
      throw error;
    }
  }, [blocks]);

  // Process blocks with AI
  const processBlocks = useCallback(async (operations: string[]): Promise<BlockProcessingJob[]> => {
    try {
      const jobs = await smartBlocksService.processBlocks(blocks, operations);
      setProcessingJobs(prev => [...prev, ...jobs]);
      
      notificationService.success(`Processing ${jobs.length} blocks`);
      return jobs;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process blocks';
      notificationService.error(message);
      throw error;
    }
  }, [blocks]);

  // Filter blocks
  const filterBlocks = useCallback((filter: BlockFilter): SmartBlock[] => {
    return blocks.filter(block => {
      if (filter.types && !filter.types.includes(block.type)) return false;
      if (filter.tags && !filter.tags.some(tag => block.tags.includes(tag))) return false;
      if (filter.reorderable !== undefined && block.reorderable !== filter.reorderable) return false;
      if (filter.hasAI !== undefined) {
        const hasAI = metadata.blocks[block.id]?.aiSummary;
        if (filter.hasAI !== !!hasAI) return false;
      }
      if (filter.extracted !== undefined) {
        const isExtracted = !!metadata.blocks[block.id]?.extractedTo;
        if (filter.extracted !== isExtracted) return false;
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matches = block.content.toLowerCase().includes(searchLower) ||
                       block.title?.toLowerCase().includes(searchLower) ||
                       block.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }
      return true;
    });
  }, [blocks, metadata]);

  // Sort blocks
  const sortBlocks = useCallback((sort: BlockSort): SmartBlock[] => {
    return [...blocks].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'position':
          aValue = a.lineRange?.[0] || 0;
          bValue = b.lineRange?.[0] || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'created':
          aValue = metadata.blocks[a.id]?.lastProcessed || '';
          bValue = metadata.blocks[b.id]?.lastProcessed || '';
          break;
        case 'updated':
          aValue = metadata.blocks[a.id]?.lastProcessed || '';
          bValue = metadata.blocks[b.id]?.lastProcessed || '';
          break;
        case 'length':
          aValue = a.content.length;
          bValue = b.content.length;
          break;
        default:
          return 0;
      }
      
      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [blocks, metadata]);

  // Get filtered and sorted blocks
  const getFilteredBlocks = useCallback((filter?: BlockFilter, sort?: BlockSort): SmartBlock[] => {
    let result = blocks;
    
    if (filter) {
      result = filterBlocks(filter);
    }
    
    if (sort) {
      result = sortBlocks(sort);
    }
    
    return result;
  }, [blocks, filterBlocks, sortBlocks]);

  // Load metadata
  const loadMetadata = useCallback(async () => {
    if (!noteId) return;
    
    try {
      const loadedMetadata = await smartBlocksService.loadSidecarMetadata(noteId);
      setMetadata(loadedMetadata);
    } catch (error) {
      loggingService.error('Failed to load metadata', { 
        noteId, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [noteId]);

  // Save metadata
  const saveMetadata = useCallback(async () => {
    if (!noteId) return;
    
    try {
      await smartBlocksService.saveSidecarMetadata(noteId, metadata);
    } catch (error) {
      loggingService.error('Failed to save metadata', { 
        noteId, 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }, [noteId, metadata]);

  // Update block metadata
  const updateBlockMetadata = useCallback((blockId: string, updates: Partial<BlockMetadata>) => {
    setMetadata(prev => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: {
          ...prev.blocks[blockId],
          ...updates,
          lastProcessed: new Date().toISOString()
        }
      }
    }));
  }, []);

  // Get block by ID
  const getBlockById = useCallback((blockId: string): SmartBlock | undefined => {
    return blocks.find(block => block.id === blockId);
  }, [blocks]);

  // Get block metadata
  const getBlockMetadata = useCallback((blockId: string): BlockMetadata | undefined => {
    return metadata.blocks[blockId];
  }, [metadata]);

  // Validate block
  const validateBlock = useCallback((block: SmartBlock): boolean => {
    const validation = smartBlocksService.validateBlock(block);
    return validation.isValid;
  }, []);

  // Generate markdown
  const generateMarkdown = useCallback((): string => {
    const note = noteId ? getNote(noteId) : null;
    if (!note) return '';
    
    return smartBlocksService.generateMarkdown(blocks, note.body);
  }, [noteId, blocks, getNote]);

  // Update render options
  const updateRenderOptions = useCallback((options: Partial<BlockRenderOptions>) => {
    setRenderOptions(prev => ({ ...prev, ...options }));
  }, []);

  // Calculate statistics
  const statistics = useMemo((): BlockStatistics => {
    const blocksByType = blocks.reduce((acc, block) => {
      acc[block.type] = (acc[block.type] || 0) + 1;
      return acc;
    }, {} as Record<BlockType, number>);

    const totalLength = blocks.reduce((sum, block) => sum + block.content.length, 0);
    const averageLength = blocks.length > 0 ? totalLength / blocks.length : 0;

    return {
      totalBlocks: blocks.length,
      blocksByType,
      averageBlockLength: Math.round(averageLength),
      reorderableBlocks: blocks.filter(b => b.reorderable).length,
      extractedBlocks: Object.values(metadata.blocks).filter(b => b.extractedTo).length,
      blocksWithAI: Object.values(metadata.blocks).filter(b => b.aiSummary).length,
      lastActivity: metadata.lastUpdated
    };
  }, [blocks, metadata]);

  // Event handling
  useEffect(() => {
    const unsubscribe = smartBlocksService.subscribe('all', (event: BlockEvent) => {
      if (onBlockEvent) {
        onBlockEvent(event);
      }
    });

    return unsubscribe;
  }, [onBlockEvent]);

  // Auto-parse when note changes
  useEffect(() => {
    if (autoParse && noteId) {
      const note = getNote(noteId);
      if (note) {
        parseBlocks(note.body);
      }
    }
  }, [noteId, autoParse, parseBlocks, getNote]);

  // Auto-save metadata
  useEffect(() => {
    if (autoSave && metadata.blocks && Object.keys(metadata.blocks).length > 0) {
      saveMetadata();
    }
  }, [metadata, autoSave, saveMetadata]);

  return {
    // State
    blocks,
    metadata,
    selectedBlockId,
    isReorderMode,
    showBlocks,
    processingJobs,
    statistics,
    
    // Actions
    parseBlocks,
    createBlock,
    updateBlock,
    deleteBlock,
    selectBlock: setSelectedBlockId,
    toggleReorderMode: () => setIsReorderMode(prev => !prev),
    toggleShowBlocks: () => setShowBlocks(prev => !prev),
    
    // AI Operations
    extractBlock,
    summarizeBlock,
    suggestReorder,
    processBlocks,
    
    // Filtering and Sorting
    filterBlocks,
    sortBlocks,
    getFilteredBlocks,
    
    // Metadata Management
    loadMetadata,
    saveMetadata,
    updateBlockMetadata,
    
    // Utilities
    getBlockById,
    getBlockMetadata,
    validateBlock,
    generateMarkdown,
    
    // Configuration
    updateRenderOptions
  };
} 