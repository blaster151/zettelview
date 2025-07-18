import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { useUIStore } from '../../store/uiStore';
import { loggingService } from '../../services/loggingService';

interface KeyboardShortcutsProps {
  children: React.ReactNode;
}

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  category: 'Navigation' | 'Editing' | 'Search' | 'View' | 'System' | 'Advanced';
  global?: boolean;
  condition?: () => boolean;
}

interface CommandPaletteItem {
  id: string;
  title: string;
  description: string;
  category: string;
  action: () => void;
  keywords: string[];
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ children }) => {
  const { notes, selectedId, selectNote, addNote, deleteNote } = useNoteStore();
  const { colors } = useThemeStore();
  const {
    viewMode,
    setViewMode,
    openAISummaryPanel,
    openExportImport,
    openTemplateSelector,
    openSaveAsTemplate,
    openCollaborationPanel,
    openPluginManager,
    openPluginStore,
    openHelpPanel
  } = useUIStore();
  
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Get current note index for navigation
  const currentNoteIndex = notes.findIndex(note => note.id === selectedId);
  const hasNotes = notes.length > 0;
  const currentNote = notes.find(note => note.id === selectedId);

  // Define available shortcuts
  const shortcuts: ShortcutAction[] = useMemo(() => [
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
      category: 'Navigation',
      condition: () => hasNotes && currentNoteIndex > 0
    },
    {
      key: 'Ctrl+Shift+P',
      description: 'Next note',
      action: () => {
        if (hasNotes && currentNoteIndex < notes.length - 1) {
          selectNote(notes[currentNoteIndex + 1].id);
        }
      },
      category: 'Navigation',
      condition: () => hasNotes && currentNoteIndex < notes.length - 1
    },
    {
      key: 'Ctrl+Home',
      description: 'First note',
      action: () => {
        if (hasNotes) {
          selectNote(notes[0].id);
        }
      },
      category: 'Navigation',
      condition: () => hasNotes
    },
    {
      key: 'Ctrl+End',
      description: 'Last note',
      action: () => {
        if (hasNotes) {
          selectNote(notes[notes.length - 1].id);
        }
      },
      category: 'Navigation',
      condition: () => hasNotes
    },
    {
      key: 'Ctrl+Delete',
      description: 'Delete current note',
      action: () => {
        if (currentNote && confirm(`Delete note "${currentNote.title}"?`)) {
          deleteNote(currentNote.id);
        }
      },
      category: 'Navigation',
      condition: () => !!currentNote
    },

    // View shortcuts
    {
      key: 'Ctrl+1',
      description: 'Switch to editor view',
      action: () => setViewMode('editor'),
      category: 'View'
    },
    {
      key: 'Ctrl+2',
      description: 'Switch to graph view',
      action: () => setViewMode('graph'),
      category: 'View'
    },
    {
      key: 'Ctrl+3',
      description: 'Switch to calendar view',
      action: () => setViewMode('calendar'),
      category: 'View'
    },
    {
      key: 'Ctrl+T',
      description: 'Toggle theme',
      action: () => {
        const { toggleTheme } = useThemeStore.getState();
        toggleTheme();
      },
      category: 'View',
      global: true
    },
    {
      key: 'F11',
      description: 'Toggle fullscreen',
      action: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      },
      category: 'View',
      global: true
    },

    // Search shortcuts
    {
      key: 'Ctrl+F',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="search" i]') as HTMLInputElement;
        searchInput?.focus();
      },
      category: 'Search'
    },
    {
      key: 'Ctrl+Shift+F',
      description: 'Advanced search',
      action: () => {
        // This would open advanced search panel
        loggingService.info('Advanced search triggered');
      },
      category: 'Search'
    },

    // Editing shortcuts
    {
      key: 'Ctrl+S',
      description: 'Save note',
      action: () => {
        // Auto-save is handled by the editor
        loggingService.info('Manual save triggered');
      },
      category: 'Editing'
    },
    {
      key: 'Ctrl+Z',
      description: 'Undo',
      action: () => {
        document.execCommand('undo');
      },
      category: 'Editing'
    },
    {
      key: 'Ctrl+Y',
      description: 'Redo',
      action: () => {
        document.execCommand('redo');
      },
      category: 'Editing'
    },
    {
      key: 'Ctrl+B',
      description: 'Bold text',
      action: () => {
        document.execCommand('bold');
      },
      category: 'Editing'
    },
    {
      key: 'Ctrl+I',
      description: 'Italic text',
      action: () => {
        document.execCommand('italic');
      },
      category: 'Editing'
    },
    {
      key: 'Ctrl+K',
      description: 'Insert link',
      action: () => {
        const url = prompt('Enter URL:');
        if (url) {
          document.execCommand('createLink', false, url);
        }
      },
      category: 'Editing'
    },

    // System shortcuts
    {
      key: 'Ctrl+Shift+C',
      description: 'Command palette',
      action: () => setShowCommandPalette(true),
      category: 'System',
      global: true
    },
    {
      key: 'F1',
      description: 'Help',
      action: () => openHelpPanel(),
      category: 'System',
      global: true
    },
    {
      key: 'Ctrl+,',
      description: 'Settings',
      action: () => {
        // This would open settings panel
        loggingService.info('Settings triggered');
      },
      category: 'System',
      global: true
    },

    // Advanced shortcuts
    {
      key: 'Ctrl+Shift+A',
      description: 'AI Summary',
      action: () => openAISummaryPanel(),
      category: 'Advanced',
      condition: () => !!currentNote
    },
    {
      key: 'Ctrl+Shift+E',
      description: 'Export/Import',
      action: () => openExportImport(),
      category: 'Advanced'
    },
    {
      key: 'Ctrl+Shift+T',
      description: 'Template selector',
      action: () => openTemplateSelector(),
      category: 'Advanced'
    },
    {
      key: 'Ctrl+Shift+S',
      description: 'Save as template',
      action: () => openSaveAsTemplate(),
      category: 'Advanced',
      condition: () => !!currentNote
    },
    {
      key: 'Ctrl+Shift+L',
      description: 'Collaboration panel',
      action: () => openCollaborationPanel(),
      category: 'Advanced'
    },
    {
      key: 'Ctrl+Shift+P',
      description: 'Plugin manager',
      action: () => openPluginManager(),
      category: 'Advanced'
    },
    {
      key: 'Ctrl+Shift+O',
      description: 'Plugin store',
      action: () => openPluginStore(),
      category: 'Advanced'
    }
  ], [notes, selectedId, currentNoteIndex, hasNotes, currentNote, addNote, selectNote, deleteNote, setViewMode, openAISummaryPanel, openExportImport, openTemplateSelector, openSaveAsTemplate, openCollaborationPanel, openPluginManager, openPluginStore, openHelpPanel]);

  // Command palette items
  const commandPaletteItems: CommandPaletteItem[] = useMemo(() => [
    // Note management
    {
      id: 'new-note',
      title: 'Create New Note',
      description: 'Create a new note',
      category: 'Notes',
      action: () => {
        const title = prompt('Enter note title:');
        if (title?.trim()) {
          addNote(title.trim());
        }
        setShowCommandPalette(false);
      },
      keywords: ['new', 'create', 'add', 'note']
    },
    {
      id: 'delete-note',
      title: 'Delete Current Note',
      description: 'Delete the currently selected note',
      category: 'Notes',
      action: () => {
        if (currentNote && confirm(`Delete note "${currentNote.title}"?`)) {
          deleteNote(currentNote.id);
        }
        setShowCommandPalette(false);
      },
      keywords: ['delete', 'remove', 'note'],
      condition: () => !!currentNote
    },

    // View switching
    {
      id: 'view-editor',
      title: 'Switch to Editor View',
      description: 'Switch to the note editor view',
      category: 'Views',
      action: () => {
        setViewMode('editor');
        setShowCommandPalette(false);
      },
      keywords: ['editor', 'edit', 'write', 'view']
    },
    {
      id: 'view-graph',
      title: 'Switch to Graph View',
      description: 'Switch to the graph visualization view',
      category: 'Views',
      action: () => {
        setViewMode('graph');
        setShowCommandPalette(false);
      },
      keywords: ['graph', 'visualization', 'network', 'view']
    },
    {
      id: 'view-calendar',
      title: 'Switch to Calendar View',
      description: 'Switch to the calendar view',
      category: 'Views',
      action: () => {
        setViewMode('calendar');
        setShowCommandPalette(false);
      },
      keywords: ['calendar', 'date', 'time', 'view']
    },

    // Features
    {
      id: 'ai-summary',
      title: 'AI Summary',
      description: 'Generate AI summary of current note',
      category: 'Features',
      action: () => {
        openAISummaryPanel();
        setShowCommandPalette(false);
      },
      keywords: ['ai', 'summary', 'analyze', 'smart'],
      condition: () => !!currentNote
    },
    {
      id: 'export-import',
      title: 'Export/Import',
      description: 'Export or import notes',
      category: 'Features',
      action: () => {
        openExportImport();
        setShowCommandPalette(false);
      },
      keywords: ['export', 'import', 'backup', 'data']
    },
    {
      id: 'templates',
      title: 'Template Selector',
      description: 'Choose from note templates',
      category: 'Features',
      action: () => {
        openTemplateSelector();
        setShowCommandPalette(false);
      },
      keywords: ['template', 'snippet', 'boilerplate']
    },
    {
      id: 'save-template',
      title: 'Save as Template',
      description: 'Save current note as a template',
      category: 'Features',
      action: () => {
        openSaveAsTemplate();
        setShowCommandPalette(false);
      },
      keywords: ['save', 'template', 'snippet'],
      condition: () => !!currentNote
    },
    {
      id: 'collaboration',
      title: 'Collaboration Panel',
      description: 'Open collaboration settings',
      category: 'Features',
      action: () => {
        openCollaborationPanel();
        setShowCommandPalette(false);
      },
      keywords: ['collaboration', 'share', 'team', 'sync']
    },
    {
      id: 'plugins',
      title: 'Plugin Manager',
      description: 'Manage installed plugins',
      category: 'Features',
      action: () => {
        openPluginManager();
        setShowCommandPalette(false);
      },
      keywords: ['plugin', 'extension', 'addon', 'manage']
    },
    {
      id: 'plugin-store',
      title: 'Plugin Store',
      description: 'Browse and install plugins',
      category: 'Features',
      action: () => {
        openPluginStore();
        setShowCommandPalette(false);
      },
      keywords: ['plugin', 'store', 'marketplace', 'install']
    },

    // System
    {
      id: 'help',
      title: 'Help',
      description: 'Open help documentation',
      category: 'System',
      action: () => {
        openHelpPanel();
        setShowCommandPalette(false);
      },
      keywords: ['help', 'documentation', 'guide', 'support']
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Open application settings',
      category: 'System',
      action: () => {
        // This would open settings panel
        loggingService.info('Settings triggered');
        setShowCommandPalette(false);
      },
      keywords: ['settings', 'preferences', 'config', 'options']
    },
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark themes',
      category: 'System',
      action: () => {
        const { toggleTheme } = useThemeStore.getState();
        toggleTheme();
        setShowCommandPalette(false);
      },
      keywords: ['theme', 'dark', 'light', 'appearance']
    }
  ], [currentNote, addNote, deleteNote, setViewMode, openAISummaryPanel, openExportImport, openTemplateSelector, openSaveAsTemplate, openCollaborationPanel, openPluginManager, openPluginStore, openHelpPanel]);

  // Filter command palette items
  const filteredCommands = useMemo(() => {
    if (!commandPaletteQuery.trim()) {
      return commandPaletteItems.filter(item => !item.condition || item.condition());
    }

    const query = commandPaletteQuery.toLowerCase();
    return commandPaletteItems
      .filter(item => {
        if (item.condition && !item.condition()) return false;
        
        return item.title.toLowerCase().includes(query) ||
               item.description.toLowerCase().includes(query) ||
               item.keywords.some(keyword => keyword.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        // Prioritize exact matches
        const aExact = a.title.toLowerCase() === query || a.keywords.some(k => k.toLowerCase() === query);
        const bExact = b.title.toLowerCase() === query || b.keywords.some(k => k.toLowerCase() === query);
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then prioritize title matches
        const aTitleMatch = a.title.toLowerCase().includes(query);
        const bTitleMatch = b.title.toLowerCase().includes(query);
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        
        return a.title.localeCompare(b.title);
      });
  }, [commandPaletteItems, commandPaletteQuery]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    const key = [
      event.ctrlKey && 'Ctrl',
      event.shiftKey && 'Shift',
      event.altKey && 'Alt',
      event.metaKey && 'Cmd',
      event.key.toUpperCase()
    ].filter(Boolean).join('+');

    // Find matching shortcut
    const shortcut = shortcuts.find(s => {
      if (s.condition && !s.condition()) return false;
      return s.key === key;
    });

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
      loggingService.info('Keyboard shortcut executed', { key, description: shortcut.description });
    }
  }, [shortcuts]);

  // Handle command palette keyboard navigation
  const handleCommandPaletteKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedCommandIndex(prev => 
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedCommandIndex(prev => 
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        const selectedCommand = filteredCommands[selectedCommandIndex];
        if (selectedCommand) {
          selectedCommand.action();
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShowCommandPalette(false);
        setCommandPaletteQuery('');
        setSelectedCommandIndex(0);
        break;
    }
  }, [filteredCommands, selectedCommandIndex]);

  // Set up keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset command palette when opened/closed
  useEffect(() => {
    if (showCommandPalette) {
      setCommandPaletteQuery('');
      setSelectedCommandIndex(0);
    }
  }, [showCommandPalette]);

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
          background: colors.overlay,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '100px',
          zIndex: 10000
        }}>
          <div style={{
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            boxShadow: `0 4px 20px ${colors.shadow}`,
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '400px',
            overflow: 'hidden'
          }}>
            {/* Search input */}
            <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}` }}>
              <input
                type="text"
                placeholder="Search commands..."
                value={commandPaletteQuery}
                onChange={(e) => setCommandPaletteQuery(e.target.value)}
                onKeyDown={handleCommandPaletteKeyDown}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text,
                  fontSize: '16px',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            {/* Command list */}
            <div style={{ maxHeight: '300px', overflow: 'auto' }}>
              {filteredCommands.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: colors.textSecondary
                }}>
                  No commands found
                </div>
              ) : (
                filteredCommands.map((command, index) => (
                  <div
                    key={command.id}
                    onClick={() => command.action()}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: index === selectedCommandIndex ? colors.surfaceHover : 'transparent',
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    onMouseEnter={() => setSelectedCommandIndex(index)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 'bold', color: colors.text }}>
                        {command.title}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: colors.textSecondary,
                        background: colors.surface,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {command.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                      {command.description}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 16px',
              borderTop: `1px solid ${colors.border}`,
              fontSize: '12px',
              color: colors.textSecondary,
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{filteredCommands.length} commands</span>
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcutsHelp && (
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
          zIndex: 9999
        }}>
          <div style={{
            background: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '800px',
            width: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: 0, color: colors.text }}>Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcutsHelp(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: colors.textSecondary
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {['Navigation', 'Editing', 'Search', 'View', 'System', 'Advanced'].map(category => {
                const categoryShortcuts = shortcuts.filter(s => s.category === category);
                return (
                  <div key={category}>
                    <h3 style={{ margin: '0 0 12px 0', color: colors.text, fontSize: '16px' }}>
                      {category}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {categoryShortcuts.map(shortcut => (
                        <div key={shortcut.key} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: `1px solid ${colors.border}`
                        }}>
                          <span style={{ color: colors.textSecondary, fontSize: '14px' }}>
                            {shortcut.description}
                          </span>
                          <kbd style={{
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: colors.text
                          }}>
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcuts; 