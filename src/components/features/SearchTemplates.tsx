import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { SearchTemplates as SearchTemplatesService, SearchTemplate, SearchTemplateCategory, AppliedFilters } from '../../services/searchService';

interface SearchTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: SearchTemplate) => void;
  currentFilters?: AppliedFilters;
}

const SearchTemplates: React.FC<SearchTemplatesProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
  currentFilters
}) => {
  const { colors } = useThemeStore();
  
  // Add refs for keyboard navigation
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  
  const [templates, setTemplates] = useState<SearchTemplate[]>([]);
  const [categories, setCategories] = useState<SearchTemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'popular' | 'created'>('recent');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SearchTemplate | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  
  // Form state for creating/editing templates
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    query: '',
    category: 'general',
    filters: {
      datePreset: 'all' as const,
      dateRange: { start: null, end: null },
      contentTypes: {
        hasLinks: false,
        hasTags: false,
        hasContent: true,
        hasAttachments: false,
        isArchived: false
      },
      includeTags: [],
      excludeTags: [],
      tagLogic: 'any' as const,
      textFilters: [],
      sortBy: 'relevance' as const,
      sortOrder: 'desc' as const,
      maxResults: 50
    }
  });

  // Load templates and categories
  useEffect(() => {
    if (isOpen) {
      setTemplates(SearchTemplatesService.getTemplates());
      setCategories(SearchTemplatesService.getCategories());
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        if (showCreateForm || editingTemplate || showCategoryManager || showImportExport) {
          setShowCreateForm(false);
          setEditingTemplate(null);
          setShowCategoryManager(false);
          setShowImportExport(false);
        } else {
          onClose();
        }
        break;
      case 'Tab':
        // Trap focus within modal
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
        break;
    }
  }, [onClose, showCreateForm, editingTemplate, showCategoryManager, showImportExport]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search
    if (searchFilter) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        template.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        template.query.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }

    // Sort templates
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        filtered.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'created':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return filtered;
  }, [templates, selectedCategory, searchFilter, sortBy]);

  // Handle template application
  const handleApplyTemplate = useCallback((template: SearchTemplate) => {
    SearchTemplatesService.incrementUsage(template.id);
    onApplyTemplate(template);
    onClose();
  }, [onApplyTemplate, onClose]);

  // Handle template creation
  const handleCreateTemplate = useCallback(() => {
    if (!formData.name.trim()) return;

    const newTemplate = SearchTemplatesService.saveTemplate({
      name: formData.name,
      description: formData.description,
      query: formData.query,
      category: formData.category,
      filters: formData.filters
    });

    setTemplates(SearchTemplatesService.getTemplates());
    setShowCreateForm(false);
    setFormData({
      name: '',
      description: '',
      query: '',
      category: 'general',
      filters: {
        datePreset: 'all',
        dateRange: { start: null, end: null },
        contentTypes: {
          hasLinks: false,
          hasTags: false,
          hasContent: true,
          hasAttachments: false,
          isArchived: false
        },
        includeTags: [],
        excludeTags: [],
        tagLogic: 'any',
        textFilters: [],
        sortBy: 'relevance',
        sortOrder: 'desc',
        maxResults: 50
      }
    });
  }, [formData]);

  // Handle template editing
  const handleEditTemplate = useCallback(() => {
    if (!editingTemplate || !formData.name.trim()) return;

    SearchTemplatesService.updateTemplate(editingTemplate.id, {
      name: formData.name,
      description: formData.description,
      query: formData.query,
      category: formData.category,
      filters: formData.filters
    });

    setTemplates(SearchTemplatesService.getTemplates());
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      query: '',
      category: 'general',
      filters: {
        datePreset: 'all',
        dateRange: { start: null, end: null },
        contentTypes: {
          hasLinks: false,
          hasTags: false,
          hasContent: true,
          hasAttachments: false,
          isArchived: false
        },
        includeTags: [],
        excludeTags: [],
        tagLogic: 'any',
        textFilters: [],
        sortBy: 'relevance',
        sortOrder: 'desc',
        maxResults: 50
      }
    });
  }, [editingTemplate, formData]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback((template: SearchTemplate) => {
    if (window.confirm(`Delete template "${template.name}"?`)) {
      SearchTemplatesService.deleteTemplate(template.id);
      setTemplates(SearchTemplatesService.getTemplates());
    }
  }, []);

  // Handle template duplication
  const handleDuplicateTemplate = useCallback((template: SearchTemplate) => {
    const duplicated = SearchTemplatesService.duplicateTemplate(template.id);
    if (duplicated) {
      setTemplates(SearchTemplatesService.getTemplates());
    }
  }, []);

  // Handle save from current search
  const handleSaveFromCurrent = useCallback(() => {
    if (!currentFilters) return;
    
    setFormData(prev => ({
      ...prev,
      filters: currentFilters
    }));
    setShowCreateForm(true);
  }, [currentFilters]);

  // Handle import/export
  const handleExport = useCallback(() => {
    const data = SearchTemplatesService.exportTemplates();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search-templates.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = SearchTemplatesService.importTemplates(content);
      if (result.success) {
        setTemplates(SearchTemplatesService.getTemplates());
        setCategories(SearchTemplatesService.getCategories());
        alert('Templates imported successfully!');
      } else {
        alert(`Import failed: ${result.message}`);
      }
    };
    reader.readAsText(file);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}
    onClick={onClose}
    >
      <div
        ref={modalRef}
        style={{
          background: colors.background,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-templates-title"
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            color: colors.text,
            fontSize: '18px',
            fontWeight: 'bold'
          }}
          id="search-templates-title"
          >
            📋 Search Templates
          </h2>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '4px'
            }}
            aria-label="Close search templates dialog"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
        role="toolbar"
        aria-label="Template management controls"
        >
          <input
            type="text"
            placeholder="Search templates..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px',
              minWidth: '150px'
            }}
            aria-label="Filter templates by name or description"
            tabIndex={0}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px'
            }}
            aria-label="Filter templates by category"
            tabIndex={0}
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '12px'
            }}
            aria-label="Sort templates"
            tabIndex={0}
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="name">Name</option>
            <option value="created">Date Created</option>
          </select>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              aria-label="Import or export templates"
              tabIndex={0}
            >
              📁 Import/Export
            </button>
            
            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              aria-label="Manage template categories"
              tabIndex={0}
            >
              🏷️ Categories
            </button>
            
            <button
              onClick={handleSaveFromCurrent}
              disabled={!currentFilters}
              style={{
                padding: '6px 12px',
                background: currentFilters ? colors.primary : colors.border,
                color: currentFilters ? 'white' : colors.textSecondary,
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: currentFilters ? 'pointer' : 'not-allowed'
              }}
              aria-label="Save current search as template"
              tabIndex={0}
            >
              💾 Save Current
            </button>
            
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '6px 12px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              aria-label="Create new template"
              tabIndex={0}
            >
              ➕ New Template
            </button>
          </div>
        </div>

        {/* Import/Export Panel */}
        {showImportExport && (
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              📁 Import/Export Templates
            </h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleExport}
                style={{
                  padding: '6px 12px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                aria-label="Export all templates"
                tabIndex={0}
              >
                📤 Export
              </button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                id="import-templates"
              />
              <label
                htmlFor="import-templates"
                style={{
                  padding: '6px 12px',
                  background: colors.secondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                tabIndex={0}
              >
                📥 Import
              </label>
            </div>
          </div>
        )}

        {/* Category Manager */}
        {showCategoryManager && (
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🏷️ Manage Categories
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '8px'
            }}>
              {categories.map(category => (
                <div
                  key={category.id}
                  style={{
                    padding: '8px',
                    background: colors.background,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '12px', color: colors.text }}>
                    {category.icon} {category.name}
                  </span>
                  <span style={{ fontSize: '10px', color: colors.textSecondary }}>
                    {templates.filter(t => t.category === category.id).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingTemplate) && (
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.border}`,
            background: colors.surface
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {editingTemplate ? '✏️ Edit Template' : '➕ Create Template'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Template name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Template name"
                tabIndex={0}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Template description"
                tabIndex={0}
              />
              <input
                type="text"
                placeholder="Search query (optional)"
                value={formData.query}
                onChange={(e) => setFormData(prev => ({ ...prev, query: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Search query"
                tabIndex={0}
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  padding: '6px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                aria-label="Template category"
                tabIndex={0}
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={editingTemplate ? handleEditTemplate : handleCreateTemplate}
                  style={{
                    padding: '6px 12px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  aria-label={editingTemplate ? 'Save template changes' : 'Create template'}
                  tabIndex={0}
                >
                  {editingTemplate ? 'Save' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTemplate(null);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    color: colors.textSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  aria-label="Cancel template creation"
                  tabIndex={0}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 20px'
        }}
        role="main"
        aria-labelledby="search-templates-title"
        >
          {filteredTemplates.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: colors.textSecondary
            }}
            role="status"
            aria-live="polite"
            >
              {templates.length === 0 ? (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No templates yet</div>
                  <div style={{ fontSize: '12px' }}>Create your first search template</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No matching templates</div>
                  <div style={{ fontSize: '12px' }}>Try adjusting your filters</div>
                </>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px'
            }}
            role="list"
            aria-label="Search templates"
            >
              {filteredTemplates.map((template) => {
                const category = categories.find(cat => cat.id === template.category);
                return (
                  <div
                    key={template.id}
                    style={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                    role="listitem"
                    aria-label={`Template: ${template.name}`}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          margin: '0 0 4px 0',
                          color: colors.text,
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {template.name}
                        </h4>
                        {template.description && (
                          <p style={{
                            margin: '0 0 8px 0',
                            color: colors.textSecondary,
                            fontSize: '12px'
                          }}>
                            {template.description}
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11px',
                          color: colors.textSecondary
                        }}>
                          <span>{category?.icon} {category?.name}</span>
                          <span>•</span>
                          <span>Used {template.usageCount} times</span>
                          {template.lastUsed && (
                            <>
                              <span>•</span>
                              <span>Last used {new Date(template.lastUsed).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {template.isDefault && (
                        <span style={{
                          background: colors.primary,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '10px'
                        }}>
                          Default
                        </span>
                      )}
                    </div>

                    {template.query && (
                      <div style={{
                        padding: '6px 8px',
                        background: colors.background,
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: colors.textSecondary,
                        fontFamily: 'monospace'
                      }}>
                        Query: {template.query}
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        style={{
                          padding: '6px 12px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer'
                        }}
                        aria-label={`Apply template: ${template.name}`}
                        tabIndex={0}
                      >
                        Apply
                      </button>
                      
                      {!template.isDefault && (
                        <>
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setFormData({
                                name: template.name,
                                description: template.description,
                                query: template.query,
                                category: template.category,
                                filters: template.filters
                              });
                            }}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              color: colors.textSecondary,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            aria-label={`Edit template: ${template.name}`}
                            tabIndex={0}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              color: colors.textSecondary,
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            aria-label={`Duplicate template: ${template.name}`}
                            tabIndex={0}
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            style={{
                              padding: '6px 12px',
                              background: colors.error,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                            aria-label={`Delete template: ${template.name}`}
                            tabIndex={0}
                          >
                            Delete
                          </button>
                        </>
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
          padding: '12px 20px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: colors.textSecondary
        }}
        role="contentinfo"
        >
          <span>
            {filteredTemplates.length} of {templates.length} templates
          </span>
          <button
            ref={lastFocusableRef}
            onClick={() => {
              if (window.confirm('Reset all templates to defaults? This will remove all custom templates.')) {
                SearchTemplatesService.resetToDefaults();
                setTemplates(SearchTemplatesService.getTemplates());
                setCategories(SearchTemplatesService.getCategories());
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.error,
              fontSize: '12px'
            }}
            aria-label="Reset all templates to defaults"
            tabIndex={0}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchTemplates; 