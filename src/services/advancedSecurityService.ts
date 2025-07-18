import { Note } from '../types/domain';

export interface SecurityConfig {
  enableEncryption: boolean;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyDerivationIterations: number;
  enableTwoFactorAuth: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  enableAuditLogging: boolean;
  enableAccessControl: boolean;
  enableDataAnonymization: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer' | 'guest';
  permissions: string[];
  twoFactorEnabled: boolean;
  lastLogin: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastPasswordChange: Date;
  };
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'admin';
  conditions?: Record<string, any>;
}

export interface AccessControlEntry {
  id: string;
  resourceType: 'note' | 'tag' | 'user' | 'system';
  resourceId: string;
  userId: string;
  permissions: string[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

export interface EncryptionKey {
  id: string;
  key: CryptoKey;
  algorithm: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata: Record<string, any>;
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'permission_denied' | 'suspicious_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  userId?: string;
  details: Record<string, any>;
}

class AdvancedSecurityService {
  private config: SecurityConfig = {
    enableEncryption: true,
    encryptionAlgorithm: 'AES-256-GCM',
    keyDerivationIterations: 100000,
    enableTwoFactorAuth: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    enableAuditLogging: true,
    enableAccessControl: true,
    enableDataAnonymization: false
  };

  private users: Map<string, User> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private accessControl: Map<string, AccessControlEntry> = new Map();
  private auditLog: AuditLogEntry[] = [];
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private currentUser: User | null = null;
  private sessionStartTime: Date | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeDefaultPermissions();
    this.initializeDefaultUsers();
  }

  private initializeDefaultPermissions(): void {
    const defaultPermissions: Permission[] = [
      {
        id: 'note_create',
        name: 'Create Notes',
        description: 'Create new notes',
        resource: 'note',
        action: 'create'
      },
      {
        id: 'note_read',
        name: 'Read Notes',
        description: 'Read existing notes',
        resource: 'note',
        action: 'read'
      },
      {
        id: 'note_update',
        name: 'Update Notes',
        description: 'Update existing notes',
        resource: 'note',
        action: 'update'
      },
      {
        id: 'note_delete',
        name: 'Delete Notes',
        description: 'Delete notes',
        resource: 'note',
        action: 'delete'
      },
      {
        id: 'user_manage',
        name: 'Manage Users',
        description: 'Manage user accounts and permissions',
        resource: 'user',
        action: 'admin'
      },
      {
        id: 'system_admin',
        name: 'System Administration',
        description: 'Full system access',
        resource: 'system',
        action: 'admin'
      }
    ];

    defaultPermissions.forEach(permission => {
      this.permissions.set(permission.id, permission);
    });
  }

  private initializeDefaultUsers(): void {
    const defaultUsers: User[] = [
      {
        id: 'admin',
        username: 'admin',
        email: 'admin@zettelview.com',
        role: 'admin',
        permissions: ['system_admin'],
        twoFactorEnabled: false,
        lastLogin: new Date(),
        loginAttempts: 0,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastPasswordChange: new Date()
        }
      },
      {
        id: 'editor',
        username: 'editor',
        email: 'editor@zettelview.com',
        role: 'editor',
        permissions: ['note_create', 'note_read', 'note_update'],
        twoFactorEnabled: false,
        lastLogin: new Date(),
        loginAttempts: 0,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastPasswordChange: new Date()
        }
      },
      {
        id: 'viewer',
        username: 'viewer',
        email: 'viewer@zettelview.com',
        role: 'viewer',
        permissions: ['note_read'],
        twoFactorEnabled: false,
        lastLogin: new Date(),
        loginAttempts: 0,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastPasswordChange: new Date()
        }
      }
    ];

    defaultUsers.forEach(user => {
      this.users.set(user.id, user);
    });
  }

  // Authentication
  async authenticate(username: string, password: string, twoFactorCode?: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    requiresTwoFactor?: boolean;
  }> {
    const user = Array.from(this.users.values()).find(u => u.username === username);
    
    if (!user) {
      this.logAuditEvent('login', 'user', 'unknown', { username }, false, 'User not found');
      return { success: false, error: 'Invalid credentials' };
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logAuditEvent('login', 'user', user.id, { username }, false, 'Account locked');
      return { success: false, error: 'Account is locked' };
    }

    // Validate password (in a real implementation, this would check against hashed passwords)
    const passwordValid = await this.validatePassword(password, user);
    
    if (!passwordValid) {
      user.loginAttempts++;
      
      if (user.loginAttempts >= this.config.maxLoginAttempts) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
        this.logSecurityEvent('suspicious_activity', 'high', `Account locked due to multiple failed login attempts: ${username}`);
      }
      
      this.users.set(user.id, user);
      this.logAuditEvent('login', 'user', user.id, { username }, false, 'Invalid password');
      return { success: false, error: 'Invalid credentials' };
    }

    // Check two-factor authentication
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        this.logAuditEvent('login', 'user', user.id, { username }, false, 'Two-factor code required');
        return { success: false, requiresTwoFactor: true };
      }
      
      if (!this.validateTwoFactorCode(twoFactorCode, user)) {
        this.logAuditEvent('login', 'user', user.id, { username }, false, 'Invalid two-factor code');
        return { success: false, error: 'Invalid two-factor code' };
      }
    }

    // Successful authentication
    user.loginAttempts = 0;
    user.lastLogin = new Date();
    user.lockedUntil = undefined;
    this.users.set(user.id, user);

    this.currentUser = user;
    this.sessionStartTime = new Date();

    this.logAuditEvent('login', 'user', user.id, { username }, true);
    this.emitEvent('user_authenticated', user);

    return { success: true, user };
  }

  async logout(): Promise<void> {
    if (this.currentUser) {
      this.logAuditEvent('logout', 'user', this.currentUser.id, {}, true);
      this.emitEvent('user_logged_out', this.currentUser);
    }

    this.currentUser = null;
    this.sessionStartTime = null;
  }

  private async validatePassword(password: string, user: User): Promise<boolean> {
    // In a real implementation, this would validate against a hashed password
    // For demo purposes, we'll use simple validation
    return password.length >= this.config.passwordPolicy.minLength;
  }

  private validateTwoFactorCode(code: string, user: User): boolean {
    // In a real implementation, this would validate against a TOTP code
    // For demo purposes, we'll accept any 6-digit code
    return /^\d{6}$/.test(code);
  }

  // Authorization
  async checkPermission(userId: string, permissionId: string, resourceId?: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    // Check if user has the permission
    if (!user.permissions.includes(permissionId)) {
      this.logAuditEvent('permission_check', 'permission', permissionId, { userId, resourceId }, false, 'Permission denied');
      return false;
    }

    // Check access control if resource is specified
    if (resourceId) {
      const hasAccess = await this.checkResourceAccess(userId, permissionId, resourceId);
      if (!hasAccess) {
        this.logAuditEvent('permission_check', 'permission', permissionId, { userId, resourceId }, false, 'Resource access denied');
        return false;
      }
    }

    this.logAuditEvent('permission_check', 'permission', permissionId, { userId, resourceId }, true);
    return true;
  }

  async checkResourceAccess(userId: string, permissionId: string, resourceId: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;

    // Admin users have access to everything
    if (user.role === 'admin') return true;

    // Check specific access control entries
    const accessEntries = Array.from(this.accessControl.values())
      .filter(entry => entry.userId === userId && entry.resourceId === resourceId);

    for (const entry of accessEntries) {
      if (entry.permissions.includes(permissionId)) {
        // Check if access has expired
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          continue;
        }
        return true;
      }
    }

    return false;
  }

  async grantAccess(userId: string, resourceId: string, permissions: string[], grantedBy: string, expiresAt?: Date): Promise<void> {
    const entry: AccessControlEntry = {
      id: this.generateId(),
      resourceType: 'note', // This would be determined by the resource
      resourceId,
      userId,
      permissions,
      grantedAt: new Date(),
      grantedBy,
      expiresAt
    };

    this.accessControl.set(entry.id, entry);
    this.logAuditEvent('access_granted', 'access_control', entry.id, { userId, resourceId, permissions }, true);
    this.emitEvent('access_granted', entry);
  }

  async revokeAccess(entryId: string, revokedBy: string): Promise<void> {
    const entry = this.accessControl.get(entryId);
    if (!entry) return;

    this.accessControl.delete(entryId);
    this.logAuditEvent('access_revoked', 'access_control', entryId, { userId: entry.userId, resourceId: entry.resourceId }, true);
    this.emitEvent('access_revoked', entry);
  }

  // Encryption
  async generateEncryptionKey(): Promise<EncryptionKey> {
    const key = await crypto.subtle.generateKey(
      {
        name: this.config.encryptionAlgorithm === 'AES-256-GCM' ? 'AES-GCM' : 'ChaCha20-Poly1305',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );

    const encryptionKey: EncryptionKey = {
      id: this.generateId(),
      key,
      algorithm: this.config.encryptionAlgorithm,
      createdAt: new Date(),
      metadata: {}
    };

    this.encryptionKeys.set(encryptionKey.id, encryptionKey);
    return encryptionKey;
  }

  async encryptData(data: string, keyId: string): Promise<{
    encryptedData: string;
    iv: string;
    tag?: string;
  }> {
    if (!this.config.enableEncryption) {
      return { encryptedData: data, iv: '', tag: undefined };
    }

    const encryptionKey = this.encryptionKeys.get(keyId);
    if (!encryptionKey) {
      throw new Error('Encryption key not found');
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    let encryptedData: ArrayBuffer;
    let tag: ArrayBuffer | undefined;

    if (this.config.encryptionAlgorithm === 'AES-256-GCM') {
      encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        encryptionKey.key,
        encodedData
      );
    } else {
      // ChaCha20-Poly1305
      encryptedData = await crypto.subtle.encrypt(
        {
          name: 'ChaCha20-Poly1305',
          iv
        },
        encryptionKey.key,
        encodedData
      );
    }

    return {
      encryptedData: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      iv: btoa(String.fromCharCode(...iv)),
      tag: tag ? btoa(String.fromCharCode(...new Uint8Array(tag))) : undefined
    };
  }

  async decryptData(encryptedData: string, keyId: string, iv: string, tag?: string): Promise<string> {
    if (!this.config.enableEncryption) {
      return encryptedData;
    }

    const encryptionKey = this.encryptionKeys.get(keyId);
    if (!encryptionKey) {
      throw new Error('Encryption key not found');
    }

    const ivArray = new Uint8Array(atob(iv).split('').map(char => char.charCodeAt(0)));
    const dataArray = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));

    let decryptedData: ArrayBuffer;

    if (this.config.encryptionAlgorithm === 'AES-256-GCM') {
      decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivArray
        },
        encryptionKey.key,
        dataArray
      );
    } else {
      // ChaCha20-Poly1305
      decryptedData = await crypto.subtle.decrypt(
        {
          name: 'ChaCha20-Poly1305',
          iv: ivArray
        },
        encryptionKey.key,
        dataArray
      );
    }

    return new TextDecoder().decode(decryptedData);
  }

  // Audit Logging
  logAuditEvent(
    action: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>,
    success: boolean,
    errorMessage?: string
  ): void {
    if (!this.config.enableAuditLogging) return;

    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      userId: this.currentUser?.id || 'anonymous',
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: '127.0.0.1', // In a real implementation, this would come from the request
      userAgent: navigator.userAgent,
      success,
      errorMessage
    };

    this.auditLog.push(entry);
    this.emitEvent('audit_log_entry', entry);
  }

  getAuditLog(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    success?: boolean;
  }): AuditLogEntry[] {
    let filteredLog = [...this.auditLog];

    if (filters) {
      if (filters.userId) {
        filteredLog = filteredLog.filter(entry => entry.userId === filters.userId);
      }
      if (filters.action) {
        filteredLog = filteredLog.filter(entry => entry.action === filters.action);
      }
      if (filters.resourceType) {
        filteredLog = filteredLog.filter(entry => entry.resourceType === filters.resourceType);
      }
      if (filters.startDate) {
        filteredLog = filteredLog.filter(entry => entry.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLog = filteredLog.filter(entry => entry.timestamp <= filters.endDate!);
      }
      if (filters.success !== undefined) {
        filteredLog = filteredLog.filter(entry => entry.success === filters.success);
      }
    }

    return filteredLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Security Events
  logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    description: string,
    userId?: string,
    details: Record<string, any> = {}
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      description,
      timestamp: new Date(),
      userId,
      details
    };

    this.securityEvents.push(event);
    this.emitEvent('security_event', event);

    // Handle critical events
    if (severity === 'critical') {
      this.handleCriticalSecurityEvent(event);
    }
  }

  private handleCriticalSecurityEvent(event: SecurityEvent): void {
    // In a real implementation, this would trigger alerts, notifications, etc.
    console.error('CRITICAL SECURITY EVENT:', event);
    
    // Example actions:
    // - Send email alerts to administrators
    // - Lock affected accounts
    // - Trigger incident response procedures
    // - Log to external security monitoring systems
  }

  getSecurityEvents(filters?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    startDate?: Date;
    endDate?: Date;
  }): SecurityEvent[] {
    let filteredEvents = [...this.securityEvents];

    if (filters) {
      if (filters.type) {
        filteredEvents = filteredEvents.filter(event => event.type === filters.type);
      }
      if (filters.severity) {
        filteredEvents = filteredEvents.filter(event => event.severity === filters.severity);
      }
      if (filters.startDate) {
        filteredEvents = filteredEvents.filter(event => event.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredEvents = filteredEvents.filter(event => event.timestamp <= filters.endDate!);
      }
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Data Anonymization
  anonymizeData(data: any, fields: string[]): any {
    if (!this.config.enableDataAnonymization) return data;

    const anonymized = { ...data };
    
    fields.forEach(field => {
      if (anonymized[field]) {
        if (typeof anonymized[field] === 'string') {
          anonymized[field] = this.hashString(anonymized[field]);
        } else if (typeof anonymized[field] === 'number') {
          anonymized[field] = Math.floor(anonymized[field] / 100) * 100; // Round to nearest 100
        }
      }
    });

    return anonymized;
  }

  private hashString(str: string): string {
    // Simple hash function - in a real implementation, use a proper cryptographic hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `anon_${Math.abs(hash).toString(36)}`;
  }

  // Session Management
  isSessionValid(): boolean {
    if (!this.currentUser || !this.sessionStartTime) return false;

    const sessionDuration = Date.now() - this.sessionStartTime.getTime();
    const maxDuration = this.config.sessionTimeout * 60 * 1000; // Convert to milliseconds

    return sessionDuration < maxDuration;
  }

  extendSession(): void {
    this.sessionStartTime = new Date();
  }

  // User Management
  createUser(userData: Omit<User, 'id' | 'loginAttempts' | 'metadata'>): User {
    const user: User = {
      ...userData,
      id: this.generateId(),
      loginAttempts: 0,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        lastPasswordChange: new Date()
      }
    };

    this.users.set(user.id, user);
    this.logAuditEvent('user_created', 'user', user.id, { username: user.username }, true);
    this.emitEvent('user_created', user);

    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser: User = {
      ...user,
      ...updates,
      metadata: {
        ...user.metadata,
        updatedAt: new Date()
      }
    };

    this.users.set(userId, updatedUser);
    this.logAuditEvent('user_updated', 'user', userId, updates, true);
    this.emitEvent('user_updated', updatedUser);

    return updatedUser;
  }

  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    this.users.delete(userId);
    this.logAuditEvent('user_deleted', 'user', userId, { username: user.username }, true);
    this.emitEvent('user_deleted', user);

    return true;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Configuration
  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emitEvent('config_updated', this.config);
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Utility Methods
  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        console.error(`Error in security event listener for ${eventType}:`, error);
      }
    });
  }

  // Cleanup
  destroy(): void {
    this.users.clear();
    this.permissions.clear();
    this.accessControl.clear();
    this.auditLog = [];
    this.encryptionKeys.clear();
    this.securityEvents = [];
    this.eventListeners.clear();
  }
}

export const AdvancedSecurityService = new AdvancedSecurityService(); 