import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { accessibilityService } from '../../services/accessibilityService';

interface AccessibilityEnhancementProps {
  children: React.ReactNode;
  enableKeyboardNavigation?: boolean;
  enableScreenReader?: boolean;
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
}

const AccessibilityEnhancement: React.FC<AccessibilityEnhancementProps> = ({
  children,
  enableKeyboardNavigation = true,
  enableScreenReader = true,
  enableHighContrast = false,
  enableReducedMotion = false
}) => {
  const { colors } = useThemeStore();
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(0);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [showFocusIndicator, setShowFocusIndicator] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Initialize accessibility features
  useEffect(() => {
    if (enableKeyboardNavigation) {
      accessibilityService.setupKeyboardNavigation();
    }
    
    if (enableScreenReader) {
      accessibilityService.enableScreenReader();
    }
    
    if (enableHighContrast) {
      accessibilityService.toggleHighContrast();
    }
    
    if (enableReducedMotion) {
      accessibilityService.toggleReducedMotion();
    }

    return () => {
      accessibilityService.cleanup();
    };
  }, [enableKeyboardNavigation, enableScreenReader, enableHighContrast, enableReducedMotion]);

  // Update focusable elements
  useEffect(() => {
    const updateFocusableElements = () => {
      if (containerRef.current) {
        const elements = Array.from(
          containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
          )
        ).filter(element => {
          const style = window.getComputedStyle(element);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }) as HTMLElement[];
        
        setFocusableElements(elements);
      }
    };

    updateFocusableElements();
    
    // Update on DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    if (containerRef.current) {
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden']
      });
    }

    return () => observer.disconnect();
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    // Don't handle if user is typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    switch (event.key) {
      case 'Tab':
        // Let default tab behavior work
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        const newIndex = Math.max(0, Math.min(focusableElements.length - 1, currentFocusIndex + direction));
        setCurrentFocusIndex(newIndex);
        focusableElements[newIndex]?.focus();
        announceElement(focusableElements[newIndex]);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        const horizontalDirection = event.key === 'ArrowLeft' ? -1 : 1;
        const horizontalIndex = Math.max(0, Math.min(focusableElements.length - 1, currentFocusIndex + horizontalDirection));
        setCurrentFocusIndex(horizontalIndex);
        focusableElements[horizontalIndex]?.focus();
        announceElement(focusableElements[horizontalIndex]);
        break;
      case 'Home':
        event.preventDefault();
        setCurrentFocusIndex(0);
        focusableElements[0]?.focus();
        announceElement(focusableElements[0]);
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = focusableElements.length - 1;
        setCurrentFocusIndex(lastIndex);
        focusableElements[lastIndex]?.focus();
        announceElement(focusableElements[lastIndex]);
        break;
      case 'Enter':
      case ' ':
        if (focusableElements[currentFocusIndex]) {
          event.preventDefault();
          focusableElements[currentFocusIndex].click();
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsAccessibilityMode(false);
        setShowFocusIndicator(false);
        break;
      case 'F1':
        event.preventDefault();
        setIsAccessibilityMode(!isAccessibilityMode);
        setShowFocusIndicator(!showFocusIndicator);
        announceAccessibilityMode();
        break;
    }
  }, [enableKeyboardNavigation, focusableElements, currentFocusIndex]);

  // Announce element to screen reader
  const announceElement = useCallback((element: HTMLElement) => {
    if (!enableScreenReader) return;

    const text = element.getAttribute('aria-label') || 
                 element.getAttribute('title') || 
                 element.textContent || 
                 element.tagName.toLowerCase();
    
    accessibilityService.announceToScreenReader(text);
  }, [enableScreenReader]);

  // Announce accessibility mode changes
  const announceAccessibilityMode = useCallback(() => {
    const mode = isAccessibilityMode ? 'disabled' : 'enabled';
    const message = `Accessibility mode ${mode}`;
    accessibilityService.announceToScreenReader(message);
    addAnnouncement(message);
  }, [isAccessibilityMode]);

  // Add announcement to queue
  const addAnnouncement = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(announcement => announcement !== message));
    }, 3000);
  }, []);

  // Handle focus changes
  const handleFocusChange = useCallback((event: FocusEvent) => {
    const target = event.target as HTMLElement;
    const index = focusableElements.indexOf(target);
    if (index !== -1) {
      setCurrentFocusIndex(index);
      announceElement(target);
    }
  }, [focusableElements, announceElement]);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusChange);
    };
  }, [handleKeyDown, handleFocusChange]);

  // Focus indicator styles
  const focusIndicatorStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: enableHighContrast ? '#ffff00' : '#0066cc',
    zIndex: 9999,
    pointerEvents: 'none',
    transition: enableReducedMotion ? 'none' : 'all 0.2s ease'
  };

  return (
    <div ref={containerRef} className="accessibility-enhancement">
      {/* Focus indicator */}
      {showFocusIndicator && (
        <div style={focusIndicatorStyle} />
      )}

      {/* Accessibility mode indicator */}
      {isAccessibilityMode && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: enableHighContrast ? '#000000' : '#0066cc',
            color: enableHighContrast ? '#ffffff' : '#ffffff',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10000,
            border: enableHighContrast ? '2px solid #ffffff' : 'none'
          }}
        >
          ♿ Accessibility Mode
        </div>
      )}

      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {announcements.map((announcement, index) => (
          <span key={index}>{announcement}</span>
        ))}
      </div>

      {/* Skip to main content link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: enableHighContrast ? '#000000' : '#0066cc',
          color: enableHighContrast ? '#ffffff' : '#ffffff',
          padding: '8px',
          textDecoration: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 10001,
          transition: enableReducedMotion ? 'none' : 'top 0.3s ease'
        }}
        onFocus={(e) => {
          e.currentTarget.style.top = '6px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.top = '-40px';
        }}
      >
        Skip to main content
      </a>

      {/* Main content */}
      <main id="main-content" role="main">
        {children}
      </main>

      {/* Keyboard shortcuts help */}
      {isAccessibilityMode && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: enableHighContrast ? '#000000' : 'rgba(0, 0, 0, 0.8)',
            color: enableHighContrast ? '#ffffff' : '#ffffff',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10000,
            maxWidth: '300px',
            border: enableHighContrast ? '2px solid #ffffff' : 'none'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Keyboard Shortcuts:</h3>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>Arrow Keys: Navigate elements</li>
            <li>Enter/Space: Activate element</li>
            <li>Home/End: First/Last element</li>
            <li>F1: Toggle accessibility mode</li>
            <li>Escape: Exit accessibility mode</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AccessibilityEnhancement; 