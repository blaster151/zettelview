import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpPanel from './HelpPanel';

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

describe('HelpPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should not render when closed', () => {
    render(<HelpPanel isOpen={false} onClose={jest.fn()} />);
    
    expect(screen.queryByText('Help & Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  test('should render when open', () => {
    render(<HelpPanel {...defaultProps} />);
    
    expect(screen.getByText('Help & Keyboard Shortcuts')).toBeInTheDocument();
  });

  test('should show tabs', () => {
    render(<HelpPanel {...defaultProps} />);
    
    expect(screen.getByText('⌨️ Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('📚 Features Guide')).toBeInTheDocument();
    expect(screen.getByText('💡 Tips & Tricks')).toBeInTheDocument();
  });

  test('should show shortcuts by default', () => {
    render(<HelpPanel {...defaultProps} />);
    
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Search & Editing')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
  });

  test('should show keyboard shortcuts', () => {
    render(<HelpPanel {...defaultProps} />);
    
    expect(screen.getByText('Create new note')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Focus search')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+F')).toBeInTheDocument();
  });

  test('should switch to features tab', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const featuresTab = screen.getByText('📚 Features Guide');
    await userEvent.click(featuresTab);
    
    expect(screen.getByText('📝 Markdown Editor')).toBeInTheDocument();
    expect(screen.getByText('🔍 Enhanced Search')).toBeInTheDocument();
    expect(screen.getByText('🕸️ Knowledge Graph')).toBeInTheDocument();
  });

  test('should switch to tips tab', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const tipsTab = screen.getByText('💡 Tips & Tricks');
    await userEvent.click(tipsTab);
    
    expect(screen.getByText('💡 Pro Tips')).toBeInTheDocument();
    expect(screen.getByText('🔗 Internal Linking')).toBeInTheDocument();
    expect(screen.getByText('🏷️ Tagging Strategy')).toBeInTheDocument();
  });

  test('should call onClose when close button is clicked', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const closeButton = screen.getByTitle('Close help');
    await userEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  test('should show all shortcut groups', () => {
    render(<HelpPanel {...defaultProps} />);
    
    // Navigation shortcuts
    expect(screen.getByText('Create new note')).toBeInTheDocument();
    expect(screen.getByText('Previous note')).toBeInTheDocument();
    expect(screen.getByText('Next note')).toBeInTheDocument();
    expect(screen.getByText('Toggle graph view')).toBeInTheDocument();
    
    // Search & Editing shortcuts
    expect(screen.getByText('Focus search')).toBeInTheDocument();
    expect(screen.getByText('Focus new note input')).toBeInTheDocument();
    expect(screen.getByText('Save note')).toBeInTheDocument();
    expect(screen.getByText('Command palette')).toBeInTheDocument();
    
    // Features shortcuts
    expect(screen.getByText('AI Analysis')).toBeInTheDocument();
    expect(screen.getByText('Export/Import')).toBeInTheDocument();
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  test('should show all shortcut keys', () => {
    render(<HelpPanel {...defaultProps} />);
    
    const expectedKeys = [
      'Ctrl+N', 'Ctrl+P', 'Ctrl+Shift+P', 'Ctrl+G',
      'Ctrl+F', 'Ctrl+Shift+N', 'Ctrl+S', 'Ctrl+Shift+C',
      'Ctrl+Shift+A', 'Ctrl+Shift+E', 'Ctrl+Shift+T'
    ];
    
    expectedKeys.forEach(key => {
      expect(screen.getByText(key)).toBeInTheDocument();
    });
  });

  test('should show features guide content', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const featuresTab = screen.getByText('📚 Features Guide');
    await userEvent.click(featuresTab);
    
    expect(screen.getByText(/Write notes using Markdown syntax/)).toBeInTheDocument();
    expect(screen.getByText(/Find notes with fuzzy matching/)).toBeInTheDocument();
    expect(screen.getByText(/Visualize your notes and their connections/)).toBeInTheDocument();
    expect(screen.getByText(/Get AI-powered summaries/)).toBeInTheDocument();
    expect(screen.getByText(/Backup your notes as JSON or CSV files/)).toBeInTheDocument();
  });

  test('should show tips and tricks content', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const tipsTab = screen.getByText('💡 Tips & Tricks');
    await userEvent.click(tipsTab);
    
    expect(screen.getByText(/Use tags consistently to organize related notes/)).toBeInTheDocument();
    expect(screen.getByText(/Use double brackets to create links/)).toBeInTheDocument();
    expect(screen.getByText(/Use descriptive tags like "programming"/)).toBeInTheDocument();
    expect(screen.getByText(/Create notes with clear titles/)).toBeInTheDocument();
  });

  test('should show internal linking example', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const tipsTab = screen.getByText('💡 Tips & Tricks');
    await userEvent.click(tipsTab);
    
    expect(screen.getByText('[[Note Title]]')).toBeInTheDocument();
  });

  test('should have proper accessibility attributes', () => {
    render(<HelpPanel {...defaultProps} />);
    
    const closeButton = screen.getByTitle('Close help');
    expect(closeButton).toBeInTheDocument();
  });

  test('should handle tab switching correctly', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    // Start with shortcuts tab
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    
    // Switch to features tab
    const featuresTab = screen.getByText('📚 Features Guide');
    await userEvent.click(featuresTab);
    expect(screen.getByText('📝 Markdown Editor')).toBeInTheDocument();
    expect(screen.queryByText('Navigation')).not.toBeInTheDocument();
    
    // Switch to tips tab
    const tipsTab = screen.getByText('💡 Tips & Tricks');
    await userEvent.click(tipsTab);
    expect(screen.getByText('💡 Pro Tips')).toBeInTheDocument();
    expect(screen.queryByText('📝 Markdown Editor')).not.toBeInTheDocument();
    
    // Switch back to shortcuts tab
    const shortcutsTab = screen.getByText('⌨️ Keyboard Shortcuts');
    await userEvent.click(shortcutsTab);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.queryByText('💡 Pro Tips')).not.toBeInTheDocument();
  });

  test('should show workflow steps', async () => {
    
    render(<HelpPanel {...defaultProps} />);
    
    const tipsTab = screen.getByText('💡 Tips & Tricks');
    await userEvent.click(tipsTab);
    
    expect(screen.getByText(/1\. Create notes with clear titles/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Add relevant tags for organization/)).toBeInTheDocument();
    expect(screen.getByText(/3\. Link related notes together/)).toBeInTheDocument();
    expect(screen.getByText(/4\. Use search to find what you need/)).toBeInTheDocument();
    expect(screen.getByText(/5\. Explore connections in graph view/)).toBeInTheDocument();
  });
}); 
