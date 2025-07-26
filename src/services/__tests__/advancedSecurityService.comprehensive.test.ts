import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedSecurityService } from '../advancedSecurityService';
import { User, SecurityEvent, AuditLog, Session } from '../../types/domain';

describe('Advanced Security Service - Comprehensive Security Testing', () => {
  let securityService: AdvancedSecurityService;
  let mockUser: User;

  beforeEach(() => {
    securityService = new AdvancedSecurityService();
    
    mockUser = {
      id: 'test-user-123',
      username: 'testuser',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      twoFactorEnabled: false,
      twoFactorSecret: null,
      lastLogin: new Date(),
      failedLoginAttempts: 0,
      accountLocked: false,
      lockoutUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Brute Force Attack Scenarios', () => {
    test('should detect and block rapid password attempts', async () => {
      const username = 'targetuser';
      const passwords = [
        'password', '123456', 'admin', 'root', 'test',
        'password123', 'admin123', 'qwerty', 'letmein',
        'welcome', 'monkey', 'dragon', 'master', 'user',
        'guest', 'demo', 'sample', 'example', 'default',
        'changeme', 'secret', 'private', 'secure', 'strong'
      ];

      // Attempt rapid password guesses
      for (let i = 0; i < passwords.length; i++) {
        const result = await securityService.authenticate(username, passwords[i]);
        
        if (i < 5) {
          // First 5 attempts should fail but not lock
          expect(result.success).toBe(false);
          expect(result.error).toBe('Invalid credentials');
        } else {
          // After 5 attempts, account should be locked
          expect(result.success).toBe(false);
          expect(result.error).toBe('Account is locked');
        }
      }

      // Verify account is locked
      const userStatus = await securityService.getUserStatus(username);
      expect(userStatus.accountLocked).toBe(true);
      expect(userStatus.lockoutUntil).toBeDefined();
      expect(userStatus.failedLoginAttempts).toBeGreaterThanOrEqual(5);
    });

    test('should implement progressive delays for failed attempts', async () => {
      const username = 'delayuser';
      const password = 'wrongpassword';

      const delays: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        await securityService.authenticate(username, password);
        
        const endTime = performance.now();
        const delay = endTime - startTime;
        delays.push(delay);
      }

      // Delays should increase progressively
      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1]);
      }

      // Later delays should be significantly longer
      expect(delays[9]).toBeGreaterThan(delays[0] * 2);
    });

    test('should detect distributed brute force attacks', async () => {
      const targetUsername = 'targetuser';
      const attackerIPs = [
        '192.168.1.100', '192.168.1.101', '192.168.1.102',
        '192.168.1.103', '192.168.1.104', '192.168.1.105',
        '192.168.1.106', '192.168.1.107', '192.168.1.108',
        '192.168.1.109', '192.168.1.110', '192.168.1.111'
      ];

      const passwords = ['password', '123456', 'admin', 'root', 'test'];

      // Simulate distributed attack from multiple IPs
      for (let i = 0; i < attackerIPs.length; i++) {
        for (let j = 0; j < passwords.length; j++) {
          await securityService.authenticate(targetUsername, passwords[j], {
            ipAddress: attackerIPs[i],
            userAgent: `Bot-${i}-${j}`,
            timestamp: new Date()
          });
        }
      }

      // Should detect distributed attack pattern
      const securityEvents = await securityService.getSecurityEvents();
      const distributedAttackEvents = securityEvents.filter(event => 
        event.type === 'distributed_brute_force' && 
        event.severity === 'critical'
      );

      expect(distributedAttackEvents.length).toBeGreaterThan(0);
    });

    test('should implement CAPTCHA after multiple failed attempts', async () => {
      const username = 'captchauser';
      const password = 'wrongpassword';

      // Attempt multiple failed logins
      for (let i = 0; i < 3; i++) {
        const result = await securityService.authenticate(username, password);
        expect(result.success).toBe(false);
      }

      // 4th attempt should require CAPTCHA
      const result = await securityService.authenticate(username, password);
      expect(result.success).toBe(false);
      expect(result.requiresCaptcha).toBe(true);
      expect(result.captchaToken).toBeDefined();

      // Attempt with valid CAPTCHA
      const captchaResult = await securityService.authenticate(username, password, {
        captchaToken: result.captchaToken,
        captchaResponse: 'valid-captcha-response'
      });

      expect(captchaResult.success).toBe(false); // Still wrong password
      expect(captchaResult.requiresCaptcha).toBe(false); // CAPTCHA validated
    });

    test('should detect credential stuffing attacks', async () => {
      const leakedCredentials = [
        { username: 'user1', password: 'password123' },
        { username: 'user2', password: 'password123' },
        { username: 'user3', password: 'password123' },
        { username: 'user4', password: 'password123' },
        { username: 'user5', password: 'password123' },
        { username: 'user6', password: 'password123' },
        { username: 'user7', password: 'password123' },
        { username: 'user8', password: 'password123' },
        { username: 'user9', password: 'password123' },
        { username: 'user10', password: 'password123' }
      ];

      // Attempt credential stuffing
      for (const credential of leakedCredentials) {
        await securityService.authenticate(credential.username, credential.password);
      }

      // Should detect credential stuffing pattern
      const securityEvents = await securityService.getSecurityEvents();
      const credentialStuffingEvents = securityEvents.filter(event => 
        event.type === 'credential_stuffing' && 
        event.severity === 'high'
      );

      expect(credentialStuffingEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Two-Factor Authentication Edge Cases', () => {
    test('should handle 2FA code expiration', async () => {
      const username = '2faexpireuser';
      const password = 'correctpassword';

      // Enable 2FA for user
      await securityService.enableTwoFactor(username);

      // Generate 2FA code
      const codeResult = await securityService.generateTwoFactorCode(username);
      expect(codeResult.code).toBeDefined();
      expect(codeResult.expiresAt).toBeDefined();

      // Simulate time passing (code expires)
      vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

      // Attempt authentication with expired code
      const authResult = await securityService.authenticate(username, password, codeResult.code);
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBe('Two-factor code expired');
    });

    test('should prevent 2FA code reuse', async () => {
      const username = '2fareuseuser';
      const password = 'correctpassword';

      await securityService.enableTwoFactor(username);

      // Generate 2FA code
      const codeResult = await securityService.generateTwoFactorCode(username);
      const code = codeResult.code;

      // Use code successfully
      const authResult1 = await securityService.authenticate(username, password, code);
      expect(authResult1.success).toBe(true);

      // Attempt to reuse the same code
      const authResult2 = await securityService.authenticate(username, password, code);
      expect(authResult2.success).toBe(false);
      expect(authResult2.error).toBe('Two-factor code already used');
    });

    test('should handle 2FA backup codes', async () => {
      const username = '2fabackupuser';
      const password = 'correctpassword';

      await securityService.enableTwoFactor(username);

      // Generate backup codes
      const backupCodes = await securityService.generateBackupCodes(username);
      expect(backupCodes.length).toBe(10);

      // Use a backup code
      const usedCode = backupCodes[0];
      const authResult = await securityService.authenticate(username, password, usedCode);
      expect(authResult.success).toBe(true);

      // Attempt to reuse the same backup code
      const reuseResult = await securityService.authenticate(username, password, usedCode);
      expect(reuseResult.success).toBe(false);
      expect(reuseResult.error).toBe('Backup code already used');

      // Verify backup code is marked as used
      const remainingCodes = await securityService.getRemainingBackupCodes(username);
      expect(remainingCodes).not.toContain(usedCode);
      expect(remainingCodes.length).toBe(9);
    });

    test('should handle 2FA device loss scenarios', async () => {
      const username = '2fadevicelossuser';
      const password = 'correctpassword';

      await securityService.enableTwoFactor(username);

      // Simulate device loss
      const recoveryResult = await securityService.initiateTwoFactorRecovery(username);
      expect(recoveryResult.recoveryToken).toBeDefined();
      expect(recoveryResult.expiresAt).toBeDefined();

      // Verify recovery token
      const verifyResult = await securityService.verifyRecoveryToken(username, recoveryResult.recoveryToken);
      expect(verifyResult.valid).toBe(true);

      // Disable 2FA using recovery token
      const disableResult = await securityService.disableTwoFactor(username, recoveryResult.recoveryToken);
      expect(disableResult.success).toBe(true);

      // Verify 2FA is disabled
      const userStatus = await securityService.getUserStatus(username);
      expect(userStatus.twoFactorEnabled).toBe(false);
    });

    test('should handle 2FA rate limiting', async () => {
      const username = '2farateuser';
      const password = 'correctpassword';

      await securityService.enableTwoFactor(username);

      // Attempt multiple 2FA codes rapidly
      const invalidCodes = ['000000', '111111', '222222', '333333', '444444'];

      for (const code of invalidCodes) {
        const result = await securityService.authenticate(username, password, code);
        expect(result.success).toBe(false);
      }

      // Next attempt should be rate limited
      const rateLimitedResult = await securityService.authenticate(username, password, '555555');
      expect(rateLimitedResult.success).toBe(false);
      expect(rateLimitedResult.error).toBe('Too many 2FA attempts');
    });

    test('should handle 2FA time drift', async () => {
      const username = '2fatimedriftuser';
      const password = 'correctpassword';

      await securityService.enableTwoFactor(username);

      // Generate code with time drift
      const codeResult = await securityService.generateTwoFactorCode(username);
      
      // Simulate time drift (30 seconds)
      vi.advanceTimersByTime(30 * 1000);

      // Should still accept code within tolerance window
      const authResult = await securityService.authenticate(username, password, codeResult.code);
      expect(authResult.success).toBe(true);
    });
  });

  describe('Audit Log Integrity Validation', () => {
    test('should prevent audit log tampering', async () => {
      const username = 'audittamperuser';
      const action = 'sensitive_action';

      // Perform action that should be logged
      await securityService.logAuditEvent(username, action, { sensitive: 'data' });

      // Attempt to retrieve audit logs
      const auditLogs = await securityService.getAuditLogs();

      // Verify logs are properly secured
      expect(auditLogs).toBeDefined();
      expect(Array.isArray(auditLogs)).toBe(true);

      // Verify sensitive data is not exposed
      for (const log of auditLogs) {
        expect(log.sensitive).toBeUndefined();
        expect(log.password).toBeUndefined();
        expect(log.creditCard).toBeUndefined();
        expect(log.ssn).toBeUndefined();
      }

      // Verify log integrity
      for (const log of auditLogs) {
        const integrityCheck = await securityService.verifyAuditLogIntegrity(log);
        expect(integrityCheck.valid).toBe(true);
        expect(integrityCheck.tampered).toBe(false);
      }
    });

    test('should detect audit log injection attacks', async () => {
      const maliciousPayloads = [
        'admin\n[ERROR] System compromised',
        'user\r\n[WARN] Security breach',
        'test\n[INFO] Password: secret',
        'guest\r[DEBUG] Admin access granted',
        'demo\n[CRITICAL] Database exposed'
      ];

      for (const payload of maliciousPayloads) {
        await securityService.logAuditEvent(payload, 'test_action', {});

        // Verify logs are properly escaped
        const auditLogs = await securityService.getAuditLogs();
        const lastLog = auditLogs[auditLogs.length - 1];

        expect(lastLog.username).not.toContain('[ERROR]');
        expect(lastLog.username).not.toContain('[WARN]');
        expect(lastLog.username).not.toContain('[INFO]');
        expect(lastLog.username).not.toContain('[DEBUG]');
        expect(lastLog.username).not.toContain('[CRITICAL]');
        expect(lastLog.username).not.toContain('Password: secret');
      }
    });

    test('should implement audit log retention policies', async () => {
      const username = 'retentionuser';

      // Create old audit logs
      const oldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      
      await securityService.logAuditEvent(username, 'old_action', {}, oldDate);

      // Apply retention policy
      await securityService.applyRetentionPolicy();

      // Verify old logs are removed
      const auditLogs = await securityService.getAuditLogs();
      const oldLogs = auditLogs.filter(log => 
        new Date(log.timestamp) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days
      );

      expect(oldLogs.length).toBe(0);
    });

    test('should handle audit log encryption', async () => {
      const username = 'encryptionuser';
      const sensitiveData = { creditCard: '1234-5678-9012-3456', ssn: '123-45-6789' };

      // Log sensitive data
      await securityService.logAuditEvent(username, 'sensitive_action', sensitiveData);

      // Verify data is encrypted in storage
      const rawLogs = await securityService.getRawAuditLogs();
      const lastLog = rawLogs[rawLogs.length - 1];

      expect(lastLog.data).not.toContain('1234-5678-9012-3456');
      expect(lastLog.data).not.toContain('123-45-6789');
      expect(lastLog.encrypted).toBe(true);

      // Verify data is decrypted when retrieved
      const decryptedLogs = await securityService.getAuditLogs();
      const decryptedLog = decryptedLogs[decryptedLogs.length - 1];

      expect(decryptedLog.data.creditCard).toBe('1234-5678-9012-3456');
      expect(decryptedLog.data.ssn).toBe('123-45-6789');
    });

    test('should implement audit log signing', async () => {
      const username = 'signinguser';

      // Log an event
      await securityService.logAuditEvent(username, 'signed_action', {});

      // Verify log is signed
      const auditLogs = await securityService.getAuditLogs();
      const lastLog = auditLogs[auditLogs.length - 1];

      expect(lastLog.signature).toBeDefined();
      expect(lastLog.publicKey).toBeDefined();

      // Verify signature
      const signatureValid = await securityService.verifyAuditLogSignature(lastLog);
      expect(signatureValid).toBe(true);
    });
  });

  describe('Session Management Security', () => {
    test('should prevent session fixation attacks', async () => {
      const username = 'sessionfixuser';
      const password = 'correctpassword';

      // Create initial session
      const initialResult = await securityService.authenticate(username, password);
      expect(initialResult.success).toBe(true);

      const sessionToken = initialResult.user?.sessionToken;
      expect(sessionToken).toBeDefined();

      // Attempt to reuse session token after logout
      await securityService.logout(sessionToken!);

      const sessionValidation = await securityService.validateSession(sessionToken!);
      expect(sessionValidation.valid).toBe(false);
      expect(sessionValidation.error).toBe('Session invalidated');
    });

    test('should implement session timeout', async () => {
      const username = 'sessiontimeoutuser';
      const password = 'correctpassword';

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

    test('should handle concurrent session limits', async () => {
      const username = 'concurrentuser';
      const password = 'correctpassword';

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

      // Verify oldest sessions are invalidated
      const sessionTokens = validSessions.map(s => s.user?.sessionToken).filter(Boolean);
      for (const token of sessionTokens) {
        const validation = await securityService.validateSession(token!);
        expect(validation.valid).toBe(true);
      }
    });

    test('should detect session hijacking attempts', async () => {
      const username = 'sessionhijackuser';
      const password = 'correctpassword';

      const result = await securityService.authenticate(username, password);
      expect(result.success).toBe(true);

      const sessionToken = result.user?.sessionToken;
      expect(sessionToken).toBeDefined();

      // Simulate session hijacking (different IP, user agent)
      const hijackValidation = await securityService.validateSession(sessionToken!, {
        ipAddress: '192.168.1.200', // Different IP
        userAgent: 'Malicious Bot 1.0', // Different user agent
        timestamp: new Date()
      });

      expect(hijackValidation.valid).toBe(false);
      expect(hijackValidation.error).toBe('Suspicious session activity');
    });

    test('should implement session rotation', async () => {
      const username = 'sessionrotationuser';
      const password = 'correctpassword';

      const result = await securityService.authenticate(username, password);
      expect(result.success).toBe(true);

      const originalToken = result.user?.sessionToken;
      expect(originalToken).toBeDefined();

      // Perform sensitive action that triggers session rotation
      const rotationResult = await securityService.rotateSession(originalToken!);
      expect(rotationResult.success).toBe(true);

      const newToken = rotationResult.newSessionToken;
      expect(newToken).toBeDefined();
      expect(newToken).not.toBe(originalToken);

      // Old token should be invalid
      const oldTokenValidation = await securityService.validateSession(originalToken!);
      expect(oldTokenValidation.valid).toBe(false);

      // New token should be valid
      const newTokenValidation = await securityService.validateSession(newToken!);
      expect(newTokenValidation.valid).toBe(true);
    });
  });

  describe('Rate Limiting Effectiveness', () => {
    test('should implement IP-based rate limiting', async () => {
      const ipAddress = '192.168.1.100';
      const username = 'rateuser';
      const password = 'wrongpassword';

      // Attempt multiple logins from same IP
      for (let i = 0; i < 10; i++) {
        const result = await securityService.authenticate(username, password, undefined, {
          ipAddress,
          userAgent: 'Test Bot',
          timestamp: new Date()
        });

        if (i < 5) {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Invalid credentials');
        } else {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Rate limit exceeded');
        }
      }

      // Verify IP is rate limited
      const rateLimitStatus = await securityService.getRateLimitStatus(ipAddress);
      expect(rateLimitStatus.limited).toBe(true);
      expect(rateLimitStatus.remainingAttempts).toBe(0);
    });

    test('should implement user-based rate limiting', async () => {
      const username = 'userrateuser';
      const password = 'wrongpassword';

      // Attempt multiple logins for same user
      for (let i = 0; i < 10; i++) {
        const result = await securityService.authenticate(username, password);

        if (i < 5) {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Invalid credentials');
        } else {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Account temporarily locked');
        }
      }

      // Verify user is rate limited
      const userStatus = await securityService.getUserStatus(username);
      expect(userStatus.accountLocked).toBe(true);
      expect(userStatus.lockoutUntil).toBeDefined();
    });

    test('should implement adaptive rate limiting', async () => {
      const ipAddress = '192.168.1.200';
      const username = 'adaptiverateuser';
      const password = 'wrongpassword';

      // First round of attempts
      for (let i = 0; i < 5; i++) {
        await securityService.authenticate(username, password, undefined, { ipAddress });
      }

      // Wait for rate limit to reset
      vi.advanceTimersByTime(15 * 60 * 1000); // 15 minutes

      // Second round should have stricter limits
      for (let i = 0; i < 3; i++) {
        const result = await securityService.authenticate(username, password, undefined, { ipAddress });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Rate limit exceeded');
      }

      // Verify adaptive rate limiting is applied
      const rateLimitStatus = await securityService.getRateLimitStatus(ipAddress);
      expect(rateLimitStatus.adaptive).toBe(true);
      expect(rateLimitStatus.multiplier).toBeGreaterThan(1);
    });

    test('should handle rate limit bypass attempts', async () => {
      const baseIP = '192.168.1.100';
      const username = 'bypassuser';
      const password = 'wrongpassword';

      // Attempt to bypass rate limiting by using different IPs
      for (let i = 0; i < 20; i++) {
        const ipAddress = `${baseIP.split('.')[0]}.${baseIP.split('.')[1]}.${baseIP.split('.')[2]}.${100 + i}`;
        
        const result = await securityService.authenticate(username, password, undefined, { ipAddress });

        if (i < 10) {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Invalid credentials');
        } else {
          expect(result.success).toBe(false);
          expect(result.error).toBe('Suspicious activity detected');
        }
      }

      // Should detect bypass attempt
      const securityEvents = await securityService.getSecurityEvents();
      const bypassEvents = securityEvents.filter(event => 
        event.type === 'rate_limit_bypass_attempt' && 
        event.severity === 'high'
      );

      expect(bypassEvents.length).toBeGreaterThan(0);
    });

    test('should implement rate limit whitelisting', async () => {
      const trustedIP = '10.0.0.100';
      const username = 'whitelistuser';
      const password = 'wrongpassword';

      // Add IP to whitelist
      await securityService.addToWhitelist(trustedIP, 'trusted_network');

      // Attempt multiple logins from whitelisted IP
      for (let i = 0; i < 20; i++) {
        const result = await securityService.authenticate(username, password, undefined, {
          ipAddress: trustedIP,
          userAgent: 'Trusted Client',
          timestamp: new Date()
        });

        // Should not be rate limited
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
        expect(result.error).not.toBe('Rate limit exceeded');
      }

      // Verify IP is whitelisted
      const whitelistStatus = await securityService.getWhitelistStatus(trustedIP);
      expect(whitelistStatus.whitelisted).toBe(true);
      expect(whitelistStatus.reason).toBe('trusted_network');
    });
  });

  describe('Advanced Security Monitoring', () => {
    test('should detect anomalous login patterns', async () => {
      const username = 'anomaloususer';
      const normalIP = '192.168.1.100';
      const suspiciousIP = '203.0.113.50'; // Different country/region

      // Normal login
      await securityService.authenticate(username, 'correctpassword', undefined, {
        ipAddress: normalIP,
        userAgent: 'Chrome/91.0',
        timestamp: new Date()
      });

      // Suspicious login from different location
      const suspiciousResult = await securityService.authenticate(username, 'correctpassword', undefined, {
        ipAddress: suspiciousIP,
        userAgent: 'Chrome/91.0',
        timestamp: new Date()
      });

      expect(suspiciousResult.success).toBe(false);
      expect(suspiciousResult.requiresVerification).toBe(true);
      expect(suspiciousResult.verificationType).toBe('location_change');
    });

    test('should implement security score calculation', async () => {
      const username = 'securityscoreuser';

      // Perform various security-related actions
      await securityService.logAuditEvent(username, 'login', {});
      await securityService.logAuditEvent(username, 'password_change', {});
      await securityService.logAuditEvent(username, 'two_factor_enabled', {});

      const securityScore = await securityService.calculateSecurityScore(username);
      
      expect(securityScore.score).toBeDefined();
      expect(securityScore.score).toBeGreaterThan(0);
      expect(securityScore.score).toBeLessThanOrEqual(100);
      expect(securityScore.factors).toBeDefined();
      expect(Array.isArray(securityScore.factors)).toBe(true);
    });

    test('should handle security incident response', async () => {
      const username = 'incidentuser';

      // Trigger security incident
      await securityService.logSecurityEvent('suspicious_activity', {
        username,
        ipAddress: '192.168.1.100',
        severity: 'high'
      });

      // Verify incident response
      const incidents = await securityService.getSecurityIncidents();
      const recentIncident = incidents[0];

      expect(recentIncident.type).toBe('suspicious_activity');
      expect(recentIncident.severity).toBe('high');
      expect(recentIncident.status).toBe('investigating');
      expect(recentIncident.responseActions).toBeDefined();
      expect(Array.isArray(recentIncident.responseActions)).toBe(true);
    });
  });
}); 