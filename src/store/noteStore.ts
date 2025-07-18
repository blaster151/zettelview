import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fileStorageService } from '../services/fileStorage';
import { searchService, SearchResult, SearchHistory } from '../services/searchService';
import { advancedSearchService, AdvancedSearchResult } from '../services/advancedSearchService';
import { Note } from '../types/domain';

interface NoteStore {
  notes: Note[];
  selectedId: string | null;
  isInitialized: boolean;
  storagePermission: boolean;
  searchResults: SearchResult[];
  isSearching: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  requestStoragePermission: () => Promise<void>;
  addNote: (title: string, options?: { body?: string; tags?: string[]; createdAt?: Date; id?: string }) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  selectNote: (id: string) => void;
  getNote: (id: string) => Note | undefined;
  findOrCreateNote: (title: string) => Promise<string>; // returns note id
  deleteNote: (id: string) => Promise<void>;
  loadNotesFromStorage: () => Promise<void>;
  
  // Search actions
  searchNotes: (query: string, options?: { maxResults?: number; includeBody?: boolean }) => Promise<void>;
  quickSearch: (query: string, maxResults?: number) => Promise<void>;
  searchByTags: (tags: string[]) => Promise<void>;
  clearSearch: () => void;
  getSearchSuggestions: (partialQuery: string, maxSuggestions?: number) => string[];
  
  // Advanced search actions
  advancedSearch: (query: string, options?: { maxResults?: number; includeBody?: boolean; caseSensitive?: boolean }) => Promise<void>;
  validateAdvancedQuery: (query: string) => { isValid: boolean; error?: string };
  getAdvancedSearchSuggestions: (query: string) => string[];
}

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => ({
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
      searchResults: [],
      isSearching: false,

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
            // Initialize search service with loaded notes
            searchService.initialize(storedNotes);
          }
        } catch (error) {
          console.error('Failed to load notes from storage:', error);
        }
      },

      addNote: async (title: string, options?: { body?: string; tags?: string[]; createdAt?: Date; id?: string }) => {
        const id = options?.id || title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const newNote: Note = {
          id,
          title,
          body: options?.body || `# ${title}\n\nStart writing your note here...`,
          tags: options?.tags || [],
          createdAt: options?.createdAt || new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          notes: [...state.notes, newNote],
          selectedId: id,
        }));

        // Update search service with new note
        searchService.initialize([...get().notes, newNote]);

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

        // Update search service with updated notes
        searchService.initialize(get().notes);

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

        // Update search service with remaining notes
        searchService.initialize(get().notes);

        // Delete from file storage if available
        if (get().storagePermission) {
          try {
            await fileStorageService.deleteNote(id);
          } catch (error) {
            console.error('Failed to delete note from storage:', error);
          }
        }
      },

      // Search actions
      searchNotes: async (query: string, options?: { maxResults?: number; includeBody?: boolean }) => {
        set({ isSearching: true });
        
        try {
          const results = searchService.search(query, options);
          set({ searchResults: results, isSearching: false });
          
          // Add to search history
          SearchHistory.addToHistory(query, results.length);
        } catch (error) {
          console.error('Search failed:', error);
          set({ searchResults: [], isSearching: false });
        }
      },

      quickSearch: async (query: string, maxResults: number = 20) => {
        set({ isSearching: true });
        
        try {
          const results = searchService.quickSearch(query, maxResults);
          set({ searchResults: results, isSearching: false });
        } catch (error) {
          console.error('Quick search failed:', error);
          set({ searchResults: [], isSearching: false });
        }
      },

      searchByTags: async (tags: string[]) => {
        set({ isSearching: true });
        
        try {
          const results = searchService.searchByTags(tags);
          set({ searchResults: results, isSearching: false });
        } catch (error) {
          console.error('Tag search failed:', error);
          set({ searchResults: [], isSearching: false });
        }
      },

      clearSearch: () => {
        set({ searchResults: [], isSearching: false });
      },

      getSearchSuggestions: (partialQuery: string, maxSuggestions: number = 5) => {
        return searchService.getSuggestions(partialQuery, maxSuggestions);
      },

      // Advanced search actions
      advancedSearch: async (query: string, options?: { maxResults?: number; includeBody?: boolean; caseSensitive?: boolean }) => {
        set({ isSearching: true });
        
        try {
          // Initialize advanced search service if needed
          advancedSearchService.initialize(get().notes);
          
          const results = advancedSearchService.search(query, options);
          set({ searchResults: results, isSearching: false });
          
          // Add to search history
          SearchHistory.addToHistory(query, results.length);
        } catch (error) {
          console.error('Advanced search failed:', error);
          set({ searchResults: [], isSearching: false });
        }
      },

      validateAdvancedQuery: (query: string) => {
        return advancedSearchService.validateQuery(query);
      },

      getAdvancedSearchSuggestions: (query: string) => {
        return advancedSearchService.getSuggestions(query);
      },
    }),
    {
      name: 'zettelview-notes',
      partialize: (state) => ({ 
        selectedId: state.selectedId,
        storagePermission: state.storagePermission
      })
    }
  )
); 