import React, { useState, useEffect } from 'react';
import { accessibilityService, AccessibilityConfig, AccessibilityReport, WCAGCompliance } from '../services/accessibilityService';

const AccessibilityDemo: React.FC = () => {
  const [config, setConfig] = useState<AccessibilityConfig>(accessibilityService.getConfig());
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'testing' | 'compliance' | 'features'>('controls');
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [announcementText, setAnnouncementText] = useState('');
  const [speechText, setSpeechText] = useState('');

  useEffect(() => {
    // Generate initial report
    generateReport();
  }, []);

  const generateReport = () => {
    setIsGeneratingReport(true);
    setTimeout(() => {
      const newReport = accessibilityService.generateAccessibilityReport();
      setReport(newReport);
      setIsGeneratingReport(false);
    }, 1000);
  };

  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    accessibilityService.updateConfig(updates);
  };

  const runAccessibilityTest = (testType: string) => {
    const results = { ...testResults };
    
    switch (testType) {
      case 'keyboard':
        results.keyboard = testKeyboardNavigation();
        break;
      case 'contrast':
        results.contrast = testColorContrast();
        break;
      case 'screenReader':
        results.screenReader = testScreenReaderSupport();
        break;
      case 'focus':
        results.focus = testFocusManagement();
        break;
    }
    
    setTestResults(results);
  };

  const testKeyboardNavigation = (): boolean => {
    // Simulate keyboard navigation test
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea');
    return focusableElements.length > 0;
  };

  const testColorContrast = (): boolean => {
    // Simulate color contrast test
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    return textElements.length > 0;
  };

  const testScreenReaderSupport = (): boolean => {
    // Simulate screen reader test
    const ariaElements = document.querySelectorAll('[aria-*]');
    return ariaElements.length > 0;
  };

  const testFocusManagement = (): boolean => {
    // Simulate focus management test
    const focusableElements = document.querySelectorAll('[tabindex]:not([tabindex="-1"])');
    return focusableElements.length > 0;
  };

  const announceMessage = () => {
    if (announcementText.trim()) {
      accessibilityService.announce(announcementText);
      setAnnouncementText('');
    }
  };

  const speakMessage = () => {
    if (speechText.trim()) {
      accessibilityService.speak(speechText);
    }
  };

  const stopSpeaking = () => {
    accessibilityService.stopSpeaking();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number): string => {
    if (score >= 90) return '🟢';
    if (score >= 70) return '🟡';
    return '🔴';
  };

  const getComplianceStatus = (status: 'pass' | 'fail' | 'warning'): { color: string; icon: string } => {
    switch (status) {
      case 'pass':
        return { color: 'text-green-600', icon: '✅' };
      case 'fail':
        return { color: 'text-red-600', icon: '❌' };
      case 'warning':
        return { color: 'text-yellow-600', icon: '⚠️' };
      default:
        return { color: 'text-gray-600', icon: '❓' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Accessibility Demo
        </h1>
        <p className="text-gray-600">
          Test and configure accessibility features for inclusive user experience
        </p>
      </div>

      {/* Accessibility Score */}
      {report && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Accessibility Score</h2>
              <p className="text-sm text-gray-600">Overall accessibility compliance</p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(report.score)}`}>
                {report.score}/100
              </div>
              <div className="text-2xl">{getScoreIcon(report.score)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'controls', label: 'Accessibility Controls', icon: '🎛️' },
              { id: 'testing', label: 'Testing Tools', icon: '🧪' },
              { id: 'compliance', label: 'WCAG Compliance', icon: '📋' },
              { id: 'features', label: 'Features Demo', icon: '✨' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Accessibility Controls Tab */}
          {activeTab === 'controls' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Accessibility */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Visual Accessibility</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">High Contrast Mode</label>
                      <button
                        onClick={() => updateConfig({ highContrastMode: !config.highContrastMode })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.highContrastMode ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.highContrastMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                      <select
                        value={config.fontSize}
                        onChange={(e) => updateConfig({ fontSize: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="x-large">Extra Large</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color Blind Mode</label>
                      <select
                        value={config.colorBlindMode}
                        onChange={(e) => updateConfig({ colorBlindMode: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="none">None</option>
                        <option value="protanopia">Protanopia (Red-Blind)</option>
                        <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
                        <option value="tritanopia">Tritanopia (Blue-Blind)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Reduced Motion</label>
                      <button
                        onClick={() => updateConfig({ reducedMotion: !config.reducedMotion })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Screen Reader & Speech */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Screen Reader & Speech</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Screen Reader Support</label>
                      <button
                        onClick={() => updateConfig({ screenReaderEnabled: !config.screenReaderEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.screenReaderEnabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.screenReaderEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Auto Read Aloud</label>
                      <button
                        onClick={() => updateConfig({ autoReadAloud: !config.autoReadAloud })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.autoReadAloud ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.autoReadAloud ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Speech Rate</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={config.speechRate}
                        onChange={(e) => updateConfig({ speechRate: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <span className="text-sm text-gray-600">{config.speechRate}x</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Announcement</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          placeholder="Enter message to announce..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <button
                          onClick={announceMessage}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Announce
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Speech Text</label>
                      <div className="space-y-2">
                        <textarea
                          value={speechText}
                          onChange={(e) => setSpeechText(e.target.value)}
                          placeholder="Enter text to speak..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={speakMessage}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Speak
                          </button>
                          <button
                            onClick={stopSpeaking}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Stop
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Testing Tools Tab */}
          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Accessibility Tests */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Accessibility Tests</h3>
                  
                  <div className="space-y-3">
                    {[
                      { key: 'keyboard', label: 'Keyboard Navigation', description: 'Test keyboard-only navigation' },
                      { key: 'contrast', label: 'Color Contrast', description: 'Check color contrast ratios' },
                      { key: 'screenReader', label: 'Screen Reader', description: 'Test screen reader compatibility' },
                      { key: 'focus', label: 'Focus Management', description: 'Verify focus indicators and order' }
                    ].map(test => (
                      <div key={test.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{test.label}</p>
                          <p className="text-sm text-gray-600">{test.description}</p>
                          {testResults[test.key] !== undefined && (
                            <p className={`text-sm ${testResults[test.key] ? 'text-green-600' : 'text-red-600'}`}>
                              {testResults[test.key] ? '✅ Passed' : '❌ Failed'}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => runAccessibilityTest(test.key)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Run Test
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {Object.entries(testResults).map(([test, result]) => (
                        <div key={test} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {test.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`text-sm font-medium ${result ? 'text-green-600' : 'text-red-600'}`}>
                            {result ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {Object.keys(testResults).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No tests run yet. Click "Run Test" to start testing.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={generateReport}
                    disabled={isGeneratingReport}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isGeneratingReport ? 'Generating Report...' : 'Generate Full Report'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WCAG Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              {report && (
                <>
                  {/* Compliance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.values(report.compliance.criteria).filter(c => c.status === 'pass').length}
                        </div>
                        <div className="text-sm text-green-600">Passed Criteria</div>
                      </div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {Object.values(report.compliance.criteria).filter(c => c.status === 'fail').length}
                        </div>
                        <div className="text-sm text-red-600">Failed Criteria</div>
                      </div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {Object.values(report.compliance.criteria).filter(c => c.status === 'warning').length}
                        </div>
                        <div className="text-sm text-yellow-600">Warnings</div>
                      </div>
                    </div>
                  </div>

                  {/* WCAG Criteria Details */}
                  <div className="bg-white rounded-lg border">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">WCAG 2.1 AA Compliance</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {Object.entries(report.compliance.criteria).map(([criteria, details]) => {
                        const status = getComplianceStatus(details.status);
                        return (
                          <div key={criteria} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{status.icon}</span>
                                  <h4 className="font-medium text-gray-900">Criteria {criteria}</h4>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    details.impact === 'high' ? 'bg-red-100 text-red-800' :
                                    details.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {details.impact} impact
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{details.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Issues List */}
                  {report.issues.length > 0 && (
                    <div className="bg-white rounded-lg border">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Accessibility Issues</h3>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {report.issues.map((issue, index) => (
                          <div key={index} className="p-4">
                            <div className="flex items-start space-x-3">
                              <span className={`text-lg ${
                                issue.type === 'error' ? 'text-red-600' :
                                issue.type === 'warning' ? 'text-yellow-600' :
                                'text-blue-600'
                              }`}>
                                {issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{issue.message}</p>
                                {issue.wcagCriteria && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    WCAG Criteria: {issue.wcagCriteria}
                                  </p>
                                )}
                                {issue.suggestion && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Suggestion:</strong> {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Features Demo Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skip Links Demo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skip Links</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Press Tab to see skip links appear at the top of the page.
                    </p>
                    <div className="space-y-2">
                      <a href="#main-content" className="block text-blue-600 hover:text-blue-700">
                        Skip to main content
                      </a>
                      <a href="#navigation" className="block text-blue-600 hover:text-blue-700">
                        Skip to navigation
                      </a>
                    </div>
                  </div>
                </div>

                {/* Focus Indicators Demo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Focus Indicators</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Tab through these elements to see focus indicators.
                    </p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Focusable Button
                      </button>
                      <input
                        type="text"
                        placeholder="Focusable input"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <a href="#" className="block text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Focusable Link
                      </a>
                    </div>
                  </div>
                </div>

                {/* ARIA Demo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">ARIA Attributes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Examples of proper ARIA usage.
                    </p>
                    <div className="space-y-2">
                      <button
                        aria-label="Close dialog"
                        aria-describedby="close-description"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        ×
                      </button>
                      <p id="close-description" className="text-xs text-gray-600">
                        Closes the current dialog window
                      </p>
                      
                      <div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <p className="text-xs text-gray-600">Progress: 75%</p>
                    </div>
                  </div>
                </div>

                {/* Error Announcements Demo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Error Announcements</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Test error announcements for screen readers.
                    </p>
                    <div className="space-y-2">
                      <input
                        type="email"
                        placeholder="Enter email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        id="email-input"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('email-input') as HTMLInputElement;
                          accessibilityService.announceError('Please enter a valid email address', input);
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Simulate Error
                      </button>
                      <button
                        onClick={() => {
                          const input = document.getElementById('email-input') as HTMLInputElement;
                          accessibilityService.clearError(input);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Clear Error
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">Ctrl + H</div>
            <div className="text-xs text-gray-600">Toggle High Contrast</div>
          </div>
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">Ctrl + F</div>
            <div className="text-xs text-gray-600">Toggle Font Size</div>
          </div>
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">Ctrl + M</div>
            <div className="text-xs text-gray-600">Toggle Reduced Motion</div>
          </div>
          <div className="text-center p-3 border border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-900">Escape</div>
            <div className="text-xs text-gray-600">Close Modals</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityDemo; 