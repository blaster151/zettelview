import React, { useState, useEffect, useRef } from 'react';
import { RealTimeCollaborationService, CollaborationSession, CollaborationUser, CursorPosition } from '../services/realTimeCollaborationService';

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isOpen,
  onClose,
  noteId
}) => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'cursors' | 'changes' | 'settings'>('users');
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const cursorRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (isOpen && noteId) {
      setupCollaboration();
    }
  }, [isOpen, noteId]);

  useEffect(() => {
    // Set up event listeners
    RealTimeCollaborationService.onEvent('session_created', handleSessionCreated);
    RealTimeCollaborationService.onEvent('session_joined', handleSessionJoined);
    RealTimeCollaborationService.onEvent('session_updated', handleSessionUpdated);
    RealTimeCollaborationService.onEvent('user_joined', handleUserJoined);
    RealTimeCollaborationService.onEvent('user_left', handleUserLeft);
    RealTimeCollaborationService.onEvent('cursor_updated', handleCursorUpdated);
    RealTimeCollaborationService.onEvent('cursor_received', handleCursorReceived);
    RealTimeCollaborationService.onEvent('change_applied', handleChangeApplied);
    RealTimeCollaborationService.onEvent('conflict_detected', handleConflictDetected);
    RealTimeCollaborationService.onEvent('sync_complete', handleSyncComplete);
    RealTimeCollaborationService.onEvent('sync_error', handleSyncError);

    return () => {
      // Cleanup event listeners
      RealTimeCollaborationService.offEvent('session_created', handleSessionCreated);
      RealTimeCollaborationService.offEvent('session_joined', handleSessionJoined);
      RealTimeCollaborationService.offEvent('session_updated', handleSessionUpdated);
      RealTimeCollaborationService.offEvent('user_joined', handleUserJoined);
      RealTimeCollaborationService.offEvent('user_left', handleUserLeft);
      RealTimeCollaborationService.offEvent('cursor_updated', handleCursorUpdated);
      RealTimeCollaborationService.offEvent('cursor_received', handleCursorReceived);
      RealTimeCollaborationService.offEvent('change_applied', handleChangeApplied);
      RealTimeCollaborationService.offEvent('conflict_detected', handleConflictDetected);
      RealTimeCollaborationService.offEvent('sync_complete', handleSyncComplete);
      RealTimeCollaborationService.offEvent('sync_error', handleSyncError);
    };
  }, []);

  const setupCollaboration = async () => {
    setIsJoining(true);
    try {
      // Create or join session
      const existingSession = RealTimeCollaborationService.getSessions().find(s => s.noteId === noteId);
      
      if (existingSession) {
        const joinedSession = RealTimeCollaborationService.joinSession(existingSession.id);
        if (joinedSession) {
          setSession(joinedSession);
          setUsers(joinedSession.users);
        }
      } else {
        const newSession = RealTimeCollaborationService.createSession(noteId);
        setSession(newSession);
        setUsers(newSession.users);
      }

      // Load cursors
      const noteCursors = RealTimeCollaborationService.getCursors(noteId);
      setCursors(noteCursors);
    } catch (error) {
      console.error('Failed to setup collaboration:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleSessionCreated = (newSession: CollaborationSession) => {
    if (newSession.noteId === noteId) {
      setSession(newSession);
      setUsers(newSession.users);
    }
  };

  const handleSessionJoined = (joinedSession: CollaborationSession) => {
    if (joinedSession.noteId === noteId) {
      setSession(joinedSession);
      setUsers(joinedSession.users);
    }
  };

  const handleSessionUpdated = (updatedSession: CollaborationSession) => {
    if (updatedSession.noteId === noteId) {
      setSession(updatedSession);
      setUsers(updatedSession.users);
    }
  };

  const handleUserJoined = (user: CollaborationUser) => {
    setUsers(prev => {
      const existing = prev.find(u => u.id === user.id);
      if (existing) {
        return prev.map(u => u.id === user.id ? user : u);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleUserLeft = (user: CollaborationUser) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const handleCursorUpdated = (cursor: CursorPosition) => {
    if (cursor.noteId === noteId) {
      setCursors(prev => {
        const existing = prev.find(c => c.userId === cursor.userId);
        if (existing) {
          return prev.map(c => c.userId === cursor.userId ? cursor : c);
        } else {
          return [...prev, cursor];
        }
      });
    }
  };

  const handleCursorReceived = (cursor: CursorPosition) => {
    if (cursor.noteId === noteId) {
      setCursors(prev => {
        const existing = prev.find(c => c.userId === cursor.userId);
        if (existing) {
          return prev.map(c => c.userId === cursor.userId ? cursor : c);
        } else {
          return [...prev, cursor];
        }
      });
    }
  };

  const handleChangeApplied = (change: any) => {
    // Handle change applied
  };

  const handleConflictDetected = (conflict: any) => {
    setConflicts(prev => [...prev, conflict]);
  };

  const handleSyncComplete = (data: any) => {
    setSyncStatus('idle');
  };

  const handleSyncError = (data: any) => {
    setSyncStatus('error');
  };

  const handleLeaveSession = () => {
    if (session) {
      RealTimeCollaborationService.leaveSession(session.id);
      setSession(null);
      setUsers([]);
      setCursors([]);
    }
  };

  const handleInviteUser = (email: string) => {
    // In a real implementation, this would send an invitation
    console.log('Inviting user:', email);
  };

  const handleResolveConflict = (conflict: any, resolution: string) => {
    // Handle conflict resolution
    setConflicts(prev => prev.filter(c => c !== conflict));
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-green-600';
    }
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return '⏳';
      case 'error': return '❌';
      default: return '✅';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Collaboration</h2>
            {session && (
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(true)}`}></span>
                <span className="text-sm text-gray-600">Active Session</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sync:</span>
              <span className={`text-sm font-medium ${getSyncStatusColor()}`}>
                {getSyncStatusIcon()} {syncStatus}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close collaboration panel"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('cursors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cursors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cursors ({cursors.length})
            </button>
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'changes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Changes
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'users' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
                <button
                  onClick={() => {
                    const email = prompt('Enter email to invite:');
                    if (email) handleInviteUser(email);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Invite User
                </button>
              </div>

              {isJoining ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Joining collaboration session...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: user.color }}
                            >
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.isOnline)}`}></span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last seen: {user.lastSeen.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'cursors' && (
            <div className="h-full p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Live Cursors</h3>
              
              <div className="space-y-4">
                {cursors.length > 0 ? (
                  cursors.map(cursor => (
                    <div key={cursor.userId} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: cursor.userColor }}
                      ></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{cursor.userName}</div>
                        <div className="text-sm text-gray-600">
                          Position: {cursor.position}
                          {cursor.selectionStart !== undefined && cursor.selectionEnd !== undefined && (
                            <span> • Selection: {cursor.selectionStart}-{cursor.selectionEnd}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                    </svg>
                    <p>No active cursors</p>
                    <p className="text-sm">Cursors will appear when users are editing</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="h-full p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Changes</h3>
              
              <div className="space-y-4">
                {conflicts.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Conflicts Detected</h4>
                    <div className="space-y-2">
                      {conflicts.map((conflict, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-yellow-100 rounded">
                          <span className="text-sm text-yellow-800">
                            Conflict in change by {conflict.change.userId}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleResolveConflict(conflict, 'accept')}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleResolveConflict(conflict, 'reject')}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No recent changes</p>
                  <p className="text-sm">Changes will appear as users edit the document</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Collaboration Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Session Information</h4>
                  {session && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Session ID:</span>
                        <span className="text-sm font-mono text-gray-900">{session.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Created:</span>
                        <span className="text-sm text-gray-900">{session.createdAt.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Last Updated:</span>
                        <span className="text-sm text-gray-900">{session.updatedAt.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Actions</h4>
                  <div className="space-y-3">
                    <button
                      onClick={handleLeaveSession}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Leave Session
                    </button>
                    <button
                      onClick={() => {
                        if (session) {
                          navigator.clipboard.writeText(session.id);
                          alert('Session ID copied to clipboard');
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Copy Session ID
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {session ? (
                <span>Session active with {users.length} user{users.length !== 1 ? 's' : ''}</span>
              ) : (
                <span>No active session</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 