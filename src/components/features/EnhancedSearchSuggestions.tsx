import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import { SearchSuggestionsService, SearchSuggestion, SuggestionContext } from '../../services/searchSuggestionsService';
import { SearchHistory } from '../../services/searchService';

interface EnhancedSearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
  maxSuggestions?: number;
}

const EnhancedSearchSuggestions: React.FC<EnhancedSearchSuggestionsProps> = ({
  query,
  isVisible,
  onSuggestionSelect,
  onClose,
  maxSuggestions = 8
}) => {
  const { colors } = useThemeStore();
  const { notes } = useNoteStore();
  
  // Add refs for keyboard navigation
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize suggestions service
  useEffect(() => {
    SearchSuggestionsService.initialize(notes);
  }, [notes]);

  // Get suggestion context
  const getSuggestionContext = useCallback((): SuggestionContext => {
    const history = SearchHistory.getHistory();
    const recentQueries = history.slice(0, 5).map(item => item.query);
    const userHistory = history.slice(0, 10).map(item => item.query);
    
    // Get popular tags
    const tagFrequency = new Map<string, number>();
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });
    const popularTags = Array.from(tagFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      currentQuery: query,
      userHistory,
      recentSearches: recentQueries,
      popularTags,
      noteCount: notes.length
    };
  }, [query, notes]);

  // Load suggestions
  useEffect(() => {
    if (!isVisible || !query.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    
    // Debounce suggestions loading
    const timeoutId = setTimeout(() => {
      const context = getSuggestionContext();
      const newSuggestions = SearchSuggestionsService.getSuggestions(
        query,
        context,
        maxSuggestions
      );
      setSuggestions(newSuggestions);
      setSelectedIndex(-1);
      setIsLoading(false);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [query, isVisible, maxSuggestions, getSuggestionContext]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (suggestions.length > 0) {
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (suggestions.length > 0) {
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Tab':
        // Allow normal tab navigation
        onClose();
        break;
    }
  }, [suggestions, selectedIndex, onSuggestionSelect, onClose]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion);
  }, [onSuggestionSelect]);

  // Get suggestion icon based on type
  const getSuggestionIcon = (suggestion: SearchSuggestion): string => {
    switch (suggestion.type) {
      case 'title': return '📄';
      case 'tag': return '🏷️';
      case 'query': return '🔍';
      case 'concept': return '💡';
      case 'related': return '🔗';
      default: return '💭';
    }
  };

  // Get suggestion color based on source
  const getSuggestionColor = (suggestion: SearchSuggestion): string => {
    switch (suggestion.source) {
      case 'content': return colors.primary;
      case 'history': return colors.secondary;
      case 'tags': return colors.accent;
      case 'ai': return colors.warning;
      case 'popular': return colors.success;
      default: return colors.textSecondary;
    }
  };

  // Get suggestion description
  const getSuggestionDescription = (suggestion: SearchSuggestion): string => {
    switch (suggestion.type) {
      case 'title': return 'Note title';
      case 'tag': return `Tag (${suggestion.metadata?.frequency || 0} notes)`;
      case 'query': return 'Search query';
      case 'concept': return 'Related concept';
      case 'related': return 'Related to your search';
      default: return 'Suggestion';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={suggestionsRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        marginTop: '4px',
        maxHeight: '400px',
        overflow: 'hidden',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Search suggestions"
      tabIndex={0}
    >
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px solid ${colors.border}`,
        background: colors.surface,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: '12px',
          color: colors.textSecondary,
          fontWeight: 'bold'
        }}>
          💡 Smart Suggestions
        </span>
        {isLoading && (
          <span style={{
            fontSize: '11px',
            color: colors.textSecondary
          }}>
            Loading...
          </span>
        )}
      </div>

      {/* Suggestions List */}
      <div style={{
        maxHeight: '320px',
        overflow: 'auto'
      }}
      role="group"
      aria-label="Available suggestions"
      >
        {suggestions.length === 0 && !isLoading ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: colors.textSecondary,
            fontSize: '12px'
          }}
          role="status"
          aria-live="polite"
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
            <div>No suggestions found</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>
              Try typing more characters
            </div>
          </div>
        ) : (
          <div>
            {suggestions.map((suggestion, index) => {
              const isSelected = index === selectedIndex;
              const icon = getSuggestionIcon(suggestion);
              const color = getSuggestionColor(suggestion);
              const description = getSuggestionDescription(suggestion);
              
              return (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: isSelected ? colors.surfaceHover : 'transparent',
                    borderBottom: index < suggestions.length - 1 ? `1px solid ${colors.border}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.1s ease'
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onMouseLeave={() => setSelectedIndex(-1)}
                  role="option"
                  id={`suggestion-${index}`}
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  {/* Icon */}
                  <div style={{
                    fontSize: '16px',
                    width: '20px',
                    textAlign: 'center'
                  }}>
                    {icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      color: colors.text,
                      fontWeight: isSelected ? 'bold' : 'normal',
                      marginBottom: '2px'
                    }}>
                      {suggestion.text}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{description}</span>
                      <span style={{
                        color: color,
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {Math.round(suggestion.relevance * 100)}% match
                      </span>
                    </div>
                  </div>

                  {/* Source indicator */}
                  <div style={{
                    fontSize: '10px',
                    color: color,
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    background: `${color}20`,
                    borderRadius: '10px',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    {suggestion.source.toUpperCase()}
                  </div>

                  {/* Keyboard indicator */}
                  {isSelected && (
                    <div style={{
                      fontSize: '12px',
                      color: colors.textSecondary
                    }}>
                      ↵
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {suggestions.length > 0 && (
        <div style={{
          padding: '8px 12px',
          borderTop: `1px solid ${colors.border}`,
          background: colors.surface,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: colors.textSecondary
        }}
        role="contentinfo"
        >
          <span>
            {suggestions.length} suggestions
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchSuggestions; 