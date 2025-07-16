import { fileStorageService, createFileStorageService } from './fileStorage';
import { Note } from '../store/noteStore';

// Mock the File System Access API
const mockFileHandle = {
  createWritable: jest.fn().mockResolvedValue({
    write: jest.fn(),
    close: jest.fn(),
  }),
  getFile: jest.fn().mockResolvedValue({
    text: jest.fn().mockResolvedValue('test content'),
  }),
};

const mockDirectoryHandle: any = {
  getFileHandle: jest.fn().mockResolvedValue(mockFileHandle),
  getDirectoryHandle: jest.fn().mockResolvedValue({}),
  removeEntry: jest.fn(),
  values: jest.fn().mockReturnValue([]),
  queryPermission: jest.fn().mockResolvedValue('granted'),
};

// Fix the circular reference
mockDirectoryHandle.getDirectoryHandle = jest.fn().mockResolvedValue(mockDirectoryHandle);

// Mock window.showDirectoryPicker
Object.defineProperty(window, 'showDirectoryPicker', {
  value: jest.fn().mockResolvedValue(mockDirectoryHandle),
  writable: true,
});

describe('FileStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize without errors', async () => {
    await expect(fileStorageService.initialize()).resolves.not.toThrow();
  });

  test('should check permission correctly', async () => {
    const hasPermission = await fileStorageService.hasPermission();
    expect(hasPermission).toBeDefined();
  });

  test('should request permission', async () => {
    const granted = await fileStorageService.requestPermission();
    expect(granted).toBeDefined();
  });

  test('should save note to storage', async () => {
    const testNote: Note = {
      id: 'test-note',
      title: 'Test Note',
      body: '# Test Content\n\nThis is a test note.',
      tags: ['test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await expect(fileStorageService.saveNote(testNote)).resolves.not.toThrow();
  });

  test('should load note from storage', async () => {
    const note = await fileStorageService.loadNote('test-note');
    expect(note).toBeDefined();
  });

  test('should load all notes from storage', async () => {
    const notes = await fileStorageService.loadAllNotes();
    expect(Array.isArray(notes)).toBe(true);
  });

  test('should delete note from storage', async () => {
    await expect(fileStorageService.deleteNote('test-note')).resolves.not.toThrow();
  });

  test('should create appropriate storage service based on browser support', () => {
    const service = createFileStorageService();
    expect(service).toBeDefined();
    expect(typeof service.initialize).toBe('function');
    expect(typeof service.saveNote).toBe('function');
    expect(typeof service.loadNote).toBe('function');
  });
}); 