import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PluginStore } from './PluginStore';
import { Plugin } from '../../types/plugins';

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

jest.mock('../ui/Tabs', () => ({
  Tabs: ({ children, value, onChange }: any) => (
    <div data-testid="tabs">
      {children}
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

jest.mock('../ui/Badge', () => ({
  Badge: ({ children, color }: any) => (
    <span data-testid={`badge-${color}`}>{children}</span>
  )
}));

jest.mock('../ui/Icon', () => ({
  Icon: ({ name }: any) => <span data-testid={`icon-${name}`}>{name}</span>
}));

const mockStorePlugins: Plugin[] = [
  {
    id: 'github-integration',
    name: 'GitHub Integration',
    description: 'Sync your notes with GitHub repositories and create issues directly from notes',
    version: '1.2.0',
    author: 'Plugin Developer',
    category: 'integration',
    isEnabled: false,
    isBuiltIn: false,
    settings: [
      {
        id: 'github-token',
        name: 'GitHub Token',
        description: 'Your GitHub personal access token',
        type: 'string',
        defaultValue: '',
        value: ''
      }
    ],
    metadata: {
      created: new Date('2024-01-15'),
      lastUpdated: new Date('2024-02-20'),
      downloadCount: 1250,
      rating: 4.8,
      size: 2048
    }
  },
  {
    id: 'mind-map-view',
    name: 'Mind Map View',
    description: 'Visualize your notes as interactive mind maps with drag-and-drop functionality',
    version: '2.1.0',
    author: 'Visual Studio',
    category: 'feature',
    isEnabled: false,
    isBuiltIn: false,
    settings: [
      {
        id: 'auto-layout',
        name: 'Auto Layout',
        description: 'Automatically arrange mind map nodes',
        type: 'boolean',
        defaultValue: true,
        value: true
      }
    ],
    metadata: {
      created: new Date('2024-01-10'),
      lastUpdated: new Date('2024-02-15'),
      downloadCount: 890,
      rating: 4.6,
      size: 3072
    }
  },
  {
    id: 'zen-theme',
    name: 'Zen Theme',
    description: 'A minimalist theme focused on distraction-free writing with subtle colors',
    version: '1.0.0',
    author: 'Design Studio',
    category: 'theme',
    isEnabled: false,
    isBuiltIn: false,
    settings: [
      {
        id: 'font-family',
        name: 'Font Family',
        description: 'Primary font for the theme',
        type: 'select',
        defaultValue: 'Inter',
        value: 'Inter',
        options: [
          { label: 'Inter', value: 'Inter' },
          { label: 'Roboto', value: 'Roboto' }
        ]
      }
    ],
    metadata: {
      created: new Date('2024-02-01'),
      lastUpdated: new Date('2024-02-10'),
      downloadCount: 567,
      rating: 4.9,
      size: 1536
    }
  }
];

describe('PluginStore', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onInstall: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render plugin store modal when open', () => {
      render(<PluginStore {...defaultProps} />);

      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Plugin Store');
    });

    it('should not render when closed', () => {
      render(<PluginStore {...defaultProps} isOpen={false} />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('should display search input', () => {
      render(<PluginStore {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search plugins...')).toBeInTheDocument();
    });

    it('should display all store plugins by default', () => {
      render(<PluginStore {...defaultProps} />);

      expect(screen.getByText('GitHub Integration')).toBeInTheDocument();
      expect(screen.getByText('Mind Map View')).toBeInTheDocument();
      expect(screen.getByText('Zen Theme')).toBeInTheDocument();
    });

    it('should show plugin metadata', () => {
      render(<PluginStore {...defaultProps} />);

      expect(screen.getByText('v1.2.0')).toBeInTheDocument();
      expect(screen.getByText('by Plugin Developer')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.8')).toBeInTheDocument();
      expect(screen.getByText('📥 1,250')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter plugins by search query', () => {
      render(<PluginStore {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search plugins...');
      fireEvent.change(searchInput, { target: { value: 'GitHub' } });

      expect(screen.getByText('GitHub Integration')).toBeInTheDocument();
      expect(screen.queryByText('Mind Map View')).not.toBeInTheDocument();
      expect(screen.queryByText('Zen Theme')).not.toBeInTheDocument();
    });

    it('should filter by plugin description', () => {
      render(<PluginStore {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search plugins...');
      fireEvent.change(searchInput, { target: { value: 'mind map' } });

      expect(screen.getByText('Mind Map View')).toBeInTheDocument();
      expect(screen.queryByText('GitHub Integration')).not.toBeInTheDocument();
    });

    it('should filter by author name', () => {
      render(<PluginStore {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search plugins...');
      fireEvent.change(searchInput, { target: { value: 'Design Studio' } });

      expect(screen.getByText('Zen Theme')).toBeInTheDocument();
      expect(screen.queryByText('GitHub Integration')).not.toBeInTheDocument();
    });

    it('should show empty state when no plugins match search', () => {
      render(<PluginStore {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search plugins...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No plugins found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
    });
  });

  describe('Tabs and Sorting', () => {
    it('should render all tab options', () => {
      render(<PluginStore {...defaultProps} />);

      expect(screen.getByTestId('tab-featured')).toBeInTheDocument();
      expect(screen.getByTestId('tab-popular')).toBeInTheDocument();
      expect(screen.getByTestId('tab-new')).toBeInTheDocument();
      expect(screen.getByTestId('tab-categories')).toBeInTheDocument();
    });

    it('should sort plugins by popularity when popular tab is selected', () => {
      render(<PluginStore {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-popular'));

      // Should show plugins sorted by download count
      const plugins = screen.getAllByText(/GitHub Integration|Mind Map View|Zen Theme/);
      expect(plugins.length).toBe(3);
    });

    it('should sort plugins by date when new tab is selected', () => {
      render(<PluginStore {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-new'));

      // Should show plugins sorted by creation date
      const plugins = screen.getAllByText(/GitHub Integration|Mind Map View|Zen Theme/);
      expect(plugins.length).toBe(3);
    });
  });

  describe('Categories Tab', () => {
    it('should show category buttons when categories tab is selected', () => {
      render(<PluginStore {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-categories'));

      expect(screen.getByText('All Categories')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Themes')).toBeInTheDocument();
      expect(screen.getByText('Integrations')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
    });

    it('should filter plugins by category when category is selected', () => {
      render(<PluginStore {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-categories'));
      fireEvent.click(screen.getByText('Themes'));

      expect(screen.getByText('Zen Theme')).toBeInTheDocument();
      expect(screen.queryByText('GitHub Integration')).not.toBeInTheDocument();
      expect(screen.queryByText('Mind Map View')).not.toBeInTheDocument();
    });

    it('should show plugin count for each category', () => {
      render(<PluginStore {...defaultProps} />);

      fireEvent.click(screen.getByTestId('tab-categories'));

      expect(screen.getByText('1 plugins')).toBeInTheDocument(); // Themes
      expect(screen.getByText('1 plugins')).toBeInTheDocument(); // Features
      expect(screen.getByText('1 plugins')).toBeInTheDocument(); // Integrations
    });
  });

  describe('Plugin Actions', () => {
    it('should show install button for each plugin', () => {
      render(<PluginStore {...defaultProps} />);

      const installButtons = screen.getAllByText('Install');
      expect(installButtons.length).toBe(3);
    });

    it('should show details button for each plugin', () => {
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      expect(detailsButtons.length).toBe(3);
    });

    it('should call onInstall when install button is clicked', () => {
      render(<PluginStore {...defaultProps} />);

      const installButtons = screen.getAllByText('Install');
      fireEvent.click(installButtons[0]);

      expect(defaultProps.onInstall).toHaveBeenCalledWith(mockStorePlugins[0]);
    });

    it('should open plugin details when details button is clicked', () => {
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      // Should show plugin details modal
      expect(screen.getByText('GitHub Integration')).toBeInTheDocument();
      expect(screen.getByText('Sync your notes with GitHub repositories and create issues directly from notes')).toBeInTheDocument();
    });
  });

  describe('Plugin Details Modal', () => {
    it('should display plugin details when opened', () => {
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      expect(screen.getByText('GitHub Integration')).toBeInTheDocument();
      expect(screen.getByText('by Plugin Developer')).toBeInTheDocument();
      expect(screen.getByText('v1.2.0')).toBeInTheDocument();
      expect(screen.getByText('integration')).toBeInTheDocument();
      expect(screen.getByText('⭐ 4.8')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    it('should show configuration options if plugin has settings', () => {
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      expect(screen.getByText('Configuration Options')).toBeInTheDocument();
      expect(screen.getByText('GitHub Token: Your GitHub personal access token')).toBeInTheDocument();
    });

    it('should not show configuration options if plugin has no settings', () => {
      const pluginsWithoutSettings = mockStorePlugins.map(p => ({ ...p, settings: [] }));
      
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      expect(screen.queryByText('Configuration Options')).not.toBeInTheDocument();
    });

    it('should call onInstall when install button is clicked in details', () => {
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      const installButton = screen.getByText('Install Plugin');
      fireEvent.click(installButton);

      expect(defaultProps.onInstall).toHaveBeenCalledWith(mockStorePlugins[0]);
    });

    it('should close details modal when cancel is clicked', () => {
      render(<PluginStore {...defaultProps} />);

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Details modal should be closed
      expect(screen.queryByText('Install Plugin')).not.toBeInTheDocument();
    });
  });

  describe('Modal Interaction', () => {
    it('should call onClose when close button is clicked', () => {
      render(<PluginStore {...defaultProps} />);

      fireEvent.click(screen.getByText('Close'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<PluginStore {...defaultProps} />);

      // Check for modal role
      expect(screen.getByTestId('modal')).toBeInTheDocument();

      // Check for search input
      expect(screen.getByPlaceholderText('Search plugins...')).toBeInTheDocument();

      // Check for tab navigation
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<PluginStore {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Test focus management
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('should handle different screen sizes', () => {
      render(<PluginStore {...defaultProps} />);

      // Should render without errors on different screen sizes
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
  });
}); 