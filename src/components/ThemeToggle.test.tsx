import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from './ThemeToggle';
import { useThemeStore } from '../store/themeStore';

// Mock the theme store
jest.mock('../store/themeStore');

const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('ThemeToggle', () => {
  const mockToggleTheme = jest.fn();
  const mockColors = {
    text: '#212529',
    border: '#dee2e6',
    surfaceHover: '#e9ecef',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders light theme toggle button', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🌙');
    expect(button).toHaveTextContent('Dark');
  });

  test('renders dark theme toggle button', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'dark',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /switch to light theme/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('☀️');
    expect(button).toHaveTextContent('Light');
  });

  test('calls toggleTheme when clicked', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  test('has correct accessibility attributes', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to dark theme');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark theme');
  });

  test('applies theme colors to button styling', () => {
    const customColors = {
      text: '#ff0000',
      border: '#00ff00',
      surfaceHover: '#0000ff',
    };

    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: customColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      color: '#ff0000',
      border: '1px solid #00ff00',
    });
  });

  test('handles hover state correctly', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    
    // Test mouse enter
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({ background: '#e9ecef' });
    
    // Test mouse leave
    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({ background: 'transparent' });
  });

  test('maintains button structure and layout', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
    });
  });

  test('displays correct icon and text for dark theme', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'dark',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('☀️');
    expect(button).toHaveTextContent('Light');
  });

  test('displays correct icon and text for light theme', () => {
    mockUseThemeStore.mockReturnValue({
      theme: 'light',
      colors: mockColors,
      toggleTheme: mockToggleTheme,
      setTheme: jest.fn(),
    });

    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🌙');
    expect(button).toHaveTextContent('Dark');
  });
}); 