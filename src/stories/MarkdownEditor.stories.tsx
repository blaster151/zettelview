import type { Meta, StoryObj } from '@storybook/react-webpack5';
import MarkdownEditor from '../components/MarkdownEditor';

const meta: Meta<typeof MarkdownEditor> = {
  title: 'Components/MarkdownEditor',
  component: MarkdownEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'The markdown content to display/edit',
    },
    onChange: {
      action: 'changed',
      description: 'Callback when content changes',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for empty editor',
    },
    noteId: {
      control: 'text',
      description: 'Optional note ID for tag management',
    },
    autoSave: {
      control: 'boolean',
      description: 'Enable auto-save functionality',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownEditor>;

export const Default: Story = {
  args: {
    value: '# Welcome to ZettelView!\n\nThis is a **markdown editor** with _rich features_.',
    onChange: (value: string) => console.log('Content changed:', value),
    placeholder: 'Start writing your note...',
  },
};

export const WithCodeBlock: Story = {
  args: {
    value: `# Code Example

Here's some JavaScript code:

\`\`\`javascript
function hello() {
  console.log("Hello, ZettelView!");
  return "Welcome!";
}
\`\`\`

And some inline \`code\` here.`,
    onChange: (value: string) => console.log('Content changed:', value),
  },
};

export const WithInternalLinks: Story = {
  args: {
    value: `# Note with Links

This note links to [[Another Note]] and [[Programming Guide]].

You can also use regular [external links](https://example.com).`,
    onChange: (value: string) => console.log('Content changed:', value),
  },
};

export const WithTables: Story = {
  args: {
    value: `# Data Table

| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ | Full support |
| Code blocks | ✅ | Syntax highlighting |
| Tables | ✅ | Responsive design |
| Links | ✅ | Internal & external |

This table shows our features.`,
    onChange: (value: string) => console.log('Content changed:', value),
  },
};

export const Empty: Story = {
  args: {
    value: '',
    onChange: (value: string) => console.log('Content changed:', value),
    placeholder: 'Start writing your note...',
  },
};

export const WithAutoSave: Story = {
  args: {
    value: '# Auto-save Enabled\n\nThis editor has auto-save enabled.',
    onChange: (value: string) => console.log('Content changed:', value),
    autoSave: true,
  },
}; 