import { Note } from '../store/noteStore';

export interface FileStorageService {
  initialize(): Promise<void>;
  saveNote(note: Note): Promise<void>;
  loadNote(id: string): Promise<Note | null>;
  loadAllNotes(): Promise<Note[]>;
  deleteNote(id: string): Promise<void>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}

class FileSystemStorageService implements FileStorageService {
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private notesHandle: FileSystemDirectoryHandle | null = null;

  async initialize(): Promise<void> {
    try {
      // Check if we already have permission
      if (await this.hasPermission()) {
        await this.openNotesDirectory();
      }
    } catch (error) {
      console.warn('File system access not available:', error);
    }
  }

  async hasPermission(): Promise<boolean> {
    if (!this.rootHandle) {
      return false;
    }
    
    try {
      const permission = await this.rootHandle.queryPermission({ mode: 'readwrite' });
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      // Request permission to access the file system
      this.rootHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      // Create or get the notes directory
      await this.openNotesDirectory();
      
      return true;
    } catch (error) {
      console.error('Failed to get file system permission:', error);
      return false;
    }
  }

  private async openNotesDirectory(): Promise<void> {
    if (!this.rootHandle) {
      throw new Error('No root directory handle');
    }

    try {
      this.notesHandle = await this.rootHandle.getDirectoryHandle('zettelview-notes', { create: true });
    } catch (error) {
      console.error('Failed to create/open notes directory:', error);
      throw error;
    }
  }

  async saveNote(note: Note): Promise<void> {
    if (!this.notesHandle) {
      throw new Error('Notes directory not initialized');
    }

    try {
      const filename = `${note.id}.md`;
      const fileHandle = await this.notesHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Create frontmatter for metadata
      const frontmatter = `---
title: "${note.title}"
created: "${note.createdAt.toISOString()}"
updated: "${note.updatedAt.toISOString()}"
---

`;
      
      await writable.write(frontmatter + note.body);
      await writable.close();
    } catch (error) {
      console.error('Failed to save note:', error);
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
      const content = await file.text();
      
      return this.parseNoteFromFile(content, id);
    } catch (error) {
      console.warn(`Failed to load note ${id}:`, error);
      return null;
    }
  }

  async loadAllNotes(): Promise<Note[]> {
    if (!this.notesHandle) {
      return [];
    }

    try {
      const notes: Note[] = [];
      
      for await (const entry of this.notesHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          try {
            const file = await entry.getFile();
            const content = await file.text();
            const id = entry.name.replace('.md', '');
            const note = this.parseNoteFromFile(content, id);
            
            if (note) {
              notes.push(note);
            }
          } catch (error) {
            console.warn(`Failed to load note ${entry.name}:`, error);
          }
        }
      }
      
      return notes;
    } catch (error) {
      console.error('Failed to load notes:', error);
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
      throw error;
    }
  }

  private parseNoteFromFile(content: string, id: string): Note | null {
    try {
      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (frontmatterMatch) {
        const [, frontmatter, body] = frontmatterMatch;
        const lines = frontmatter.split('\n');
        const metadata: Record<string, string> = {};
        
        for (const line of lines) {
          const [key, ...valueParts] = line.split(': ');
          if (key && valueParts.length > 0) {
            metadata[key.trim()] = valueParts.join(': ').replace(/^"|"$/g, '');
          }
        }
        
        return {
          id,
          title: metadata.title || id,
          body: body.trim(),
          tags: Array.isArray(metadata.tags) ? metadata.tags : [],
          createdAt: new Date(metadata.created || Date.now()),
          updatedAt: new Date(metadata.updated || Date.now()),
        };
      } else {
        // No frontmatter, treat entire content as body
        return {
          id,
          title: id,
          body: content.trim(),
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    } catch (error) {
      console.error('Failed to parse note from file:', error);
      return null;
    }
  }
}

// Fallback service for when File System Access API is not available
class MemoryStorageService implements FileStorageService {
  private notes: Map<string, Note> = new Map();

  async initialize(): Promise<void> {
    // Nothing to initialize for memory storage
  }

  async hasPermission(): Promise<boolean> {
    return true; // Always available
  }

  async requestPermission(): Promise<boolean> {
    return true; // Always available
  }

  async saveNote(note: Note): Promise<void> {
    this.notes.set(note.id, { ...note });
  }

  async loadNote(id: string): Promise<Note | null> {
    return this.notes.get(id) || null;
  }

  async loadAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
  }
}

// Factory function to create the appropriate storage service
export function createFileStorageService(): FileStorageService {
  if ('showDirectoryPicker' in window) {
    return new FileSystemStorageService();
  } else {
    console.warn('File System Access API not available, using memory storage');
    return new MemoryStorageService();
  }
}

export const fileStorageService = createFileStorageService(); 