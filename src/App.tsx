import React, { useState } from 'react';
import './App.css';
import MarkdownEditor from './components/MarkdownEditor';

// Placeholder note type
interface Note {
  id: string;
  title: string;
  body: string;
}

const initialNotes: Note[] = [
  { 
    id: 'welcome', 
    title: 'Welcome', 
    body: `# Welcome to ZettelView!

This is your first note! You can:

- **Edit** this note using Markdown
- Switch between **Edit** and **Preview** modes
- Create new notes
- Link between notes using \`[[Note Title]]\`

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, ZettelView!");
}
\`\`\`

Try switching to Preview mode to see the rendered Markdown!` 
  },
];

function App() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedId, setSelectedId] = useState<string>('welcome');

  const selectedNote = notes.find((n) => n.id === selectedId);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 240, borderRight: '1px solid #eee', padding: 16 }}>
        <h2>Notes</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notes.map((note) => (
            <li key={note.id}>
              <button
                style={{
                  background: note.id === selectedId ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  width: '100%',
                  padding: 8,
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedId(note.id)}
              >
                {note.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>
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
                  setNotes((prev) =>
                    prev.map((n) =>
                      n.id === selectedId ? { ...n, body: newBody } : n
                    )
                  );
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
