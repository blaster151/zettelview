import type { Meta, StoryObj } from '@storybook/react-webpack5';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeStore } from '../store/themeStore';

// Mock the theme store for Storybook
const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // No props for this component
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const LightTheme: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'ThemeToggle component in light theme mode.',
      },
    },
  },
};

export const DarkTheme: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'ThemeToggle component in dark theme mode.',
      },
    },
  },
}; 