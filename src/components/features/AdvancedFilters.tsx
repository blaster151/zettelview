import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import { Note } from '../../types/domain';

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AppliedFilters) => void;
  initialFilters?: Partial<AppliedFilters>;
}

export interface AppliedFilters {
  // Date filters
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  datePreset: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  
  // Content filters
  contentTypes: {
    hasLinks: boolean;
    hasTags: boolean;
    hasContent: boolean;
    hasAttachments: boolean;
    isArchived: boolean;
  };
  
  // Tag filters
  includeTags: string[];
  excludeTags: string[];
  tagLogic: 'any' | 'all' | 'none';
  
  // Text filters
  textFilters: Array<{
    field: 'title' | 'body' | 'tags' | 'all';
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'regex';
    value: string;
    caseSensitive: boolean;
  }>;
  
  // Size filters
  sizeRange: {
    minLength: number;
    maxLength: number;
  };
  
  // Sort options
  sortBy: 'relevance' | 'date' | 'title' | 'size' | 'tags';
  sortOrder: 'asc' | 'desc';
  
  // Result limits
  maxResults: number;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters
}) => {
  const { colors } = useThemeStore();
  const { notes } = useNoteStore();
  
  // Add refs for keyboard navigation
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  
  const [filters, setFilters] = useState<AppliedFilters>({
    dateRange: { start: null, end: null },
    datePreset: 'all',
    contentTypes: {
      hasLinks: false,
      hasTags: false,
      hasContent: false,
      hasAttachments: false,
      isArchived: false
    },
    includeTags: [],
    excludeTags: [],
    tagLogic: 'any',
    textFilters: [],
    sizeRange: { minLength: 0, maxLength: 0 },
    sortBy: 'relevance',
    sortOrder: 'desc',
    maxResults: 50
  });

  // Initialize with provided filters
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Handle date preset changes
  const handleDatePresetChange = useCallback((preset: AppliedFilters['datePreset']) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
    }

    setFilters(prev => ({
      ...prev,
      datePreset: preset,
      dateRange: { start, end }
    }));
  }, []);

  // Add text filter
  const addTextFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      textFilters: [...prev.textFilters, {
        field: 'all',
        operator: 'contains',
        value: '',
        caseSensitive: false
      }]
    }));
  }, []);

  // Update text filter
  const updateTextFilter = useCallback((index: number, updates: Partial<AppliedFilters['textFilters'][0]>) => {
    setFilters(prev => ({
      ...prev,
      textFilters: prev.textFilters.map((filter, i) => 
        i === index ? { ...filter, ...updates } : filter
      )
    }));
  }, []);

  // Remove text filter
  const removeTextFilter = useCallback((index: number) => {
    setFilters(prev => ({
      ...prev,
      textFilters: prev.textFilters.filter((_, i) => i !== index)
    }));
  }, []);

  // Toggle content type filter
  const toggleContentType = useCallback((type: keyof AppliedFilters['contentTypes']) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: {
        ...prev.contentTypes,
        [type]: !prev.contentTypes[type]
      }
    }));
  }, []);

  // Add tag to include/exclude
  const addTag = useCallback((tag: string, type: 'include' | 'exclude') => {
    setFilters(prev => ({
      ...prev,
      [type === 'include' ? 'includeTags' : 'excludeTags']: [
        ...prev[type === 'include' ? 'includeTags' : 'excludeTags'],
        tag
      ]
    }));
  }, []);

  // Remove tag from include/exclude
  const removeTag = useCallback((tag: string, type: 'include' | 'exclude') => {
    setFilters(prev => ({
      ...prev,
      [type === 'include' ? 'includeTags' : 'excludeTags']: 
        prev[type === 'include' ? 'includeTags' : 'excludeTags'].filter(t => t !== tag)
    }));
  }, []);

  // Apply filters
  const handleApply = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  // Reset filters
  const handleReset = useCallback(() => {
    setFilters({
      dateRange: { start: null, end: null },
      datePreset: 'all',
      contentTypes: {
        hasLinks: false,
        hasTags: false,
        hasContent: false,
        hasAttachments: false,
        isArchived: false
      },
      includeTags: [],
      excludeTags: [],
      tagLogic: 'any',
      textFilters: [],
      sizeRange: { minLength: 0, maxLength: 0 },
      sortBy: 'relevance',
      sortOrder: 'desc',
      maxResults: 50
    });
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
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
      case 'Enter':
        if (e.target === document.activeElement && (e.target as HTMLElement).tagName === 'BUTTON') {
          e.preventDefault();
          (e.target as HTMLButtonElement).click();
        }
        break;
    }
  }, [onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus first focusable element when modal opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

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
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="advanced-filters-title"
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
          id="advanced-filters-title"
          >
            🔍 Advanced Filters
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
            aria-label="Close advanced filters dialog"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}
        role="main"
        aria-labelledby="advanced-filters-title"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {/* Date Filters */}
            <div style={{
              background: colors.surface,
              padding: '16px',
              borderRadius: '6px'
            }}
            role="group"
            aria-labelledby="date-filters-label"
            >
              <h3 id="date-filters-label" style={{
                margin: '0 0 12px 0',
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📅 Date Range
              </h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="date-preset" style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: colors.textSecondary
                }}>
                  Quick Presets:
                </label>
                <select
                  id="date-preset"
                  value={filters.datePreset}
                  onChange={(e) => handleDatePresetChange(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    fontSize: '12px'
                  }}
                  aria-label="Select date range preset"
                  tabIndex={0}
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="quarter">Last 3 months</option>
                  <option value="year">Last year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {filters.datePreset === 'custom' && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="date"
                    id="date-start"
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value ? new Date(e.target.value) : null }
                    }))}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                    aria-label="Start date for custom date range"
                    tabIndex={0}
                  />
                  <span style={{ color: colors.textSecondary, fontSize: '12px' }}>to</span>
                  <input
                    type="date"
                    id="date-end"
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value ? new Date(e.target.value) : null }
                    }))}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                    aria-label="End date for custom date range"
                    tabIndex={0}
                  />
                </div>
              )}
            </div>

            {/* Content Type Filters */}
            <div style={{
              background: colors.surface,
              padding: '16px',
              borderRadius: '6px'
            }}
            role="group"
            aria-labelledby="content-filters-label"
            >
              <h3 id="content-filters-label" style={{
                margin: '0 0 12px 0',
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📄 Content Types
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              role="group"
              aria-label="Content type filter options"
              >
                {Object.entries({
                  hasLinks: '🔗 Has links',
                  hasTags: '🏷️ Has tags',
                  hasContent: '📝 Has content',
                  hasAttachments: '📎 Has attachments',
                  isArchived: '📦 Is archived'
                }).map(([key, label]) => (
                  <label key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: colors.text
                  }}>
                    <input
                      type="checkbox"
                      id={`content-${key}`}
                      checked={filters.contentTypes[key as keyof AppliedFilters['contentTypes']]}
                      onChange={() => toggleContentType(key as keyof AppliedFilters['contentTypes'])}
                      style={{ margin: 0 }}
                      aria-label={`Filter notes that ${label.toLowerCase()}`}
                      tabIndex={0}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Tag Filters */}
            <div style={{
              background: colors.surface,
              padding: '16px',
              borderRadius: '6px'
            }}
            role="group"
            aria-labelledby="tag-filters-label"
            >
              <h3 id="tag-filters-label" style={{
                margin: '0 0 12px 0',
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                🏷️ Tag Filters
              </h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="include-tags" style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: colors.textSecondary
                }}>
                  Include tags:
                </label>
                <select
                  id="include-tags"
                  onChange={(e) => {
                    if (e.target.value) {
                      addTag(e.target.value, 'include');
                      e.target.value = '';
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    fontSize: '12px'
                  }}
                  aria-label="Select tag to include in filter"
                  tabIndex={0}
                >
                  <option value="">Select tag to include...</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                {filters.includeTags.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}
                  role="list"
                  aria-label="Included tags"
                  >
                    {filters.includeTags.map(tag => (
                      <span
                        key={tag}
                        role="listitem"
                        style={{
                          background: colors.primary,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag, 'include')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '10px',
                            padding: 0
                          }}
                          aria-label={`Remove ${tag} from included tags`}
                          tabIndex={0}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="exclude-tags" style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: colors.textSecondary
                }}>
                  Exclude tags:
                </label>
                <select
                  id="exclude-tags"
                  onChange={(e) => {
                    if (e.target.value) {
                      addTag(e.target.value, 'exclude');
                      e.target.value = '';
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    fontSize: '12px'
                  }}
                  aria-label="Select tag to exclude from filter"
                  tabIndex={0}
                >
                  <option value="">Select tag to exclude...</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                {filters.excludeTags.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}
                  role="list"
                  aria-label="Excluded tags"
                  >
                    {filters.excludeTags.map(tag => (
                      <span
                        key={tag}
                        role="listitem"
                        style={{
                          background: colors.error,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag, 'exclude')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '10px',
                            padding: 0
                          }}
                          aria-label={`Remove ${tag} from excluded tags`}
                          tabIndex={0}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {filters.includeTags.length > 1 && (
                <div>
                  <label htmlFor="tag-logic" style={{
                    display: 'block',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: colors.textSecondary
                  }}>
                    Tag logic:
                  </label>
                  <select
                    id="tag-logic"
                    value={filters.tagLogic}
                    onChange={(e) => setFilters(prev => ({ ...prev, tagLogic: e.target.value as any }))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                    aria-label="Select tag logic for multiple included tags"
                    tabIndex={0}
                  >
                    <option value="any">Any tag (OR)</option>
                    <option value="all">All tags (AND)</option>
                    <option value="none">None of these tags</option>
                  </select>
                </div>
              )}
            </div>

            {/* Text Filters */}
            <div style={{
              background: colors.surface,
              padding: '16px',
              borderRadius: '6px'
            }}
            role="group"
            aria-labelledby="text-filters-label"
            >
              <h3 id="text-filters-label" style={{
                margin: '0 0 12px 0',
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                🔤 Text Filters
              </h3>
              
              {filters.textFilters.map((filter, index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  alignItems: 'center'
                }}
                role="group"
                aria-label={`Text filter ${index + 1}`}
                >
                  <select
                    value={filter.field}
                    onChange={(e) => updateTextFilter(index, { field: e.target.value as any })}
                    style={{
                      padding: '4px 6px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '11px'
                    }}
                    aria-label={`Field for text filter ${index + 1}`}
                    tabIndex={0}
                  >
                    <option value="all">All</option>
                    <option value="title">Title</option>
                    <option value="body">Body</option>
                    <option value="tags">Tags</option>
                  </select>
                  
                  <select
                    value={filter.operator}
                    onChange={(e) => updateTextFilter(index, { operator: e.target.value as any })}
                    style={{
                      padding: '4px 6px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '11px'
                    }}
                    aria-label={`Operator for text filter ${index + 1}`}
                    tabIndex={0}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="starts_with">Starts with</option>
                    <option value="ends_with">Ends with</option>
                    <option value="regex">Regex</option>
                  </select>
                  
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => updateTextFilter(index, { value: e.target.value })}
                    placeholder="Value..."
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '11px'
                    }}
                    aria-label={`Value for text filter ${index + 1}`}
                    tabIndex={0}
                  />
                  
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10px',
                    color: colors.textSecondary
                  }}>
                    <input
                      type="checkbox"
                      checked={filter.caseSensitive}
                      onChange={(e) => updateTextFilter(index, { caseSensitive: e.target.checked })}
                      style={{ margin: 0 }}
                      aria-label={`Case sensitive for text filter ${index + 1}`}
                      tabIndex={0}
                    />
                    CS
                  </label>
                  
                  <button
                    onClick={() => removeTextFilter(index)}
                    style={{
                      padding: '2px 4px',
                      background: colors.error,
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                    aria-label={`Remove text filter ${index + 1}`}
                    tabIndex={0}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                onClick={addTextFilter}
                style={{
                  padding: '6px 12px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
                aria-label="Add new text filter"
                tabIndex={0}
              >
                + Add Filter
              </button>
            </div>

            {/* Sort & Results */}
            <div style={{
              background: colors.surface,
              padding: '16px',
              borderRadius: '6px'
            }}
            role="group"
            aria-labelledby="sort-results-label"
            >
              <h3 id="sort-results-label" style={{
                margin: '0 0 12px 0',
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                📊 Sort & Results
              </h3>
              
              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="sort-by" style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: colors.textSecondary
                }}>
                  Sort by:
                </label>
                <select
                  id="sort-by"
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    fontSize: '12px'
                  }}
                  aria-label="Select sort field"
                  tabIndex={0}
                >
                  <option value="relevance">Relevance</option>
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="size">Size</option>
                  <option value="tags">Tags</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="sort-order" style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: colors.textSecondary
                }}>
                  Order:
                </label>
                <select
                  id="sort-order"
                  value={filters.sortOrder}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    fontSize: '12px'
                  }}
                  aria-label="Select sort order"
                  tabIndex={0}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div>
                <label htmlFor="max-results" style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '12px',
                  color: colors.textSecondary
                }}>
                  Max results:
                </label>
                <input
                  id="max-results"
                  type="number"
                  value={filters.maxResults}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxResults: parseInt(e.target.value) || 50 }))}
                  min="1"
                  max="1000"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    fontSize: '12px'
                  }}
                  aria-label="Maximum number of results to return"
                  tabIndex={0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        role="toolbar"
        aria-label="Advanced filters actions"
        >
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            aria-label="Reset all filters to default values"
            tabIndex={0}
          >
            Reset
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: colors.text,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              aria-label="Cancel and close advanced filters"
              tabIndex={0}
            >
              Cancel
            </button>
            <button
              ref={lastFocusableRef}
              onClick={handleApply}
              style={{
                padding: '8px 16px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
              aria-label="Apply current filters to search"
              tabIndex={0}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters; 