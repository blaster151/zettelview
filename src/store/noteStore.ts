import { create } from 'zustand';

export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteStore {
  notes: Note[];
  selectedId: string | null;
  
  // Actions
  addNote: (title: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  selectNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  findOrCreateNote: (title: string) => string; // returns note id
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [
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

Try switching to Preview mode to see the rendered Markdown!`,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  selectedId: 'welcome',

  addNote: (title: string) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newNote: Note = {
      id,
      title,
      body: `# ${title}\n\nStart writing your note here...`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      notes: [...state.notes, newNote],
      selectedId: id,
    }));
  },

  updateNote: (id: string, updates: Partial<Note>) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      ),
    }));
  },

  selectNote: (id: string) => {
    set({ selectedId: id });
  },

  getNote: (id: string) => {
    return get().notes.find((note) => note.id === id);
  },

  findOrCreateNote: (title: string) => {
    const state = get();
    const existingNote = state.notes.find(
      (note) => note.title.toLowerCase() === title.toLowerCase()
    );
    
    if (existingNote) {
      return existingNote.id;
    }
    
    // Create new note
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newNote: Note = {
      id,
      title,
      body: `# ${title}\n\nStart writing your note here...`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      notes: [...state.notes, newNote],
      selectedId: id,
    }));
    
    return id;
  },
})); 