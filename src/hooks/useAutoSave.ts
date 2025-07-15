import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions
): SaveStatus & { saveNow: () => Promise<void> } {
  const { debounceMs = 1000, onSave, onError } = options;
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(data);

  const saveData = useCallback(async (dataToSave: T) => {
    console.log('🔄 saveData called with:', dataToSave);
    console.log('📊 lastDataRef.current:', lastDataRef.current);
    
    if (JSON.stringify(dataToSave) === JSON.stringify(lastDataRef.current)) {
      console.log('⏭️ Skipping save - no changes detected');
      return; // No changes to save
    }

    console.log('💾 Starting save operation');
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('📞 Calling onSave function');
      await onSave(dataToSave);
      console.log('✅ onSave completed successfully');
      lastDataRef.current = dataToSave;
      setLastSaved(new Date());
      console.log('📅 Updated lastSaved timestamp');
    } catch (err) {
      console.log('❌ Save failed with error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      console.log('🏁 Setting isSaving to false');
      setIsSaving(false);
    }
  }, [onSave, onError]);

  const saveNow = useCallback(async () => {
    console.log('🚀 saveNow called with data:', data);
    if (timeoutRef.current) {
      console.log('⏰ Clearing existing timeout');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    console.log('📞 Calling saveData');
    await saveData(data);
    console.log('✅ saveNow completed');
  }, [data, saveData]);

  // Debounced auto-save
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveData(data);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, saveData]);

  // Handle Ctrl+S manual save
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveNow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveNow]);

  return {
    isSaving,
    lastSaved,
    error,
    saveNow
  };
} 