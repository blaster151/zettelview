import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { useNoteChaining } from '../../hooks/useNoteChaining';
import { noteChainingService, ChainingOptions } from '../../services/noteChainingService';
import { notificationService } from '../../services/notificationService';
import { loggingService } from '../../services/loggingService';

interface NoteChainingProps {
  parentNoteId?: string;
  onNoteCreated?: (noteId: string) => void;
  onClose?: () => void;
}

const NoteChaining: React.FC<NoteChainingProps> = ({
  parentNoteId,
  onNoteCreated,
  onClose
}) => {
  const { getNote } = useNoteStore();
  const colors = useThemeStore(state => state.colors);
  const { createChainedNote, isCreating, defaultOptions } = useNoteChaining({
    onNoteCreated: (note) => onNoteCreated?.(note.id)
  });

  const [options, setOptions] = useState<ChainingOptions>(defaultOptions);
  const [customTitle, setCustomTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const parentNote = parentNoteId ? getNote(parentNoteId) : null;

  // Preview the generated note
  const previewNote = useMemo(() => {
    if (!parentNote) return null;

    const previewOptions = { ...options };
    if (customTitle) {
      previewOptions.autoTitle = false;
    }

    const chainedNote = noteChainingService.createChainedNote(parentNote, previewOptions);
    
    if (customTitle) {
      chainedNote.title = customTitle;
    }

    return chainedNote;
  }, [parentNote, options, customTitle]);

  const handleCreate = useCallback(async () => {
    if (!parentNoteId) return;

    const finalOptions = { ...options };
    if (customTitle) {
      finalOptions.autoTitle = false;
    }

    const result = await createChainedNote(parentNoteId, finalOptions);
    
    if (result) {
      onClose?.();
      setCustomTitle('');
      setOptions(defaultOptions);
    }
  }, [parentNoteId, options, customTitle, createChainedNote, onClose, defaultOptions]);

  const handleQuickCreate = useCallback(async () => {
    if (!parentNoteId) return;
    
    const result = await createChainedNote(parentNoteId, {
      inheritTags: true,
      addBacklink: true,
      sequentialId: true,
      autoTitle: true
    });
    
    if (result) {
      onClose?.();
    }
  }, [parentNoteId, createChainedNote, onClose]);

  const updateOption = useCallback((key: keyof ChainingOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  if (!parentNote) {
    return (
      <div style={{ padding: 16, color: colors.textSecondary }}>
        No parent note selected
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 16, 
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      maxWidth: 600
    }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px 0', color: colors.text }}>
          Create Chained Note
        </h3>
        <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
          From: <strong>{parentNote.title}</strong>
        </p>
      </div>

      {/* Quick Create Button */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleQuickCreate}
          disabled={isCreating}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.primary,
            color: colors.background,
            border: 'none',
            borderRadius: 4,
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.6 : 1
          }}
        >
          {isCreating ? 'Creating...' : 'Quick Create (Ctrl+Shift+N)'}
        </button>
      </div>

      {/* Custom Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, color: colors.text }}>
          Custom Title (optional):
        </label>
        <input
          type="text"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Leave empty for auto-generated title"
          style={{
            width: '100%',
            padding: 8,
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            backgroundColor: colors.background,
            color: colors.text
          }}
        />
      </div>

      {/* Advanced Options Toggle */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            color: colors.text,
            cursor: 'pointer'
          }}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: colors.text }}>
              <input
                type="checkbox"
                checked={options.inheritTags}
                onChange={(e) => updateOption('inheritTags', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Inherit tags from parent
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: colors.text }}>
              <input
                type="checkbox"
                checked={options.addBacklink}
                onChange={(e) => updateOption('addBacklink', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Add backlink to parent
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: colors.text }}>
              <input
                type="checkbox"
                checked={options.sequentialId}
                onChange={(e) => updateOption('sequentialId', e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Use sequential ID
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ color: colors.text, display: 'block', marginBottom: 4 }}>
              ID Format:
            </label>
            <select
              value={options.idFormat}
              onChange={(e) => updateOption('idFormat', e.target.value)}
              style={{
                padding: 4,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                backgroundColor: colors.background,
                color: colors.text
              }}
            >
              <option value="numeric">Numeric (001, 002, ...)</option>
              <option value="alphanumeric">Alphanumeric (001, 002, ...)</option>
              <option value="timestamp">Timestamp</option>
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ color: colors.text, display: 'block', marginBottom: 4 }}>
              ID Prefix:
            </label>
            <input
              type="text"
              value={options.idPrefix || ''}
              onChange={(e) => updateOption('idPrefix', e.target.value)}
              placeholder="Auto-detected from parent"
              style={{
                padding: 4,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                backgroundColor: colors.background,
                color: colors.text
              }}
            />
          </div>
        </div>
      )}

      {/* Preview */}
      {previewNote && (
        <div style={{ 
          marginBottom: 16,
          padding: 12,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 4
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Preview:</h4>
          <div style={{ fontSize: 14 }}>
            <div><strong>ID:</strong> {previewNote.id}</div>
            <div><strong>Title:</strong> {previewNote.title}</div>
            <div><strong>Tags:</strong> {previewNote.tags.join(', ') || 'None'}</div>
            <div><strong>Parent:</strong> {parentNote.title}</div>
          </div>
        </div>
      )}

      {/* Create Button */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.primary,
            color: colors.background,
            border: 'none',
            borderRadius: 4,
            cursor: isCreating ? 'not-allowed' : 'pointer',
            opacity: isCreating ? 0.6 : 1
          }}
        >
          {isCreating ? 'Creating...' : 'Create Chained Note'}
        </button>
        
        <button
          onClick={onClose}
          style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            color: colors.text,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NoteChaining; 