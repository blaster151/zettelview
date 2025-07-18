import { Note } from '../types/note';

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html' | 'txt' | 'csv' | 'xml' | 'yaml';
  includeMetadata?: boolean;
  includeTags?: boolean;
  includeTimestamps?: boolean;
  template?: string;
  compression?: boolean;
  encryption?: boolean;
  password?: string;
  batchSize?: number;
  progressCallback?: (progress: number) => void;
}

export interface ImportOptions {
  format: 'json' | 'markdown' | 'html' | 'txt' | 'csv' | 'xml' | 'yaml' | 'roam' | 'evernote' | 'obsidian';
  mergeStrategy?: 'overwrite' | 'skip' | 'rename' | 'merge';
  tagMapping?: Map<string, string>;
  categoryMapping?: Map<string, string>;
  validateContent?: boolean;
  dryRun?: boolean;
  batchSize?: number;
  progressCallback?: (progress: number) => void;
  validationRules?: ValidationRule[];
}

export interface ValidationRule {
  field: 'title' | 'content' | 'tags';
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  format: string;
  template: string;
  variables: string[];
  isDefault?: boolean;
  category?: string;
  tags?: string[];
}

export interface ImportResult {
  success: boolean;
  importedNotes: Note[];
  skippedNotes: string[];
  errors: string[];
  warnings: string[];
  summary: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
    processingTime: number;
    fileSize: number;
  };
  validationResults?: ValidationResult[];
}

export interface ValidationResult {
  noteId: string;
  noteTitle: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BatchOperation {
  id: string;
  type: 'export' | 'import';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  result?: ImportResult | string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class AdvancedExportImport {
  private static instance: AdvancedExportImport;
  private templates: Map<string, ExportTemplate> = new Map();
  private batchOperations: Map<string, BatchOperation> = new Map();
  private validationRules: ValidationRule[] = [];

  static getInstance(): AdvancedExportImport {
    if (!AdvancedExportImport.instance) {
      AdvancedExportImport.instance = new AdvancedExportImport();
      AdvancedExportImport.instance.initializeDefaultTemplates();
      AdvancedExportImport.instance.initializeDefaultValidationRules();
    }
    return AdvancedExportImport.instance;
  }

  // Enhanced Export functionality with batch processing
  async exportNotes(notes: Note[], options: ExportOptions): Promise<string | Blob> {
    const { format, template, compression, encryption, password, batchSize = 100, progressCallback } = options;

    if (notes.length > batchSize) {
      return this.batchExport(notes, options);
    }

    let content: string;
    
    if (template) {
      content = await this.applyTemplate(notes, template, options);
    } else {
      content = await this.formatNotes(notes, format, options);
    }

    if (compression) {
      content = await this.compressContent(content);
    }

    if (encryption && password) {
      content = await this.encryptContent(content, password);
    }

    return content;
  }

  private async batchExport(notes: Note[], options: ExportOptions): Promise<string | Blob> {
    const batchId = this.generateBatchId();
    const batchSize = options.batchSize || 100;
    const totalBatches = Math.ceil(notes.length / batchSize);
    
    const batchOperation: BatchOperation = {
      id: batchId,
      type: 'export',
      status: 'processing',
      progress: 0,
      totalItems: notes.length,
      processedItems: 0,
      createdAt: new Date()
    };

    this.batchOperations.set(batchId, batchOperation);

    try {
      const results: string[] = [];
      
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, notes.length);
        const batchNotes = notes.slice(start, end);
        
        const batchContent = await this.formatNotes(batchNotes, options.format, options);
        results.push(batchContent);
        
        batchOperation.processedItems = end;
        batchOperation.progress = (end / notes.length) * 100;
        
        if (options.progressCallback) {
          options.progressCallback(batchOperation.progress);
        }
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const finalContent = this.combineBatchResults(results, options.format);
      
      batchOperation.status = 'completed';
      batchOperation.result = finalContent;
      batchOperation.completedAt = new Date();
      
      return finalContent;
    } catch (error) {
      batchOperation.status = 'failed';
      batchOperation.error = error as string;
      throw error;
    }
  }

  private combineBatchResults(results: string[], format: string): string {
    switch (format) {
      case 'json':
        return this.combineJSONResults(results);
      case 'markdown':
        return this.combineMarkdownResults(results);
      case 'html':
        return this.combineHTMLResults(results);
      case 'xml':
        return this.combineXMLResults(results);
      case 'yaml':
        return this.combineYAMLResults(results);
      default:
        return results.join('\n\n');
    }
  }

  private combineJSONResults(results: string[]): string {
    const combined = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalNotes: 0,
      notes: [] as any[]
    };

    for (const result of results) {
      try {
        const parsed = JSON.parse(result);
        if (parsed.notes && Array.isArray(parsed.notes)) {
          combined.notes.push(...parsed.notes);
          combined.totalNotes += parsed.notes.length;
        }
      } catch (error) {
        console.warn('Failed to parse JSON result:', error);
      }
    }

    return JSON.stringify(combined, null, 2);
  }

  private combineMarkdownResults(results: string[]): string {
    let combined = `# Notes Export\n\n`;
    combined += `Exported on: ${new Date().toLocaleString()}\n`;
    combined += `Total notes: ${results.length}\n\n`;
    combined += `---\n\n`;

    for (const result of results) {
      // Remove headers from subsequent results
      const cleanResult = result.replace(/^# Notes Export[\s\S]*?---\n\n/, '');
      combined += cleanResult;
    }

    return combined;
  }

  private combineHTMLResults(results: string[]): string {
    let combined = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .note { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .tags { color: #007bff; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Notes Export</h1>
    <p>Exported on: ${new Date().toLocaleString()}</p>
    <p>Total notes: ${results.length}</p>
    <hr>`;

    for (const result of results) {
      // Extract note content from HTML
      const noteMatches = result.match(/<div class="note">[\s\S]*?<\/div>/g);
      if (noteMatches) {
        combined += noteMatches.join('\n');
      }
    }

    combined += `</body></html>`;
    return combined;
  }

  private combineXMLResults(results: string[]): string {
    let combined = `<?xml version="1.0" encoding="UTF-8"?>
<notes-export version="1.0" exported-at="${new Date().toISOString()}">
  <metadata>
    <total-notes>${results.length}</total-notes>
  </metadata>
  <notes>`;

    for (const result of results) {
      // Extract note elements from XML
      const noteMatches = result.match(/<note>[\s\S]*?<\/note>/g);
      if (noteMatches) {
        combined += noteMatches.join('\n    ');
      }
    }

    combined += `
  </notes>
</notes-export>`;
    return combined;
  }

  private combineYAMLResults(results: string[]): string {
    let combined = `# Notes Export
version: "1.0"
exported_at: "${new Date().toISOString()}"
total_notes: ${results.length}
notes:`;

    for (const result of results) {
      // Extract note entries from YAML
      const noteMatches = result.match(/\n  - title:[\s\S]*?(?=\n  -|$)/g);
      if (noteMatches) {
        combined += noteMatches.join('');
      }
    }

    return combined;
  }

  // Enhanced Import functionality with validation and batch processing
  async importNotes(content: string, options: ImportOptions): Promise<ImportResult> {
    const startTime = Date.now();
    const { batchSize = 100, progressCallback, validationRules = this.validationRules } = options;

    const result: ImportResult = {
      success: true,
      importedNotes: [],
      skippedNotes: [],
      errors: [],
      warnings: [],
      summary: { 
        total: 0, 
        imported: 0, 
        skipped: 0, 
        errors: 0, 
        processingTime: 0,
        fileSize: content.length
      },
      validationResults: []
    };

    try {
      let notes: Note[] = [];

      switch (options.format) {
        case 'json':
          notes = this.parseJSON(content);
          break;
        case 'markdown':
          notes = this.parseMarkdown(content);
          break;
        case 'html':
          notes = this.parseHTML(content);
          break;
        case 'txt':
          notes = this.parseTXT(content);
          break;
        case 'csv':
          notes = this.parseCSV(content);
          break;
        case 'xml':
          notes = this.parseXML(content);
          break;
        case 'yaml':
          notes = this.parseYAML(content);
          break;
        case 'roam':
          notes = this.parseRoam(content);
          break;
        case 'evernote':
          notes = this.parseEvernote(content);
          break;
        case 'obsidian':
          notes = this.parseObsidian(content);
          break;
        default:
          throw new Error(`Unsupported import format: ${options.format}`);
      }

      result.summary.total = notes.length;

      // Process notes in batches
      if (notes.length > batchSize) {
        return this.batchImport(notes, options, result);
      }

      for (let i = 0; i < notes.length; i++) {
        try {
          const note = notes[i];
          
          // Validate note
          if (options.validateContent) {
            const validation = this.validateNote(note, validationRules);
            result.validationResults?.push(validation);
            
            if (!validation.isValid) {
              result.warnings.push(`Note "${note.title}": ${validation.errors.join(', ')}`);
            }
          }

          if (options.dryRun) {
            result.importedNotes.push(note);
            result.summary.imported++;
          } else {
            const processedNote = this.processNote(note, options);
            result.importedNotes.push(processedNote);
            result.summary.imported++;
          }

          if (progressCallback) {
            progressCallback(((i + 1) / notes.length) * 100);
          }
        } catch (error) {
          result.errors.push(`Failed to import note "${notes[i].title}": ${error}`);
          result.summary.errors++;
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error}`);
    } finally {
      result.summary.processingTime = Date.now() - startTime;
    }

    return result;
  }

  private async batchImport(notes: Note[], options: ImportOptions, result: ImportResult): Promise<ImportResult> {
    const batchId = this.generateBatchId();
    const batchSize = options.batchSize || 100;
    const totalBatches = Math.ceil(notes.length / batchSize);
    
    const batchOperation: BatchOperation = {
      id: batchId,
      type: 'import',
      status: 'processing',
      progress: 0,
      totalItems: notes.length,
      processedItems: 0,
      createdAt: new Date()
    };

    this.batchOperations.set(batchId, batchOperation);

    try {
      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, notes.length);
        const batchNotes = notes.slice(start, end);
        
        for (const note of batchNotes) {
          try {
            if (options.validateContent) {
              const validation = this.validateNote(note, options.validationRules || this.validationRules);
              result.validationResults?.push(validation);
              
              if (!validation.isValid) {
                result.warnings.push(`Note "${note.title}": ${validation.errors.join(', ')}`);
              }
            }

            if (options.dryRun) {
              result.importedNotes.push(note);
              result.summary.imported++;
            } else {
              const processedNote = this.processNote(note, options);
              result.importedNotes.push(processedNote);
              result.summary.imported++;
            }
          } catch (error) {
            result.errors.push(`Failed to import note "${note.title}": ${error}`);
            result.summary.errors++;
          }
        }
        
        batchOperation.processedItems = end;
        batchOperation.progress = (end / notes.length) * 100;
        
        if (options.progressCallback) {
          options.progressCallback(batchOperation.progress);
        }
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      batchOperation.status = 'completed';
      batchOperation.result = result;
      batchOperation.completedAt = new Date();
      
      return result;
    } catch (error) {
      batchOperation.status = 'failed';
      batchOperation.error = error as string;
      throw error;
    }
  }

  // Enhanced validation with custom rules
  private validateNote(note: Note, rules: ValidationRule[]): ValidationResult {
    const validation: ValidationResult = {
      noteId: note.id,
      noteTitle: note.title,
      isValid: true,
      errors: [],
      warnings: []
    };

    for (const rule of rules) {
      const value = note[rule.field];
      
      switch (rule.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            validation.errors.push(rule.message);
            validation.isValid = false;
          }
          break;
        case 'minLength':
          if (typeof value === 'string' && value.length < rule.value) {
            validation.errors.push(rule.message);
            validation.isValid = false;
          }
          break;
        case 'maxLength':
          if (typeof value === 'string' && value.length > rule.value) {
            validation.warnings.push(rule.message);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
            validation.errors.push(rule.message);
            validation.isValid = false;
          }
          break;
        case 'custom':
          if (typeof rule.value === 'function' && !rule.value(value, note)) {
            validation.errors.push(rule.message);
            validation.isValid = false;
          }
          break;
      }
    }

    return validation;
  }

  private initializeDefaultValidationRules(): void {
    this.validationRules = [
      {
        field: 'title',
        type: 'required',
        value: true,
        message: 'Title is required'
      },
      {
        field: 'title',
        type: 'minLength',
        value: 3,
        message: 'Title must be at least 3 characters long'
      },
      {
        field: 'title',
        type: 'maxLength',
        value: 200,
        message: 'Title is very long (max 200 characters recommended)'
      },
      {
        field: 'content',
        type: 'required',
        value: true,
        message: 'Content is required'
      },
      {
        field: 'content',
        type: 'minLength',
        value: 10,
        message: 'Content must be at least 10 characters long'
      },
      {
        field: 'content',
        type: 'custom',
        value: (content: string) => !content.includes('spam') && !content.includes('advertisement'),
        message: 'Content appears to be spam or advertisement'
      }
    ];
  }

  // Enhanced template management
  private initializeDefaultTemplates(): void {
    const defaultTemplates: ExportTemplate[] = [
      {
        id: 'simple-markdown',
        name: 'Simple Markdown',
        description: 'Basic markdown export with title and content',
        format: 'markdown',
        template: `# {{title}}

{{content}}

---
*Exported on {{exportDate}}*`,
        variables: ['title', 'content', 'exportDate'],
        isDefault: true,
        category: 'basic',
        tags: ['markdown', 'simple']
      },
      {
        id: 'academic-paper',
        name: 'Academic Paper',
        description: 'Formatted for academic writing',
        format: 'markdown',
        template: `# {{title}}

**Abstract:** {{content.substring(0, 200)}}...

## Content

{{content}}

## Tags
{{#each tags}}
- {{this}}
{{/each}}

---
*Created: {{createdAt}} | Updated: {{updatedAt}}*`,
        variables: ['title', 'content', 'tags', 'createdAt', 'updatedAt'],
        category: 'academic',
        tags: ['academic', 'research', 'paper']
      },
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Structured meeting notes format',
        format: 'markdown',
        template: `# Meeting: {{title}}

**Date:** {{createdAt}}
**Participants:** [Add participants here]

## Agenda
[Add agenda items here]

## Notes
{{content}}

## Action Items
[Add action items here]

## Tags
{{#each tags}}
- {{this}}
{{/each}}`,
        variables: ['title', 'content', 'tags', 'createdAt'],
        category: 'business',
        tags: ['meeting', 'business', 'notes']
      },
      {
        id: 'blog-post',
        name: 'Blog Post',
        description: 'Formatted for blog publishing',
        format: 'markdown',
        template: `# {{title}}

*Published on {{exportDate}}*

{{content}}

---

**Tags:** {{#each tags}}#{{this}} {{/each}}

*This post was exported from ZettelView*`,
        variables: ['title', 'content', 'tags', 'exportDate'],
        category: 'publishing',
        tags: ['blog', 'publishing', 'markdown']
      },
      {
        id: 'research-notes',
        name: 'Research Notes',
        description: 'Structured research note format',
        format: 'markdown',
        template: `# Research: {{title}}

## Summary
{{content.substring(0, 300)}}...

## Key Findings
[Add key findings here]

## Methodology
[Add methodology details here]

## Sources
[Add sources here]

## Tags
{{#each tags}}
- {{this}}
{{/each}}

---
*Research conducted on {{createdAt}}*`,
        variables: ['title', 'content', 'tags', 'createdAt'],
        category: 'research',
        tags: ['research', 'methodology', 'findings']
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }

  // Batch operation management
  getBatchOperations(): BatchOperation[] {
    return Array.from(this.batchOperations.values());
  }

  getBatchOperation(id: string): BatchOperation | undefined {
    return this.batchOperations.get(id);
  }

  cancelBatchOperation(id: string): boolean {
    const operation = this.batchOperations.get(id);
    if (operation && operation.status === 'processing') {
      operation.status = 'failed';
      operation.error = 'Cancelled by user';
      return true;
    }
    return false;
  }

  clearCompletedOperations(): void {
    for (const [id, operation] of this.batchOperations.entries()) {
      if (operation.status === 'completed' || operation.status === 'failed') {
        this.batchOperations.delete(id);
      }
    }
  }

  // Enhanced template management
  getTemplatesByCategory(category?: string): ExportTemplate[] {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(template => template.category === category);
    }
    return templates;
  }

  getTemplateCategories(): string[] {
    const categories = new Set<string>();
    for (const template of this.templates.values()) {
      if (template.category) {
        categories.add(template.category);
      }
    }
    return Array.from(categories);
  }

  searchTemplates(query: string): ExportTemplate[] {
    const templates = Array.from(this.templates.values());
    const queryLower = query.toLowerCase();
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(queryLower) ||
      template.description.toLowerCase().includes(queryLower) ||
      template.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  // ... existing code ...
  private async formatNotes(notes: Note[], format: string, options: ExportOptions): Promise<string> {
    switch (format) {
      case 'json':
        return this.exportToJSON(notes, options);
      case 'markdown':
        return this.exportToMarkdown(notes, options);
      case 'html':
        return this.exportToHTML(notes, options);
      case 'txt':
        return this.exportToTXT(notes, options);
      case 'csv':
        return this.exportToCSV(notes, options);
      case 'xml':
        return this.exportToXML(notes, options);
      case 'yaml':
        return this.exportToYAML(notes, options);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private exportToJSON(notes: Note[], options: ExportOptions): string {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalNotes: notes.length,
      notes: notes.map(note => this.serializeNote(note, options))
    };

    return JSON.stringify(exportData, null, 2);
  }

  private exportToMarkdown(notes: Note[], options: ExportOptions): string {
    let markdown = `# Notes Export\n\n`;
    markdown += `Exported on: ${new Date().toLocaleString()}\n`;
    markdown += `Total notes: ${notes.length}\n\n`;
    markdown += `---\n\n`;

    for (const note of notes) {
      markdown += `# ${note.title}\n\n`;
      
      if (options.includeMetadata) {
        markdown += `**ID:** ${note.id}\n`;
        markdown += `**Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
        markdown += `**Updated:** ${new Date(note.updatedAt).toLocaleString()}\n`;
        if (options.includeTags && note.tags.length > 0) {
          markdown += `**Tags:** ${note.tags.map(tag => `#${tag}`).join(' ')}\n`;
        }
        markdown += `\n`;
      }

      markdown += `${note.content}\n\n`;
      markdown += `---\n\n`;
    }

    return markdown;
  }

  private exportToHTML(notes: Note[], options: ExportOptions): string {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .note { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .metadata { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .tags { color: #007bff; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Notes Export</h1>
    <p>Exported on: ${new Date().toLocaleString()}</p>
    <p>Total notes: ${notes.length}</p>
    <hr>`;

    for (const note of notes) {
      html += `<div class="note">
        <h2>${note.title}</h2>`;
      
      if (options.includeMetadata) {
        html += `<div class="metadata">
          <strong>ID:</strong> ${note.id}<br>
          <strong>Created:</strong> ${new Date(note.createdAt).toLocaleString()}<br>
          <strong>Updated:</strong> ${new Date(note.updatedAt).toLocaleString()}`;
        
        if (options.includeTags && note.tags.length > 0) {
          html += `<br><strong>Tags:</strong> <span class="tags">${note.tags.map(tag => `#${tag}`).join(' ')}</span>`;
        }
        
        html += `</div>`;
      }

      html += `<div class="content">${note.content.replace(/\n/g, '<br>')}</div>
    </div>`;
    }

    html += `</body></html>`;
    return html;
  }

  private exportToTXT(notes: Note[], options: ExportOptions): string {
    let txt = `NOTES EXPORT\n\n`;
    txt += `Exported on: ${new Date().toLocaleString()}\n`;
    txt += `Total notes: ${notes.length}\n\n`;
    txt += `==========================================\n\n`;

    for (const note of notes) {
      txt += `TITLE: ${note.title}\n`;
      
      if (options.includeMetadata) {
        txt += `ID: ${note.id}\n`;
        txt += `CREATED: ${new Date(note.createdAt).toLocaleString()}\n`;
        txt += `UPDATED: ${new Date(note.updatedAt).toLocaleString()}\n`;
        if (options.includeTags && note.tags.length > 0) {
          txt += `TAGS: ${note.tags.join(', ')}\n`;
        }
        txt += `\n`;
      }

      txt += `CONTENT:\n${note.content}\n\n`;
      txt += `==========================================\n\n`;
    }

    return txt;
  }

  private exportToCSV(notes: Note[], options: ExportOptions): string {
    const headers = ['Title', 'Content'];
    if (options.includeMetadata) {
      headers.push('ID', 'Created', 'Updated');
    }
    if (options.includeTags) {
      headers.push('Tags');
    }

    let csv = headers.join(',') + '\n';

    for (const note of notes) {
      const row = [
        `"${note.title.replace(/"/g, '""')}"`,
        `"${note.content.replace(/"/g, '""')}"`
      ];

      if (options.includeMetadata) {
        row.push(
          `"${note.id}"`,
          `"${new Date(note.createdAt).toISOString()}"`,
          `"${new Date(note.updatedAt).toISOString()}"`
        );
      }
      if (options.includeTags) {
        row.push(`"${note.tags.join(';')}"`);
      }

      csv += row.join(',') + '\n';
    }

    return csv;
  }

  private exportToXML(notes: Note[], options: ExportOptions): string {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<notes-export version="1.0" exported-at="${new Date().toISOString()}">
  <metadata>
    <total-notes>${notes.length}</total-notes>
  </metadata>
  <notes>`;

    for (const note of notes) {
      xml += `
    <note>
      <title>${this.escapeXML(note.title)}</title>
      <content>${this.escapeXML(note.content)}</content>`;
      
      if (options.includeMetadata) {
        xml += `
      <id>${note.id}</id>
      <created>${new Date(note.createdAt).toISOString()}</created>
      <updated>${new Date(note.updatedAt).toISOString()}</updated>`;
      }
      
      if (options.includeTags && note.tags.length > 0) {
        xml += `
      <tags>${note.tags.map(tag => `<tag>${this.escapeXML(tag)}</tag>`).join('')}</tags>`;
      }
      
      xml += `
    </note>`;
    }

    xml += `
  </notes>
</notes-export>`;

    return xml;
  }

  private exportToYAML(notes: Note[], options: ExportOptions): string {
    let yaml = `# Notes Export
version: "1.0"
exported_at: "${new Date().toISOString()}"
total_notes: ${notes.length}
notes:`;

    for (const note of notes) {
      yaml += `
  - title: "${note.title.replace(/"/g, '\\"')}"
    content: |
      ${note.content.split('\n').map(line => `      ${line}`).join('\n')}`;
      
      if (options.includeMetadata) {
        yaml += `
    id: "${note.id}"
    created: "${new Date(note.createdAt).toISOString()}"
    updated: "${new Date(note.updatedAt).toISOString()}"`;
      }
      
      if (options.includeTags && note.tags.length > 0) {
        yaml += `
    tags: [${note.tags.map(tag => `"${tag}"`).join(', ')}]`;
      }
    }

    return yaml;
  }

  // ... existing code ...
  private async applyTemplate(notes: Note[], templateId: string, options: ExportOptions): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let result = '';
    for (const note of notes) {
      let noteContent = template.template;
      
      // Replace variables
      noteContent = noteContent.replace(/\{\{title\}\}/g, note.title);
      noteContent = noteContent.replace(/\{\{content\}\}/g, note.content);
      noteContent = noteContent.replace(/\{\{id\}\}/g, note.id);
      noteContent = noteContent.replace(/\{\{createdAt\}\}/g, new Date(note.createdAt).toLocaleString());
      noteContent = noteContent.replace(/\{\{updatedAt\}\}/g, new Date(note.updatedAt).toLocaleString());
      noteContent = noteContent.replace(/\{\{exportDate\}\}/g, new Date().toLocaleString());
      
      // Handle tags
      if (noteContent.includes('{{#each tags}}')) {
        const tagSection = note.tags.map(tag => `- ${tag}`).join('\n');
        noteContent = noteContent.replace(/\{\{#each tags\}\}([\s\S]*?)\{\{\/each\}\}/g, tagSection);
      }
      
      result += noteContent + '\n\n---\n\n';
    }

    return result;
  }

  private serializeNote(note: Note, options: ExportOptions): any {
    const serialized: any = {
      title: note.title,
      content: note.content
    };

    if (options.includeMetadata) {
      serialized.id = note.id;
      serialized.createdAt = note.createdAt;
      serialized.updatedAt = note.updatedAt;
    }

    if (options.includeTags) {
      serialized.tags = note.tags;
    }

    return serialized;
  }

  private deserializeNote(data: any): Note {
    return {
      id: data.id || this.generateId(),
      title: data.title || 'Untitled',
      content: data.content || '',
      tags: data.tags || [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  }

  private processNote(note: Note, options: ImportOptions): Note {
    let processedNote = { ...note };

    // Apply tag mapping
    if (options.tagMapping) {
      processedNote.tags = note.tags.map(tag => options.tagMapping!.get(tag) || tag);
    }

    // Apply category mapping (if implemented)
    if (options.categoryMapping) {
      // Implementation would depend on category system
    }

    return processedNote;
  }

  private extractTags(content: string): string[] {
    const tagRegex = /#(\w+)/g;
    const tags: string[] = [];
    let match;
    
    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }
    
    return [...new Set(tags)];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateBatchId(): string {
    return 'batch-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private parseJSON(content: string): Note[] {
    const data = JSON.parse(content);
    if (data.notes && Array.isArray(data.notes)) {
      return data.notes.map((note: any) => this.deserializeNote(note));
    }
    throw new Error('Invalid JSON format: missing notes array');
  }

  private parseMarkdown(content: string): Note[] {
    const notes: Note[] = [];
    const sections = content.split(/^#\s+/m).slice(1);

    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      if (title && content) {
        notes.push({
          id: this.generateId(),
          title,
          content,
          tags: this.extractTags(content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return notes;
  }

  private parseHTML(content: string): Note[] {
    const notes: Note[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const noteElements = doc.querySelectorAll('.note, div[class*="note"]');

    for (const element of noteElements) {
      const titleElement = element.querySelector('h1, h2, h3');
      const contentElement = element.querySelector('.content, p');
      
      if (titleElement && contentElement) {
        const title = titleElement.textContent?.trim() || '';
        const content = contentElement.textContent?.trim() || '';
        
        if (title && content) {
          notes.push({
            id: this.generateId(),
            title,
            content,
            tags: this.extractTags(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    return notes;
  }

  private parseTXT(content: string): Note[] {
    const notes: Note[] = [];
    const sections = content.split(/^TITLE:\s+/m).slice(1);

    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0].trim();
      const contentStart = lines.findIndex(line => line.startsWith('CONTENT:'));
      
      if (contentStart !== -1) {
        const content = lines.slice(contentStart + 1).join('\n').trim();
        
        if (title && content) {
          notes.push({
            id: this.generateId(),
            title,
            content,
            tags: this.extractTags(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    return notes;
  }

  private parseCSV(content: string): Note[] {
    const notes: Note[] = [];
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values = this.parseCSVLine(line);
      const title = values[headers.indexOf('Title')] || '';
      const content = values[headers.indexOf('Content')] || '';
      
      if (title && content) {
        notes.push({
          id: this.generateId(),
          title,
          content,
          tags: this.extractTags(content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return notes;
  }

  private parseXML(content: string): Note[] {
    const notes: Note[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const noteElements = doc.querySelectorAll('note');

    for (const element of noteElements) {
      const title = element.querySelector('title')?.textContent?.trim() || '';
      const content = element.querySelector('content')?.textContent?.trim() || '';
      
      if (title && content) {
        notes.push({
          id: this.generateId(),
          title,
          content,
          tags: this.extractTags(content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return notes;
  }

  private parseYAML(content: string): Note[] {
    const notes: Note[] = [];
    const sections = content.split(/^\s*-\s*title:\s*"/m).slice(1);

    for (const section of sections) {
      const titleMatch = section.match(/^([^"]+)"/);
      const contentMatch = section.match(/content:\s*\|\s*\n((?:\s{6,}.*\n?)*)/);
      
      if (titleMatch && contentMatch) {
        const title = titleMatch[1].trim();
        const content = contentMatch[1].split('\n').map(line => line.replace(/^\s{6,}/, '')).join('\n').trim();
        
        if (title && content) {
          notes.push({
            id: this.generateId(),
            title,
            content,
            tags: this.extractTags(content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    return notes;
  }

  private parseRoam(content: string): Note[] {
    const notes: Note[] = [];
    const data = JSON.parse(content);
    
    if (data.graph && data.graph.nodes) {
      for (const node of data.graph.nodes) {
        if (node.text) {
          const title = node.text.split('\n')[0];
          const content = node.text;
          
          notes.push({
            id: this.generateId(),
            title,
            content,
            tags: this.extractTags(content),
            createdAt: new Date(node.create_time || Date.now()).toISOString(),
            updatedAt: new Date(node.edit_time || Date.now()).toISOString()
          });
        }
      }
    }

    return notes;
  }

  private parseEvernote(content: string): Note[] {
    const notes: Note[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const noteElements = doc.querySelectorAll('note');

    for (const element of noteElements) {
      const title = element.querySelector('title')?.textContent?.trim() || '';
      const content = element.querySelector('content')?.textContent?.trim() || '';
      
      if (title && content) {
        notes.push({
          id: this.generateId(),
          title,
          content,
          tags: this.extractTags(content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return notes;
  }

  private parseObsidian(content: string): Note[] {
    const notes: Note[] = [];
    const files = content.split(/^---\n/).slice(1);

    for (const file of files) {
      const lines = file.split('\n');
      const title = lines[0].replace(/^#\s+/, '').trim();
      const content = lines.slice(1).join('\n').trim();
      
      if (title && content) {
        notes.push({
          id: this.generateId(),
          title,
          content,
          tags: this.extractTags(content),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    return notes;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  private async compressContent(content: string): Promise<string> {
    // In a real implementation, this would use compression libraries
    return btoa(content);
  }

  private async encryptContent(content: string, password: string): Promise<string> {
    // In a real implementation, this would use encryption libraries
    return btoa(content + password);
  }

  // Public API methods
  getTemplates(): ExportTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: ExportTemplate): void {
    this.templates.set(template.id, template);
  }

  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  getTemplate(templateId: string): ExportTemplate | undefined {
    return this.templates.get(templateId);
  }

  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  removeValidationRule(index: number): boolean {
    if (index >= 0 && index < this.validationRules.length) {
      this.validationRules.splice(index, 1);
      return true;
    }
    return false;
  }

  getValidationRules(): ValidationRule[] {
    return [...this.validationRules];
  }
} 