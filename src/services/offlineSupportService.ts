import { Note } from '../types/domain';

export interface OfflineData {
  notes: Note[];
  metadata: {
    lastSync: Date;
    version: string;
    checksum: string;
    size: number;
  };
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'note' | 'tag' | 'user';
  entityId: string;
  data: any;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

export interface SyncConflict {
  id: string;
  localOperation: SyncOperation;
  remoteOperation: SyncOperation;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: Date;
  expiresAt: Date;
  accessCount: number;
  size: number;
}

export interface OfflineConfig {
  enableOfflineMode: boolean;
  maxCacheSize: number; // in MB
  cacheExpirationHours: number;
  syncInterval: number; // in minutes
  maxRetries: number;
  conflictStrategy: 'last-write-wins' | 'manual' | 'merge';
  enableBackgroundSync: boolean;
  enableCompression: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  conflicts: number;
  syncProgress: number;
  error?: string;
}

class OfflineSupportService {
  private config: OfflineConfig = {
    enableOfflineMode: true,
    maxCacheSize: 100, // 100MB
    cacheExpirationHours: 24,
    syncInterval: 5, // 5 minutes
    maxRetries: 3,
    conflictStrategy: 'last-write-wins',
    enableBackgroundSync: true,
    enableCompression: true
  };

  private cache: Map<string, CacheEntry> = new Map();
  private pendingOperations: Map<string, SyncOperation> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;
  private eventListeners: Map<string, Function[]> = new Map();
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeIndexedDB();
    this.setupNetworkListeners();
    this.startSyncTimer();
  }

  private async initializeIndexedDB(): Promise<void> {
    try {
      const request = indexedDB.open('ZettelViewOffline', 1);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB');
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.emitEvent('database_ready', {});
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('title', 'title', { unique: false });
          notesStore.createIndex('tags', 'tags', { unique: false });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('operations')) {
          const operationsStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationsStore.createIndex('status', 'status', { unique: false });
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('conflicts')) {
          const conflictsStore = db.createObjectStore('conflicts', { keyPath: 'id' });
          conflictsStore.createIndex('resolution', 'resolution', { unique: false });
        }
      };
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emitEvent('network_status_changed', { isOnline: true });
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emitEvent('network_status_changed', { isOnline: false });
    });
  }

  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.enableBackgroundSync) {
      this.syncTimer = setInterval(() => {
        if (this.isOnline) {
          this.syncPendingOperations();
        }
      }, this.config.syncInterval * 60 * 1000);
    }
  }

  // Cache Management
  async setCache(key: string, data: any, ttl?: number): Promise<void> {
    const expiresAt = new Date(Date.now() + (ttl || this.config.cacheExpirationHours * 60 * 60 * 1000));
    const entry: CacheEntry = {
      key,
      data,
      timestamp: new Date(),
      expiresAt,
      accessCount: 0,
      size: this.calculateSize(data)
    };

    // Check cache size limit
    await this.enforceCacheSizeLimit(entry.size);

    this.cache.set(key, entry);
    
    // Store in IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put(entry);
    }

    this.emitEvent('cache_updated', { key, entry });
  }

  async getCache(key: string): Promise<any | null> {
    let entry = this.cache.get(key);

    if (!entry && this.db) {
      // Try to load from IndexedDB
      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);
      
      entry = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }

    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt < new Date()) {
      await this.removeCache(key);
      return null;
    }

    // Update access count
    entry.accessCount++;
    this.cache.set(key, entry);

    this.emitEvent('cache_accessed', { key, entry });
    return entry.data;
  }

  async removeCache(key: string): Promise<void> {
    this.cache.delete(key);
    
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.delete(key);
    }

    this.emitEvent('cache_removed', { key });
  }

  async clearCache(): Promise<void> {
    this.cache.clear();
    
    if (this.db) {
      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    }

    this.emitEvent('cache_cleared', {});
  }

  private async enforceCacheSizeLimit(newEntrySize: number): Promise<void> {
    const currentSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    const maxSize = this.config.maxCacheSize * 1024 * 1024; // Convert to bytes

    if (currentSize + newEntrySize > maxSize) {
      // Remove least recently used entries
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);

      let removedSize = 0;
      for (const [key, entry] of entries) {
        if (currentSize - removedSize + newEntrySize <= maxSize) break;
        
        await this.removeCache(key);
        removedSize += entry.size;
      }
    }
  }

  private calculateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  // Offline Data Management
  async saveOfflineData(notes: Note[]): Promise<void> {
    const offlineData: OfflineData = {
      notes,
      metadata: {
        lastSync: new Date(),
        version: '1.0.0',
        checksum: this.calculateChecksum(notes),
        size: this.calculateSize(notes)
      }
    };

    await this.setCache('offline_data', offlineData, 24 * 60 * 60 * 1000); // 24 hours

    // Store notes individually for faster access
    for (const note of notes) {
      await this.setCache(`note_${note.id}`, note, 24 * 60 * 60 * 1000);
    }

    this.emitEvent('offline_data_saved', { count: notes.length });
  }

  async loadOfflineData(): Promise<Note[]> {
    const offlineData = await this.getCache('offline_data') as OfflineData;
    
    if (!offlineData) {
      return [];
    }

    // Verify checksum
    const currentChecksum = this.calculateChecksum(offlineData.notes);
    if (currentChecksum !== offlineData.metadata.checksum) {
      console.warn('Offline data checksum mismatch, data may be corrupted');
    }

    this.emitEvent('offline_data_loaded', { count: offlineData.notes.length });
    return offlineData.notes;
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Sync Operations
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const id = this.generateOperationId();
    const syncOperation: SyncOperation = {
      ...operation,
      id,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };

    this.pendingOperations.set(id, syncOperation);

    // Store in IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      await store.put(syncOperation);
    }

    this.emitEvent('operation_queued', syncOperation);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }

    return id;
  }

  async syncPendingOperations(): Promise<void> {
    if (!this.isOnline) return;

    const pendingOps = Array.from(this.pendingOperations.values())
      .filter(op => op.status === 'pending' || op.status === 'failed');

    if (pendingOps.length === 0) return;

    this.emitEvent('sync_started', { count: pendingOps.length });

    for (const operation of pendingOps) {
      try {
        operation.status = 'syncing';
        this.pendingOperations.set(operation.id, operation);

        // Simulate API call
        await this.performSyncOperation(operation);

        operation.status = 'completed';
        this.pendingOperations.delete(operation.id);

        // Remove from IndexedDB
        if (this.db) {
          const transaction = this.db.transaction(['operations'], 'readwrite');
          const store = transaction.objectStore('operations');
          await store.delete(operation.id);
        }

        this.emitEvent('operation_synced', operation);
      } catch (error) {
        operation.status = 'failed';
        operation.retryCount++;
        operation.error = error instanceof Error ? error.message : String(error);

        if (operation.retryCount >= this.config.maxRetries) {
          this.emitEvent('operation_failed', operation);
        } else {
          this.pendingOperations.set(operation.id, operation);
        }
      }
    }

    this.emitEvent('sync_completed', {});
  }

  private async performSyncOperation(operation: SyncOperation): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }

    // Simulate conflicts
    if (Math.random() < 0.05) {
      const conflict: SyncConflict = {
        id: this.generateConflictId(),
        localOperation: operation,
        remoteOperation: {
          ...operation,
          id: this.generateOperationId(),
          timestamp: new Date(Date.now() - 1000),
          data: { ...operation.data, version: 'remote' }
        },
        resolution: 'manual'
      };

      this.conflicts.set(conflict.id, conflict);
      this.emitEvent('conflict_detected', conflict);
      throw new Error('Conflict detected');
    }
  }

  // Conflict Resolution
  async resolveConflict(conflictId: string, resolution: 'local' | 'remote' | 'merge'): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return;

    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = 'user';

    switch (resolution) {
      case 'local':
        // Keep local operation, discard remote
        break;
      case 'remote':
        // Discard local operation, apply remote
        this.pendingOperations.delete(conflict.localOperation.id);
        break;
      case 'merge':
        // Merge both operations
        const mergedData = this.mergeData(conflict.localOperation.data, conflict.remoteOperation.data);
        conflict.localOperation.data = mergedData;
        break;
    }

    this.conflicts.delete(conflictId);
    this.emitEvent('conflict_resolved', conflict);
  }

  private mergeData(localData: any, remoteData: any): any {
    // Simple merge strategy - in a real implementation, this would be more sophisticated
    return {
      ...localData,
      ...remoteData,
      mergedAt: new Date()
    };
  }

  // Compression
  async compressData(data: any): Promise<string> {
    if (!this.config.enableCompression) {
      return JSON.stringify(data);
    }

    // Simple compression - in a real implementation, use a proper compression library
    const jsonString = JSON.stringify(data);
    const compressed = btoa(jsonString); // Base64 encoding as simple compression
    return compressed;
  }

  async decompressData(compressedData: string): Promise<any> {
    if (!this.config.enableCompression) {
      return JSON.parse(compressedData);
    }

    // Simple decompression
    const jsonString = atob(compressedData); // Base64 decoding
    return JSON.parse(jsonString);
  }

  // Status and Monitoring
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: this.getLastSyncTime(),
      pendingOperations: this.pendingOperations.size,
      conflicts: this.conflicts.size,
      syncProgress: this.calculateSyncProgress(),
      error: this.getLastError()
    };
  }

  private getLastSyncTime(): Date | null {
    const operations = Array.from(this.pendingOperations.values());
    const completedOps = operations.filter(op => op.status === 'completed');
    
    if (completedOps.length === 0) return null;
    
    return new Date(Math.max(...completedOps.map(op => op.timestamp.getTime())));
  }

  private calculateSyncProgress(): number {
    const totalOps = this.pendingOperations.size;
    if (totalOps === 0) return 100;

    const completedOps = Array.from(this.pendingOperations.values())
      .filter(op => op.status === 'completed').length;

    return Math.round((completedOps / totalOps) * 100);
  }

  private getLastError(): string | undefined {
    const failedOps = Array.from(this.pendingOperations.values())
      .filter(op => op.status === 'failed');
    
    if (failedOps.length === 0) return undefined;
    
    const lastFailed = failedOps.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    return lastFailed.error;
  }

  // Configuration
  updateConfig(newConfig: Partial<OfflineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.syncInterval) {
      this.startSyncTimer();
    }
    
    this.emitEvent('config_updated', this.config);
  }

  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  // Utility Methods
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        console.error(`Error in offline event listener for ${eventType}:`, error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    this.cache.clear();
    this.pendingOperations.clear();
    this.conflicts.clear();
    this.eventListeners.clear();
  }
}

export const OfflineSupportService = new OfflineSupportService(); 