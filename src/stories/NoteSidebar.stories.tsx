import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { NoteSidebar } from '../components';

const meta: Meta<typeof NoteSidebar> = {
  title: 'Components/NoteSidebar',
  component: NoteSidebar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    // Component uses store, no direct props
  },
};

export default meta;
type Story = StoryObj<typeof NoteSidebar>;

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'NoteSidebar with default notes and functionality.',
      },
    },
  },
};

export const WithManyNotes: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'NoteSidebar with many notes to show scrolling behavior.',
      },
    },
  },
};

export const WithTags: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'NoteSidebar showing notes with various tags for filtering.',
      },
    },
  },
}; 