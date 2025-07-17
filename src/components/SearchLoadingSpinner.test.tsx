import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchLoadingSpinner from './SearchLoadingSpinner';
import { useThemeStore } from '../store/themeStore';

// Mock the theme store
jest.mock('../store/themeStore');

const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('SearchLoadingSpinner', () => {
  const mockColors = {
    textSecondary: '#666',
    border: '#ccc',
    primary: '#007bff'
  };

  beforeEach(() => {
    mockUseThemeStore.mockReturnValue({ colors: mockColors });
  });

  test('should render with default props', () => {
    render(<SearchLoadingSpinner />);
    
    const spinner = screen.getByText('Searching...');
    expect(spinner).toBeInTheDocument();
    
    const spinnerElement = spinner.previousElementSibling;
    expect(spinnerElement).toHaveStyle({
      width: '16px',
      height: '16px',
      border: `2px solid ${mockColors.border}`,
      borderTop: `2px solid ${mockColors.primary}`,
      borderRadius: '50%'
    });
  });

  test('should render with small size', () => {
    render(<SearchLoadingSpinner size="small" />);
    
    const spinner = screen.getByText('Searching...');
    const spinnerElement = spinner.previousElementSibling;
    
    expect(spinnerElement).toHaveStyle({
      width: '12px',
      height: '12px'
    });
  });

  test('should render with large size', () => {
    render(<SearchLoadingSpinner size="large" />);
    
    const spinner = screen.getByText('Searching...');
    const spinnerElement = spinner.previousElementSibling;
    
    expect(spinnerElement).toHaveStyle({
      width: '20px',
      height: '20px'
    });
  });

  test('should not show text when showText is false', () => {
    render(<SearchLoadingSpinner showText={false} />);
    
    expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    
    // Spinner element should still be present
    const container = screen.getByRole('generic');
    expect(container.children[0]).toHaveStyle({
      width: '16px',
      height: '16px'
    });
  });

  test('should apply custom className', () => {
    render(<SearchLoadingSpinner className="custom-class" />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('custom-class');
  });

  test('should have proper styling and layout', () => {
    render(<SearchLoadingSpinner />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: mockColors.textSecondary,
      fontSize: '14px'
    });
  });

  test('should have spinning animation', () => {
    render(<SearchLoadingSpinner />);
    
    const spinner = screen.getByText('Searching...');
    const spinnerElement = spinner.previousElementSibling;
    
    const computedStyle = window.getComputedStyle(spinnerElement as Element);
    expect(computedStyle.animation).toContain('spin');
    expect(computedStyle.animationDuration).toBe('1s');
    expect(computedStyle.animationTimingFunction).toBe('linear');
    expect(computedStyle.animationIterationCount).toBe('infinite');
  });

  test('should render with different text sizes based on spinner size', () => {
    const { rerender } = render(<SearchLoadingSpinner size="small" />);
    
    let container = screen.getByRole('generic');
    expect(container).toHaveStyle({ fontSize: '12px' });

    rerender(<SearchLoadingSpinner size="medium" />);
    container = screen.getByRole('generic');
    expect(container).toHaveStyle({ fontSize: '14px' });

    rerender(<SearchLoadingSpinner size="large" />);
    container = screen.getByRole('generic');
    expect(container).toHaveStyle({ fontSize: '16px' });
  });

  test('should be accessible', () => {
    render(<SearchLoadingSpinner />);
    
    // Should have proper semantic structure
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
    
    // Should have text content for screen readers
    const text = screen.getByText('Searching...');
    expect(text).toBeInTheDocument();
  });
}); 