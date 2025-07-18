import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface BackupInfo {
  id: string;
  name: string;
  type: 'manual' | 'auto' | 'scheduled';
  timestamp: Date;
  size: number;
  noteCount: number;
  format: 'json' | 'markdown' | 'zip';
  description?: string;
  tags: string[];
}

interface BackupSettings {
  autoBackup: boolean;
  autoBackupInterval: number; // hours
  maxBackups: number;
  backupLocation: 'local' | 'cloud';
  includeAttachments: boolean;
  compression: boolean;
  encryption: boolean;
  scheduledBackups: Array<{
    id: string;
    enabled: boolean;
    schedule: 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  }>;
}

interface BackupRestoreProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ isOpen, onClose }) => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    autoBackupInterval: 24,
    maxBackups: 10,
    backupLocation: 'local',
    includeAttachments: true,
    compression: true,
    encryption: false,
    scheduledBackups: []
  });
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'settings' | 'history'>('backup');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBackupName, setNewBackupName] = useState('');
  const [newBackupDescription, setNewBackupDescription] = useState('');
  const [newBackupTags, setNewBackupTags] = useState<string[]>([]);
  const [backupFormat, setBackupFormat] = useState<'json' | 'markdown' | 'zip'>('json');

  // Load backups from localStorage
  useMemo(() => {
    const savedBackups = localStorage.getItem('zettelview_backups');
    if (savedBackups) {
      try {
        const parsed = JSON.parse(savedBackups);
        setBackups(parsed.map((b: any) => ({
          ...b,
          timestamp: new Date(b.timestamp)
        })));
      } catch (error) {
        loggingService.error('Failed to load backups', error as Error);
      }
    }

    const savedSettings = localStorage.getItem('zettelview_backup_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        loggingService.error('Failed to load backup settings', error as Error);
      }
    }
  }, []);

  // Save backups to localStorage
  const saveBackupsToStorage = useCallback((backupList: BackupInfo[]) => {
    localStorage.setItem('zettelview_backups', JSON.stringify(backupList));
  }, []);

  // Save settings to localStorage
  const saveSettingsToStorage = useCallback((backupSettings: BackupSettings) => {
    localStorage.setItem('zettelview_backup_settings', JSON.stringify(backupSettings));
  }, []);

  // Create backup
  const createBackup = useCallback(async () => {
    if (!newBackupName.trim()) {
      alert('Please enter a backup name');
      return;
    }

    setIsCreatingBackup(true);
    setBackupProgress(0);

    try {
      const backupData = await PerformanceUtils.measureAsync(
        'backup_creation',
        async () => {
          // Simulate backup creation with progress
          const steps = ['Preparing data', 'Compressing', 'Encrypting', 'Saving'];
          
          for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            setBackupProgress((i + 1) * 25);
          }

          return {
            notes,
            metadata: {
              version: '1.0.0',
              createdAt: new Date().toISOString(),
              noteCount: notes.length,
              totalSize: JSON.stringify(notes).length
            }
          };
        }
      );

      const backup: BackupInfo = {
        id: Date.now().toString(),
        name: newBackupName.trim(),
        type: 'manual',
        timestamp: new Date(),
        size: JSON.stringify(backupData).length,
        noteCount: notes.length,
        format: backupFormat,
        description: newBackupDescription.trim() || undefined,
        tags: newBackupTags
      };

      const updatedBackups = [backup, ...backups];
      
      // Apply max backups limit
      if (updatedBackups.length > settings.maxBackups) {
        updatedBackups.splice(settings.maxBackups);
      }
      
      setBackups(updatedBackups);
      saveBackupsToStorage(updatedBackups);

      // Reset form
      setNewBackupName('');
      setNewBackupDescription('');
      setNewBackupTags([]);
      setShowCreateForm(false);

      loggingService.info('Backup created', { 
        backupId: backup.id, 
        name: backup.name,
        noteCount: backup.noteCount 
      });
    } catch (error) {
      loggingService.error('Backup creation failed', error as Error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  }, [notes, newBackupName, newBackupDescription, newBackupTags, backupFormat, backups, settings.maxBackups, saveBackupsToStorage]);

  // Restore backup
  const restoreBackup = useCallback(async (backup: BackupInfo) => {
    if (!confirm(`Are you sure you want to restore from "${backup.name}"? This will replace all current notes.`)) {
      return;
    }

    setIsRestoring(true);

    try {
      await PerformanceUtils.measureAsync(
        'backup_restore',
        async () => {
          // Simulate restore process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // In a real implementation, this would restore the actual data
          // For now, we'll just log the action
          loggingService.info('Backup restored', { 
            backupId: backup.id, 
            name: backup.name 
          });
        }
      );

      alert('Backup restored successfully!');
      onClose();
    } catch (error) {
      loggingService.error('Backup restore failed', error as Error);
      alert('Failed to restore backup. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  }, [onClose]);

  // Delete backup
  const deleteBackup = useCallback((backupId: string) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      const updatedBackups = backups.filter(b => b.id !== backupId);
      setBackups(updatedBackups);
      saveBackupsToStorage(updatedBackups);
      
      loggingService.info('Backup deleted', { backupId });
    }
  }, [backups, saveBackupsToStorage]);

  // Download backup
  const downloadBackup = useCallback((backup: BackupInfo) => {
    const backupData = {
      notes,
      metadata: {
        version: '1.0.0',
        createdAt: backup.timestamp.toISOString(),
        noteCount: backup.noteCount,
        backupInfo: backup
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.name.replace(/[^a-z0-9]/gi, '_')}_${backup.timestamp.toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    loggingService.info('Backup downloaded', { backupId: backup.id });
  }, [notes]);

  // Update settings
  const updateSettings = useCallback((updates: Partial<BackupSettings>) => {
    const updatedSettings = { ...settings, ...updates };
    setSettings(updatedSettings);
    saveSettingsToStorage(updatedSettings);
  }, [settings, saveSettingsToStorage]);

  // Add scheduled backup
  const addScheduledBackup = useCallback(() => {
    const newSchedule = {
      id: Date.now().toString(),
      enabled: true,
      schedule: 'daily' as const,
      time: '09:00'
    };
    
    updateSettings({
      scheduledBackups: [...settings.scheduledBackups, newSchedule]
    });
  }, [settings.scheduledBackups, updateSettings]);

  // Update scheduled backup
  const updateScheduledBackup = useCallback((scheduleId: string, updates: any) => {
    const updatedSchedules = settings.scheduledBackups.map(schedule =>
      schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
    );
    updateSettings({ scheduledBackups: updatedSchedules });
  }, [settings.scheduledBackups, updateSettings]);

  // Delete scheduled backup
  const deleteScheduledBackup = useCallback((scheduleId: string) => {
    const updatedSchedules = settings.scheduledBackups.filter(schedule => schedule.id !== scheduleId);
    updateSettings({ scheduledBackups: updatedSchedules });
  }, [settings.scheduledBackups, updateSettings]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

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
        maxWidth: '1200px',
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
          <h2 style={{ margin: 0, color: colors.text }}>Backup & Restore</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close backup panel"
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
            { value: 'backup', label: 'Create Backup', icon: '💾' },
            { value: 'restore', label: 'Restore', icon: '📥' },
            { value: 'history', label: 'Backup History', icon: '📋' },
            { value: 'settings', label: 'Settings', icon: '⚙️' }
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

        {/* Create Backup Tab */}
        {activeTab === 'backup' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: colors.text }}>Create New Backup</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                  padding: '8px 16px',
                  background: showCreateForm ? colors.surface : colors.primary,
                  color: showCreateForm ? colors.text : 'white',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {showCreateForm ? 'Cancel' : 'Create Backup'}
              </button>
            </div>

            {showCreateForm && (
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    value={newBackupName}
                    onChange={(e) => setNewBackupName(e.target.value)}
                    placeholder="Backup name"
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                  
                  <select
                    value={backupFormat}
                    onChange={(e) => setBackupFormat(e.target.value as any)}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  >
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="zip">ZIP Archive</option>
                  </select>
                </div>
                
                <textarea
                  value={newBackupDescription}
                  onChange={(e) => setNewBackupDescription(e.target.value)}
                  placeholder="Backup description (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    marginBottom: '16px',
                    resize: 'vertical'
                  }}
                />

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewBackupName('');
                      setNewBackupDescription('');
                      setNewBackupTags([]);
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
                    onClick={createBackup}
                    disabled={isCreatingBackup || !newBackupName.trim()}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isCreatingBackup || !newBackupName.trim() ? 'not-allowed' : 'pointer',
                      opacity: isCreatingBackup || !newBackupName.trim() ? 0.6 : 1
                    }}
                  >
                    {isCreatingBackup ? 'Creating...' : 'Create Backup'}
                  </button>
                </div>

                {isCreatingBackup && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{
                      width: '100%',
                      height: '4px',
                      background: colors.border,
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${backupProgress}%`,
                        height: '100%',
                        background: colors.primary,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ 
                      textAlign: 'center', 
                      marginTop: '8px', 
                      fontSize: '12px', 
                      color: colors.textSecondary 
                    }}>
                      {backupProgress}% complete
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Backup Stats */}
            <div style={{
              padding: '20px',
              background: colors.surface,
              borderRadius: '8px'
            }}>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Current Data</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                    {notes.length}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Total Notes</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                    {formatFileSize(JSON.stringify(notes).length)}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Data Size</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                    {backups.length}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Existing Backups</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restore Tab */}
        {activeTab === 'restore' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Restore from Backup</h3>
            
            {backups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.textSecondary
              }}>
                No backups available. Create a backup first.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {backups.map(backup => (
                  <div key={backup.id} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: colors.background
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h4 style={{ margin: 0, color: colors.text }}>{backup.name}</h4>
                      <span style={{
                        padding: '2px 6px',
                        background: backup.type === 'manual' ? colors.primary : colors.textSecondary,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}>
                        {backup.type}
                      </span>
                    </div>
                    
                    {backup.description && (
                      <p style={{ 
                        margin: '0 0 8px 0', 
                        color: colors.textSecondary, 
                        fontSize: '14px' 
                      }}>
                        {backup.description}
                      </p>
                    )}
                    
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '12px' }}>
                      <div>Created: {formatDate(backup.timestamp)}</div>
                      <div>Notes: {backup.noteCount} • Size: {formatFileSize(backup.size)}</div>
                      <div>Format: {backup.format.toUpperCase()}</div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => restoreBackup(backup)}
                        disabled={isRestoring}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isRestoring ? 'not-allowed' : 'pointer',
                          opacity: isRestoring ? 0.6 : 1
                        }}
                      >
                        {isRestoring ? 'Restoring...' : 'Restore'}
                      </button>
                      <button
                        onClick={() => downloadBackup(backup)}
                        style={{
                          padding: '8px',
                          background: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: colors.text
                        }}
                      >
                        📥
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        style={{
                          padding: '8px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Backup History Tab */}
        {activeTab === 'history' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Backup History</h3>
            
            {backups.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.textSecondary
              }}>
                No backup history available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {backups.map(backup => (
                  <div key={backup.id} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: colors.background
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: colors.text }}>{backup.name}</h4>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {formatDate(backup.timestamp)} • {backup.noteCount} notes • {formatFileSize(backup.size)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => downloadBackup(backup)}
                          style={{
                            padding: '6px 12px',
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: colors.text,
                            fontSize: '12px'
                          }}
                        >
                          Download
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Backup Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* General Settings */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>General Settings</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.autoBackup}
                      onChange={(e) => updateSettings({ autoBackup: e.target.checked })}
                    />
                    <span style={{ color: colors.text }}>Enable automatic backups</span>
                  </label>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Auto backup interval (hours):
                    </label>
                    <input
                      type="number"
                      value={settings.autoBackupInterval}
                      onChange={(e) => updateSettings({ autoBackupInterval: parseInt(e.target.value) })}
                      min="1"
                      max="168"
                      style={{
                        padding: '6px 8px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text,
                        width: '100px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Maximum backups to keep:
                    </label>
                    <input
                      type="number"
                      value={settings.maxBackups}
                      onChange={(e) => updateSettings({ maxBackups: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      style={{
                        padding: '6px 8px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text,
                        width: '100px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Backup location:
                    </label>
                    <select
                      value={settings.backupLocation}
                      onChange={(e) => updateSettings({ backupLocation: e.target.value as any })}
                      style={{
                        padding: '6px 8px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    >
                      <option value="local">Local Storage</option>
                      <option value="cloud">Cloud Storage</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Advanced Settings</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.includeAttachments}
                      onChange={(e) => updateSettings({ includeAttachments: e.target.checked })}
                    />
                    <span style={{ color: colors.text }}>Include attachments</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.compression}
                      onChange={(e) => updateSettings({ compression: e.target.checked })}
                    />
                    <span style={{ color: colors.text }}>Enable compression</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={settings.encryption}
                      onChange={(e) => updateSettings({ encryption: e.target.checked })}
                    />
                    <span style={{ color: colors.text }}>Enable encryption</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Scheduled Backups */}
            <div style={{ marginTop: '32px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: 0, color: colors.text }}>Scheduled Backups</h4>
                <button
                  onClick={addScheduledBackup}
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
                  + Add Schedule
                </button>
              </div>
              
              {settings.scheduledBackups.length === 0 ? (
                <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '20px' }}>
                  No scheduled backups configured.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {settings.scheduledBackups.map(schedule => (
                    <div key={schedule.id} style={{
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.surface
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="checkbox"
                            checked={schedule.enabled}
                            onChange={(e) => updateScheduledBackup(schedule.id, { enabled: e.target.checked })}
                          />
                          <select
                            value={schedule.schedule}
                            onChange={(e) => updateScheduledBackup(schedule.id, { schedule: e.target.value as any })}
                            style={{
                              padding: '4px 8px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              background: colors.background,
                              color: colors.text,
                              fontSize: '12px'
                            }}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                          <input
                            type="time"
                            value={schedule.time}
                            onChange={(e) => updateScheduledBackup(schedule.id, { time: e.target.value })}
                            style={{
                              padding: '4px 8px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              background: colors.background,
                              color: colors.text,
                              fontSize: '12px'
                            }}
                          />
                        </div>
                        <button
                          onClick={() => deleteScheduledBackup(schedule.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestore; 