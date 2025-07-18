import React, { useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface SyncStatus {
  lastSync: Date | null;
  pending: number;
  conflicts: number;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}

const OfflineSyncEngine: React.FC = () => {
  const { colors } = useThemeStore();
  const [status, setStatus] = useState<SyncStatus>({
    lastSync: new Date(Date.now() - 1000 * 60 * 10),
    pending: 2,
    conflicts: 1,
    status: 'idle',
  });
  const [showConflicts, setShowConflicts] = useState(false);

  const handleSync = useCallback(() => {
    setStatus(s => ({ ...s, status: 'syncing' }));
    setTimeout(() => {
      setStatus(s => ({ ...s, status: 'idle', lastSync: new Date(), pending: 0, conflicts: 0 }));
    }, 2000);
  }, []);

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 24,
      maxWidth: 600,
      margin: '40px auto',
      minHeight: 300
    }}>
      <h2 style={{ color: colors.text }}>Offline Sync Engine</h2>
      <div style={{ marginBottom: 16, color: colors.textSecondary }}>
        Local-first storage with background sync to cloud or remote storage.
      </div>
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 600, color: colors.text }}>Last Sync:</div>
          <div>{status.lastSync ? status.lastSync.toLocaleString() : 'Never'}</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: colors.text }}>Pending Changes:</div>
          <div>{status.pending}</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: colors.text }}>Conflicts:</div>
          <div>{status.conflicts}</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: colors.text }}>Status:</div>
          <div style={{ color: status.status === 'error' ? '#dc3545' : status.status === 'syncing' ? colors.primary : colors.textSecondary }}>{status.status}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={handleSync} style={{ background: colors.primary, color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>Sync Now</button>
        <button onClick={() => setShowConflicts(true)} style={{ background: '#ffc107', color: colors.text, border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>Resolve Conflicts</button>
      </div>
      {showConflicts && (
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16, marginTop: 16 }}>
          <h4 style={{ color: colors.text }}>Conflict Resolution</h4>
          <div style={{ color: colors.textSecondary, marginBottom: 8 }}>You have {status.conflicts} conflicts to resolve.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowConflicts(false)} style={{ background: colors.primary, color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Close</button>
            <button style={{ background: '#28a745', color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Auto-Resolve</button>
            <button style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Manual Review</button>
          </div>
        </div>
      )}
      {status.error && <div style={{ color: '#dc3545', marginTop: 12 }}>{status.error}</div>}
    </div>
  );
};

export default OfflineSyncEngine; 