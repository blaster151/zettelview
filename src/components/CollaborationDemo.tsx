import React, { useState, useEffect } from 'react';
import { RealTimeCollaborationService, CollaborationUser, CollaborationSession } from '../services/realTimeCollaborationService';

// Simulated users for demo
const demoUsers: CollaborationUser[] = [
  {
    id: 'user1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    color: '#3B82F6',
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: 'user2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    color: '#10B981',
    isOnline: true,
    lastSeen: new Date()
  },
  {
    id: 'user3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    color: '#F59E0B',
    isOnline: false,
    lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
  },
  {
    id: 'user4',
    name: 'David Wilson',
    email: 'david@example.com',
    color: '#EF4444',
    isOnline: true,
    lastSeen: new Date()
  }
];

// Simulated collaboration events
const collaborationEvents = [
  {
    type: 'user_joined',
    user: demoUsers[0],
    timestamp: new Date(Date.now() - 120000)
  },
  {
    type: 'change_applied',
    change: {
      id: 'change1',
      userId: 'user1',
      type: 'insert',
      position: 10,
      content: 'Hello world!',
      timestamp: new Date(Date.now() - 90000)
    },
    timestamp: new Date(Date.now() - 90000)
  },
  {
    type: 'user_joined',
    user: demoUsers[1],
    timestamp: new Date(Date.now() - 80000)
  },
  {
    type: 'change_applied',
    change: {
      id: 'change2',
      userId: 'user2',
      type: 'insert',
      position: 25,
      content: 'Great work!',
      timestamp: new Date(Date.now() - 70000)
    },
    timestamp: new Date(Date.now() - 70000)
  },
  {
    type: 'cursor_update',
    cursor: {
      userId: 'user1',
      userName: 'Alice Johnson',
      userColor: '#3B82F6',
      position: 15,
      timestamp: new Date(Date.now() - 60000)
    },
    timestamp: new Date(Date.now() - 60000)
  },
  {
    type: 'user_joined',
    user: demoUsers[3],
    timestamp: new Date(Date.now() - 50000)
  },
  {
    type: 'conflict_detected',
    conflict: {
      change: {
        id: 'change3',
        userId: 'user4',
        type: 'insert',
        position: 20,
        content: 'Conflict text',
        timestamp: new Date(Date.now() - 40000)
      },
      timestamp: new Date(Date.now() - 40000)
    },
    timestamp: new Date(Date.now() - 40000)
  }
];

export const CollaborationDemo: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(null);
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulation' | 'features'>('overview');

  useEffect(() => {
    // Set up demo user
    const demoUser = demoUsers[0];
    setCurrentUser(demoUser);
    RealTimeCollaborationService.setCurrentUser(demoUser);

    // Set up event listeners
    RealTimeCollaborationService.onEvent('user_joined', handleUserJoined);
    RealTimeCollaborationService.onEvent('user_left', handleUserLeft);
    RealTimeCollaborationService.onEvent('change_applied', handleChangeApplied);
    RealTimeCollaborationService.onEvent('cursor_updated', handleCursorUpdated);
    RealTimeCollaborationService.onEvent('conflict_detected', handleConflictDetected);

    return () => {
      RealTimeCollaborationService.offEvent('user_joined', handleUserJoined);
      RealTimeCollaborationService.offEvent('user_left', handleUserLeft);
      RealTimeCollaborationService.offEvent('change_applied', handleChangeApplied);
      RealTimeCollaborationService.offEvent('cursor_updated', handleCursorUpdated);
      RealTimeCollaborationService.offEvent('conflict_detected', handleConflictDetected);
    };
  }, []);

  const handleUserJoined = (user: CollaborationUser) => {
    setActiveUsers(prev => {
      const existing = prev.find(u => u.id === user.id);
      if (existing) {
        return prev.map(u => u.id === user.id ? user : u);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleUserLeft = (user: CollaborationUser) => {
    setActiveUsers(prev => prev.map(u => u.id === user.id ? user : u));
  };

  const handleChangeApplied = (change: any) => {
    setEvents(prev => [...prev, {
      type: 'change_applied',
      change,
      timestamp: new Date()
    }]);
  };

  const handleCursorUpdated = (cursor: any) => {
    setEvents(prev => [...prev, {
      type: 'cursor_update',
      cursor,
      timestamp: new Date()
    }]);
  };

  const handleConflictDetected = (conflict: any) => {
    setEvents(prev => [...prev, {
      type: 'conflict_detected',
      conflict,
      timestamp: new Date()
    }]);
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setEvents([]);
    setActiveUsers([demoUsers[0]]);

    // Simulate collaboration events
    collaborationEvents.forEach((event, index) => {
      setTimeout(() => {
        setEvents(prev => [...prev, event]);
        
        if (event.type === 'user_joined') {
          setActiveUsers(prev => [...prev, event.user]);
        }
      }, index * 2000); // 2 second intervals
    });

    // Stop simulation after all events
    setTimeout(() => {
      setIsSimulating(false);
    }, collaborationEvents.length * 2000 + 2000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setEvents([]);
    setActiveUsers([demoUsers[0]]);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'user_joined': return '👋';
      case 'user_left': return '👋';
      case 'change_applied': return '✏️';
      case 'cursor_update': return '👆';
      case 'conflict_detected': return '⚠️';
      default: return '📝';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'user_joined': return 'bg-green-100 text-green-800';
      case 'user_left': return 'bg-gray-100 text-gray-800';
      case 'change_applied': return 'bg-blue-100 text-blue-800';
      case 'cursor_update': return 'bg-purple-100 text-purple-800';
      case 'conflict_detected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Collaboration Demo</h1>
        <p className="text-lg text-gray-600">
          Experience real-time collaboration with multiple users, live cursors, and conflict resolution
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'simulation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Live Simulation
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Features
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current User */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User</h2>
              
              {currentUser && (
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: currentUser.color }}
                  >
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-600">{currentUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${currentUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-xs text-gray-500">
                        {currentUser.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Users */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Users ({activeUsers.length})</h2>
              
              <div className="space-y-3">
                {activeUsers.map(user => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-xs text-gray-500">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collaboration Features */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Collaboration Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-medium text-gray-900 mb-2">Real-Time Users</h3>
                <p className="text-sm text-gray-600">
                  See who's currently editing the document in real-time
                </p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">👆</div>
                <h3 className="font-medium text-gray-900 mb-2">Live Cursors</h3>
                <p className="text-sm text-gray-600">
                  Track cursor positions and selections of other users
                </p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-medium text-gray-900 mb-2">Instant Sync</h3>
                <p className="text-sm text-gray-600">
                  Changes are synchronized instantly across all users
                </p>
              </div>
            </div>
          </div>

          {/* Demo Users */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Demo Users</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {demoUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-4 text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="text-xs text-gray-500">
                      {user.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Collaboration Simulation</h2>
            
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Watch a simulated collaboration session with multiple users
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={startSimulation}
                  disabled={isSimulating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSimulating ? 'Running...' : 'Start Simulation'}
                </button>
                <button
                  onClick={stopSimulation}
                  disabled={!isSimulating}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>

            {/* Simulation Status */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Simulation Status</h3>
                  <p className="text-sm text-gray-600">
                    {isSimulating ? 'Running collaboration simulation...' : 'Simulation stopped'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{activeUsers.length}</div>
                    <div className="text-xs text-gray-600">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{events.length}</div>
                    <div className="text-xs text-gray-600">Events</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Events Feed */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Live Events Feed</h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="text-2xl">{getEventIcon(event.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventColor(event.type)}`}>
                            {event.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        
                        {event.type === 'user_joined' && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{event.user.name}</span> joined the collaboration
                          </p>
                        )}
                        
                        {event.type === 'change_applied' && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{event.change.userId}</span> made a change: "{event.change.content}"
                          </p>
                        )}
                        
                        {event.type === 'cursor_update' && (
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">{event.cursor.userName}</span> moved cursor to position {event.cursor.position}
                          </p>
                        )}
                        
                        {event.type === 'conflict_detected' && (
                          <p className="text-sm text-gray-700">
                            Conflict detected in change by <span className="font-medium">{event.conflict.change.userId}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p>No events yet</p>
                    <p className="text-sm">Start the simulation to see collaboration events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real-Time Features */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Real-Time Features</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">WebSocket Communication</h3>
                    <p className="text-sm text-gray-600">
                      Real-time bidirectional communication for instant updates
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Live Cursor Tracking</h3>
                    <p className="text-sm text-gray-600">
                      See where other users are editing in real-time
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">User Presence</h3>
                    <p className="text-sm text-gray-600">
                      Know who's online and actively editing
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict Resolution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Conflict Resolution</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Last-Write-Wins</h3>
                    <p className="text-sm text-gray-600">
                      Automatically resolve conflicts using timestamps
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Manual Resolution</h3>
                    <p className="text-sm text-gray-600">
                      Let users choose how to resolve conflicts
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Smart Merging</h3>
                    <p className="text-sm text-gray-600">
                      Intelligently merge conflicting changes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Implementation</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔌</div>
                <h3 className="font-medium text-gray-900 mb-2">WebSocket</h3>
                <p className="text-sm text-gray-600">
                  Real-time bidirectional communication
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🔄</div>
                <h3 className="font-medium text-gray-900 mb-2">Operational Transform</h3>
                <p className="text-sm text-gray-600">
                  Conflict-free collaborative editing
                </p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-medium text-gray-900 mb-2">Change Tracking</h3>
                <p className="text-sm text-gray-600">
                  Version control for all changes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 