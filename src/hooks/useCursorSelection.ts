import { useCallback, useRef, useState } from 'react';

export interface CursorPosition {
  line: number;
  ch: number;
}

export interface TextSelection {
  from: CursorPosition;
  to: CursorPosition;
  text: string;
}

export interface CursorSelectionHandlers {
  cursorPosition: CursorPosition | null;
  selection: TextSelection | null;
  setCursorPosition: (position: CursorPosition) => void;
  setSelection: (selection: TextSelection | null) => void;
  getTextAtPosition: (text: string, position: CursorPosition) => string;
  getPositionFromOffset: (text: string, offset: number) => CursorPosition;
  getOffsetFromPosition: (text: string, position: CursorPosition) => number;
  selectWordAtPosition: (text: string, position: CursorPosition) => TextSelection;
  selectLineAtPosition: (text: string, position: CursorPosition) => TextSelection;
  moveCursorBy: (text: string, currentPosition: CursorPosition, delta: { lines?: number; chars?: number }) => CursorPosition;
}

/**
 * Custom hook for managing cursor position and text selection
 * 
 * Provides:
 * - Cursor position tracking
 * - Text selection management
 * - Position/offset conversion utilities
 * - Word and line selection helpers
 * - Cursor movement utilities
 */
export const useCursorSelection = (): CursorSelectionHandlers => {
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const [selection, setSelection] = useState<TextSelection | null>(null);

  /**
   * Get character at specific position
   */
  const getTextAtPosition = useCallback((text: string, position: CursorPosition): string => {
    const lines = text.split('\n');
    if (position.line >= lines.length || position.line < 0) {
      return '';
    }
    
    const line = lines[position.line];
    if (position.ch >= line.length || position.ch < 0) {
      return '';
    }
    
    return line[position.ch];
  }, []);

  /**
   * Convert character offset to line/character position
   */
  const getPositionFromOffset = useCallback((text: string, offset: number): CursorPosition => {
    const lines = text.split('\n');
    let currentOffset = 0;
    
    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length + 1; // +1 for newline
      
      if (currentOffset + lineLength > offset) {
        return {
          line,
          ch: offset - currentOffset
        };
      }
      
      currentOffset += lineLength;
    }
    
    // If offset is beyond text length, return end position
    return {
      line: lines.length - 1,
      ch: lines[lines.length - 1]?.length || 0
    };
  }, []);

  /**
   * Convert line/character position to character offset
   */
  const getOffsetFromPosition = useCallback((text: string, position: CursorPosition): number => {
    const lines = text.split('\n');
    let offset = 0;
    
    for (let line = 0; line < position.line && line < lines.length; line++) {
      offset += lines[line].length + 1; // +1 for newline
    }
    
    offset += Math.min(position.ch, lines[position.line]?.length || 0);
    return offset;
  }, []);

  /**
   * Select word at given position
   */
  const selectWordAtPosition = useCallback((text: string, position: CursorPosition): TextSelection => {
    const lines = text.split('\n');
    if (position.line >= lines.length) {
      return { from: position, to: position, text: '' };
    }
    
    const line = lines[position.line];
    const char = line[position.ch];
    
    // If not on a word character, return empty selection
    if (!char || !/\w/.test(char)) {
      return { from: position, to: position, text: '' };
    }
    
    // Find word boundaries
    let start = position.ch;
    let end = position.ch;
    
    // Move backwards to find word start
    while (start > 0 && /\w/.test(line[start - 1])) {
      start--;
    }
    
    // Move forwards to find word end
    while (end < line.length && /\w/.test(line[end])) {
      end++;
    }
    
    const from = { line: position.line, ch: start };
    const to = { line: position.line, ch: end };
    const selectedText = line.substring(start, end);
    
    return { from, to, text: selectedText };
  }, []);

  /**
   * Select entire line at given position
   */
  const selectLineAtPosition = useCallback((text: string, position: CursorPosition): TextSelection => {
    const lines = text.split('\n');
    if (position.line >= lines.length) {
      return { from: position, to: position, text: '' };
    }
    
    const from = { line: position.line, ch: 0 };
    const to = { line: position.line, ch: lines[position.line].length };
    const selectedText = lines[position.line];
    
    return { from, to, text: selectedText };
  }, []);

  /**
   * Move cursor by specified delta
   */
  const moveCursorBy = useCallback((
    text: string, 
    currentPosition: CursorPosition, 
    delta: { lines?: number; chars?: number }
  ): CursorPosition => {
    const lines = text.split('\n');
    let newLine = currentPosition.line + (delta.lines || 0);
    let newCh = currentPosition.ch + (delta.chars || 0);
    
    // Clamp line to valid range
    newLine = Math.max(0, Math.min(newLine, lines.length - 1));
    
    // Clamp character to line length
    const maxCh = lines[newLine]?.length || 0;
    newCh = Math.max(0, Math.min(newCh, maxCh));
    
    return { line: newLine, ch: newCh };
  }, []);

  return {
    cursorPosition,
    selection,
    setCursorPosition,
    setSelection,
    getTextAtPosition,
    getPositionFromOffset,
    getOffsetFromPosition,
    selectWordAtPosition,
    selectLineAtPosition,
    moveCursorBy
  };
}; 