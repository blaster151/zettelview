import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../store/noteStore';
import { Note } from '../types/domain';

interface ExportImportProps {
  onClose: () => void;
}

interface ExportData {
  version: string;
  exportedAt: string;
  notes: Note[];
}

const ExportImport: React.FC<ExportImportProps> = ({ onClose }) => {
  const { notes, addNote, updateNote } = useNoteStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());

  // Select all notes by default
  React.useEffect(() => {
    setSelectedNotes(new Set(notes.map(note => note.id)));
  }, [notes]);

  const handleSelectAll = useCallback(() => {
    setSelectedNotes(new Set(notes.map(note => note.id)));
  }, [notes]);

  const handleSelectNone = useCallback(() => {
    setSelectedNotes(new Set());
  }, []);

  const handleNoteToggle = useCallback((noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const exportToJSON = useCallback((selectedNotesData: typeof notes) => {
    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes: selectedNotesData.map(note => ({
        id: note.id,
        title: note.title,
        body: note.body,
        tags: note.tags,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zettelview-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const exportToCSV = useCallback((selectedNotesData: typeof notes) => {
    const csvContent = [
      ['Title', 'Body', 'Tags', 'Created', 'Updated'].join(','),
      ...selectedNotesData.map(note => [
        `"${note.title.replace(/"/g, '""')}"`,
        `"${note.body.replace(/"/g, '""')}"`,
        `"${note.tags.join('; ')}"`,
        note.createdAt.toISOString(),
        note.updatedAt.toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zettelview-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(async () => {
    if (selectedNotes.size === 0) {
      alert('Please select at least one note to export.');
      return;
    }

    setIsExporting(true);
    try {
      const selectedNotesData = notes.filter(note => selectedNotes.has(note.id));
      
      if (exportFormat === 'json') {
        exportToJSON(selectedNotesData);
      } else {
        exportToCSV(selectedNotesData);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [selectedNotes, notes, exportFormat, exportToJSON, exportToCSV]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      let importData: ExportData;

      if (file.name.endsWith('.json')) {
        importData = JSON.parse(text);
        
        if (!importData.notes || !Array.isArray(importData.notes)) {
          throw new Error('Invalid JSON format. Expected notes array.');
        }
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV format
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          throw new Error('Invalid CSV format. Expected header and data rows.');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const notes = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          return {
            id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: values[0]?.replace(/^"|"$/g, '') || 'Imported Note',
            body: values[1]?.replace(/^"|"$/g, '') || '',
            tags: values[2]?.replace(/^"|"$/g, '').split(';').map(t => t.trim()).filter(Boolean) || [],
            createdAt: new Date(values[3] || Date.now()).toISOString(),
            updatedAt: new Date(values[4] || Date.now()).toISOString(),
          };
        });

        importData = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          notes
        };
      } else {
        throw new Error('Unsupported file format. Please use .json or .csv files.');
      }

      // Import notes
      let importedCount = 0;
      let updatedCount = 0;

      for (const noteData of importData.notes) {
        const existingNote = notes.find(n => n.id === noteData.id);
        
        if (existingNote) {
          // Update existing note
          await updateNote(noteData.id, {
            title: noteData.title,
            body: noteData.body,
            tags: noteData.tags
          });
          updatedCount++;
        } else {
          // Add new note
          await addNote(noteData.title, {
            body: noteData.body,
            tags: noteData.tags,
            createdAt: new Date(noteData.createdAt),
            id: noteData.id
          });
          importedCount++;
        }
      }

      setImportSuccess(`Import completed: ${importedCount} new notes, ${updatedCount} updated notes.`);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  }, [notes, addNote, updateNote]);

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2>Export & Import Notes</h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
            aria-label="Close export/import dialog"
          >
            ×
          </button>
        )}
      </div>

      {/* Export Section */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Export Notes</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Export Format:
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="json">JSON (Full data with metadata)</option>
            <option value="csv">CSV (Simple table format)</option>
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Select All
            </button>
            <button
              onClick={handleSelectNone}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Select None
            </button>
          </div>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px'
          }}>
            {notes.map(note => (
              <label
                key={note.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 0',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedNotes.has(note.id)}
                  onChange={() => handleNoteToggle(note.id)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>{note.title}</span>
                {note.tags.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    marginLeft: '8px'
                  }}>
                    ({note.tags.slice(0, 2).join(', ')}{note.tags.length > 2 ? ` +${note.tags.length - 2}` : ''})
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || selectedNotes.size === 0}
          style={{
            background: selectedNotes.size === 0 ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: selectedNotes.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isExporting ? 'Exporting...' : `Export ${selectedNotes.size} Note${selectedNotes.size !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Import Section */}
      <div style={{
        background: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Import Notes</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            Import notes from a previously exported JSON or CSV file. 
            Existing notes with the same ID will be updated.
          </p>
          
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleImport}
            disabled={isImporting}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              width: '100%'
            }}
          />
        </div>

        {importError && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            <strong>Import Error:</strong> {importError}
          </div>
        )}

        {importSuccess && (
          <div style={{
            background: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '14px'
          }}>
            <strong>Success:</strong> {importSuccess}
          </div>
        )}

        {isImporting && (
          <div style={{
            background: '#d1ecf1',
            color: '#0c5460',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Importing notes...
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#e9ecef',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <strong>Total Notes:</strong> {notes.length}
          </div>
          <div>
            <strong>Total Tags:</strong> {new Set(notes.flatMap(note => note.tags)).size}
          </div>
          <div>
            <strong>Notes with Tags:</strong> {notes.filter(note => note.tags.length > 0).length}
          </div>
          <div>
            <strong>Total Content:</strong> {notes.reduce((sum, note) => sum + note.body.length, 0).toLocaleString()} characters
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImport; 