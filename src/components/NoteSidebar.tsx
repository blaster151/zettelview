import React, { useState, useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';

const NoteSidebar: React.FC = () => {
  const { notes, selectedId, selectNote, addNote } = useNoteStore();
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

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

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter notes based on search query and selected tag
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = searchQuery === '' || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = selectedTag === 'all' || note.tags.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  return (
    <aside style={{ width: 240, borderRight: '1px solid #eee', padding: 16 }}>
      <h2>Notes</h2>
      
      {/* Search Input */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '8px'
          }}
        />
        
        {/* Tag Filter */}
        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="all">All tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>
      
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

      {filteredNotes.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          color: '#666', 
          padding: '20px 0',
          fontSize: '14px'
        }}>
          {searchQuery || selectedTag !== 'all' 
            ? 'No notes found matching your search.' 
            : 'No notes yet. Create your first note!'}
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredNotes.map((note) => (
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
                {note.tags.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                    {note.tags.slice(0, 2).join(', ')}
                    {note.tags.length > 2 && ` +${note.tags.length - 2}`}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

export default NoteSidebar; 