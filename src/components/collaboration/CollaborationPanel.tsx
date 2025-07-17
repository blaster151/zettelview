import React, { useState } from 'react';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useThemeStore } from '../../store/themeStore';
import { User } from '../../types/collaboration';

interface CollaborationPanelProps {
  noteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  noteId,
  isOpen,
  onClose
}) => {
  const { colors } = useThemeStore();
  const {
    state,
    config,
    createSession,
    joinSession,
    leaveSession,
    updateConfig,
    getOnlineUsers,
    isCollaborating,
    onlineUsersCount
  } = useCollaboration(noteId);

  const [sessionIdInput, setSessionIdInput] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  if (!isOpen) return null;

  const handleCreateSession = async () => {
    await createSession();
  };

  const handleJoinSession = async () => {
    if (sessionIdInput.trim()) {
      await joinSession(sessionIdInput.trim());
      setSessionIdInput('');
      setShowJoinForm(false);
    }
  };

  const handleLeaveSession = async () => {
    await leaveSession();
  };

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    updateConfig({ [key]: value });
  };

  const renderUserAvatar = (user: User) => (
    <div
      key={user.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        borderRadius: '4px',
        background: colors.surfaceHover
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: user.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', color: colors.text, fontWeight: 'bold' }}>
          {user.name}
        </div>
        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
          {user.isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: user.isOnline ? '#4CAF50' : '#9E9E9E'
        }}
      />
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            color: colors.text,
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            🤝 Collaboration
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '20px',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Close collaboration panel"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
          {/* Connection Status */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: colors.text,
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Connection Status
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: '4px',
              background: colors.background,
              border: `1px solid ${colors.border}`
            }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: state.connectionStatus === 'connected' ? '#4CAF50' : 
                             state.connectionStatus === 'connecting' ? '#FF9800' : '#F44336'
                }}
              />
              <span style={{ color: colors.text, fontSize: '14px' }}>
                {state.connectionStatus === 'connected' ? 'Connected' :
                 state.connectionStatus === 'connecting' ? 'Connecting...' :
                 state.connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Session Management */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: colors.text,
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Session Management
            </h3>
            
            {!isCollaborating ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleCreateSession}
                  style={{
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.primaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.primary;
                  }}
                >
                  🚀 Create New Session
                </button>
                
                <button
                  onClick={() => setShowJoinForm(!showJoinForm)}
                  style={{
                    background: colors.surfaceHover,
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    padding: '12px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.primary;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.surfaceHover;
                    e.currentTarget.style.color = colors.text;
                  }}
                >
                  🔗 Join Existing Session
                </button>

                {showJoinForm && (
                  <div style={{
                    padding: '16px',
                    background: colors.background,
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`
                  }}>
                    <input
                      type="text"
                      placeholder="Enter session ID"
                      value={sessionIdInput}
                      onChange={(e) => setSessionIdInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.surface,
                        color: colors.text,
                        fontSize: '14px',
                        marginBottom: '8px'
                      }}
                    />
                    <button
                      onClick={handleJoinSession}
                      disabled={!sessionIdInput.trim()}
                      style={{
                        background: sessionIdInput.trim() ? colors.primary : colors.border,
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: sessionIdInput.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Join Session
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '16px',
                background: colors.background,
                borderRadius: '4px',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: colors.text }}>Session ID:</strong>
                  <code style={{
                    display: 'block',
                    padding: '4px 8px',
                    background: colors.surfaceHover,
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {state.session?.id}
                  </code>
                </div>
                <button
                  onClick={handleLeaveSession}
                  style={{
                    background: '#F44336',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Leave Session
                </button>
              </div>
            )}
          </div>

          {/* Online Users */}
          {isCollaborating && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: colors.text,
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Online Users ({onlineUsersCount})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {getOnlineUsers().map(renderUserAvatar)}
              </div>
            </div>
          )}

          {/* Settings */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: colors.text,
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              Settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={config.showUserCursors}
                  onChange={(e) => handleConfigChange('showUserCursors', e.target.checked)}
                />
                <span style={{ color: colors.text, fontSize: '14px' }}>
                  Show user cursors
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={config.showUserPresence}
                  onChange={(e) => handleConfigChange('showUserPresence', e.target.checked)}
                />
                <span style={{ color: colors.text, fontSize: '14px' }}>
                  Show user presence
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={config.autoResolveConflicts}
                  onChange={(e) => handleConfigChange('autoResolveConflicts', e.target.checked)}
                />
                <span style={{ color: colors.text, fontSize: '14px' }}>
                  Auto-resolve conflicts
                </span>
              </label>
            </div>
          </div>

          {/* Statistics */}
          {isCollaborating && (
            <div>
              <h3 style={{
                color: colors.text,
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                Statistics
              </h3>
              <div style={{
                padding: '12px',
                background: colors.background,
                borderRadius: '4px',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: colors.textSecondary }}>Remote cursors:</span>
                  <span style={{ color: colors.text }}>{state.remoteCursors.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: colors.textSecondary }}>Pending operations:</span>
                  <span style={{ color: colors.text }}>{state.pendingOperations.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: colors.textSecondary }}>Resolved conflicts:</span>
                  <span style={{ color: colors.text }}>{state.resolvedConflicts.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CollaborationPanel; 