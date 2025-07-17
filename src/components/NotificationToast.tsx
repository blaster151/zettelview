import React, { useEffect, useState } from 'react';
import { notificationService, Notification, NotificationType } from '../services/notificationService';

const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const handleRemove = (id: string) => {
    notificationService.remove(id);
  };

  const getNotificationStyle = (type: NotificationType) => {
    const baseStyle = {
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      maxWidth: '400px',
      minWidth: '300px',
      animation: 'slideIn 0.3s ease-out',
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          backgroundColor: '#d4edda',
          borderColor: '#c3e6cb',
          color: '#155724',
        };
      case 'error':
        return {
          ...baseStyle,
          backgroundColor: '#f8d7da',
          borderColor: '#f5c6cb',
          color: '#721c24',
        };
      case 'warning':
        return {
          ...baseStyle,
          backgroundColor: '#fff3cd',
          borderColor: '#ffeaa7',
          color: '#856404',
        };
      case 'info':
        return {
          ...baseStyle,
          backgroundColor: '#d1ecf1',
          borderColor: '#bee5eb',
          color: '#0c5460',
        };
      default:
        return baseStyle;
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={getNotificationStyle(notification.type)}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {getIcon(notification.type)}
          </div>
          
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: '600',
                fontSize: '14px',
                marginBottom: '4px',
              }}
            >
              {notification.title}
            </div>
            <div
              style={{
                fontSize: '13px',
                lineHeight: '1.4',
              }}
            >
              {notification.message}
            </div>
          </div>
          
          <button
            onClick={() => handleRemove(notification.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0',
              marginLeft: '8px',
              opacity: 0.7,
              flexShrink: 0,
            }}
            aria-label="Dismiss notification"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
      
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationToast; 