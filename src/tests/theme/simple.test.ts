import { useThemeStore } from '../../store/themeStore';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// Mock matchMedia
const matchMediaMock = jest.fn();

beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    value: matchMediaMock,
    writable: true,
  });

  // Mock document.documentElement
  Object.defineProperty(document, 'documentElement', {
    value: {
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
      },
      setAttribute: jest.fn(),
      getAttribute: jest.fn(),
      style: {
        setProperty: jest.fn(),
      },
    },
    writable: true,
  });

  // Reset theme store
  useThemeStore.setState({
    theme: 'light',
    systemPreference: 'light',
    isDark: false,
    isSystem: false,
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#3b82f6',
      secondary: '#6b7280',
      border: '#e5e7eb',
      accent: '#f3f4f6',
      surface: '#ffffff',
      surfaceHover: '#f9fafb',
      inputBackground: '#ffffff',
      inputBorder: '#d1d5db',
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.3)',
    },
  });
});

describe('Simple Theme Tests', () => {
  it('should set theme correctly', () => {
    // Act
    useThemeStore.getState().setTheme('dark');

    // Assert
    expect(useThemeStore.getState().theme).toBe('dark');
    expect(useThemeStore.getState().isDark).toBe(true);
  });

  it('should toggle theme correctly', () => {
    // Arrange
    useThemeStore.getState().setTheme('light');

    // Act
    useThemeStore.getState().toggleTheme();

    // Assert
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('should save theme to localStorage', () => {
    // Act
    useThemeStore.getState().setTheme('dark');

    // Assert
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'zettelview-theme',
      expect.stringContaining('"theme":"dark"')
    );
  });
}); 