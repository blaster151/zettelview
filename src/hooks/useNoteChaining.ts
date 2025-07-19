import { useCallback, useState, useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { noteChainingService, ChainingOptions, ChainedNote } from '../services/noteChainingService';
import { notificationService } from '../services/notificationService';
import { loggingService } from '../services/loggingService';

export interface UseNoteChainingOptions {
  defaultOptions?: ChainingOptions;
  onNoteCreated?: (note: ChainedNote) => void;
  onError?: (error: Error) => void;
}

export function useNoteChaining(options: UseNoteChainingOptions = {}) {
  const { addNote, updateNote, getNote } = useNoteStore();
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedNote, setLastCreatedNote] = useState<ChainedNote | null>(null);

  const defaultOptions: ChainingOptions = {
    inheritTags: true,
    addBacklink: true,
    sequentialId: true,
    autoTitle: true,
    idFormat: 'numeric',
    ...options.defaultOptions
  };

  /**
   * Create a chained note from the currently selected note
   */
  const createChainedNote = useCallback(async (
    parentNoteId: string,
    customOptions?: Partial<ChainingOptions>
  ): Promise<ChainedNote | null> => {
    setIsCreating(true);
    
    try {
      const parentNote = getNote(parentNoteId);
      if (!parentNote) {
        throw new Error(`Parent note with ID ${parentNoteId} not found`);
      }

      // Merge options
      const finalOptions = { ...defaultOptions, ...customOptions };
      
      // Validate options
      const validation = noteChainingService.validateOptions(finalOptions);
      if (!validation.isValid) {
        throw new Error(`Invalid options: ${validation.errors.join(', ')}`);
      }

      // Create chained note
      const chainedNote = noteChainingService.createChainedNote(parentNote, finalOptions);

      // Add to store
      await addNote(chainedNote.title, {
        id: chainedNote.id,
        body: chainedNote.body,
        tags: chainedNote.tags
      });

      // Update parent note with backlink if requested
      if (finalOptions.addBacklink) {
        const updatedParentBody = noteChainingService.updateParentWithChildLink(parentNote, chainedNote);
        await updateNote(parentNoteId, { body: updatedParentBody });
      }

      setLastCreatedNote(chainedNote);
      
      notificationService.success(
        'Chained Note Created',
        `Created "${chainedNote.title}" from "${parentNote.title}"`
      );

      options.onNoteCreated?.(chainedNote);
      
      loggingService.info('Chained note created successfully', {
        parentId: parentNoteId,
        newId: chainedNote.id,
        options: finalOptions
      });

      return chainedNote;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      loggingService.error('Failed to create chained note', error as Error);
      
      notificationService.error(
        'Chaining Failed',
        `Failed to create chained note: ${errorMessage}`
      );
      
      options.onError?.(error as Error);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [addNote, updateNote, getNote, defaultOptions, options]);

  /**
   * Create chained note with hotkey
   */
  const createChainedNoteWithHotkey = useCallback(async (
    parentNoteId: string,
    hotkey: string
  ): Promise<ChainedNote | null> => {
    // Different hotkeys can have different default options
    const hotkeyOptions: Record<string, Partial<ChainingOptions>> = {
      'Ctrl+Shift+N': { // Standard chaining
        inheritTags: true,
        addBacklink: true,
        sequentialId: true
      },
      'Ctrl+Alt+N': { // Quick chaining without backlink
        inheritTags: true,
        addBacklink: false,
        sequentialId: false
      },
      'Ctrl+Shift+Alt+N': { // Timestamp-based chaining
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        idFormat: 'timestamp'
      }
    };

    const options = hotkeyOptions[hotkey] || {};
    return createChainedNote(parentNoteId, options);
  }, [createChainedNote]);

  /**
   * Get chain information for a note
   */
  const getChainInfo = useCallback((noteId: string) => {
    const chainId = noteChainingService.getChainForNote(noteId);
    if (!chainId) return null;

    const chainNotes = noteChainingService.getChainNotes(chainId);
    const notes = chainNotes.map(id => getNote(id)).filter(Boolean);
    
    return {
      chainId,
      notes,
      count: notes.length,
      parentNote: notes.find(note => note?.id === noteId)
    };
  }, [getNote]);

  /**
   * Get all chains
   */
  const getAllChains = useCallback(() => {
    const chains = noteChainingService.getAllChains();
    const chainInfo = Array.from(chains.entries()).map(([chainId, noteIds]) => {
      const notes = noteIds.map(id => getNote(id)).filter(Boolean);
      return {
        chainId,
        notes,
        count: notes.length,
        parentNote: notes[0] // First note in chain is typically the parent
      };
    });
    
    return chainInfo;
  }, [getNote]);

  /**
   * Quick chain creation with minimal options
   */
  const quickChain = useCallback(async (parentNoteId: string): Promise<ChainedNote | null> => {
    return createChainedNote(parentNoteId, {
      inheritTags: true,
      addBacklink: true,
      sequentialId: true,
      autoTitle: true
    });
  }, [createChainedNote]);

  return {
    createChainedNote,
    createChainedNoteWithHotkey,
    quickChain,
    getChainInfo,
    getAllChains,
    isCreating,
    lastCreatedNote,
    defaultOptions
  };
} 