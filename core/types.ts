// Core types for the Zettelkasten application
// Shared between CLI and GUI

export interface SmartBlock {
  id: string;
  type: 'note' | 'summary' | 'extract' | 'embedding' | 'custom';
  content: string;
  metadata: SmartBlockMetadata;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  parentId?: string;
  children: string[];
  position: number;
  extractedFrom?: string;
  aiGenerated: boolean;
  confidence?: number;
  version: number;
}

export interface SmartBlockMetadata {
  title?: string;
  description?: string;
  keywords: string[];
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'active' | 'archived' | 'deleted';
  customFields: Record<string, any>;
  aiMetadata: AIMetadata;
  relationships: BlockRelationship[];
  usage: UsageStats;
}

export interface AIMetadata {
  summary?: string;
  embedding?: number[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics: string[];
  entities: string[];
  keywords: string[];
  readability: ReadabilityMetrics;
  lastProcessed: Date;
  processingVersion: string;
}

export interface ReadabilityMetrics {
  fleschKincaid: number;
  gunningFog: number;
  colemanLiau: number;
  smog: number;
  automatedReadability: number;
  averageGrade: number;
}

export interface BlockRelationship {
  targetId: string;
  type: 'references' | 'similar' | 'parent' | 'child' | 'related';
  strength: number;
  bidirectional: boolean;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  viewCount: number;
  editCount: number;
  extractCount: number;
  lastViewed: Date;
  lastEdited: Date;
  popularity: number;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  model: string;
  confidence: number;
  suggestions: string[];
}

export interface BlockExtractionResult {
  extractedBlocks: SmartBlock[];
  remainingContent: string;
  extractionStats: {
    totalBlocks: number;
    successfulExtractions: number;
    failedExtractions: number;
    processingTime: number;
  };
}

export interface BlockReorderResult {
  reorderedBlocks: SmartBlock[];
  reorderSuggestions: ReorderSuggestion[];
  confidence: number;
  reasoning: string;
}

export interface ReorderSuggestion {
  blockId: string;
  suggestedPosition: number;
  reason: string;
  confidence: number;
}

export interface EditorState {
  blocks: SmartBlock[];
  selectedBlocks: string[];
  activeBlock?: string;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: Date;
}

export interface BlockCommand {
  type: 'create' | 'update' | 'delete' | 'extract' | 'reorder' | 'summarize';
  blockId?: string;
  data?: any;
  metadata?: Record<string, any>;
}

export interface BlockEvent {
  type: 'blockCreated' | 'blockUpdated' | 'blockDeleted' | 'blockExtracted' | 'blockReordered';
  blockId: string;
  timestamp: Date;
  data?: any;
  userId?: string;
}

export interface SmartBlocksConfig {
  enabled: boolean;
  autoSave: boolean;
  autoSummarize: boolean;
  aiEnabled: boolean;
  maxBlocksPerFile: number;
  supportedTypes: string[];
  metadataPath: string;
  backupEnabled: boolean;
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'length' | 'custom';
  value?: any;
  message: string;
}

export interface ProcessingOptions {
  includeMetadata: boolean;
  validateContent: boolean;
  generateEmbeddings: boolean;
  updateRelationships: boolean;
  backupOriginal: boolean;
  notifyOnCompletion: boolean;
}

export interface SearchFilters {
  types?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  priority?: string[];
  aiGenerated?: boolean;
  content?: string;
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'priority' | 'popularity' | 'position';
  direction: 'asc' | 'desc';
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
  results: any[];
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  lastModified: Date;
  blockCount: number;
  metadataPath?: string;
}

export interface ProcessingStats {
  totalFiles: number;
  totalBlocks: number;
  processingTime: number;
  errors: number;
  warnings: number;
  aiOperations: number;
} 