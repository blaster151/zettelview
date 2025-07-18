import { useMemo } from 'react';
import { Note } from '../types/domain';
import { useInternalLinks } from './useInternalLinks';

export interface Backlink {
  noteId: string;
  noteTitle: string;
  context: string;
  linkText: string;
  position: {
    start: number;
    end: number;
  };
}

export interface BacklinkAnalysis {
  backlinks: Backlink[];
  totalBacklinks: number;
  uniqueSourceNotes: number;
  mostReferencedNote: string | null;
  backlinkDensity: number;
}

export interface BacklinkHandlers {
  getBacklinks: (noteId: string, notes: Note[]) => Backlink[];
  getBacklinkAnalysis: (noteId: string, notes: Note[]) => BacklinkAnalysis;
  findBacklinksToNote: (targetNoteTitle: string, notes: Note[]) => Backlink[];
  getBacklinkContext: (noteBody: string, linkMatch: RegExpMatchArray, contextLength?: number) => string;
}

/**
 * Custom hook for analyzing and managing backlinks between notes
 * 
 * Provides:
 * - Backlink detection and extraction
 * - Context analysis around backlinks
 * - Backlink statistics and metrics
 * - Flexible backlink search capabilities
 */
export const useBacklinks = (): BacklinkHandlers => {
  const { extractInternalLinks } = useInternalLinks();

  /**
   * Get all backlinks to a specific note
   */
  const getBacklinks = useMemo(() => (noteId: string, notes: Note[]): Backlink[] => {
    const targetNote = notes.find(note => note.id === noteId);
    if (!targetNote) return [];

    const backlinks: Backlink[] = [];
    const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;

    notes.forEach(note => {
      if (note.id === noteId) return; // Skip the current note

      let match;
      while ((match = internalLinkPattern.exec(note.body)) !== null) {
        const linkText = match[1];
        const linkId = linkText.includes('|') ? linkText.split('|')[1] : linkText;
        
        // Check if this link references our target note
        if (linkId === targetNote.title || linkId === noteId) {
          const context = getBacklinkContext(note.body, match);
          
          backlinks.push({
            noteId: note.id,
            noteTitle: note.title,
            context,
            linkText: match[0],
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    });

    return backlinks;
  }, []);

  /**
   * Get comprehensive backlink analysis
   */
  const getBacklinkAnalysis = useMemo(() => (noteId: string, notes: Note[]): BacklinkAnalysis => {
    const backlinks = getBacklinks(noteId, notes);
    
    // Calculate metrics
    const totalBacklinks = backlinks.length;
    const uniqueSourceNotes = new Set(backlinks.map(b => b.noteId)).size;
    
    // Find most referenced note (if any backlinks exist)
    const sourceNoteCounts: Record<string, number> = {};
    backlinks.forEach(backlink => {
      sourceNoteCounts[backlink.noteId] = (sourceNoteCounts[backlink.noteId] || 0) + 1;
    });
    
    const mostReferencedNote = Object.keys(sourceNoteCounts).length > 0
      ? Object.entries(sourceNoteCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : null;

    // Calculate backlink density (backlinks per note)
    const backlinkDensity = notes.length > 0 ? totalBacklinks / notes.length : 0;

    return {
      backlinks,
      totalBacklinks,
      uniqueSourceNotes,
      mostReferencedNote,
      backlinkDensity
    };
  }, [getBacklinks]);

  /**
   * Find backlinks to a specific note by title
   */
  const findBacklinksToNote = useMemo(() => (targetNoteTitle: string, notes: Note[]): Backlink[] => {
    const backlinks: Backlink[] = [];
    const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;

    notes.forEach(note => {
      let match;
      while ((match = internalLinkPattern.exec(note.body)) !== null) {
        const linkText = match[1];
        const linkId = linkText.includes('|') ? linkText.split('|')[1] : linkText;
        
        if (linkId === targetNoteTitle) {
          const context = getBacklinkContext(note.body, match);
          
          backlinks.push({
            noteId: note.id,
            noteTitle: note.title,
            context,
            linkText: match[0],
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      }
    });

    return backlinks;
  }, []);

  /**
   * Extract context around a backlink
   */
  const getBacklinkContext = useMemo(() => (
    noteBody: string, 
    linkMatch: RegExpMatchArray, 
    contextLength: number = 50
  ): string => {
    if (linkMatch.index === undefined) {
      return '';
    }
    
    const matchStart = Math.max(0, linkMatch.index - contextLength);
    const matchEnd = Math.min(noteBody.length, linkMatch.index + linkMatch[0].length + contextLength);
    
    let context = noteBody.substring(matchStart, matchEnd);
    
    // Add ellipsis if we're not at the beginning/end
    if (matchStart > 0) context = '...' + context;
    if (matchEnd < noteBody.length) context = context + '...';
    
    // Highlight the link in context
    context = context.replace(
      linkMatch[0],
      `**${linkMatch[0]}**`
    );

    return context;
  }, []);

  return {
    getBacklinks,
    getBacklinkAnalysis,
    findBacklinksToNote,
    getBacklinkContext
  };
}; 