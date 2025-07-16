// Test utility types to reduce 'as any' usage
import { Note } from './domain';

// Mock store types for testing
export interface MockNoteStore {
  notes: Note[];
  selectedId: string | null;
  getNote: (id: string) => Note | null;
  selectNote: (id: string) => void;
  addNote: (title: string) => Promise<string>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  findOrCreateNote: (title: string) => Promise<string>;
  initialize: () => Promise<void>;
}

export interface MockThemeStore {
  colors: {
    background: string;
    surface: string;
    surfaceActive: string;
    surfaceHover: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
  isDark: boolean;
  toggleTheme: () => void;
}

// Partial mock types for when you only need some methods
export type PartialMockNoteStore = Partial<MockNoteStore>;
export type PartialMockThemeStore = Partial<MockThemeStore>;

// Shared test utilities
export const createMockNote = (id: string, title: string, body: string, tags: string[] = []): Note => ({
  id,
  title,
  body,
  tags,
  createdAt: new Date(),
  updatedAt: new Date(),
}); 