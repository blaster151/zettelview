import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedSecurityService } from '../advancedSecurityService';

describe('Advanced Security Service - Penetration Testing', () => {
  let securityService: AdvancedSecurityService;

  beforeEach(() => {
    securityService = new AdvancedSecurityService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Penetration Tests', () => {
    test('should prevent SQL injection in username field', async () => {
      const sqlInjectionAttempts = [
        "admin' OR '1'='1",
        "admin'; DROP TABLE users; --",
        "admin' UNION SELECT * FROM users --",
        "admin' OR 1=1#",
        "admin' OR 1=1/*",
        "admin'/**/OR/**/1=1",
        "admin'%20OR%201=1",
        "admin'%27%20OR%201=1%23"
      ];

      for (const maliciousUsername of sqlInjectionAttempts) {
        const result = await securityService.authenticate(maliciousUsername, 'password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should prevent NoSQL injection attacks', async () => {
      const nosqlInjectionAttempts = [
        "admin' || '1'=='1",
        "admin' && '1'=='1",
        "admin' || 1==1",
        "admin' && 1==1",
        "admin' || true",
        "admin' && true",
        "admin' || 'a'=='a",
        "admin' && 'a'=='a"
      ];

      for (const maliciousUsername of nosqlInjectionAttempts) {
        const result = await securityService.authenticate(maliciousUsername, 'password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should prevent XSS in username field', async () => {
      const xssAttempts = [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "onload=alert('xss')",
        "onerror=alert('xss')",
        "onclick=alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "<svg onload=alert('xss')>",
        "';alert('xss');//"
      ];

      for (const maliciousUsername of xssAttempts) {
        const result = await securityService.authenticate(maliciousUsername, 'password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should prevent command injection in password field', async () => {
      const commandInjectionAttempts = [
        "password; rm -rf /",
        "password && rm -rf /",
        "password | rm -rf /",
        "password || rm -rf /",
        "password; cat /etc/passwd",
        "password && cat /etc/passwd",
        "password; whoami",
        "password && whoami"
      ];

      for (const maliciousPassword of commandInjectionAttempts) {
        const result = await securityService.authenticate('admin', maliciousPassword);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should prevent LDAP injection attacks', async () => {
      const ldapInjectionAttempts = [
        "admin)(&(objectClass=*)",
        "admin)(|(objectClass=*)",
        "admin)(&(objectClass=user)",
        "admin)(|(objectClass=user)",
        "admin*)(&(objectClass=*)",
        "admin*)(|(objectClass=*)",
        "admin)(&(objectClass=*)(uid=*))",
        "admin)(|(objectClass=*)(uid=*))"
      ];

      for (const maliciousUsername of ldapInjectionAttempts) {
        const result = await securityService.authenticate(maliciousUsername, 'password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should prevent path traversal in username', async () => {
      const pathTraversalAttempts = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32\\config\\sam",
        "....//....//....//etc/passwd",
        "..%2F..%2F..%2Fetc%2Fpasswd",
        "..%5C..%5C..%5Cwindows%5Csystem32%5Cconfig%5Csam",
        "/etc/passwd",
        "C:\\windows\\system32\\config\\sam",
        "..\\..\\..\\..\\..\\..\\..\\..\\..\\..\\etc\\passwd"
      ];

      for (const maliciousUsername of pathTraversalAttempts) {
        const result = await securityService.authenticate(maliciousUsername, 'password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });
  });

  describe('Brute Force Attack Prevention', () => {
    test('should lock account after multiple failed attempts', async () => {
      const username = 'testuser';
      const password = 'wrongpassword';

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        const result = await securityService.authenticate(username, password);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }

      // Next attempt should be locked
      const lockedResult = await securityService.authenticate(username, 'correctpassword');
      expect(lockedResult.success).toBe(false);
      expect(lockedResult.error).toBe('Account is locked');
    });

    test('should implement rate limiting on authentication attempts', async () => {
      const username = 'rateuser';
      const password = 'wrongpassword';

      // Rapid successive attempts should be rate limited
      const promises = Array.from({ length: 10 }, () => 
        securityService.authenticate(username, password)
      );

      const results = await Promise.all(promises);
      
      // Should have some rate limiting in place
      const rateLimitedCount = results.filter(r => r.error?.includes('rate limit')).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    test('should prevent dictionary attacks', async () => {
      const username = 'dictuser';
      const commonPasswords = [
        'password', '123456', 'admin', 'root', 'test',
        'password123', 'admin123', 'qwerty', 'letmein',
        'welcome', 'monkey', 'dragon', 'master', 'user'
      ];

      for (const commonPassword of commonPasswords) {
        const result = await securityService.authenticate(username, commonPassword);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }

      // Account should be locked after common password attempts
      const lockedResult = await securityService.authenticate(username, 'correctpassword');
      expect(lockedResult.success).toBe(false);
      expect(lockedResult.error).toBe('Account is locked');
    });
  });

  describe('Session Security Tests', () => {
    test('should prevent session fixation attacks', async () => {
      const username = 'sessionuser';
      const password = 'password123';

      // Create initial session
      const initialResult = await securityService.authenticate(username, password);
      expect(initialResult.success).toBe(true);
      expect(initialResult.user).toBeDefined();

      // Attempt to reuse session token
      const sessionToken = initialResult.user?.sessionToken;
      expect(sessionToken).toBeDefined();

      // Session should be invalidated on logout
      await securityService.logout(sessionToken!);
      
      // Attempt to use invalidated session
      const sessionValidation = await securityService.validateSession(sessionToken!);
      expect(sessionValidation.valid).toBe(false);
    });

    test('should implement session timeout', async () => {
      const username = 'timeoutuser';
      const password = 'password123';

      const result = await securityService.authenticate(username, password);
      expect(result.success).toBe(true);

      const sessionToken = result.user?.sessionToken;
      expect(sessionToken).toBeDefined();

      // Simulate time passing (session timeout)
      vi.advanceTimersByTime(30 * 60 * 1000); // 30 minutes

      const sessionValidation = await securityService.validateSession(sessionToken!);
      expect(sessionValidation.valid).toBe(false);
      expect(sessionValidation.error).toBe('Session expired');
    });

    test('should prevent concurrent session abuse', async () => {
      const username = 'concurrentuser';
      const password = 'password123';

      // Create multiple sessions
      const sessions = await Promise.all([
        securityService.authenticate(username, password),
        securityService.authenticate(username, password),
        securityService.authenticate(username, password),
        securityService.authenticate(username, password),
        securityService.authenticate(username, password)
      ]);

      // Should limit concurrent sessions
      const validSessions = sessions.filter(s => s.success);
      expect(validSessions.length).toBeLessThanOrEqual(3); // Max 3 concurrent sessions
    });
  });

  describe('Two-Factor Authentication Security', () => {
    test('should prevent 2FA bypass attempts', async () => {
      const username = '2fauser';
      const password = 'password123';

      // Enable 2FA for user
      await securityService.enableTwoFactor(username);

      // Attempt to authenticate without 2FA code
      const result = await securityService.authenticate(username, password);
      expect(result.success).toBe(false);
      expect(result.requiresTwoFactor).toBe(true);

      // Attempt to bypass with invalid 2FA code
      const bypassResult = await securityService.authenticate(username, password, '000000');
      expect(bypassResult.success).toBe(false);
      expect(bypassResult.error).toBe('Invalid two-factor code');
    });

    test('should prevent 2FA code brute force', async () => {
      const username = '2fabruteuser';
      const password = 'password123';

      await securityService.enableTwoFactor(username);

      // Try common 2FA codes
      const commonCodes = ['000000', '111111', '123456', '654321', '999999'];
      
      for (const code of commonCodes) {
        const result = await securityService.authenticate(username, password, code);
        expect(result.success).toBe(false);
      }

      // Account should be locked after too many 2FA attempts
      const lockedResult = await securityService.authenticate(username, password, '123456');
      expect(lockedResult.success).toBe(false);
      expect(lockedResult.error).toBe('Account is locked');
    });

    test('should validate 2FA code format', async () => {
      const username = '2faformatuser';
      const password = 'password123';

      await securityService.enableTwoFactor(username);

      const invalidCodes = [
        '12345',    // Too short
        '1234567',  // Too long
        'abcdef',   // Non-numeric
        '12 3456',  // Contains space
        '12-3456',  // Contains dash
        '12.3456',  // Contains dot
        '12_3456',  // Contains underscore
        '12@3456'   // Contains special char
      ];

      for (const invalidCode of invalidCodes) {
        const result = await securityService.authenticate(username, password, invalidCode);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid two-factor code');
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    test('should sanitize username input', async () => {
      const maliciousUsernames = [
        'admin<script>alert("xss")</script>',
        'admin<img src=x onerror=alert("xss")>',
        'admin\' OR 1=1--',
        'admin; DROP TABLE users;',
        'admin../../etc/passwd',
        'admin%00',
        'admin\u0000',
        'admin\u0001',
        'admin\u0002',
        'admin\u0003'
      ];

      for (const maliciousUsername of maliciousUsernames) {
        const result = await securityService.authenticate(maliciousUsername, 'password');
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should handle null and undefined inputs', async () => {
      const nullInputs = [
        { username: null, password: 'password' },
        { username: undefined, password: 'password' },
        { username: '', password: 'password' },
        { username: 'admin', password: null },
        { username: 'admin', password: undefined },
        { username: 'admin', password: '' },
        { username: null, password: null },
        { username: undefined, password: undefined }
      ];

      for (const input of nullInputs) {
        const result = await securityService.authenticate(input.username as any, input.password as any);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });

    test('should handle extremely long inputs', async () => {
      const longUsername = 'a'.repeat(10000);
      const longPassword = 'b'.repeat(10000);

      const result = await securityService.authenticate(longUsername, longPassword);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    test('should handle unicode and special characters', async () => {
      const unicodeInputs = [
        { username: 'admin\u{1F600}', password: 'password' }, // Emoji
        { username: 'admin\u{1F4A9}', password: 'password' }, // Poop emoji
        { username: 'admin\u{0000}', password: 'password' }, // Null byte
        { username: 'admin\u{0001}', password: 'password' }, // Start of heading
        { username: 'admin\u{0002}', password: 'password' }, // Start of text
        { username: 'admin\u{0003}', password: 'password' }, // End of text
        { username: 'admin\u{0004}', password: 'password' }, // End of transmission
        { username: 'admin\u{0005}', password: 'password' }, // Enquiry
        { username: 'admin\u{0006}', password: 'password' }, // Acknowledge
        { username: 'admin\u{0007}', password: 'password' }  // Bell
      ];

      for (const input of unicodeInputs) {
        const result = await securityService.authenticate(input.username, input.password);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      }
    });
  });

  describe('Audit Log Security', () => {
    test('should prevent audit log tampering', async () => {
      const username = 'audituser';
      const password = 'password123';

      // Perform authentication
      const result = await securityService.authenticate(username, password);
      expect(result.success).toBe(true);

      // Attempt to access audit logs
      const auditLogs = await securityService.getAuditLogs();
      
      // Verify audit logs are properly secured
      expect(auditLogs).toBeDefined();
      expect(Array.isArray(auditLogs)).toBe(true);
      
      // Verify sensitive data is not exposed in logs
      for (const log of auditLogs) {
        expect(log.password).toBeUndefined();
        expect(log.creditCard).toBeUndefined();
        expect(log.ssn).toBeUndefined();
      }
    });

    test('should prevent log injection attacks', async () => {
      const logInjectionAttempts = [
        'admin\n[ERROR] System compromised',
        'admin\r\n[ERROR] System compromised',
        'admin\n[WARN] Security breach',
        'admin\r[ERROR] System compromised',
        'admin\n[INFO] User admin logged in\n[ERROR] System compromised',
        'admin\n[DEBUG] Password: secret\n[ERROR] System compromised'
      ];

      for (const maliciousInput of logInjectionAttempts) {
        const result = await securityService.authenticate(maliciousInput, 'password');
        expect(result.success).toBe(false);
        
        // Verify logs are properly escaped
        const auditLogs = await securityService.getAuditLogs();
        const lastLog = auditLogs[auditLogs.length - 1];
        
        expect(lastLog.message).not.toContain('[ERROR] System compromised');
        expect(lastLog.message).not.toContain('[WARN] Security breach');
        expect(lastLog.message).not.toContain('Password: secret');
      }
    });
  });

  describe('Security Event Monitoring', () => {
    test('should detect and log suspicious activities', async () => {
      const suspiciousActivities = [
        { username: 'admin', password: 'wrong1' },
        { username: 'admin', password: 'wrong2' },
        { username: 'admin', password: 'wrong3' },
        { username: 'admin', password: 'wrong4' },
        { username: 'admin', password: 'wrong5' }
      ];

      for (const activity of suspiciousActivities) {
        await securityService.authenticate(activity.username, activity.password);
      }

      const securityEvents = await securityService.getSecurityEvents();
      const suspiciousEvents = securityEvents.filter(e => 
        e.type === 'suspicious_activity' && 
        e.severity === 'high' &&
        e.message.includes('multiple failed login attempts')
      );

      expect(suspiciousEvents.length).toBeGreaterThan(0);
    });

    test('should prevent security event flooding', async () => {
      // Generate many security events rapidly
      const promises = Array.from({ length: 1000 }, () => 
        securityService.logSecurityEvent('test_event', 'low', 'Test message')
      );

      await Promise.all(promises);

      const securityEvents = await securityService.getSecurityEvents();
      
      // Should have rate limiting on security events
      expect(securityEvents.length).toBeLessThan(1000);
    });
  });
}); 