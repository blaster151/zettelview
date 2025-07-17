import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { SearchResult } from '../services/searchService';
import { useThemeStore } from '../store/themeStore';

interface VirtualizedSearchResultsProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelectResult: (result: SearchResult) => void;
  height: number;
  itemHeight?: number;
}

interface SearchResultItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    results: SearchResult[];
    selectedIndex: number;
    onSelectResult: (result: SearchResult) => void;
    colors: any;
  };
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ index, style, data }) => {
  const { results, selectedIndex, onSelectResult, colors } = data;
  const result = results[index];
  const isSelected = selectedIndex === index;

  const handleClick = useCallback(() => {
    onSelectResult(result);
  }, [result, onSelectResult]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = colors.surfaceHover;
  }, [colors.surfaceHover]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = isSelected ? colors.surfaceActive : 'transparent';
  }, [isSelected, colors.surfaceActive]);

  return (
    <div style={style}>
      <button
        style={{
          width: '100%',
          padding: '8px 12px',
          background: isSelected ? colors.surfaceActive : 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          color: colors.text,
          fontSize: '14px',
          borderBottom: `1px solid ${colors.border}`,
          transition: 'background 0.2s ease',
          height: '100%',
          boxSizing: 'border-box'
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          📝 {result.title}
        </div>
        {result.body && (
          <div style={{ 
            fontSize: '12px', 
            color: colors.textSecondary,
            marginBottom: '4px',
            lineHeight: '1.3'
          }}>
            {result.body.substring(0, 80)}...
          </div>
        )}
        {result.tags.length > 0 && (
          <div style={{ fontSize: '11px', color: colors.primary }}>
            🏷️ {result.tags.join(', ')}
          </div>
        )}
      </button>
    </div>
  );
};

const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  results,
  selectedIndex,
  onSelectResult,
  height,
  itemHeight = 100
}) => {
  const { colors } = useThemeStore();

  const itemData = {
    results,
    selectedIndex,
    onSelectResult,
    colors
  };

  return (
    <List
      height={height}
      itemCount={results.length}
      itemSize={itemHeight}
      itemData={itemData}
      width="100%"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.border} transparent`
      }}
    >
      {SearchResultItem}
    </List>
  );
};

export default VirtualizedSearchResults; 