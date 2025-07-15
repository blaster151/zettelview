import { renderHook, act, waitFor } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

describe('useAutoSave', () => {
  const mockOnSave = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should not save immediately on mount', () => {
    renderHook(() => useAutoSave('test data', {
      onSave: mockOnSave,
      debounceMs: 1000
    }));

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  test('should save after debounce delay', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, {
        onSave: mockOnSave,
        debounceMs: 1000
      }),
      { initialProps: { data: 'test data' } }
    );

    // Change data
    rerender({ data: 'new data' });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('new data');
    });
  });

  test('should reset debounce timer on data change', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, {
        onSave: mockOnSave,
        debounceMs: 1000
      }),
      { initialProps: { data: 'initial data' } }
    );

    // Change data before timer completes
    act(() => {
      jest.advanceTimersByTime(500);
    });

    rerender({ data: 'updated data' });

    // Timer should reset
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockOnSave).not.toHaveBeenCalled();

    // Complete the new timer
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('updated data');
    });
  });

  test('should handle manual save with saveNow', async () => {
    console.log('🚀 Starting manual save test');
    mockOnSave.mockResolvedValue(undefined);

    console.log('📝 Creating renderHook');
    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, {
        onSave: mockOnSave,
        debounceMs: 1000
      }),
      { initialProps: { data: 'initial data' } }
    );

    console.log('💾 Calling first saveNow');
    // First save should work
    await act(async () => {
      console.log('🔄 Inside first act block');
      await result.current.saveNow();
      console.log('✅ First saveNow completed');
    });

    console.log('⏳ Waiting for first save to complete');
    await waitFor(() => {
      console.log('🔍 Checking first save expectations');
      expect(mockOnSave).toHaveBeenCalledWith('initial data');
    });

    console.log('🔄 Changing data and calling second saveNow');
    // Change data and save again
    rerender({ data: 'new data' });
    
    await act(async () => {
      console.log('🔄 Inside second act block');
      await result.current.saveNow();
      console.log('✅ Second saveNow completed');
    });

    console.log('⏳ Waiting for second save to complete');
    await waitFor(() => {
      console.log('🔍 Checking second save expectations');
      expect(mockOnSave).toHaveBeenCalledWith('new data');
      expect(mockOnSave).toHaveBeenCalledTimes(2);
    });

    console.log('🎉 Test completed successfully');
  });

  test('should clear debounce timer on manual save', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, {
        onSave: mockOnSave,
        debounceMs: 1000
      }),
      { initialProps: { data: 'initial data' } }
    );

    // Start debounce timer
    rerender({ data: 'new data' });

    // Manual save before timer completes
    await act(async () => {
      await result.current.saveNow();
    });

    // Fast-forward past the original timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should only have been called once (manual save)
    expect(mockOnSave).toHaveBeenCalledTimes(1);
  });

  test('should handle save errors', async () => {
    const saveError = new Error('Save failed');
    mockOnSave.mockRejectedValue(saveError);

    const { result } = renderHook(() => useAutoSave('error test data', {
      onSave: mockOnSave,
      onError: mockOnError,
      debounceMs: 1000
    }));

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(saveError);
      expect(result.current.error).toBe('Save failed');
    });
  });

  test('should not save if data has not changed', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, {
        onSave: mockOnSave,
        debounceMs: 1000
      }),
      { initialProps: { data: 'initial data' } }
    );

    // First save
    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    // Try to save the same data again
    await act(async () => {
      await result.current.saveNow();
    });

    // Should still only be called once (no change in data)
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });

    // Now change the data and save
    rerender({ data: 'new data' });
    
    await act(async () => {
      await result.current.saveNow();
    });

    // Should be called twice now
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(2);
      expect(mockOnSave).toHaveBeenLastCalledWith('new data');
    });
  });

  test('should handle Ctrl+S keyboard shortcut', async () => {
    mockOnSave.mockResolvedValue(undefined);

    renderHook(() => useAutoSave('test data', {
      onSave: mockOnSave,
      debounceMs: 1000
    }));

    // Simulate Ctrl+S
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('test data');
    });
  });

  test('should handle Cmd+S keyboard shortcut (Mac)', async () => {
    mockOnSave.mockResolvedValue(undefined);

    mockOnSave.mockResolvedValue(undefined);

    renderHook(() => useAutoSave('test data', {
      onSave: mockOnSave,
      debounceMs: 1000
    }));

    // Simulate Cmd+S
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true
      });
      document.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith('test data');
    });
  });

  test('should prevent default on Ctrl+S', async () => {
    mockOnSave.mockResolvedValue(undefined);

    renderHook(() => useAutoSave('test data', {
      onSave: mockOnSave,
      debounceMs: 1000
    }));

    // Simulate Ctrl+S
    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    });

    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    act(() => {
      document.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('should update lastSaved on successful save', async () => {
    mockOnSave.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAutoSave('lastSaved test data', {
      onSave: mockOnSave,
      debounceMs: 1000
    }));

    expect(result.current.lastSaved).toBeNull();

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(result.current.lastSaved).toBeInstanceOf(Date);
    });
  });

  test('should clear error on successful save', async () => {
    // First, create an error with one data
    mockOnSave.mockRejectedValueOnce(new Error('Save failed'));

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, {
        onSave: mockOnSave,
        onError: mockOnError,
        debounceMs: 1000
      }),
      { initialProps: { data: 'error data' } }
    );

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Save failed');
    });

    // Then, change data and make a successful save
    mockOnSave.mockResolvedValueOnce(undefined);
    rerender({ data: 'success data' });

    await act(async () => {
      await result.current.saveNow();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
}); 