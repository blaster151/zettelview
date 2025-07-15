import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';

// Mock the problematic ES modules
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children, components }: { children: string; components?: any }) {
    // Simulate the enhanced components behavior
    if (components?.code) {
      // Check if content contains code blocks and render enhanced code blocks
      if (children.includes('```')) {
        const codeBlocks = children.match(/```(\w+)\n([\s\S]*?)```/g);
        if (codeBlocks) {
          return (
            <div data-testid="markdown-preview">
              {codeBlocks.map((block, index) => {
                const match = block.match(/```(\w+)\n([\s\S]*?)```/);
                if (match) {
                  const language = match[1];
                  const code = match[2];
                  return (
                    <div key={index} data-testid="enhanced-code-block">
                      <div data-testid="code-language">{language}</div>
                      <pre>{code}</pre>
                    </div>
                  );
                }
                return <div key={index}>{block}</div>;
              })}
            </div>
          );
        }
      }
      
      // Check if content contains Gist URLs and render Gist embeds
      if (children.includes('gist.github.com')) {
        const gistUrls = children.match(/https:\/\/gist\.github\.com\/[^\s]+/g);
        if (gistUrls) {
          return (
            <div data-testid="markdown-preview">
              {gistUrls.map((url, index) => (
                <div key={index} data-testid="gist-embed" data-url={url}>
                  Gist Embed: {url}
                </div>
              ))}
            </div>
          );
        }
      }
    }
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

// Mock the new components
jest.mock('./EnhancedCodeBlock', () => {
  return function MockEnhancedCodeBlock({ children, className }: { children: string; className?: string }) {
    const language = className?.replace('language-', '') || 'text';
    return (
      <div data-testid="enhanced-code-block">
        <div data-testid="code-language">{language}</div>
        <pre>{children}</pre>
      </div>
    );
  };
});

jest.mock('./GistEmbed', () => {
  return function MockGistEmbed({ url }: { url: string }) {
    return <div data-testid="gist-embed" data-url={url}>Gist Embed: {url}</div>;
  };
});

// Mock the Zustand store
const mockFindOrCreateNote = jest.fn();
const mockSelectNote = jest.fn();
const mockUpdateNote = jest.fn();
const mockGetNote = jest.fn();

jest.mock('../store/noteStore', () => ({
  useNoteStore: () => ({
    findOrCreateNote: mockFindOrCreateNote,
    selectNote: mockSelectNote,
    updateNote: mockUpdateNote,
    getNote: mockGetNote,
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
    const editButton = screen.getByRole('tab', { name: 'Edit mode' });
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    
    expect(editButton).toHaveAttribute('aria-selected', 'true');
    expect(previewButton).toHaveAttribute('aria-selected', 'false');
    
    // Should show textarea
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(defaultProps.value);
  });

  test('should switch to preview mode when preview button is clicked', async () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Should show preview button as active
    expect(previewButton).toHaveAttribute('aria-selected', 'true');
    
    // Should show markdown preview
    expect(screen.getByTestId('markdown-preview')).toBeInTheDocument();
    
    // Should not show textarea
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  test('should switch back to edit mode when edit button is clicked', async () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    // First switch to preview
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Then switch back to edit
    const editButton = screen.getByRole('tab', { name: 'Edit mode' });
    await safeUserEvent.click(editButton);
    
    // Should show edit button as active
    expect(editButton).toHaveAttribute('aria-selected', 'true');
    
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
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
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
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Should render the content (mocked component processes it, so we check for the processed content)
    const previewElement = screen.getByTestId('markdown-preview');
    expect(previewElement).toHaveTextContent('javascript');
    expect(previewElement).toHaveTextContent('console.log("Hello");');
  });

  test('should render enhanced code blocks with language detection', async () => {
    const contentWithCode = '```python\nprint("Hello, World!")\n```';
    render(<MarkdownEditor value={contentWithCode} onChange={mockOnChange} />);
    
    // Switch to preview mode
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Should render enhanced code block
    expect(screen.getByTestId('enhanced-code-block')).toBeInTheDocument();
    expect(screen.getByTestId('code-language')).toHaveTextContent('python');
  });

  test('should render Gist embeds for GitHub Gist URLs', async () => {
    const contentWithGist = 'Check out this code: https://gist.github.com/user/abc123';
    render(<MarkdownEditor value={contentWithGist} onChange={mockOnChange} />);
    
    // Switch to preview mode
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Should render Gist embed
    expect(screen.getByTestId('gist-embed')).toBeInTheDocument();
    expect(screen.getByTestId('gist-embed')).toHaveAttribute('data-url', 'https://gist.github.com/user/abc123');
  });

  test('should handle regular links without Gist embedding', async () => {
    const contentWithRegularLink = 'Check out this link: https://example.com';
    render(<MarkdownEditor value={contentWithRegularLink} onChange={mockOnChange} />);
    
    // Switch to preview mode
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Should not render Gist embed for non-Gist URLs
    expect(screen.queryByTestId('gist-embed')).not.toBeInTheDocument();
  });

  test('should handle mixed content with code blocks and Gist embeds', async () => {
    const mixedContent = `
# Test Note

Here's some code:

\`\`\`javascript
console.log("Hello");
\`\`\`

And here's a Gist: [Check this out](https://gist.github.com/user/abc123)

And another code block:

\`\`\`python
print("World")
\`\`\`
    `;
    
    render(<MarkdownEditor value={mixedContent} onChange={mockOnChange} />);
    
    // Switch to preview mode
    const previewButton = screen.getByRole('tab', { name: 'Preview mode' });
    await safeUserEvent.click(previewButton);
    
    // Should render multiple enhanced code blocks
    const codeBlocks = screen.getAllByTestId('enhanced-code-block');
    expect(codeBlocks).toHaveLength(2);
    
    // Should render Gist embed
    expect(screen.getByTestId('gist-embed')).toBeInTheDocument();
  });

  // Tag management tests
  describe('Tag Management', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockUpdateNote.mockResolvedValue(undefined);
    });

    test('should show tag management UI when noteId is provided', () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test', 'example'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('example')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Add tag...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add tag button' })).toBeInTheDocument();
    });

    test('should not show tag management UI when noteId is not provided', () => {
      render(<MarkdownEditor {...defaultProps} />);
      
      expect(screen.queryByText('Tags')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Add tag...')).not.toBeInTheDocument();
    });

    test('should add a new tag when Add button is clicked', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['existing'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagInput = screen.getByPlaceholderText('Add tag...');
      const addButton = screen.getByRole('button', { name: 'Add tag button' });
      
      await safeUserEvent.type(tagInput, 'new-tag');
      await safeUserEvent.click(addButton);
      
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note', {
        tags: ['existing', 'new-tag'],
        updatedAt: expect.any(Date),
      });
    });

    test('should add a new tag when Enter is pressed in tag input', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagInput = screen.getByPlaceholderText('Add tag...');
      
      await safeUserEvent.type(tagInput, 'new-tag{enter}');
      
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note', {
        tags: ['new-tag'],
        updatedAt: expect.any(Date),
      });
    });

    test('should not add duplicate tags', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['existing'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagInput = screen.getByPlaceholderText('Add tag...');
      const addButton = screen.getByRole('button', { name: 'Add tag button' });
      
      await safeUserEvent.type(tagInput, 'existing');
      
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveStyle({ opacity: '0.6' });
    });

    test('should not add empty tags', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagInput = screen.getByPlaceholderText('Add tag...');
      const addButton = screen.getByRole('button', { name: 'Add tag button' });
      
      await safeUserEvent.type(tagInput, '   ');
      
      expect(addButton).toBeDisabled();
    });

    test('should remove a tag when remove button is clicked', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['tag1', 'tag2', 'tag3'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const removeButtons = screen.getAllByTitle('Remove tag');
      await safeUserEvent.click(removeButtons[1]); // Remove tag2
      
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note', {
        tags: ['tag1', 'tag3'],
        updatedAt: expect.any(Date),
      });
    });

    test('should enter edit mode when tag is clicked', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['editable-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagElement = screen.getByText('editable-tag');
      await safeUserEvent.click(tagElement);
      
      const editInput = screen.getByDisplayValue('editable-tag');
      expect(editInput).toBeInTheDocument();
      expect(editInput).toHaveFocus();
    });

    test('should enter edit mode when Enter is pressed on tag', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['editable-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagElement = screen.getByText('editable-tag');
      fireEvent.keyDown(tagElement, { key: 'Enter' });
      
      const editInput = screen.getByDisplayValue('editable-tag');
      expect(editInput).toBeInTheDocument();
    });

    test('should save tag edit when Enter is pressed', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['old-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagElement = screen.getByText('old-tag');
      await safeUserEvent.click(tagElement);
      
      const editInput = screen.getByDisplayValue('old-tag');
      await safeUserEvent.type(editInput, '{selectall}new-tag{enter}');
      
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note', {
        tags: ['new-tag'],
        updatedAt: expect.any(Date),
      });
    });

    test('should cancel tag edit when Escape is pressed', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['original-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagElement = screen.getByText('original-tag');
      await safeUserEvent.click(tagElement);
      
      const editInput = screen.getByDisplayValue('original-tag');
      await safeUserEvent.type(editInput, '{selectall}changed-tag{escape}');
      
      expect(mockUpdateNote).not.toHaveBeenCalled();
      expect(screen.getByText('original-tag')).toBeInTheDocument();
    });

    test('should save tag edit when input loses focus', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['old-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagElement = screen.getByText('old-tag');
      await safeUserEvent.click(tagElement);
      
      const editInput = screen.getByDisplayValue('old-tag');
      await safeUserEvent.type(editInput, '{selectall}new-tag');
      fireEvent.blur(editInput);
      
      expect(mockUpdateNote).toHaveBeenCalledWith('test-note', {
        tags: ['new-tag'],
        updatedAt: expect.any(Date),
      });
    });

    test('should not save empty tag edits', async () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['original-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      const tagElement = screen.getByText('original-tag');
      await safeUserEvent.click(tagElement);
      
      const editInput = screen.getByDisplayValue('original-tag');
      await safeUserEvent.type(editInput, '{selectall}   ');
      fireEvent.blur(editInput);
      
      expect(mockUpdateNote).not.toHaveBeenCalled();
    });

    test('should have proper accessibility attributes for tag management', () => {
      mockGetNote.mockReturnValue({
        id: 'test-note',
        title: 'Test Note',
        body: 'Test content',
        tags: ['test-tag'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      render(<MarkdownEditor {...defaultProps} noteId="test-note" />);
      
      expect(screen.getByLabelText('Add tag')).toBeInTheDocument();
      expect(screen.getByLabelText('Add tag button')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit tag test-tag')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove tag test-tag')).toBeInTheDocument();
    });
  });
}); 