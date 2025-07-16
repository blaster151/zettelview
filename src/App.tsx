import React, { useEffect, useState } from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';
import NoteSidebar from './components/NoteSidebar';
import StoragePermission from './components/StoragePermission';
import BacklinksPanel from './components/BacklinksPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import GraphView from './components/GraphView';
import AISummarizer from './components/AISummarizer';
import ExportImport from './components/ExportImport';
import ThemeToggle from './components/ThemeToggle';
import { useNoteStore } from './store/noteStore';
import { useThemeStore } from './store/themeStore';

function App() {
  const { selectedId, getNote, updateNote, initialize } = useNoteStore();
  const { colors } = useThemeStore();
  const [viewMode, setViewMode] = useState<'editor' | 'graph'>('editor');
  const [showAISummarizer, setShowAISummarizer] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectedNote = selectedId ? getNote(selectedId) : null;

  return (
    <KeyboardShortcuts>
      <div 
        className="app-container" 
        style={{ 
          display: 'flex', 
          height: '100vh', 
          flexDirection: 'column',
          background: colors.background,
          color: colors.text,
          transition: 'all 0.2s ease'
        }}
      >
        <StoragePermission />
        <div style={{ display: 'flex', flex: 1 }}>
          <NoteSidebar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* View Mode Toggle */}
            <div style={{ 
              padding: '12px 24px', 
              borderBottom: `1px solid ${colors.border}`,
              background: colors.surface,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease'
            }}>
              <h1 style={{ margin: 0, fontSize: '20px', color: colors.text }}>
                {viewMode === 'editor' ? selectedNote?.title : 'Knowledge Graph'}
              </h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('editor')}
                  style={{
                    background: viewMode === 'editor' ? colors.primary : 'transparent',
                    color: viewMode === 'editor' ? 'white' : colors.primary,
                    border: `1px solid ${colors.primary}`,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  style={{
                    background: viewMode === 'graph' ? colors.primary : 'transparent',
                    color: viewMode === 'graph' ? 'white' : colors.primary,
                    border: `1px solid ${colors.primary}`,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Graph View
                </button>
                {selectedNote && (
                  <button
                    onClick={() => setShowAISummarizer(true)}
                    style={{
                      background: colors.success,
                      color: 'white',
                      border: `1px solid ${colors.success}`,
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                    title="AI Analysis (Ctrl+Shift+A)"
                  >
                    🤖 AI
                  </button>
                )}
                <button
                  onClick={() => setShowExportImport(true)}
                  style={{
                    background: colors.secondary,
                    color: 'white',
                    border: `1px solid ${colors.secondary}`,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  title="Export/Import Notes"
                >
                  📁 Export/Import
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Content Area */}
            {showAISummarizer ? (
              <AISummarizer 
                noteId={selectedId || undefined}
                onClose={() => setShowAISummarizer(false)}
              />
            ) : showExportImport ? (
              <ExportImport 
                onClose={() => setShowExportImport(false)}
              />
            ) : viewMode === 'editor' ? (
              selectedNote ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <MarkdownEditor
                      value={selectedNote.body}
                      onChange={async (newBody) => {
                        if (selectedId) {
                          await updateNote(selectedId, { body: newBody });
                        }
                      }}
                      noteId={selectedId || undefined}
                      autoSave={true}
                    />
                  </div>
                  <BacklinksPanel currentNoteId={selectedId!} />
                </div>
              ) : (
                <div style={{ padding: 24, color: colors.textSecondary }}>Select a note</div>
              )
            ) : (
              <GraphView 
                selectedNodeId={selectedId || undefined}
                onNodeClick={(nodeId) => {
                  setViewMode('editor');
                }}
              />
            )}
          </main>
        </div>
      </div>
    </KeyboardShortcuts>
  );
}

export default App;
