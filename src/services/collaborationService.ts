import { 
  User, 
  CollaborationSession, 
  EditOperation, 
  ConflictResolution,
  CollaborationConfig 
} from '../types/collaboration';

// Mock WebSocket-like service for demonstration
// In a real implementation, this would use WebSocket or Server-Sent Events
class MockCollaborationService {
  private config: CollaborationConfig = {
    enableRealTimeSync: true,
    showUserCursors: true,
    showUserPresence: true,
    autoResolveConflicts: true,
    syncInterval: 1000,
    maxRetries: 3,
    retryDelay: 1000
  };

  private sessions: Map<string, CollaborationSession> = new Map();
  private operations: Map<string, EditOperation[]> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSyncInterval();
  }

  // Configuration management
  updateConfig(newConfig: Partial<CollaborationConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.restartSyncInterval();
  }

  getConfig(): CollaborationConfig {
    return { ...this.config };
  }

  // Session management
  async createSession(noteId: string, user: User): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      noteId,
      users: [user],
      cursors: [],
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(session.id, session);
    this.operations.set(session.id, []);
    this.notifyListeners('sessionCreated', session);
    
    return session;
  }

  async joinSession(sessionId: string, user: User): Promise<CollaborationSession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.users.find(u => u.id === user.id)) {
      session.users.push(user);
      session.lastActivity = new Date();
      this.notifyListeners('userJoined', { session, user });
    }

    return session;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.users = session.users.filter(u => u.id !== userId);
    session.cursors = session.cursors.filter(c => c.userId !== userId);
    session.lastActivity = new Date();

    if (session.users.length === 0) {
      this.sessions.delete(sessionId);
      this.operations.delete(sessionId);
      this.notifyListeners('sessionEnded', sessionId);
    } else {
      this.notifyListeners('userLeft', { session, userId });
    }
  }

  // Cursor and presence management
  updateCursor(sessionId: string, cursor: Omit<UserCursor, 'timestamp'>): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const existingIndex = session.cursors.findIndex(c => c.userId === cursor.userId);
    if (existingIndex >= 0) {
      session.cursors[existingIndex] = cursor as UserCursor;
    } else {
      session.cursors.push(cursor as UserCursor);
    }

    session.lastActivity = new Date();
    this.notifyListeners('cursorUpdated', { sessionId, cursor });
  }

  updateUserPresence(sessionId: string, userId: string, isOnline: boolean): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.users.find(u => u.id === userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      session.lastActivity = new Date();
      this.notifyListeners('presenceUpdated', { sessionId, userId, isOnline });
    }
  }

  // Operation management
  async submitOperation(sessionId: string, operation: Omit<EditOperation, 'id' | 'timestamp'>): Promise<EditOperation> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullOperation: EditOperation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const sessionOperations = this.operations.get(sessionId) || [];
    sessionOperations.push(fullOperation);
    this.operations.set(sessionId, sessionOperations);

    session.lastActivity = new Date();
    this.notifyListeners('operationSubmitted', { sessionId, operation: fullOperation });

    return fullOperation;
  }

  async getOperations(sessionId: string, sinceVersion: number = 0): Promise<EditOperation[]> {
    const sessionOperations = this.operations.get(sessionId) || [];
    return sessionOperations.filter(op => op.version > sinceVersion);
  }

  // Conflict resolution
  async resolveConflict(operationId: string, resolution: Omit<ConflictResolution, 'timestamp'>): Promise<void> {
    const resolvedConflict: ConflictResolution = {
      ...resolution,
      timestamp: new Date()
    };

    this.notifyListeners('conflictResolved', resolvedConflict);
  }

  // Event listeners
  addEventListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    }
  }

  private notifyListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in collaboration event listener for ${event}:`, error);
        }
      });
    }
  }

  // Sync interval management
  private startSyncInterval(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    if (this.config.enableRealTimeSync) {
      this.syncInterval = setInterval(() => {
        this.performSync();
      }, this.config.syncInterval);
    }
  }

  private restartSyncInterval(): void {
    this.startSyncInterval();
  }

  private async performSync(): Promise<void> {
    // In a real implementation, this would sync with the server
    // For now, we just notify that sync is happening
    this.notifyListeners('sync', { timestamp: new Date() });
  }

  // Cleanup
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.sessions.clear();
    this.operations.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const collaborationService = new MockCollaborationService(); 