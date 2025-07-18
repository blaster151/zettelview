import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { useUIStore } from '../store/uiStore';
import { loggingService } from '../services/loggingService';

// Test data factories
export const createMockNote = (overrides: Partial<any> = {}): any => ({
  id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Test Note',
  body: 'This is a test note body with some content.',
  tags: ['test', 'example'],
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides
});

export const createMockNotes = (count: number, overrides: Partial<any> = {}): any[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockNote({
      id: `note-${index + 1}`,
      title: `Test Note ${index + 1}`,
      body: `This is test note ${index + 1} with some content.`,
      tags: [`tag-${index + 1}`, 'test'],
      ...overrides
    })
  );
};

export const createMockTemplate = (overrides: Partial<any> = {}): any => ({
  id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Template',
  description: 'A test template for testing purposes',
  content: '# Test Template\n\nThis is a test template.',
  category: 'general',
  tags: ['test', 'template'],
  createdAt: new Date('2024-01-01T10:00:00Z'),
  ...overrides
});

export const createMockPlugin = (overrides: Partial<any> = {}): any => ({
  id: `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  name: 'Test Plugin',
  description: 'A test plugin for testing purposes',
  version: '1.0.0',
  author: 'Test Author',
  category: 'utility',
  isEnabled: false,
  isBuiltIn: true,
  dependencies: [],
  settings: [],
  metadata: {
    created: new Date('2024-01-01T10:00:00Z'),
    lastUpdated: new Date('2024-01-01T10:00:00Z'),
    downloadCount: 0,
    rating: 0,
    size: 0
  },
  ...overrides
});

// Mock store states
export const createMockNoteStoreState = (overrides: Partial<any> = {}): any => ({
  notes: createMockNotes(5),
  selectedId: 'note-1',
  isLoading: false,
  error: null,
  ...overrides
});

export const createMockThemeStoreState = (overrides: Partial<any> = {}): any => ({
  theme: 'light',
  colors: {
    primary: '#007bff',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    border: '#dee2e6',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545'
  },
  isDark: false,
  ...overrides
});

export const createMockUIStoreState = (overrides: Partial<any> = {}): any => ({
  viewMode: 'editor',
  showAISummaryPanel: false,
  showExportImport: false,
  showTemplateSelector: false,
  showSaveAsTemplate: false,
  showCollaborationPanel: false,
  showPluginManager: false,
  showPluginStore: false,
  showHelpPanel: false,
  ...overrides
});

// Custom renderer with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialNoteStoreState?: Partial<any>;
  initialThemeStoreState?: Partial<any>;
  initialUIStoreState?: Partial<any>;
  withProviders?: boolean;
}

const AllTheProviders: React.FC<{ 
  children: React.ReactNode;
  initialNoteStoreState?: Partial<any>;
  initialThemeStoreState?: Partial<any>;
  initialUIStoreState?: Partial<any>;
}> = ({ 
  children, 
  initialNoteStoreState = {}, 
  initialThemeStoreState = {}, 
  initialUIStoreState = {} 
}) => {
  // Initialize stores with test data
  React.useEffect(() => {
    const noteStore = useNoteStore.getState();
    const themeStore = useThemeStore.getState();
    const uiStore = useUIStore.getState();

    // Set initial states
    Object.entries(initialNoteStoreState).forEach(([key, value]) => {
      (noteStore as any)[key] = value;
    });

    Object.entries(initialThemeStoreState).forEach(([key, value]) => {
      (themeStore as any)[key] = value;
    });

    Object.entries(initialUIStoreState).forEach(([key, value]) => {
      (uiStore as any)[key] = value;
    });
  }, [initialNoteStoreState, initialThemeStoreState, initialUIStoreState]);

  return <>{children}</>;
};

export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialNoteStoreState = {},
    initialThemeStoreState = {},
    initialUIStoreState = {},
    withProviders = true,
    ...renderOptions
  } = options;

  const Wrapper = withProviders 
    ? ({ children }: { children: React.ReactNode }) => (
        <AllTheProviders
          initialNoteStoreState={initialNoteStoreState}
          initialThemeStoreState={initialThemeStoreState}
          initialUIStoreState={initialUIStoreState}
        >
          {children}
        </AllTheProviders>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Test utilities
export const TestUtils = {
  // Wait for a condition to be true
  waitFor: (condition: () => boolean, timeout = 1000): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Condition not met within ${timeout}ms`));
        } else {
          setTimeout(check, 10);
        }
      };
      
      check();
    });
  },

  // Wait for element to appear
  waitForElement: (selector: string, timeout = 1000): Promise<Element> => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        } else {
          setTimeout(check, 10);
        }
      };
      
      check();
    });
  },

  // Mock localStorage
  mockLocalStorage: () => {
    const store: Record<string, string> = {};
    
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: Object.keys(store).length,
      key: jest.fn((index: number) => Object.keys(store)[index] || null)
    };
  },

  // Mock sessionStorage
  mockSessionStorage: () => {
    const store: Record<string, string> = {};
    
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: Object.keys(store).length,
      key: jest.fn((index: number) => Object.keys(store)[index] || null)
    };
  },

  // Mock fetch
  mockFetch: (response: any, status = 200) => {
    return jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers(),
      url: 'http://localhost/test'
    });
  },

  // Mock IntersectionObserver
  mockIntersectionObserver: () => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null
    });
    window.IntersectionObserver = mockIntersectionObserver;
    return mockIntersectionObserver;
  },

  // Mock ResizeObserver
  mockResizeObserver: () => {
    const mockResizeObserver = jest.fn();
    mockResizeObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null
    });
    window.ResizeObserver = mockResizeObserver;
    return mockResizeObserver;
  },

  // Mock matchMedia
  mockMatchMedia: (matches = false) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  },

  // Mock performance
  mockPerformance: () => {
    const mockPerformance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn(() => []),
      getEntriesByName: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 10000000
      }
    };
    
    Object.defineProperty(window, 'performance', {
      value: mockPerformance,
      writable: true
    });
    
    return mockPerformance;
  },

  // Mock File API
  mockFileAPI: () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockFileList = {
      0: mockFile,
      length: 1,
      item: (index: number) => mockFile
    };
    
    return { mockFile, mockFileList };
  },

  // Mock FileReader
  mockFileReader: () => {
    const mockFileReader = {
      readAsText: jest.fn(),
      readAsDataURL: jest.fn(),
      result: '',
      readyState: 0,
      error: null,
      onload: null,
      onerror: null,
      onloadend: null
    };
    
    Object.defineProperty(window, 'FileReader', {
      value: jest.fn(() => mockFileReader),
      writable: true
    });
    
    return mockFileReader;
  },

  // Create test user
  createTestUser: () => {
    return userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
      delay: null
    });
  },

  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    const mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
    
    Object.assign(console, mockConsole);
    
    return {
      mockConsole,
      restore: () => {
        Object.assign(console, originalConsole);
      }
    };
  },

  // Mock logging service
  mockLoggingService: () => {
    const mockLoggingService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      getLogs: jest.fn(() => []),
      clearLogs: jest.fn()
    };
    
    jest.spyOn(loggingService, 'debug').mockImplementation(mockLoggingService.debug);
    jest.spyOn(loggingService, 'info').mockImplementation(mockLoggingService.info);
    jest.spyOn(loggingService, 'warn').mockImplementation(mockLoggingService.warn);
    jest.spyOn(loggingService, 'error').mockImplementation(mockLoggingService.error);
    
    return mockLoggingService;
  },

  // Assertion helpers
  expectElementToBeVisible: (element: Element | null) => {
    expect(element).toBeInTheDocument();
    expect(element).toBeVisible();
  },

  expectElementToBeHidden: (element: Element | null) => {
    expect(element).toBeInTheDocument();
    expect(element).not.toBeVisible();
  },

  expectElementToHaveText: (element: Element | null, text: string) => {
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(text);
  },

  expectElementToHaveClass: (element: Element | null, className: string) => {
    expect(element).toBeInTheDocument();
    expect(element).toHaveClass(className);
  },

  expectElementToHaveAttribute: (element: Element | null, attribute: string, value?: string) => {
    expect(element).toBeInTheDocument();
    if (value) {
      expect(element).toHaveAttribute(attribute, value);
    } else {
      expect(element).toHaveAttribute(attribute);
    }
  }
};

// Test setup and teardown utilities
export const TestSetup = {
  beforeAll: () => {
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock performance API
    TestUtils.mockPerformance();
    
    // Mock matchMedia
    TestUtils.mockMatchMedia();
    
    // Mock IntersectionObserver
    TestUtils.mockIntersectionObserver();
    
    // Mock ResizeObserver
    TestUtils.mockResizeObserver();
  },

  afterAll: () => {
    jest.restoreAllMocks();
  },

  beforeEach: () => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset stores to initial state
    const noteStore = useNoteStore.getState();
    const themeStore = useThemeStore.getState();
    const uiStore = useUIStore.getState();
    
    // Reset note store
    noteStore.notes = [];
    noteStore.selectedId = null;
    noteStore.isLoading = false;
    noteStore.error = null;
    
    // Reset theme store
    themeStore.theme = 'light';
    themeStore.isDark = false;
    
    // Reset UI store
    uiStore.viewMode = 'editor';
    uiStore.showAISummaryPanel = false;
    uiStore.showExportImport = false;
    uiStore.showTemplateSelector = false;
    uiStore.showSaveAsTemplate = false;
    uiStore.showCollaborationPanel = false;
    uiStore.showPluginManager = false;
    uiStore.showPluginStore = false;
    uiStore.showHelpPanel = false;
  },

  afterEach: () => {
    // Clean up any remaining timers
    jest.clearAllTimers();
    
    // Clean up any remaining async operations
    jest.clearAllMocks();
  }
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { userEvent } from '@testing-library/user-event'; 