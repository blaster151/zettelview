import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from 'react-dom/test-utils';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const lightColors = useThemeStore.getState().colors;
    useThemeStore.setState({ theme: 'light', colors: lightColors });
    localStorage.clear();
  });

  it('should initialize with light theme by default', () => {
    const { theme, colors } = useThemeStore.getState();
    expect(theme).toBe('light');
    expect(colors).toBeDefined();
  });

  it('should toggle to dark theme', () => {
    act(() => {
      useThemeStore.getState().toggleTheme();
    });
    const { theme, colors } = useThemeStore.getState();
    expect(theme).toBe('dark');
    expect(colors).toBeDefined();
  });

  it('should toggle back to light theme', () => {
    act(() => {
      useThemeStore.getState().toggleTheme();
      useThemeStore.getState().toggleTheme();
    });
    const { theme, colors } = useThemeStore.getState();
    expect(theme).toBe('light');
    expect(colors).toBeDefined();
  });

  it('should set theme directly to dark', () => {
    act(() => {
      useThemeStore.getState().setTheme('dark');
    });
    const { theme, colors } = useThemeStore.getState();
    expect(theme).toBe('dark');
    expect(colors).toBeDefined();
  });

  it('should set theme directly to light', () => {
    act(() => {
      useThemeStore.getState().setTheme('light');
    });
    const { theme, colors } = useThemeStore.getState();
    expect(theme).toBe('light');
    expect(colors).toBeDefined();
  });

  it('should persist theme to localStorage', () => {
    act(() => {
      useThemeStore.getState().setTheme('dark');
    });
    const persisted = localStorage.getItem('zettelview-theme');
    expect(persisted).toContain('dark');
  });

  it('should update colors when toggling theme', () => {
    const initialColors = useThemeStore.getState().colors;
    act(() => {
      useThemeStore.getState().toggleTheme();
    });
    const newColors = useThemeStore.getState().colors;
    expect(newColors).not.toEqual(initialColors);
    expect(newColors).toBeDefined();
  });
}); 