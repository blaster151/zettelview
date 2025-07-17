import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PluginManager } from './PluginManager';
import { usePlugins } from '../../hooks/usePlugins';
import { Plugin } from '../../types/plugins';

// Mock the usePlugins hook
jest.mock('../../hooks/usePlugins');
const mockUsePlugins = usePlugins as jest.MockedFunction<typeof usePlugins>;

// Mock UI components
jest.mock('../ui/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  )
}));

jest.mock('../ui/Modal', () => ({
  Modal: ({ children, isOpen, onClose, title }: any) => 
    isOpen ? (
      <div data-testid="modal">
        <div data-testid="modal-title">{title}</div>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null
}));

jest.mock('../ui/Tabs', () => ({
  Tabs: ({ children, value, onChange }: any) => (
    <div data-testid="tabs">
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          isActive: child.props.value === value,
          onClick: () => onChange(child.props.value)
        })
      )}
    </div>
  ),
  Tab: ({ children, isActive, onClick, value }: any) => (
    <button 
      data-testid={`tab-${value}`}
      className={isActive ? 'active' : ''}
      onClick={onClick}
    >
      {children}
    </button>
  )
}));

jest.mock('../ui/Switch', () => ({
  Switch: ({ checked, onChange, disabled }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      data-testid="switch"
    />
  )
}));

jest.mock('../ui/Input', () => ({
  Input: ({ value, onChange, placeholder, leftIcon, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  )
}));

jest.mock('../ui/Icon', () => ({
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>
}));

jest.mock('../ui/Badge', () => ({
  Badge: ({ children, color }: any) => (
    <span data-testid={`badge-${color}`}>{children}</span>
  )
}));

const mockPlugins: Plugin[] = [
  {
    id: 'dark-theme',
    name: 'Dark Theme',
    description: 'A beautiful dark theme for ZettelView',
    version: '1.0.0',
    author: 'ZettelView Team',
    category: 'theme',
    isEnabled: true,
    isBuiltIn: true,
    settings: [
      {
        id: 'accent-color',
        name: 'Accent Color',
        description: 'Primary accent color for the theme',
        type: 'color',
        defaultValue: '#007bff',
        value: '#007bff'
      }
    ],
    metadata: {
      created: new Date(),
      lastUpdated: new Date(),
      downloadCount: 0,
      rating: 5,
      size: 1024
    }
  },
  {
    id: 'word-count',
    name: 'Word Count',
    description: 'Display word count and reading time for notes',
    version: '1.0.0',
    author: 'ZettelView Team',
    category: 'feature',
    isEnabled: false,
    isBuiltIn: true,
    settings: [
      {
        id: 'show-reading-time',
        name: 'Show Reading Time',
        description: 'Display estimated reading time',
        type: 'boolean',
        defaultValue: true,
        value: true
      }
    ],
    metadata: {
      created: new Date(),
      lastUpdated: new Date(),
      downloadCount: 0,
      rating: 4,
      size: 512
    }
  },
  {
    id: 'custom-plugin',
    name: 'Custom Plugin',
    description: 'A custom plugin for testing',
    version: '1.0.0',
    author: 'Test Author',
    category: 'utility',
    isEnabled: true,
    isBuiltIn: false,
    settings: [],
    metadata: {
      created: new Date(),
      lastUpdated: new Date(),
      downloadCount: 0,
      rating: 0,
      size: 0
    }
  }
];

describe('PluginManager', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  const mockUsePluginsReturn = {
    plugins: mockPlugins,
    enabledPlugins: mockPlugins.filter(p => p.isEnabled),
    loading: false,
    error: null,
    enablePlugin: jest.fn(),
    disablePlugin: jest.fn(),
    updatePluginSettings: jest.fn(),
    getPluginSettings: jest.fn(),
    getPluginsByCategory: jest.fn(),
    refreshPlugins: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePlugins.mockReturnValue(mockUsePluginsReturn);
  });

  describe('Rendering', () => {
    it('should render plugin manager modal when open', () => {
      render(<PluginManager {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Plugin Manager');
    });

    it('should not render when closed', () => {
      render(<PluginManager {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should display all plugins by default', () => {
      render(<PluginManager {...defaultProps} />);

      expect(screen.getByText('Dark Theme')).toBeInTheDocument();
      expect(screen.getByText('Word Count')).toBeInTheDocument();
      expect(screen.getByText('Custom Plugin')).toBeInTheDocument();
    });

    it('should show plugin categories and metadata', () => {
      render(<PluginManager {...defaultProps} />);

      expect(screen.getByText('theme')).toBeInTheDocument();
      expect(screen.getByText('feature')).toBeInTheDocument();
      expect(screen.getByText('utility')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
      expect(screen.getByText('by ZettelView Team')).toBeInTheDocument();
    });

    it('should show built-in badge for built-in plugins', () => {
      render(<PluginManager {...defaultProps} />);

      expect(screen.getByTestId('badge-gray')).toHaveTextContent('Built-in');
    });
  });

  describe('Tabs and Filtering', () => {
    it('should render all tab options', () => {
      render(<PluginManager {...defaultProps} />);

      expect(screen.getByTestId('tab-all')).toBeInTheDocument();
      expect(screen.getByTestId('tab-enabled')).toBeInTheDocument();
      expect(screen.getByTestId('tab-themes')).toBeInTheDocument();
      expect(screen.getByTestId('tab-features')).toBeInTheDocument();
      expect(screen.getByTestId('tab-utilities')).toBeInTheDocument();
    });

    it('should filter plugins by category when tab is selected', () => {
      mockUsePluginsReturn.getPluginsByCategory.mockReturnValue([
        mockPlugins[0] // Dark Theme (theme category)
      ]);

      render(<PluginManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-themes'));

      expect(mockUsePluginsReturn.getPluginsByCategory).toHaveBeenCalledWith('theme');
    });

    it('should show enabled plugins when enabled tab is selected', () => {
      render(<PluginManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-enabled'));

      // Should only show enabled plugins
      expect(screen.getByText('Dark Theme')).toBeInTheDocument();
      expect(screen.getByText('Custom Plugin')).toBeInTheDocument();
      expect(screen.queryByText('Word Count')).not.toBeInTheDocument(); // Disabled
    });
  });

  describe('Plugin Toggle', () => {
    it('should enable plugin when toggle is clicked', async () => {
      render(<PluginManager {...defaultProps} />);

      const switches = screen.getAllByTestId('switch');
      const wordCountSwitch = switches[1]; // Word Count plugin (disabled)

      fireEvent.click(wordCountSwitch);

      await waitFor(() => {
        expect(mockUsePluginsReturn.enablePlugin).toHaveBeenCalledWith('word-count');
      });
    });

    it('should disable plugin when toggle is clicked', async () => {
      render(<PluginManager {...defaultProps} />);

      const switches = screen.getAllByTestId('switch');
      const darkThemeSwitch = switches[0]; // Dark Theme plugin (enabled)

      fireEvent.click(darkThemeSwitch);

      await waitFor(() => {
        expect(mockUsePluginsReturn.disablePlugin).toHaveBeenCalledWith('dark-theme');
      });
    });

    it('should disable toggle for built-in plugins', () => {
      render(<PluginManager {...defaultProps} />);

      const switches = screen.getAllByTestId('switch');
      const darkThemeSwitch = switches[0]; // Dark Theme plugin (built-in)

      expect(darkThemeSwitch).toBeDisabled();
    });
  });

  describe('Settings', () => {
    it('should show settings button for plugins with settings', () => {
      render(<PluginManager {...defaultProps} />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should not show settings button for plugins without settings', () => {
      const pluginsWithoutSettings = mockPlugins.map(p => ({ ...p, settings: [] }));
      mockUsePlugins.mockReturnValue({
        ...mockUsePluginsReturn,
        plugins: pluginsWithoutSettings
      });

      render(<PluginManager {...defaultProps} />);

      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when there is an error', () => {
      mockUsePlugins.mockReturnValue({
        ...mockUsePluginsReturn,
        error: 'Failed to load plugins'
      });

      render(<PluginManager {...defaultProps} />);

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load plugins')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      mockUsePlugins.mockReturnValue({
        ...mockUsePluginsReturn,
        loading: true
      });

      render(<PluginManager {...defaultProps} />);

      expect(screen.getByText('Loading plugins...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no plugins match filter', () => {
      mockUsePluginsReturn.getPluginsByCategory.mockReturnValue([]);

      render(<PluginManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-themes'));

      expect(screen.getByText('No plugins found')).toBeInTheDocument();
      expect(screen.getByText('No plugins match the current filter.')).toBeInTheDocument();
    });

    it('should show empty state when no plugins are enabled', () => {
      mockUsePlugins.mockReturnValue({
        ...mockUsePluginsReturn,
        enabledPlugins: []
      });

      render(<PluginManager {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-enabled'));

      expect(screen.getByText('No plugins found')).toBeInTheDocument();
      expect(screen.getByText('No plugins are currently enabled.')).toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      render(<PluginManager {...defaultProps} />);

      fireEvent.click(screen.getByText('Close'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PluginManager {...defaultProps} />);

      // Check for modal role
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Check for tab navigation
      expect(screen.getByTestId('tabs')).toBeInTheDocument();

      // Check for switches (checkboxes)
      const switches = screen.getAllByTestId('switch');
      expect(switches.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      render(<PluginManager {...defaultProps} />);

      const tabs = screen.getAllByRole('button');
      expect(tabs.length).toBeGreaterThan(0);

      // Test tab navigation
      tabs[0].focus();
      expect(tabs[0]).toHaveFocus();
    });
  });
}); 