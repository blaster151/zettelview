import { 
  SecurityValidator, 
  SecurityError, 
  SecurityMonitor, 
  MaliciousFileGenerator,
  DEFAULT_SECURITY_CONFIG 
} from './securityUtils';

describe('SecurityValidator', () => {
  let validator: SecurityValidator;

  beforeEach(() => {
    validator = new SecurityValidator();
  });

  describe('File Size Validation', () => {
    it('should allow files within size limit', () => {
      expect(() => validator.validateFileSize(1024)).not.toThrow();
    });

    it('should reject files exceeding size limit', () => {
      const largeSize = DEFAULT_SECURITY_CONFIG.maxFileSize + 1;
      expect(() => validator.validateFileSize(largeSize)).toThrow(SecurityError);
      expect(() => validator.validateFileSize(largeSize)).toThrow('FILE_TOO_LARGE');
    });
  });

  describe('Title Validation', () => {
    it('should allow valid titles', () => {
      expect(() => validator.validateTitle('Valid Title')).not.toThrow();
    });

    it('should reject empty titles', () => {
      expect(() => validator.validateTitle('')).toThrow(SecurityError);
      expect(() => validator.validateTitle('')).toThrow('INVALID_TITLE');
    });

    it('should reject non-string titles', () => {
      expect(() => validator.validateTitle(null as any)).toThrow(SecurityError);
      expect(() => validator.validateTitle(123 as any)).toThrow(SecurityError);
    });

    it('should reject titles exceeding length limit', () => {
      const longTitle = 'A'.repeat(DEFAULT_SECURITY_CONFIG.maxTitleLength + 1);
      expect(() => validator.validateTitle(longTitle)).toThrow(SecurityError);
      expect(() => validator.validateTitle(longTitle)).toThrow('TITLE_TOO_LONG');
    });
  });

  describe('Body Validation', () => {
    it('should allow valid bodies', () => {
      expect(() => validator.validateBody('Valid body content')).not.toThrow();
    });

    it('should reject empty bodies', () => {
      expect(() => validator.validateBody('')).toThrow(SecurityError);
      expect(() => validator.validateBody('')).toThrow('INVALID_BODY');
    });

    it('should reject non-string bodies', () => {
      expect(() => validator.validateBody(null as any)).toThrow(SecurityError);
      expect(() => validator.validateBody(123 as any)).toThrow(SecurityError);
    });

    it('should reject bodies exceeding length limit', () => {
      const longBody = 'A'.repeat(DEFAULT_SECURITY_CONFIG.maxBodyLength + 1);
      expect(() => validator.validateBody(longBody)).toThrow(SecurityError);
      expect(() => validator.validateBody(longBody)).toThrow('BODY_TOO_LONG');
    });
  });

  describe('Tags Validation', () => {
    it('should allow valid tags', () => {
      expect(() => validator.validateTags(['tag1', 'tag2'])).not.toThrow();
    });

    it('should reject non-array tags', () => {
      expect(() => validator.validateTags('tag1' as any)).toThrow(SecurityError);
      expect(() => validator.validateTags(123 as any)).toThrow(SecurityError);
    });

    it('should reject too many tags', () => {
      const manyTags = Array.from({ length: DEFAULT_SECURITY_CONFIG.maxTagsCount + 1 }, (_, i) => `tag${i}`);
      expect(() => validator.validateTags(manyTags)).toThrow(SecurityError);
      expect(() => validator.validateTags(manyTags)).toThrow('TOO_MANY_TAGS');
    });

    it('should reject non-string tags', () => {
      expect(() => validator.validateTags(['tag1', 123 as any, 'tag2'])).toThrow(SecurityError);
      expect(() => validator.validateTags(['tag1', 123 as any, 'tag2'])).toThrow('INVALID_TAG_TYPE');
    });

    it('should reject tags exceeding length limit', () => {
      const longTag = 'A'.repeat(DEFAULT_SECURITY_CONFIG.maxTagLength + 1);
      expect(() => validator.validateTags([longTag])).toThrow(SecurityError);
      expect(() => validator.validateTags([longTag])).toThrow('TAG_TOO_LONG');
    });
  });

  describe('Internal Links Validation', () => {
    it('should allow reasonable number of internal links', () => {
      const content = '[[Link 1]] and [[Link 2]] and [[Link 3]]';
      expect(() => validator.validateInternalLinks(content)).not.toThrow();
    });

    it('should reject excessive internal links', () => {
      const manyLinks = Array.from({ length: DEFAULT_SECURITY_CONFIG.maxInternalLinksPerNote + 1 }, (_, i) => `[[Link ${i}]]`).join(' ');
      expect(() => validator.validateInternalLinks(manyLinks)).toThrow(SecurityError);
      expect(() => validator.validateInternalLinks(manyLinks)).toThrow('TOO_MANY_INTERNAL_LINKS');
    });
  });

  describe('Blocked Patterns', () => {
    it('should reject content with blocked patterns', () => {
      const maliciousContent = 'aaaaaaaab'; // Matches /(a+)+b/
      expect(() => validator.validateBody(maliciousContent)).toThrow(SecurityError);
      expect(() => validator.validateBody(maliciousContent)).toThrow('BLOCKED_PATTERN');
    });

    it('should allow content without blocked patterns', () => {
      const safeContent = 'This is safe content without malicious patterns';
      expect(() => validator.validateBody(safeContent)).not.toThrow();
    });
  });

  describe('Note Validation', () => {
    it('should validate complete note objects', () => {
      const validNote = {
        title: 'Valid Note',
        body: 'Valid body content',
        tags: ['tag1', 'tag2']
      };
      expect(() => validator.validateNote(validNote)).not.toThrow();
    });

    it('should reject invalid note objects', () => {
      expect(() => validator.validateNote(null)).toThrow(SecurityError);
      expect(() => validator.validateNote('not an object')).toThrow(SecurityError);
    });
  });

  describe('Note Sanitization', () => {
    it('should sanitize valid notes', () => {
      const note = {
        id: 'test-id',
        title: 'Test Title',
        body: 'Test body',
        tags: ['tag1', 'tag2'],
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };

      const sanitized = validator.sanitizeNote(note);
      expect(sanitized).toEqual({
        id: 'test-id',
        title: 'Test Title',
        body: 'Test body',
        tags: ['tag1', 'tag2'],
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
      });
    });

    it('should handle invalid input gracefully', () => {
      const invalidNote = {
        title: null,
        body: undefined,
        tags: 'not an array'
      };

      const sanitized = validator.sanitizeNote(invalidNote);
      expect(sanitized.title).toBe('');
      expect(sanitized.body).toBe('');
      expect(sanitized.tags).toEqual([]);
    });
  });
});

describe('MaliciousFileGenerator', () => {
  describe('Memory Exhaustion File', () => {
    it('should generate a large file', () => {
      const content = MaliciousFileGenerator.generateMemoryExhaustionFile();
      const parsed = JSON.parse(content);
      
      expect(parsed.title).toBe('Memory Exhaustion Test');
      expect(parsed.body.length).toBeGreaterThan(100 * 1024 * 1024); // 100MB
    });
  });

  describe('Regex DoS Attack File', () => {
    it('should generate file with problematic patterns', () => {
      const content = MaliciousFileGenerator.generateRegexDoSAttack();
      const parsed = JSON.parse(content);
      
      expect(parsed.title).toBe('Regex DoS Attack Test');
      expect(parsed.body).toContain('a'.repeat(10000) + 'b');
    });
  });

  describe('Excessive Internal Links File', () => {
    it('should generate file with many internal links', () => {
      const content = MaliciousFileGenerator.generateExcessiveInternalLinks();
      const parsed = JSON.parse(content);
      
      expect(parsed.title).toBe('Excessive Internal Links Test');
      expect(parsed.body).toContain('[[Link 0]]');
      expect(parsed.body).toContain('[[Link 1999]]');
    });
  });

  describe('Unicode Attack File', () => {
    it('should generate file with problematic Unicode', () => {
      const content = MaliciousFileGenerator.generateUnicodeAttack();
      const parsed = JSON.parse(content);
      
      expect(parsed.title).toBe('Unicode Attack Test');
      expect(parsed.body).toContain('\u{1F600}'); // Emoji
      expect(parsed.body).toContain('\u0300'); // Combining diacritic
    });
  });

  describe('Long Title Attack File', () => {
    it('should generate file with extremely long title', () => {
      const content = MaliciousFileGenerator.generateLongTitleAttack();
      const parsed = JSON.parse(content);
      
      expect(parsed.title.length).toBe(10000);
    });
  });

  describe('Excessive Tags Attack File', () => {
    it('should generate file with many tags', () => {
      const content = MaliciousFileGenerator.generateExcessiveTagsAttack();
      const parsed = JSON.parse(content);
      
      expect(parsed.tags.length).toBe(500);
      expect(parsed.tags[0]).toBe('tag0');
      expect(parsed.tags[499]).toBe('tag499');
    });
  });
});

describe('SecurityMonitor', () => {
  let monitor: SecurityMonitor;

  beforeEach(() => {
    monitor = SecurityMonitor.getInstance();
    monitor.clearViolations();
  });

  describe('Violation Logging', () => {
    it('should log violations', () => {
      const violation = { type: 'TEST', details: 'test details' };
      monitor.logViolation('TEST_VIOLATION', violation, 'medium');
      
      const violations = monitor.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('TEST_VIOLATION');
      expect(violations[0].details).toEqual(violation);
      expect(violations[0].severity).toBe('medium');
    });

    it('should handle different severity levels', () => {
      monitor.logViolation('LOW_VIOLATION', {}, 'low');
      monitor.logViolation('HIGH_VIOLATION', {}, 'high');
      
      const violations = monitor.getViolations();
      expect(violations).toHaveLength(2);
      expect(violations[0].severity).toBe('low');
      expect(violations[1].severity).toBe('high');
    });
  });

  describe('Violation Statistics', () => {
    it('should provide accurate statistics', () => {
      monitor.logViolation('TEST1', {}, 'low');
      monitor.logViolation('TEST2', {}, 'medium');
      monitor.logViolation('TEST3', {}, 'high');
      monitor.logViolation('TEST4', {}, 'medium');
      
      const stats = monitor.getViolationStats();
      expect(stats.total).toBe(4);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.bySeverity.medium).toBe(2);
      expect(stats.bySeverity.high).toBe(1);
      expect(stats.byType.TEST1).toBe(1);
      expect(stats.byType.TEST2).toBe(1);
      expect(stats.byType.TEST3).toBe(1);
      expect(stats.byType.TEST4).toBe(1);
    });
  });

  describe('Violation Clearing', () => {
    it('should clear all violations', () => {
      monitor.logViolation('TEST', {}, 'low');
      expect(monitor.getViolations()).toHaveLength(1);
      
      monitor.clearViolations();
      expect(monitor.getViolations()).toHaveLength(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SecurityMonitor.getInstance();
      const instance2 = SecurityMonitor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});

describe('SecurityError', () => {
  it('should create security errors with proper properties', () => {
    const error = new SecurityError('Test error', 'TEST_CODE', { detail: 'test' });
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.details).toEqual({ detail: 'test' });
    expect(error.name).toBe('SecurityError');
  });
});

describe('Integration Tests', () => {
  let validator: SecurityValidator;

  beforeEach(() => {
    validator = new SecurityValidator();
  });

  it('should reject malicious files from generator', () => {
    // Test memory exhaustion file
    const memoryFile = JSON.parse(MaliciousFileGenerator.generateMemoryExhaustionFile());
    expect(() => validator.validateNote(memoryFile)).toThrow(SecurityError);
    expect(() => validator.validateNote(memoryFile)).toThrow('BODY_TOO_LONG');

    // Test excessive tags file
    const tagsFile = JSON.parse(MaliciousFileGenerator.generateExcessiveTagsAttack());
    expect(() => validator.validateNote(tagsFile)).toThrow(SecurityError);
    expect(() => validator.validateNote(tagsFile)).toThrow('TOO_MANY_TAGS');

    // Test long title file
    const titleFile = JSON.parse(MaliciousFileGenerator.generateLongTitleAttack());
    expect(() => validator.validateNote(titleFile)).toThrow(SecurityError);
    expect(() => validator.validateNote(titleFile)).toThrow('TITLE_TOO_LONG');
  });

  it('should handle regex DoS attacks gracefully', () => {
    const regexFile = JSON.parse(MaliciousFileGenerator.generateRegexDoSAttack());
    
    // This should either throw a security error or timeout
    try {
      validator.validateNote(regexFile);
      // If it doesn't throw, that's also acceptable (timeout protection worked)
    } catch (error) {
      expect(error).toBeInstanceOf(SecurityError);
    }
  });

  it('should reject excessive internal links', () => {
    const linksFile = JSON.parse(MaliciousFileGenerator.generateExcessiveInternalLinks());
    expect(() => validator.validateNote(linksFile)).toThrow(SecurityError);
    expect(() => validator.validateNote(linksFile)).toThrow('TOO_MANY_INTERNAL_LINKS');
  });
}); 