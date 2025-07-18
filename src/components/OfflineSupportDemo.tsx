import React, { useState, useEffect } from 'react';
import { OfflineSupportService, SyncStatus, SyncOperation, SyncConflict } from '../services/offlineSupportService';

export const OfflineSupportDemo: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pendingOperations, setPendingOperations] = useState<SyncOperation[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    entries: 0,
    hitRate: 0
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'operations' | 'conflicts' | 'cache'>('status');

  useEffect(() => {
    // Set up event listeners
    OfflineSupportService.onEvent('network_status_changed', handleNetworkStatusChanged);
    OfflineSupportService.onEvent('operation_queued', handleOperationQueued);
    OfflineSupportService.onEvent('operation_synced', handleOperationSynced);
    OfflineSupportService.onEvent('operation_failed', handleOperationFailed);
    OfflineSupportService.onEvent('conflict_detected', handleConflictDetected);
    OfflineSupportService.onEvent('conflict_resolved', handleConflictResolved);
    OfflineSupportService.onEvent('sync_started', handleSyncStarted);
    OfflineSupportService.onEvent('sync_completed', handleSyncCompleted);

    // Initial load
    updateStatus();
    loadPendingOperations();
    loadConflicts();
    updateCacheStats();

    return () => {
      OfflineSupportService.offEvent('network_status_changed', handleNetworkStatusChanged);
      OfflineSupportService.offEvent('operation_queued', handleOperationQueued);
      OfflineSupportService.offEvent('operation_synced', handleOperationSynced);
      OfflineSupportService.offEvent('operation_failed', handleOperationFailed);
      OfflineSupportService.offEvent('conflict_detected', handleConflictDetected);
      OfflineSupportService.offEvent('conflict_resolved', handleConflictResolved);
      OfflineSupportService.offEvent('sync_started', handleSyncStarted);
      OfflineSupportService.offEvent('sync_completed', handleSyncCompleted);
    };
  }, []);

  const handleNetworkStatusChanged = (data: { isOnline: boolean }) => {
    updateStatus();
  };

  const handleOperationQueued = (operation: SyncOperation) => {
    loadPendingOperations();
    updateStatus();
  };

  const handleOperationSynced = (operation: SyncOperation) => {
    loadPendingOperations();
    updateStatus();
  };

  const handleOperationFailed = (operation: SyncOperation) => {
    loadPendingOperations();
    updateStatus();
  };

  const handleConflictDetected = (conflict: SyncConflict) => {
    loadConflicts();
    updateStatus();
  };

  const handleConflictResolved = (conflict: SyncConflict) => {
    loadConflicts();
    updateStatus();
  };

  const handleSyncStarted = (data: { count: number }) => {
    updateStatus();
  };

  const handleSyncCompleted = () => {
    updateStatus();
  };

  const updateStatus = () => {
    setSyncStatus(OfflineSupportService.getSyncStatus());
  };

  const loadPendingOperations = () => {
    // In a real implementation, this would load from the service
    setPendingOperations([]);
  };

  const loadConflicts = () => {
    // In a real implementation, this would load from the service
    setConflicts([]);
  };

  const updateCacheStats = () => {
    // In a real implementation, this would calculate from the service
    setCacheStats({
      size: 15.2, // MB
      entries: 45,
      hitRate: 0.87
    });
  };

  const simulateOfflineMode = () => {
    setIsSimulating(true);
    
    // Simulate going offline
    setTimeout(() => {
      // Simulate some operations while offline
      simulateOfflineOperations();
    }, 1000);
  };

  const simulateOfflineOperations = async () => {
    // Simulate creating operations while offline
    const operations = [
      { type: 'create', entityType: 'note', entityId: 'note1', data: { title: 'Offline Note 1' } },
      { type: 'update', entityType: 'note', entityId: 'note2', data: { content: 'Updated content' } },
      { type: 'delete', entityType: 'note', entityId: 'note3', data: {} }
    ];

    for (const operation of operations) {
      await OfflineSupportService.queueOperation(operation);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Simulate coming back online
    setTimeout(() => {
      setIsSimulating(false);
    }, 2000);
  };

  const simulateConflict = async () => {
    // Simulate a conflict by creating conflicting operations
    const operation1 = await OfflineSupportService.queueOperation({
      type: 'update',
      entityType: 'note',
      entityId: 'conflict-note',
      data: { title: 'Local Update', content: 'Local content' }
    });

    // Simulate a remote conflict
    setTimeout(() => {
      // This would normally come from the server
      const conflict: SyncConflict = {
        id: 'simulated-conflict',
        localOperation: {
          id: operation1,
          type: 'update',
          entityType: 'note',
          entityId: 'conflict-note',
          data: { title: 'Local Update', content: 'Local content' },
          timestamp: new Date(),
          status: 'pending',
          retryCount: 0
        },
        remoteOperation: {
          id: 'remote-op',
          type: 'update',
          entityType: 'note',
          entityId: 'conflict-note',
          data: { title: 'Remote Update', content: 'Remote content' },
          timestamp: new Date(Date.now() - 1000),
          status: 'completed',
          retryCount: 0
        },
        resolution: 'manual'
      };

      setConflicts(prev => [...prev, conflict]);
    }, 1000);
  };

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    await OfflineSupportService.resolveConflict(conflictId, resolution);
  };

  const clearCache = async () => {
    await OfflineSupportService.clearCache();
    updateCacheStats();
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isOnline: boolean) => {
    return isOnline ? '🟢' : '🔴';
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '📝';
    }
  };

  const getOperationColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Offline Support Demo</h1>
        <p className="text-lg text-gray-600">
          Experience seamless offline functionality with automatic sync and conflict resolution
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'status'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Sync Status
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'operations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Operations
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conflicts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Conflicts
          </button>
          <button
            onClick={() => setActiveTab('cache')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cache'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cache Management
          </button>
        </nav>
      </div>

      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Sync Status Overview */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Status</h2>
            
            {syncStatus && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">{getStatusIcon(syncStatus.isOnline)}</div>
                  <div className={`text-lg font-bold ${getStatusColor(syncStatus.isOnline)}`}>
                    {syncStatus.isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-sm text-gray-600">Network Status</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{syncStatus.pendingOperations}</div>
                  <div className="text-sm text-gray-600">Pending Operations</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{syncStatus.conflicts}</div>
                  <div className="text-sm text-gray-600">Conflicts</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{syncStatus.syncProgress}%</div>
                  <div className="text-sm text-gray-600">Sync Progress</div>
                </div>
              </div>
            )}

            {syncStatus?.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-red-600">⚠️</span>
                  <span className="text-red-800 font-medium">Last Error:</span>
                  <span className="text-red-700">{syncStatus.error}</span>
                </div>
              </div>
            )}

            {syncStatus?.lastSync && (
              <div className="mt-4 text-sm text-gray-600">
                Last sync: {syncStatus.lastSync.toLocaleString()}
              </div>
            )}
          </div>

          {/* Simulation Controls */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Simulation Controls</h2>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={simulateOfflineMode}
                disabled={isSimulating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSimulating ? 'Simulating...' : 'Simulate Offline Mode'}
              </button>
              
              <button
                onClick={simulateConflict}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Simulate Conflict
              </button>
              
              <button
                onClick={() => OfflineSupportService.syncPendingOperations()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Force Sync
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>• <strong>Simulate Offline Mode:</strong> Creates operations while offline, then simulates coming back online</p>
              <p>• <strong>Simulate Conflict:</strong> Creates a conflict between local and remote changes</p>
              <p>• <strong>Force Sync:</strong> Manually trigger synchronization of pending operations</p>
            </div>
          </div>

          {/* Offline Features */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Offline Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">📱 Offline Capabilities</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Create, edit, and delete notes offline</li>
                  <li>• Automatic operation queuing</li>
                  <li>• Local data caching</li>
                  <li>• Background sync when online</li>
                  <li>• Conflict detection and resolution</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">🔄 Sync Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Automatic sync when connection restored</li>
                  <li>• Retry mechanism for failed operations</li>
                  <li>• Conflict resolution strategies</li>
                  <li>• Progress tracking and status monitoring</li>
                  <li>• Data compression for efficiency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Operations</h2>
            
            <div className="space-y-4">
              {pendingOperations.length > 0 ? (
                pendingOperations.map(operation => (
                  <div key={operation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getOperationIcon(operation.type)}</span>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} {operation.entityType}
                          </h3>
                          <p className="text-sm text-gray-600">ID: {operation.entityId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOperationColor(operation.status)}`}>
                          {operation.status}
                        </span>
                        {operation.retryCount > 0 && (
                          <span className="text-xs text-gray-500">
                            Retries: {operation.retryCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div>Timestamp: {operation.timestamp.toLocaleString()}</div>
                      {operation.error && (
                        <div className="text-red-600 mt-1">Error: {operation.error}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">✅</div>
                  <p>No pending operations</p>
                  <p className="text-sm">All operations have been synchronized</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Conflicts</h2>
            
            <div className="space-y-4">
              {conflicts.length > 0 ? (
                conflicts.map(conflict => (
                  <div key={conflict.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Conflict: {conflict.localOperation.entityId}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conflict.resolution === 'manual' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {conflict.resolution === 'manual' ? 'Pending Resolution' : 'Resolved'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="border rounded p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Local Changes</h4>
                        <div className="text-sm text-gray-600">
                          <div>Type: {conflict.localOperation.type}</div>
                          <div>Time: {conflict.localOperation.timestamp.toLocaleString()}</div>
                          <div className="mt-2">
                            <strong>Data:</strong>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(conflict.localOperation.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Remote Changes</h4>
                        <div className="text-sm text-gray-600">
                          <div>Type: {conflict.remoteOperation.type}</div>
                          <div>Time: {conflict.remoteOperation.timestamp.toLocaleString()}</div>
                          <div className="mt-2">
                            <strong>Data:</strong>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(conflict.remoteOperation.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {conflict.resolution === 'manual' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Resolution:</span>
                        <button
                          onClick={() => resolveConflict(conflict.id, 'local')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Keep Local
                        </button>
                        <button
                          onClick={() => resolveConflict(conflict.id, 'remote')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Keep Remote
                        </button>
                        <button
                          onClick={() => resolveConflict(conflict.id, 'merge')}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          Merge
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">✅</div>
                  <p>No conflicts detected</p>
                  <p className="text-sm">All changes have been synchronized successfully</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cache' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Management</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{cacheStats.size} MB</div>
                <div className="text-sm text-gray-600">Cache Size</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{cacheStats.entries}</div>
                <div className="text-sm text-gray-600">Cache Entries</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{(cacheStats.hitRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Hit Rate</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Cache
              </button>
              
              <button
                onClick={updateCacheStats}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh Stats
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">💾 Caching Strategy</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Intelligent cache size management</li>
                  <li>• LRU (Least Recently Used) eviction</li>
                  <li>• Automatic expiration based on TTL</li>
                  <li>• Compression for storage efficiency</li>
                  <li>• IndexedDB for persistent storage</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">🚀 Performance Benefits</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Faster data access when offline</li>
                  <li>• Reduced network requests</li>
                  <li>• Improved app responsiveness</li>
                  <li>• Bandwidth optimization</li>
                  <li>• Better user experience</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 