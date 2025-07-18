import { Note } from '../types/note';

export interface AccessibilityConfig {
  screenReaderEnabled: boolean;
  highContrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedMotion: boolean;
  focusIndicator: 'default' | 'high' | 'outline';
  keyboardNavigation: boolean;
  autoReadAloud: boolean;
  speechRate: number;
  voice: string;
}

export interface AccessibilityFeatures {
  skipLinks: boolean;
  landmarks: boolean;
  headings: boolean;
  altText: boolean;
  ariaLabels: boolean;
  keyboardShortcuts: boolean;
  focusManagement: boolean;
  errorAnnouncements: boolean;
}

export interface WCAGCompliance {
  level: 'A' | 'AA' | 'AAA';
  criteria: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warning';
      description: string;
      impact: 'low' | 'medium' | 'high';
    };
  };
}

export interface AccessibilityReport {
  score: number;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    element?: HTMLElement;
    wcagCriteria?: string;
    suggestion?: string;
  }>;
  compliance: WCAGCompliance;
  features: AccessibilityFeatures;
}

export class AccessibilityService {
  private config: AccessibilityConfig = {
    screenReaderEnabled: true,
    highContrastMode: false,
    fontSize: 'medium',
    colorBlindMode: 'none',
    reducedMotion: false,
    focusIndicator: 'default',
    keyboardNavigation: true,
    autoReadAloud: false,
    speechRate: 1.0,
    voice: 'default'
  };

  private features: AccessibilityFeatures = {
    skipLinks: true,
    landmarks: true,
    headings: true,
    altText: true,
    ariaLabels: true,
    keyboardShortcuts: true,
    focusManagement: true,
    errorAnnouncements: true
  };

  private speechSynthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private focusableElements: HTMLElement[] = [];
  private focusIndex = 0;
  private observers: Map<string, MutationObserver> = new Map();

  constructor() {
    this.initializeAccessibility();
  }

  // Configuration Management
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.applyAccessibilitySettings();
    this.saveConfig();
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  private saveConfig(): void {
    localStorage.setItem('accessibilityConfig', JSON.stringify(this.config));
  }

  loadConfig(): void {
    const saved = localStorage.getItem('accessibilityConfig');
    if (saved) {
      this.config = { ...this.config, ...JSON.parse(saved) };
      this.applyAccessibilitySettings();
    }
  }

  // Screen Reader Support
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.screenReaderEnabled) return;

    // Create live region for announcements
    let liveRegion = document.getElementById('accessibility-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'accessibility-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);
  }

  speak(text: string, options: {
    rate?: number;
    pitch?: number;
    voice?: string;
    onEnd?: () => void;
  } = {}): void {
    if (!this.config.autoReadAloud || !window.speechSynthesis) return;

    // Stop current speech
    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || this.config.speechRate;
    utterance.pitch = options.pitch || 1.0;
    
    if (options.voice) {
      utterance.voice = speechSynthesis.getVoices().find(v => v.name === options.voice) || null;
    }

    utterance.onend = options.onEnd || null;
    
    this.currentUtterance = utterance;
    speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  // Keyboard Navigation
  setupKeyboardNavigation(): void {
    if (!this.config.keyboardNavigation) return;

    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    this.updateFocusableElements();
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const { key, ctrlKey, altKey, shiftKey } = event;

    // Skip if user is typing in input fields
    if (this.isTypingInInput(event.target as HTMLElement)) return;

    switch (key) {
      case 'Tab':
        // Let default tab behavior work
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        this.navigateVertically(key === 'ArrowUp' ? -1 : 1);
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        this.navigateHorizontally(key === 'ArrowLeft' ? -1 : 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirstElement();
        break;
      case 'End':
        event.preventDefault();
        this.focusLastElement();
        break;
      case 'Enter':
      case ' ':
        if (this.isFocusable(event.target as HTMLElement)) {
          event.preventDefault();
          (event.target as HTMLElement).click();
        }
        break;
      case 'Escape':
        this.handleEscapeKey();
        break;
      case 'h':
        if (ctrlKey) {
          event.preventDefault();
          this.toggleHighContrast();
        }
        break;
      case 'f':
        if (ctrlKey) {
          event.preventDefault();
          this.toggleFontSize();
        }
        break;
      case 'm':
        if (ctrlKey) {
          event.preventDefault();
          this.toggleReducedMotion();
        }
        break;
    }
  }

  private navigateVertically(direction: number): void {
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(currentElement);
    
    if (currentIndex === -1) {
      this.focusFirstElement();
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < this.focusableElements.length) {
      this.focusableElements[nextIndex].focus();
    }
  }

  private navigateHorizontally(direction: number): void {
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.indexOf(currentElement);
    
    if (currentIndex === -1) {
      this.focusFirstElement();
      return;
    }

    // Find next element in horizontal direction
    const currentRect = currentElement.getBoundingClientRect();
    const nextElement = this.focusableElements.find((element, index) => {
      if (index === currentIndex) return false;
      
      const rect = element.getBoundingClientRect();
      const isInSameRow = Math.abs(rect.top - currentRect.top) < 10;
      const isInDirection = direction > 0 ? rect.left > currentRect.left : rect.left < currentRect.left;
      
      return isInSameRow && isInDirection;
    });

    if (nextElement) {
      nextElement.focus();
    }
  }

  private focusFirstElement(): void {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  private focusLastElement(): void {
    if (this.focusableElements.length > 0) {
      this.focusableElements[this.focusableElements.length - 1].focus();
    }
  }

  private handleEscapeKey(): void {
    // Close modals, dropdowns, etc.
    const modals = document.querySelectorAll('[role="dialog"], [data-modal]');
    modals.forEach(modal => {
      const closeButton = modal.querySelector('[data-close], [aria-label*="close"]');
      if (closeButton) {
        (closeButton as HTMLElement).click();
      }
    });
  }

  private updateFocusableElements(): void {
    this.focusableElements = Array.from(
      document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
      )
    ).filter(element => {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }) as HTMLElement[];
  }

  private isTypingInInput(element: HTMLElement): boolean {
    return element.tagName === 'INPUT' || 
           element.tagName === 'TEXTAREA' || 
           element.contentEditable === 'true';
  }

  private isFocusable(element: HTMLElement): boolean {
    return this.focusableElements.includes(element);
  }

  // Visual Accessibility
  toggleHighContrast(): void {
    this.config.highContrastMode = !this.config.highContrastMode;
    this.applyHighContrastMode();
    this.announce(`High contrast mode ${this.config.highContrastMode ? 'enabled' : 'disabled'}`);
  }

  private applyHighContrastMode(): void {
    const root = document.documentElement;
    if (this.config.highContrastMode) {
      root.classList.add('high-contrast');
      root.style.setProperty('--text-color', '#ffffff');
      root.style.setProperty('--background-color', '#000000');
      root.style.setProperty('--link-color', '#ffff00');
      root.style.setProperty('--border-color', '#ffffff');
    } else {
      root.classList.remove('high-contrast');
      root.style.removeProperty('--text-color');
      root.style.removeProperty('--background-color');
      root.style.removeProperty('--link-color');
      root.style.removeProperty('--border-color');
    }
  }

  toggleFontSize(): void {
    const sizes: AccessibilityConfig['fontSize'][] = ['small', 'medium', 'large', 'x-large'];
    const currentIndex = sizes.indexOf(this.config.fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    this.config.fontSize = sizes[nextIndex];
    this.applyFontSize();
    this.announce(`Font size changed to ${this.config.fontSize}`);
  }

  private applyFontSize(): void {
    const root = document.documentElement;
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px'
    };
    root.style.fontSize = sizeMap[this.config.fontSize];
  }

  toggleReducedMotion(): void {
    this.config.reducedMotion = !this.config.reducedMotion;
    this.applyReducedMotion();
    this.announce(`Reduced motion ${this.config.reducedMotion ? 'enabled' : 'disabled'}`);
  }

  private applyReducedMotion(): void {
    const root = document.documentElement;
    if (this.config.reducedMotion) {
      root.classList.add('reduced-motion');
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.classList.remove('reduced-motion');
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
  }

  setColorBlindMode(mode: AccessibilityConfig['colorBlindMode']): void {
    this.config.colorBlindMode = mode;
    this.applyColorBlindMode();
    this.announce(`Color blind mode set to ${mode}`);
  }

  private applyColorBlindMode(): void {
    const root = document.documentElement;
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
    
    if (this.config.colorBlindMode !== 'none') {
      root.classList.add(this.config.colorBlindMode);
    }
  }

  setFocusIndicator(style: AccessibilityConfig['focusIndicator']): void {
    this.config.focusIndicator = style;
    this.applyFocusIndicator();
  }

  private applyFocusIndicator(): void {
    const root = document.documentElement;
    root.classList.remove('focus-default', 'focus-high', 'focus-outline');
    root.classList.add(`focus-${this.config.focusIndicator}`);
  }

  // WCAG Compliance
  checkWCAGCompliance(): WCAGCompliance {
    const compliance: WCAGCompliance = {
      level: 'AA',
      criteria: {}
    };

    // Check color contrast
    this.checkColorContrast(compliance);
    
    // Check heading structure
    this.checkHeadingStructure(compliance);
    
    // Check form labels
    this.checkFormLabels(compliance);
    
    // Check alt text
    this.checkAltText(compliance);
    
    // Check ARIA attributes
    this.checkARIAAttributes(compliance);
    
    // Check keyboard navigation
    this.checkKeyboardNavigation(compliance);

    return compliance;
  }

  private checkColorContrast(compliance: WCAGCompliance): void {
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    let contrastIssues = 0;

    textElements.forEach(element => {
      const style = window.getComputedStyle(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      // Simplified contrast check (in real implementation, use proper contrast calculation)
      if (color === backgroundColor) {
        contrastIssues++;
      }
    });

    compliance.criteria['1.4.3'] = {
      status: contrastIssues === 0 ? 'pass' : 'fail',
      description: `Color contrast issues found: ${contrastIssues}`,
      impact: 'high'
    };
  }

  private checkHeadingStructure(compliance: WCAGCompliance): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let structureIssues = 0;
    let previousLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        structureIssues++;
      }
      previousLevel = level;
    });

    compliance.criteria['1.3.1'] = {
      status: structureIssues === 0 ? 'pass' : 'fail',
      description: `Heading structure issues found: ${structureIssues}`,
      impact: 'medium'
    };
  }

  private checkFormLabels(compliance: WCAGCompliance): void {
    const inputs = document.querySelectorAll('input, select, textarea');
    let labelIssues = 0;

    inputs.forEach(input => {
      const hasLabel = input.hasAttribute('aria-label') || 
                      input.hasAttribute('aria-labelledby') ||
                      input.closest('label') ||
                      input.id && document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        labelIssues++;
      }
    });

    compliance.criteria['3.3.2'] = {
      status: labelIssues === 0 ? 'pass' : 'fail',
      description: `Form label issues found: ${labelIssues}`,
      impact: 'high'
    };
  }

  private checkAltText(compliance: WCAGCompliance): void {
    const images = document.querySelectorAll('img');
    let altIssues = 0;

    images.forEach(img => {
      if (!img.hasAttribute('alt')) {
        altIssues++;
      }
    });

    compliance.criteria['1.1.1'] = {
      status: altIssues === 0 ? 'pass' : 'fail',
      description: `Missing alt text issues found: ${altIssues}`,
      impact: 'high'
    };
  }

  private checkARIAAttributes(compliance: WCAGCompliance): void {
    const ariaElements = document.querySelectorAll('[aria-*]');
    let ariaIssues = 0;

    ariaElements.forEach(element => {
      const ariaAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'));
      
      ariaAttributes.forEach(attr => {
        if (attr.value === '' || attr.value === 'undefined') {
          ariaIssues++;
        }
      });
    });

    compliance.criteria['4.1.2'] = {
      status: ariaIssues === 0 ? 'pass' : 'fail',
      description: `ARIA attribute issues found: ${ariaIssues}`,
      impact: 'medium'
    };
  }

  private checkKeyboardNavigation(compliance: WCAGCompliance): void {
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    let keyboardIssues = 0;

    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex === '-1' && !element.hasAttribute('aria-hidden')) {
        keyboardIssues++;
      }
    });

    compliance.criteria['2.1.1'] = {
      status: keyboardIssues === 0 ? 'pass' : 'fail',
      description: `Keyboard navigation issues found: ${keyboardIssues}`,
      impact: 'high'
    };
  }

  // Generate Accessibility Report
  generateAccessibilityReport(): AccessibilityReport {
    const compliance = this.checkWCAGCompliance();
    const issues: AccessibilityReport['issues'] = [];
    let score = 100;

    // Check for common accessibility issues
    this.findAccessibilityIssues(issues);

    // Calculate score based on issues
    issues.forEach(issue => {
      switch (issue.type) {
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });

    score = Math.max(0, score);

    return {
      score,
      issues,
      compliance,
      features: this.features
    };
  }

  private findAccessibilityIssues(issues: AccessibilityReport['issues']): void {
    // Check for missing skip links
    if (this.features.skipLinks && !document.querySelector('[href="#main-content"]')) {
      issues.push({
        type: 'warning',
        message: 'Missing skip to main content link',
        wcagCriteria: '2.4.1',
        suggestion: 'Add a skip link at the beginning of the page'
      });
    }

    // Check for missing landmarks
    if (this.features.landmarks) {
      const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section[role="main"]');
      if (landmarks.length === 0) {
        issues.push({
          type: 'warning',
          message: 'No landmark regions found',
          wcagCriteria: '1.3.1',
          suggestion: 'Add semantic HTML landmarks (main, nav, header, footer)'
        });
      }
    }

    // Check for proper heading structure
    if (this.features.headings) {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length === 0) {
        issues.push({
          type: 'error',
          message: 'No headings found on the page',
          wcagCriteria: '1.3.1',
          suggestion: 'Add proper heading structure to organize content'
        });
      }
    }

    // Check for missing alt text
    if (this.features.altText) {
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (!img.hasAttribute('alt')) {
          issues.push({
            type: 'error',
            message: 'Image missing alt text',
            element: img,
            wcagCriteria: '1.1.1',
            suggestion: 'Add descriptive alt text to all images'
          });
        }
      });
    }
  }

  // Focus Management
  trapFocus(element: HTMLElement): void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }

  // Error Announcements
  announceError(message: string, element?: HTMLElement): void {
    if (this.features.errorAnnouncements) {
      this.announce(`Error: ${message}`, 'assertive');
    }

    if (element) {
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', 'error-message');
      
      // Create error message element
      let errorElement = document.getElementById('error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'sr-only';
        document.body.appendChild(errorElement);
      }
      errorElement.textContent = message;
    }
  }

  clearError(element: HTMLElement): void {
    element.removeAttribute('aria-invalid');
    element.removeAttribute('aria-describedby');
  }

  // Initialize Accessibility
  private initializeAccessibility(): void {
    this.loadConfig();
    this.applyAccessibilitySettings();
    this.setupKeyboardNavigation();
    this.setupMutationObserver();
    this.addSkipLinks();
  }

  private applyAccessibilitySettings(): void {
    this.applyHighContrastMode();
    this.applyFontSize();
    this.applyReducedMotion();
    this.applyColorBlindMode();
    this.applyFocusIndicator();
  }

  private setupMutationObserver(): void {
    const observer = new MutationObserver(() => {
      this.updateFocusableElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.set('focusable', observer);
  }

  private addSkipLinks(): void {
    if (!this.features.skipLinks) return;

    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        transition: top 0.3s;
      }
      .skip-link:focus {
        top: 6px;
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  // Cleanup
  cleanup(): void {
    this.stopSpeaking();
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

export const accessibilityService = new AccessibilityService(); 