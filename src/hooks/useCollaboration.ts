import { useState, useEffect, useCallback, useRef } from 'react';
import { collaborationService } from '../services/collaborationService';
import { 
  User, 
  CollaborationSession, 
  EditOperation, 
  CollaborationState,
  CollaborationConfig,
  UserCursor 
} from '../types/collaboration';

export function useCollaboration(noteId: string | null) {
  const [state, setState] = useState<CollaborationState>({
    session: null,
    localUser: null,
    remoteCursors: [],
    pendingOperations: [],
    resolvedConflicts: [],
    isConnected: false,
    connectionStatus: 'disconnected'
  });

  const [config, setConfig] = useState<CollaborationConfig>(collaborationService.getConfig());
  const sessionRef = useRef<CollaborationSession | null>(null);

  // Initialize local user
  useEffect(() => {
    const localUser: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `User ${Math.floor(Math.random() * 1000)}`,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      isOnline: true,
      lastSeen: new Date()
    };

    setState(prev => ({ ...prev, localUser }));
  }, []);

  // Event listeners
  useEffect(() => {
    const handleSessionCreated = (session: CollaborationSession) => {
      if (session.noteId === noteId) {
        setState(prev => ({ 
          ...prev, 
          session, 
          isConnected: true, 
          connectionStatus: 'connected' 
        }));
        sessionRef.current = session;
      }
    };

    const handleUserJoined = ({ session, user }: { session: CollaborationSession; user: User }) => {
      if (session.noteId === noteId) {
        setState(prev => ({ ...prev, session }));
      }
    };

    const handleUserLeft = ({ session, userId }: { session: CollaborationSession; userId: string }) => {
      if (session.noteId === noteId) {
        setState(prev => ({ 
          ...prev, 
          session,
          remoteCursors: prev.remoteCursors.filter(c => c.userId !== userId)
        }));
      }
    };

    const handleCursorUpdated = ({ sessionId, cursor }: { sessionId: string; cursor: UserCursor }) => {
      if (sessionRef.current?.id === sessionId && cursor.userId !== state.localUser?.id) {
        setState(prev => ({
          ...prev,
          remoteCursors: [
            ...prev.remoteCursors.filter(c => c.userId !== cursor.userId),
            cursor
          ]
        }));
      }
    };

    const handlePresenceUpdated = ({ sessionId, userId, isOnline }: { sessionId: string; userId: string; isOnline: boolean }) => {
      if (sessionRef.current?.id === sessionId) {
        setState(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            users: prev.session.users.map(user => 
              user.id === userId ? { ...user, isOnline } : user
            )
          } : null
        }));
      }
    };

    const handleOperationSubmitted = ({ sessionId, operation }: { sessionId: string; operation: EditOperation }) => {
      if (sessionRef.current?.id === sessionId && operation.userId !== state.localUser?.id) {
        setState(prev => ({
          ...prev,
          pendingOperations: [...prev.pendingOperations, operation]
        }));
      }
    };

    const handleConflictResolved = (resolution: any) => {
      setState(prev => ({
        ...prev,
        resolvedConflicts: [...prev.resolvedConflicts, resolution]
      }));
    };

    const handleSync = (data: any) => {
      // Handle sync events
      console.log('Sync event:', data);
    };

    // Add event listeners
    collaborationService.addEventListener('sessionCreated', handleSessionCreated);
    collaborationService.addEventListener('userJoined', handleUserJoined);
    collaborationService.addEventListener('userLeft', handleUserLeft);
    collaborationService.addEventListener('cursorUpdated', handleCursorUpdated);
    collaborationService.addEventListener('presenceUpdated', handlePresenceUpdated);
    collaborationService.addEventListener('operationSubmitted', handleOperationSubmitted);
    collaborationService.addEventListener('conflictResolved', handleConflictResolved);
    collaborationService.addEventListener('sync', handleSync);

    return () => {
      // Remove event listeners
      collaborationService.removeEventListener('sessionCreated', handleSessionCreated);
      collaborationService.removeEventListener('userJoined', handleUserJoined);
      collaborationService.removeEventListener('userLeft', handleUserLeft);
      collaborationService.removeEventListener('cursorUpdated', handleCursorUpdated);
      collaborationService.removeEventListener('presenceUpdated', handlePresenceUpdated);
      collaborationService.removeEventListener('operationSubmitted', handleOperationSubmitted);
      collaborationService.removeEventListener('conflictResolved', handleConflictResolved);
      collaborationService.removeEventListener('sync', handleSync);
    };
  }, [noteId, state.localUser?.id]);

  // Session management
  const createSession = useCallback(async () => {
    if (!noteId || !state.localUser) return;

    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      const session = await collaborationService.createSession(noteId, state.localUser);
      setState(prev => ({ 
        ...prev, 
        session, 
        isConnected: true, 
        connectionStatus: 'connected' 
      }));
      sessionRef.current = session;
    } catch (error) {
      console.error('Failed to create collaboration session:', error);
      setState(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  }, [noteId, state.localUser]);

  const joinSession = useCallback(async (sessionId: string) => {
    if (!state.localUser) return;

    try {
      setState(prev => ({ ...prev, connectionStatus: 'connecting' }));
      const session = await collaborationService.joinSession(sessionId, state.localUser);
      setState(prev => ({ 
        ...prev, 
        session, 
        isConnected: true, 
        connectionStatus: 'connected' 
      }));
      sessionRef.current = session;
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
      setState(prev => ({ ...prev, connectionStatus: 'error' }));
    }
  }, [state.localUser]);

  const leaveSession = useCallback(async () => {
    if (!state.session || !state.localUser) return;

    try {
      await collaborationService.leaveSession(state.session.id, state.localUser.id);
      setState(prev => ({ 
        ...prev, 
        session: null, 
        isConnected: false, 
        connectionStatus: 'disconnected',
        remoteCursors: [],
        pendingOperations: []
      }));
      sessionRef.current = null;
    } catch (error) {
      console.error('Failed to leave collaboration session:', error);
    }
  }, [state.session, state.localUser]);

  // Cursor management
  const updateCursor = useCallback((position: { line: number; ch: number }, selection?: { from: { line: number; ch: number }; to: { line: number; ch: number } }) => {
    if (!state.session || !state.localUser) return;

    const cursor: Omit<UserCursor, 'timestamp'> = {
      userId: state.localUser.id,
      userName: state.localUser.name,
      userColor: state.localUser.color,
      position,
      selection
    };

    collaborationService.updateCursor(state.session.id, cursor);
  }, [state.session, state.localUser]);

  // Operation submission
  const submitOperation = useCallback(async (operation: Omit<EditOperation, 'id' | 'timestamp' | 'userId'>) => {
    if (!state.session || !state.localUser) return;

    try {
      await collaborationService.submitOperation(state.session.id, {
        ...operation,
        userId: state.localUser.id
      });
    } catch (error) {
      console.error('Failed to submit operation:', error);
    }
  }, [state.session, state.localUser]);

  // Configuration management
  const updateConfig = useCallback((newConfig: Partial<CollaborationConfig>) => {
    collaborationService.updateConfig(newConfig);
    setConfig(collaborationService.getConfig());
  }, []);

  // Get online users
  const getOnlineUsers = useCallback(() => {
    return state.session?.users.filter(user => user.isOnline) || [];
  }, [state.session]);

  // Get user by ID
  const getUserById = useCallback((userId: string) => {
    return state.session?.users.find(user => user.id === userId);
  }, [state.session]);

  return {
    // State
    state,
    config,
    
    // Session management
    createSession,
    joinSession,
    leaveSession,
    
    // Cursor management
    updateCursor,
    
    // Operation management
    submitOperation,
    
    // Configuration
    updateConfig,
    
    // Utility functions
    getOnlineUsers,
    getUserById,
    
    // Computed values
    isCollaborating: !!state.session,
    onlineUsersCount: getOnlineUsers().length,
    hasRemoteCursors: state.remoteCursors.length > 0,
    hasPendingOperations: state.pendingOperations.length > 0
  };
} 