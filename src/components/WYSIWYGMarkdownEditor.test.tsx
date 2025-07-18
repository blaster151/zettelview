import React from 'react';
import { render, screen } from '@testing-library/react';
import WYSIWYGMarkdownEditor from './WYSIWYGMarkdownEditor';

// Mock Milkdown dependencies
jest.mock('@milkdown/core', () => ({
  Editor: {
    make: jest.fn(() => ({
      config: jest.fn(() => ({
        use: jest.fn(() => ({
          create: jest.fn(() => ({
            destroy: jest.fn(),
          })),
        })),
      })),
    })),
  },
  rootCtx: 'rootCtx',
  defaultValueCtx: 'defaultValueCtx',
}));

jest.mock('@milkdown/react', () => ({
  useEditor: jest.fn(() => ({
    editor: {
      create: jest.fn(),
      destroy: jest.fn(),
    },
  })),
}));

jest.mock('@milkdown/theme-nord', () => ({
  nord: 'nord',
}));

jest.mock('@milkdown/preset-commonmark', () => ({
  commonmark: 'commonmark',
  paragraph: 'paragraph',
  text: 'text',
  heading: 'heading',
  bold: 'bold',
  italic: 'italic',
  code: 'code',
  codeBlock: 'codeBlock',
  listItem: 'listItem',
  bulletList: 'bulletList',
  orderedList: 'orderedList',
  blockquote: 'blockquote',
  hr: 'hr',
  image: 'image',
  link: 'link',
}));

jest.mock('@milkdown/preset-gfm', () => ({
  gfm: 'gfm',
  table: 'table',
  tableRow: 'tableRow',
  tableCell: 'tableCell',
  tableHeader: 'tableHeader',
  strikethrough: 'strikethrough',
  tasklist: 'tasklist',
  tasklistItem: 'tasklistItem',
}));

jest.mock('@milkdown/plugin-listener', () => ({
  listener: 'listener',
  listenerCtx: 'listenerCtx',
}));

jest.mock('@milkdown/plugin-slash', () => ({
  slash: 'slash',
  slashCtx: 'slashCtx',
}));

jest.mock('@milkdown/plugin-history', () => ({
  history: 'history',
  historyCtx: 'historyCtx',
}));

jest.mock('@milkdown/plugin-clipboard', () => ({
  clipboard: 'clipboard',
  clipboardCtx: 'clipboardCtx',
}));

// Mock the hooks
jest.mock('../hooks/useInternalLinks', () => ({
  useInternalLinks: () => ({
    handleInternalLinkClick: jest.fn(),
    noteExists: jest.fn(() => true),
  }),
}));

jest.mock('../services/notificationService', () => ({
  notificationService: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

describe('WYSIWYGMarkdownEditor', () => {
  const defaultProps = {
    value: '# Test Note\n\nThis is a test note with [[Internal Link]].',
    onChange: jest.fn(),
    placeholder: 'Start writing your note...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render the editor container', () => {
    render(<WYSIWYGMarkdownEditor {...defaultProps} />);
    
    const editorContainer = screen.getByRole('main');
    expect(editorContainer).toBeInTheDocument();
  });

  test('should have correct aria labels', () => {
    render(<WYSIWYGMarkdownEditor {...defaultProps} />);
    
    const editorContainer = screen.getByLabelText('WYSIWYG Markdown editor');
    expect(editorContainer).toBeInTheDocument();
  });

  test('should handle custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder text';
    render(<WYSIWYGMarkdownEditor {...defaultProps} placeholder={customPlaceholder} />);
    
    // The placeholder should be passed to the Milkdown editor
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('should handle noteId prop', () => {
    render(<WYSIWYGMarkdownEditor {...defaultProps} noteId="test-note-id" />);
    
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('should handle autoSave prop', () => {
    render(<WYSIWYGMarkdownEditor {...defaultProps} autoSave={true} />);
    
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  test('should handle custom aria-describedby', () => {
    render(
      <WYSIWYGMarkdownEditor 
        {...defaultProps} 
        aria-describedby="custom-description" 
      />
    );
    
    const editorContainer = screen.getByLabelText('WYSIWYG Markdown editor');
    expect(editorContainer).toHaveAttribute('aria-describedby', 'custom-description');
  });
}); 