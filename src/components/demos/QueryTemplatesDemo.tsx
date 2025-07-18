import React, { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import EnhancedSearch from '../features/EnhancedSearch';
import SearchTemplates from '../features/SearchTemplates';
import { SearchTemplate, AppliedFilters } from '../../services/searchService';

const QueryTemplatesDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<AppliedFilters | null>(null);

  const handleSearch = (query: string) => {
    setSearchResults([`Search result for: "${query}"`]);
  };

  const handleApplyTemplate = (template: SearchTemplate) => {
    setSearchResults([`Applied template: "${template.name}" with query: "${template.query}"`]);
    setCurrentFilters(template.filters);
  };

  const templateExamples = [
    {
      name: 'Recent Notes',
      description: 'Find notes created in the last 7 days',
      category: 'General',
      icon: '📅',
      filters: {
        datePreset: 'week',
        contentTypes: { hasContent: true, hasLinks: false, hasTags: false, hasAttachments: false, isArchived: false },
        sortBy: 'date',
        sortOrder: 'desc'
      }
    },
    {
      name: 'Tagged Notes',
      description: 'Find notes that have tags',
      category: 'General',
      icon: '🏷️',
      filters: {
        datePreset: 'all',
        contentTypes: { hasTags: true, hasContent: false, hasLinks: false, hasAttachments: false, isArchived: false },
        sortBy: 'date',
        sortOrder: 'desc'
      }
    },
    {
      name: 'Linked Notes',
      description: 'Find notes that contain links',
      category: 'General',
      icon: '🔗',
      filters: {
        datePreset: 'all',
        contentTypes: { hasLinks: true, hasContent: false, hasTags: false, hasAttachments: false, isArchived: false },
        sortBy: 'date',
        sortOrder: 'desc'
      }
    },
    {
      name: 'Work Projects',
      description: 'Find work-related project notes',
      category: 'Work',
      icon: '💼',
      filters: {
        datePreset: 'all',
        includeTags: ['work', 'project'],
        tagLogic: 'any',
        contentTypes: { hasContent: true, hasLinks: false, hasTags: false, hasAttachments: false, isArchived: false },
        sortBy: 'date',
        sortOrder: 'desc'
      }
    },
    {
      name: 'Research Notes',
      description: 'Find research and study materials',
      category: 'Research',
      icon: '📚',
      filters: {
        datePreset: 'all',
        includeTags: ['research', 'study', 'learning'],
        tagLogic: 'any',
        contentTypes: { hasContent: true, hasLinks: false, hasTags: false, hasAttachments: false, isArchived: false },
        sortBy: 'relevance',
        sortOrder: 'desc'
      }
    },
    {
      name: 'Archived Notes',
      description: 'Find archived notes',
      category: 'General',
      icon: '📦',
      filters: {
        datePreset: 'all',
        contentTypes: { isArchived: true, hasContent: false, hasLinks: false, hasTags: false, hasAttachments: false },
        sortBy: 'date',
        sortOrder: 'desc'
      }
    }
  ];

  const features = [
    '📋 Save and reuse complex search queries',
    '🏷️ Organize templates by categories',
    '⚡ Quick access to popular templates',
    '🔄 Save current search as template',
    '📊 Track template usage statistics',
    '📤 Import/export template collections',
    '✏️ Edit and customize existing templates',
    '🎯 Apply templates with one click'
  ];

  const benefits = [
    'Save time on repetitive searches',
    'Standardize search patterns across team',
    'Share search strategies with others',
    'Maintain consistent search workflows',
    'Quick access to common search scenarios',
    'Reduce search query errors'
  ];

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      color: colors.text
    }}>
      <h1 style={{
        color: colors.text,
        fontSize: '24px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        📋 Query Templates Demo
      </h1>

      {/* Overview */}
      <div style={{
        background: colors.surface,
        padding: '24px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        marginBottom: '24px'
      }}>
        <h2 style={{
          color: colors.text,
          fontSize: '20px',
          marginBottom: '16px'
        }}>
          🔍 What are Query Templates?
        </h2>
        <p style={{
          color: colors.textSecondary,
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: '16px'
        }}>
          Query Templates allow you to save and reuse complex search configurations, including 
          search queries, filters, date ranges, and sorting preferences. This makes it easy to 
          perform common searches without recreating the same parameters each time.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
              ✨ Key Features
            </h3>
            <ul style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
              {features.map((feature, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{feature}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
              🎯 Benefits
            </h3>
            <ul style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
              {benefits.map((benefit, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{benefit}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div style={{
        background: colors.surface,
        padding: '24px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        marginBottom: '24px'
      }}>
        <h2 style={{
          color: colors.text,
          fontSize: '20px',
          marginBottom: '16px'
        }}>
          🎮 Interactive Demo
        </h2>
        <p style={{
          color: colors.textSecondary,
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          Try the enhanced search below. Click the 📋 button to access templates, or use the 
          advanced filters to create a complex search, then save it as a template.
        </p>
        
        <EnhancedSearch
          onSearch={handleSearch}
          placeholder="Try searching with templates..."
          className="demo-search"
        />

        {searchResults.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: colors.background,
            borderRadius: '6px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{
              color: colors.text,
              fontSize: '16px',
              marginBottom: '12px'
            }}>
              Search Results:
            </h3>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              color: colors.textSecondary
            }}>
              {searchResults.map((result, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {result}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setShowTemplatesManager(true)}
            style={{
              padding: '8px 16px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            aria-label="Open full templates manager"
            tabIndex={0}
          >
            📋 Open Templates Manager
          </button>
          
          <button
            onClick={() => {
              // Simulate applying a template
              const template = {
                name: 'Demo Template',
                query: 'demo search',
                filters: {
                  datePreset: 'week',
                  contentTypes: { hasContent: true, hasLinks: false, hasTags: false, hasAttachments: false, isArchived: false },
                  sortBy: 'date',
                  sortOrder: 'desc'
                }
              } as SearchTemplate;
              handleApplyTemplate(template);
            }}
            style={{
              padding: '8px 16px',
              background: colors.secondary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
            aria-label="Apply demo template"
            tabIndex={0}
          >
            🎯 Apply Demo Template
          </button>
        </div>
      </div>

      {/* Template Examples */}
      <div style={{
        background: colors.surface,
        padding: '24px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        marginBottom: '24px'
      }}>
        <h2 style={{
          color: colors.text,
          fontSize: '20px',
          marginBottom: '16px'
        }}>
          📝 Template Examples
        </h2>
        <p style={{
          color: colors.textSecondary,
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          Here are some example templates you can create to get started:
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {templateExamples.map((example, index) => (
            <div
              key={index}
              style={{
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>{example.icon}</span>
                <div>
                  <h4 style={{
                    margin: 0,
                    color: colors.text,
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {example.name}
                  </h4>
                  <span style={{
                    fontSize: '11px',
                    color: colors.textSecondary
                  }}>
                    {example.category}
                  </span>
                </div>
              </div>
              
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: colors.textSecondary,
                lineHeight: '1.4'
              }}>
                {example.description}
              </p>
              
              <div style={{
                fontSize: '10px',
                color: colors.textSecondary,
                background: colors.surface,
                padding: '4px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}>
                Filters: {Object.keys(example.filters).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Guide */}
      <div style={{
        background: colors.surface,
        padding: '24px',
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <h2 style={{
          color: colors.text,
          fontSize: '20px',
          marginBottom: '16px'
        }}>
          📖 How to Use Templates
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
              🎯 Applying Templates
            </h3>
            <ol style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
              <li>Click the 📋 button in the search bar</li>
              <li>Browse available templates by category</li>
              <li>Click on a template to apply it</li>
              <li>The search will execute with template settings</li>
            </ol>
          </div>
          
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
              💾 Creating Templates
            </h3>
            <ol style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
              <li>Set up your search with filters and query</li>
              <li>Click "Save Current" in the templates dropdown</li>
              <li>Enter a name and description</li>
              <li>Choose a category for organization</li>
            </ol>
          </div>
          
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.text }}>
              ⚙️ Managing Templates
            </h3>
            <ol style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px' }}>
              <li>Open the full Templates Manager</li>
              <li>Edit, duplicate, or delete templates</li>
              <li>Organize templates by categories</li>
              <li>Import/export template collections</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Templates Manager Modal */}
      {showTemplatesManager && (
        <SearchTemplates
          isOpen={showTemplatesManager}
          onClose={() => setShowTemplatesManager(false)}
          onApplyTemplate={handleApplyTemplate}
          currentFilters={currentFilters || undefined}
        />
      )}
    </div>
  );
};

export default QueryTemplatesDemo; 