import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { useThemeStore } from '../store/themeStore';
import { cn } from '../lib/utils';

interface PWAInstallPromptProps {
  className?: string;
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className,
  showOnMobile = true,
  showOnDesktop = true,
  autoHide = true,
  hideDelay = 10000
}) => {
  const { isInstallable, isInstalled, showInstallPrompt, isMobile } = usePWA();
  const { colors } = useThemeStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const shouldShow = isInstallable && 
                      !isInstalled && 
                      !isDismissed &&
                      ((isMobile() && showOnMobile) || (!isMobile() && showOnDesktop));

    if (shouldShow) {
      setIsVisible(true);
      
      // Auto-hide after delay if enabled
      if (autoHide) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, hideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, isInstalled, isDismissed, autoHide, hideDelay, showOnMobile, showOnDesktop, isMobile]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const accepted = await showInstallPrompt();
      if (accepted) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Failed to show install prompt:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Store dismissal in localStorage
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Check if user has previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto',
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg border',
        'transform transition-all duration-300 ease-in-out',
        'animate-in slide-in-from-bottom-4',
        className
      )}
      style={{
        borderColor: colors.border,
        boxShadow: `0 10px 25px rgba(0, 0, 0, 0.1)`
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
            >
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <div>
              <h3 
                className="font-semibold text-sm"
                style={{ color: colors.text }}
              >
                Install ZettelView
              </h3>
              <p 
                className="text-xs"
                style={{ color: colors.textSecondary }}
              >
                Add to home screen for quick access
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close install prompt"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p 
            className="text-sm leading-relaxed"
            style={{ color: colors.textSecondary }}
          >
            Install ZettelView as a native app for the best experience. 
            Get offline access, quick shortcuts, and native notifications.
          </p>
        </div>

        {/* Features */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Works offline
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Quick access from home screen
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span 
              className="text-xs"
              style={{ color: colors.textSecondary }}
            >
              Native app experience
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className={cn(
              'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            style={{
              backgroundColor: colors.primary,
              color: 'white'
            }}
          >
            {isInstalling ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Installing...</span>
              </div>
            ) : (
              'Install App'
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`
            }}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt; 