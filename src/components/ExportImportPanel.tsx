import React, { useState, useRef } from 'react';
import { ExportImportService, ExportOptions, ImportOptions, ExportResult, ImportResult } from '../services/exportImportService';
import { useNoteStore } from '../stores/noteStore';

interface ExportImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (notes: any[]) => void;
}

export const ExportImportPanel: React.FC<ExportImportPanelProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const notes = useNoteStore(state => state.notes);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeTags: true,
    includeTimestamps: true
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    mergeStrategy: 'merge',
    validateContent: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ExportResult | ImportResult | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [tagMapping, setTagMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ExportImportService.getSupportedFormats();

  const handleExport = async () => {
    if (selectedNotes.length === 0) {
      alert('Please select at least one note to export');
      return;
    }

    setIsProcessing(true);
    try {
      const notesToExport = notes.filter(note => selectedNotes.includes(note.id));
      const exportResult = ExportImportService.exportNotes(notesToExport, exportOptions);
      setResult(exportResult);

      if (exportResult.success) {
        // Create and download file
        const blob = new Blob([exportResult.data as string], { 
          type: this.getMimeType(exportOptions.format) 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportResult.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      setResult({
        success: false,
        notes: [],
        errors: [error instanceof Error ? error.message : 'Export failed'],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsProcessing(true);
    try {
      const content = await this.readFileAsText(file);
      const importResult = ExportImportService.importNotes(content, importOptions);
      setResult(importResult);

      if (importResult.success && importResult.notes.length > 0) {
        onImportComplete(importResult.notes);
      }
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        notes: [],
        errors: [error instanceof Error ? error.message : 'Import failed'],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const getMimeType = (format: string): string => {
    switch (format) {
      case 'json': return 'application/json';
      case 'markdown': return 'text/markdown';
      case 'html': return 'text/html';
      case 'txt': return 'text/plain';
      case 'csv': return 'text/csv';
      case 'roam': return 'application/json';
      case 'evernote': return 'application/xml';
      case 'obsidian': return 'text/markdown';
      case 'notion': return 'text/html';
      default: return 'text/plain';
    }
  };

  const getFormatDescription = (format: string): string => {
    switch (format) {
      case 'json': return 'Structured data format with full metadata';
      case 'markdown': return 'Plain text with markdown formatting';
      case 'html': return 'Web page format with styling';
      case 'txt': return 'Simple plain text format';
      case 'csv': return 'Comma-separated values for spreadsheet import';
      case 'roam': return 'Roam Research JSON format';
      case 'evernote': return 'Evernote ENEX format';
      case 'obsidian': return 'Obsidian markdown format';
      case 'notion': return 'Notion HTML export format';
      default: return '';
    }
  };

  const handleSelectAllNotes = () => {
    setSelectedNotes(notes.map(note => note.id));
  };

  const handleDeselectAllNotes = () => {
    setSelectedNotes([]);
  };

  const handleNoteSelection = (noteId: string, selected: boolean) => {
    setSelectedNotes(prev => 
      selected 
        ? [...prev, noteId]
        : prev.filter(id => id !== noteId)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Export & Import</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close export/import panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Export Notes
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import Notes
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'export' ? (
            <div className="h-full flex">
              {/* Export Options */}
              <div className="w-1/3 p-6 border-r overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
                
                {/* Format Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      format: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {supportedFormats.map(format => (
                      <option key={format} value={format.toLowerCase()}>
                        {format}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {getFormatDescription(exportOptions.format)}
                  </p>
                </div>

                {/* Export Options */}
                <div className="space-y-4 mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMetadata}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeMetadata: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include metadata</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTags}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeTags: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include tags</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTimestamps}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        includeTimestamps: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include timestamps</span>
                  </label>
                </div>

                {/* Batch Size */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size (optional)
                  </label>
                  <input
                    type="number"
                    value={exportOptions.batchSize || ''}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      batchSize: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    placeholder="Leave empty for single file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExport}
                  disabled={isProcessing || selectedNotes.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Exporting...' : `Export ${selectedNotes.length} Note${selectedNotes.length !== 1 ? 's' : ''}`}
                </button>
              </div>

              {/* Note Selection */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Notes to Export
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSelectAllNotes}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllNotes}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {notes.map(note => (
                    <label key={note.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(note.id)}
                        onChange={(e) => handleNoteSelection(note.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {note.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {note.tags.length > 0 && `${note.tags.join(', ')} • `}
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex">
              {/* Import Options */}
              <div className="w-1/3 p-6 border-r overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Options</h3>
                
                {/* Format Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Import Format
                  </label>
                  <select
                    value={importOptions.format}
                    onChange={(e) => setImportOptions(prev => ({ 
                      ...prev, 
                      format: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {supportedFormats.map(format => (
                      <option key={format} value={format.toLowerCase()}>
                        {format}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {getFormatDescription(importOptions.format)}
                  </p>
                </div>

                {/* Merge Strategy */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merge Strategy
                  </label>
                  <select
                    value={importOptions.mergeStrategy}
                    onChange={(e) => setImportOptions(prev => ({ 
                      ...prev, 
                      mergeStrategy: e.target.value as any 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="replace">Replace existing notes</option>
                    <option value="merge">Merge with existing notes</option>
                    <option value="skip">Skip duplicates</option>
                  </select>
                </div>

                {/* Import Options */}
                <div className="space-y-4 mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={importOptions.validateContent}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        validateContent: e.target.checked
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Validate content</span>
                  </label>
                </div>

                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={`.${importOptions.format},.${ExportImportService.getConverter(importOptions.format)?.extensions.join(',.')}`}
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Supported Formats Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Supported Formats</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Roam Research:</strong> JSON export files</li>
                    <li>• <strong>Evernote:</strong> ENEX export files</li>
                    <li>• <strong>Obsidian:</strong> Markdown files</li>
                    <li>• <strong>Notion:</strong> HTML export files</li>
                    <li>• <strong>Markdown:</strong> Standard markdown files</li>
                    <li>• <strong>JSON:</strong> Structured data files</li>
                    <li>• <strong>CSV:</strong> Spreadsheet format</li>
                  </ul>
                </div>
              </div>

              {/* Import Results */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h3>
                
                {result ? (
                  <div className="space-y-4">
                    {/* Success/Error Status */}
                    <div className={`p-4 rounded-lg ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center">
                        {result.success ? (
                          <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.success ? 'Import Successful' : 'Import Failed'}
                        </span>
                      </div>
                    </div>

                    {/* Import Metadata */}
                    {result.metadata && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Import Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Source Format:</span> {result.metadata.sourceFormat}
                          </div>
                          <div>
                            <span className="font-medium">Total Imported:</span> {result.metadata.totalImported}
                          </div>
                          <div>
                            <span className="font-medium">Skipped:</span> {result.metadata.skippedCount}
                          </div>
                          <div>
                            <span className="font-medium">Import Date:</span> {new Date(result.metadata.importDate).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Errors */}
                    {result.errors && result.errors.length > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-red-900 mb-2">Errors</h4>
                        <ul className="text-sm text-red-800 space-y-1">
                          {result.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {result.warnings && result.warnings.length > 0 && (
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-900 mb-2">Warnings</h4>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {result.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Imported Notes Preview */}
                    {result.success && 'notes' in result && result.notes.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Imported Notes ({result.notes.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {result.notes.slice(0, 10).map((note, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-white">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {note.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {note.tags.length > 0 && `${note.tags.join(', ')} • `}
                                {note.body.length > 100 ? `${note.body.substring(0, 100)}...` : note.body}
                              </p>
                            </div>
                          ))}
                          {result.notes.length > 10 && (
                            <p className="text-sm text-gray-500 text-center">
                              ... and {result.notes.length - 10} more notes
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>Select a file to import</p>
                    <p className="text-sm">Supported formats: JSON, Markdown, HTML, TXT, Roam, Evernote, Obsidian, Notion, CSV</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {activeTab === 'export' && (
                <span>{selectedNotes.length} note{selectedNotes.length !== 1 ? 's' : ''} selected for export</span>
              )}
              {activeTab === 'import' && (
                <span>Ready to import notes from external sources</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 