import React, { useState, useEffect } from 'react';
import { Plugin } from '../../types/plugins';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { Tabs, Tab } from '../ui/Tabs';

interface PluginStoreProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall?: (plugin: Plugin) => void;
}

// Mock plugin store data
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
      },
      {
        id: 'default-repo',
        name: 'Default Repository',
        description: 'Default repository for creating issues',
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
      },
      {
        id: 'node-size',
        name: 'Node Size',
        description: 'Default size for mind map nodes',
        type: 'select',
        defaultValue: 'medium',
        value: 'medium',
        options: [
          { label: 'Small', value: 'small' },
          { label: 'Medium', value: 'medium' },
          { label: 'Large', value: 'large' }
        ]
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
          { label: 'Roboto', value: 'Roboto' },
          { label: 'Open Sans', value: 'Open Sans' }
        ]
      },
      {
        id: 'accent-color',
        name: 'Accent Color',
        description: 'Primary accent color',
        type: 'color',
        defaultValue: '#6366f1',
        value: '#6366f1'
      }
    ],
    metadata: {
      created: new Date('2024-02-01'),
      lastUpdated: new Date('2024-02-10'),
      downloadCount: 567,
      rating: 4.9,
      size: 1536
    }
  },
  {
    id: 'latex-support',
    name: 'LaTeX Support',
    description: 'Render mathematical equations and formulas using LaTeX syntax',
    version: '1.5.0',
    author: 'Math Labs',
    category: 'feature',
    isEnabled: false,
    isBuiltIn: false,
    settings: [
      {
        id: 'render-mode',
        name: 'Render Mode',
        description: 'How to render LaTeX equations',
        type: 'select',
        defaultValue: 'inline',
        value: 'inline',
        options: [
          { label: 'Inline', value: 'inline' },
          { label: 'Block', value: 'block' },
          { label: 'Auto', value: 'auto' }
        ]
      }
    ],
    metadata: {
      created: new Date('2024-01-20'),
      lastUpdated: new Date('2024-02-18'),
      downloadCount: 432,
      rating: 4.7,
      size: 4096
    }
  },
  {
    id: 'export-pdf',
    name: 'PDF Export',
    description: 'Export your notes as beautifully formatted PDF documents',
    version: '1.3.0',
    author: 'Export Pro',
    category: 'utility',
    isEnabled: false,
    isBuiltIn: false,
    settings: [
      {
        id: 'page-size',
        name: 'Page Size',
        description: 'PDF page size',
        type: 'select',
        defaultValue: 'a4',
        value: 'a4',
        options: [
          { label: 'A4', value: 'a4' },
          { label: 'Letter', value: 'letter' },
          { label: 'Legal', value: 'legal' }
        ]
      },
      {
        id: 'include-toc',
        name: 'Include Table of Contents',
        description: 'Add table of contents to PDF',
        type: 'boolean',
        defaultValue: true,
        value: true
      }
    ],
    metadata: {
      created: new Date('2024-01-25'),
      lastUpdated: new Date('2024-02-12'),
      downloadCount: 789,
      rating: 4.5,
      size: 2560
    }
  }
];

export function PluginStore({ isOpen, onClose, onInstall }: PluginStoreProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'featured' | 'popular' | 'new' | 'categories'>('featured');
  const [selectedCategory, setSelectedCategory] = useState<Plugin['category'] | 'all'>('all');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>(mockStorePlugins);

  useEffect(() => {
    let filtered = mockStorePlugins;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(plugin =>
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(plugin => plugin.category === selectedCategory);
    }

    // Sort by tab
    switch (activeTab) {
      case 'popular':
        filtered.sort((a, b) => b.metadata.downloadCount - a.metadata.downloadCount);
        break;
      case 'new':
        filtered.sort((a, b) => new Date(b.metadata.created).getTime() - new Date(a.metadata.created).getTime());
        break;
      default:
        // Featured: sort by rating and downloads
        filtered.sort((a, b) => {
          const scoreA = (a.metadata.rating * 0.7) + (a.metadata.downloadCount / 1000 * 0.3);
          const scoreB = (b.metadata.rating * 0.7) + (b.metadata.downloadCount / 1000 * 0.3);
          return scoreB - scoreA;
        });
    }

    setFilteredPlugins(filtered);
  }, [searchQuery, activeTab, selectedCategory]);

  const handleInstall = (plugin: Plugin) => {
    if (onInstall) {
      onInstall(plugin);
    } else {
      // Mock installation
      console.log(`Installing plugin: ${plugin.name}`);
      setSelectedPlugin(null);
    }
  };

  const getCategoryIcon = (category: Plugin['category']) => {
    switch (category) {
      case 'theme':
        return '🎨';
      case 'feature':
        return '⚡';
      case 'integration':
        return '🔗';
      case 'utility':
        return '🛠️';
      default:
        return '📦';
    }
  };

  const getCategoryColor = (category: Plugin['category']) => {
    switch (category) {
      case 'theme':
        return 'purple';
      case 'feature':
        return 'blue';
      case 'integration':
        return 'green';
      case 'utility':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories', count: mockStorePlugins.length },
    { id: 'feature', name: 'Features', count: mockStorePlugins.filter(p => p.category === 'feature').length },
    { id: 'theme', name: 'Themes', count: mockStorePlugins.filter(p => p.category === 'theme').length },
    { id: 'integration', name: 'Integrations', count: mockStorePlugins.filter(p => p.category === 'integration').length },
    { id: 'utility', name: 'Utilities', count: mockStorePlugins.filter(p => p.category === 'utility').length }
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Plugin Store" size="large">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search plugins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Icon name="search" className="w-4 h-4" />}
              />
            </div>
          </div>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tab value="featured" label="Featured" />
            <Tab value="popular" label="Popular" />
            <Tab value="new" label="New" />
            <Tab value="categories" label="Categories" />
          </Tabs>

          {activeTab === 'categories' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {getCategoryIcon(category.id as Plugin['category'])}
                    </div>
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-sm text-gray-500">{category.count} plugins</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4">
            {filteredPlugins.map((plugin) => (
              <div
                key={plugin.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(plugin.category)}</span>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">{plugin.name}</h3>
                          <Badge color={getCategoryColor(plugin.category)}>
                            {plugin.category}
                          </Badge>
                          <Badge color="green">v{plugin.version}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{plugin.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>by {plugin.author}</span>
                          <span>⭐ {plugin.metadata.rating}</span>
                          <span>📥 {plugin.metadata.downloadCount.toLocaleString()}</span>
                          <span>📅 {new Date(plugin.metadata.lastUpdated).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPlugin(plugin)}
                    >
                      Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleInstall(plugin)}
                    >
                      Install
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlugins.length === 0 && (
            <div className="text-center py-8">
              <Icon name="package" className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No plugins found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {selectedPlugin && (
        <PluginDetails
          plugin={selectedPlugin}
          isOpen={!!selectedPlugin}
          onClose={() => setSelectedPlugin(null)}
          onInstall={() => handleInstall(selectedPlugin)}
        />
      )}
    </>
  );
}

interface PluginDetailsProps {
  plugin: Plugin;
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

function PluginDetails({ plugin, isOpen, onClose, onInstall }: PluginDetailsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={plugin.name} size="medium">
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">
            {plugin.category === 'theme' ? '🎨' : 
             plugin.category === 'feature' ? '⚡' :
             plugin.category === 'integration' ? '🔗' : '🛠️'}
          </span>
          <div>
            <h2 className="text-xl font-semibold">{plugin.name}</h2>
            <p className="text-sm text-gray-500">by {plugin.author}</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">{plugin.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Version:</span> {plugin.version}
            </div>
            <div>
              <span className="font-medium">Category:</span> {plugin.category}
            </div>
            <div>
              <span className="font-medium">Rating:</span> ⭐ {plugin.metadata.rating}
            </div>
            <div>
              <span className="font-medium">Downloads:</span> {plugin.metadata.downloadCount.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Size:</span> {(plugin.metadata.size / 1024).toFixed(1)} KB
            </div>
            <div>
              <span className="font-medium">Updated:</span> {new Date(plugin.metadata.lastUpdated).toLocaleDateString()}
            </div>
          </div>

          {plugin.settings && plugin.settings.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Configuration Options</h3>
              <div className="space-y-2">
                {plugin.settings.map((setting) => (
                  <div key={setting.id} className="text-sm">
                    <span className="font-medium">{setting.name}:</span> {setting.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onInstall}>
            Install Plugin
          </Button>
        </div>
      </div>
    </Modal>
  );
} 