import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { useUIStore } from '../../store/uiStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: Date;
}

interface UserCursor {
  userId: string;
  position: { line: number; ch: number };
  selection?: { from: { line: number; ch: number }; to: { line: number; ch: number } };
  timestamp: Date;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  position: { line: number; ch: number };
  timestamp: Date;
  replies: Comment[];
  resolved: boolean;
}

interface Change {
  id: string;
  userId: string;
  userName: string;
  type: 'insert' | 'delete' | 'replace';
  from: { line: number; ch: number };
  to?: { line: number; ch: number };
  text?: string;
  timestamp: Date;
}

interface NoteVersion {
  id: string;
  version: number;
  content: string;
  userId: string;
  userName: string;
  timestamp: Date;
  description: string;
  changes: Change[];
}

interface CollaborationSession {
  noteId: string;
  users: User[];
  cursors: UserCursor[];
  comments: Comment[];
  versions: NoteVersion[];
  currentVersion: number;
  isLive: boolean;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canViewHistory: boolean;
    canManageUsers: boolean;
  };
}

interface NoteCollaborationProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
}

const NoteCollaboration: React.FC<NoteCollaborationProps> = ({ noteId, isOpen, onClose }) => {
  const { notes, selectedId, updateNote } = useNoteStore();
  const { colors } = useThemeStore();
  const { showCollaborationPanel } = useUIStore();
  
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'history' | 'settings'>('users');
  const [isConnecting, setIsConnecting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'view' | 'edit' | 'comment'>('view');
  const [isSharing, setIsSharing] = useState(false);

  // Get current note
  const currentNote = notes.find(note => note.id === noteId);

  // Initialize collaboration session
  const initializeSession = useCallback(async () => {
    if (!currentNote) return;

    setIsConnecting(true);

    try {
      await PerformanceUtils.measureAsync(
        'collaboration_init',
        async () => {
          // Simulate connection delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Generate mock user
          const user: User = {
            id: `user_${Date.now()}`,
            name: 'You',
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            isOnline: true,
            lastSeen: new Date()
          };
          
          setCurrentUser(user);

          // Create session
          const newSession: CollaborationSession = {
            noteId,
            users: [user],
            cursors: [],
            comments: [],
            versions: [{
              id: `v_${Date.now()}`,
              version: 1,
              content: currentNote.body,
              userId: user.id,
              userName: user.name,
              timestamp: new Date(),
              description: 'Initial version',
              changes: []
            }],
            currentVersion: 1,
            isLive: true,
            permissions: {
              canEdit: true,
              canComment: true,
              canViewHistory: true,
              canManageUsers: true
            }
          };

          setSession(newSession);
          
          loggingService.info('Collaboration session initialized', { 
            noteId, 
            userId: user.id 
          });
        }
      );
    } catch (error) {
      loggingService.error('Failed to initialize collaboration session', error as Error);
    } finally {
      setIsConnecting(false);
    }
  }, [currentNote, noteId]);

  // Initialize session when component mounts
  useEffect(() => {
    if (isOpen && !session) {
      initializeSession();
    }
  }, [isOpen, session, initializeSession]);

  // Add comment
  const addComment = useCallback((content: string, position: { line: number; ch: number }) => {
    if (!session || !currentUser || !content.trim()) return;

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      content: content.trim(),
      position,
      timestamp: new Date(),
      replies: [],
      resolved: false
    };

    setSession(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment]
    } : null);

    loggingService.info('Comment added', { 
      commentId: comment.id, 
      noteId 
    });
  }, [session, currentUser, noteId]);

  // Reply to comment
  const replyToComment = useCallback((commentId: string, replyContent: string) => {
    if (!session || !currentUser || !replyContent.trim()) return;

    const reply: Comment = {
      id: `reply_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      content: replyContent.trim(),
      position: { line: 0, ch: 0 },
      timestamp: new Date(),
      replies: [],
      resolved: false
    };

    setSession(prev => prev ? {
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    } : null);

    loggingService.info('Reply added', { 
      commentId, 
      replyId: reply.id 
    });
  }, [session, currentUser]);

  // Resolve comment
  const resolveComment = useCallback((commentId: string) => {
    if (!session) return;

    setSession(prev => prev ? {
      ...prev,
      comments: prev.comments.map(comment =>
        comment.id === commentId
          ? { ...comment, resolved: true }
          : comment
      )
    } : null);

    loggingService.info('Comment resolved', { commentId });
  }, [session]);

  // Delete comment
  const deleteComment = useCallback((commentId: string) => {
    if (!session) return;

    setSession(prev => prev ? {
      ...prev,
      comments: prev.comments.filter(comment => comment.id !== commentId)
    } : null);

    loggingService.info('Comment deleted', { commentId });
  }, [session]);

  // Create new version
  const createVersion = useCallback((content: string, description: string) => {
    if (!session || !currentUser) return;

    const newVersion: NoteVersion = {
      id: `v_${Date.now()}`,
      version: session.currentVersion + 1,
      content,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date(),
      description,
      changes: []
    };

    setSession(prev => prev ? {
      ...prev,
      versions: [...prev.versions, newVersion],
      currentVersion: newVersion.version
    } : null);

    loggingService.info('New version created', { 
      versionId: newVersion.id, 
      version: newVersion.version 
    });
  }, [session, currentUser]);

  // Restore version
  const restoreVersion = useCallback((versionId: string) => {
    if (!session) return;

    const version = session.versions.find(v => v.id === versionId);
    if (!version) return;

    if (confirm(`Are you sure you want to restore version ${version.version}? This will replace the current content.`)) {
      // Update the note content
      updateNote(noteId, { body: version.content });
      
      setSession(prev => prev ? {
        ...prev,
        currentVersion: version.version
      } : null);

      loggingService.info('Version restored', { 
        versionId, 
        version: version.version 
      });
    }
  }, [session, noteId, updateNote]);

  // Invite user
  const inviteUser = useCallback(async (email: string, permission: string) => {
    if (!email.trim()) return;

    setIsSharing(true);

    try {
      await PerformanceUtils.measureAsync(
        'user_invite',
        async () => {
          // Simulate invite process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Add mock user to session
          const newUser: User = {
            id: `user_${Date.now()}`,
            name: email.split('@')[0],
            color: `hsl(${Math.random() * 360}, 70%, 50%)`,
            isOnline: false,
            lastSeen: new Date()
          };

          setSession(prev => prev ? {
            ...prev,
            users: [...prev.users, newUser]
          } : null);

          loggingService.info('User invited', { 
            email, 
            permission, 
            userId: newUser.id 
          });
        }
      );

      setInviteEmail('');
      setShowInviteForm(false);
    } catch (error) {
      loggingService.error('Failed to invite user', error as Error);
    } finally {
      setIsSharing(false);
    }
  }, []);

  // Remove user
  const removeUser = useCallback((userId: string) => {
    if (!session || userId === currentUser?.id) return;

    if (confirm('Are you sure you want to remove this user?')) {
      setSession(prev => prev ? {
        ...prev,
        users: prev.users.filter(user => user.id !== userId)
      } : null);

      loggingService.info('User removed', { userId });
    }
  }, [session, currentUser]);

  // Update user permissions
  const updateUserPermissions = useCallback((userId: string, permissions: Partial<CollaborationSession['permissions']>) => {
    if (!session) return;

    // In a real implementation, this would update user permissions
    loggingService.info('User permissions updated', { userId, permissions });
  }, [session]);

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get user by ID
  const getUserById = useCallback((userId: string): User | undefined => {
    return session?.users.find(user => user.id === userId);
  }, [session]);

  if (!isOpen || !currentNote) return null;

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
          <div>
            <h2 style={{ margin: 0, color: colors.text }}>Note Collaboration</h2>
            <p style={{ margin: '4px 0 0 0', color: colors.textSecondary, fontSize: '14px' }}>
              {currentNote.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close collaboration panel"
          >
            ×
          </button>
        </div>

        {/* Connection Status */}
        {isConnecting && (
          <div style={{
            padding: '12px',
            background: colors.surface,
            borderRadius: '4px',
            marginBottom: '20px',
            textAlign: 'center',
            color: colors.textSecondary
          }}>
            Connecting to collaboration session...
          </div>
        )}

        {session && (
          <>
            {/* Status Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: colors.surface,
              borderRadius: '4px',
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: session.isLive ? '#28a745' : '#dc3545'
                }} />
                <span style={{ color: colors.text }}>
                  {session.isLive ? 'Live' : 'Offline'} • {session.users.length} users
                </span>
              </div>
              <div style={{ color: colors.textSecondary }}>
                Version {session.currentVersion} of {session.versions.length}
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${colors.border}`,
              marginBottom: '24px'
            }}>
              {[
                { value: 'users', label: 'Users', icon: '👥' },
                { value: 'comments', label: 'Comments', icon: '💬' },
                { value: 'history', label: 'History', icon: '📋' },
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

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: 0, color: colors.text }}>Collaborators</h3>
                  <button
                    onClick={() => setShowInviteForm(true)}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    + Invite User
                  </button>
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                  <div style={{
                    padding: '16px',
                    background: colors.surface,
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Invite User</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                        style={{
                          padding: '8px 12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.background,
                          color: colors.text
                        }}
                      />
                      <select
                        value={invitePermission}
                        onChange={(e) => setInvitePermission(e.target.value as any)}
                        style={{
                          padding: '8px 12px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.background,
                          color: colors.text
                        }}
                      >
                        <option value="view">View only</option>
                        <option value="comment">Can comment</option>
                        <option value="edit">Can edit</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmail('');
                        }}
                        style={{
                          padding: '6px 12px',
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
                        onClick={() => inviteUser(inviteEmail, invitePermission)}
                        disabled={isSharing || !inviteEmail.trim()}
                        style={{
                          padding: '6px 12px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isSharing || !inviteEmail.trim() ? 'not-allowed' : 'pointer',
                          opacity: isSharing || !inviteEmail.trim() ? 0.6 : 1
                        }}
                      >
                        {isSharing ? 'Inviting...' : 'Send Invite'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Users List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {session.users.map(user => (
                    <div key={user.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.background
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: user.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: colors.text, fontWeight: '500' }}>
                            {user.name} {user.id === currentUser?.id && '(You)'}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {user.isOnline ? 'Online' : `Last seen ${formatTimestamp(user.lastSeen)}`}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => removeUser(user.id)}
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
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: 0, color: colors.text }}>Comments</h3>
                  <button
                    onClick={() => addComment(newComment, { line: 1, ch: 0 })}
                    disabled={!newComment.trim()}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: !newComment.trim() ? 'not-allowed' : 'pointer',
                      opacity: !newComment.trim() ? 0.6 : 1
                    }}
                  >
                    Add Comment
                  </button>
                </div>

                {/* New Comment Input */}
                <div style={{ marginBottom: '20px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Comments List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {session.comments.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: colors.textSecondary
                    }}>
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    session.comments.map(comment => (
                      <div key={comment.id} style={{
                        padding: '16px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        background: comment.resolved ? colors.surface : colors.background,
                        opacity: comment.resolved ? 0.7 : 1
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '500', color: colors.text }}>
                              {comment.userName}
                            </span>
                            <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {!comment.resolved && (
                              <button
                                onClick={() => resolveComment(comment.id)}
                                style={{
                                  padding: '4px 8px',
                                  background: colors.primary,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Resolve
                              </button>
                            )}
                            {comment.userId === currentUser?.id && (
                              <button
                                onClick={() => deleteComment(comment.id)}
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
                            )}
                          </div>
                        </div>
                        
                        <p style={{ 
                          margin: '0 0 12px 0', 
                          color: colors.text,
                          lineHeight: '1.5'
                        }}>
                          {comment.content}
                        </p>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div style={{ marginLeft: '20px', marginTop: '12px' }}>
                            {comment.replies.map(reply => (
                              <div key={reply.id} style={{
                                padding: '8px 12px',
                                background: colors.surface,
                                borderRadius: '4px',
                                marginBottom: '8px'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '4px'
                                }}>
                                  <span style={{ fontWeight: '500', color: colors.text, fontSize: '14px' }}>
                                    {reply.userName}
                                  </span>
                                  <span style={{ fontSize: '11px', color: colors.textSecondary }}>
                                    {formatTimestamp(reply.timestamp)}
                                  </span>
                                </div>
                                <p style={{ margin: 0, color: colors.text, fontSize: '14px' }}>
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        <div style={{ marginTop: '12px' }}>
                          <input
                            type="text"
                            placeholder="Reply to this comment..."
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                replyToComment(comment.id, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '4px',
                              background: colors.background,
                              color: colors.text,
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Version History</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {session.versions.map(version => (
                    <div key={version.id} style={{
                      padding: '16px',
                      border: `1px solid ${version.version === session.currentVersion ? colors.primary : colors.border}`,
                      borderRadius: '8px',
                      background: version.version === session.currentVersion ? colors.surface : colors.background
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', color: colors.text }}>
                            Version {version.version}
                          </h4>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {version.userName} • {formatTimestamp(version.timestamp)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {version.version !== session.currentVersion && (
                            <button
                              onClick={() => restoreVersion(version.id)}
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
                              Restore
                            </button>
                          )}
                          {version.version === session.currentVersion && (
                            <span style={{
                              padding: '4px 8px',
                              background: colors.primary,
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}>
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p style={{ 
                        margin: 0, 
                        color: colors.textSecondary, 
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        {version.description}
                      </p>
                      
                      {version.changes.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                            Changes:
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {version.changes.length} changes made
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Collaboration Settings</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Permissions</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={session.permissions.canEdit}
                          onChange={(e) => updateUserPermissions(currentUser?.id || '', { canEdit: e.target.checked })}
                        />
                        <span style={{ color: colors.text }}>Allow editing</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={session.permissions.canComment}
                          onChange={(e) => updateUserPermissions(currentUser?.id || '', { canComment: e.target.checked })}
                        />
                        <span style={{ color: colors.text }}>Allow comments</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={session.permissions.canViewHistory}
                          onChange={(e) => updateUserPermissions(currentUser?.id || '', { canViewHistory: e.target.checked })}
                        />
                        <span style={{ color: colors.text }}>View version history</span>
                      </label>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={session.permissions.canManageUsers}
                          onChange={(e) => updateUserPermissions(currentUser?.id || '', { canManageUsers: e.target.checked })}
                        />
                        <span style={{ color: colors.text }}>Manage users</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Session Info</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                          Session ID
                        </div>
                        <div style={{ 
                          padding: '8px', 
                          background: colors.surface, 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          color: colors.text
                        }}>
                          {session.noteId}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                          Created
                        </div>
                        <div style={{ color: colors.text }}>
                          {formatTimestamp(session.versions[0].timestamp)}
                        </div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                          Last Activity
                        </div>
                        <div style={{ color: colors.text }}>
                          {formatTimestamp(new Date())}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NoteCollaboration; 