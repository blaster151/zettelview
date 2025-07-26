import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUIStore } from './uiStore';

// Reset the store before each test
beforeEach(() => {
  // Clear localStorage to reset persist state
  localStorage.clear();
});

describe('UIStore', () => {
  test('should initialize with default values', () => {
    const { result } = renderHook(() => useUIStore());
    
    expect(result.current.viewMode).toBe('editor');
    expect(result.current.selectedNoteId).toBe(null);
    expect(result.current.showAISummaryPanel).toBe(false);
    expect(result.current.showExportImport).toBe(false);
  });

  test('should set view mode', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.setViewMode('graph');
    });
    
    expect(result.current.viewMode).toBe('graph');
  });

  test('should toggle view mode', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.toggleViewMode();
    });
    
    expect(result.current.viewMode).toBe('graph');
    
    act(() => {
      result.current.toggleViewMode();
    });
    
    expect(result.current.viewMode).toBe('calendar');
  });

  test('should set selected note id', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.setSelectedNoteId('test-note-id');
    });
    
    expect(result.current.selectedNoteId).toBe('test-note-id');
  });

  test('should open and close modals', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.openAISummaryPanel();
    });
    
    expect(result.current.showAISummaryPanel).toBe(true);
    
    act(() => {
      result.current.closeAISummaryPanel();
    });
    
    expect(result.current.showAISummaryPanel).toBe(false);
  });

  test('should close other modals when opening a new one', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.openAISummaryPanel();
    });
    
    expect(result.current.showAISummaryPanel).toBe(true);
    
    act(() => {
      result.current.openExportImport();
    });
    
    expect(result.current.showAISummaryPanel).toBe(false);
    expect(result.current.showExportImport).toBe(true);
  });

  test('should reset all modals', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.openAISummaryPanel();
      result.current.openExportImport();
    });
    
    expect(result.current.showAISummaryPanel).toBe(false);
    expect(result.current.showExportImport).toBe(true);
    
    act(() => {
      result.current.resetModals();
    });
    
    expect(result.current.showAISummaryPanel).toBe(false);
    expect(result.current.showExportImport).toBe(false);
  });
});

describe('Persist Middleware', () => {
  test('should persist viewMode to localStorage', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.setViewMode('graph');
    });
    
    const persisted = localStorage.getItem('zettelview-ui');
    expect(persisted).toContain('graph');
  });

  test('should persist selectedNoteId to localStorage', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.setSelectedNoteId('test-note-id');
    });
    
    const persisted = localStorage.getItem('zettelview-ui');
    expect(persisted).toContain('test-note-id');
  });

  test('should restore viewMode from localStorage on initialization', () => {
    // Set up localStorage with persisted data
    localStorage.setItem('zettelview-ui', JSON.stringify({
      state: { viewMode: 'calendar' },
      version: 0
    }));
    
    const { result } = renderHook(() => useUIStore());
    
    expect(result.current.viewMode).toBe('calendar');
  });

  test('should restore selectedNoteId from localStorage on initialization', () => {
    // Set up localStorage with persisted data
    localStorage.setItem('zettelview-ui', JSON.stringify({
      state: { selectedNoteId: 'persisted-note-id' },
      version: 0
    }));
    
    const { result } = renderHook(() => useUIStore());
    
    expect(result.current.selectedNoteId).toBe('persisted-note-id');
  });

  test('should not persist modal states to localStorage', () => {
    const { result } = renderHook(() => useUIStore());
    
    act(() => {
      result.current.openAISummaryPanel();
    });
    
    const persisted = localStorage.getItem('zettelview-ui');
    const parsed = JSON.parse(persisted || '{}');
    
    // Should not contain modal states
    expect(parsed.state.showAISummaryPanel).toBeUndefined();
  });
}); 