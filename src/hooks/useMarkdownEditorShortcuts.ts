import { useCallback } from 'react';

interface UseMarkdownEditorShortcutsOptions {
  isPreview: boolean;
  setIsPreview: (isPreview: boolean) => void;
  isWYSIWYG?: boolean;
  setIsWYSIWYG?: (isWYSIWYG: boolean) => void;
  onChainedNoteRequest?: (hotkey: string) => void;
}

export function useMarkdownEditorShortcuts({ 
  isPreview, 
  setIsPreview, 
  isWYSIWYG = false, 
  setIsWYSIWYG,
  onChainedNoteRequest
}: UseMarkdownEditorShortcutsOptions) {
  // Returns a handler for textarea keydown
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to toggle preview
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isWYSIWYG) {
        setIsWYSIWYG?.(false);
        setIsPreview(false);
      } else {
        setIsPreview(!isPreview);
      }
    }
    
    // Ctrl/Cmd + Shift + Enter to toggle WYSIWYG
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      setIsWYSIWYG?.(!isWYSIWYG);
      setIsPreview(false);
    }
    
    // Escape to exit preview or WYSIWYG mode
    if (event.key === 'Escape' && (isPreview || isWYSIWYG)) {
      setIsPreview(false);
      setIsWYSIWYG?.(false);
    }

    // Note chaining shortcuts
    if (event.ctrlKey && event.shiftKey && event.key === 'N' && !event.altKey) {
      event.preventDefault();
      onChainedNoteRequest?.('Ctrl+Shift+N');
    }

    if (event.ctrlKey && event.altKey && event.key === 'N' && !event.shiftKey) {
      event.preventDefault();
      onChainedNoteRequest?.('Ctrl+Alt+N');
    }

    if (event.ctrlKey && event.shiftKey && event.altKey && event.key === 'N') {
      event.preventDefault();
      onChainedNoteRequest?.('Ctrl+Shift+Alt+N');
    }
  }, [isPreview, setIsPreview, isWYSIWYG, setIsWYSIWYG, onChainedNoteRequest]);

  return { handleKeyDown };
} 