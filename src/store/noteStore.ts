import { create } from 'zustand';
import { fileStorageService } from '../services/fileStorage';

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface NoteStore {
  notes: Note[];
  selectedId: string | null;
  isInitialized: boolean;
  storagePermission: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  requestStoragePermission: () => Promise<void>;
  addNote: (title: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  selectNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  findOrCreateNote: (title: string) => Promise<string>; // returns note id
  deleteNote: (id: string) => Promise<void>;
  loadNotesFromStorage: () => Promise<void>;
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
      tags: ['welcome', 'getting-started'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  selectedId: 'welcome',
  isInitialized: false,
  storagePermission: false,

  initialize: async () => {
    try {
      await fileStorageService.initialize();
      const hasPermission = await fileStorageService.hasPermission();
      
      set({ 
        isInitialized: true, 
        storagePermission: hasPermission 
      });
      
      if (hasPermission) {
        await get().loadNotesFromStorage();
      }
    } catch (error) {
      console.error('Failed to initialize note store:', error);
      set({ isInitialized: true, storagePermission: false });
    }
  },

  requestStoragePermission: async () => {
    try {
      const granted = await fileStorageService.requestPermission();
      set({ storagePermission: granted });
      
      if (granted) {
        await get().loadNotesFromStorage();
      }
    } catch (error) {
      console.error('Failed to request storage permission:', error);
      set({ storagePermission: false });
    }
  },

  loadNotesFromStorage: async () => {
    try {
      const storedNotes = await fileStorageService.loadAllNotes();
      if (storedNotes.length > 0) {
        set({ notes: storedNotes, selectedId: storedNotes[0].id });
      }
    } catch (error) {
      console.error('Failed to load notes from storage:', error);
    }
  },

  addNote: async (title: string) => {
    const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newNote: Note = {
      id,
      title,
      body: `# ${title}\n\nStart writing your note here...`,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      notes: [...state.notes, newNote],
      selectedId: id,
    }));

    // Save to file storage if available
    if (get().storagePermission) {
      try {
        await fileStorageService.saveNote(newNote);
      } catch (error) {
        console.error('Failed to save note to storage:', error);
      }
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const updatedNote = { ...updates, updatedAt: new Date() };
    
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updatedNote }
          : note
      ),
    }));

    // Save to file storage if available
    if (get().storagePermission) {
      try {
        const note = get().getNote(id);
        if (note) {
          await fileStorageService.saveNote({ ...note, ...updatedNote });
        }
      } catch (error) {
        console.error('Failed to save note update to storage:', error);
      }
    }
  },

  selectNote: (id: string) => {
    set({ selectedId: id });
  },

  getNote: (id: string) => {
    return get().notes.find((note) => note.id === id);
  },

  findOrCreateNote: async (title: string) => {
    const state = get();
    const existingNote = state.notes.find(
      (note) => note.title.toLowerCase() === title.toLowerCase()
    );
    
    if (existingNote) {
      return existingNote.id;
    }
    
    // Create new note
    await state.addNote(title);
    return title.toLowerCase().replace(/[^a-z0-9]/g, '-');
  },

  deleteNote: async (id: string) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedId: state.selectedId === id ? (state.notes[0]?.id || null) : state.selectedId,
    }));

    // Delete from file storage if available
    if (get().storagePermission) {
      try {
        await fileStorageService.deleteNote(id);
      } catch (error) {
        console.error('Failed to delete note from storage:', error);
      }
    }
  },
})); 