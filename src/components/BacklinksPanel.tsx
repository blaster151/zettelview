import React, { useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { NoteIdProps } from '../types/domain';
import VirtualizedBacklinksList from './VirtualizedBacklinksList';

const BacklinksPanel: React.FC<NoteIdProps> = ({ noteId }) => {
  const { notes, selectNote } = useNoteStore();

  // Find backlinks to the current note
  const backlinks = useMemo(() => {
    if (!noteId) return [];

    const currentNote = notes.find(note => note.id === noteId);
    if (!currentNote) return [];

    const links: Array<{
      noteId: string;
      noteTitle: string;
      context: string;
    }> = [];

    notes.forEach(note => {
      if (note.id === noteId) return; // Skip the current note

      // Check for internal links to the current note
      const internalLinkPattern = new RegExp(`\\[\\[([^\\]]*)\\]\\]`, 'g');
      let match;
      let contextStart = 0;

      while ((match = internalLinkPattern.exec(note.body)) !== null) {
        const linkText = match[1];
        const linkId = linkText.includes('|') ? linkText.split('|')[1] : linkText;
        
        if (linkId === currentNote.title || linkId === noteId) {
          // Extract context around the link
          const matchStart = Math.max(0, match.index - 50);
          const matchEnd = Math.min(note.body.length, match.index + match[0].length + 50);
          let context = note.body.substring(matchStart, matchEnd);
          
          // Clean up context
          if (matchStart > 0) context = '...' + context;
          if (matchEnd < note.body.length) context = context + '...';
          
          // Highlight the link in context
          context = context.replace(
            match[0],
            `**${match[0]}**`
          );

          links.push({
            noteId: note.id,
            noteTitle: note.title,
            context
          });
        }
      }
    });

    return links;
  }, [notes, noteId]);

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div style={{
      padding: '16px',
      borderTop: '1px solid #eee',
      backgroundColor: '#fafafa',
      height: '200px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px', 
        color: '#666',
        fontWeight: 'normal'
      }}>
        Backlinks ({backlinks.length})
      </h3>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <VirtualizedBacklinksList
          backlinks={backlinks}
          onSelectNote={selectNote}
          height={150}
          itemHeight={80}
        />
      </div>
    </div>
  );
};

export default BacklinksPanel; 