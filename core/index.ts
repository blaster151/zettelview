// Core module exports for Zettelkasten application
// Shared between CLI and GUI

export * from './types';
export * from './blockParser';
export * from './fileManager';
export * from './summaryEngine';

// Re-export singleton instances for convenience
import { BlockParser } from './blockParser';
import { FileManager } from './fileManager';
import { SummaryEngine } from './summaryEngine';

export const blockParser = BlockParser.getInstance();
export const fileManager = FileManager.getInstance();
export const summaryEngine = SummaryEngine.getInstance(); 