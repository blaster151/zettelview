import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedExportImport, ExportOptions, ImportOptions, ExportTemplate, ValidationRule, BatchOperation } from '../services/advancedExportImport';
import { Note } from '../types/note';

const AdvancedExportImportDemo: React.FC = () => {
  const [exportImportService] = useState(() => AdvancedExportImport.getInstance());
  const [notes, setNotes] = useState<Note[]>([]);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeTags: true,
    includeTimestamps: true,
    compression: false,
    encryption: false,
    batchSize: 100
  });
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    format: 'json',
    mergeStrategy: 'overwrite',
    validateContent: true,
    dryRun: false,
    batchSize: 100
  });
  const [exportResult, setExportResult] = useState<string>('');
  const [importResult, setImportResult] = useState<any>(null);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [batchOperations, setBatchOperations] = useState<BatchOperation[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'templates' | 'validation' | 'batch'>('export');

  // Sample notes for demonstration
  const sampleNotes = useMemo((): Note[] => [
    {
      id: '1',
      title: 'Project Planning Notes',
      content: 'This is a comprehensive project planning document that outlines the key milestones, deliverables, and timelines for our upcoming software development project.',
      tags: ['project', 'planning', 'software'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      title: 'Meeting Minutes - Team Sync',
      content: 'Discussion points from today\'s team synchronization meeting. Key decisions made regarding sprint planning and resource allocation.',
      tags: ['meeting', 'team', 'sprint'],
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-25T16:45:00Z'
    },
    {
      id: '3',
      title: 'Research Findings - AI Integration',
      content: 'Research results on integrating artificial intelligence into our existing workflow. Includes performance benchmarks and implementation recommendations.',
      tags: ['research', 'AI', 'integration'],
      createdAt: '2024-01-10T11:20:00Z',
      updatedAt: '2024-01-22T13:15:00Z'
    },
    {
      id: '4',
      title: 'Code Review Checklist',
      content: 'Comprehensive checklist for conducting thorough code reviews. Includes security considerations, performance optimization, and best practices.',
      tags: ['code-review', 'checklist', 'best-practices'],
      createdAt: '2024-01-12T08:30:00Z',
      updatedAt: '2024-01-28T10:20:00Z'
    },
    {
      id: '5',
      title: 'User Feedback Summary',
      content: 'Compilation of user feedback from the latest product release. Highlights common issues, feature requests, and satisfaction metrics.',
      tags: ['feedback', 'user', 'product'],
      createdAt: '2024-01-14T15:45:00Z',
      updatedAt: '2024-01-26T12:10:00Z'
    }
  ], []);

  useEffect(() => {
    setNotes(sampleNotes);
    setTemplates(exportImportService.getTemplates());
    setValidationRules(exportImportService.getValidationRules());
    setBatchOperations(exportImportService.getBatchOperations());
  }, [exportImportService, sampleNotes]);

  const handleExport = async () => {
    try {
      const result = await exportImportService.exportNotes(notes, exportOptions);
      setExportResult(typeof result === 'string' ? result : 'Export completed successfully');
    } catch (error) {
      setExportResult(`Export failed: ${error}`);
    }
  };

  const handleImport = async () => {
    if (!exportResult) {
      setImportResult({ success: false, errors: ['No content to import'] });
      return;
    }

    try {
      const result = await exportImportService.importNotes(exportResult, importOptions);
      setImportResult(result);
    } catch (error) {
      setImportResult({ success: false, errors: [`Import failed: ${error}`] });
    }
  };

  const addValidationRule = () => {
    const newRule: ValidationRule = {
      field: 'title',
      type: 'required',
      value: true,
      message: 'Title is required'
    };
    exportImportService.addValidationRule(newRule);
    setValidationRules(exportImportService.getValidationRules());
  };

  const removeValidationRule = (index: number) => {
    exportImportService.removeValidationRule(index);
    setValidationRules(exportImportService.getValidationRules());
  };

  const addTemplate = () => {
    const newTemplate: ExportTemplate = {
      id: `template-${Date.now()}`,
      name: 'Custom Template',
      description: 'A custom export template',
      format: 'markdown',
      template: `# {{title}}\n\n{{content}}\n\nTags: {{#each tags}}#{{this}} {{/each}}`,
      variables: ['title', 'content', 'tags'],
      category: 'custom',
      tags: ['custom', 'template']
    };
    exportImportService.addTemplate(newTemplate);
    setTemplates(exportImportService.getTemplates());
  };

  const removeTemplate = (templateId: string) => {
    exportImportService.removeTemplate(templateId);
    setTemplates(exportImportService.getTemplates());
  };

  const cancelBatchOperation = (id: string) => {
    exportImportService.cancelBatchOperation(id);
    setBatchOperations(exportImportService.getBatchOperations());
  };

  const clearCompletedOperations = () => {
    exportImportService.clearCompletedOperations();
    setBatchOperations(exportImportService.getBatchOperations());
  };

  const downloadExport = () => {
    if (!exportResult) return;
    
    const blob = new Blob([exportResult], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Advanced Export/Import Demo</h1>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'export', label: 'Export' },
              { id: 'import', label: 'Import' },
              { id: 'templates', label: 'Templates' },
              { id: 'validation', label: 'Validation' },
              { id: 'batch', label: 'Batch Operations' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Export Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      value={exportOptions.format}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="json">JSON</option>
                      <option value="markdown">Markdown</option>
                      <option value="html">HTML</option>
                      <option value="txt">Plain Text</option>
                      <option value="csv">CSV</option>
                      <option value="xml">XML</option>
                      <option value="yaml">YAML</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Template</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                        className="mr-2"
                      />
                      Include Metadata
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeTags}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeTags: e.target.checked }))}
                        className="mr-2"
                      />
                      Include Tags
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeTimestamps}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                        className="mr-2"
                      />
                      Include Timestamps
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.compression}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.checked }))}
                        className="mr-2"
                      />
                      Enable Compression
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.encryption}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, encryption: e.target.checked }))}
                        className="mr-2"
                      />
                      Enable Encryption
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Size: {exportOptions.batchSize}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={exportOptions.batchSize}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={handleExport}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Export Notes
                    </button>
                    {exportResult && (
                      <button
                        onClick={downloadExport}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Export Result */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Result</h3>
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {exportResult || 'Export result will appear here...'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Import Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Import Options</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <select
                      value={importOptions.format}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="json">JSON</option>
                      <option value="markdown">Markdown</option>
                      <option value="html">HTML</option>
                      <option value="txt">Plain Text</option>
                      <option value="csv">CSV</option>
                      <option value="xml">XML</option>
                      <option value="yaml">YAML</option>
                      <option value="roam">Roam Research</option>
                      <option value="evernote">Evernote</option>
                      <option value="obsidian">Obsidian</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Merge Strategy</label>
                    <select
                      value={importOptions.mergeStrategy}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, mergeStrategy: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="overwrite">Overwrite</option>
                      <option value="skip">Skip</option>
                      <option value="rename">Rename</option>
                      <option value="merge">Merge</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={importOptions.validateContent}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, validateContent: e.target.checked }))}
                        className="mr-2"
                      />
                      Validate Content
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={importOptions.dryRun}
                        onChange={(e) => setImportOptions(prev => ({ ...prev, dryRun: e.target.checked }))}
                        className="mr-2"
                      />
                      Dry Run (Preview Only)
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Size: {importOptions.batchSize}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={importOptions.batchSize}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={handleImport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Import Notes
                  </button>
                </div>
              </div>

              {/* Import Result */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Result</h3>
                <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-auto">
                  {importResult ? (
                    <div className="space-y-4">
                      <div className={`p-3 rounded-lg ${
                        importResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        <strong>Status:</strong> {importResult.success ? 'Success' : 'Failed'}
                      </div>
                      
                      {importResult.summary && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Total: {importResult.summary.total}</div>
                          <div>Imported: {importResult.summary.imported}</div>
                          <div>Skipped: {importResult.summary.skipped}</div>
                          <div>Errors: {importResult.summary.errors}</div>
                          <div>Processing Time: {importResult.summary.processingTime}ms</div>
                          <div>File Size: {importResult.summary.fileSize} bytes</div>
                        </div>
                      )}

                      {importResult.errors && importResult.errors.length > 0 && (
                        <div>
                          <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {importResult.errors.map((error: string, index: number) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {importResult.warnings && importResult.warnings.length > 0 && (
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                          <ul className="text-sm text-yellow-700 space-y-1">
                            {importResult.warnings.map((warning: string, index: number) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {importResult.validationResults && importResult.validationResults.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Validation Results:</h4>
                          <div className="space-y-2">
                            {importResult.validationResults.map((result: any, index: number) => (
                              <div key={index} className={`p-2 rounded text-sm ${
                                result.isValid ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                <div className="font-medium">{result.noteTitle}</div>
                                {!result.isValid && (
                                  <div className="text-red-700">
                                    {result.errors.join(', ')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">Import result will appear here...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Export Templates</h3>
              <button
                onClick={addTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <button
                      onClick={() => removeTemplate(template.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div><strong>Format:</strong> {template.format}</div>
                    <div><strong>Category:</strong> {template.category || 'Uncategorized'}</div>
                    <div><strong>Variables:</strong> {template.variables.join(', ')}</div>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Template
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {template.template}
                      </pre>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Tab */}
        {activeTab === 'validation' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Validation Rules</h3>
              <button
                onClick={addValidationRule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Rule
              </button>
            </div>

            <div className="space-y-4">
              {validationRules.map((rule, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="grid grid-cols-4 gap-4 flex-1">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Field</label>
                        <select
                          value={rule.field}
                          onChange={(e) => {
                            const newRules = [...validationRules];
                            newRules[index].field = e.target.value as any;
                            setValidationRules(newRules);
                          }}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="title">Title</option>
                          <option value="content">Content</option>
                          <option value="tags">Tags</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                          value={rule.type}
                          onChange={(e) => {
                            const newRules = [...validationRules];
                            newRules[index].type = e.target.value as any;
                            setValidationRules(newRules);
                          }}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="required">Required</option>
                          <option value="minLength">Min Length</option>
                          <option value="maxLength">Max Length</option>
                          <option value="pattern">Pattern</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Value</label>
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => {
                            const newRules = [...validationRules];
                            newRules[index].value = e.target.value;
                            setValidationRules(newRules);
                          }}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Message</label>
                        <input
                          type="text"
                          value={rule.message}
                          onChange={(e) => {
                            const newRules = [...validationRules];
                            newRules[index].message = e.target.value;
                            setValidationRules(newRules);
                          }}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeValidationRule(index)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Batch Operations Tab */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Batch Operations</h3>
              <button
                onClick={clearCompletedOperations}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Completed
              </button>
            </div>

            <div className="space-y-4">
              {batchOperations.length > 0 ? (
                batchOperations.map(operation => (
                  <div key={operation.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {operation.type === 'export' ? 'Export' : 'Import'} Operation
                        </h4>
                        <p className="text-sm text-gray-600">ID: {operation.id}</p>
                      </div>
                      
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          operation.status === 'completed' ? 'bg-green-100 text-green-800' :
                          operation.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          operation.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {operation.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Progress:</span>
                        <div className="font-medium">{operation.progress.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Processed:</span>
                        <div className="font-medium">{operation.processedItems} / {operation.totalItems}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Created:</span>
                        <div className="font-medium">{operation.createdAt.toLocaleString()}</div>
                      </div>
                      {operation.completedAt && (
                        <div>
                          <span className="text-gray-600">Completed:</span>
                          <div className="font-medium">{operation.completedAt.toLocaleString()}</div>
                        </div>
                      )}
                    </div>

                    {operation.status === 'processing' && (
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${operation.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {operation.error && (
                      <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm">
                        <strong>Error:</strong> {operation.error}
                      </div>
                    )}

                    {operation.status === 'processing' && (
                      <button
                        onClick={() => cancelBatchOperation(operation.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No batch operations found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sample Data */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Data</h3>
          <p className="text-gray-600 mb-4">
            This demo uses {notes.length} sample notes. You can export them in various formats and then import them back to test the functionality.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <div key={note.id} className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">{note.title}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{note.content}</p>
                <div className="flex flex-wrap gap-1">
                  {note.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedExportImportDemo; 