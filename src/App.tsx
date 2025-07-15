import React, { useEffect, useState } from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';
import NoteSidebar from './components/NoteSidebar';
import StoragePermission from './components/StoragePermission';
import BacklinksPanel from './components/BacklinksPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import GraphView from './components/GraphView';
import AISummarizer from './components/AISummarizer';
import { useNoteStore } from './store/noteStore';

function App() {
  const { selectedId, getNote, updateNote, initialize } = useNoteStore();
  const [viewMode, setViewMode] = useState<'editor' | 'graph'>('editor');
  const [showAISummarizer, setShowAISummarizer] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectedNote = selectedId ? getNote(selectedId) : null;

  return (
    <KeyboardShortcuts>
      <div className="app-container" style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        <StoragePermission />
        <div style={{ display: 'flex', flex: 1 }}>
          <NoteSidebar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* View Mode Toggle */}
            <div style={{ 
              padding: '12px 24px', 
              borderBottom: '1px solid #eee',
              background: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h1 style={{ margin: 0, fontSize: '20px' }}>
                {viewMode === 'editor' ? selectedNote?.title : 'Knowledge Graph'}
              </h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setViewMode('editor')}
                  style={{
                    background: viewMode === 'editor' ? '#007bff' : 'transparent',
                    color: viewMode === 'editor' ? 'white' : '#007bff',
                    border: '1px solid #007bff',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('graph')}
                  style={{
                    background: viewMode === 'graph' ? '#007bff' : 'transparent',
                    color: viewMode === 'graph' ? 'white' : '#007bff',
                    border: '1px solid #007bff',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Graph View
                </button>
                {selectedNote && (
                  <button
                    onClick={() => setShowAISummarizer(true)}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: '1px solid #28a745',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                    title="AI Analysis (Ctrl+Shift+A)"
                  >
                    🤖 AI
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            {showAISummarizer ? (
              <AISummarizer 
                noteId={selectedId || undefined}
                onClose={() => setShowAISummarizer(false)}
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
                <div style={{ padding: 24 }}>Select a note</div>
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
