import { Note } from '../types/domain';

export interface MobileConfig {
  enableTouchGestures: boolean;
  enableSwipeNavigation: boolean;
  enablePullToRefresh: boolean;
  enableOfflineMode: boolean;
  enableMobileSearch: boolean;
  enableVoiceInput: boolean;
  enableHapticFeedback: boolean;
  enableMobileOptimizedUI: boolean;
}

export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'tap' | 'longPress' | 'doubleTap';
  direction?: 'left' | 'right' | 'up' | 'down';
  element: string;
  action: (event: TouchEvent) => void;
  threshold?: number;
  preventDefault?: boolean;
}

export interface MobileUIState {
  isMobile: boolean;
  isTablet: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: {
    width: number;
    height: number;
  };
  safeArea: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  keyboardVisible: boolean;
  keyboardHeight: number;
}

export interface OfflineData {
  notes: Note[];
  lastSync: Date;
  pendingChanges: any[];
  syncStatus: 'idle' | 'syncing' | 'error';
}

class MobileOptimizationService {
  private config: MobileConfig = {
    enableTouchGestures: true,
    enableSwipeNavigation: true,
    enablePullToRefresh: true,
    enableOfflineMode: true,
    enableMobileSearch: true,
    enableVoiceInput: true,
    enableHapticFeedback: true,
    enableMobileOptimizedUI: true
  };

  private uiState: MobileUIState = {
    isMobile: false,
    isTablet: false,
    orientation: 'portrait',
    screenSize: { width: 0, height: 0 },
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
    keyboardVisible: false,
    keyboardHeight: 0
  };

  private touchGestures: TouchGesture[] = [];
  private offlineData: OfflineData = {
    notes: [],
    lastSync: new Date(),
    pendingChanges: [],
    syncStatus: 'idle'
  };

  private eventListeners: Map<string, Function[]> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.detectDevice();
    this.setupEventListeners();
    this.setupObservers();
    this.loadOfflineData();
  }

  // Device Detection
  private detectDevice(): void {
    const userAgent = navigator.userAgent;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    this.uiState.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    this.uiState.isTablet = this.uiState.isMobile && screenWidth >= 768 && screenWidth <= 1024;
    this.uiState.orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';
    this.uiState.screenSize = { width: screenWidth, height: screenHeight };

    // Detect safe area for devices with notches
    this.detectSafeArea();
  }

  private detectSafeArea(): void {
    // Use CSS env() variables for safe area
    const style = getComputedStyle(document.documentElement);
    this.uiState.safeArea = {
      top: parseInt(style.getPropertyValue('--sat') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0')
    };
  }

  // Event Listeners
  private setupEventListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this));
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    
    if (this.config.enableTouchGestures) {
      this.setupTouchGestures();
    }

    if (this.config.enablePullToRefresh) {
      this.setupPullToRefresh();
    }

    if (this.config.enableVoiceInput) {
      this.setupVoiceInput();
    }

    // Keyboard events
    window.addEventListener('focusin', this.handleKeyboardShow.bind(this));
    window.addEventListener('focusout', this.handleKeyboardHide.bind(this));
  }

  private setupObservers(): void {
    // Resize observer for responsive elements
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        this.handleElementResize(entry);
      });
    });

    // Intersection observer for lazy loading
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.handleElementVisible(entry);
        }
      });
    });
  }

  // Touch Gestures
  private setupTouchGestures(): void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isLongPress = false;
    let longPressTimer: NodeJS.Timeout | null = null;

    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isLongPress = false;

      // Long press detection
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        this.handleLongPress(e);
      }, 500);
    });

    document.addEventListener('touchmove', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    document.addEventListener('touchend', (e) => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (isLongPress) return;

      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const duration = Date.now() - startTime;

      // Determine gesture type
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        // Horizontal swipe
        const direction = deltaX > 0 ? 'right' : 'left';
        this.handleSwipe(e, direction, Math.abs(deltaX));
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
        // Vertical swipe
        const direction = deltaY > 0 ? 'down' : 'up';
        this.handleSwipe(e, direction, Math.abs(deltaY));
      } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && duration < 300) {
        // Tap
        this.handleTap(e);
      }
    });
  }

  private handleSwipe(event: TouchEvent, direction: string, distance: number): void {
    const target = event.target as Element;
    const gesture = this.findGesture('swipe', direction, target);

    if (gesture) {
      if (gesture.preventDefault) {
        event.preventDefault();
      }
      gesture.action(event);
      this.triggerHapticFeedback('light');
    }
  }

  private handleTap(event: TouchEvent): void {
    const target = event.target as Element;
    const gesture = this.findGesture('tap', undefined, target);

    if (gesture) {
      if (gesture.preventDefault) {
        event.preventDefault();
      }
      gesture.action(event);
      this.triggerHapticFeedback('light');
    }
  }

  private handleLongPress(event: TouchEvent): void {
    const target = event.target as Element;
    const gesture = this.findGesture('longPress', undefined, target);

    if (gesture) {
      if (gesture.preventDefault) {
        event.preventDefault();
      }
      gesture.action(event);
      this.triggerHapticFeedback('medium');
    }
  }

  private findGesture(type: string, direction?: string, element?: Element): TouchGesture | undefined {
    return this.touchGestures.find(gesture => {
      const typeMatch = gesture.type === type;
      const directionMatch = !direction || gesture.direction === direction;
      const elementMatch = !element || element.closest(gesture.element);
      return typeMatch && directionMatch && elementMatch;
    });
  }

  // Pull to Refresh
  private setupPullToRefresh(): void {
    let startY = 0;
    let currentY = 0;
    let isRefreshing = false;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    });

    document.addEventListener('touchmove', (e) => {
      if (window.scrollY === 0 && !isRefreshing) {
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 50) {
          this.showPullToRefreshIndicator(deltaY);
        }
      }
    });

    document.addEventListener('touchend', (e) => {
      if (window.scrollY === 0 && !isRefreshing) {
        const deltaY = currentY - startY;
        if (deltaY > 100) {
          this.triggerPullToRefresh();
        } else {
          this.hidePullToRefreshIndicator();
        }
      }
    });
  }

  private showPullToRefreshIndicator(deltaY: number): void {
    // Show pull to refresh indicator
    this.emitEvent('pull_to_refresh_start', { deltaY });
  }

  private hidePullToRefreshIndicator(): void {
    // Hide pull to refresh indicator
    this.emitEvent('pull_to_refresh_end', {});
  }

  private async triggerPullToRefresh(): Promise<void> {
    this.emitEvent('pull_to_refresh_trigger', {});
    
    try {
      // Simulate refresh
      await this.refreshData();
      this.triggerHapticFeedback('success');
    } catch (error) {
      this.triggerHapticFeedback('error');
    }
  }

  // Voice Input
  private setupVoiceInput(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.emitEvent('voice_input', { transcript });
      };

      recognition.onerror = (event: any) => {
        this.emitEvent('voice_input_error', { error: event.error });
      };

      // Store recognition instance for later use
      (window as any).speechRecognition = recognition;
    }
  }

  // Keyboard Handling
  private handleKeyboardShow(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      this.uiState.keyboardVisible = true;
      this.uiState.keyboardHeight = this.estimateKeyboardHeight();
      this.emitEvent('keyboard_show', { height: this.uiState.keyboardHeight });
    }
  }

  private handleKeyboardHide(event: FocusEvent): void {
    this.uiState.keyboardVisible = false;
    this.uiState.keyboardHeight = 0;
    this.emitEvent('keyboard_hide', {});
  }

  private estimateKeyboardHeight(): number {
    // Estimate keyboard height based on viewport changes
    const viewportHeight = window.innerHeight;
    const screenHeight = window.screen.height;
    return Math.max(0, screenHeight - viewportHeight);
  }

  // Responsive Design
  private handleResize(): void {
    this.detectDevice();
    this.emitEvent('resize', this.uiState);
  }

  private handleOrientationChange(): void {
    setTimeout(() => {
      this.detectDevice();
      this.emitEvent('orientation_change', this.uiState);
    }, 100);
  }

  private handleElementResize(entry: ResizeObserverEntry): void {
    this.emitEvent('element_resize', {
      target: entry.target,
      contentRect: entry.contentRect
    });
  }

  private handleElementVisible(entry: IntersectionObserverEntry): void {
    this.emitEvent('element_visible', {
      target: entry.target,
      isIntersecting: entry.isIntersecting
    });
  }

  // Offline Support
  private async loadOfflineData(): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('zettelview-offline');
        const response = await cache.match('/offline-data.json');
        
        if (response) {
          const data = await response.json();
          this.offlineData = { ...this.offlineData, ...data };
        }
      } catch (error) {
        console.error('Failed to load offline data:', error);
      }
    }
  }

  async saveOfflineData(): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('zettelview-offline');
        const response = new Response(JSON.stringify(this.offlineData));
        await cache.put('/offline-data.json', response);
      } catch (error) {
        console.error('Failed to save offline data:', error);
      }
    }
  }

  // Haptic Feedback
  private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error'): void {
    if (!this.config.enableHapticFeedback) return;

    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [50, 100, 50]
      };

      navigator.vibrate(patterns[type]);
    }
  }

  // Public API
  getConfig(): MobileConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<MobileConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emitEvent('config_update', this.config);
  }

  getUIState(): MobileUIState {
    return { ...this.uiState };
  }

  isMobile(): boolean {
    return this.uiState.isMobile;
  }

  isTablet(): boolean {
    return this.uiState.isTablet;
  }

  getOrientation(): 'portrait' | 'landscape' {
    return this.uiState.orientation;
  }

  getScreenSize(): { width: number; height: number } {
    return { ...this.uiState.screenSize };
  }

  getSafeArea(): { top: number; bottom: number; left: number; right: number } {
    return { ...this.uiState.safeArea };
  }

  isKeyboardVisible(): boolean {
    return this.uiState.keyboardVisible;
  }

  getKeyboardHeight(): number {
    return this.uiState.keyboardHeight;
  }

  // Touch Gestures API
  registerGesture(gesture: TouchGesture): void {
    this.touchGestures.push(gesture);
  }

  unregisterGesture(gesture: TouchGesture): void {
    const index = this.touchGestures.indexOf(gesture);
    if (index > -1) {
      this.touchGestures.splice(index, 1);
    }
  }

  // Voice Input API
  startVoiceInput(): void {
    if ((window as any).speechRecognition) {
      (window as any).speechRecognition.start();
    }
  }

  stopVoiceInput(): void {
    if ((window as any).speechRecognition) {
      (window as any).speechRecognition.stop();
    }
  }

  // Offline API
  getOfflineData(): OfflineData {
    return { ...this.offlineData };
  }

  async saveNoteOffline(note: Note): Promise<void> {
    this.offlineData.notes.push(note);
    await this.saveOfflineData();
  }

  async getOfflineNotes(): Promise<Note[]> {
    return [...this.offlineData.notes];
  }

  async syncOfflineData(): Promise<void> {
    this.offlineData.syncStatus = 'syncing';
    
    try {
      // Simulate sync with server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.offlineData.lastSync = new Date();
      this.offlineData.syncStatus = 'idle';
      await this.saveOfflineData();
      
      this.emitEvent('sync_complete', { success: true });
    } catch (error) {
      this.offlineData.syncStatus = 'error';
      this.emitEvent('sync_error', { error });
    }
  }

  // Responsive Design API
  observeElement(element: Element): void {
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }
  }

  unobserveElement(element: Element): void {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(element);
    }
  }

  observeVisibility(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.observe(element);
    }
  }

  unobserveVisibility(element: Element): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.unobserve(element);
    }
  }

  // Utility Methods
  getBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
    const width = this.uiState.screenSize.width;
    
    if (width < 640) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    return 'xl';
  }

  isBreakpoint(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): boolean {
    return this.getBreakpoint() === breakpoint;
  }

  isBreakpointOrLarger(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): boolean {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = breakpoints.indexOf(this.getBreakpoint());
    const targetIndex = breakpoints.indexOf(breakpoint);
    return currentIndex >= targetIndex;
  }

  isBreakpointOrSmaller(breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): boolean {
    const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl'];
    const currentIndex = breakpoints.indexOf(this.getBreakpoint());
    const targetIndex = breakpoints.indexOf(breakpoint);
    return currentIndex <= targetIndex;
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
        console.error(`Error in mobile event listener for ${eventType}:`, error);
      }
    });
  }

  // Mock methods for demo
  private async refreshData(): Promise<void> {
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const MobileOptimizationService = new MobileOptimizationService(); 