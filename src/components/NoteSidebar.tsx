import React, { useState } from 'react';
import { useNoteStore } from '../store/noteStore';

const NoteSidebar: React.FC = () => {
  const { notes, selectedId, selectNote, addNote } = useNoteStore();
  const [newNoteTitle, setNewNoteTitle] = useState('');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteTitle.trim()) {
      addNote(newNoteTitle.trim());
      setNewNoteTitle('');
    }
  };

  return (
    <aside style={{ width: 240, borderRight: '1px solid #eee', padding: 16 }}>
      <h2>Notes</h2>
      
      <form onSubmit={handleCreateNote} style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
          placeholder="New note title..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '8px'
          }}
        />
        <button
          type="submit"
          disabled={!newNoteTitle.trim()}
          style={{
            width: '100%',
            padding: '8px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: newNoteTitle.trim() ? 'pointer' : 'not-allowed',
            opacity: newNoteTitle.trim() ? 1 : 0.6
          }}
        >
          Create Note
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {notes.map((note) => (
          <li key={note.id}>
            <button
              style={{
                background: note.id === selectedId ? '#f0f0f0' : 'transparent',
                border: 'none',
                textAlign: 'left',
                width: '100%',
                padding: 8,
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px'
              }}
              onClick={() => selectNote(note.id)}
            >
              <div style={{ fontWeight: 'bold' }}>{note.title}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default NoteSidebar; 