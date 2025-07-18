import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportImport from './features/ExportImport';
import { useNoteStore } from '../store/noteStore';

// Mock the note store
jest.mock('../store/noteStore');

const mockUseNoteStore = useNoteStore as jest.MockedFunction<typeof useNoteStore>;

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(URL, 'createObjectURL', {
  value: mockCreateObjectURL,
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: mockRevokeObjectURL,
  writable: true,
});

// Mock document.createElement and appendChild/removeChild
const mockAnchorElement = {
  href: '',
  download: '',
  click: jest.fn(),
};

const mockCreateElement = jest.fn(() => mockAnchorElement);
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

// Mock window.alert
const mockAlert = jest.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
});

describe('ExportImport', () => {
  const mockNotes = [
    {
      id: 'note1',
      title: 'Test Note 1',
      body: 'This is test note 1 content',
      tags: ['test', 'example'],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'note2',
      title: 'Test Note 2',
      body: 'This is test note 2 content',
      tags: ['test', 'demo'],
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'note3',
      title: 'Programming Guide',
      body: 'This is a programming guide with [[Internal Link]].',
      tags: ['programming', 'guide'],
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  const mockAddNote = jest.fn().mockResolvedValue(undefined);
  const mockUpdateNote = jest.fn().mockResolvedValue(undefined);
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNoteStore.mockReturnValue({
      notes: mockNotes,
      addNote: mockAddNote,
      updateNote: mockUpdateNote,
    } as any);
  });

  test('should render export and import sections', () => {
    render(<ExportImport onClose={mockOnClose} />);
    
    expect(screen.getByText('Export & Import Notes')).toBeInTheDocument();
    expect(screen.getByText('Export Notes')).toBeInTheDocument();
    expect(screen.getByText('Import Notes')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  test('should show close button when onClose is provided', () => {
    render(<ExportImport onClose={mockOnClose} />);
    
    const closeButton = screen.getByLabelText('Close export/import dialog');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should not show close button when onClose is not provided', () => {
    render(<ExportImport />);
    
    expect(screen.queryByLabelText('Close export/import dialog')).not.toBeInTheDocument();
  });

  test('should display all notes in selection list', () => {
    render(<ExportImport />);
    
    expect(screen.getByText('Test Note 1')).toBeInTheDocument();
    expect(screen.getByText('Test Note 2')).toBeInTheDocument();
    expect(screen.getByText('Programming Guide')).toBeInTheDocument();
  });

  test('should show tags for notes', () => {
    render(<ExportImport />);
    
    expect(screen.getByText('(test, example)')).toBeInTheDocument();
    expect(screen.getByText('(test, demo)')).toBeInTheDocument();
    expect(screen.getByText('(programming, guide)')).toBeInTheDocument();
  });

  test('should select all notes by default', () => {
    render(<ExportImport />);
    
    const exportButton = screen.getByText('Export 3 Notes');
    expect(exportButton).toBeInTheDocument();
  });

  test('should handle select all button', () => {
    render(<ExportImport />);
    
    // First deselect all
    fireEvent.click(screen.getByText('Select None'));
    expect(screen.getByText('Export 0 Notes')).toBeInTheDocument();
    
    // Then select all
    fireEvent.click(screen.getByText('Select All'));
    expect(screen.getByText('Export 3 Notes')).toBeInTheDocument();
  });

  test('should handle select none button', () => {
    render(<ExportImport />);
    
    fireEvent.click(screen.getByText('Select None'));
    expect(screen.getByText('Export 0 Notes')).toBeInTheDocument();
  });

  test('should handle individual note selection', () => {
    render(<ExportImport />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
    
    // Deselect first note
    fireEvent.click(checkboxes[0]);
    expect(screen.getByText('Export 2 Notes')).toBeInTheDocument();
  });

  test('should show alert when trying to export with no notes selected', () => {
    render(<ExportImport />);
    
    // Deselect all notes
    fireEvent.click(screen.getByText('Select None'));
    
    // Try to export
    fireEvent.click(screen.getByText('Export 0 Notes'));
    
    expect(mockAlert).toHaveBeenCalledWith('Please select at least one note to export.');
  });

  test('should export to JSON format', async () => {
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    render(<ExportImport />);
    
    const exportButton = screen.getByText('Export 3 Notes');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAnchorElement.download).toMatch(/zettelview-export-.*\.json$/);
      expect(mockAnchorElement.click).toHaveBeenCalled();
    });
  });

  test('should export to CSV format', async () => {
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    
    render(<ExportImport />);
    
    // Change format to CSV
    const formatSelect = screen.getByDisplayValue('JSON (Full data with metadata)');
    fireEvent.change(formatSelect, { target: { value: 'csv' } });
    
    const exportButton = screen.getByText('Export 3 Notes');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAnchorElement.download).toMatch(/zettelview-export-.*\.csv$/);
    });
  });

  test('should handle export errors gracefully', async () => {
    mockCreateObjectURL.mockImplementation(() => {
      throw new Error('Export error');
    });
    
    render(<ExportImport />);
    
    const exportButton = screen.getByText('Export 3 Notes');
    fireEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Export failed. Please try again.');
    });
  });

  test('should have correct file input attributes', () => {
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    expect(fileInput).toBeInTheDocument();
  });

  test('should import JSON file successfully', async () => {
    const jsonContent = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes: [
        {
          id: 'imported-note',
          title: 'Imported Note',
          body: 'This is an imported note',
          tags: ['imported'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    });

    const mockFile = new File([jsonContent], 'test-export.json', { type: 'application/json' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Success: Import completed: 1 new notes, 0 updated notes.')).toBeInTheDocument();
    });
    
    expect(mockAddNote).toHaveBeenCalledWith('Imported Note', {
      body: 'This is an imported note',
      tags: ['imported'],
      createdAt: expect.any(Date),
      id: 'imported-note'
    });
  });

  test('should import CSV file successfully', async () => {
    const csvContent = `Title,Body,Tags,Created,Updated
"Imported CSV Note","This is CSV content","csv; imported","2024-01-01T00:00:00.000Z","2024-01-01T00:00:00.000Z"`;

    const mockFile = new File([csvContent], 'test-export.csv', { type: 'text/csv' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Success: Import completed: 1 new notes, 0 updated notes.')).toBeInTheDocument();
    });
  });

  test('should update existing notes during import', async () => {
    const jsonContent = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes: [
        {
          id: 'note1', // Existing note ID
          title: 'Updated Test Note 1',
          body: 'Updated content',
          tags: ['updated', 'test'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    });

    const mockFile = new File([jsonContent], 'test-export.json', { type: 'application/json' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText('Success: Import completed: 0 new notes, 1 updated notes.')).toBeInTheDocument();
    });
    
    expect(mockUpdateNote).toHaveBeenCalledWith('note1', {
      title: 'Updated Test Note 1',
      body: 'Updated content',
      tags: ['updated', 'test']
    });
  });

  test('should handle invalid JSON file', async () => {
    const invalidJson = '{ invalid json }';
    const mockFile = new File([invalidJson], 'invalid.json', { type: 'application/json' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Import Error:/)).toBeInTheDocument();
    });
  });

  test('should handle invalid CSV file', async () => {
    const invalidCsv = 'Invalid CSV content';
    const mockFile = new File([invalidCsv], 'invalid.csv', { type: 'text/csv' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Import Error:/)).toBeInTheDocument();
    });
  });

  test('should handle unsupported file format', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Import Error:/)).toBeInTheDocument();
      expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
    });
  });

  test('should display statistics correctly', () => {
    render(<ExportImport />);
    
    expect(screen.getByText('Total Notes: 3')).toBeInTheDocument();
    expect(screen.getByText('Total Tags: 5')).toBeInTheDocument(); // test, example, demo, programming, guide
    expect(screen.getByText('Notes with Tags: 3')).toBeInTheDocument();
    expect(screen.getByText(/Total Content: \d+ characters/)).toBeInTheDocument();
  });

  test('should handle notes without tags in statistics', () => {
    const notesWithoutTags = [
      {
        id: 'note1',
        title: 'Note 1',
        body: 'Content 1',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'note2',
        title: 'Note 2',
        body: 'Content 2',
        tags: ['tag1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockUseNoteStore.mockReturnValue({
      notes: notesWithoutTags,
      addNote: mockAddNote,
      updateNote: mockUpdateNote,
    } as any);

    render(<ExportImport />);
    
    expect(screen.getByText('Total Notes: 2')).toBeInTheDocument();
    expect(screen.getByText('Total Tags: 1')).toBeInTheDocument();
    expect(screen.getByText('Notes with Tags: 1')).toBeInTheDocument();
  });

  test('should clear import success message on new import', async () => {
    const jsonContent = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes: [
        {
          id: 'imported-note',
          title: 'Imported Note',
          body: 'This is an imported note',
          tags: ['imported'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    });

    const mockFile = new File([jsonContent], 'test-export.json', { type: 'application/json' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    // First import
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Success:/)).toBeInTheDocument();
    });
    
    // Second import should clear the success message
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    // The success message should be updated, not duplicated
    await waitFor(() => {
      const successMessages = screen.getAllByText(/Success:/);
      expect(successMessages).toHaveLength(1);
    });
  });

  test('should handle import with empty file', async () => {
    const mockFile = new File([''], 'empty.json', { type: 'application/json' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Import Error:/)).toBeInTheDocument();
    });
  });

  test('should handle CSV with missing columns gracefully', async () => {
    const csvContent = `Title,Body
"Note Title","Note Body"`;

    const mockFile = new File([csvContent], 'test-export.csv', { type: 'text/csv' });
    
    render(<ExportImport />);
    
    const fileInput = screen.getByRole('button', { name: /import/i });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Success:/)).toBeInTheDocument();
    });
  });
}); 