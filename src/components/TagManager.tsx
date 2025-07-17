import React, { useState } from 'react';
import { Note } from '../types/domain';

interface TagManagerProps {
  note: Note;
  noteId: string;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
}

const TagManager: React.FC<TagManagerProps> = ({ note, noteId, onUpdateNote }) => {
  const [tagInput, setTagInput] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  // Tag management handlers
  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const newTag = tagInput.trim();
    if (!note.tags.includes(newTag)) {
      await onUpdateNote(noteId, { tags: [...note.tags, newTag] });
      setTagInput('');
    }
  };

  const handleRemoveTag = async (index: number) => {
    const newTags = note.tags.filter((_, i) => i !== index);
    await onUpdateNote(noteId, { tags: newTags });
  };

  const handleEditTag = (index: number) => {
    setEditingTagIndex(index);
    setEditingTagValue(note.tags[index]);
  };

  const handleEditTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingTagValue(e.target.value);
  };

  const handleEditTagSave = async (index: number) => {
    const newTag = editingTagValue.trim();
    if (!newTag) return;
    const newTags = note.tags.map((tag, i) => (i === index ? newTag : tag));
    await onUpdateNote(noteId, { tags: newTags });
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleEditTagKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      await handleEditTagSave(index);
    } else if (e.key === 'Escape') {
      setEditingTagIndex(null);
      setEditingTagValue('');
    }
  };

  const handleAddTagKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      await handleAddTag();
    }
  };

  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '1px solid #eee',
      background: '#fafbfc',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#555' }}>Tags</div>
      
      {/* Tag list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {note.tags.map((tag, i) => (
          <span 
            key={i} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              background: '#e3e7ed', 
              borderRadius: '12px', 
              padding: '2px 8px', 
              fontSize: '12px' 
            }}
          >
            {editingTagIndex === i ? (
              <input
                value={editingTagValue}
                onChange={handleEditTagChange}
                onBlur={() => handleEditTagSave(i)}
                onKeyDown={(e) => handleEditTagKeyDown(e, i)}
                autoFocus
                style={{ 
                  fontSize: '12px', 
                  border: '1px solid #bbb', 
                  borderRadius: '8px', 
                  padding: '2px 4px', 
                  marginRight: '4px' 
                }}
                aria-label={`Edit tag ${tag}`}
              />
            ) : (
              <span
                tabIndex={0}
                style={{ 
                  outline: 'none', 
                  cursor: 'pointer', 
                  marginRight: '4px' 
                }}
                onClick={() => handleEditTag(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleEditTag(i);
                }}
                aria-label={`Edit tag ${tag}`}
                role="button"
              >
                {tag}
              </span>
            )}
            <button
              onClick={() => handleRemoveTag(i)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#c00', 
                marginLeft: '2px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                padding: 0 
              }}
              aria-label={`Remove tag ${tag}`}
              title="Remove tag"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      
      {/* Add tag input */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTagKeyDown}
          placeholder="Add tag..."
          style={{ 
            fontSize: '12px', 
            padding: '4px 8px', 
            border: '1px solid #bbb', 
            borderRadius: '8px', 
            minWidth: '80px' 
          }}
          aria-label="Add tag"
        />
        <button
          onClick={handleAddTag}
          disabled={!tagInput.trim() || note.tags.includes(tagInput.trim())}
          style={{ 
            fontSize: '12px', 
            padding: '4px 12px', 
            borderRadius: '8px', 
            border: 'none', 
            background: '#007bff', 
            color: 'white', 
            cursor: tagInput.trim() && !note.tags.includes(tagInput.trim()) ? 'pointer' : 'not-allowed', 
            opacity: tagInput.trim() && !note.tags.includes(tagInput.trim()) ? 1 : 0.6 
          }}
          aria-label="Add tag button"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default TagManager; 