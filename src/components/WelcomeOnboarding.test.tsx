import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WelcomeOnboarding from './WelcomeOnboarding';

// Mock the theme store
const mockColors = {
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceHover: '#e9ecef',
  surfaceActive: '#dee2e6',
  text: '#212529',
  textSecondary: '#6c757d',
  primary: '#007bff',
  border: '#dee2e6'
};

jest.mock('../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: mockColors
  })
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('WelcomeOnboarding', () => {
  const defaultProps = {
    isOpen: true,
    onComplete: jest.fn(),
    onSkip: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('should render welcome modal', () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    expect(screen.getByText('Welcome to ZettelView!')).toBeInTheDocument();
    expect(screen.getByText(/Your visual knowledge base for creating and managing interconnected notes/)).toBeInTheDocument();
  });

  test('should show progress indicator', () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    expect(screen.getByText('1 of 10')).toBeInTheDocument();
  });

  test('should show progress dots', () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Should show 10 progress dots (one for each step)
    const progressContainer = screen.getByText('1 of 10').previousElementSibling;
    expect(progressContainer?.children.length).toBe(10);
  });

  test('should show navigation buttons', () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    expect(screen.getByText('Skip Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Next →')).toBeInTheDocument();
  });

  test('should not show previous button on first step', () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    expect(screen.queryByText('← Previous')).not.toBeInTheDocument();
  });

  test('should show previous button on second step', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    const nextButton = screen.getByText('Next →');
    await userEvent.click(nextButton);
    
    expect(screen.getByText('← Previous')).toBeInTheDocument();
  });

  test('should navigate to next step when next button is clicked', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    const nextButton = screen.getByText('Next →');
    await userEvent.click(nextButton);
    
    expect(screen.getByText('Create Your First Note')).toBeInTheDocument();
    expect(screen.getByText('2 of 10')).toBeInTheDocument();
  });

  test('should navigate to previous step when previous button is clicked', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Go to second step
    const nextButton = screen.getByText('Next →');
    await userEvent.click(nextButton);
    
    // Go back to first step
    const previousButton = screen.getByText('← Previous');
    await userEvent.click(previousButton);
    
    expect(screen.getByText('Welcome to ZettelView!')).toBeInTheDocument();
    expect(screen.getByText('1 of 10')).toBeInTheDocument();
  });

  test('should show action hints when available', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Go to second step which has an action
    const nextButton = screen.getByText('Next →');
    await userEvent.click(nextButton);
    
    expect(screen.getByText('💡 Create a note to continue')).toBeInTheDocument();
  });

  test('should call onComplete when finishing tutorial', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Navigate through all steps
    for (let i = 0; i < 9; i++) {
      const nextButton = screen.getByText('Next →');
      await userEvent.click(nextButton);
    }
    
    // Click "Get Started!" on last step
    const getStartedButton = screen.getByText('Get Started!');
    await userEvent.click(getStartedButton);
    
    expect(defaultProps.onComplete).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('zettelview_onboarding_completed', 'true');
  });

  test('should call onSkip when skip button is clicked', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    const skipButton = screen.getByText('Skip Tutorial');
    await userEvent.click(skipButton);
    
    expect(defaultProps.onSkip).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('zettelview_onboarding_completed', 'true');
  });

  test('should call onSkip when close button is clicked', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    const closeButton = screen.getByTitle('Close tutorial');
    await userEvent.click(closeButton);
    
    expect(defaultProps.onSkip).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('zettelview_onboarding_completed', 'true');
  });

  test('should show all tutorial steps', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    const expectedSteps = [
      'Welcome to ZettelView!',
      'Create Your First Note',
      'Rich Markdown Editor',
      'Connect Notes with Internal Links',
      'Organize with Tags',
      'Powerful Search',
      'Visual Knowledge Graph',
      'Keyboard Shortcuts',
      'AI-Powered Insights',
      'Backup & Share'
    ];
    
    for (let i = 0; i < expectedSteps.length; i++) {
      expect(screen.getByText(expectedSteps[i])).toBeInTheDocument();
      
      if (i < expectedSteps.length - 1) {
        const nextButton = screen.getByText('Next →');
        await userEvent.click(nextButton);
      }
    }
  });

  test('should show correct step descriptions', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Check first step description
    expect(screen.getByText(/Your visual knowledge base for creating and managing interconnected notes/)).toBeInTheDocument();
    
    // Go to second step
    const nextButton = screen.getByText('Next →');
    await userEvent.click(nextButton);
    
    // Check second step description
    expect(screen.getByText(/Type a title in the "New note title" field and click "Create Note"/)).toBeInTheDocument();
  });

  test('should handle keyboard navigation', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Test escape key
    await userEvent.keyboard('{Escape}');
    
    expect(defaultProps.onSkip).toHaveBeenCalled();
  });

  test('should have proper accessibility attributes', () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    const closeButton = screen.getByTitle('Close tutorial');
    expect(closeButton).toBeInTheDocument();
    
    const skipButton = screen.getByText('Skip Tutorial');
    expect(skipButton).toBeInTheDocument();
  });

  test('should show different button text on last step', async () => {
    render(<WelcomeOnboarding {...defaultProps} />);
    
    // Navigate to last step
    for (let i = 0; i < 9; i++) {
      const nextButton = screen.getByText('Next →');
      await userEvent.click(nextButton);
    }
    
    expect(screen.getByText('Get Started!')).toBeInTheDocument();
    expect(screen.queryByText('Next →')).not.toBeInTheDocument();
  });
}); 