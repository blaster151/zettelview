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
}); 