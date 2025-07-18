import React, { useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';

interface Notification {
  id: string;
  type: 'system' | 'collaboration' | 'workflow' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: { label: string; onClick: () => void }[];
}

const NotificationsCenter: React.FC = () => {
  const { colors } = useThemeStore();
  const { notifications, markAsRead, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'collaboration' | 'workflow' | 'reminder'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const handleMarkAllRead = useCallback(() => {
    notifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });
  }, [notifications, markAsRead]);

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 24,
      maxWidth: 500,
      margin: '40px auto',
      minHeight: 400
    }}>
      <h2 style={{ color: colors.text }}>Notifications Center</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'unread', 'system', 'collaboration', 'workflow', 'reminder'].map(f => (
          <button key={f} onClick={() => setFilter(f as any)} style={{ background: filter === f ? colors.primary : colors.surface, color: filter === f ? 'white' : colors.text, border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={handleMarkAllRead} style={{ background: colors.primary, color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Mark All Read</button>
        <button onClick={clearAll} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Clear All</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredNotifications.length === 0 && <div style={{ color: colors.textSecondary }}>No notifications.</div>}
        {filteredNotifications.map(n => (
          <div key={n.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 6, padding: 12, background: n.read ? colors.surface : '#fffbe6', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: colors.text }}>{n.title}</div>
              <button onClick={() => markAsRead(n.id)} style={{ background: 'none', border: 'none', color: colors.primary, cursor: 'pointer', fontSize: 13 }}>{n.read ? 'Read' : 'Mark Read'}</button>
            </div>
            <div style={{ color: colors.textSecondary, fontSize: 13 }}>{n.message}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{n.timestamp.toLocaleString()}</div>
            {n.actions && n.actions.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {n.actions.map((a, i) => (
                  <button key={i} onClick={a.onClick} style={{ background: colors.primary, color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>{a.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsCenter; 