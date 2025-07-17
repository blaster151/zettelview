import { renderHook, act } from '@testing-library/react';
import { useCollaboration } from './useCollaboration';
import { collaborationService } from '../services/collaborationService';

// Mock the collaboration service
jest.mock('../services/collaborationService', () => ({
  collaborationService: {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    createSession: jest.fn(),
    joinSession: jest.fn(),
    leaveSession: jest.fn(),
    updateCursor: jest.fn(),
    updateUserPresence: jest.fn(),
    submitOperation: jest.fn(),
    getOperations: jest.fn(),
    resolveConflict: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }
}));

const mockCollaborationService = collaborationService as jest.Mocked<typeof collaborationService>;

describe('useCollaboration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollaborationService.getConfig.mockReturnValue({
      enableRealTimeSync: true,
      showUserCursors: true,
      showUserPresence: true,
      autoResolveConflicts: true,
      syncInterval: 1000,
      maxRetries: 3,
      retryDelay: 1000
    });
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      expect(result.current.state.session).toBeNull();
      expect(result.current.state.localUser).toBeDefined();
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.connectionStatus).toBe('disconnected');
      expect(result.current.isCollaborating).toBe(false);
      expect(result.current.onlineUsersCount).toBe(0);
    });

    it('should create a local user with unique ID', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      expect(result.current.state.localUser).toBeDefined();
      expect(result.current.state.localUser?.id).toMatch(/^user-\d+-\w+$/);
      expect(result.current.state.localUser?.name).toMatch(/^User \d+$/);
      expect(result.current.state.localUser?.color).toMatch(/^hsl\(\d+, 70%, 50%\)$/);
      expect(result.current.state.localUser?.isOnline).toBe(true);
    });

    it('should load configuration from service', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      expect(mockCollaborationService.getConfig).toHaveBeenCalled();
      expect(result.current.config).toEqual({
        enableRealTimeSync: true,
        showUserCursors: true,
        showUserPresence: true,
        autoResolveConflicts: true,
        syncInterval: 1000,
        maxRetries: 3,
        retryDelay: 1000
      });
    });
  });

  describe('session management', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [{ id: 'user-1', name: 'Test User', color: '#ff0000', isOnline: true, lastSeen: new Date() }],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockCollaborationService.createSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      await act(async () => {
        await result.current.createSession();
      });

      expect(mockCollaborationService.createSession).toHaveBeenCalledWith('test-note-id', result.current.state.localUser);
      expect(result.current.state.session).toEqual(mockSession);
      expect(result.current.state.isConnected).toBe(true);
      expect(result.current.state.connectionStatus).toBe('connected');
      expect(result.current.isCollaborating).toBe(true);
    });

    it('should join an existing session', async () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [{ id: 'user-1', name: 'Test User', color: '#ff0000', isOnline: true, lastSeen: new Date() }],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockCollaborationService.joinSession.mockResolvedValue(mockSession);

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      await act(async () => {
        await result.current.joinSession('session-123');
      });

      expect(mockCollaborationService.joinSession).toHaveBeenCalledWith('session-123', result.current.state.localUser);
      expect(result.current.state.session).toEqual(mockSession);
      expect(result.current.state.isConnected).toBe(true);
      expect(result.current.state.connectionStatus).toBe('connected');
    });

    it('should leave a session', async () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [{ id: 'user-1', name: 'Test User', color: '#ff0000', isOnline: true, lastSeen: new Date() }],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      mockCollaborationService.leaveSession.mockResolvedValue();

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      // Set up initial session state
      result.current.state.session = mockSession;
      result.current.state.isConnected = true;
      result.current.state.connectionStatus = 'connected';

      await act(async () => {
        await result.current.leaveSession();
      });

      expect(mockCollaborationService.leaveSession).toHaveBeenCalledWith('session-123', result.current.state.localUser?.id);
      expect(result.current.state.session).toBeNull();
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.connectionStatus).toBe('disconnected');
    });

    it('should handle session creation errors', async () => {
      mockCollaborationService.createSession.mockRejectedValue(new Error('Failed to create session'));

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      await act(async () => {
        await result.current.createSession();
      });

      expect(result.current.state.connectionStatus).toBe('error');
    });
  });

  describe('cursor management', () => {
    it('should update cursor position', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      const position = { line: 5, ch: 10 };
      const selection = { from: { line: 5, ch: 0 }, to: { line: 5, ch: 20 } };

      act(() => {
        result.current.updateCursor(position, selection);
      });

      expect(mockCollaborationService.updateCursor).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: result.current.state.localUser?.id,
          userName: result.current.state.localUser?.name,
          userColor: result.current.state.localUser?.color,
          position,
          selection
        })
      );
    });

    it('should not update cursor without session', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      act(() => {
        result.current.updateCursor({ line: 5, ch: 10 });
      });

      expect(mockCollaborationService.updateCursor).not.toHaveBeenCalled();
    });
  });

  describe('operation management', () => {
    it('should submit operations', async () => {
      const mockOperation = {
        id: 'op-123',
        userId: 'user-1',
        timestamp: new Date(),
        type: 'insert' as const,
        position: 10,
        content: 'new text',
        version: 1
      };

      mockCollaborationService.submitOperation.mockResolvedValue(mockOperation);

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      // Set up session
      result.current.state.session = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      await act(async () => {
        await result.current.submitOperation({
          type: 'insert',
          position: 10,
          content: 'new text',
          version: 1
        });
      });

      expect(mockCollaborationService.submitOperation).toHaveBeenCalledWith(
        'session-123',
        expect.objectContaining({
          type: 'insert',
          position: 10,
          content: 'new text',
          version: 1,
          userId: result.current.state.localUser?.id
        })
      );
    });

    it('should not submit operations without session', async () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      await act(async () => {
        await result.current.submitOperation({
          type: 'insert',
          position: 10,
          content: 'new text',
          version: 1
        });
      });

      expect(mockCollaborationService.submitOperation).not.toHaveBeenCalled();
    });
  });

  describe('configuration management', () => {
    it('should update configuration', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      act(() => {
        result.current.updateConfig({ showUserCursors: false });
      });

      expect(mockCollaborationService.updateConfig).toHaveBeenCalledWith({ showUserCursors: false });
    });
  });

  describe('utility functions', () => {
    it('should get online users', () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [
          { id: 'user-1', name: 'User 1', color: '#ff0000', isOnline: true, lastSeen: new Date() },
          { id: 'user-2', name: 'User 2', color: '#00ff00', isOnline: false, lastSeen: new Date() },
          { id: 'user-3', name: 'User 3', color: '#0000ff', isOnline: true, lastSeen: new Date() }
        ],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      // Set up session
      result.current.state.session = mockSession;

      const onlineUsers = result.current.getOnlineUsers();
      expect(onlineUsers).toHaveLength(2);
      expect(onlineUsers[0].name).toBe('User 1');
      expect(onlineUsers[1].name).toBe('User 3');
    });

    it('should get user by ID', () => {
      const mockSession = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [
          { id: 'user-1', name: 'User 1', color: '#ff0000', isOnline: true, lastSeen: new Date() },
          { id: 'user-2', name: 'User 2', color: '#00ff00', isOnline: false, lastSeen: new Date() }
        ],
        cursors: [],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      const { result } = renderHook(() => useCollaboration('test-note-id'));

      // Set up session
      result.current.state.session = mockSession;

      const user = result.current.getUserById('user-1');
      expect(user).toEqual(mockSession.users[0]);

      const nonExistentUser = result.current.getUserById('user-999');
      expect(nonExistentUser).toBeUndefined();
    });
  });

  describe('computed values', () => {
    it('should compute collaboration status correctly', () => {
      const { result } = renderHook(() => useCollaboration('test-note-id'));

      expect(result.current.isCollaborating).toBe(false);
      expect(result.current.onlineUsersCount).toBe(0);
      expect(result.current.hasRemoteCursors).toBe(false);
      expect(result.current.hasPendingOperations).toBe(false);

      // Set up session with users and cursors
      result.current.state.session = {
        id: 'session-123',
        noteId: 'test-note-id',
        users: [
          { id: 'user-1', name: 'User 1', color: '#ff0000', isOnline: true, lastSeen: new Date() },
          { id: 'user-2', name: 'User 2', color: '#00ff00', isOnline: true, lastSeen: new Date() }
        ],
        cursors: [
          { userId: 'user-2', userName: 'User 2', userColor: '#00ff00', position: { line: 1, ch: 0 } }
        ],
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      result.current.state.pendingOperations = [
        { id: 'op-1', userId: 'user-2', timestamp: new Date(), type: 'insert', position: 0, version: 1 }
      ];

      expect(result.current.isCollaborating).toBe(true);
      expect(result.current.onlineUsersCount).toBe(2);
      expect(result.current.hasRemoteCursors).toBe(true);
      expect(result.current.hasPendingOperations).toBe(true);
    });
  });

  describe('event handling', () => {
    it('should set up event listeners on mount', () => {
      renderHook(() => useCollaboration('test-note-id'));

      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('sessionCreated', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('userJoined', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('userLeft', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('cursorUpdated', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('presenceUpdated', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('operationSubmitted', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('conflictResolved', expect.any(Function));
      expect(mockCollaborationService.addEventListener).toHaveBeenCalledWith('sync', expect.any(Function));
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useCollaboration('test-note-id'));

      unmount();

      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('sessionCreated', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('userJoined', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('userLeft', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('cursorUpdated', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('presenceUpdated', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('operationSubmitted', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('conflictResolved', expect.any(Function));
      expect(mockCollaborationService.removeEventListener).toHaveBeenCalledWith('sync', expect.any(Function));
    });
  });
}); 