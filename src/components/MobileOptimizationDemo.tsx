import React, { useState, useEffect } from 'react';
import { MobileOptimizationService, MobileConfig, TouchGesture } from '../services/mobileOptimizationService';

export const MobileOptimizationDemo: React.FC = () => {
  const [config, setConfig] = useState<MobileConfig>(MobileOptimizationService.getConfig());
  const [uiState, setUIState] = useState(MobileOptimizationService.getUIState());
  const [activeTab, setActiveTab] = useState<'overview' | 'responsive' | 'touch' | 'offline'>('overview');
  const [touchEvents, setTouchEvents] = useState<any[]>([]);
  const [voiceInput, setVoiceInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [offlineData, setOfflineData] = useState(MobileOptimizationService.getOfflineData());

  useEffect(() => {
    // Listen for mobile events
    MobileOptimizationService.onEvent('resize', handleResize);
    MobileOptimizationService.onEvent('orientation_change', handleOrientationChange);
    MobileOptimizationService.onEvent('keyboard_show', handleKeyboardShow);
    MobileOptimizationService.onEvent('keyboard_hide', handleKeyboardHide);
    MobileOptimizationService.onEvent('voice_input', handleVoiceInput);
    MobileOptimizationService.onEvent('pull_to_refresh_trigger', handlePullToRefresh);
    MobileOptimizationService.onEvent('sync_complete', handleSyncComplete);

    // Register touch gestures for demo
    registerDemoGestures();

    return () => {
      // Cleanup event listeners
      MobileOptimizationService.offEvent('resize', handleResize);
      MobileOptimizationService.offEvent('orientation_change', handleOrientationChange);
      MobileOptimizationService.offEvent('keyboard_show', handleKeyboardShow);
      MobileOptimizationService.offEvent('keyboard_hide', handleKeyboardHide);
      MobileOptimizationService.offEvent('voice_input', handleVoiceInput);
      MobileOptimizationService.offEvent('pull_to_refresh_trigger', handlePullToRefresh);
      MobileOptimizationService.offEvent('sync_complete', handleSyncComplete);
    };
  }, []);

  const handleResize = (data: any) => {
    setUIState(MobileOptimizationService.getUIState());
  };

  const handleOrientationChange = (data: any) => {
    setUIState(MobileOptimizationService.getUIState());
  };

  const handleKeyboardShow = (data: any) => {
    setUIState(MobileOptimizationService.getUIState());
  };

  const handleKeyboardHide = (data: any) => {
    setUIState(MobileOptimizationService.getUIState());
  };

  const handleVoiceInput = (data: any) => {
    setVoiceInput(data.transcript);
    setIsListening(false);
  };

  const handlePullToRefresh = (data: any) => {
    setTouchEvents(prev => [...prev, { type: 'pull_to_refresh', timestamp: new Date() }]);
  };

  const handleSyncComplete = (data: any) => {
    setOfflineData(MobileOptimizationService.getOfflineData());
  };

  const registerDemoGestures = () => {
    // Register demo touch gestures
    const gestures: TouchGesture[] = [
      {
        type: 'swipe',
        direction: 'left',
        element: '.demo-card',
        action: (event) => {
          setTouchEvents(prev => [...prev, { type: 'swipe_left', timestamp: new Date() }]);
        }
      },
      {
        type: 'swipe',
        direction: 'right',
        element: '.demo-card',
        action: (event) => {
          setTouchEvents(prev => [...prev, { type: 'swipe_right', timestamp: new Date() }]);
        }
      },
      {
        type: 'tap',
        element: '.demo-button',
        action: (event) => {
          setTouchEvents(prev => [...prev, { type: 'tap', timestamp: new Date() }]);
        }
      },
      {
        type: 'longPress',
        element: '.demo-card',
        action: (event) => {
          setTouchEvents(prev => [...prev, { type: 'long_press', timestamp: new Date() }]);
        }
      }
    ];

    gestures.forEach(gesture => {
      MobileOptimizationService.registerGesture(gesture);
    });
  };

  const handleConfigChange = (key: keyof MobileConfig, value: boolean) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    MobileOptimizationService.updateConfig(newConfig);
  };

  const startVoiceInput = () => {
    setIsListening(true);
    MobileOptimizationService.startVoiceInput();
  };

  const stopVoiceInput = () => {
    setIsListening(false);
    MobileOptimizationService.stopVoiceInput();
  };

  const syncOfflineData = async () => {
    await MobileOptimizationService.syncOfflineData();
  };

  const getDeviceIcon = () => {
    if (uiState.isTablet) return '📱';
    if (uiState.isMobile) return '📱';
    return '💻';
  };

  const getOrientationIcon = () => {
    return uiState.orientation === 'portrait' ? '📱' : '📱↔️';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Mobile Optimization Demo</h1>
        <p className="text-lg text-gray-600">
          Experience responsive design, touch gestures, and mobile-specific features
        </p>
      </div>

      {/* Device Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-2xl">{getDeviceIcon()}</span>
            <div>
              <div className="font-medium text-gray-900">
                {uiState.isMobile ? (uiState.isTablet ? 'Tablet' : 'Mobile') : 'Desktop'}
              </div>
              <div className="text-sm text-gray-600">
                {uiState.screenSize.width} × {uiState.screenSize.height} • {uiState.orientation}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getOrientationIcon()}</span>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {MobileOptimizationService.getBreakpoint().toUpperCase()}
              </div>
              <div className="text-xs text-gray-600">Breakpoint</div>
            </div>
          </div>
        </div>
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
            onClick={() => setActiveTab('responsive')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'responsive'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Responsive Design
          </button>
          <button
            onClick={() => setActiveTab('touch')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'touch'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Touch Interactions
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'offline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Offline Support
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mobile Configuration */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Mobile Configuration</h2>
              
              <div className="space-y-4">
                {Object.entries(config).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <p className="text-xs text-gray-500">
                        {getConfigDescription(key as keyof MobileConfig)}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleConfigChange(key as keyof MobileConfig, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Device Information */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Device Information</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Device Type:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {uiState.isMobile ? (uiState.isTablet ? 'Tablet' : 'Mobile') : 'Desktop'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Orientation:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {uiState.orientation}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Screen Size:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {uiState.screenSize.width} × {uiState.screenSize.height}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Breakpoint:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {MobileOptimizationService.getBreakpoint().toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Keyboard:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {uiState.keyboardVisible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                {uiState.keyboardVisible && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Keyboard Height:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {uiState.keyboardHeight}px
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Safe Area Information */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Safe Area</h2>
            <p className="text-gray-600 mb-4">
              Safe area insets for devices with notches or rounded corners
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{uiState.safeArea.top}px</div>
                <div className="text-xs text-gray-600">Top</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{uiState.safeArea.bottom}px</div>
                <div className="text-xs text-gray-600">Bottom</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{uiState.safeArea.left}px</div>
                <div className="text-xs text-gray-600">Left</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{uiState.safeArea.right}px</div>
                <div className="text-xs text-gray-600">Right</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'responsive' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsive Design</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Responsive Cards */}
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="demo-card bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-medium text-gray-900 mb-1">Card {i + 1}</h3>
                  <p className="text-sm text-gray-600">
                    This card adapts to different screen sizes
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    Breakpoint: {MobileOptimizationService.getBreakpoint().toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakpoint Testing */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Breakpoint Testing</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['xs', 'sm', 'md', 'lg', 'xl'].map(breakpoint => (
                  <div
                    key={breakpoint}
                    className={`p-4 rounded-lg text-center ${
                      MobileOptimizationService.getBreakpoint() === breakpoint
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="text-lg font-bold text-gray-900">{breakpoint.toUpperCase()}</div>
                    <div className="text-sm text-gray-600">
                      {MobileOptimizationService.isBreakpoint(breakpoint as any) ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Breakpoint Queries</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Current:</span> {MobileOptimizationService.getBreakpoint()}
                  </div>
                  <div>
                    <span className="font-medium">Mobile or larger:</span> {MobileOptimizationService.isBreakpointOrLarger('sm') ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <span className="font-medium">Desktop or smaller:</span> {MobileOptimizationService.isBreakpointOrSmaller('lg') ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'touch' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Touch Gestures */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Touch Gestures</h2>
              
              <div className="space-y-4">
                <div className="demo-card bg-gradient-to-br from-green-50 to-blue-50 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">👆</div>
                  <h3 className="font-medium text-gray-900 mb-2">Interactive Card</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Try these gestures on this card:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Tap to select</li>
                    <li>• Long press for options</li>
                    <li>• Swipe left/right</li>
                    <li>• Pull to refresh (at top)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <button className="demo-button w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Tap Me
                  </button>
                  <button className="demo-button w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                    Another Button
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Input */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Voice Input</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Voice Recognition</span>
                    <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={startVoiceInput}
                      disabled={isListening}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {isListening ? 'Listening...' : 'Start Voice Input'}
                    </button>
                    
                    {isListening && (
                      <button
                        onClick={stopVoiceInput}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Stop Listening
                      </button>
                    )}
                  </div>
                </div>

                {voiceInput && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Recognized Text:</h4>
                    <p className="text-sm text-gray-700">{voiceInput}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Touch Events Log */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Touch Events Log</h2>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {touchEvents.length > 0 ? (
                touchEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.type === 'tap' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'long_press' ? 'bg-yellow-100 text-yellow-800' :
                        event.type === 'swipe_left' ? 'bg-red-100 text-red-800' :
                        event.type === 'swipe_right' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No touch events yet</p>
                  <p className="text-sm">Try interacting with the elements above</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'offline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offline Status */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Offline Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Sync Status</div>
                    <div className="text-sm text-gray-600">
                      {offlineData.syncStatus === 'idle' ? 'Up to date' :
                       offlineData.syncStatus === 'syncing' ? 'Syncing...' :
                       'Sync error'}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    offlineData.syncStatus === 'idle' ? 'bg-green-500' :
                    offlineData.syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500'
                  }`}></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{offlineData.notes.length}</div>
                    <div className="text-sm text-gray-600">Offline Notes</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{offlineData.pendingChanges.length}</div>
                    <div className="text-sm text-gray-600">Pending Changes</div>
                  </div>
                </div>

                <button
                  onClick={syncOfflineData}
                  disabled={offlineData.syncStatus === 'syncing'}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {offlineData.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>

            {/* Last Sync Info */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Last Sync</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Last Sync Time</div>
                  <div className="font-medium text-gray-900">
                    {offlineData.lastSync.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Network Status</div>
                  <div className="font-medium text-gray-900">
                    {navigator.onLine ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Storage Available</div>
                  <div className="font-medium text-gray-900">
                    {navigator.storage ? 'Available' : 'Not Available'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Offline Notes */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Offline Notes</h2>
            
            <div className="space-y-3">
              {offlineData.notes.length > 0 ? (
                offlineData.notes.map((note, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{note.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{note.body.substring(0, 100)}...</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {note.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No offline notes available</p>
                  <p className="text-sm">Notes will be cached when you're online</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get configuration descriptions
const getConfigDescription = (key: keyof MobileConfig): string => {
  const descriptions: Record<keyof MobileConfig, string> = {
    enableTouchGestures: 'Enable touch gesture recognition',
    enableSwipeNavigation: 'Allow swipe navigation between pages',
    enablePullToRefresh: 'Enable pull-to-refresh functionality',
    enableOfflineMode: 'Cache data for offline use',
    enableMobileSearch: 'Optimize search for mobile devices',
    enableVoiceInput: 'Enable voice input capabilities',
    enableHapticFeedback: 'Provide haptic feedback for interactions',
    enableMobileOptimizedUI: 'Use mobile-optimized UI components'
  };
  return descriptions[key];
}; 