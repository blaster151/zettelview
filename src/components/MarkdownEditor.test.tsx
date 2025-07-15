import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

// Mock the problematic ES modules
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-preview">{children}</div>;
  };
});

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: string }) => (
    <pre data-testid="syntax-highlighter">{children}</pre>
  ),
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  tomorrow: {},
}));

// Mock the Zustand store
const mockFindOrCreateNote = jest.fn();
const mockSelectNote = jest.fn();

jest.mock('../store/noteStore', () => ({
  useNoteStore: () => ({
    findOrCreateNote: mockFindOrCreateNote,
    selectNote: mockSelectNote,
  }),
}));

// Helper function to prevent hanging with timeout
const safeUserEvent = {
  click: (element: Element) => {
    return Promise.race([
      userEvent.click(element),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('userEvent.click timeout')), 5000)
      )
    ]);
  },
  type: (element: Element, text: string) => {
    return Promise.race([
      userEvent.type(element, text),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('userEvent.type timeout')), 5000)
      )
    ]);
  }
};

describe('MarkdownEditor', () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    value: '# Test Note\n\nThis is a test note with [[Internal Link]].',
    onChange: mockOnChange,
    placeholder: 'Start writing your note...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render in edit mode by default', () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    // Should show edit button as active
    const editButton = screen.getByRole('button', { name: 'Edit' });
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    
    expect(editButton).toHaveStyle({ background: '#007bff' });
    expect(previewButton).toHaveStyle({ background: 'transparent' });
    
    // Should show textarea
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(defaultProps.value);
  });

  test('should switch to preview mode when preview button is clicked', async () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    await safeUserEvent.click(previewButton);
    
    // Should show preview button as active
    expect(previewButton).toHaveStyle({ background: '#007bff' });
    
    // Should show markdown preview
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    
    // Should not show textarea
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('should switch back to edit mode when edit button is clicked', async () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    // First switch to preview
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    await safeUserEvent.click(previewButton);
    
    // Then switch back to edit
    const editButton = screen.getByRole('button', { name: 'Edit' });
    await safeUserEvent.click(editButton);
    
    // Should show edit button as active
    expect(editButton).toHaveStyle({ background: '#007bff' });
    
    // Should show textarea again
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  test('should call onChange when textarea content changes', async () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await safeUserEvent.type(textarea, 'New content');
    
    // Check that onChange was called multiple times (once per character)
    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnChange).toHaveBeenCalledTimes(11); // 11 characters in "New content"
  });

  test('should handle internal links in preview mode', async () => {
    const contentWithLinks = 'This note links to [[Test Note]] and [[Another Note]].';
    render(<MarkdownEditor value={contentWithLinks} onChange={mockOnChange} />);
    
    // Switch to preview mode
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    await safeUserEvent.click(previewButton);
    
    // Should render the content with internal links (mocked component just returns children as-is)
    expect(screen.getByTestId('markdown-preview')).toHaveTextContent(contentWithLinks);
  });

  test('should show placeholder text in edit mode', () => {
    render(<MarkdownEditor value="" onChange={mockOnChange} placeholder="Custom placeholder" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
  });

  test('should handle code blocks in preview mode', async () => {
    const contentWithCode = '```javascript\nconsole.log("Hello");\n```';
    render(<MarkdownEditor value={contentWithCode} onChange={mockOnChange} />);
    
    // Switch to preview mode
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    await safeUserEvent.click(previewButton);
    
    // Should render the content (mocked component just returns children as-is, but may normalize whitespace)
    const previewElement = screen.getByTestId('markdown-preview');
    expect(previewElement).toHaveTextContent('```javascript');
    expect(previewElement).toHaveTextContent('console.log("Hello");');
  });
}); 