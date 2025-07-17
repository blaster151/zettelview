export interface PermissionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'notes' | 'ui' | 'storage' | 'api' | 'system';
  risk: 'low' | 'medium' | 'high';
  required: boolean;
  defaultGranted: boolean;
}

export interface PermissionRequest {
  pluginId: string;
  permissions: string[];
  timestamp: Date;
  status: 'pending' | 'granted' | 'denied';
  userResponse?: boolean;
}

export interface PluginPermissions {
  pluginId: string;
  grantedPermissions: string[];
  deniedPermissions: string[];
  lastUpdated: Date;
}

// Define all available permissions
export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  // Note permissions
  {
    id: 'notes.read',
    name: 'Read Notes',
    description: 'Access to read all notes and their content',
    category: 'notes',
    risk: 'low',
    required: true,
    defaultGranted: true
  },
  {
    id: 'notes.write',
    name: 'Create and Edit Notes',
    description: 'Create new notes and modify existing note content',
    category: 'notes',
    risk: 'medium',
    required: false,
    defaultGranted: false
  },
  {
    id: 'notes.delete',
    name: 'Delete Notes',
    description: 'Permanently delete notes from the system',
    category: 'notes',
    risk: 'high',
    required: false,
    defaultGranted: false
  },
  {
    id: 'notes.search',
    name: 'Search Notes',
    description: 'Perform searches across all notes',
    category: 'notes',
    risk: 'low',
    required: false,
    defaultGranted: true
  },

  // UI permissions
  {
    id: 'ui.notifications',
    name: 'Show Notifications',
    description: 'Display notifications to the user',
    category: 'ui',
    risk: 'low',
    required: false,
    defaultGranted: true
  },
  {
    id: 'ui.modals',
    name: 'Open Modal Dialogs',
    description: 'Open modal dialogs and overlays',
    category: 'ui',
    risk: 'medium',
    required: false,
    defaultGranted: false
  },
  {
    id: 'ui.panels',
    name: 'Register UI Panels',
    description: 'Add custom panels to the application interface',
    category: 'ui',
    risk: 'medium',
    required: false,
    defaultGranted: false
  },
  {
    id: 'ui.commands',
    name: 'Register Commands',
    description: 'Add custom commands and keyboard shortcuts',
    category: 'ui',
    risk: 'medium',
    required: false,
    defaultGranted: false
  },
  {
    id: 'ui.menus',
    name: 'Register Menu Items',
    description: 'Add items to application menus',
    category: 'ui',
    risk: 'low',
    required: false,
    defaultGranted: false
  },

  // Storage permissions
  {
    id: 'storage.read',
    name: 'Read Plugin Storage',
    description: 'Access to read plugin-specific data',
    category: 'storage',
    risk: 'low',
    required: true,
    defaultGranted: true
  },
  {
    id: 'storage.write',
    name: 'Write Plugin Storage',
    description: 'Store and modify plugin-specific data',
    category: 'storage',
    risk: 'low',
    required: false,
    defaultGranted: true
  },

  // API permissions
  {
    id: 'api.external',
    name: 'External API Access',
    description: 'Make requests to external services and APIs',
    category: 'api',
    risk: 'high',
    required: false,
    defaultGranted: false
  },
  {
    id: 'api.network',
    name: 'Network Access',
    description: 'Access to network resources and internet',
    category: 'api',
    risk: 'high',
    required: false,
    defaultGranted: false
  },

  // System permissions
  {
    id: 'system.clipboard',
    name: 'Clipboard Access',
    description: 'Read and write to system clipboard',
    category: 'system',
    risk: 'medium',
    required: false,
    defaultGranted: false
  },
  {
    id: 'system.files',
    name: 'File System Access',
    description: 'Read and write files on the local system',
    category: 'system',
    risk: 'high',
    required: false,
    defaultGranted: false
  }
];

class PluginPermissionsService {
  private permissions: Map<string, PluginPermissions> = new Map();
  private requests: PermissionRequest[] = [];
  private readonly STORAGE_KEY = 'zettelview_plugin_permissions';

  constructor() {
    this.loadPermissions();
  }

  /**
   * Get permission definition by ID
   */
  getPermissionDefinition(permissionId: string): PermissionDefinition | undefined {
    return AVAILABLE_PERMISSIONS.find(p => p.id === permissionId);
  }

  /**
   * Get all available permissions
   */
  getAllPermissions(): PermissionDefinition[] {
    return [...AVAILABLE_PERMISSIONS];
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: PermissionDefinition['category']): PermissionDefinition[] {
    return AVAILABLE_PERMISSIONS.filter(p => p.category === category);
  }

  /**
   * Check if a plugin has a specific permission
   */
  hasPermission(pluginId: string, permissionId: string): boolean {
    const pluginPerms = this.permissions.get(pluginId);
    if (!pluginPerms) {
      // Check if permission is default granted
      const permDef = this.getPermissionDefinition(permissionId);
      return permDef?.defaultGranted || false;
    }
    return pluginPerms.grantedPermissions.includes(permissionId);
  }

  /**
   * Get all permissions for a plugin
   */
  getPluginPermissions(pluginId: string): PluginPermissions | null {
    return this.permissions.get(pluginId) || null;
  }

  /**
   * Grant permissions to a plugin
   */
  grantPermissions(pluginId: string, permissionIds: string[]): void {
    let pluginPerms = this.permissions.get(pluginId);
    
    if (!pluginPerms) {
      pluginPerms = {
        pluginId,
        grantedPermissions: [],
        deniedPermissions: [],
        lastUpdated: new Date()
      };
    }

    // Add to granted permissions
    permissionIds.forEach(permissionId => {
      if (!pluginPerms!.grantedPermissions.includes(permissionId)) {
        pluginPerms!.grantedPermissions.push(permissionId);
      }
      // Remove from denied permissions if present
      pluginPerms!.deniedPermissions = pluginPerms!.deniedPermissions.filter(p => p !== permissionId);
    });

    pluginPerms.lastUpdated = new Date();
    this.permissions.set(pluginId, pluginPerms);
    this.savePermissions();
  }

  /**
   * Deny permissions to a plugin
   */
  denyPermissions(pluginId: string, permissionIds: string[]): void {
    let pluginPerms = this.permissions.get(pluginId);
    
    if (!pluginPerms) {
      pluginPerms = {
        pluginId,
        grantedPermissions: [],
        deniedPermissions: [],
        lastUpdated: new Date()
      };
    }

    // Add to denied permissions
    permissionIds.forEach(permissionId => {
      if (!pluginPerms!.deniedPermissions.includes(permissionId)) {
        pluginPerms!.deniedPermissions.push(permissionId);
      }
      // Remove from granted permissions if present
      pluginPerms!.grantedPermissions = pluginPerms!.grantedPermissions.filter(p => p !== permissionId);
    });

    pluginPerms.lastUpdated = new Date();
    this.permissions.set(pluginId, pluginPerms);
    this.savePermissions();
  }

  /**
   * Revoke permissions from a plugin
   */
  revokePermissions(pluginId: string, permissionIds: string[]): void {
    const pluginPerms = this.permissions.get(pluginId);
    if (!pluginPerms) return;

    // Remove from granted permissions
    pluginPerms.grantedPermissions = pluginPerms.grantedPermissions.filter(
      p => !permissionIds.includes(p)
    );

    pluginPerms.lastUpdated = new Date();
    this.permissions.set(pluginId, pluginPerms);
    this.savePermissions();
  }

  /**
   * Request permissions for a plugin
   */
  requestPermissions(pluginId: string, permissionIds: string[]): PermissionRequest {
    const request: PermissionRequest = {
      pluginId,
      permissions: permissionIds,
      timestamp: new Date(),
      status: 'pending'
    };

    this.requests.push(request);
    return request;
  }

  /**
   * Respond to a permission request
   */
  respondToRequest(requestId: string, granted: boolean): void {
    const request = this.requests.find(r => r.pluginId === requestId);
    if (!request) return;

    request.status = granted ? 'granted' : 'denied';
    request.userResponse = granted;

    if (granted) {
      this.grantPermissions(request.pluginId, request.permissions);
    } else {
      this.denyPermissions(request.pluginId, request.permissions);
    }
  }

  /**
   * Get pending permission requests
   */
  getPendingRequests(): PermissionRequest[] {
    return this.requests.filter(r => r.status === 'pending');
  }

  /**
   * Get all permission requests for a plugin
   */
  getPluginRequests(pluginId: string): PermissionRequest[] {
    return this.requests.filter(r => r.pluginId === pluginId);
  }

  /**
   * Validate required permissions for a plugin
   */
  validateRequiredPermissions(pluginId: string, requestedPermissions: string[]): {
    valid: boolean;
    missing: string[];
    granted: string[];
    denied: string[];
  } {
    const requiredPermissions = requestedPermissions.filter(permId => {
      const permDef = this.getPermissionDefinition(permId);
      return permDef?.required || false;
    });

    const missing: string[] = [];
    const granted: string[] = [];
    const denied: string[] = [];

    requiredPermissions.forEach(permId => {
      if (this.hasPermission(pluginId, permId)) {
        granted.push(permId);
      } else {
        const pluginPerms = this.permissions.get(pluginId);
        if (pluginPerms?.deniedPermissions.includes(permId)) {
          denied.push(permId);
        } else {
          missing.push(permId);
        }
      }
    });

    return {
      valid: missing.length === 0 && denied.length === 0,
      missing,
      granted,
      denied
    };
  }

  /**
   * Get permission risk assessment for a plugin
   */
  getRiskAssessment(pluginId: string): {
    low: string[];
    medium: string[];
    high: string[];
    totalRisk: 'low' | 'medium' | 'high';
  } {
    const pluginPerms = this.permissions.get(pluginId);
    if (!pluginPerms) {
      return { low: [], medium: [], high: [], totalRisk: 'low' };
    }

    const low: string[] = [];
    const medium: string[] = [];
    const high: string[] = [];

    pluginPerms.grantedPermissions.forEach(permId => {
      const permDef = this.getPermissionDefinition(permId);
      if (permDef) {
        switch (permDef.risk) {
          case 'low':
            low.push(permId);
            break;
          case 'medium':
            medium.push(permId);
            break;
          case 'high':
            high.push(permId);
            break;
        }
      }
    });

    let totalRisk: 'low' | 'medium' | 'high' = 'low';
    if (high.length > 0) {
      totalRisk = 'high';
    } else if (medium.length > 0) {
      totalRisk = 'medium';
    }

    return { low, medium, high, totalRisk };
  }

  /**
   * Reset all permissions for a plugin
   */
  resetPluginPermissions(pluginId: string): void {
    this.permissions.delete(pluginId);
    this.requests = this.requests.filter(r => r.pluginId !== pluginId);
    this.savePermissions();
  }

  /**
   * Clear all plugin permissions (for testing/reset)
   */
  clearAllPermissions(): void {
    this.permissions.clear();
    this.requests = [];
    this.savePermissions();
  }

  /**
   * Load permissions from storage
   */
  private loadPermissions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.permissions = new Map(Object.entries(data.permissions || {}));
        this.requests = (data.requests || []).map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load plugin permissions:', error);
    }
  }

  /**
   * Save permissions to storage
   */
  private savePermissions(): void {
    try {
      const data = {
        permissions: Object.fromEntries(this.permissions),
        requests: this.requests
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save plugin permissions:', error);
    }
  }
}

export const pluginPermissionsService = new PluginPermissionsService(); 