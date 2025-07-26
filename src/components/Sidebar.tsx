import React, { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useUIStore } from '../store/uiStore';
import { useNoteStore } from '../store/noteStore';
import VirtualizedNoteList from './VirtualizedNoteList';
import EnhancedSearch from './EnhancedSearch';
import { cn } from '../lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onToggle, 
  className = '' 
}) => {
  const { colors } = useThemeStore();
  const { viewMode, setViewMode } = useUIStore();
  const { notes, selectedId, selectNote, addNote } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');

  // Get all unique tags from notes
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [notes]);

  // Filter notes based on search and tag selection
  const filteredNotes = React.useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = !searchQuery || 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = selectedTag === 'all' || 
        note.tags?.includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectNote = (noteId: string) => {
    selectNote(noteId);
  };

  const handleViewModeChange = (mode: 'editor' | 'graph' | 'calendar') => {
    setViewMode(mode);
  };

  if (!isOpen) {
    return (
      <div className={cn(
        'fixed left-0 top-0 h-full w-12 bg-surface border-r border-border flex flex-col items-center pt-4',
        className
      )}>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-accent rounded-md transition-colors"
          title="Open sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className={cn(
      'w-64 h-full bg-surface border-r border-border flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              title="Close sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Note Count */}
        <div className="text-sm text-muted-foreground text-center mb-4">
          {searchQuery || selectedTag !== 'all' 
            ? `${filteredNotes.length} of ${notes.length} notes`
            : `${notes.length} note${notes.length !== 1 ? 's' : ''}`
          }
        </div>

        {/* Create Note Form */}
        <form onSubmit={handleCreateNote} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="New note title..."
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isCreating}
            />
            <button
              type="submit"
              disabled={!newNoteTitle.trim() || isCreating}
              className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? '...' : '+'}
            </button>
          </div>
        </form>

        {/* Search */}
        <div className="mb-4">
          <EnhancedSearch
            notes={notes}
            onSearch={handleSearch}
            onSelectNote={handleSelectNote}
            placeholder="Search notes..."
            className="w-full"
          />
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-1 bg-muted rounded-md p-1">
          {(['editor', 'graph', 'calendar'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className={cn(
                'flex-1 px-3 py-2 text-sm rounded-md transition-colors',
                viewMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Note List */}
      <div className="flex-1 overflow-hidden">
        <VirtualizedNoteList
          notes={filteredNotes}
          selectedId={selectedId}
          onSelectNote={handleSelectNote}
          height={400}
        />
      </div>
    </aside>
  );
};

export default Sidebar; 