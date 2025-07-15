import React, { useState } from 'react';
import { useNoteStore } from '../store/noteStore';

const NoteSidebar: React.FC = () => {
  const { notes, selectedId, selectNote, addNote } = useNoteStore();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newNoteTitle.trim() && !isCreating) {
      setIsCreating(true);
      try {
        await addNote(newNoteTitle.trim());
        setNewNoteTitle('');
      } catch (error) {
        console.error('Failed to create note:', error);
      } finally {
        setIsCreating(false);
      }
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
          disabled={isCreating}
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
          disabled={!newNoteTitle.trim() || isCreating}
          style={{
            width: '100%',
            padding: '8px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: newNoteTitle.trim() && !isCreating ? 'pointer' : 'not-allowed',
            opacity: newNoteTitle.trim() && !isCreating ? 1 : 0.6
          }}
        >
          {isCreating ? 'Creating...' : 'Create Note'}
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