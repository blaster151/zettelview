import React, { useState, useEffect } from 'react';
import { AdvancedSecurityService, User, Permission, AuditLogEntry, SecurityEvent } from '../services/advancedSecurityService';

export const AdvancedSecurityDemo: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'auth' | 'permissions' | 'encryption' | 'audit' | 'events'>('auth');
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    twoFactorCode: ''
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [testData, setTestData] = useState('This is sensitive data that needs encryption');
  const [encryptedData, setEncryptedData] = useState('');
  const [decryptedData, setDecryptedData] = useState('');

  useEffect(() => {
    loadData();
    setupEventListeners();
  }, []);

  const loadData = () => {
    setUsers(AdvancedSecurityService.getUsers());
    setPermissions(Array.from(AdvancedSecurityService.getPermissions?.() || []));
    setAuditLog(AdvancedSecurityService.getAuditLog());
    setSecurityEvents(AdvancedSecurityService.getSecurityEvents());
  };

  const setupEventListeners = () => {
    AdvancedSecurityService.onEvent('user_authenticated', handleUserAuthenticated);
    AdvancedSecurityService.onEvent('user_logged_out', handleUserLoggedOut);
    AdvancedSecurityService.onEvent('audit_log_entry', handleAuditLogEntry);
    AdvancedSecurityService.onEvent('security_event', handleSecurityEvent);
  };

  const handleUserAuthenticated = (user: User) => {
    setCurrentUser(user);
    setShowTwoFactor(false);
    loadData();
  };

  const handleUserLoggedOut = (user: User) => {
    setCurrentUser(null);
    loadData();
  };

  const handleAuditLogEntry = (entry: AuditLogEntry) => {
    setAuditLog(prev => [entry, ...prev]);
  };

  const handleSecurityEvent = (event: SecurityEvent) => {
    setSecurityEvents(prev => [event, ...prev]);
  };

  const handleLogin = async () => {
    const result = await AdvancedSecurityService.authenticate(
      loginForm.username,
      loginForm.password,
      showTwoFactor ? loginForm.twoFactorCode : undefined
    );

    if (result.success && result.user) {
      setCurrentUser(result.user);
      setShowTwoFactor(false);
      setLoginForm({ username: '', password: '', twoFactorCode: '' });
    } else if (result.requiresTwoFactor) {
      setShowTwoFactor(true);
    } else {
      alert(result.error || 'Login failed');
    }
  };

  const handleLogout = async () => {
    await AdvancedSecurityService.logout();
  };

  const testPermission = async (permissionId: string) => {
    if (!currentUser) return;

    const hasPermission = await AdvancedSecurityService.checkPermission(
      currentUser.id,
      permissionId,
      'test-resource'
    );

    alert(hasPermission ? 'Permission granted!' : 'Permission denied!');
  };

  const testEncryption = async () => {
    try {
      const key = await AdvancedSecurityService.generateEncryptionKey();
      const encrypted = await AdvancedSecurityService.encryptData(testData, key.id);
      setEncryptedData(JSON.stringify(encrypted, null, 2));

      const decrypted = await AdvancedSecurityService.decryptData(
        encrypted.encryptedData,
        key.id,
        encrypted.iv,
        encrypted.tag
      );
      setDecryptedData(decrypted);
    } catch (error) {
      alert(`Encryption error: ${error}`);
    }
  };

  const simulateSecurityEvent = (type: SecurityEvent['type'], severity: SecurityEvent['severity']) => {
    AdvancedSecurityService.logSecurityEvent(
      type,
      severity,
      `Simulated ${type} event`,
      currentUser?.id,
      { timestamp: new Date().toISOString() }
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'permission_check': return '🔍';
      case 'access_granted': return '✅';
      case 'access_revoked': return '❌';
      case 'user_created': return '👤';
      case 'user_updated': return '✏️';
      case 'user_deleted': return '🗑️';
      default: return '📝';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced Security Demo</h1>
        <p className="text-lg text-gray-600">
          Experience enterprise-grade security features with authentication, authorization, and encryption
        </p>
      </div>

      {/* Authentication Status */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${currentUser ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentUser ? `Authenticated as ${currentUser.username}` : 'Not authenticated'}
              </h2>
              {currentUser && (
                <p className="text-sm text-gray-600">
                  Role: {currentUser.role} • Last login: {currentUser.lastLogin.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('auth')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'auth'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Authentication
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Permissions
          </button>
          <button
            onClick={() => setActiveTab('encryption')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'encryption'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Encryption
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security Events
          </button>
        </nav>
      </div>

      {activeTab === 'auth' && (
        <div className="space-y-6">
          {/* Login Form */}
          {!currentUser && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>
                
                {showTwoFactor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Two-Factor Code
                    </label>
                    <input
                      type="text"
                      value={loginForm.twoFactorCode}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter 6-digit code"
                    />
                  </div>
                )}
                
                <button
                  onClick={handleLogin}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showTwoFactor ? 'Verify Two-Factor' : 'Login'}
                </button>
              </div>
            </div>
          )}

          {/* User Management */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'viewer' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Last login: {user.lastLogin.toLocaleString()}</div>
                    <div>Login attempts: {user.loginAttempts}</div>
                    {user.twoFactorEnabled && (
                      <div className="text-green-600">2FA Enabled</div>
                    )}
                    {user.lockedUntil && (
                      <div className="text-red-600">
                        Locked until: {user.lockedUntil.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Permission System</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current User Permissions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Current User Permissions</h3>
                {currentUser ? (
                  <div className="space-y-2">
                    {currentUser.permissions.map(permissionId => {
                      const permission = permissions.find(p => p.id === permissionId);
                      return (
                        <div key={permissionId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{permission?.name || permissionId}</span>
                          <button
                            onClick={() => testPermission(permissionId)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Test
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">Please log in to view permissions</p>
                )}
              </div>

              {/* Available Permissions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Available Permissions</h3>
                <div className="space-y-2">
                  {permissions.map(permission => (
                    <div key={permission.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{permission.name}</h4>
                        <span className="text-xs text-gray-500">{permission.action}</span>
                      </div>
                      <p className="text-sm text-gray-600">{permission.description}</p>
                      <div className="text-xs text-gray-500 mt-1">Resource: {permission.resource}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'encryption' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Encryption</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Data
                </label>
                <textarea
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter data to encrypt"
                />
              </div>
              
              <button
                onClick={testEncryption}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Test Encryption/Decryption
              </button>
              
              {encryptedData && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Encrypted Data</h3>
                  <div className="p-3 bg-gray-50 rounded border">
                    <pre className="text-xs text-gray-700 overflow-x-auto">{encryptedData}</pre>
                  </div>
                </div>
              )}
              
              {decryptedData && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Decrypted Data</h3>
                  <div className="p-3 bg-green-50 rounded border">
                    <pre className="text-sm text-green-700">{decryptedData}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Encryption Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">🔐 Encryption Algorithms</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• AES-256-GCM for high security</li>
                  <li>• ChaCha20-Poly1305 for performance</li>
                  <li>• Secure key generation</li>
                  <li>• IV (Initialization Vector) for uniqueness</li>
                  <li>• Authentication tags for integrity</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">🔑 Key Management</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automatic key generation</li>
                  <li>• Key rotation policies</li>
                  <li>• Secure key storage</li>
                  <li>• Key expiration handling</li>
                  <li>• Key metadata tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Audit Log</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {auditLog.length > 0 ? (
                auditLog.map(entry => (
                  <div key={entry.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getActionIcon(entry.action)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">{entry.action}</h3>
                          <p className="text-sm text-gray-600">
                            {entry.resourceType}: {entry.resourceId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.success ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>User: {entry.userId}</div>
                      <div>IP: {entry.ipAddress}</div>
                      {entry.errorMessage && (
                        <div className="text-red-600">Error: {entry.errorMessage}</div>
                      )}
                      {Object.keys(entry.details).length > 0 && (
                        <div className="mt-2">
                          <strong>Details:</strong>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <p>No audit log entries yet</p>
                  <p className="text-sm">Perform some actions to see audit logs</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Events</h2>
            
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => simulateSecurityEvent('suspicious_activity', 'medium')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Simulate Suspicious Activity
              </button>
              <button
                onClick={() => simulateSecurityEvent('data_breach', 'critical')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Simulate Data Breach
              </button>
              <button
                onClick={() => simulateSecurityEvent('login', 'low')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Simulate Login Event
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {securityEvents.length > 0 ? (
                securityEvents.map(event => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity.toUpperCase()}
                        </span>
                        <div>
                          <h3 className="font-medium text-gray-900">{event.type}</h3>
                          <p className="text-sm text-gray-600">{event.description}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {event.timestamp.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {event.userId && <div>User: {event.userId}</div>}
                      {Object.keys(event.details).length > 0 && (
                        <div className="mt-2">
                          <strong>Details:</strong>
                          <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🚨</div>
                  <p>No security events yet</p>
                  <p className="text-sm">Use the buttons above to simulate events</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 