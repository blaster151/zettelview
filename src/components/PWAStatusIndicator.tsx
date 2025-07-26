import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useThemeStore } from '../store/themeStore';
import { cn } from '../lib/utils';

interface PWAStatusIndicatorProps {
  className?: string;
  showCacheSize?: boolean;
  showConnectionType?: boolean;
  showUpdateBadge?: boolean;
  compact?: boolean;
}

const PWAStatusIndicator: React.FC<PWAStatusIndicatorProps> = ({
  className,
  showCacheSize = true,
  showConnectionType = true,
  showUpdateBadge = true,
  compact = false
}) => {
  const { 
    isOnline, 
    hasUpdate, 
    cacheSize, 
    lastSync, 
    getConnectionType, 
    updateApp,
    getCacheSize 
  } = usePWA();
  const { colors } = useThemeStore();
  const [connectionType, setConnectionType] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [formattedCacheSize, setFormattedCacheSize] = useState<string>('');

  useEffect(() => {
    setConnectionType(getConnectionType());
  }, [getConnectionType]);

  useEffect(() => {
    const formatCacheSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    setFormattedCacheSize(formatCacheSize(cacheSize));
  }, [cacheSize]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateApp();
    } catch (error) {
      console.error('Failed to update app:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getConnectionIcon = () => {
    if (!isOnline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
      );
    }

    switch (connectionType) {
      case '4g':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case '3g':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
          </svg>
        );
      case '2g':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (hasUpdate) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Online/Offline Status */}
        <div className="flex items-center space-x-1">
          <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
          <span 
            className="text-xs font-medium"
            style={{ color: colors.textSecondary }}
          >
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Update Badge */}
        {showUpdateBadge && hasUpdate && (
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="relative"
            title="Update available"
          >
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            {isUpdating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="animate-spin w-2 h-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'flex items-center space-x-4 p-3 rounded-lg border',
        className
      )}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.surface
      }}
    >
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={cn('flex items-center space-x-1', getStatusColor())}>
          {getConnectionIcon()}
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {showConnectionType && isOnline && (
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: colors.primary + '20',
              color: colors.primary
            }}
          >
            {connectionType.toUpperCase()}
          </span>
        )}
      </div>

      {/* Cache Size */}
      {showCacheSize && (
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <span 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            {formattedCacheSize}
          </span>
        </div>
      )}

      {/* Last Sync */}
      {lastSync && (
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            {lastSync.toLocaleTimeString()}
          </span>
        </div>
      )}

      {/* Update Button */}
      {showUpdateBadge && hasUpdate && (
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className={cn(
            'flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          style={{
            backgroundColor: colors.primary,
            color: 'white'
          }}
        >
          {isUpdating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Update</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PWAStatusIndicator; 