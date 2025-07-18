import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { SearchTemplates as SearchTemplatesService, SearchTemplate, SearchTemplateCategory } from '../../services/searchService';

interface SearchTemplatesButtonProps {
  onApplyTemplate: (template: SearchTemplate) => void;
  currentFilters?: any;
}

const SearchTemplatesButton: React.FC<SearchTemplatesButtonProps> = ({
  onApplyTemplate,
  currentFilters
}) => {
  const { colors } = useThemeStore();
  
  // Add refs for keyboard navigation
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<SearchTemplate[]>([]);
  const [categories, setCategories] = useState<SearchTemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Load templates and categories
  useEffect(() => {
    setTemplates(SearchTemplatesService.getTemplates());
    setCategories(SearchTemplatesService.getCategories());
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        const filteredTemplates = getFilteredTemplates();
        if (filteredTemplates.length > 0) {
          setSelectedIndex(prev => 
            prev < filteredTemplates.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        const templates = getFilteredTemplates();
        if (templates.length > 0) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : templates.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        const filtered = getFilteredTemplates();
        if (selectedIndex >= 0 && filtered[selectedIndex]) {
          handleApplyTemplate(filtered[selectedIndex]);
        }
        break;
      case 'Tab':
        if (e.shiftKey) {
          // Allow normal tab navigation when closing
          setIsOpen(false);
          setSelectedIndex(-1);
        } else {
          // Allow normal tab navigation when closing
          setIsOpen(false);
          setSelectedIndex(-1);
        }
        break;
    }
  }, [selectedIndex]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the search input when dropdown opens
      setTimeout(() => {
        const searchInput = dropdownRef.current?.querySelector('input');
        searchInput?.focus();
      }, 100);
    } else {
      setSelectedIndex(-1);
      setSearchFilter('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Get filtered templates
  const getFilteredTemplates = useCallback(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search
    if (searchFilter) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        template.description.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Sort by recent usage
    filtered.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));

    return filtered;
  }, [templates, selectedCategory, searchFilter]);

  const filteredTemplates = getFilteredTemplates();

  // Handle template application
  const handleApplyTemplate = useCallback((template: SearchTemplate) => {
    SearchTemplatesService.incrementUsage(template.id);
    onApplyTemplate(template);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onApplyTemplate]);

  // Handle save current as template
  const handleSaveCurrent = useCallback(() => {
    if (!currentFilters) return;
    
    const name = prompt('Enter template name:');
    if (!name?.trim()) return;

    const description = prompt('Enter template description (optional):') || '';
    const category = prompt('Enter category (general, work, personal, etc.):') || 'general';

    const newTemplate = SearchTemplatesService.saveTemplate({
      name: name.trim(),
      description: description.trim(),
      query: '',
      category: category.trim(),
      filters: currentFilters
    });

    setTemplates(SearchTemplatesService.getTemplates());
    alert(`Template "${name}" saved successfully!`);
  }, [currentFilters]);

  // Get popular templates for quick access
  const popularTemplates = useMemo(() => {
    return SearchTemplatesService.getPopularTemplates(3);
  }, [templates]);

  // Get recent templates for quick access
  const recentTemplates = useMemo(() => {
    return SearchTemplatesService.getRecentTemplates(3);
  }, [templates]);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '6px 8px',
          background: isOpen ? colors.primary : 'transparent',
          color: isOpen ? 'white' : colors.textSecondary,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        aria-label="Show search templates"
        aria-expanded={isOpen}
        aria-haspopup="true"
        tabIndex={0}
      >
        📋
        <span style={{ fontSize: '10px' }}>▼</span>
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            marginTop: '4px',
            minWidth: '300px',
            maxWidth: '400px',
            maxHeight: '500px',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
          onKeyDown={handleKeyDown}
          role="menu"
          aria-label="Search templates"
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{
                margin: 0,
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📋 Search Templates
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  fontSize: '12px'
                }}
                aria-label="Close templates dropdown"
                tabIndex={0}
              >
                ×
              </button>
            </div>

            {/* Search and filter */}
            <input
              type="text"
              placeholder="Search templates..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '6px'
              }}
              aria-label="Filter templates"
              tabIndex={0}
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 6px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '11px'
              }}
              aria-label="Filter by category"
              tabIndex={0}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Actions */}
          <div style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface
          }}>
            <div style={{
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleSaveCurrent}
                disabled={!currentFilters}
                style={{
                  padding: '4px 8px',
                  background: currentFilters ? colors.primary : colors.border,
                  color: currentFilters ? 'white' : colors.textSecondary,
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: currentFilters ? 'pointer' : 'not-allowed'
                }}
                aria-label="Save current search as template"
                tabIndex={0}
              >
                💾 Save Current
              </button>
              <button
                onClick={() => {
                  // This would open the full templates manager
                  alert('Full templates manager would open here');
                }}
                style={{
                  padding: '4px 8px',
                  background: 'transparent',
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
                aria-label="Open full templates manager"
                tabIndex={0}
              >
                ⚙️ Manage
              </button>
            </div>
          </div>

          {/* Templates List */}
          <div style={{
            maxHeight: '300px',
            overflow: 'auto'
          }}
          role="group"
          aria-label="Available templates"
          >
            {filteredTemplates.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: colors.textSecondary,
                fontSize: '12px'
              }}
              role="status"
              aria-live="polite"
              >
                {templates.length === 0 ? (
                  'No templates yet. Create your first template!'
                ) : (
                  'No matching templates found.'
                )}
              </div>
            ) : (
              <div>
                {/* Popular Templates Section */}
                {popularTemplates.length > 0 && !searchFilter && selectedCategory === 'all' && (
                  <div style={{ padding: '8px 16px' }}>
                    <div style={{
                      fontSize: '11px',
                      color: colors.textSecondary,
                      marginBottom: '6px',
                      fontWeight: 'bold'
                    }}>
                      🔥 Popular
                    </div>
                    {popularTemplates.map((template, index) => (
                      <div
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        style={{
                          padding: '6px 8px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: colors.text,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        onMouseLeave={() => setSelectedIndex(-1)}
                        role="menuitem"
                        aria-label={`Apply popular template: ${template.name}`}
                        tabIndex={0}
                      >
                        <span>{template.name}</span>
                        <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                          {template.usageCount} uses
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Templates Section */}
                {recentTemplates.length > 0 && !searchFilter && selectedCategory === 'all' && (
                  <div style={{ padding: '8px 16px' }}>
                    <div style={{
                      fontSize: '11px',
                      color: colors.textSecondary,
                      marginBottom: '6px',
                      fontWeight: 'bold'
                    }}>
                      ⏰ Recent
                    </div>
                    {recentTemplates.map((template, index) => (
                      <div
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        style={{
                          padding: '6px 8px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: colors.text,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={() => setSelectedIndex(popularTemplates.length + index)}
                        onMouseLeave={() => setSelectedIndex(-1)}
                        role="menuitem"
                        aria-label={`Apply recent template: ${template.name}`}
                        tabIndex={0}
                      >
                        <span>{template.name}</span>
                        <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                          {new Date(template.lastUsed || 0).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Templates */}
                {filteredTemplates.map((template, index) => {
                  const category = categories.find(cat => cat.id === template.category);
                  const isSelected = selectedIndex === index;
                  
                  return (
                    <div
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      style={{
                        padding: '8px 16px',
                        cursor: 'pointer',
                        background: isSelected ? colors.surfaceHover : 'transparent',
                        borderBottom: `1px solid ${colors.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onMouseLeave={() => setSelectedIndex(-1)}
                      role="menuitem"
                      aria-label={`Apply template: ${template.name}`}
                      tabIndex={0}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          fontSize: '12px',
                          color: colors.text,
                          fontWeight: 'bold'
                        }}>
                          {template.name}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          color: colors.textSecondary
                        }}>
                          {category?.icon} {category?.name}
                        </span>
                      </div>
                      {template.description && (
                        <div style={{
                          fontSize: '10px',
                          color: colors.textSecondary
                        }}>
                          {template.description}
                        </div>
                      )}
                      <div style={{
                        fontSize: '9px',
                        color: colors.textSecondary,
                        display: 'flex',
                        gap: '8px'
                      }}>
                        <span>Used {template.usageCount} times</span>
                        {template.lastUsed && (
                          <span>Last: {new Date(template.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px',
            borderTop: `1px solid ${colors.border}`,
            background: colors.surface,
            fontSize: '10px',
            color: colors.textSecondary,
            textAlign: 'center'
          }}>
            {filteredTemplates.length} of {templates.length} templates
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTemplatesButton; 