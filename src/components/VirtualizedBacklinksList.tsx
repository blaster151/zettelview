import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Backlink } from '../types/domain';
import { useThemeStore } from '../store/themeStore';

interface VirtualizedBacklinksListProps {
  backlinks: Backlink[];
  onSelectNote: (noteId: string) => void;
  height: number;
  itemHeight?: number;
}

interface BacklinkItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    backlinks: Backlink[];
    onSelectNote: (noteId: string) => void;
    colors: any;
  };
}

const BacklinkItem: React.FC<BacklinkItemProps> = ({ index, style, data }) => {
  const { backlinks, onSelectNote, colors } = data;
  const link = backlinks[index];

  const handleClick = useCallback(() => {
    onSelectNote(link.noteId);
  }, [link.noteId, onSelectNote]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectNote(link.noteId);
    }
  }, [link.noteId, onSelectNote]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = '#f5f5f5';
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = 'white';
  }, []);

  return (
    <div style={style}>
      <div
        style={{
          padding: '8px',
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          height: '100%',
          boxSizing: 'border-box',
          marginBottom: '8px'
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label={`Navigate to note: ${link.noteTitle}`}
      >
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '13px',
          color: '#007bff',
          marginBottom: '4px'
        }}>
          {link.noteTitle}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: '#666',
          lineHeight: '1.3',
          fontFamily: 'monospace'
        }}>
          {link.context}
        </div>
      </div>
    </div>
  );
};

const VirtualizedBacklinksList: React.FC<VirtualizedBacklinksListProps> = ({
  backlinks,
  onSelectNote,
  height,
  itemHeight = 80
}) => {
  const { colors } = useThemeStore();

  const itemData = {
    backlinks,
    onSelectNote,
    colors
  };

  return (
    <List
      height={height}
      itemCount={backlinks.length}
      itemSize={itemHeight}
      itemData={itemData}
      width="100%"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.border} transparent`
      }}
    >
      {BacklinkItem}
    </List>
  );
};

export default VirtualizedBacklinksList; 