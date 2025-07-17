import React, { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import { useThemeStore } from '../../store/themeStore';
import { NoteTemplate } from '../../types/templates';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const { templatesByCategory } = useTemplates();
  const { colors } = useThemeStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'general', name: 'General', icon: '📝' },
    { id: 'project', name: 'Project', icon: '📋' },
    { id: 'meeting', name: 'Meeting', icon: '🤝' },
    { id: 'research', name: 'Research', icon: '🔬' },
    { id: 'personal', name: 'Personal', icon: '👤' },
    { id: 'custom', name: 'Custom', icon: '⚙️' }
  ];

  const filteredTemplates = templatesByCategory[selectedCategory as keyof typeof templatesByCategory] || [];
  const searchFilteredTemplates = filteredTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleTemplateSelect = (template: NoteTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            color: colors.text,
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            📋 Choose a Template
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Close template selector"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.border}`
        }}>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.background,
              color: colors.text,
              fontSize: '14px'
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{
          padding: '0 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                background: selectedCategory === category.id ? colors.primary : 'transparent',
                color: selectedCategory === category.id ? 'white' : colors.text,
                border: `1px solid ${selectedCategory === category.id ? colors.primary : colors.border}`,
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.background = colors.surfaceHover;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div style={{
          padding: '24px',
          overflow: 'auto',
          flex: 1
        }}>
          {searchFilteredTemplates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: colors.textSecondary
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ margin: '0 0 8px 0', color: colors.text }}>No Templates Found</h3>
              <p style={{ margin: 0 }}>
                {searchQuery ? 'Try a different search term.' : 'No templates in this category.'}
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              {searchFilteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  style={{
                    background: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{
                      color: colors.text,
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {template.name}
                    </h3>
                    {template.metadata.isDefault && (
                      <span style={{
                        background: colors.primary,
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        DEFAULT
                      </span>
                    )}
                  </div>
                  
                  <p style={{
                    color: colors.textSecondary,
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {template.description}
                  </p>
                  
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    {template.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          background: colors.surfaceHover,
                          color: colors.textSecondary,
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '11px'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span style={{
                        color: colors.textSecondary,
                        fontSize: '11px',
                        padding: '2px 6px'
                      }}>
                        +{template.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: colors.textSecondary
                  }}>
                    Used {template.metadata.usageCount} times
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TemplateSelector; 