import { Note } from '../types/domain';

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html' | 'txt' | 'roam' | 'evernote' | 'obsidian' | 'notion' | 'csv';
  includeMetadata: boolean;
  includeTags: boolean;
  includeTimestamps: boolean;
  batchSize?: number;
  template?: string;
}

export interface ImportOptions {
  format: 'json' | 'markdown' | 'html' | 'txt' | 'roam' | 'evernote' | 'obsidian' | 'notion' | 'csv';
  mergeStrategy: 'replace' | 'merge' | 'skip';
  tagMapping?: Record<string, string>;
  dateFormat?: string;
  validateContent?: boolean;
}

export interface ExportResult {
  success: boolean;
  data: string | Blob;
  filename: string;
  format: string;
  noteCount: number;
  metadata?: {
    exportDate: string;
    version: string;
    totalSize: number;
  };
}

export interface ImportResult {
  success: boolean;
  notes: Note[];
  errors: string[];
  warnings: string[];
  metadata?: {
    importDate: string;
    sourceFormat: string;
    totalImported: number;
    skippedCount: number;
  };
}

export interface FormatConverter {
  name: string;
  extensions: string[];
  export: (notes: Note[], options: ExportOptions) => string;
  import: (content: string, options: ImportOptions) => Note[];
  validate: (content: string) => boolean;
}

class ExportImportService {
  private converters: Map<string, FormatConverter> = new Map();
  private supportedFormats: string[] = [];

  constructor() {
    this.initializeConverters();
  }

  private initializeConverters(): void {
    // JSON Converter
    this.registerConverter({
      name: 'JSON',
      extensions: ['.json'],
      export: this.exportToJSON.bind(this),
      import: this.importFromJSON.bind(this),
      validate: this.validateJSON.bind(this)
    });

    // Markdown Converter
    this.registerConverter({
      name: 'Markdown',
      extensions: ['.md', '.markdown'],
      export: this.exportToMarkdown.bind(this),
      import: this.importFromMarkdown.bind(this),
      validate: this.validateMarkdown.bind(this)
    });

    // HTML Converter
    this.registerConverter({
      name: 'HTML',
      extensions: ['.html', '.htm'],
      export: this.exportToHTML.bind(this),
      import: this.importFromHTML.bind(this),
      validate: this.validateHTML.bind(this)
    });

    // Plain Text Converter
    this.registerConverter({
      name: 'Plain Text',
      extensions: ['.txt'],
      export: this.exportToText.bind(this),
      import: this.importFromText.bind(this),
      validate: this.validateText.bind(this)
    });

    // Roam Research Converter
    this.registerConverter({
      name: 'Roam Research',
      extensions: ['.json'],
      export: this.exportToRoam.bind(this),
      import: this.importFromRoam.bind(this),
      validate: this.validateRoam.bind(this)
    });

    // Evernote Converter
    this.registerConverter({
      name: 'Evernote',
      extensions: ['.enex'],
      export: this.exportToEvernote.bind(this),
      import: this.importFromEvernote.bind(this),
      validate: this.validateEvernote.bind(this)
    });

    // Obsidian Converter
    this.registerConverter({
      name: 'Obsidian',
      extensions: ['.md'],
      export: this.exportToObsidian.bind(this),
      import: this.importFromObsidian.bind(this),
      validate: this.validateObsidian.bind(this)
    });

    // Notion Converter
    this.registerConverter({
      name: 'Notion',
      extensions: ['.html'],
      export: this.exportToNotion.bind(this),
      import: this.importFromNotion.bind(this),
      validate: this.validateNotion.bind(this)
    });

    // CSV Converter
    this.registerConverter({
      name: 'CSV',
      extensions: ['.csv'],
      export: this.exportToCSV.bind(this),
      import: this.importFromCSV.bind(this),
      validate: this.validateCSV.bind(this)
    });
  }

  private registerConverter(converter: FormatConverter): void {
    this.converters.set(converter.name.toLowerCase(), converter);
    this.supportedFormats.push(converter.name);
  }

  // Export notes to specified format
  exportNotes(notes: Note[], options: ExportOptions): ExportResult {
    try {
      const converter = this.converters.get(options.format);
      if (!converter) {
        throw new Error(`Unsupported export format: ${options.format}`);
      }

      const data = converter.export(notes, options);
      const filename = this.generateFilename(options.format, notes.length);
      const metadata = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        totalSize: data.length
      };

      return {
        success: true,
        data,
        filename,
        format: options.format,
        noteCount: notes.length,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        data: '',
        filename: '',
        format: options.format,
        noteCount: 0
      };
    }
  }

  // Import notes from specified format
  importNotes(content: string, options: ImportOptions): ImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let notes: Note[] = [];

    try {
      const converter = this.converters.get(options.format);
      if (!converter) {
        throw new Error(`Unsupported import format: ${options.format}`);
      }

      // Validate content
      if (options.validateContent && !converter.validate(content)) {
        throw new Error(`Invalid ${options.format} format`);
      }

      // Import notes
      notes = converter.import(content, options);

      // Apply merge strategy
      notes = this.applyMergeStrategy(notes, options.mergeStrategy);

      // Apply tag mapping
      if (options.tagMapping) {
        notes = this.applyTagMapping(notes, options.tagMapping);
      }

      const metadata = {
        importDate: new Date().toISOString(),
        sourceFormat: options.format,
        totalImported: notes.length,
        skippedCount: 0
      };

      return {
        success: true,
        notes,
        errors,
        warnings,
        metadata
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown import error');
      return {
        success: false,
        notes: [],
        errors,
        warnings
      };
    }
  }

  // Get supported formats
  getSupportedFormats(): string[] {
    return this.supportedFormats;
  }

  // Get converter for specific format
  getConverter(format: string): FormatConverter | undefined {
    return this.converters.get(format.toLowerCase());
  }

  // Generate filename for export
  private generateFilename(format: string, noteCount: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = this.getExtensionForFormat(format);
    return `zettelview-export-${timestamp}-${noteCount}-notes${extension}`;
  }

  // Get file extension for format
  private getExtensionForFormat(format: string): string {
    const converter = this.converters.get(format.toLowerCase());
    return converter ? converter.extensions[0] : '.txt';
  }

  // Apply merge strategy
  private applyMergeStrategy(notes: Note[], strategy: string): Note[] {
    switch (strategy) {
      case 'replace':
        return notes;
      case 'merge':
        // Merge with existing notes (would need access to existing notes)
        return notes;
      case 'skip':
        // Skip duplicates (would need access to existing notes)
        return notes;
      default:
        return notes;
    }
  }

  // Apply tag mapping
  private applyTagMapping(notes: Note[], tagMapping: Record<string, string>): Note[] {
    return notes.map(note => ({
      ...note,
      tags: note.tags.map(tag => tagMapping[tag] || tag)
    }));
  }

  // JSON Export/Import
  private exportToJSON(notes: Note[], options: ExportOptions): string {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        body: note.body,
        tags: options.includeTags ? note.tags : [],
        createdAt: options.includeTimestamps ? note.createdAt : undefined,
        updatedAt: options.includeTimestamps ? note.updatedAt : undefined,
        metadata: options.includeMetadata ? {
          wordCount: note.body.split(/\s+/).length,
          characterCount: note.body.length,
          tagCount: note.tags.length
        } : undefined
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  private importFromJSON(content: string, options: ImportOptions): Note[] {
    const data = JSON.parse(content);
    const notes: Note[] = [];

    if (data.notes && Array.isArray(data.notes)) {
      data.notes.forEach((noteData: any, index: number) => {
        const note: Note = {
          id: noteData.id || `imported-${Date.now()}-${index}`,
          title: noteData.title || `Imported Note ${index + 1}`,
          body: noteData.body || '',
          tags: noteData.tags || [],
          createdAt: noteData.createdAt ? new Date(noteData.createdAt) : new Date(),
          updatedAt: noteData.updatedAt ? new Date(noteData.updatedAt) : new Date()
        };
        notes.push(note);
      });
    }

    return notes;
  }

  private validateJSON(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  // Markdown Export/Import
  private exportToMarkdown(notes: Note[], options: ExportOptions): string {
    let markdown = '# ZettelView Export\n\n';
    markdown += `Export Date: ${new Date().toISOString()}\n`;
    markdown += `Total Notes: ${notes.length}\n\n`;

    notes.forEach((note, index) => {
      markdown += `## ${index + 1}. ${note.title}\n\n`;
      
      if (options.includeTags && note.tags.length > 0) {
        markdown += `**Tags:** ${note.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
      }
      
      if (options.includeTimestamps) {
        markdown += `**Created:** ${note.createdAt.toISOString()}\n`;
        markdown += `**Updated:** ${note.updatedAt.toISOString()}\n\n`;
      }
      
      markdown += `${note.body}\n\n`;
      markdown += '---\n\n';
    });

    return markdown;
  }

  private importFromMarkdown(content: string, options: ImportOptions): Note[] {
    const notes: Note[] = [];
    const sections = content.split(/\n##\s+/);
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.split('\n');
      const titleLine = lines[0];
      const title = titleLine.replace(/^\d+\.\s*/, '').trim();
      
      let body = '';
      let tags: string[] = [];
      let inBody = false;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('**Tags:**')) {
          const tagMatch = line.match(/#(\w+)/g);
          tags = tagMatch ? tagMatch.map(tag => tag.slice(1)) : [];
        } else if (line.startsWith('**') || line === '---') {
          continue;
        } else if (line) {
          inBody = true;
          body += line + '\n';
        }
      }
      
      const note: Note = {
        id: `imported-md-${Date.now()}-${index}`,
        title,
        body: body.trim(),
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      notes.push(note);
    });

    return notes;
  }

  private validateMarkdown(content: string): boolean {
    return content.includes('#') && content.length > 0;
  }

  // HTML Export/Import
  private exportToHTML(notes: Note[], options: ExportOptions): string {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ZettelView Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .note { margin-bottom: 30px; border-bottom: 1px solid #ccc; padding-bottom: 20px; }
        .title { font-size: 24px; color: #333; margin-bottom: 10px; }
        .tags { color: #666; margin-bottom: 10px; }
        .timestamp { color: #999; font-size: 12px; margin-bottom: 10px; }
        .body { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>ZettelView Export</h1>
    <p><strong>Export Date:</strong> ${new Date().toISOString()}</p>
    <p><strong>Total Notes:</strong> ${notes.length}</p>
    <hr>`;

    notes.forEach((note, index) => {
      html += `
    <div class="note">
        <div class="title">${index + 1}. ${this.escapeHtml(note.title)}</div>`;
      
      if (options.includeTags && note.tags.length > 0) {
        html += `
        <div class="tags"><strong>Tags:</strong> ${note.tags.map(tag => `<span style="background: #f0f0f0; padding: 2px 6px; margin: 2px; border-radius: 3px;">${this.escapeHtml(tag)}</span>`).join(' ')}</div>`;
      }
      
      if (options.includeTimestamps) {
        html += `
        <div class="timestamp">
            <strong>Created:</strong> ${note.createdAt.toISOString()}<br>
            <strong>Updated:</strong> ${note.updatedAt.toISOString()}
        </div>`;
      }
      
      html += `
        <div class="body">${this.escapeHtml(note.body).replace(/\n/g, '<br>')}</div>
    </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  private importFromHTML(content: string, options: ImportOptions): Note[] {
    const notes: Note[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    
    const noteElements = doc.querySelectorAll('.note');
    noteElements.forEach((element, index) => {
      const titleElement = element.querySelector('.title');
      const bodyElement = element.querySelector('.body');
      const tagsElement = element.querySelector('.tags');
      
      const title = titleElement ? titleElement.textContent?.replace(/^\d+\.\s*/, '').trim() || `Imported Note ${index + 1}` : `Imported Note ${index + 1}`;
      const body = bodyElement ? bodyElement.textContent?.trim() || '' : '';
      
      let tags: string[] = [];
      if (tagsElement) {
        const tagSpans = tagsElement.querySelectorAll('span');
        tags = Array.from(tagSpans).map(span => span.textContent?.trim() || '').filter(tag => tag);
      }
      
      const note: Note = {
        id: `imported-html-${Date.now()}-${index}`,
        title,
        body,
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      notes.push(note);
    });

    return notes;
  }

  private validateHTML(content: string): boolean {
    return content.includes('<html') && content.includes('</html>');
  }

  // Plain Text Export/Import
  private exportToText(notes: Note[], options: ExportOptions): string {
    let text = 'ZettelView Export\n';
    text += '================\n\n';
    text += `Export Date: ${new Date().toISOString()}\n`;
    text += `Total Notes: ${notes.length}\n\n`;

    notes.forEach((note, index) => {
      text += `${index + 1}. ${note.title}\n`;
      text += '='.repeat(note.title.length + 4) + '\n\n';
      
      if (options.includeTags && note.tags.length > 0) {
        text += `Tags: ${note.tags.join(', ')}\n\n`;
      }
      
      if (options.includeTimestamps) {
        text += `Created: ${note.createdAt.toISOString()}\n`;
        text += `Updated: ${note.updatedAt.toISOString()}\n\n`;
      }
      
      text += `${note.body}\n\n`;
      text += '-'.repeat(50) + '\n\n';
    });

    return text;
  }

  private importFromText(content: string, options: ImportOptions): Note[] {
    const notes: Note[] = [];
    const sections = content.split(/\n\d+\.\s+/);
    
    sections.slice(1).forEach((section, index) => {
      const lines = section.split('\n');
      const title = lines[0].trim();
      
      let body = '';
      let tags: string[] = [];
      let inBody = false;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('Tags:')) {
          const tagMatch = line.match(/Tags:\s*(.+)/);
          tags = tagMatch ? tagMatch[1].split(',').map(tag => tag.trim()) : [];
        } else if (line.startsWith('Created:') || line.startsWith('Updated:') || line.match(/^=+$/) || line.match(/^-+$/)) {
          continue;
        } else if (line) {
          inBody = true;
          body += line + '\n';
        }
      }
      
      const note: Note = {
        id: `imported-txt-${Date.now()}-${index}`,
        title,
        body: body.trim(),
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      notes.push(note);
    });

    return notes;
  }

  private validateText(content: string): boolean {
    return content.length > 0 && content.includes('ZettelView Export');
  }

  // Roam Research Export/Import
  private exportToRoam(notes: Note[], options: ExportOptions): string {
    const roamData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      pages: notes.map(note => ({
        title: note.title,
        children: [
          {
            string: note.body,
            children: note.tags.map(tag => ({
              string: `[[${tag}]]`,
              children: []
            }))
          }
        ]
      }))
    };

    return JSON.stringify(roamData, null, 2);
  }

  private importFromRoam(content: string, options: ImportOptions): Note[] {
    const notes: Note[] = [];
    const data = JSON.parse(content);
    
    if (data.pages && Array.isArray(data.pages)) {
      data.pages.forEach((page: any, index: number) => {
        let body = '';
        let tags: string[] = [];
        
        if (page.children && Array.isArray(page.children)) {
          page.children.forEach((child: any) => {
            if (child.string) {
              body += child.string + '\n';
              
              // Extract tags from [[tag]] format
              const tagMatches = child.string.match(/\[\[([^\]]+)\]\]/g);
              if (tagMatches) {
                tags.push(...tagMatches.map((tag: string) => tag.slice(2, -2)));
              }
            }
          });
        }
        
        const note: Note = {
          id: `imported-roam-${Date.now()}-${index}`,
          title: page.title || `Imported Note ${index + 1}`,
          body: body.trim(),
          tags: [...new Set(tags)], // Remove duplicates
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        notes.push(note);
      });
    }

    return notes;
  }

  private validateRoam(content: string): boolean {
    try {
      const data = JSON.parse(content);
      return data.pages && Array.isArray(data.pages);
    } catch {
      return false;
    }
  }

  // Evernote Export/Import
  private exportToEvernote(notes: Note[], options: ExportOptions): string {
    let enex = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-export SYSTEM "http://xml.evernote.com/pub/evernote-export3.dtd">
<en-export export-date="${new Date().toISOString()}" version="3.0">
`;

    notes.forEach(note => {
      enex += `  <note>
    <title>${this.escapeXml(note.title)}</title>
    <content><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>${this.escapeXml(note.body)}</en-note>]]></content>`;
      
      if (options.includeTags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          enex += `
    <tag>${this.escapeXml(tag)}</tag>`;
        });
      }
      
      if (options.includeTimestamps) {
        enex += `
    <created>${note.createdAt.toISOString()}</created>
    <updated>${note.updatedAt.toISOString()}</updated>`;
      }
      
      enex += `
  </note>
`;
    });

    enex += `</en-export>`;
    return enex;
  }

  private importFromEvernote(content: string, options: ImportOptions): Note[] {
    const notes: Note[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    
    const noteElements = doc.querySelectorAll('note');
    noteElements.forEach((element, index) => {
      const titleElement = element.querySelector('title');
      const contentElement = element.querySelector('content');
      const tagElements = element.querySelectorAll('tag');
      
      const title = titleElement ? titleElement.textContent?.trim() || `Imported Note ${index + 1}` : `Imported Note ${index + 1}`;
      const body = contentElement ? this.extractEvernoteContent(contentElement.textContent || '') : '';
      const tags = Array.from(tagElements).map(tag => tag.textContent?.trim() || '').filter(tag => tag);
      
      const note: Note = {
        id: `imported-evernote-${Date.now()}-${index}`,
        title,
        body,
        tags,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      notes.push(note);
    });

    return notes;
  }

  private extractEvernoteContent(content: string): string {
    // Extract text content from Evernote's XML format
    const textMatch = content.match(/<en-note>(.*?)<\/en-note>/s);
    if (textMatch) {
      return textMatch[1]
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
    }
    return content;
  }

  private validateEvernote(content: string): boolean {
    return content.includes('<en-export') && content.includes('</en-export>');
  }

  // Obsidian Export/Import
  private exportToObsidian(notes: Note[], options: ExportOptions): string {
    let markdown = '';
    
    notes.forEach((note, index) => {
      markdown += `# ${note.title}\n\n`;
      
      if (options.includeTags && note.tags.length > 0) {
        markdown += `Tags: ${note.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
      }
      
      if (options.includeTimestamps) {
        markdown += `Created: ${note.createdAt.toISOString()}\n`;
        markdown += `Updated: ${note.updatedAt.toISOString()}\n\n`;
      }
      
      markdown += `${note.body}\n\n`;
      markdown += '---\n\n';
    });

    return markdown;
  }

  private importFromObsidian(content: string, options: ImportOptions): Note[] {
    // Similar to markdown import but with Obsidian-specific features
    return this.importFromMarkdown(content, options);
  }

  private validateObsidian(content: string): boolean {
    return content.includes('#') && content.length > 0;
  }

  // Notion Export/Import
  private exportToNotion(notes: Note[], options: ExportOptions): string {
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Notion Export - ZettelView</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif; margin: 40px; }
        .notion-page { margin-bottom: 40px; }
        .notion-title { font-size: 32px; font-weight: 700; margin-bottom: 20px; }
        .notion-text { line-height: 1.5; margin-bottom: 16px; }
        .notion-tags { margin-bottom: 16px; }
        .notion-tag { display: inline-block; background: #f1f1f1; padding: 4px 8px; margin: 2px; border-radius: 3px; font-size: 14px; }
    </style>
</head>
<body>`;

    notes.forEach((note, index) => {
      html += `
    <div class="notion-page">
        <div class="notion-title">${this.escapeHtml(note.title)}</div>`;
      
      if (options.includeTags && note.tags.length > 0) {
        html += `
        <div class="notion-tags">${note.tags.map(tag => `<span class="notion-tag">${this.escapeHtml(tag)}</span>`).join('')}</div>`;
      }
      
      html += `
        <div class="notion-text">${this.escapeHtml(note.body).replace(/\n/g, '<br>')}</div>
    </div>`;
    });

    html += `
</body>
</html>`;

    return html;
  }

  private importFromNotion(content: string, options: ImportOptions): Note[] {
    // Similar to HTML import but with Notion-specific parsing
    return this.importFromHTML(content, options);
  }

  private validateNotion(content: string): boolean {
    return content.includes('notion-page') && content.includes('</html>');
  }

  // CSV Export/Import
  private exportToCSV(notes: Note[], options: ExportOptions): string {
    let csv = 'Title,Body,Tags,Created,Updated\n';
    
    notes.forEach(note => {
      const title = `"${note.title.replace(/"/g, '""')}"`;
      const body = `"${note.body.replace(/"/g, '""')}"`;
      const tags = `"${note.tags.join(';')}"`;
      const created = options.includeTimestamps ? `"${note.createdAt.toISOString()}"` : '""';
      const updated = options.includeTimestamps ? `"${note.updatedAt.toISOString()}"` : '""';
      
      csv += `${title},${body},${tags},${created},${updated}\n`;
    });

    return csv;
  }

  private importFromCSV(content: string, options: ImportOptions): Note[] {
    const notes: Note[] = [];
    const lines = content.split('\n');
    
    // Skip header
    lines.slice(1).forEach((line, index) => {
      if (!line.trim()) return;
      
      const columns = this.parseCSVLine(line);
      if (columns.length >= 3) {
        const title = columns[0].replace(/^"|"$/g, '').replace(/""/g, '"');
        const body = columns[1].replace(/^"|"$/g, '').replace(/""/g, '"');
        const tags = columns[2].replace(/^"|"$/g, '').split(';').filter(tag => tag);
        
        const note: Note = {
          id: `imported-csv-${Date.now()}-${index}`,
          title,
          body,
          tags,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        notes.push(note);
      }
    });

    return notes;
  }

  private parseCSVLine(line: string): string[] {
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        columns.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    columns.push(current);
    return columns;
  }

  private validateCSV(content: string): boolean {
    return content.includes(',') && content.includes('\n');
  }

  // Utility methods
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Batch operations
  exportBatch(notes: Note[], options: ExportOptions, batchSize: number = 100): ExportResult[] {
    const results: ExportResult[] = [];
    const batches = this.chunkArray(notes, batchSize);
    
    batches.forEach((batch, index) => {
      const batchOptions = { ...options };
      const result = this.exportNotes(batch, batchOptions);
      result.filename = result.filename.replace('.', `-batch-${index + 1}.`);
      results.push(result);
    });
    
    return results;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Template support
  applyTemplate(template: string, data: any): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}

export const ExportImportService = new ExportImportService(); 