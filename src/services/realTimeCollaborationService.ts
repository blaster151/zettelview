import { Note } from '../types/domain';

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface CollaborationSession {
  id: string;
  noteId: string;
  users: CollaborationUser[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CollaborationChange {
  id: string;
  userId: string;
  noteId: string;
  type: 'insert' | 'delete' | 'format' | 'cursor' | 'selection';
  position: number;
  length?: number;
  content?: string;
  timestamp: Date;
  version: number;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  userColor: string;
  position: number;
  selectionStart?: number;
  selectionEnd?: number;
}

export interface CollaborationConfig {
  enableRealTimeSync: boolean;
  enableConflictResolution: boolean;
  enableCursorTracking: boolean;
  enableChangeHistory: boolean;
  syncInterval: number;
  maxRetries: number;
  conflictStrategy: 'last-write-wins' | 'manual' | 'merge';
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'change_applied' | 'conflict_resolved' | 'sync_complete' | 'error';
  data: any;
  timestamp: Date;
}

class RealTimeCollaborationService {
  private config: CollaborationConfig = {
    enableRealTimeSync: true,
    enableConflictResolution: true,
    enableCursorTracking: true,
    enableChangeHistory: true,
    syncInterval: 1000,
    maxRetries: 3,
    conflictStrategy: 'last-write-wins'
  };

  private sessions: Map<string, CollaborationSession> = new Map();
  private users: Map<string, CollaborationUser> = new Map();
  private changes: Map<string, CollaborationChange[]> = new Map();
  private cursors: Map<string, CursorPosition[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private websocket: WebSocket | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private currentUser: CollaborationUser | null = null;
  private pendingChanges: CollaborationChange[] = [];
  private versionMap: Map<string, number> = new Map();

  constructor() {
    this.initializeWebSocket();
    this.startSyncTimer();
  }

  // WebSocket Management
  private initializeWebSocket(): void {
    try {
      // In a real implementation, this would connect to your WebSocket server
      // For demo purposes, we'll simulate WebSocket behavior
      this.websocket = new WebSocket('ws://localhost:8080/collaboration');
      
      this.websocket.onopen = () => {
        console.log('Collaboration WebSocket connected');
        this.emitEvent('websocket_connected', {});
      };

      this.websocket.onmessage = (event) => {
        this.handleWebSocketMessage(JSON.parse(event.data));
      };

      this.websocket.onclose = () => {
        console.log('Collaboration WebSocket disconnected');
        this.emitEvent('websocket_disconnected', {});
        // Attempt to reconnect
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emitEvent('websocket_error', { error });
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      // Fallback to polling mode
      this.startPollingMode();
    }
  }

  private startPollingMode(): void {
    console.log('Starting polling mode for collaboration');
    // Implement polling as fallback when WebSocket is not available
  }

  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'user_joined':
        this.handleUserJoined(data.user);
        break;
      case 'user_left':
        this.handleUserLeft(data.userId);
        break;
      case 'change_applied':
        this.handleChangeApplied(data.change);
        break;
      case 'cursor_update':
        this.handleCursorUpdate(data.cursor);
        break;
      case 'conflict_resolved':
        this.handleConflictResolved(data.conflict);
        break;
      case 'sync_complete':
        this.handleSyncComplete(data);
        break;
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }

  // User Management
  setCurrentUser(user: CollaborationUser): void {
    this.currentUser = user;
    this.users.set(user.id, user);
    this.emitEvent('current_user_set', user);
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser;
  }

  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  getUser(userId: string): CollaborationUser | undefined {
    return this.users.get(userId);
  }

  updateUserStatus(userId: string, isOnline: boolean): void {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.emitEvent('user_status_updated', user);
    }
  }

  private handleUserJoined(user: CollaborationUser): void {
    this.users.set(user.id, user);
    this.emitEvent('user_joined', user);
  }

  private handleUserLeft(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      this.emitEvent('user_left', user);
    }
  }

  // Session Management
  createSession(noteId: string): CollaborationSession {
    const sessionId = this.generateSessionId();
    const session: CollaborationSession = {
      id: sessionId,
      noteId,
      users: this.currentUser ? [this.currentUser] : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.sessions.set(sessionId, session);
    this.changes.set(noteId, []);
    this.cursors.set(noteId, []);
    this.versionMap.set(noteId, 0);

    this.emitEvent('session_created', session);
    return session;
  }

  joinSession(sessionId: string): CollaborationSession | null {
    const session = this.sessions.get(sessionId);
    if (!session || !this.currentUser) return null;

    if (!session.users.find(u => u.id === this.currentUser!.id)) {
      session.users.push(this.currentUser);
      session.updatedAt = new Date();
    }

    this.emitEvent('session_joined', session);
    return session;
  }

  leaveSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || !this.currentUser) return;

    session.users = session.users.filter(u => u.id !== this.currentUser!.id);
    session.updatedAt = new Date();

    if (session.users.length === 0) {
      this.sessions.delete(sessionId);
      this.emitEvent('session_ended', session);
    } else {
      this.emitEvent('session_updated', session);
    }
  }

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  // Change Management
  applyChange(noteId: string, change: Omit<CollaborationChange, 'id' | 'timestamp' | 'version'>): CollaborationChange {
    const changeId = this.generateChangeId();
    const version = this.getNextVersion(noteId);
    
    const fullChange: CollaborationChange = {
      ...change,
      id: changeId,
      timestamp: new Date(),
      version
    };

    // Add to pending changes
    this.pendingChanges.push(fullChange);

    // Add to local changes
    const noteChanges = this.changes.get(noteId) || [];
    noteChanges.push(fullChange);
    this.changes.set(noteId, noteChanges);

    // Send to server
    this.sendChange(fullChange);

    this.emitEvent('change_applied', fullChange);
    return fullChange;
  }

  private handleChangeApplied(change: CollaborationChange): void {
    const noteChanges = this.changes.get(change.noteId) || [];
    
    // Check for conflicts
    if (this.hasConflict(change)) {
      this.resolveConflict(change);
    } else {
      noteChanges.push(change);
      this.changes.set(change.noteId, noteChanges);
      this.emitEvent('change_received', change);
    }
  }

  private hasConflict(change: CollaborationChange): boolean {
    const currentVersion = this.versionMap.get(change.noteId) || 0;
    return change.version <= currentVersion;
  }

  private resolveConflict(change: CollaborationChange): void {
    switch (this.config.conflictStrategy) {
      case 'last-write-wins':
        this.resolveLastWriteWins(change);
        break;
      case 'manual':
        this.resolveManual(change);
        break;
      case 'merge':
        this.resolveMerge(change);
        break;
    }
  }

  private resolveLastWriteWins(change: CollaborationChange): void {
    const noteChanges = this.changes.get(change.noteId) || [];
    const existingChange = noteChanges.find(c => c.version === change.version);
    
    if (existingChange && change.timestamp > existingChange.timestamp) {
      // Replace existing change
      const index = noteChanges.indexOf(existingChange);
      noteChanges[index] = change;
      this.changes.set(change.noteId, noteChanges);
    }
    
    this.emitEvent('conflict_resolved', { change, strategy: 'last-write-wins' });
  }

  private resolveManual(change: CollaborationChange): void {
    this.emitEvent('conflict_detected', { change });
  }

  private resolveMerge(change: CollaborationChange): void {
    // Implement merge logic based on change type
    const noteChanges = this.changes.get(change.noteId) || [];
    noteChanges.push(change);
    this.changes.set(change.noteId, noteChanges);
    
    this.emitEvent('conflict_resolved', { change, strategy: 'merge' });
  }

  getChanges(noteId: string): CollaborationChange[] {
    return this.changes.get(noteId) || [];
  }

  getChangeHistory(noteId: string, startTime?: Date, endTime?: Date): CollaborationChange[] {
    const changes = this.getChanges(noteId);
    
    if (!startTime && !endTime) return changes;
    
    return changes.filter(change => {
      if (startTime && change.timestamp < startTime) return false;
      if (endTime && change.timestamp > endTime) return false;
      return true;
    });
  }

  // Cursor Tracking
  updateCursor(noteId: string, position: Omit<CursorPosition, 'userName' | 'userColor'>): void {
    if (!this.currentUser) return;

    const cursor: CursorPosition = {
      ...position,
      userName: this.currentUser.name,
      userColor: this.currentUser.color
    };

    const noteCursors = this.cursors.get(noteId) || [];
    const existingIndex = noteCursors.findIndex(c => c.userId === this.currentUser!.id);
    
    if (existingIndex >= 0) {
      noteCursors[existingIndex] = cursor;
    } else {
      noteCursors.push(cursor);
    }
    
    this.cursors.set(noteId, noteCursors);
    this.sendCursorUpdate(cursor);
    this.emitEvent('cursor_updated', cursor);
  }

  private handleCursorUpdate(cursor: CursorPosition): void {
    const noteCursors = this.cursors.get(cursor.noteId) || [];
    const existingIndex = noteCursors.findIndex(c => c.userId === cursor.userId);
    
    if (existingIndex >= 0) {
      noteCursors[existingIndex] = cursor;
    } else {
      noteCursors.push(cursor);
    }
    
    this.cursors.set(cursor.noteId, noteCursors);
    this.emitEvent('cursor_received', cursor);
  }

  getCursors(noteId: string): CursorPosition[] {
    return this.cursors.get(noteId) || [];
  }

  clearCursor(noteId: string, userId: string): void {
    const noteCursors = this.cursors.get(noteId) || [];
    const filteredCursors = noteCursors.filter(c => c.userId !== userId);
    this.cursors.set(noteId, filteredCursors);
    this.emitEvent('cursor_cleared', { noteId, userId });
  }

  // Synchronization
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncChanges();
    }, this.config.syncInterval);
  }

  private async syncChanges(): Promise<void> {
    if (this.pendingChanges.length === 0) return;

    try {
      const changes = [...this.pendingChanges];
      this.pendingChanges = [];

      // Send changes to server
      await this.sendChangesBatch(changes);
      
      this.emitEvent('sync_complete', { changes, success: true });
    } catch (error) {
      // Re-add changes to pending queue
      this.pendingChanges.unshift(...this.pendingChanges);
      
      console.error('Sync failed:', error);
      this.emitEvent('sync_error', { error, changes: this.pendingChanges });
    }
  }

  private handleSyncComplete(data: any): void {
    this.emitEvent('sync_complete', data);
  }

  // WebSocket Communication
  private sendChange(change: CollaborationChange): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'change',
        data: change
      }));
    }
  }

  private sendChangesBatch(changes: CollaborationChange[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'changes_batch',
          data: changes
        }));
        resolve();
      } else {
        reject(new Error('WebSocket not connected'));
      }
    });
  }

  private sendCursorUpdate(cursor: CursorPosition): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        type: 'cursor_update',
        data: cursor
      }));
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<CollaborationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.syncInterval) {
      this.startSyncTimer();
    }
    
    this.emitEvent('config_updated', this.config);
  }

  getConfig(): CollaborationConfig {
    return { ...this.config };
  }

  // Utility Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextVersion(noteId: string): number {
    const currentVersion = this.versionMap.get(noteId) || 0;
    const nextVersion = currentVersion + 1;
    this.versionMap.set(noteId, nextVersion);
    return nextVersion;
  }

  // Event System
  onEvent(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  offEvent(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in collaboration event listener for ${eventType}:`, error);
      }
    });
  }

  // Cleanup
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.sessions.clear();
    this.users.clear();
    this.changes.clear();
    this.cursors.clear();
    this.pendingChanges = [];
    this.versionMap.clear();
  }
}

export const RealTimeCollaborationService = new RealTimeCollaborationService(); 