import React, { useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Note } from '../types/domain';
import { useThemeStore } from '../store/themeStore';

interface VirtualizedNoteListProps {
  notes: Note[];
  selectedId: string | null;
  onSelectNote: (noteId: string) => void;
  height: number;
  itemHeight?: number;
}

interface NoteItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    notes: Note[];
    selectedId: string | null;
    onSelectNote: (noteId: string) => void;
    colors: any;
  };
}

const NoteItem: React.FC<NoteItemProps> = ({ index, style, data }) => {
  const { notes, selectedId, onSelectNote, colors } = data;
  const note = notes[index];

  const handleClick = useCallback(() => {
    onSelectNote(note.id);
  }, [note.id, onSelectNote]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (note.id !== selectedId) {
      e.currentTarget.style.background = colors.surfaceHover;
    }
  }, [note.id, selectedId, colors.surfaceHover]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (note.id !== selectedId) {
      e.currentTarget.style.background = 'transparent';
    }
  }, [note.id, selectedId]);

  return (
    <div style={style}>
      <button
        style={{
          background: note.id === selectedId ? colors.surfaceActive : 'transparent',
          border: 'none',
          textAlign: 'left',
          width: '100%',
          padding: '8px',
          cursor: 'pointer',
          borderRadius: '4px',
          marginBottom: '4px',
          color: colors.text,
          transition: 'all 0.2s ease',
          height: '100%',
          boxSizing: 'border-box'
        }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div style={{ fontWeight: 'bold', color: colors.text }}>{note.title}</div>
        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
          {new Date(note.updatedAt).toLocaleDateString()}
        </div>
        {note.tags.length > 0 && (
          <div style={{ fontSize: '11px', color: colors.primary, marginTop: '4px' }}>
            {note.tags.join(', ')}
          </div>
        )}
      </button>
    </div>
  );
};

const VirtualizedNoteList: React.FC<VirtualizedNoteListProps> = ({
  notes,
  selectedId,
  onSelectNote,
  height,
  itemHeight = 80
}) => {
  const { colors } = useThemeStore();

  const itemData = {
    notes,
    selectedId,
    onSelectNote,
    colors
  };

  return (
    <List
      height={height}
      itemCount={notes.length}
      itemSize={itemHeight}
      itemData={itemData}
      width="100%"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${colors.border} transparent`
      }}
    >
      {NoteItem}
    </List>
  );
};

export default VirtualizedNoteList; 