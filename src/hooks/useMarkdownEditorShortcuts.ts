import { useCallback } from 'react';

interface UseMarkdownEditorShortcutsOptions {
  isPreview: boolean;
  setIsPreview: (val: boolean) => void;
}

export function useMarkdownEditorShortcuts({ isPreview, setIsPreview }: UseMarkdownEditorShortcutsOptions) {
  // Returns a handler for textarea keydown
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to toggle preview
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      setIsPreview(!isPreview);
    }
    // Escape to exit preview mode
    if (event.key === 'Escape' && isPreview) {
      setIsPreview(false);
    }
  }, [isPreview, setIsPreview]);

  return { handleKeyDown };
} 