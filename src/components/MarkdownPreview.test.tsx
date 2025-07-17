import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MarkdownPreview from './MarkdownPreview';

// Mock the debounced preview hook
jest.mock('../hooks/useDebouncedPreview', () => ({
  useDebouncedPreview: jest.fn()
}));

const mockUseDebouncedPreview = require('../hooks/useDebouncedPreview').useDebouncedPreview;

describe('MarkdownPreview', () => {
  const defaultProps = {
    markdown: '# Test Heading\n\nThis is a test.',
    onInternalLinkClick: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders markdown content correctly', () => {
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: '# Test Heading\n\nThis is a test.',
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('Test Heading')).toBeInTheDocument();
    expect(screen.getByText('This is a test.')).toBeInTheDocument();
  });

  test('shows loading indicator when updating', () => {
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: '# Test Heading',
      isUpdating: true
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('Updating...')).toBeInTheDocument();
  });

  test('hides loading indicator when not updating', () => {
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: '# Test Heading',
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
  });

  test('handles internal links correctly', () => {
    const markdownWithLinks = 'Check out [[Test Note]] for more info.';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithLinks,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    const linkButton = screen.getByText('[[Test Note]]');
    expect(linkButton).toBeInTheDocument();
    expect(linkButton).toHaveAttribute('aria-label', 'Link to note: Test Note');
  });

  test('handles external links correctly', () => {
    const markdownWithExternalLink = 'Visit [Google](https://google.com) for search.';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithExternalLink,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    const link = screen.getByText('Google');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('handles Gist embeds correctly', () => {
    const markdownWithGist = 'Check this gist: https://gist.github.com/user/1234567890abcdef';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithGist,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    // Should render GistEmbed component instead of regular link
    expect(screen.queryByText('https://gist.github.com/user/1234567890abcdef')).not.toBeInTheDocument();
  });

  test('handles code blocks correctly', () => {
    const markdownWithCode = '```javascript\nconsole.log("Hello");\n```';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithCode,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('console.log("Hello");')).toBeInTheDocument();
  });

  test('handles tables correctly', () => {
    const markdownWithTable = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
    `;
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithTable,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('Header 1')).toBeInTheDocument();
    expect(screen.getByText('Header 2')).toBeInTheDocument();
    expect(screen.getByText('Cell 1')).toBeInTheDocument();
    expect(screen.getByText('Cell 2')).toBeInTheDocument();
  });

  test('handles images correctly', () => {
    const markdownWithImage = '![Alt text](https://example.com/image.jpg)';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithImage,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    const image = screen.getByAltText('Alt text');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  test('handles blockquotes correctly', () => {
    const markdownWithQuote = '> This is a blockquote';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithQuote,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('This is a blockquote')).toBeInTheDocument();
  });

  test('handles lists correctly', () => {
    const markdownWithList = `
- Item 1
- Item 2
- Item 3
    `;
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithList,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  test('handles text formatting correctly', () => {
    const markdownWithFormatting = '**Bold text** and *italic text*';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithFormatting,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('Bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();
  });

  test('calls onInternalLinkClick when internal link is clicked', () => {
    const onInternalLinkClick = jest.fn();
    const markdownWithLinks = 'Check out [[Test Note]] for more info.';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithLinks,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} onInternalLinkClick={onInternalLinkClick} />);
    
    const linkButton = screen.getByText('[[Test Note]]');
    linkButton.click();
    
    expect(onInternalLinkClick).toHaveBeenCalledWith('Test Note');
  });

  test('handles empty markdown gracefully', () => {
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: '',
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    // Should render without errors
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('handles markdown with special characters', () => {
    const markdownWithSpecialChars = '# Heading with @#$%^&*()\n\nContent with `code` and **bold**';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: markdownWithSpecialChars,
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(screen.getByText('Heading with @#$%^&*()')).toBeInTheDocument();
    expect(screen.getByText('Content with')).toBeInTheDocument();
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
  });

  test('handles markdown parsing errors gracefully', () => {
    const invalidMarkdown = '```\nunclosed code block';
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: invalidMarkdown,
      isUpdating: false
    });

    // Should not throw error
    expect(() => {
      render(<MarkdownPreview {...defaultProps} />);
    }).not.toThrow();
  });

  test('uses custom debounce time when provided', () => {
    const customDebounceMs = 1000;
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: '# Test',
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} debounceMs={customDebounceMs} />);
    
    expect(mockUseDebouncedPreview).toHaveBeenCalledWith(
      defaultProps.markdown,
      expect.objectContaining({
        debounceMs: customDebounceMs
      })
    );
  });

  test('uses default debounce time when not provided', () => {
    mockUseDebouncedPreview.mockReturnValue({
      debouncedValue: '# Test',
      isUpdating: false
    });

    render(<MarkdownPreview {...defaultProps} />);
    
    expect(mockUseDebouncedPreview).toHaveBeenCalledWith(
      defaultProps.markdown,
      expect.objectContaining({
        debounceMs: 500
      })
    );
  });
}); 