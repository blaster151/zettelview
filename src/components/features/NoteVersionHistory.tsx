import React, { useState, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';

interface NoteVersion {
  id: string;
  noteId: string;
  timestamp: Date;
  content: string;
  author: string;
}

const mockVersions: NoteVersion[] = [
  { id: 'v1', noteId: '1', timestamp: new Date(Date.now() - 1000 * 60 * 60), content: 'First version of note', author: 'Alice' },
  { id: 'v2', noteId: '1', timestamp: new Date(Date.now() - 1000 * 60 * 30), content: 'Second version of note', author: 'Bob' },
  { id: 'v3', noteId: '1', timestamp: new Date(), content: 'Current version of note', author: 'Alice' }
];

function diffStrings(a: string, b: string): string {
  // Simple diff: highlight changes
  if (a === b) return a;
  let result = '';
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  result += a.slice(0, i);
  if (a.slice(i)) result += `<del style="background:#ffe6e6;">${a.slice(i)}</del>`;
  if (b.slice(i)) result += `<ins style="background:#e6ffe6;">${b.slice(i)}</ins>`;
  return result;
}

const NoteVersionHistory: React.FC<{ noteId: string }> = ({ noteId }) => {
  const { notes, updateNote } = useNoteStore();
  const { colors } = useThemeStore();
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const versions = useMemo(() => mockVersions.filter(v => v.noteId === noteId), [noteId]);
  const currentNote = notes.find(n => n.id === noteId);

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 24,
      maxWidth: 700,
      margin: '40px auto',
      minHeight: 400
    }}>
      <h2 style={{ color: colors.text }}>Note Version History</h2>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ color: colors.text }}>Versions</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {versions.map(v => (
              <li key={v.id} style={{ marginBottom: 8 }}>
                <button onClick={() => setSelectedVersion(v)} style={{ background: selectedVersion?.id === v.id ? colors.primary : colors.surface, color: selectedVersion?.id === v.id ? 'white' : colors.text, border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                  {v.timestamp.toLocaleString()} by {v.author}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          <h4 style={{ color: colors.text }}>Diff Viewer</h4>
          {selectedVersion ? (
            <div style={{ background: colors.surface, borderRadius: 4, padding: 16, minHeight: 120 }}>
              <div dangerouslySetInnerHTML={{ __html: diffStrings(selectedVersion.content, currentNote?.body || '') }} />
              <button onClick={() => updateNote(noteId, { body: selectedVersion.content })} style={{ marginTop: 16, background: colors.primary, color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>Restore This Version</button>
            </div>
          ) : (
            <div style={{ color: colors.textSecondary }}>Select a version to view differences.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteVersionHistory; 