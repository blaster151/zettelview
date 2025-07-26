import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { pwaService } from '../pwaService';

// Mock service worker
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  scope: '/',
  updateViaCache: 'all',
  update: vi.fn(),
  unregister: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  sync: {
    register: vi.fn()
  }
};

// Mock ServiceWorkerRegistration prototype
const mockServiceWorkerRegistrationPrototype = {
  sync: {
    register: vi.fn()
  }
};

// Mock navigator
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    register: vi.fn().mockResolvedValue(mockServiceWorkerRegistration),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    controller: null,
    dispatchEvent: vi.fn()
  }
};

// Mock window
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  matchMedia: vi.fn().mockReturnValue({ matches: false }),
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
};

// Mock caches
const mockCaches = {
  keys: vi.fn().mockResolvedValue(['cache1', 'cache2']),
  open: vi.fn().mockResolvedValue({
    keys: vi.fn().mockResolvedValue([]),
    match: vi.fn().mockResolvedValue(null),
    put: vi.fn(),
    delete: vi.fn()
  }),
  delete: vi.fn().mockResolvedValue(true),
  match: vi.fn().mockResolvedValue(null)
};

// Mock Notification
const mockNotification = {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted')
};

// Mock connection
const mockConnection = {
  effectiveType: '4g',
  type: 'wifi'
};

describe('PWAService', () => {
  beforeEach(() => {
    // Setup global mocks
    global.navigator = mockNavigator as any;
    global.window = mockWindow as any;
    global.caches = mockCaches as any;
    global.Notification = mockNotification as any;
    (navigator as any).connection = mockConnection;
    
    // Mock ServiceWorkerRegistration prototype
    (global as any).ServiceWorkerRegistration = {
      prototype: mockServiceWorkerRegistrationPrototype
    };
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default config', () => {
      const status = pwaService.getStatus();
      expect(status.isOnline).toBe(true);
      expect(status.isInstalled).toBe(false);
      expect(status.isInstallable).toBe(false);
      expect(status.isServiceWorkerActive).toBe(false);
      expect(status.hasUpdate).toBe(false);
      expect(status.cacheSize).toBe(0);
      expect(status.lastSync).toBeNull();
    });

    test('should register service worker on initialization', async () => {
      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/'
      });
    });
  });

  describe('Status Management', () => {
    test('should return current status', () => {
      const status = pwaService.getStatus();
      expect(status).toHaveProperty('isOnline');
      expect(status).toHaveProperty('isInstalled');
      expect(status).toHaveProperty('isInstallable');
      expect(status).toHaveProperty('isServiceWorkerActive');
      expect(status).toHaveProperty('hasUpdate');
      expect(status).toHaveProperty('cacheSize');
      expect(status).toHaveProperty('lastSync');
    });

    test('should notify status updates', () => {
      const mockCallback = vi.fn();
      pwaService.onStatusUpdate(mockCallback);
      
      // Trigger a status update
      const status = pwaService.getStatus();
      expect(mockCallback).toHaveBeenCalledWith(status);
    });
  });

  describe('Install Prompt', () => {
    test('should handle install prompt when available', async () => {
      // Mock beforeinstallprompt event
      const mockPrompt = {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      // Simulate beforeinstallprompt event
      const event = new Event('beforeinstallprompt');
      (event as any).preventDefault = vi.fn();
      (event as any).prompt = mockPrompt.prompt;
      (event as any).userChoice = mockPrompt.userChoice;

      window.dispatchEvent(event);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 0));

      const status = pwaService.getStatus();
      expect(status.isInstallable).toBe(true);
    });

    test('should show install prompt', async () => {
      // Mock install prompt
      const mockPrompt = {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };

      // Set up the service to have an install prompt
      (pwaService as any).installPrompt = mockPrompt;

      const result = await pwaService.showInstallPrompt();
      expect(result).toBe(true);
      expect(mockPrompt.prompt).toHaveBeenCalled();
    });

    test('should handle install prompt rejection', async () => {
      const mockPrompt = {
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'dismissed' })
      };

      (pwaService as any).installPrompt = mockPrompt;

      const result = await pwaService.showInstallPrompt();
      expect(result).toBe(false);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      await pwaService.clearCache();
      expect(caches.keys).toHaveBeenCalled();
      expect(caches.delete).toHaveBeenCalled();
    });

    test('should get cache size', async () => {
      const size = await pwaService.getCacheSize();
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThanOrEqual(0);
    });

    test('should handle cache size calculation errors', async () => {
      // Mock cache error
      caches.keys = vi.fn().mockRejectedValue(new Error('Cache error'));
      
      const size = await pwaService.getCacheSize();
      expect(size).toBe(0);
    });
  });

  describe('Update Management', () => {
    test('should update app', async () => {
      await pwaService.updateApp();
      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled();
    });

    test('should skip waiting', async () => {
      // Mock waiting service worker
      (mockServiceWorkerRegistration.waiting as any) = {
        postMessage: vi.fn()
      };

      await pwaService.skipWaiting();
      expect((mockServiceWorkerRegistration.waiting as any)?.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING'
      });
    });
  });

  describe('Notification Management', () => {
    test('should request notification permission', async () => {
      const permission = await pwaService.requestNotificationPermission();
      expect(permission).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    test('should send notification when permission granted', async () => {
      // Mock notification constructor
      const mockNotificationInstance = {
        onclick: null,
        close: vi.fn()
      };
      const MockNotificationConstructor = vi.fn().mockImplementation(() => mockNotificationInstance);
      global.Notification = MockNotificationConstructor as any;

      await pwaService.sendNotification('Test notification');
      expect(MockNotificationConstructor).toHaveBeenCalledWith('Test notification', expect.any(Object));
    });

    test('should handle notification permission denied', async () => {
      (Notification as any).permission = 'denied';
      
      await pwaService.sendNotification('Test notification');
      // Should not throw error, just log warning
    });
  });

  describe('Background Sync', () => {
    test('should register background sync', async () => {
      await pwaService.registerBackgroundSync('test-sync');
      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('test-sync');
    });

    test('should handle background sync not supported', async () => {
      // Mock sync not supported
      (mockServiceWorkerRegistration.sync as any) = undefined;
      
      await pwaService.registerBackgroundSync('test-sync');
      // Should not throw error, just log warning
    });
  });

  describe('Utility Methods', () => {
    test('should check if app is standalone', () => {
      const isStandalone = pwaService.isStandalone();
      expect(typeof isStandalone).toBe('boolean');
    });

    test('should check if device is mobile', () => {
      const isMobile = pwaService.isMobile();
      expect(typeof isMobile).toBe('boolean');
    });

    test('should get connection type', () => {
      const connectionType = pwaService.getConnectionType();
      expect(typeof connectionType).toBe('string');
    });

    test('should return manifest', () => {
      const manifest = pwaService.getManifest();
      expect(manifest).toHaveProperty('name');
      expect(manifest).toHaveProperty('shortName');
      expect(manifest).toHaveProperty('description');
      expect(manifest).toHaveProperty('themeColor');
      expect(manifest).toHaveProperty('backgroundColor');
      expect(manifest).toHaveProperty('display');
      expect(manifest).toHaveProperty('orientation');
      expect(manifest).toHaveProperty('scope');
      expect(manifest).toHaveProperty('startUrl');
      expect(manifest).toHaveProperty('icons');
    });
  });

  describe('Debug Information', () => {
    test('should return debug info', async () => {
      const debugInfo = await pwaService.debugInfo();
      expect(debugInfo).toHaveProperty('status');
      expect(debugInfo).toHaveProperty('manifest');
      expect(debugInfo).toHaveProperty('isStandalone');
      expect(debugInfo).toHaveProperty('isMobile');
      expect(debugInfo).toHaveProperty('connectionType');
      expect(debugInfo).toHaveProperty('userAgent');
      expect(debugInfo).toHaveProperty('serviceWorkerSupported');
      expect(debugInfo).toHaveProperty('cacheSupported');
      expect(debugInfo).toHaveProperty('notificationSupported');
      expect(debugInfo).toHaveProperty('backgroundSyncSupported');
    });
  });

  describe('Event Handling', () => {
    test('should handle online event', () => {
      // Simulate online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);
      
      const status = pwaService.getStatus();
      expect(status.isOnline).toBe(true);
    });

    test('should handle offline event', () => {
      // Simulate offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);
      
      const status = pwaService.getStatus();
      expect(status.isOnline).toBe(false);
    });

    test('should handle app installed event', () => {
      // Simulate appinstalled event
      const installedEvent = new Event('appinstalled');
      window.dispatchEvent(installedEvent);
      
      const status = pwaService.getStatus();
      expect(status.isInstalled).toBe(true);
      expect(status.isInstallable).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle service worker registration failure', async () => {
      // Mock service worker registration failure
      navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('Registration failed'));
      
      // Create new instance to trigger registration
      const newPwaService = new (pwaService.constructor as any)(pwaService.getManifest());
      
      // Should not throw error, just log warning
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    test('should handle cache operations failure', async () => {
      // Mock cache failure
      caches.keys = vi.fn().mockRejectedValue(new Error('Cache error'));
      
      await pwaService.clearCache();
      // Should not throw error, just log warning
    });

    test('should handle notification failure', async () => {
      // Mock notification constructor failure
      const MockNotificationConstructor = vi.fn().mockImplementation(() => {
        throw new Error('Notification error');
      });
      global.Notification = MockNotificationConstructor as any;
      
      await pwaService.sendNotification('Test');
      // Should not throw error, just log warning
    });
  });

  describe('Service Worker Communication', () => {
    test('should handle service worker messages', () => {
      // Mock service worker message
      const message = {
        type: 'CACHE_SIZE_UPDATED',
        size: 1024
      };

      // Simulate message event
      const messageEvent = new MessageEvent('message', { data: message });
      (navigator.serviceWorker as any).dispatchEvent(messageEvent);
      
      // Should update status accordingly
      const status = pwaService.getStatus();
      expect(status.cacheSize).toBe(1024);
    });

    test('should handle unknown message types', () => {
      const message = {
        type: 'UNKNOWN_TYPE',
        data: 'test'
      };

      const messageEvent = new MessageEvent('message', { data: message });
      (navigator.serviceWorker as any).dispatchEvent(messageEvent);
      
      // Should not throw error, just log message
    });
  });
}); 