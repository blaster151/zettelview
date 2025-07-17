export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface CursorPosition {
  line: number;
  ch: number;
}

export interface UserCursor {
  userId: string;
  userName: string;
  userColor: string;
  position: CursorPosition;
  selection?: {
    from: CursorPosition;
    to: CursorPosition;
  };
}

export interface CollaborationSession {
  id: string;
  noteId: string;
  users: User[];
  cursors: UserCursor[];
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

export interface EditOperation {
  id: string;
  userId: string;
  timestamp: Date;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  version: number;
}

export interface ConflictResolution {
  operationId: string;
  resolvedBy: string;
  resolution: 'accept' | 'reject' | 'merge';
  timestamp: Date;
  comment?: string;
}

export interface CollaborationState {
  session: CollaborationSession | null;
  localUser: User | null;
  remoteCursors: UserCursor[];
  pendingOperations: EditOperation[];
  resolvedConflicts: ConflictResolution[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export interface CollaborationConfig {
  enableRealTimeSync: boolean;
  showUserCursors: boolean;
  showUserPresence: boolean;
  autoResolveConflicts: boolean;
  syncInterval: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
} 