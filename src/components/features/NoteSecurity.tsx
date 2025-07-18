import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';

interface SecuritySettings {
  encryption: {
    enabled: boolean;
    algorithm: 'AES-256' | 'ChaCha20';
    keyDerivation: 'PBKDF2' | 'Argon2';
    iterations: number;
  };
  access: {
    requirePassword: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
  };
  audit: {
    enabled: boolean;
    logLevel: 'basic' | 'detailed' | 'verbose';
    retentionDays: number;
  };
  privacy: {
    autoLock: boolean;
    hidePreview: boolean;
    encryptMetadata: boolean;
  };
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'note_access' | 'note_modify' | 'security_change';
  userId: string;
  timestamp: Date;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

interface NoteSecurityProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteSecurity: React.FC<NoteSecurityProps> = ({ isOpen, onClose }) => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [settings, setSettings] = useState<SecuritySettings>({
    encryption: {
      enabled: true,
      algorithm: 'AES-256',
      keyDerivation: 'PBKDF2',
      iterations: 100000
    },
    access: {
      requirePassword: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 15
    },
    audit: {
      enabled: true,
      logLevel: 'detailed',
      retentionDays: 90
    },
    privacy: {
      autoLock: true,
      hidePreview: false,
      encryptMetadata: true
    }
  });
  
  const [activeTab, setActiveTab] = useState<'overview' | 'encryption' | 'access' | 'audit' | 'privacy'>('overview');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize security events
  useMemo(() => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'login',
        userId: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        details: 'Successful login from 192.168.1.100',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true
      },
      {
        id: '2',
        type: 'note_access',
        userId: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        details: 'Accessed note: Project Planning',
        success: true
      },
      {
        id: '3',
        type: 'note_modify',
        userId: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        details: 'Modified note: Meeting Notes',
        success: true
      },
      {
        id: '4',
        type: 'security_change',
        userId: 'user1',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        details: 'Changed encryption settings',
        success: true
      }
    ];
    setSecurityEvents(mockEvents);
  }, []);

  // Update settings
  const updateSettings = useCallback((updates: Partial<SecuritySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    loggingService.info('Security settings updated', updates);
  }, []);

  // Change password
  const changePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);
      
      loggingService.info('Password changed successfully');
    } catch (error) {
      loggingService.error('Password change failed', error as Error);
    } finally {
      setIsChangingPassword(false);
    }
  }, [newPassword, confirmPassword]);

  // Get security score
  const getSecurityScore = useCallback(() => {
    let score = 0;
    if (settings.encryption.enabled) score += 25;
    if (settings.access.requirePassword) score += 20;
    if (settings.audit.enabled) score += 15;
    if (settings.privacy.autoLock) score += 10;
    if (settings.privacy.encryptMetadata) score += 10;
    if (settings.access.maxLoginAttempts <= 5) score += 10;
    if (settings.encryption.iterations >= 100000) score += 10;
    return Math.min(score, 100);
  }, [settings]);

  // Get security level
  const getSecurityLevel = useCallback((score: number) => {
    if (score >= 90) return { level: 'Excellent', color: '#28a745' };
    if (score >= 70) return { level: 'Good', color: '#17a2b8' };
    if (score >= 50) return { level: 'Fair', color: '#ffc107' };
    return { level: 'Poor', color: '#dc3545' };
  }, []);

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const securityScore = getSecurityScore();
  const securityLevel = getSecurityLevel(securityScore);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '1000px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>Security & Privacy</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close security panel"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '24px'
        }}>
          {[
            { value: 'overview', label: 'Overview', icon: '🛡️' },
            { value: 'encryption', label: 'Encryption', icon: '🔐' },
            { value: 'access', label: 'Access Control', icon: '🔑' },
            { value: 'audit', label: 'Audit Log', icon: '📋' },
            { value: 'privacy', label: 'Privacy', icon: '👁️' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.value ? colors.primary : 'transparent',
                color: activeTab === tab.value ? 'white' : colors.text,
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.value ? `2px solid ${colors.primary}` : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Security Overview</h3>
            
            {/* Security Score */}
            <div style={{
              padding: '24px',
              background: colors.surface,
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: securityLevel.color }}>
                {securityScore}
              </div>
              <div style={{ fontSize: '18px', color: colors.text, marginBottom: '8px' }}>
                Security Score
              </div>
              <div style={{
                padding: '4px 12px',
                background: securityLevel.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '14px',
                display: 'inline-block'
              }}>
                {securityLevel.level}
              </div>
            </div>

            {/* Security Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                padding: '16px',
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔐</div>
                <div style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                  Encryption
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {settings.encryption.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔑</div>
                <div style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                  Access Control
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {settings.access.requirePassword ? 'Password Required' : 'No Password'}
                </div>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
                <div style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                  Audit Logging
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {settings.audit.enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              
              <div style={{
                padding: '16px',
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>👁️</div>
                <div style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                  Privacy
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {settings.privacy.autoLock ? 'Auto-lock Enabled' : 'Auto-lock Disabled'}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowPasswordDialog(true)}
                  style={{
                    padding: '8px 16px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Change Password
                </button>
                <button
                  onClick={() => setActiveTab('encryption')}
                  style={{
                    padding: '8px 16px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: colors.text
                  }}
                >
                  Configure Encryption
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  style={{
                    padding: '8px 16px',
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: colors.text
                  }}
                >
                  View Audit Log
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Encryption Tab */}
        {activeTab === 'encryption' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Encryption Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Data Encryption</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.encryption.enabled}
                      onChange={(e) => updateSettings({
                        encryption: { ...settings.encryption, enabled: e.target.checked }
                      })}
                    />
                    <span style={{ color: colors.text }}>Enable data encryption</span>
                  </label>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Encryption Algorithm:
                    </label>
                    <select
                      value={settings.encryption.algorithm}
                      onChange={(e) => updateSettings({
                        encryption: { ...settings.encryption, algorithm: e.target.value as any }
                      })}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    >
                      <option value="AES-256">AES-256 (Recommended)</option>
                      <option value="ChaCha20">ChaCha20</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Key Derivation:
                    </label>
                    <select
                      value={settings.encryption.keyDerivation}
                      onChange={(e) => updateSettings({
                        encryption: { ...settings.encryption, keyDerivation: e.target.value as any }
                      })}
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    >
                      <option value="PBKDF2">PBKDF2</option>
                      <option value="Argon2">Argon2 (Recommended)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Iterations: {settings.encryption.iterations.toLocaleString()}
                    </label>
                    <input
                      type="range"
                      min="10000"
                      max="1000000"
                      step="10000"
                      value={settings.encryption.iterations}
                      onChange={(e) => updateSettings({
                        encryption: { ...settings.encryption, iterations: parseInt(e.target.value) }
                      })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Encryption Status</h4>
                
                <div style={{
                  padding: '16px',
                  background: colors.surface,
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Encrypted Notes:
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                      {notes.length}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Encryption Status:
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      background: settings.encryption.enabled ? '#28a745' : '#dc3545',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      display: 'inline-block'
                    }}>
                      {settings.encryption.enabled ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Last Encryption:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Control Tab */}
        {activeTab === 'access' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Access Control</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Authentication</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.access.requirePassword}
                      onChange={(e) => updateSettings({
                        access: { ...settings.access, requirePassword: e.target.checked }
                      })}
                    />
                    <span style={{ color: colors.text }}>Require password on startup</span>
                  </label>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Session Timeout (minutes):
                    </label>
                    <input
                      type="number"
                      value={settings.access.sessionTimeout}
                      onChange={(e) => updateSettings({
                        access: { ...settings.access, sessionTimeout: parseInt(e.target.value) }
                      })}
                      min="5"
                      max="1440"
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Max Login Attempts:
                    </label>
                    <input
                      type="number"
                      value={settings.access.maxLoginAttempts}
                      onChange={(e) => updateSettings({
                        access: { ...settings.access, maxLoginAttempts: parseInt(e.target.value) }
                      })}
                      min="3"
                      max="10"
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Lockout Duration (minutes):
                    </label>
                    <input
                      type="number"
                      value={settings.access.lockoutDuration}
                      onChange={(e) => updateSettings({
                        access: { ...settings.access, lockoutDuration: parseInt(e.target.value) }
                      })}
                      min="5"
                      max="60"
                      style={{
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Current Session</h4>
                
                <div style={{
                  padding: '16px',
                  background: colors.surface,
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Session Start:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      {new Date(Date.now() - 1000 * 60 * 30).toLocaleString()}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Time Remaining:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      {settings.access.sessionTimeout} minutes
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Login Attempts:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      1 / {settings.access.maxLoginAttempts}
                    </div>
                  </div>
                  
                  <button
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Lock Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Audit Log</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: colors.text }}>Security Events</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    style={{
                      padding: '6px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                  >
                    <option value="all">All Events</option>
                    <option value="login">Login</option>
                    <option value="note_access">Note Access</option>
                    <option value="security_change">Security Changes</option>
                  </select>
                  <button
                    style={{
                      padding: '6px 12px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Export Log
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {securityEvents.map(event => (
                <div key={event.id} style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  background: colors.background
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          padding: '2px 6px',
                          background: event.success ? '#28a745' : '#dc3545',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px',
                          textTransform: 'capitalize'
                        }}>
                          {event.type.replace('_', ' ')}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: colors.textSecondary
                        }}>
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      <div style={{ color: colors.text, fontSize: '14px' }}>
                        {event.details}
                      </div>
                      {event.ipAddress && (
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                          IP: {event.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Privacy Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Privacy Controls</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.autoLock}
                      onChange={(e) => updateSettings({
                        privacy: { ...settings.privacy, autoLock: e.target.checked }
                      })}
                    />
                    <span style={{ color: colors.text }}>Auto-lock on inactivity</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.hidePreview}
                      onChange={(e) => updateSettings({
                        privacy: { ...settings.privacy, hidePreview: e.target.checked }
                      })}
                    />
                    <span style={{ color: colors.text }}>Hide note previews</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.encryptMetadata}
                      onChange={(e) => updateSettings({
                        privacy: { ...settings.privacy, encryptMetadata: e.target.checked }
                      })}
                    />
                    <span style={{ color: colors.text }}>Encrypt metadata</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Data Privacy</h4>
                
                <div style={{
                  padding: '16px',
                  background: colors.surface,
                  borderRadius: '8px'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Data Retention:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      {settings.audit.retentionDays} days
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Analytics:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      Disabled
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '14px', color: colors.text, marginBottom: '4px' }}>
                      Telemetry:
                    </div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                      Disabled
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Dialog */}
        {showPasswordDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: colors.overlay,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%'
            }}>
              <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Change Password</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Current Password:
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    New Password:
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Confirm New Password:
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowPasswordDialog(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: colors.text
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={changePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                      opacity: isChangingPassword ? 0.6 : 1
                    }}
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSecurity; 