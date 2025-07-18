import { useState, useCallback, useRef, useEffect } from 'react';

export interface SaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

export interface UseAutoSaveOptions {
  debounceMs?: number;
  onSave: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
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
    if (JSON.stringify(dataToSave) === JSON.stringify(lastDataRef.current)) {
      return; // No changes to save
    }

    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(dataToSave);
      lastDataRef.current = dataToSave;
      setLastSaved(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSaving(false);
    }
  }, [onSave, onError]);

  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await saveData(data);
  }, [data, saveData]);

  // Auto-save on data changes
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    lastSaved,
    error,
    saveNow
  };
} 