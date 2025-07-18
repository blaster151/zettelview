// Platform/infra layer: Encapsulates browser-only File System Access API logic.
// If adding backend/server logic (e.g., SQLite, Express), create a separate service under server/ or services/.
// This makes hybrid/SSR/desktop support easier to maintain.

import { Note } from '../types/domain';
import { SecurityValidator, SecurityError, SecurityMonitor } from '../utils/securityUtils';

export interface FileStorageService {
  initialize(): Promise<void>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  saveNote(note: Note): Promise<void>;
  loadNote(id: string): Promise<Note | null>;
  loadAllNotes(): Promise<Note[]>;
  deleteNote(id: string): Promise<void>;
  exportNotes(): Promise<string>;
  importNotes(data: string): Promise<void>;
}

class FileSystemStorageService implements FileStorageService {
  private notesHandle: FileSystemDirectoryHandle | null = null;
  private securityValidator: SecurityValidator;
  private securityMonitor: SecurityMonitor;

  constructor() {
    this.securityValidator = new SecurityValidator();
    this.securityMonitor = SecurityMonitor.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      // Check if we already have permission
      const hasPermission = await this.hasPermission();
      if (hasPermission) {
        // Try to get the existing directory handle
        this.notesHandle = await navigator.storage.getDirectory();
        const notesDir = await this.notesHandle.getDirectoryHandle('notes', { create: true });
        this.notesHandle = notesDir;
      }
    } catch (error) {
      console.error('Failed to initialize file storage:', error);
      this.securityMonitor.logViolation('INITIALIZATION_FAILED', { error }, 'medium');
    }
  }

  async hasPermission(): Promise<boolean> {
    try {
      const permission = await navigator.permissions.query({ name: 'persistent-storage' as PermissionName });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Permission check failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await navigator.storage.persist();
      if (permission) {
        await this.initialize();
      }
      return permission;
    } catch (error) {
      console.error('Failed to request storage permission:', error);
      this.securityMonitor.logViolation('PERMISSION_REQUEST_FAILED', { error }, 'medium');
      return false;
    }
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.notesHandle) {
      throw new Error('Notes directory not initialized');
    }

    try {
      // Validate note before saving
      this.securityValidator.validateNote(note);
      
      const filename = `${note.id}.md`;
      const fileHandle = await this.notesHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Create frontmatter for metadata
      const frontmatter = `---
title: "${this.escapeYamlString(note.title)}"
created: "${note.createdAt.toISOString()}"
updated: "${note.updatedAt.toISOString()}"
tags: ${JSON.stringify(note.tags)}
---

`;
      
      const content = frontmatter + note.body;
      
      // Validate file size before writing
      const contentSize = new Blob([content]).size;
      this.securityValidator.validateFileSize(contentSize);
      
      await writable.write(content);
      await writable.close();
    } catch (error) {
      if (error instanceof SecurityError) {
        this.securityMonitor.logViolation('SECURITY_VIOLATION', { 
          noteId: note.id, 
          error: error.code, 
          details: error.details 
        }, 'high');
        throw new Error(`Security violation: ${error.message}`);
      }
      
      this.securityMonitor.logViolation('SAVE_FAILED', { noteId: note.id, error }, 'medium');
      throw error;
    }
  }

  async loadNote(id: string): Promise<Note | null> {
    if (!this.notesHandle) {
      return null;
    }

    try {
      const filename = `${id}.md`;
      const fileHandle = await this.notesHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      
      // Validate file size before reading
      this.securityValidator.validateFileSize(file.size);
      
      const content = await file.text();
      
      // Additional validation for content length
      if (content.length > this.securityValidator['config'].maxBodyLength) {
        throw new SecurityError(
          `Content length (${content.length}) exceeds maximum allowed length`,
          'CONTENT_TOO_LONG',
          { length: content.length }
        );
      }
      
      return this.parseNoteFromFile(content, id);
    } catch (error) {
      if (error instanceof SecurityError) {
        this.securityMonitor.logViolation('SECURITY_VIOLATION', { 
          noteId: id, 
          error: error.code, 
          details: error.details 
        }, 'high');
        console.warn(`Security violation loading note ${id}:`, error.message);
        return null;
      }
      
      console.warn(`Failed to load note ${id}:`, error);
      this.securityMonitor.logViolation('LOAD_FAILED', { noteId: id, error }, 'low');
      return null;
    }
  }

  async loadAllNotes(): Promise<Note[]> {
    if (!this.notesHandle) {
      return [];
    }

    try {
      const notes: Note[] = [];
      let processedCount = 0;
      const maxNotesToProcess = 1000; // Prevent infinite loops
      
      for await (const entry of this.notesHandle.entries()) {
        if (processedCount >= maxNotesToProcess) {
          this.securityMonitor.logViolation('TOO_MANY_FILES', { 
            processed: processedCount, 
            max: maxNotesToProcess 
          }, 'medium');
          break;
        }
        
        if (entry[1].kind === 'file' && entry[0].endsWith('.md')) {
          try {
            const file = await entry[1].getFile();
            
            // Validate file size
            this.securityValidator.validateFileSize(file.size);
            
            const content = await file.text();
            const id = entry[0].replace('.md', '');
            
            // Additional validation for content length
            if (content.length > this.securityValidator['config'].maxBodyLength) {
              this.securityMonitor.logViolation('CONTENT_TOO_LONG', { 
                noteId: id, 
                length: content.length 
              }, 'medium');
              continue;
            }
            
            const note = this.parseNoteFromFile(content, id);
            
            if (note) {
              // Validate parsed note
              try {
                this.securityValidator.validateNote(note);
                notes.push(note);
              } catch (validationError) {
                this.securityMonitor.logViolation('VALIDATION_FAILED', { 
                  noteId: id, 
                  error: validationError 
                }, 'medium');
              }
            }
            
            processedCount++;
          } catch (error) {
            this.securityMonitor.logViolation('LOAD_FAILED', { 
              filename: entry[0], 
              error 
            }, 'low');
          }
        }
      }
      
      return notes;
    } catch (error) {
      this.securityMonitor.logViolation('BULK_LOAD_FAILED', { error }, 'high');
      return [];
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.notesHandle) {
      throw new Error('Notes directory not initialized');
    }

    try {
      const filename = `${id}.md`;
      await this.notesHandle.removeEntry(filename);
    } catch (error) {
      console.error('Failed to delete note:', error);
      this.securityMonitor.logViolation('DELETE_FAILED', { noteId: id, error }, 'medium');
      throw error;
    }
  }

  async exportNotes(): Promise<string> {
    try {
      const notes = await this.loadAllNotes();
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        notes: notes.map(note => ({
          id: note.id,
          title: note.title,
          body: note.body,
          tags: note.tags,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString()
        }))
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export notes:', error);
      this.securityMonitor.logViolation('EXPORT_FAILED', { error }, 'medium');
      throw error;
    }
  }

  async importNotes(data: string): Promise<void> {
    try {
      // Validate import data size
      const dataSize = new Blob([data]).size;
      this.securityValidator.validateFileSize(dataSize);
      
      const importData = JSON.parse(data);
      
      if (!importData.notes || !Array.isArray(importData.notes)) {
        throw new Error('Invalid import data format');
      }
      
      // Validate each note before importing
      for (const noteData of importData.notes) {
        try {
          this.securityValidator.validateNote(noteData);
        } catch (validationError) {
          this.securityMonitor.logViolation('IMPORT_VALIDATION_FAILED', { 
            noteData, 
            error: validationError 
          }, 'medium');
          continue;
        }
        
        const note: Note = {
          id: noteData.id,
          title: noteData.title,
          body: noteData.body,
          tags: noteData.tags || [],
          createdAt: new Date(noteData.createdAt),
          updatedAt: new Date(noteData.updatedAt)
        };
        
        await this.saveNote(note);
      }
    } catch (error) {
      this.securityMonitor.logViolation('IMPORT_FAILED', { error }, 'high');
      throw error;
    }
  }

  private parseNoteFromFile(content: string, id: string): Note | null {
    try {
      // Validate content length
      if (content.length > this.securityValidator['config'].maxBodyLength) {
        throw new SecurityError(
          `Content length (${content.length}) exceeds maximum allowed length`,
          'CONTENT_TOO_LONG',
          { length: content.length }
        );
      }
      
      // Parse frontmatter with timeout protection
      const frontmatterMatch = this.parseWithTimeout(() => 
        content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/), 
        5000
      );
      
      if (frontmatterMatch) {
        const [, frontmatter, body] = frontmatterMatch;
        const metadata = this.parseFrontmatter(frontmatter);
        
        const note: Note = {
          id,
          title: metadata.title || id,
          body: body.trim(),
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          createdAt: new Date(metadata.created || Date.now()),
          updatedAt: new Date(metadata.updated || Date.now()),
        };
        
        // Validate the parsed note
        this.securityValidator.validateNote(note);
        return note;
      } else {
        // No frontmatter, treat entire content as body
        const note: Note = {
          id,
          title: id,
          body: content.trim(),
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Validate the parsed note
        this.securityValidator.validateNote(note);
        return note;
      }
    } catch (error) {
      if (error instanceof SecurityError) {
        this.securityMonitor.logViolation('PARSE_SECURITY_VIOLATION', { 
          noteId: id, 
          error: error.code, 
          details: error.details 
        }, 'high');
        throw error;
      }
      
      console.error('Failed to parse note from file:', error);
      this.securityMonitor.logViolation('PARSE_FAILED', { noteId: id, error }, 'medium');
      return null;
    }
  }

  private parseFrontmatter(frontmatter: string): Record<string, any> {
    const metadata: Record<string, any> = {};
    const lines = frontmatter.split('\n');
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(': ');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(': ').replace(/^"|"$/g, '');
        
        // Validate key and value lengths
        if (key.length > 100 || value.length > 10000) {
          throw new SecurityError(
            'Frontmatter key or value too long',
            'FRONTMATTER_TOO_LONG',
            { key: key.length, value: value.length }
          );
        }
        
        metadata[key.trim()] = value;
      }
    }
    
    return metadata;
  }

  private parseWithTimeout<T>(fn: () => T, timeoutMs: number): T {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Parse operation timed out'));
      }, timeoutMs);

      try {
        const result = fn();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    }) as T;
  }

  private escapeYamlString(str: string): string {
    // Escape special characters in YAML strings
    return str.replace(/"/g, '\\"').replace(/\n/g, '\\n');
  }
}

export const fileStorageService = new FileSystemStorageService(); 