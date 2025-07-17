// Security utilities for handling malicious note files and preventing app crashes

export interface SecurityConfig {
  maxFileSize: number; // in bytes
  maxTitleLength: number;
  maxBodyLength: number;
  maxTagsCount: number;
  maxTagLength: number;
  maxInternalLinksPerNote: number;
  regexTimeoutMs: number;
  allowedFileExtensions: string[];
  blockedPatterns: RegExp[];
}

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxTitleLength: 1000,
  maxBodyLength: 5 * 1024 * 1024, // 5MB
  maxTagsCount: 100,
  maxTagLength: 50,
  maxInternalLinksPerNote: 1000,
  regexTimeoutMs: 5000, // 5 seconds
  allowedFileExtensions: ['.md', '.markdown', '.txt'],
  blockedPatterns: [
    // Catastrophic backtracking patterns
    /(a+)+b/,
    /(a|a)+b/,
    /(a|aa)+b/,
    /(a|a?)+b/,
    /(a|a*)+b/,
    /(a|a+)+b/,
    /(a|a*)*b/,
    /(a|a+)*b/,
    // ReDoS patterns
    /^(a+)+$/,
    /^(a|a)+$/,
    /^(a|a*)+$/,
    /^(a|a+)+$/,
    // Unicode patterns that could cause issues
    /[\u{1F600}-\u{1F64F}]/u, // Emoji ranges
    /[\u{1F300}-\u{1F5FF}]/u, // Miscellaneous symbols
    /[\u{1F680}-\u{1F6FF}]/u, // Transport symbols
    /[\u{1F1E0}-\u{1F1FF}]/u, // Regional indicator symbols
  ]
};

export class SecurityError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class SecurityValidator {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number): void {
    if (size > this.config.maxFileSize) {
      throw new SecurityError(
        `File size (${this.formatBytes(size)}) exceeds maximum allowed size (${this.formatBytes(this.config.maxFileSize)})`,
        'FILE_TOO_LARGE',
        { size, maxSize: this.config.maxFileSize }
      );
    }
  }

  /**
   * Validate note title
   */
  validateTitle(title: string): void {
    if (!title || typeof title !== 'string') {
      throw new SecurityError('Title is required and must be a string', 'INVALID_TITLE');
    }

    if (title.length > this.config.maxTitleLength) {
      throw new SecurityError(
        `Title length (${title.length}) exceeds maximum allowed length (${this.config.maxTitleLength})`,
        'TITLE_TOO_LONG',
        { length: title.length, maxLength: this.config.maxTitleLength }
      );
    }

    // Check for blocked patterns
    this.checkBlockedPatterns(title, 'title');
  }

  /**
   * Validate note body
   */
  validateBody(body: string): void {
    if (!body || typeof body !== 'string') {
      throw new SecurityError('Body is required and must be a string', 'INVALID_BODY');
    }

    if (body.length > this.config.maxBodyLength) {
      throw new SecurityError(
        `Body length (${body.length}) exceeds maximum allowed length (${this.formatBytes(this.config.maxBodyLength)})`,
        'BODY_TOO_LONG',
        { length: body.length, maxLength: this.config.maxBodyLength }
      );
    }

    // Check for blocked patterns
    this.checkBlockedPatterns(body, 'body');

    // Check for excessive internal links
    this.validateInternalLinks(body);
  }

  /**
   * Validate tags
   */
  validateTags(tags: string[]): void {
    if (!Array.isArray(tags)) {
      throw new SecurityError('Tags must be an array', 'INVALID_TAGS');
    }

    if (tags.length > this.config.maxTagsCount) {
      throw new SecurityError(
        `Number of tags (${tags.length}) exceeds maximum allowed count (${this.config.maxTagsCount})`,
        'TOO_MANY_TAGS',
        { count: tags.length, maxCount: this.config.maxTagsCount }
      );
    }

    for (const tag of tags) {
      if (typeof tag !== 'string') {
        throw new SecurityError('All tags must be strings', 'INVALID_TAG_TYPE');
      }

      if (tag.length > this.config.maxTagLength) {
        throw new SecurityError(
          `Tag length (${tag.length}) exceeds maximum allowed length (${this.config.maxTagLength})`,
          'TAG_TOO_LONG',
          { tag, length: tag.length, maxLength: this.config.maxTagLength }
        );
      }

      // Check for blocked patterns
      this.checkBlockedPatterns(tag, 'tag');
    }
  }

  /**
   * Validate internal links in text
   */
  validateInternalLinks(text: string): void {
    const internalLinkPattern = /\[\[([^[\]]+)\]\]/g;
    const matches = text.match(internalLinkPattern);
    
    if (matches && matches.length > this.config.maxInternalLinksPerNote) {
      throw new SecurityError(
        `Number of internal links (${matches.length}) exceeds maximum allowed count (${this.config.maxInternalLinksPerNote})`,
        'TOO_MANY_INTERNAL_LINKS',
        { count: matches.length, maxCount: this.config.maxInternalLinksPerNote }
      );
    }
  }

  /**
   * Check for blocked patterns with timeout
   */
  private checkBlockedPatterns(text: string, context: string): void {
    for (const pattern of this.config.blockedPatterns) {
      try {
        // Use a timeout to prevent regex DoS attacks
        const result = this.runWithTimeout(() => pattern.test(text), this.config.regexTimeoutMs);
        if (result) {
          throw new SecurityError(
            `Blocked pattern detected in ${context}`,
            'BLOCKED_PATTERN',
            { pattern: pattern.source, context }
          );
        }
      } catch (error) {
        if (error instanceof SecurityError) {
          throw error;
        }
        // If it's a timeout, treat as blocked pattern
        throw new SecurityError(
          `Regex timeout detected in ${context} - possible DoS attack`,
          'REGEX_TIMEOUT',
          { pattern: pattern.source, context }
        );
      }
    }
  }

  /**
   * Run function with timeout
   */
  private runWithTimeout<T>(fn: () => T, timeoutMs: number): T {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Operation timed out'));
      }, timeoutMs);

      try {
        const result = fn();
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    }) as T;
  }

  /**
   * Validate complete note object
   */
  validateNote(note: any): void {
    if (!note || typeof note !== 'object') {
      throw new SecurityError('Note must be a valid object', 'INVALID_NOTE');
    }

    this.validateTitle(note.title || '');
    this.validateBody(note.body || '');
    this.validateTags(note.tags || []);
  }

  /**
   * Sanitize note content
   */
  sanitizeNote(note: any): any {
    try {
      // Validate first
      this.validateNote(note);
      
      // Return sanitized version
      return {
        id: this.sanitizeString(note.id),
        title: this.sanitizeString(note.title),
        body: this.sanitizeString(note.body),
        tags: Array.isArray(note.tags) ? note.tags.map(tag => this.sanitizeString(tag)) : [],
        createdAt: this.sanitizeDate(note.createdAt),
        updatedAt: this.sanitizeDate(note.updatedAt)
      };
    } catch (error) {
      throw new SecurityError(
        'Failed to sanitize note',
        'SANITIZATION_FAILED',
        { originalError: error }
      );
    }
  }

  /**
   * Sanitize string content
   */
  private sanitizeString(value: any): string {
    if (typeof value !== 'string') {
      return '';
    }

    // Remove null bytes and other control characters
    let sanitized = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalize Unicode
    sanitized = sanitized.normalize('NFC');
    
    // Limit length
    if (sanitized.length > this.config.maxBodyLength) {
      sanitized = sanitized.substring(0, this.config.maxBodyLength);
    }

    return sanitized;
  }

  /**
   * Sanitize date
   */
  private sanitizeDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return new Date();
  }

  /**
   * Format bytes for human reading
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Create malicious test files for security testing
 */
export class MaliciousFileGenerator {
  /**
   * Generate a file that could cause memory exhaustion
   */
  static generateMemoryExhaustionFile(): string {
    const title = 'Memory Exhaustion Test';
    const body = '# Memory Exhaustion Test\n\n';
    
    // Create a very large string that could exhaust memory
    const largeString = 'A'.repeat(100 * 1024 * 1024); // 100MB of 'A's
    
    return JSON.stringify({
      title,
      body: body + largeString,
      tags: ['test', 'malicious'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Generate a file with regex DoS patterns
   */
  static generateRegexDoSAttack(): string {
    const title = 'Regex DoS Attack Test';
    
    // Create a string that could cause catastrophic backtracking
    const maliciousString = 'a'.repeat(10000) + 'b';
    
    const body = `# Regex DoS Attack Test

This file contains patterns that could cause regex DoS attacks:

${maliciousString}

More content here...
`;

    return JSON.stringify({
      title,
      body,
      tags: ['test', 'malicious', 'regex'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Generate a file with excessive internal links
   */
  static generateExcessiveInternalLinks(): string {
    const title = 'Excessive Internal Links Test';
    
    // Create thousands of internal links
    const links = Array.from({ length: 2000 }, (_, i) => `[[Link ${i}]]`).join(' ');
    
    const body = `# Excessive Internal Links Test

This file contains many internal links:

${links}

This could slow down parsing and rendering.
`;

    return JSON.stringify({
      title,
      body,
      tags: ['test', 'malicious', 'links'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Generate a file with problematic Unicode
   */
  static generateUnicodeAttack(): string {
    const title = 'Unicode Attack Test';
    
    // Create strings with problematic Unicode characters
    const unicodeString = '\u{1F600}'.repeat(10000); // 10,000 emojis
    const combiningChars = '\u0300\u0301\u0302'.repeat(1000); // Combining diacritics
    
    const body = `# Unicode Attack Test

This file contains problematic Unicode:

${unicodeString}

Combining characters: ${combiningChars}

This could cause rendering issues or performance problems.
`;

    return JSON.stringify({
      title,
      body,
      tags: ['test', 'malicious', 'unicode'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Generate a file with extremely long title
   */
  static generateLongTitleAttack(): string {
    const title = 'A'.repeat(10000); // 10,000 character title
    
    const body = `# Long Title Test

This file has an extremely long title that could cause UI issues.
`;

    return JSON.stringify({
      title,
      body,
      tags: ['test', 'malicious', 'title'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Generate a file with excessive tags
   */
  static generateExcessiveTagsAttack(): string {
    const title = 'Excessive Tags Test';
    
    // Create hundreds of tags
    const tags = Array.from({ length: 500 }, (_, i) => `tag${i}`);
    
    const body = `# Excessive Tags Test

This file has many tags that could cause performance issues.
`;

    return JSON.stringify({
      title,
      body,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Security monitoring and logging
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private violations: Array<{
    timestamp: Date;
    type: string;
    details: any;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  logViolation(type: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    const violation = {
      timestamp: new Date(),
      type,
      details,
      severity
    };

    this.violations.push(violation);
    console.warn('Security violation detected:', violation);

    // For high severity violations, consider additional actions
    if (severity === 'high') {
      console.error('HIGH SEVERITY SECURITY VIOLATION:', violation);
      // Could trigger additional security measures here
    }
  }

  getViolations(): Array<{ timestamp: Date; type: string; details: any; severity: 'low' | 'medium' | 'high' }> {
    return [...this.violations];
  }

  clearViolations(): void {
    this.violations = [];
  }

  getViolationStats(): { total: number; bySeverity: Record<string, number>; byType: Record<string, number> } {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    this.violations.forEach(violation => {
      bySeverity[violation.severity] = (bySeverity[violation.severity] || 0) + 1;
      byType[violation.type] = (byType[violation.type] || 0) + 1;
    });

    return {
      total: this.violations.length,
      bySeverity,
      byType
    };
  }
} 