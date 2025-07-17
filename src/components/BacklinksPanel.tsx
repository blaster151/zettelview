import React, { useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { NoteIdProps } from '../types/domain';
import { useBacklinks } from '../hooks/useBacklinks';
import VirtualizedBacklinksList from './VirtualizedBacklinksList';

const BacklinksPanel: React.FC<NoteIdProps> = ({ noteId }) => {
  const { notes, selectNote } = useNoteStore();
  const { getBacklinks, getBacklinkAnalysis } = useBacklinks();

  // Get backlinks and analysis using the custom hook
  const backlinks = useMemo(() => {
    return getBacklinks(noteId, notes);
  }, [noteId, notes, getBacklinks]);

  const analysis = useMemo(() => {
    return getBacklinkAnalysis(noteId, notes);
  }, [noteId, notes, getBacklinkAnalysis]);

  if (!noteId) {
    return null;
  }

  return (
    <div style={{
      borderTop: '1px solid #e1e4e8',
      padding: '16px',
      background: '#f8f9fa'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#24292e'
        }}>
          Backlinks ({analysis.totalBacklinks})
        </h3>
        
        {analysis.totalBacklinks > 0 && (
          <div style={{
            fontSize: '12px',
            color: '#586069'
          }}>
            {analysis.uniqueSourceNotes} source{analysis.uniqueSourceNotes !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {backlinks.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#586069',
          fontSize: '14px',
          padding: '24px'
        }}>
          No backlinks found
        </div>
      ) : (
        <VirtualizedBacklinksList
          backlinks={backlinks}
          onSelectNote={selectNote}
          height={200}
        />
      )}
    </div>
  );
};

export default BacklinksPanel; 