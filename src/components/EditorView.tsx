import React from 'react';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { MarkdownEditor, BacklinksPanel } from './notes';
import { ErrorBoundary } from './utils';
import { NoteIdProps } from '../types/domain';

const EditorView: React.FC<NoteIdProps> = ({ noteId }) => {
  const { getNote, updateNote } = useNoteStore();
  const { colors } = useThemeStore();
  
  const selectedNote = getNote(noteId);

  if (!selectedNote) {
    return (
      <div style={{ padding: 24, color: colors.textSecondary }}>
        Select a note
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <ErrorBoundary>
          <MarkdownEditor
            value={selectedNote.body}
            onChange={async (newBody) => {
              await updateNote(noteId, { body: newBody });
            }}
            noteId={noteId}
            autoSave={true}
          />
        </ErrorBoundary>
      </div>
      <ErrorBoundary>
        <BacklinksPanel currentNoteId={noteId} />
      </ErrorBoundary>
    </div>
  );
};

export default EditorView; 