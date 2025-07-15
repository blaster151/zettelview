import React, { useEffect, useState, useCallback } from 'react';
import { useNoteStore } from '../store/noteStore';

interface KeyboardShortcutsProps {
  children: React.ReactNode;
}

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  category: string;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ children }) => {
  const { notes, selectedId, selectNote, addNote } = useNoteStore();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Get current note index for navigation
  const currentNoteIndex = notes.findIndex(note => note.id === selectedId);
  const hasNotes = notes.length > 0;

  // Define available shortcuts
  const shortcuts: ShortcutAction[] = [
    // Navigation shortcuts
    {
      key: 'Ctrl+N',
      description: 'Create new note',
      action: () => {
        const title = prompt('Enter note title:');
        if (title?.trim()) {
          addNote(title.trim());
        }
      },
      category: 'Navigation'
    },
    {
      key: 'Ctrl+P',
      description: 'Previous note',
      action: () => {
        if (hasNotes && currentNoteIndex > 0) {
          selectNote(notes[currentNoteIndex - 1].id);
        }
      },
      category: 'Navigation'
    },
    {
      key: 'Ctrl+Shift+P',
      description: 'Next note',
      action: () => {
        if (hasNotes && currentNoteIndex < notes.length - 1) {
          selectNote(notes[currentNoteIndex + 1].id);
        }
      },
      category: 'Navigation'
    },
    {
      key: 'Ctrl+Shift+C',
      description: 'Command palette',
      action: () => setShowCommandPalette(true),
      category: 'System'
    },
    {
      key: 'Ctrl+F',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      category: 'Search'
    },
    {
      key: 'Ctrl+Shift+N',
      description: 'Focus new note input',
      action: () => {
        const newNoteInput = document.querySelector('input[placeholder*="New note title"]') as HTMLInputElement;
        if (newNoteInput) {
          newNoteInput.focus();
          newNoteInput.select();
        }
      },
      category: 'Navigation'
    }
  ];

  // Filter commands based on query
  const filteredCommands = shortcuts.filter(shortcut =>
    shortcut.description.toLowerCase().includes(commandPaletteQuery.toLowerCase()) ||
    shortcut.key.toLowerCase().includes(commandPaletteQuery.toLowerCase())
  );

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    // Command palette
    if (isCtrl && isShift && event.key === 'P') {
      event.preventDefault();
      setShowCommandPalette(true);
      return;
    }

    // Escape to close command palette
    if (event.key === 'Escape' && showCommandPalette) {
      event.preventDefault();
      setShowCommandPalette(false);
      setCommandPaletteQuery('');
      setSelectedCommandIndex(0);
      return;
    }

    // Handle command palette navigation
    if (showCommandPalette) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          selectedCommand.action();
          setShowCommandPalette(false);
          setCommandPaletteQuery('');
          setSelectedCommandIndex(0);
        }
        return;
      }
      return; // Don't handle other shortcuts when command palette is open
    }

    // Other shortcuts
    if (isCtrl && !isShift) {
      switch (event.key) {
        case 'N':
          event.preventDefault();
          const title = prompt('Enter note title:');
          if (title?.trim()) {
            addNote(title.trim());
          }
          break;
        case 'P':
          event.preventDefault();
          if (hasNotes && currentNoteIndex > 0) {
            selectNote(notes[currentNoteIndex - 1].id);
          }
          break;
        case 'F':
          event.preventDefault();
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
          break;
      }
    }

    if (isCtrl && isShift) {
      switch (event.key) {
        case 'P':
          event.preventDefault();
          if (hasNotes && currentNoteIndex < notes.length - 1) {
            selectNote(notes[currentNoteIndex + 1].id);
          }
          break;
        case 'N':
          event.preventDefault();
          const newNoteInput = document.querySelector('input[placeholder*="New note title"]') as HTMLInputElement;
          if (newNoteInput) {
            newNoteInput.focus();
            newNoteInput.select();
          }
          break;
      }
    }
  }, [notes, selectedId, selectNote, addNote, showCommandPalette, commandPaletteQuery, filteredCommands, selectedCommandIndex, currentNoteIndex, hasNotes]);

  // Handle command palette input
  const handleCommandPaletteInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCommandPaletteQuery(e.target.value);
    setSelectedCommandIndex(0);
  }, []);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = [];
    }
    groups[command.category].push(command);
    return groups;
  }, {} as Record<string, ShortcutAction[]>);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {children}
      
      {/* Command Palette */}
      {showCommandPalette && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          paddingTop: '100px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            width: '500px',
            maxHeight: '400px',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e1e4e8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>⌘</span>
              <input
                type="text"
                value={commandPaletteQuery}
                onChange={handleCommandPaletteInput}
                placeholder="Search commands..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  padding: '4px 0'
                }}
                autoFocus
              />
            </div>

            {/* Commands List */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category}>
                  <div style={{
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#586069',
                    backgroundColor: '#f6f8fa',
                    borderBottom: '1px solid #e1e4e8'
                  }}>
                    {category}
                  </div>
                  {commands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedCommandIndex;
                    return (
                      <div
                        key={`${category}-${index}`}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#0366d6' : 'transparent',
                          color: isSelected ? 'white' : '#24292e',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onClick={() => {
                          command.action();
                          setShowCommandPalette(false);
                          setCommandPaletteQuery('');
                          setSelectedCommandIndex(0);
                        }}
                      >
                        <span>{command.description}</span>
                        <span style={{
                          fontSize: '12px',
                          opacity: 0.7,
                          fontFamily: 'monospace'
                        }}>
                          {command.key}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {filteredCommands.length === 0 && (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#586069',
                  fontSize: '14px'
                }}>
                  No commands found
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 16px',
              fontSize: '12px',
              color: '#586069',
              backgroundColor: '#f6f8fa',
              borderTop: '1px solid #e1e4e8'
            }}>
              Use ↑↓ to navigate, Enter to select, Esc to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts; 