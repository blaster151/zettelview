import { renderHook, act } from '@testing-library/react';
import { useNoteChaining } from '../useNoteChaining';
import { useNoteStore } from '../../store/noteStore';
import { noteChainingService } from '../../services/noteChainingService';

// Mock the dependencies
jest.mock('../../store/noteStore');
jest.mock('../../services/noteChainingService');
jest.mock('../../services/notificationService', () => ({
  notificationService: {
    success: jest.fn(),
    error: jest.fn()
  }
}));
jest.mock('../../services/loggingService', () => ({
  loggingService: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;
const mockNoteChainingService = noteChainingService as jest.Mocked<typeof noteChainingService>;

describe('useNoteChaining', () => {
  const mockParentNote = {
    id: 'parent-note',
    title: 'Parent Note',
    body: 'Parent content',
    tags: ['parent', 'test'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockChainedNote = {
    id: 'chained-note',
    title: 'Chained Note',
    body: 'Chained content',
    tags: ['parent', 'test'],
    parentId: 'parent-note',
    chainId: 'chain-123'
  };

  const mockAddNote = jest.fn();
  const mockUpdateNote = jest.fn();
  const mockGetNote = jest.fn();

  beforeEach(() => {
    mockUseNoteStore.mockReturnValue({
      addNote: mockAddNote,
      updateNote: mockUpdateNote,
      getNote: mockGetNote
    } as any);

    mockGetNote.mockReturnValue(mockParentNote);
    mockAddNote.mockResolvedValue(undefined);
    mockUpdateNote.mockResolvedValue(undefined);
    mockNoteChainingService.createChainedNote.mockReturnValue(mockChainedNote);
    mockNoteChainingService.validateOptions.mockReturnValue({ isValid: true, errors: [] });
    mockNoteChainingService.updateParentWithChildLink.mockReturnValue('Updated parent body');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default options', () => {
    const { result } = renderHook(() => useNoteChaining());

    expect(result.current.isCreating).toBe(false);
    expect(result.current.lastCreatedNote).toBeNull();
    expect(result.current.defaultOptions).toEqual({
      inheritTags: true,
      addBacklink: true,
      sequentialId: true,
      autoTitle: true,
      idFormat: 'numeric'
    });
  });

  test('should initialize with custom default options', () => {
    const customOptions = {
      inheritTags: false,
      addBacklink: false,
      sequentialId: false,
      autoTitle: false,
      idFormat: 'timestamp' as const
    };

    const { result } = renderHook(() => useNoteChaining({
      defaultOptions: customOptions
    }));

    expect(result.current.defaultOptions).toEqual(customOptions);
  });

  test('should create chained note successfully', async () => {
    const onNoteCreated = jest.fn();
    const { result } = renderHook(() => useNoteChaining({
      onNoteCreated
    }));

    await act(async () => {
      const createdNote = await result.current.createChainedNote('parent-note');
      expect(createdNote).toEqual(mockChainedNote);
    });

    expect(mockAddNote).toHaveBeenCalledWith('Chained Note', {
      id: 'chained-note',
      body: 'Chained content',
      tags: ['parent', 'test']
    });

    expect(mockUpdateNote).toHaveBeenCalledWith('parent-note', {
      body: 'Updated parent body'
    });

    expect(result.current.lastCreatedNote).toEqual(mockChainedNote);
    expect(onNoteCreated).toHaveBeenCalledWith(mockChainedNote);
  });

  test('should handle parent note not found', async () => {
    mockGetNote.mockReturnValue(null);
    const onError = jest.fn();
    const { result } = renderHook(() => useNoteChaining({
      onError
    }));

    await act(async () => {
      const createdNote = await result.current.createChainedNote('non-existent');
      expect(createdNote).toBeNull();
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Parent note with ID non-existent not found'
      })
    );
  });

  test('should handle validation errors', async () => {
    mockNoteChainingService.validateOptions.mockReturnValue({
      isValid: false,
      errors: ['Invalid ID format']
    });

    const onError = jest.fn();
    const { result } = renderHook(() => useNoteChaining({
      onError
    }));

    await act(async () => {
      const createdNote = await result.current.createChainedNote('parent-note');
      expect(createdNote).toBeNull();
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid options: Invalid ID format'
      })
    );
  });

  test('should handle service errors', async () => {
    const serviceError = new Error('Service error');
    mockAddNote.mockRejectedValue(serviceError);

    const onError = jest.fn();
    const { result } = renderHook(() => useNoteChaining({
      onError
    }));

    await act(async () => {
      const createdNote = await result.current.createChainedNote('parent-note');
      expect(createdNote).toBeNull();
    });

    expect(onError).toHaveBeenCalledWith(serviceError);
  });

  test('should create chained note with hotkey options', async () => {
    const { result } = renderHook(() => useNoteChaining());

    await act(async () => {
      const createdNote = await result.current.createChainedNoteWithHotkey('parent-note', 'Ctrl+Shift+N');
      expect(createdNote).toEqual(mockChainedNote);
    });

    // Should use standard chaining options for Ctrl+Shift+N
    expect(mockNoteChainingService.createChainedNote).toHaveBeenCalledWith(
      mockParentNote,
      expect.objectContaining({
        inheritTags: true,
        addBacklink: true,
        sequentialId: true
      })
    );
  });

  test('should create quick chained note', async () => {
    const { result } = renderHook(() => useNoteChaining());

    await act(async () => {
      const createdNote = await result.current.quickChain('parent-note');
      expect(createdNote).toEqual(mockChainedNote);
    });

    expect(mockNoteChainingService.createChainedNote).toHaveBeenCalledWith(
      mockParentNote,
      expect.objectContaining({
        inheritTags: true,
        addBacklink: true,
        sequentialId: true,
        autoTitle: true
      })
    );
  });

  test('should get chain info for note', () => {
    mockNoteChainingService.getChainForNote.mockReturnValue('chain-123');
    mockNoteChainingService.getChainNotes.mockReturnValue(['note-1', 'note-2']);

    const { result } = renderHook(() => useNoteChaining());

    const chainInfo = result.current.getChainInfo('note-1');

    expect(chainInfo).toEqual({
      chainId: 'chain-123',
      notes: [mockParentNote, mockParentNote], // getNote returns mockParentNote for both
      count: 2,
      parentNote: mockParentNote
    });
  });

  test('should return null for note not in chain', () => {
    mockNoteChainingService.getChainForNote.mockReturnValue(null);

    const { result } = renderHook(() => useNoteChaining());

    const chainInfo = result.current.getChainInfo('non-existent');

    expect(chainInfo).toBeNull();
  });

  test('should get all chains', () => {
    const mockChains = new Map([
      ['chain-1', ['note-1', 'note-2']],
      ['chain-2', ['note-3']]
    ]);
    mockNoteChainingService.getAllChains.mockReturnValue(mockChains);

    const { result } = renderHook(() => useNoteChaining());

    const allChains = result.current.getAllChains();

    expect(allChains).toHaveLength(2);
    expect(allChains[0]).toEqual({
      chainId: 'chain-1',
      notes: [mockParentNote, mockParentNote],
      count: 2,
      parentNote: mockParentNote
    });
  });

  test('should set isCreating state during note creation', async () => {
    // Make addNote take some time
    mockAddNote.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    const { result } = renderHook(() => useNoteChaining());

    expect(result.current.isCreating).toBe(false);

    const createPromise = act(async () => {
      await result.current.createChainedNote('parent-note');
    });

    // Should be creating during the operation
    expect(result.current.isCreating).toBe(true);

    await createPromise;

    // Should be false after completion
    expect(result.current.isCreating).toBe(false);
  });

  test('should merge custom options with defaults', async () => {
    const { result } = renderHook(() => useNoteChaining());

    await act(async () => {
      await result.current.createChainedNote('parent-note', {
        inheritTags: false,
        idFormat: 'timestamp'
      });
    });

    expect(mockNoteChainingService.createChainedNote).toHaveBeenCalledWith(
      mockParentNote,
      expect.objectContaining({
        inheritTags: false,
        addBacklink: true, // default
        sequentialId: true, // default
        autoTitle: true, // default
        idFormat: 'timestamp' // custom
      })
    );
  });

  test('should not update parent when addBacklink is false', async () => {
    const { result } = renderHook(() => useNoteChaining());

    await act(async () => {
      await result.current.createChainedNote('parent-note', {
        addBacklink: false
      });
    });

    expect(mockUpdateNote).not.toHaveBeenCalled();
  });
}); 