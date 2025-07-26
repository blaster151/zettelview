import { useState, useEffect, useCallback } from 'react';
import { pwaService, PWAStatus } from '../services/pwaService';

export interface UsePWAReturn {
  status: PWAStatus;
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  cacheSize: number;
  lastSync: Date | null;
  showInstallPrompt: () => Promise<boolean>;
  updateApp: () => Promise<void>;
  clearCache: () => Promise<void>;
  getCacheSize: () => Promise<number>;
  requestNotificationPermission: () => Promise<NotificationPermission>;
  sendNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  registerBackgroundSync: (tag: string) => Promise<void>;
  isStandalone: () => boolean;
  isMobile: () => boolean;
  getConnectionType: () => string;
  debugInfo: () => Promise<any>;
}

export function usePWA(): UsePWAReturn {
  const [status, setStatus] = useState<PWAStatus>(pwaService.getStatus());

  useEffect(() => {
    // Subscribe to status updates
    pwaService.onStatusUpdate((newStatus) => {
      setStatus(newStatus);
    });

    // Initial status check
    setStatus(pwaService.getStatus());
  }, []);

  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    return await pwaService.showInstallPrompt();
  }, []);

  const updateApp = useCallback(async (): Promise<void> => {
    await pwaService.updateApp();
  }, []);

  const clearCache = useCallback(async (): Promise<void> => {
    await pwaService.clearCache();
  }, []);

  const getCacheSize = useCallback(async (): Promise<number> => {
    return await pwaService.getCacheSize();
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    return await pwaService.requestNotificationPermission();
  }, []);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions): Promise<void> => {
    await pwaService.sendNotification(title, options);
  }, []);

  const registerBackgroundSync = useCallback(async (tag: string): Promise<void> => {
    await pwaService.registerBackgroundSync(tag);
  }, []);

  const isStandalone = useCallback((): boolean => {
    return pwaService.isStandalone();
  }, []);

  const isMobile = useCallback((): boolean => {
    return pwaService.isMobile();
  }, []);

  const getConnectionType = useCallback((): string => {
    return pwaService.getConnectionType();
  }, []);

  const debugInfo = useCallback(async (): Promise<any> => {
    return await pwaService.debugInfo();
  }, []);

  return {
    status,
    isInstalled: status.isInstalled,
    isInstallable: status.isInstallable,
    isOnline: status.isOnline,
    hasUpdate: status.hasUpdate,
    cacheSize: status.cacheSize,
    lastSync: status.lastSync,
    showInstallPrompt,
    updateApp,
    clearCache,
    getCacheSize,
    requestNotificationPermission,
    sendNotification,
    registerBackgroundSync,
    isStandalone,
    isMobile,
    getConnectionType,
    debugInfo
  };
} 