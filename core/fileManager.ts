import { SmartBlock, FileInfo, ProcessingStats } from './types';
import { BlockParser } from './blockParser';
import * as fs from 'fs';
import * as path from 'path';

export class FileManager {
  private static instance: FileManager;
  private blockParser: BlockParser;

  private constructor() {
    this.blockParser = BlockParser.getInstance();
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  /**
   * Read markdown file and parse smart blocks
   */
  async readMarkdownFile(filePath: string): Promise<{
    content: string;
    blocks: SmartBlock[];
    fileInfo: FileInfo;
  }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const blocks = this.blockParser.parseBlocksFromMarkdown(content);
      const stats = await fs.promises.stat(filePath);
      
      const fileInfo: FileInfo = {
        path: filePath,
        name: path.basename(filePath),
        size: stats.size,
        lastModified: stats.mtime,
        blockCount: blocks.length,
        metadataPath: this.getMetadataPath(filePath)
      };

      return { content, blocks, fileInfo };
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Write markdown file with smart blocks
   */
  async writeMarkdownFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Load metadata for a file
   */
  async loadMetadata(filePath: string): Promise<Record<string, any> | null> {
    const metadataPath = this.getMetadataPath(filePath);
    
    try {
      if (await this.fileExists(metadataPath)) {
        const content = await fs.promises.readFile(metadataPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`Failed to load metadata from ${metadataPath}: ${error}`);
    }
    
    return null;
  }

  /**
   * Save metadata for a file
   */
  async saveMetadata(filePath: string, metadata: Record<string, any>): Promise<void> {
    const metadataPath = this.getMetadataPath(filePath);
    
    try {
      // Ensure directory exists
      const dir = path.dirname(metadataPath);
      await this.ensureDirectoryExists(dir);
      
      await fs.promises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save metadata to ${metadataPath}: ${error}`);
    }
  }

  /**
   * Get metadata file path for a markdown file
   */
  getMetadataPath(filePath: string): string {
    const dir = path.dirname(filePath);
    const name = path.basename(filePath, path.extname(filePath));
    return path.join(dir, `${name}.metadata.json`);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Get all markdown files in a directory
   */
  async getMarkdownFiles(dirPath: string): Promise<FileInfo[]> {
    try {
      const files = await fs.promises.readdir(dirPath);
      const markdownFiles: FileInfo[] = [];

      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.markdown')) {
          const filePath = path.join(dirPath, file);
          const stats = await fs.promises.stat(filePath);
          
          // Quick parse to get block count
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const blocks = this.blockParser.parseBlocksFromMarkdown(content);

          markdownFiles.push({
            path: filePath,
            name: file,
            size: stats.size,
            lastModified: stats.mtime,
            blockCount: blocks.length,
            metadataPath: this.getMetadataPath(filePath)
          });
        }
      }

      return markdownFiles;
    } catch (error) {
      throw new Error(`Failed to read directory ${dirPath}: ${error}`);
    }
  }

  /**
   * Process multiple files and collect statistics
   */
  async processFiles(filePaths: string[]): Promise<{
    files: Array<{ path: string; blocks: SmartBlock[]; content: string }>;
    stats: ProcessingStats;
  }> {
    const startTime = Date.now();
    const files: Array<{ path: string; blocks: SmartBlock[]; content: string }> = [];
    let totalBlocks = 0;
    let errors = 0;
    let warnings = 0;
    let aiOperations = 0;

    for (const filePath of filePaths) {
      try {
        const { content, blocks } = await this.readMarkdownFile(filePath);
        files.push({ path: filePath, blocks, content });
        totalBlocks += blocks.length;
        
        // Count AI-generated blocks
        aiOperations += blocks.filter(b => b.aiGenerated).length;
      } catch (error) {
        errors++;
        console.error(`Error processing ${filePath}: ${error}`);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      files,
      stats: {
        totalFiles: filePaths.length,
        totalBlocks,
        processingTime,
        errors,
        warnings,
        aiOperations
      }
    };
  }

  /**
   * Create backup of a file
   */
  async createBackup(filePath: string): Promise<string> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    
    try {
      await fs.promises.copyFile(filePath, backupPath);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup of ${filePath}: ${error}`);
    }
  }

  /**
   * Restore file from backup
   */
  async restoreFromBackup(backupPath: string, targetPath: string): Promise<void> {
    try {
      await fs.promises.copyFile(backupPath, targetPath);
    } catch (error) {
      throw new Error(`Failed to restore from backup ${backupPath}: ${error}`);
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      throw new Error(`Failed to delete file ${filePath}: ${error}`);
    }
  }

  /**
   * Move file
   */
  async moveFile(sourcePath: string, targetPath: string): Promise<void> {
    try {
      await this.ensureDirectoryExists(path.dirname(targetPath));
      await fs.promises.rename(sourcePath, targetPath);
    } catch (error) {
      throw new Error(`Failed to move file from ${sourcePath} to ${targetPath}: ${error}`);
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    blockCount: number;
    wordCount: number;
    lineCount: number;
  }> {
    try {
      const stats = await fs.promises.stat(filePath);
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const blocks = this.blockParser.parseBlocksFromMarkdown(content);
      
      const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      const lineCount = content.split('\n').length;

      return {
        size: stats.size,
        lastModified: stats.mtime,
        blockCount: blocks.length,
        wordCount,
        lineCount
      };
    } catch (error) {
      throw new Error(`Failed to get stats for ${filePath}: ${error}`);
    }
  }

  /**
   * Search for files containing specific content
   */
  async searchFiles(dirPath: string, searchTerm: string): Promise<Array<{
    filePath: string;
    matches: Array<{ line: number; content: string }>;
  }>> {
    const files = await this.getMarkdownFiles(dirPath);
    const results: Array<{
      filePath: string;
      matches: Array<{ line: number; content: string }>;
    }> = [];

    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file.path, 'utf-8');
        const lines = content.split('\n');
        const matches: Array<{ line: number; content: string }> = [];

        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
            matches.push({
              line: index + 1,
              content: line.trim()
            });
          }
        });

        if (matches.length > 0) {
          results.push({
            filePath: file.path,
            matches
          });
        }
      } catch (error) {
        console.warn(`Failed to search in ${file.path}: ${error}`);
      }
    }

    return results;
  }
} 