import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AccessibilityEnhancement from '../../components/features/AccessibilityEnhancement';
import { accessibilityService } from '../../services/accessibilityService';

// Mock accessibility service
vi.mock('../../services/accessibilityService', () => ({
  accessibilityService: {
    setupKeyboardNavigation: vi.fn(),
    enableScreenReader: vi.fn(),
    toggleHighContrast: vi.fn(),
    toggleReducedMotion: vi.fn(),
    announceToScreenReader: vi.fn(),
    cleanup: vi.fn()
  }
}));

describe('Accessibility Enhancement - Comprehensive Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Keyboard Navigation', () => {
    test('should handle arrow key navigation', async () => {
      render(
        <AccessibilityEnhancement enableKeyboardNavigation={true}>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </AccessibilityEnhancement>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      // Focus first button
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);

      // Test arrow down navigation
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(buttons[1]);

      // Test arrow up navigation
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      expect(document.activeElement).toBe(buttons[0]);
    });

    test('should handle Home/End key navigation', () => {
      render(
        <AccessibilityEnhancement enableKeyboardNavigation={true}>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </AccessibilityEnhancement>
      );

      const buttons = screen.getAllByRole('button');
      
      // Focus middle button
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);

      // Test Home key
      fireEvent.keyDown(document, { key: 'Home' });
      expect(document.activeElement).toBe(buttons[0]);

      // Test End key
      fireEvent.keyDown(document, { key: 'End' });
      expect(document.activeElement).toBe(buttons[2]);
    });

    test('should handle Enter/Space activation', () => {
      const handleClick = vi.fn();
      
      render(
        <AccessibilityEnhancement enableKeyboardNavigation={true}>
          <button onClick={handleClick}>Clickable Button</button>
        </AccessibilityEnhancement>
      );

      const button = screen.getByRole('button');
      button.focus();

      // Test Enter key
      fireEvent.keyDown(document, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Test Space key
      fireEvent.keyDown(document, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    test('should not handle keyboard events when typing in input fields', () => {
      render(
        <AccessibilityEnhancement enableKeyboardNavigation={true}>
          <input type="text" placeholder="Type here" />
          <button>Button</button>
        </AccessibilityEnhancement>
      );

      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button');
      
      input.focus();
      
      // Arrow keys should not navigate when in input
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(input);
    });
  });

  describe('Screen Reader Support', () => {
    test('should announce elements on focus', () => {
      render(
        <AccessibilityEnhancement enableScreenReader={true}>
          <button aria-label="Important action button">Click me</button>
        </AccessibilityEnhancement>
      );

      const button = screen.getByRole('button');
      button.focus();

      expect(accessibilityService.announceToScreenReader).toHaveBeenCalledWith('Important action button');
    });

    test('should announce elements without aria-label using text content', () => {
      render(
        <AccessibilityEnhancement enableScreenReader={true}>
          <button>Click me</button>
        </AccessibilityEnhancement>
      );

      const button = screen.getByRole('button');
      button.focus();

      expect(accessibilityService.announceToScreenReader).toHaveBeenCalledWith('Click me');
    });

    test('should announce accessibility mode changes', () => {
      render(
        <AccessibilityEnhancement enableScreenReader={true}>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      // Toggle accessibility mode with F1
      fireEvent.keyDown(document, { key: 'F1' });

      expect(accessibilityService.announceToScreenReader).toHaveBeenCalledWith('Accessibility mode enabled');
    });
  });

  describe('High Contrast Mode', () => {
    test('should apply high contrast styles when enabled', () => {
      render(
        <AccessibilityEnhancement enableHighContrast={true}>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      // Toggle accessibility mode to show indicators
      fireEvent.keyDown(document, { key: 'F1' });

      const accessibilityIndicator = screen.getByText('♿ Accessibility Mode');
      const computedStyle = window.getComputedStyle(accessibilityIndicator);
      
      // High contrast mode should have black background and white text
      expect(accessibilityIndicator).toHaveStyle({
        background: '#000000',
        color: '#ffffff'
      });
    });

    test('should apply high contrast to focus indicators', () => {
      render(
        <AccessibilityEnhancement enableHighContrast={true}>
          <button>Button</button>
        </AccessibilityEnhancement>
      );

      // Toggle accessibility mode
      fireEvent.keyDown(document, { key: 'F1' });

      // Focus indicator should be yellow in high contrast mode
      const focusIndicator = document.querySelector('.accessibility-enhancement > div');
      expect(focusIndicator).toHaveStyle({
        background: '#ffff00'
      });
    });
  });

  describe('Reduced Motion', () => {
    test('should disable transitions when reduced motion is enabled', () => {
      render(
        <AccessibilityEnhancement enableReducedMotion={true}>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      // Toggle accessibility mode
      fireEvent.keyDown(document, { key: 'F1' });

      const focusIndicator = document.querySelector('.accessibility-enhancement > div');
      expect(focusIndicator).toHaveStyle({
        transition: 'none'
      });
    });

    test('should disable skip link transitions', () => {
      render(
        <AccessibilityEnhancement enableReducedMotion={true}>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveStyle({
        transition: 'none'
      });
    });
  });

  describe('Skip Links', () => {
    test('should provide skip to main content link', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    test('should show skip link on focus', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      const skipLink = screen.getByText('Skip to main content');
      
      // Initially hidden
      expect(skipLink).toHaveStyle({ top: '-40px' });
      
      // Show on focus
      fireEvent.focus(skipLink);
      expect(skipLink).toHaveStyle({ top: '6px' });
      
      // Hide on blur
      fireEvent.blur(skipLink);
      expect(skipLink).toHaveStyle({ top: '-40px' });
    });
  });

  describe('Accessibility Mode Toggle', () => {
    test('should toggle accessibility mode with F1 key', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      // Initially not in accessibility mode
      expect(screen.queryByText('♿ Accessibility Mode')).not.toBeInTheDocument();

      // Toggle on
      fireEvent.keyDown(document, { key: 'F1' });
      expect(screen.getByText('♿ Accessibility Mode')).toBeInTheDocument();

      // Toggle off
      fireEvent.keyDown(document, { key: 'F1' });
      expect(screen.queryByText('♿ Accessibility Mode')).not.toBeInTheDocument();
    });

    test('should exit accessibility mode with Escape key', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      // Enter accessibility mode
      fireEvent.keyDown(document, { key: 'F1' });
      expect(screen.getByText('♿ Accessibility Mode')).toBeInTheDocument();

      // Exit with Escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByText('♿ Accessibility Mode')).not.toBeInTheDocument();
    });

    test('should show keyboard shortcuts help in accessibility mode', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      // Enter accessibility mode
      fireEvent.keyDown(document, { key: 'F1' });

      expect(screen.getByText('Keyboard Shortcuts:')).toBeInTheDocument();
      expect(screen.getByText('Arrow Keys: Navigate elements')).toBeInTheDocument();
      expect(screen.getByText('Enter/Space: Activate element')).toBeInTheDocument();
      expect(screen.getByText('F1: Toggle accessibility mode')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('should track focusable elements', () => {
      render(
        <AccessibilityEnhancement>
          <button>Button 1</button>
          <input type="text" />
          <button>Button 2</button>
        </AccessibilityEnhancement>
      );

      const focusableElements = screen.getAllByRole('button').concat(screen.getByRole('textbox'));
      expect(focusableElements).toHaveLength(3);
    });

    test('should update focusable elements on DOM changes', async () => {
      const { rerender } = render(
        <AccessibilityEnhancement>
          <button>Button 1</button>
        </AccessibilityEnhancement>
      );

      expect(screen.getAllByRole('button')).toHaveLength(1);

      // Add more elements
      rerender(
        <AccessibilityEnhancement>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </AccessibilityEnhancement>
      );

      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    test('should handle focus changes correctly', () => {
      render(
        <AccessibilityEnhancement>
          <button>Button 1</button>
          <button>Button 2</button>
        </AccessibilityEnhancement>
      );

      const buttons = screen.getAllByRole('button');
      
      // Focus first button
      fireEvent.focus(buttons[0]);
      expect(document.activeElement).toBe(buttons[0]);

      // Focus second button
      fireEvent.focus(buttons[1]);
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe('Service Integration', () => {
    test('should initialize accessibility service on mount', () => {
      render(
        <AccessibilityEnhancement 
          enableKeyboardNavigation={true}
          enableScreenReader={true}
          enableHighContrast={true}
          enableReducedMotion={true}
        >
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      expect(accessibilityService.setupKeyboardNavigation).toHaveBeenCalled();
      expect(accessibilityService.enableScreenReader).toHaveBeenCalled();
      expect(accessibilityService.toggleHighContrast).toHaveBeenCalled();
      expect(accessibilityService.toggleReducedMotion).toHaveBeenCalled();
    });

    test('should cleanup accessibility service on unmount', () => {
      const { unmount } = render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      unmount();

      expect(accessibilityService.cleanup).toHaveBeenCalled();
    });
  });

  describe('Accessibility Compliance', () => {
    test('should have proper ARIA attributes', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveAttribute('id', 'main-content');

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    test('should have proper semantic structure', () => {
      render(
        <AccessibilityEnhancement>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toBeInTheDocument();
    });

    test('should announce changes to screen readers', () => {
      render(
        <AccessibilityEnhancement enableScreenReader={true}>
          <div>Content</div>
        </AccessibilityEnhancement>
      );

      const announcementDiv = document.querySelector('[aria-live="polite"]');
      expect(announcementDiv).toBeInTheDocument();
      expect(announcementDiv).toHaveAttribute('aria-atomic', 'true');
    });
  });
}); 