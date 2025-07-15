import React, { useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';

interface BacklinksPanelProps {
  currentNoteId: string;
}

const BacklinksPanel: React.FC<BacklinksPanelProps> = ({ currentNoteId }) => {
  const { notes, getNote, selectNote } = useNoteStore();

  // Find notes that link to the current note
  const backlinks = useMemo(() => {
    const currentNote = getNote(currentNoteId);
    if (!currentNote) return [];

    const links: Array<{ noteId: string; noteTitle: string; context: string }> = [];
    const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;

    notes.forEach(note => {
      if (note.id === currentNoteId) return; // Skip the current note

      let match;
      const matches: string[] = [];
      
      // Find all internal links in this note
      while ((match = internalLinkPattern.exec(note.body)) !== null) {
        matches.push(match[1].trim());
      }

      // Check if any of the links match the current note's title
      if (matches.some(linkTitle => 
        linkTitle.toLowerCase() === currentNote.title.toLowerCase()
      )) {
        // Find the context around the link (first occurrence)
        const firstMatchIndex = note.body.toLowerCase().indexOf(`[[${currentNote.title.toLowerCase()}]]`);
        if (firstMatchIndex !== -1) {
          const start = Math.max(0, firstMatchIndex - 50);
          const end = Math.min(note.body.length, firstMatchIndex + currentNote.title.length + 50);
          let context = note.body.slice(start, end);
          
          // Clean up context
          if (start > 0) context = '...' + context;
          if (end < note.body.length) context = context + '...';
          
          // Highlight the link in context
          context = context.replace(
            new RegExp(`\\[\\[${currentNote.title}\\]\\]`, 'gi'),
            '**$&**'
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
  }, [notes, currentNoteId, getNote]);

  if (backlinks.length === 0) {
    return (
      <div style={{
        padding: '16px',
        borderTop: '1px solid #eee',
        backgroundColor: '#fafafa'
      }}>
        <h3 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '14px', 
          color: '#666',
          fontWeight: 'normal'
        }}>
          Backlinks
        </h3>
        <div style={{ 
          fontSize: '12px', 
          color: '#999',
          fontStyle: 'italic'
        }}>
          No other notes link to this one yet.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      borderTop: '1px solid #eee',
      backgroundColor: '#fafafa',
      maxHeight: '200px',
      overflowY: 'auto'
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px', 
        color: '#666',
        fontWeight: 'normal'
      }}>
        Backlinks ({backlinks.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {backlinks.map((link) => (
          <div key={link.noteId} style={{
            padding: '8px',
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
          onClick={() => selectNote(link.noteId)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectNote(link.noteId);
            }
          }}
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
        ))}
      </div>
    </div>
  );
};

export default BacklinksPanel; 