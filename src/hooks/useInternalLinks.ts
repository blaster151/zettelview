import { useCallback, useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { notificationService } from '../services/notificationService';

// Constants
const INTERNAL_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;

export interface ParsedLink {
  type: 'text' | 'link';
  content: string;
  noteTitle?: string;
}

export interface InternalLinkHandlers {
  parseInternalLinks: (text: string) => ParsedLink[];
  handleInternalLinkClick: (noteTitle: string) => Promise<void>;
  isValidInternalLink: (text: string) => boolean;
  extractInternalLinks: (text: string) => string[];
}

/**
 * Custom hook for handling internal links in markdown content
 * 
 * Provides:
 * - Parsing internal links from text
 * - Handling internal link clicks with navigation
 * - Validation of internal link format
 * - Extraction of all internal links from text
 */
export const useInternalLinks = (): InternalLinkHandlers => {
  const { findOrCreateNote, selectNote } = useNoteStore();

  /**
   * Parse internal links from text and return structured parts
   */
  const parseInternalLinks = useCallback((text: string): ParsedLink[] => {
    const parts: ParsedLink[] = [];
    let lastIndex = 0;
    let match;

    while ((match = INTERNAL_LINK_PATTERN.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }

      // Add the internal link
      parts.push({
        type: 'link',
        content: match[0],
        noteTitle: match[1].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }

    return parts;
  }, []);

  /**
   * Handle internal link click with navigation
   */
  const handleInternalLinkClick = useCallback(async (noteTitle: string) => {
    try {
      const noteId = await findOrCreateNote(noteTitle);
      selectNote(noteId);
    } catch (error) {
      console.error('Failed to handle internal link:', error);
      notificationService.error(
        'Link Navigation Failed',
        `Unable to navigate to "${noteTitle}". Please try again or create the note manually.`
      );
    }
  }, [findOrCreateNote, selectNote]);

  /**
   * Validate if a string matches internal link format
   */
  const isValidInternalLink = useCallback((text: string): boolean => {
    return INTERNAL_LINK_PATTERN.test(text);
  }, []);

  /**
   * Extract all internal link titles from text
   */
  const extractInternalLinks = useCallback((text: string): string[] => {
    const links: string[] = [];
    let match;

    while ((match = INTERNAL_LINK_PATTERN.exec(text)) !== null) {
      links.push(match[1].trim());
    }

    return links;
  }, []);

  return {
    parseInternalLinks,
    handleInternalLinkClick,
    isValidInternalLink,
    extractInternalLinks
  };
}; 