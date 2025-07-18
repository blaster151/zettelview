import { Note } from '../types/note';

export interface BackupConfig {
  strategy: 'full' | 'incremental' | 'differential';
  compression: boolean;
  encryption: boolean;
  encryptionKey?: string;
  retention: {
    days: number;
    maxBackups: number;
  };
  storage: {
    local: boolean;
    cloud: boolean;
    cloudProvider?: 'google-drive' | 'dropbox' | 'onedrive' | 's3';
  };
  schedule: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string; // HH:MM
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
}

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  compressedSize?: number;
  encrypted: boolean;
  checksum: string;
  notesCount: number;
  version: string;
  description?: string;
  tags: string[];
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  metadata: BackupMetadata;
  duration: number;
  errors: string[];
  warnings: string[];
  storageLocations: string[];
}

export interface RestoreResult {
  success: boolean;
  restoredNotes: Note[];
  duration: number;
  errors: string[];
  warnings: string[];
  conflicts: Array<{
    originalId: string;
    newId: string;
    resolution: 'overwrite' | 'rename' | 'skip';
  }>;
}

export interface BackupStatus {
  lastBackup?: BackupMetadata;
  nextScheduledBackup?: Date;
  totalBackups: number;
  totalSize: number;
  storageUsage: {
    local: number;
    cloud: number;
  };
  health: 'good' | 'warning' | 'error';
  issues: string[];
}

export interface CloudStorageConfig {
  provider: 'google-drive' | 'dropbox' | 'onedrive' | 's3';
  credentials: Record<string, any>;
  folderPath: string;
  maxSize: number;
}

export class AdvancedBackupService {
  private config: BackupConfig = {
    strategy: 'full',
    compression: true,
    encryption: false,
    retention: {
      days: 30,
      maxBackups: 10
    },
    storage: {
      local: true,
      cloud: false
    },
    schedule: {
      enabled: false,
      frequency: 'daily',
      time: '02:00'
    }
  };

  private backups: BackupMetadata[] = [];
  private cloudConfig?: CloudStorageConfig;
  private scheduledBackupTimer?: NodeJS.Timeout;
  private listeners: Map<string, (event: string, data: any) => void> = new Map();

  constructor() {
    this.loadConfig();
    this.loadBackups();
    this.startScheduledBackup();
  }

  // Configuration Management
  updateConfig(updates: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    this.startScheduledBackup();
  }

  getConfig(): BackupConfig {
    return { ...this.config };
  }

  setCloudStorage(config: CloudStorageConfig): void {
    this.cloudConfig = config;
    this.config.storage.cloud = true;
    this.config.storage.cloudProvider = config.provider;
    this.saveConfig();
  }

  // Backup Operations
  async createBackup(notes: Note[], options: {
    type?: 'full' | 'incremental' | 'differential';
    description?: string;
    tags?: string[];
  } = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = this.generateBackupId();
    const errors: string[] = [];
    const warnings: string[] = [];
    const storageLocations: string[] = [];

    try {
      // Create backup data
      const backupData = this.createBackupData(notes, options.type || this.config.strategy);
      
      // Compress if enabled
      let processedData = backupData;
      if (this.config.compression) {
        processedData = await this.compressData(backupData);
      }

      // Encrypt if enabled
      if (this.config.encryption) {
        processedData = await this.encryptData(processedData);
      }

      // Generate metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        type: options.type || this.config.strategy,
        size: backupData.length,
        compressedSize: this.config.compression ? processedData.length : undefined,
        encrypted: this.config.encryption,
        checksum: await this.generateChecksum(processedData),
        notesCount: notes.length,
        version: '1.0.0',
        description: options.description,
        tags: options.tags || []
      };

      // Store backup
      if (this.config.storage.local) {
        await this.storeLocalBackup(backupId, processedData, metadata);
        storageLocations.push('local');
      }

      if (this.config.storage.cloud && this.cloudConfig) {
        await this.storeCloudBackup(backupId, processedData, metadata);
        storageLocations.push('cloud');
      }

      // Update backup list
      this.backups.unshift(metadata);
      this.saveBackups();

      // Cleanup old backups
      this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      return {
        success: true,
        backupId,
        metadata,
        duration,
        errors,
        warnings,
        storageLocations
      };

    } catch (error) {
      errors.push(`Backup failed: ${error}`);
      return {
        success: false,
        backupId,
        metadata: {} as BackupMetadata,
        duration: Date.now() - startTime,
        errors,
        warnings,
        storageLocations
      };
    }
  }

  async restoreBackup(backupId: string, options: {
    conflictResolution?: 'overwrite' | 'rename' | 'skip';
    restoreToDate?: Date;
  } = {}): Promise<RestoreResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: RestoreResult['conflicts'] = [];

    try {
      // Find backup metadata
      const metadata = this.backups.find(b => b.id === backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Load backup data
      let backupData: string;
      if (this.config.storage.local) {
        backupData = await this.loadLocalBackup(backupId);
      } else if (this.config.storage.cloud && this.cloudConfig) {
        backupData = await this.loadCloudBackup(backupId);
      } else {
        throw new Error('No storage location available');
      }

      // Decrypt if needed
      if (metadata.encrypted) {
        backupData = await this.decryptData(backupData);
      }

      // Decompress if needed
      if (metadata.compressedSize) {
        backupData = await this.decompressData(backupData);
      }

      // Parse and validate backup data
      const backupContent = JSON.parse(backupData);
      const restoredNotes: Note[] = backupContent.notes || [];

      // Handle conflicts
      if (options.conflictResolution) {
        // This would check against existing notes and resolve conflicts
        // For now, we'll just return the notes as-is
      }

      const duration = Date.now() - startTime;
      return {
        success: true,
        restoredNotes,
        duration,
        errors,
        warnings,
        conflicts
      };

    } catch (error) {
      errors.push(`Restore failed: ${error}`);
      return {
        success: false,
        restoredNotes: [],
        duration: Date.now() - startTime,
        errors,
        warnings,
        conflicts
      };
    }
  }

  // Backup Management
  getBackups(options: {
    type?: 'full' | 'incremental' | 'differential';
    limit?: number;
    offset?: number;
  } = {}): BackupMetadata[] {
    let filtered = [...this.backups];

    if (options.type) {
      filtered = filtered.filter(b => b.type === options.type);
    }

    if (options.offset) {
      filtered = filtered.slice(options.offset);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  deleteBackup(backupId: string): boolean {
    const index = this.backups.findIndex(b => b.id === backupId);
    if (index === -1) return false;

    const backup = this.backups[index];
    
    // Remove from storage
    if (this.config.storage.local) {
      this.deleteLocalBackup(backupId);
    }
    
    if (this.config.storage.cloud && this.cloudConfig) {
      this.deleteCloudBackup(backupId);
    }

    // Remove from list
    this.backups.splice(index, 1);
    this.saveBackups();

    return true;
  }

  getBackupStatus(): BackupStatus {
    const lastBackup = this.backups[0];
    const totalSize = this.backups.reduce((sum, b) => sum + (b.compressedSize || b.size), 0);
    
    let health: BackupStatus['health'] = 'good';
    const issues: string[] = [];

    // Check for issues
    if (this.backups.length === 0) {
      health = 'warning';
      issues.push('No backups found');
    }

    if (lastBackup) {
      const daysSinceLastBackup = (Date.now() - lastBackup.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastBackup > 7) {
        health = 'warning';
        issues.push('Last backup is more than 7 days old');
      }
    }

    if (totalSize > 1024 * 1024 * 1024) { // 1GB
      health = 'warning';
      issues.push('Total backup size exceeds 1GB');
    }

    return {
      lastBackup,
      nextScheduledBackup: this.getNextScheduledBackup(),
      totalBackups: this.backups.length,
      totalSize,
      storageUsage: {
        local: totalSize,
        cloud: this.config.storage.cloud ? totalSize : 0
      },
      health,
      issues
    };
  }

  // Private Methods
  private createBackupData(notes: Note[], type: 'full' | 'incremental' | 'differential'): string {
    const backupContent = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      type,
      notes,
      metadata: {
        totalNotes: notes.length,
        categories: [...new Set(notes.map(n => n.category))],
        tags: [...new Set(notes.flatMap(n => n.tags))],
        dateRange: {
          earliest: new Date(Math.min(...notes.map(n => n.createdAt.getTime()))).toISOString(),
          latest: new Date(Math.max(...notes.map(n => n.updatedAt.getTime()))).toISOString()
        }
      }
    };

    return JSON.stringify(backupContent, null, 2);
  }

  private async compressData(data: string): Promise<string> {
    // Simple compression using gzip-like approach
    // In a real implementation, you'd use a proper compression library
    return btoa(data); // Base64 encoding as simple compression
  }

  private async decompressData(data: string): Promise<string> {
    // Simple decompression
    return atob(data); // Base64 decoding
  }

  private async encryptData(data: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    // Simple encryption using XOR with key
    // In a real implementation, you'd use proper encryption
    const key = this.config.encryptionKey;
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  }

  private async decryptData(data: string): Promise<string> {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not provided');
    }

    // Simple decryption
    const key = this.config.encryptionKey;
    const decoded = atob(data);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  }

  private async generateChecksum(data: string): Promise<string> {
    // Simple checksum using string hash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async storeLocalBackup(backupId: string, data: string, metadata: BackupMetadata): Promise<void> {
    const backupDir = 'backups';
    const backupPath = `${backupDir}/${backupId}.backup`;
    const metadataPath = `${backupDir}/${backupId}.meta`;

    // In a real implementation, you'd write to the file system
    // For now, we'll store in localStorage
    localStorage.setItem(`backup_${backupId}`, data);
    localStorage.setItem(`backup_meta_${backupId}`, JSON.stringify(metadata));
  }

  private async loadLocalBackup(backupId: string): Promise<string> {
    const data = localStorage.getItem(`backup_${backupId}`);
    if (!data) {
      throw new Error(`Backup not found: ${backupId}`);
    }
    return data;
  }

  private deleteLocalBackup(backupId: string): void {
    localStorage.removeItem(`backup_${backupId}`);
    localStorage.removeItem(`backup_meta_${backupId}`);
  }

  private async storeCloudBackup(backupId: string, data: string, metadata: BackupMetadata): Promise<void> {
    if (!this.cloudConfig) {
      throw new Error('Cloud storage not configured');
    }

    // In a real implementation, you'd upload to the cloud provider
    // For now, we'll simulate the upload
    console.log(`Uploading backup ${backupId} to ${this.cloudConfig.provider}`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async loadCloudBackup(backupId: string): Promise<string> {
    if (!this.cloudConfig) {
      throw new Error('Cloud storage not configured');
    }

    // In a real implementation, you'd download from the cloud provider
    // For now, we'll simulate the download
    console.log(`Downloading backup ${backupId} from ${this.cloudConfig.provider}`);
    
    // Simulate download delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return from local storage as fallback
    return this.loadLocalBackup(backupId);
  }

  private deleteCloudBackup(backupId: string): void {
    if (!this.cloudConfig) return;

    // In a real implementation, you'd delete from the cloud provider
    console.log(`Deleting backup ${backupId} from ${this.cloudConfig.provider}`);
  }

  private cleanupOldBackups(): void {
    const now = Date.now();
    const maxAge = this.config.retention.days * 24 * 60 * 60 * 1000;
    const maxBackups = this.config.retention.maxBackups;

    // Remove old backups
    this.backups = this.backups.filter(backup => {
      const age = now - backup.timestamp.getTime();
      return age <= maxAge;
    });

    // Remove excess backups
    if (this.backups.length > maxBackups) {
      const toDelete = this.backups.slice(maxBackups);
      toDelete.forEach(backup => {
        this.deleteBackup(backup.id);
      });
      this.backups = this.backups.slice(0, maxBackups);
    }
  }

  private startScheduledBackup(): void {
    if (this.scheduledBackupTimer) {
      clearTimeout(this.scheduledBackupTimer);
    }

    if (!this.config.schedule.enabled) return;

    const nextBackup = this.getNextScheduledBackup();
    if (!nextBackup) return;

    const delay = nextBackup.getTime() - Date.now();
    if (delay > 0) {
      this.scheduledBackupTimer = setTimeout(() => {
        this.executeScheduledBackup();
      }, delay);
    }
  }

  private getNextScheduledBackup(): Date | undefined {
    if (!this.config.schedule.enabled) return undefined;

    const now = new Date();
    const [hours, minutes] = this.config.schedule.time.split(':').map(Number);
    
    let nextBackup = new Date(now);
    nextBackup.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for next occurrence
    if (nextBackup <= now) {
      switch (this.config.schedule.frequency) {
        case 'daily':
          nextBackup.setDate(nextBackup.getDate() + 1);
          break;
        case 'weekly':
          if (this.config.schedule.dayOfWeek !== undefined) {
            const daysUntilNext = (this.config.schedule.dayOfWeek - now.getDay() + 7) % 7;
            nextBackup.setDate(nextBackup.getDate() + daysUntilNext);
          } else {
            nextBackup.setDate(nextBackup.getDate() + 7);
          }
          break;
        case 'monthly':
          if (this.config.schedule.dayOfMonth) {
            nextBackup.setDate(this.config.schedule.dayOfMonth);
            if (nextBackup <= now) {
              nextBackup.setMonth(nextBackup.getMonth() + 1);
            }
          } else {
            nextBackup.setMonth(nextBackup.getMonth() + 1);
          }
          break;
      }
    }

    return nextBackup;
  }

  private async executeScheduledBackup(): Promise<void> {
    // This would typically get notes from the note service
    const notes: Note[] = []; // Get from note service
    
    if (notes.length > 0) {
      await this.createBackup(notes, {
        description: 'Scheduled backup',
        tags: ['scheduled']
      });
    }

    // Schedule next backup
    this.startScheduledBackup();
  }

  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event Listeners
  onBackupEvent(callback: (event: string, data: any) => void): string {
    const listenerId = this.generateBackupId();
    this.listeners.set(listenerId, callback);
    return listenerId;
  }

  removeListener(listenerId: string): boolean {
    return this.listeners.delete(listenerId);
  }

  private emitEvent(event: string, data: any): void {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Backup event listener error:', error);
      }
    });
  }

  // Persistence
  private saveConfig(): void {
    localStorage.setItem('backupConfig', JSON.stringify(this.config));
  }

  private loadConfig(): void {
    const saved = localStorage.getItem('backupConfig');
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
    }
  }

  private saveBackups(): void {
    localStorage.setItem('backups', JSON.stringify(this.backups));
  }

  private loadBackups(): void {
    const saved = localStorage.getItem('backups');
    if (saved) {
      this.backups = JSON.parse(saved).map((b: any) => ({
        ...b,
        timestamp: new Date(b.timestamp)
      }));
    }
  }

  // Cleanup
  cleanup(): void {
    if (this.scheduledBackupTimer) {
      clearTimeout(this.scheduledBackupTimer);
    }
    this.listeners.clear();
  }
}

export const advancedBackupService = new AdvancedBackupService(); 