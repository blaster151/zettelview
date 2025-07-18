import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { Note } from '../../types/domain';
import { loggingService } from '../../services/loggingService';

interface ExportImportProps {
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'markdown' | 'csv' | 'pdf' | 'html';
type ImportFormat = 'json' | 'markdown';

interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeTags: boolean;
  includeTimestamps: boolean;
  compress: boolean;
  selectedNotes?: string[];
}

interface ImportOptions {
  format: ImportFormat;
  mergeStrategy: 'replace' | 'merge' | 'skip-duplicates';
  validateData: boolean;
}

const ExportImport: React.FC<ExportImportProps> = ({ isOpen, onClose }) => {
  const { notes, addNote, updateNote } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeTags: true,
    includeTimestamps: true,
    compress: false
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    mergeStrategy: 'merge',
    validateData: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Memoized export data
  const exportData = useMemo(() => {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      noteCount: notes.length,
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        body: note.body,
        tags: exportOptions.includeTags ? note.tags : [],
        createdAt: exportOptions.includeTimestamps ? note.createdAt : undefined,
        updatedAt: exportOptions.includeTimestamps ? note.updatedAt : undefined,
        metadata: exportOptions.includeMetadata ? {
          wordCount: note.body.split(/\s+/).length,
          characterCount: note.body.length,
          tagCount: note.tags.length,
          hasLinks: /\[\[([^[\]]+)\]\]/g.test(note.body)
        } : undefined
      }))
    };
    return data;
  }, [notes, exportOptions]);

  // Export functions
  const exportToJSON = useCallback(async () => {
    try {
      const data = JSON.stringify(exportData, null, exportOptions.compress ? 0 : 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zettelview-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      loggingService.error('Failed to export to JSON', error as Error);
      return false;
    }
  }, [exportData, exportOptions.compress]);

  const exportToMarkdown = useCallback(async () => {
    try {
      let markdown = `# ZettelView Export\n\nExported on: ${new Date().toLocaleString()}\nTotal notes: ${notes.length}\n\n`;
      
      for (const note of notes) {
        markdown += `## ${note.title}\n\n`;
        if (exportOptions.includeTags && note.tags.length > 0) {
          markdown += `**Tags:** ${note.tags.join(', ')}\n\n`;
        }
        if (exportOptions.includeTimestamps) {
          markdown += `**Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
          markdown += `**Updated:** ${new Date(note.updatedAt).toLocaleString()}\n\n`;
        }
        markdown += `${note.body}\n\n---\n\n`;
      }
      
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zettelview-export-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      loggingService.error('Failed to export to Markdown', error as Error);
      return false;
    }
  }, [notes, exportOptions]);

  const exportToCSV = useCallback(async () => {
    try {
      const headers = ['Title', 'Body', 'Tags', 'Created', 'Updated'];
      const rows = notes.map(note => [
        `"${note.title.replace(/"/g, '""')}"`,
        `"${note.body.replace(/"/g, '""')}"`,
        `"${note.tags.join(', ')}"`,
        new Date(note.createdAt).toISOString(),
        new Date(note.updatedAt).toISOString()
      ]);
      
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zettelview-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      loggingService.error('Failed to export to CSV', error as Error);
      return false;
    }
  }, [notes]);

  const exportToHTML = useCallback(async () => {
    try {
      let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZettelView Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .note { margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .note h2 { color: #333; margin-bottom: 10px; }
        .note .tags { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .note .timestamps { color: #999; font-size: 0.8em; margin-bottom: 15px; }
        .note .body { white-space: pre-wrap; }
        .metadata { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="metadata">
        <h1>ZettelView Export</h1>
        <p><strong>Exported on:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total notes:</strong> ${notes.length}</p>
    </div>`;
      
      for (const note of notes) {
        html += `
    <div class="note">
        <h2>${note.title}</h2>`;
        
        if (exportOptions.includeTags && note.tags.length > 0) {
          html += `
        <div class="tags"><strong>Tags:</strong> ${note.tags.join(', ')}</div>`;
        }
        
        if (exportOptions.includeTimestamps) {
          html += `
        <div class="timestamps">
            <strong>Created:</strong> ${new Date(note.createdAt).toLocaleString()}<br>
            <strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleString()}
        </div>`;
        }
        
        html += `
        <div class="body">${note.body.replace(/\n/g, '<br>')}</div>
    </div>`;
      }
      
      html += `
</body>
</html>`;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zettelview-export-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      loggingService.error('Failed to export to HTML', error as Error);
      return false;
    }
  }, [notes, exportOptions]);

  const exportToPDF = useCallback(async () => {
    try {
      // For now, we'll export as HTML and let the browser handle PDF conversion
      // In a real implementation, you'd use a library like jsPDF or html2pdf
      setError('PDF export is not yet implemented. Please use HTML export and convert to PDF in your browser.');
      return false;
    } catch (error) {
      loggingService.error('Failed to export to PDF', error as Error);
      return false;
    }
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      let success = false;
      
      switch (exportOptions.format) {
        case 'json':
          success = await exportToJSON();
          break;
        case 'markdown':
          success = await exportToMarkdown();
          break;
        case 'csv':
          success = await exportToCSV();
          break;
        case 'html':
          success = await exportToHTML();
          break;
        case 'pdf':
          success = await exportToPDF();
          break;
      }

      setProgress(100);
      
      if (success) {
        setSuccess(`Successfully exported ${notes.length} notes to ${exportOptions.format.toUpperCase()}`);
        loggingService.info('Export completed successfully', { 
          format: exportOptions.format, 
          noteCount: notes.length 
        });
      } else {
        setError(`Failed to export to ${exportOptions.format.toUpperCase()}`);
      }
    } catch (error) {
      setError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      loggingService.error('Export failed', error as Error);
    } finally {
      setIsProcessing(false);
    }
  }, [exportOptions, notes, exportToJSON, exportToMarkdown, exportToCSV, exportToHTML, exportToPDF]);

  // Import functions
  const importFromJSON = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('Invalid JSON format: missing notes array');
      }

      const importedNotes: Note[] = [];
      let skippedCount = 0;
      let updatedCount = 0;
      let addedCount = 0;

      for (const noteData of data.notes) {
        // Validate note data
        if (importOptions.validateData) {
          if (!noteData.title || !noteData.body) {
            loggingService.warn('Skipping invalid note', { noteData });
            skippedCount++;
            continue;
          }
        }

        const existingNote = notes.find(n => n.id === noteData.id);
        
        if (existingNote) {
          switch (importOptions.mergeStrategy) {
            case 'replace':
              await updateNote(noteData.id, {
                title: noteData.title,
                body: noteData.body,
                tags: noteData.tags || []
              });
              updatedCount++;
              break;
            case 'skip-duplicates':
              skippedCount++;
              break;
            case 'merge':
              // Merge by updating existing note
              await updateNote(noteData.id, {
                title: noteData.title,
                body: noteData.body,
                tags: [...new Set([...existingNote.tags, ...(noteData.tags || [])])]
              });
              updatedCount++;
              break;
          }
        } else {
          await addNote(noteData.title, noteData.body, noteData.tags || []);
          addedCount++;
        }
      }

      return { addedCount, updatedCount, skippedCount };
    } catch (error) {
      loggingService.error('Failed to import from JSON', error as Error);
      throw error;
    }
  }, [notes, addNote, updateNote, importOptions]);

  const importFromMarkdown = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const sections = text.split(/\n## /);
      
      let addedCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < sections.length; i++) { // Skip first section (header)
        const section = sections[i];
        const lines = section.split('\n');
        const title = lines[0].trim();
        const body = lines.slice(1).join('\n').trim();
        
        if (title && body) {
          await addNote(title, body);
          addedCount++;
        } else {
          skippedCount++;
        }
      }

      return { addedCount, updatedCount: 0, skippedCount };
    } catch (error) {
      loggingService.error('Failed to import from Markdown', error as Error);
      throw error;
    }
  }, [addNote]);

  // Handle import
  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      let result;
      
      switch (importOptions.format) {
        case 'json':
          result = await importFromJSON(file);
          break;
        case 'markdown':
          result = await importFromMarkdown(file);
          break;
        default:
          throw new Error(`Unsupported import format: ${importOptions.format}`);
      }

      setProgress(100);
      setSuccess(`Import completed: ${result.addedCount} added, ${result.updatedCount} updated, ${result.skippedCount} skipped`);
      loggingService.info('Import completed successfully', result);
    } catch (error) {
      setError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      loggingService.error('Import failed', error as Error);
    } finally {
      setIsProcessing(false);
      // Reset file input
      event.target.value = '';
    }
  }, [importOptions, importFromJSON, importFromMarkdown]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>Export & Import</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close export/import dialog"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'export' ? colors.primary : 'transparent',
              color: activeTab === 'export' ? 'white' : colors.text,
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'export' ? `2px solid ${colors.primary}` : 'none'
            }}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'import' ? colors.primary : 'transparent',
              color: activeTab === 'import' ? 'white' : colors.text,
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'import' ? `2px solid ${colors.primary}` : 'none'
            }}
          >
            Import
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Export Notes</h3>
            
            {/* Format Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
                Export Format:
              </label>
              <select
                value={exportOptions.format}
                onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text
                }}
              >
                <option value="json">JSON (Full data)</option>
                <option value="markdown">Markdown (Text only)</option>
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="html">HTML (Web page)</option>
                <option value="pdf">PDF (Document)</option>
              </select>
            </div>

            {/* Export Options */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
                Export Options:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  />
                  Include metadata
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeTags}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                  />
                  Include tags
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={exportOptions.includeTimestamps}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                  />
                  Include timestamps
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={exportOptions.compress}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, compress: e.target.checked }))}
                  />
                  Compress JSON (minified)
                </label>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              {isProcessing ? 'Exporting...' : `Export ${notes.length} Notes`}
            </button>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div>
            <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Import Notes</h3>
            
            {/* Format Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
                Import Format:
              </label>
              <select
                value={importOptions.format}
                onChange={(e) => setImportOptions(prev => ({ ...prev, format: e.target.value as ImportFormat }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text
                }}
              >
                <option value="json">JSON (Full data)</option>
                <option value="markdown">Markdown (Text only)</option>
              </select>
            </div>

            {/* Import Options */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
                Import Options:
              </label>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: colors.textSecondary }}>
                  Merge Strategy:
                </label>
                <select
                  value={importOptions.mergeStrategy}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, mergeStrategy: e.target.value as any }))}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text
                  }}
                >
                  <option value="merge">Merge (combine data)</option>
                  <option value="replace">Replace (overwrite existing)</option>
                  <option value="skip-duplicates">Skip duplicates</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={importOptions.validateData}
                  onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                />
                Validate data before import
              </label>
            </div>

            {/* File Input */}
            <input
              type="file"
              accept={importOptions.format === 'json' ? '.json' : '.md,.markdown'}
              onChange={handleImport}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text
              }}
            />
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              width: '100%',
              height: '4px',
              background: colors.border,
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                background: colors.primary,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '8px', 
              fontSize: '12px', 
              color: colors.textSecondary 
            }}>
              {progress}% complete
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            color: '#3c3'
          }}>
            {success}
          </div>
        )}

        {/* Close Button */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.text
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportImport; 