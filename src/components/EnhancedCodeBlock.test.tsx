import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EnhancedCodeBlock from './EnhancedCodeBlock';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn(),
};
Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock fetch for Gist API
global.fetch = jest.fn();

describe('EnhancedCodeBlock', () => {
  const defaultProps = {
    children: 'console.log("Hello, World!");',
    className: 'language-javascript',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  test('renders code block with language label', () => {
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    expect(screen.getByText('JAVASCRIPT')).toBeInTheDocument();
    // The code content is rendered by SyntaxHighlighter, so we check for the full text
    expect(screen.getByText('console.log("Hello, World!");')).toBeInTheDocument();
  });

  test('renders with default language when no className provided', () => {
    render(<EnhancedCodeBlock children="test code" />);
    
    expect(screen.getByText('TEXT')).toBeInTheDocument();
  });

  test('handles copy functionality successfully', async () => {
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    const copyButton = screen.getByText('Copy');
    await act(async () => {
      fireEvent.click(copyButton);
    });
    
    expect(screen.getByText('Copying...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('console.log("Hello, World!");');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  test('handles copy failure gracefully', async () => {
    mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
    
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    const copyButton = screen.getByText('Copy');
    await act(async () => {
      fireEvent.click(copyButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to copy to clipboard')).toBeInTheDocument();
    });
  });

  test('handles Gist export functionality', async () => {
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    const exportButton = screen.getByText('Export to Gist');
    await act(async () => {
      fireEvent.click(exportButton);
    });
    
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Exported!')).toBeInTheDocument();
    });
    
    // Should show Gist link
    await waitFor(() => {
      expect(screen.getByText('View Gist →')).toBeInTheDocument();
    });
  });

  test('handles Gist export failure gracefully', async () => {
    // Mock fetch to fail
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    const exportButton = screen.getByText('Export to Gist');
    await act(async () => {
      fireEvent.click(exportButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Failed to export to Gist. Please check your GitHub token.')).toBeInTheDocument();
    });
  });

  test('disables buttons during operations', async () => {
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    const copyButton = screen.getByText('Copy');
    const exportButton = screen.getByText('Export to Gist');
    
    await act(async () => {
      fireEvent.click(copyButton);
    });
    
    expect(copyButton).toBeDisabled();
    expect(exportButton).toBeDisabled();
    
    await waitFor(() => {
      expect(copyButton).not.toBeDisabled();
      expect(exportButton).not.toBeDisabled();
    });
  });

  test('extracts language from className correctly', () => {
    render(<EnhancedCodeBlock children="test" className="language-python" />);
    
    expect(screen.getByText('PYTHON')).toBeInTheDocument();
  });

  test('handles empty or invalid className gracefully', () => {
    render(<EnhancedCodeBlock children="test" className="" />);
    
    expect(screen.getByText('TEXT')).toBeInTheDocument();
  });

  test('renders with proper styling classes', () => {
    render(<EnhancedCodeBlock {...defaultProps} />);
    
    const container = screen.getByText('JAVASCRIPT').closest('.enhanced-code-block');
    expect(container).toBeInTheDocument();
    
    const header = screen.getByText('JAVASCRIPT').closest('.code-block-header');
    expect(header).toBeInTheDocument();
  });
}); 