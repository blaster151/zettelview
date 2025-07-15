import React from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';
import NoteSidebar from './components/NoteSidebar';
import { useNoteStore } from './store/noteStore';

function App() {
  const { selectedId, getNote, updateNote } = useNoteStore();
  const selectedNote = selectedId ? getNote(selectedId) : null;

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
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
                onChange={(newBody) => {
                  if (selectedId) {
                    updateNote(selectedId, { body: newBody });
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ padding: 24 }}>Select a note</div>
        )}
      </main>
    </div>
  );
}

export default App;
