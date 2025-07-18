import React, { useState } from 'react';
import { ExportImportService, ExportOptions, ImportOptions } from '../services/exportImportService';

const sampleNotes = [
  {
    id: '1',
    title: 'Getting Started with ZettelView',
    body: 'ZettelView is a powerful note-taking application that helps you organize your thoughts and ideas. This note covers the basics of getting started with the application.',
    tags: ['getting-started', 'tutorial', 'basics'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: '2',
    title: 'Advanced Features Guide',
    body: 'Explore the advanced features of ZettelView including search algorithms, export/import capabilities, and collaboration tools. This guide will help you make the most of the application.',
    tags: ['advanced', 'features', 'guide'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '3',
    title: 'Workflow Optimization',
    body: 'Learn how to optimize your workflow with ZettelView. Discover tips and tricks for efficient note-taking, organization, and retrieval.',
    tags: ['workflow', 'productivity', 'tips'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  }
];

const formatExamples = [
  {
    name: 'JSON',
    description: 'Structured data format with full metadata',
    extension: '.json',
    sample: `{
  "version": "1.0.0",
  "exportDate": "2024-01-15T10:30:00.000Z",
  "notes": [
    {
      "id": "1",
      "title": "Sample Note",
      "body": "This is a sample note content.",
      "tags": ["sample", "demo"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}`,
    useCase: 'Full data backup, API integration, data migration'
  },
  {
    name: 'Markdown',
    description: 'Plain text with markdown formatting',
    extension: '.md',
    sample: `# Sample Note

**Tags:** #sample #demo

This is a sample note content with markdown formatting.

## Features
- Bullet points
- **Bold text**
- *Italic text*

Created: 2024-01-01T00:00:00.000Z
Updated: 2024-01-01T00:00:00.000Z

---`,
    useCase: 'Documentation, blog posts, GitHub README'
  },
  {
    name: 'Roam Research',
    description: 'Roam Research JSON format',
    extension: '.json',
    sample: `{
  "version": "1.0.0",
  "exportDate": "2024-01-15T10:30:00.000Z",
  "pages": [
    {
      "title": "Sample Note",
      "children": [
        {
          "string": "This is a sample note content with [[sample]] and [[demo]] tags.",
          "children": []
        }
      ]
    }
  ]
}`,
    useCase: 'Roam Research migration, knowledge graph export'
  },
  {
    name: 'Evernote',
    description: 'Evernote ENEX format',
    extension: '.enex',
    sample: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="2024-01-15T10:30:00.000Z" version="3.0">
  <note>
    <title>Sample Note</title>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>This is a sample note content.</en-note>]]></content>
    <tag>sample</tag>
    <tag>demo</tag>
    <created>2024-01-01T00:00:00.000Z</created>
    <updated>2024-01-01T00:00:00.000Z</updated>
  </note>
</en-export>`,
    useCase: 'Evernote migration, enterprise note systems'
  },
  {
    name: 'Obsidian',
    description: 'Obsidian markdown format',
    extension: '.md',
    sample: `# Sample Note

Tags: #sample #demo

This is a sample note content.

## Links
- [[Getting Started]]
- [[Advanced Features]]

## Metadata
- Created: 2024-01-01
- Updated: 2024-01-01

---

#getting-started #tutorial`,
    useCase: 'Obsidian vault migration, local note management'
  },
  {
    name: 'CSV',
    description: 'Comma-separated values for spreadsheet import',
    extension: '.csv',
    sample: `Title,Body,Tags,Created,Updated
"Sample Note","This is a sample note content.","sample;demo","2024-01-01T00:00:00.000Z","2024-01-01T00:00:00.000Z"`,
    useCase: 'Data analysis, spreadsheet integration, bulk operations'
  }
];

export const ExportImportDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'export' | 'import' | 'formats'>('overview');
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
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
  const [result, setResult] = useState<any>(null);

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const exportResult = ExportImportService.exportNotes(sampleNotes, exportOptions);
      setResult(exportResult);
      
      if (exportResult.success) {
        // Create and download file
        const blob = new Blob([exportResult.data as string], { 
          type: getMimeType(exportOptions.format) 
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
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const content = await readFileAsText(file);
      const importResult = ExportImportService.importNotes(content, importOptions);
      setResult(importResult);
    } catch (error) {
      console.error('Import error:', error);
    } finally {
      setIsProcessing(false);
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

  const supportedFormats = ExportImportService.getSupportedFormats();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Export & Import Demo</h1>
        <p className="text-lg text-gray-600">
          Explore the comprehensive export and import capabilities supporting multiple formats
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Export Demo
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Import Demo
          </button>
          <button
            onClick={() => setActiveTab('formats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'formats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Format Examples
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export & Import Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Export Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Multiple format support (JSON, Markdown, HTML, CSV, etc.)
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Batch export with customizable options
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Metadata and timestamp preservation
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Template-based export customization
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Import Features</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Support for popular note-taking platforms
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Intelligent merge strategies
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Content validation and error handling
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Tag mapping and transformation
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Supported Platforms</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-medium text-gray-900">Roam Research</h3>
                <p className="text-sm text-gray-600">JSON export format</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">🐘</div>
                <h3 className="font-medium text-gray-900">Evernote</h3>
                <p className="text-sm text-gray-600">ENEX format</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">💎</div>
                <h3 className="font-medium text-gray-900">Obsidian</h3>
                <p className="text-sm text-gray-600">Markdown files</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-gray-900">Notion</h3>
                <p className="text-sm text-gray-600">HTML export</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Data</h2>
            
            <div className="space-y-3">
              {sampleNotes.map((note, index) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{note.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{note.body}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Demo</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Export Options */}
              <div className="space-y-4">
                <div>
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
                </div>

                <div className="space-y-3">
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

                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Exporting...' : 'Export Sample Notes'}
                </button>
              </div>

              {/* Export Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Export Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Format:</strong> {exportOptions.format.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Notes:</strong> {sampleNotes.length}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Options:</strong>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Metadata: {exportOptions.includeMetadata ? 'Yes' : 'No'}</li>
                    <li>• Tags: {exportOptions.includeTags ? 'Yes' : 'No'}</li>
                    <li>• Timestamps: {exportOptions.includeTimestamps ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Export Result */}
          {result && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Result</h3>
              
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
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
                    {result.success ? 'Export Successful' : 'Export Failed'}
                  </span>
                </div>
                
                {result.success && result.metadata && (
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Filename:</span> {result.filename}
                    </div>
                    <div>
                      <span className="font-medium">Format:</span> {result.format}
                    </div>
                    <div>
                      <span className="font-medium">Notes:</span> {result.noteCount}
                    </div>
                    <div>
                      <span className="font-medium">Size:</span> {result.metadata.totalSize} bytes
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Demo</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Import Options */}
              <div className="space-y-4">
                <div>
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
                </div>

                <div>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File
                  </label>
                  <input
                    type="file"
                    accept={`.${importOptions.format},.${ExportImportService.getConverter(importOptions.format)?.extensions.join(',.')}`}
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

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

              {/* Import Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Import Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Format:</strong> {importOptions.format.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Strategy:</strong> {importOptions.mergeStrategy}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Validation:</strong> {importOptions.validateContent ? 'Enabled' : 'Disabled'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Supported Extensions:</strong>
                    <div className="mt-1">
                      {ExportImportService.getConverter(importOptions.format)?.extensions.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Import Result */}
          {result && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Result</h3>
              
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center mb-2">
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
                
                {result.success && result.metadata && (
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
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
                )}

                {result.errors && result.errors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Errors</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.warnings && result.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-900 mb-2">Warnings</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'formats' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Format Examples</h2>
            <p className="text-gray-600 mb-6">
              Explore the different export/import formats and their use cases
            </p>
            
            <div className="space-y-6">
              {formatExamples.map((format, index) => (
                <div key={index} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{format.name}</h3>
                      <p className="text-gray-600">{format.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        <strong>Use Case:</strong> {format.useCase}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {format.extension}
                    </span>
                  </div>
                  
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{format.sample}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 