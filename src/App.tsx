import React, { useEffect } from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';
import NoteSidebar from './components/NoteSidebar';
import StoragePermission from './components/StoragePermission';
import { useNoteStore } from './store/noteStore';

function App() {
  const { selectedId, getNote, updateNote, initialize } = useNoteStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const selectedNote = selectedId ? getNote(selectedId) : null;

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <StoragePermission />
      <div style={{ display: 'flex', flex: 1 }}>
        <NoteSidebar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedNote ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #eee' }}>
                <h1 style={{ margin: 0 }}>{selectedNote.title}</h1>
              </div>
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
            </div>
          ) : (
            <div style={{ padding: 24 }}>Select a note</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
