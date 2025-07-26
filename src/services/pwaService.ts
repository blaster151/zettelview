export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  scope: string;
  startUrl: string;
  icons: PWAIcon[];
  shortcuts?: PWAShortcut[];
  categories?: string[];
  lang?: string;
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PWAShortcut {
  name: string;
  shortName: string;
  description: string;
  url: string;
  icons?: PWAIcon[];
}

export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  isServiceWorkerActive: boolean;
  hasUpdate: boolean;
  cacheSize: number;
  lastSync: Date | null;
}

class PWAService {
  private config: PWAConfig;
  private status: PWAStatus;
  private installPrompt: PWAInstallPrompt | null = null;
  private updateCallback: ((status: PWAStatus) => void) | null = null;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(config: PWAConfig) {
    this.config = config;
    this.status = {
      isInstalled: false,
      isInstallable: false,
      isOnline: navigator.onLine,
      isServiceWorkerActive: false,
      hasUpdate: false,
      cacheSize: 0,
      lastSync: null
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.registerServiceWorker();
    this.setupEventListeners();
    this.checkInstallStatus();
    this.updateStatus();
  }

  // Service Worker Registration
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: this.config.scope
      });

      console.log('Service Worker registered:', this.serviceWorkerRegistration);

      // Handle service worker updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.status.hasUpdate = true;
              this.updateStatus();
            }
          });
        }
      });

      // Handle service worker state changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.status.isServiceWorkerActive = true;
        this.updateStatus();
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Event Listeners
  private setupEventListeners(): void {
    // Online/Offline events
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.updateStatus();
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.updateStatus();
    });

    // Before install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event as PWAInstallPrompt;
      this.status.isInstallable = true;
      this.updateStatus();
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      this.status.isInstalled = true;
      this.status.isInstallable = false;
      this.installPrompt = null;
      this.updateStatus();
      console.log('PWA installed successfully');
    });

    // Service Worker message events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
    }
  }

  // Install Prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const choice = await this.installPrompt.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return false;
    }
  }

  // Offline Data Management
  private async syncOfflineData(): Promise<void> {
    if (!this.status.isOnline) return;

    try {
      // Sync pending notes
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_OFFLINE_DATA'
        });
      }

      this.status.lastSync = new Date();
      this.updateStatus();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  // Cache Management
  async clearCache(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );

      this.status.cacheSize = 0;
      this.updateStatus();
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      this.status.cacheSize = totalSize;
      this.updateStatus();
      return totalSize;
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
      return 0;
    }
  }

  // Update Management
  async updateApp(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    try {
      await this.serviceWorkerRegistration.update();
      console.log('App update initiated');
    } catch (error) {
      console.error('Failed to update app:', error);
    }
  }

  async skipWaiting(): Promise<void> {
    if (!this.serviceWorkerRegistration || !this.serviceWorkerRegistration.waiting) {
      return;
    }

    try {
      this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      console.log('Skip waiting message sent');
    } catch (error) {
      console.error('Failed to skip waiting:', error);
    }
  }

  // Status Management
  private checkInstallStatus(): void {
    // Check if app is installed (running in standalone mode)
    this.status.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true;
  }

  private updateStatus(): void {
    if (this.updateCallback) {
      this.updateCallback(this.status);
    }
  }

  // Service Worker Message Handling
  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_SIZE_UPDATED':
        this.status.cacheSize = data.size;
        this.updateStatus();
        break;
      case 'SYNC_COMPLETED':
        this.status.lastSync = new Date();
        this.updateStatus();
        break;
      case 'UPDATE_AVAILABLE':
        this.status.hasUpdate = true;
        this.updateStatus();
        break;
      default:
        console.log('Unknown service worker message:', data);
    }
  }

  // Public API
  getStatus(): PWAStatus {
    return { ...this.status };
  }

  onStatusUpdate(callback: (status: PWAStatus) => void): void {
    this.updateCallback = callback;
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: this.config.icons[0]?.src,
        badge: this.config.icons[0]?.src,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Background Sync
  async registerBackgroundSync(tag: string): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    if (!this.serviceWorkerRegistration) {
      console.warn('Service Worker not registered');
      return;
    }

    try {
      await this.serviceWorkerRegistration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  // App Manifest
  getManifest(): PWAConfig {
    return { ...this.config };
  }

  // Utility Methods
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  getConnectionType(): string {
    if (!('connection' in navigator)) {
      return 'unknown';
    }

    const connection = (navigator as any).connection;
    return connection.effectiveType || connection.type || 'unknown';
  }

  // Debug Methods
  async debugInfo(): Promise<any> {
    return {
      status: this.getStatus(),
      manifest: this.getManifest(),
      isStandalone: this.isStandalone(),
      isMobile: this.isMobile(),
      connectionType: this.getConnectionType(),
      userAgent: navigator.userAgent,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      cacheSupported: 'caches' in window,
      notificationSupported: 'Notification' in window,
      backgroundSyncSupported: 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }
}

// Default PWA configuration
const defaultPWAConfig: PWAConfig = {
  name: 'ZettelView - Advanced Note Management',
  shortName: 'ZettelView',
  description: 'A sophisticated Markdown-based knowledge base application with advanced search, collaboration, and AI-powered features',
  themeColor: '#0066cc',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'any',
  scope: '/',
  startUrl: '/',
  lang: 'en',
  categories: ['productivity', 'education', 'utilities'],
  icons: [
    {
      src: '/logo192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/logo512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ],
  shortcuts: [
    {
      name: 'New Note',
      shortName: 'New',
      description: 'Create a new note',
      url: '/?action=new-note'
    },
    {
      name: 'Search Notes',
      shortName: 'Search',
      description: 'Search your notes',
      url: '/?action=search'
    }
  ]
};

// Create and export the PWA service instance
export const pwaService = new PWAService(defaultPWAConfig); 