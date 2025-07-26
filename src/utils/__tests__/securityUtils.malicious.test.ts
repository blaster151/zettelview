import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SecurityValidator, SecurityMonitor, SecurityError } from '../securityUtils';

describe('Security Utils - Malicious Input Tests', () => {
  let validator: SecurityValidator;
  let monitor: SecurityMonitor;

  beforeEach(() => {
    validator = new SecurityValidator();
    monitor = SecurityMonitor.getInstance();
    
    // Spy on the monitor's logViolation method
    vi.spyOn(monitor, 'logViolation');
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in note titles', () => {
      const sqlInjectionTitles = [
        "'; DROP TABLE notes; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO notes VALUES ('hacked'); --",
        "' OR 1=1#",
        "' OR 1=1/*",
        "admin'--",
        "admin'#",
        "admin'/*",
        "admin'/**/OR/**/1=1"
      ];

      for (const maliciousTitle of sqlInjectionTitles) {
        const note = {
          id: 'test-note',
          title: maliciousTitle,
          body: 'Content',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent SQL injection in note body', () => {
      const sqlInjectionBodies = [
        "'; DROP TABLE notes; --",
        "' OR '1'='1",
        "'; UPDATE users SET password='hacked'; --",
        "'; DELETE FROM notes; --",
        "' OR 1=1#",
        "' OR 1=1/*",
        "'; EXEC xp_cmdshell('dir'); --",
        "'; SELECT * FROM information_schema.tables; --"
      ];

      for (const maliciousBody of sqlInjectionBodies) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousBody,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('XSS Prevention', () => {
    test('should prevent XSS in note titles', () => {
      const xssTitles = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "onload=alert('xss')",
        "onerror=alert('xss')",
        "onclick=alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "<svg onload=alert('xss')>",
        "<iframe src=javascript:alert('xss')>",
        "<object data=javascript:alert('xss')>",
        "<embed src=javascript:alert('xss')>"
      ];

      for (const maliciousTitle of xssTitles) {
        const note = {
          id: 'test-note',
          title: maliciousTitle,
          body: 'Content',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent XSS in note body', () => {
      const xssBodies = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "onload=alert('xss')",
        "onerror=alert('xss')",
        "onclick=alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "<svg onload=alert('xss')>",
        "<iframe src=javascript:alert('xss')>",
        "<object data=javascript:alert('xss')>",
        "<embed src=javascript:alert('xss')>",
        "';alert('xss');//",
        "\";alert('xss');//",
        "`;alert('xss');//"
      ];

      for (const maliciousBody of xssBodies) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousBody,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('Command Injection Prevention', () => {
    test('should prevent command injection in note content', () => {
      const commandInjectionAttempts = [
        "; rm -rf /",
        "&& rm -rf /",
        "| rm -rf /",
        "|| rm -rf /",
        "; cat /etc/passwd",
        "&& cat /etc/passwd",
        "; whoami",
        "&& whoami",
        "; ls -la",
        "&& ls -la",
        "; netstat -an",
        "&& netstat -an",
        "; ps aux",
        "&& ps aux"
      ];

      for (const maliciousCommand of commandInjectionAttempts) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousCommand,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent Windows command injection', () => {
      const windowsCommands = [
        "; del /s /q C:\\",
        "&& del /s /q C:\\",
        "| del /s /q C:\\",
        "|| del /s /q C:\\",
        "; dir C:\\",
        "&& dir C:\\",
        "; type C:\\windows\\system32\\config\\sam",
        "&& type C:\\windows\\system32\\config\\sam",
        "; ipconfig",
        "&& ipconfig",
        "; net user",
        "&& net user"
      ];

      for (const maliciousCommand of windowsCommands) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousCommand,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    test('should prevent path traversal in note IDs', () => {
      const pathTraversalIds = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "..%5C..%5C..%5Cwindows%5Csystem32%5Cconfig%5Csam",
        "/etc/passwd",
        "C:\\windows\\system32\\config\\sam",
        "..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\etc\\passwd",
        "..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2Fetc%2Fpasswd",
        "..%5C..%5C..%5C..%5C..%5C..%5C..%5C..%5C..%5C..%5Cwindows%5Csystem32%5Cconfig%5Csam"
      ];

      for (const maliciousId of pathTraversalIds) {
        const note = {
          id: maliciousId,
          title: 'Test Note',
          body: 'Content',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent path traversal in note content', () => {
      const pathTraversalContent = [
        "File: ../../../etc/passwd",
        "File: ..\\..\\..\\windows\\system32\\config\\sam",
        "Path: ....//....//....//etc/passwd",
        "Path: ..%2F..%2F..%2Fetc%2Fpasswd",
        "Path: ..%5C..%5C..%5Cwindows%5Csystem32%5Cconfig%5Csam",
        "File: /etc/passwd",
        "File: C:\\windows\\system32\\config\\sam"
      ];

      for (const maliciousContent of pathTraversalContent) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousContent,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('ReDoS Attack Prevention', () => {
    test('should prevent regex DoS attacks', () => {
      const regexDoSAttempts = [
        "a".repeat(1000) + "!",
        "(a+)+" + "a".repeat(100),
        "(a|aa)+" + "a".repeat(100),
        "(a|a?)+" + "a".repeat(100),
        "(a+){100,}",
        "(a{100,})",
        "((a+)+)+" + "a".repeat(50),
        "((a|aa)+)+" + "a".repeat(50),
        "((a|a?)+)+" + "a".repeat(50)
      ];

      for (const maliciousInput of regexDoSAttempts) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousInput,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent nested quantifier attacks', () => {
      const nestedQuantifierAttacks = [
        "(a+)+" + "a".repeat(200),
        "(a*)*" + "a".repeat(200),
        "(a?)*" + "a".repeat(200),
        "(a{1,})*" + "a".repeat(200),
        "(a{1,2})*" + "a".repeat(200),
        "(a{1,3})*" + "a".repeat(200),
        "(a{1,4})*" + "a".repeat(200),
        "(a{1,5})*" + "a".repeat(200)
      ];

      for (const maliciousInput of nestedQuantifierAttacks) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousInput,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('Buffer Overflow Prevention', () => {
    test('should prevent buffer overflow in note titles', () => {
      const overflowTitle = "A".repeat(10000);
      
      const note = {
        id: 'test-note',
        title: overflowTitle,
        body: 'Content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validator.validateNote(note)).toThrow(SecurityError);
    });

    test('should prevent buffer overflow in note body', () => {
      const overflowBody = "A".repeat(10000000); // 10MB
      
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: overflowBody,
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validator.validateNote(note)).toThrow(SecurityError);
    });

    test('should prevent buffer overflow in tags', () => {
      const overflowTags = Array.from({ length: 1000 }, (_, i) => "A".repeat(1000));
      
      const note = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: overflowTags,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validator.validateNote(note)).toThrow(SecurityError);
    });
  });

  describe('Null Byte Injection Prevention', () => {
    test('should prevent null byte injection in note titles', () => {
      const nullByteTitles = [
        "title\u0000",
        "\u0000title",
        "title\u0000suffix",
        "title\u0001",
        "title\u0002",
        "title\u0003",
        "title\u0004",
        "title\u0005",
        "title\u0006",
        "title\u0007"
      ];

      for (const maliciousTitle of nullByteTitles) {
        const note = {
          id: 'test-note',
          title: maliciousTitle,
          body: 'Content',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent null byte injection in note body', () => {
      const nullByteBodies = [
        "content\u0000",
        "\u0000content",
        "content\u0000suffix",
        "content\u0001",
        "content\u0002",
        "content\u0003",
        "content\u0004",
        "content\u0005",
        "content\u0006",
        "content\u0007"
      ];

      for (const maliciousBody of nullByteBodies) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousBody,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('Unicode Normalization Attacks', () => {
    test('should prevent unicode normalization attacks', () => {
      const unicodeAttacks = [
        "admin\u0300", // Combining grave accent
        "admin\u0301", // Combining acute accent
        "admin\u0302", // Combining circumflex
        "admin\u0303", // Combining tilde
        "admin\u0304", // Combining macron
        "admin\u0305", // Combining overline
        "admin\u0306", // Combining breve
        "admin\u0307", // Combining dot above
        "admin\u0308", // Combining diaeresis
        "admin\u0309", // Combining hook above
        "admin\u030A", // Combining ring above
        "admin\u030B", // Combining double acute accent
        "admin\u030C", // Combining caron
        "admin\u030D", // Combining vertical line above
        "admin\u030E", // Combining double vertical line above
        "admin\u030F"  // Combining double grave accent
      ];

      for (const maliciousInput of unicodeAttacks) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousInput,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent unicode control characters', () => {
      const unicodeControls = [
        "\u0000", // Null
        "\u0001", // Start of heading
        "\u0002", // Start of text
        "\u0003", // End of text
        "\u0004", // End of transmission
        "\u0005", // Enquiry
        "\u0006", // Acknowledge
        "\u0007", // Bell
        "\u0008", // Backspace
        "\u0009", // Horizontal tab
        "\u000A", // Line feed
        "\u000B", // Vertical tab
        "\u000C", // Form feed
        "\u000D", // Carriage return
        "\u000E", // Shift out
        "\u000F", // Shift in
        "\u0010", // Data link escape
        "\u0011", // Device control 1
        "\u0012", // Device control 2
        "\u0013", // Device control 3
        "\u0014", // Device control 4
        "\u0015", // Negative acknowledge
        "\u0016", // Synchronous idle
        "\u0017", // End of transmission block
        "\u0018", // Cancel
        "\u0019", // End of medium
        "\u001A", // Substitute
        "\u001B", // Escape
        "\u001C", // File separator
        "\u001D", // Group separator
        "\u001E", // Record separator
        "\u001F"  // Unit separator
      ];

      for (const controlChar of unicodeControls) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: controlChar,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('Encoding Attacks', () => {
    test('should prevent URL encoding attacks', () => {
      const urlEncodingAttacks = [
        "%3Cscript%3Ealert('xss')%3C/script%3E",
        "%27%20OR%201%3D1--",
        "%27%20UNION%20SELECT%20*%20FROM%20users--",
        "%2E%2E%2F%2E%2E%2F%2E%2E%2Fetc%2Fpasswd",
        "%2E%2E%5C%2E%2E%5C%2E%2E%5Cwindows%5Csystem32%5Cconfig%5Csam"
      ];

      for (const maliciousInput of urlEncodingAttacks) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousInput,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent HTML entity encoding attacks', () => {
      const htmlEntityAttacks = [
        "&lt;script&gt;alert('xss')&lt;/script&gt;",
        "&#60;script&#62;alert('xss')&#60;/script&#62;",
        "&#x3C;script&#x3E;alert('xss')&#x3C;/script&#x3E;",
        "&lt;img src=x onerror=alert('xss')&gt;",
        "&#60;img src=x onerror=alert('xss')&#62;"
      ];

      for (const maliciousInput of htmlEntityAttacks) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: maliciousInput,
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });
  });

  describe('Memory Exhaustion Attacks', () => {
    test('should prevent memory exhaustion through large inputs', () => {
      const memoryExhaustionInputs = [
        "A".repeat(1000000), // 1MB
        "A".repeat(5000000), // 5MB
        "A".repeat(10000000), // 10MB
        Array.from({ length: 10000 }, (_, i) => "tag" + i), // 10k tags
        Array.from({ length: 100000 }, (_, i) => "tag" + i) // 100k tags
      ];

      for (const maliciousInput of memoryExhaustionInputs) {
        const note = {
          id: 'test-note',
          title: 'Test Note',
          body: typeof maliciousInput === 'string' ? maliciousInput : 'Content',
          tags: Array.isArray(maliciousInput) ? maliciousInput : ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        expect(() => validator.validateNote(note)).toThrow(SecurityError);
      }
    });

    test('should prevent memory exhaustion through nested structures', () => {
      const nestedStructure = {
        id: 'test-note',
        title: 'Test Note',
        body: 'Content',
        tags: ['test'],
        metadata: {
          nested: {
            deep: {
              structure: {
                that: {
                  could: {
                    cause: {
                      memory: {
                        issues: "A".repeat(100000)
                      }
                    }
                  }
                }
              }
            }
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(() => validator.validateNote(nestedStructure as any)).toThrow(SecurityError);
    });
  });

  describe('Security Monitor Integration', () => {
    test('should log security violations', () => {
      const maliciousNote = {
        id: 'malicious-note',
        title: "<script>alert('xss')</script>",
        body: 'Content',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      try {
        validator.validateNote(maliciousNote);
      } catch (error) {
        // Expected to fail
      }

      // Verify security monitor was called
      expect(monitor.logViolation).toHaveBeenCalledWith(
        'SECURITY_VIOLATION',
        expect.objectContaining({
          noteId: 'malicious-note',
          error: expect.any(String)
        }),
        'high'
      );
    });

    test('should log different violation types', () => {
      const violations = [
        {
          note: {
            id: 'xss-note',
            title: "<script>alert('xss')</script>",
            body: 'Content',
            tags: ['test'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expectedType: 'XSS_ATTEMPT'
        },
        {
          note: {
            id: 'sql-note',
            title: "'; DROP TABLE notes; --",
            body: 'Content',
            tags: ['test'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expectedType: 'SQL_INJECTION_ATTEMPT'
        },
        {
          note: {
            id: 'path-note',
            title: 'Test Note',
            body: '../../../etc/passwd',
            tags: ['test'],
            createdAt: new Date(),
            updatedAt: new Date()
          },
          expectedType: 'PATH_TRAVERSAL_ATTEMPT'
        }
      ];

      for (const violation of violations) {
        try {
          validator.validateNote(violation.note);
        } catch (error) {
          // Expected to fail
        }

        expect(monitor.logViolation).toHaveBeenCalledWith(
          expect.stringContaining(violation.expectedType),
          expect.any(Object),
          'high'
        );
      }
    });
  });
}); 