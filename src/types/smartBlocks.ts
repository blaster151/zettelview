export interface SmartBlock {
  id: string;
  type: BlockType;
  title?: string;
  tags: string[];
  reorderable: boolean;
  content: string;
  lineRange?: [number, number]; // [startLine, endLine]
  contentHash?: string; // For detecting changes
}

export type BlockType = 
  | 'summary'
  | 'zettel'
  | 'quote'
  | 'argument'
  | 'definition'
  | 'example'
  | 'question'
  | 'insight'
  | 'todo'
  | 'note';

export interface BlockMetadata {
  id: string;
  aiSummary?: string;
  tokens?: number;
  embeddingVector?: number[];
  reorderedPosition?: number;
  lastProcessed?: string; // ISO timestamp
  contentHash?: string;
  extractedTo?: string; // ID of extracted note
  backlinkId?: string; // ID of parent note if extracted
}

export interface SidecarMetadata {
  blocks: Record<string, BlockMetadata>;
  documentHash?: string;
  lastUpdated: string;
  version: string;
}

export interface BlockExtractionOptions {
  createBacklink?: boolean;
  inheritTags?: boolean;
  addSourceReference?: boolean;
  targetNoteId?: string; // If provided, extract to existing note
}

export interface BlockReorderOptions {
  algorithm?: 'similarity' | 'chronological' | 'importance' | 'custom';
  preserveIds?: boolean;
  updateMetadata?: boolean;
}

export interface BlockSummarizationOptions {
  model?: 'gpt-3.5-turbo' | 'gpt-4' | 'claude' | 'local';
  maxLength?: number;
  style?: 'concise' | 'detailed' | 'bullet-points';
  includeContext?: boolean;
}

export interface SmartBlockConfig {
  autoGenerateIds: boolean;
  defaultType: BlockType;
  enableReorderable: boolean;
  enableExtraction: boolean;
  enableSummarization: boolean;
  sidecarLocation: 'adjacent' | 'meta-folder';
  blockTypes: BlockType[];
  maxBlockLength: number;
  minBlockLength: number;
}

export interface BlockInsertionOptions {
  type?: BlockType;
  title?: string;
  tags?: string[];
  reorderable?: boolean;
  id?: string; // If not provided, will be auto-generated
}

export interface BlockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export interface BlockMatchResult {
  block: SmartBlock;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'content-hash' | 'proximity';
}

export interface BlockProcessingJob {
  id: string;
  blockId: string;
  type: 'summarize' | 'embed' | 'reorder' | 'extract';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options?: any;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlockAIResponse {
  summary?: string;
  embedding?: number[];
  reorderSuggestion?: number[];
  extractionSuggestion?: {
    title: string;
    tags: string[];
    type: BlockType;
  };
  confidence: number;
  model: string;
  processingTime: number;
}

export interface BlockRenderOptions {
  showBorders: boolean;
  showTypeIcons: boolean;
  showTags: boolean;
  showActions: boolean;
  highlightReorderable: boolean;
  showMetadata: boolean;
}

export interface BlockTemplate {
  id: string;
  name: string;
  type: BlockType;
  defaultTitle?: string;
  defaultTags: string[];
  contentTemplate?: string;
  reorderable: boolean;
  description?: string;
}

export interface BlockStatistics {
  totalBlocks: number;
  blocksByType: Record<BlockType, number>;
  averageBlockLength: number;
  reorderableBlocks: number;
  extractedBlocks: number;
  blocksWithAI: number;
  lastActivity: string;
}

export interface BlockSearchResult {
  blocks: SmartBlock[];
  metadata: Record<string, BlockMetadata>;
  totalResults: number;
  searchTime: number;
  query: string;
}

export interface BlockExportOptions {
  format: 'markdown' | 'json' | 'html' | 'plain-text';
  includeMetadata: boolean;
  includeAI: boolean;
  includeComments: boolean;
  flattenBlocks: boolean;
}

export interface BlockImportOptions {
  source: 'markdown' | 'json' | 'html';
  mergeStrategy: 'append' | 'replace' | 'merge';
  generateIds: boolean;
  validateContent: boolean;
  preserveMetadata: boolean;
}

// Milkdown-specific types
export interface MilkdownBlockNode {
  type: 'smart-block';
  attrs: {
    id: string;
    type: BlockType;
    title?: string;
    tags: string[];
    reorderable: boolean;
  };
  content: any[];
}

export interface BlockEditorState {
  blocks: SmartBlock[];
  metadata: SidecarMetadata;
  selectedBlockId?: string;
  isReorderMode: boolean;
  showBlocks: boolean;
  processingJobs: BlockProcessingJob[];
}

export interface BlockCommand {
  name: string;
  description: string;
  shortcut?: string;
  action: (blockId: string, options?: any) => Promise<void>;
  isAvailable: (block: SmartBlock) => boolean;
}

export interface BlockContextMenu {
  blockId: string;
  position: { x: number; y: number };
  items: BlockMenuItem[];
}

export interface BlockMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

// Event types for block operations
export interface BlockEvent {
  type: 'created' | 'updated' | 'deleted' | 'moved' | 'extracted' | 'reordered';
  blockId: string;
  timestamp: string;
  data?: any;
}

export interface BlockChangeEvent extends BlockEvent {
  type: 'updated';
  data: {
    oldContent: string;
    newContent: string;
    changedFields: string[];
  };
}

export interface BlockExtractionEvent extends BlockEvent {
  type: 'extracted';
  data: {
    targetNoteId: string;
    backlinkId?: string;
    options: BlockExtractionOptions;
  };
}

// Utility types
export type BlockId = string;
export type BlockTypeFilter = BlockType | 'all';
export type BlockSortOrder = 'position' | 'type' | 'title' | 'created' | 'updated' | 'length';

export interface BlockFilter {
  types?: BlockType[];
  tags?: string[];
  reorderable?: boolean;
  hasAI?: boolean;
  extracted?: boolean;
  search?: string;
}

export interface BlockSort {
  field: BlockSortOrder;
  direction: 'asc' | 'desc';
}

// AI Integration types
export interface BlockAIService {
  summarize(block: SmartBlock, options?: BlockSummarizationOptions): Promise<string>;
  embed(block: SmartBlock): Promise<number[]>;
  suggestReorder(blocks: SmartBlock[]): Promise<number[]>;
  suggestExtraction(block: SmartBlock): Promise<BlockAIResponse['extractionSuggestion']>;
  processBatch(jobs: BlockProcessingJob[]): Promise<BlockProcessingJob[]>;
}

export interface BlockVectorSearch {
  search(query: string, blocks: SmartBlock[], metadata: Record<string, BlockMetadata>): Promise<BlockSearchResult>;
  findSimilar(blockId: string, blocks: SmartBlock[], metadata: Record<string, BlockMetadata>): Promise<BlockMatchResult[]>;
  cluster(blocks: SmartBlock[], metadata: Record<string, BlockMetadata>): Promise<SmartBlock[][]>;
} 