import React, { useState, useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import EnhancedSearch from './EnhancedSearch';
import VirtualizedNoteList from './VirtualizedNoteList';

const NoteSidebar: React.FC = () => {
  const { notes, selectedId, selectNote, addNote } = useNoteStore();
  const { colors } = useThemeStore();
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectNote = (noteId: string) => {
    selectNote(noteId);
  };

  // Calculate available height for the note list
  const listHeight = Math.max(400, window.innerHeight - 300); // Minimum 400px, or viewport height minus header space

  return (
    <aside style={{ 
      width: 240, 
      borderRight: `1px solid ${colors.border}`, 
      padding: 16,
      background: colors.surface,
      color: colors.text,
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      <h2 style={{ color: colors.text, marginTop: 0 }}>Notes</h2>
      
      {/* Note Count Indicator */}
      <div style={{ 
        fontSize: '12px', color: colors.textSecondary, 
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        {searchQuery || selectedTag !== 'all' 
          ? `${filteredNotes.length} of ${notes.length} notes`
          : `${notes.length} note${notes.length !== 1 ? 's' : ''}`
        }
      </div>
      
      {/* Enhanced Search Input */}
      <div style={{ marginBottom: 16 }}>
        <EnhancedSearch
          notes={notes}
          onSearch={handleSearch}
          onSelectNote={handleSelectNote}
          placeholder="Search notes..."
        />
        
        {/* Tag Filter */}
        {allTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            style={{
              width: '100%',
              padding: '6px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              background: colors.background,
              color: colors.text,
              transition: 'all 0.2s ease',
              marginTop: '8px'
            }}
          >
            <option value="all">All tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        )}
      </div>

      {/* Create Note Form */}
      <form onSubmit={handleCreateNote} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="New note title..."
            style={{
              flex: 1,
              padding: '6px 8px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              fontSize: '14px',
              background: colors.background,
              color: colors.text
            }}
            disabled={isCreating}
          />
          <button
            type="submit"
            disabled={!newNoteTitle.trim() || isCreating}
            style={{
              padding: '6px 12px',
              background: newNoteTitle.trim() && !isCreating ? colors.primary : colors.border,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: newNoteTitle.trim() && !isCreating ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            {isCreating ? '...' : '+'}
          </button>
        </div>
      </form>

      {/* Virtualized Note List */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {filteredNotes.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: colors.textSecondary, 
            padding: '20px 0',
            fontSize: '14px'
          }}>
            {searchQuery || selectedTag !== 'all' 
              ? 'No notes found matching your search.' 
              : 'No notes yet. Create your first note!'}
          </div>
        ) : (
          <VirtualizedNoteList
            notes={filteredNotes}
            selectedId={selectedId}
            onSelectNote={handleSelectNote}
            height={listHeight}
            itemHeight={80}
          />
        )}
      </div>
    </aside>
  );
};

export default NoteSidebar; 