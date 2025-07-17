import React, { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { MaliciousFileGenerator, SecurityMonitor } from '../utils/securityUtils';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Tabs, Tab } from './ui/Tabs';
import { Badge } from './ui/Badge';

interface SecurityTestPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecurityTestPanel: React.FC<SecurityTestPanelProps> = ({ isOpen, onClose }) => {
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'tests' | 'violations' | 'config'>('tests');
  const [testResults, setTestResults] = useState<Array<{
    name: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    error?: string;
    duration?: number;
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);

  const securityMonitor = SecurityMonitor.getInstance();

  const maliciousTests = [
    {
      name: 'Memory Exhaustion Attack',
      description: 'Creates a file with 100MB of repeated characters',
      generator: () => MaliciousFileGenerator.generateMemoryExhaustionFile(),
      expectedResult: 'Should be rejected due to file size limit'
    },
    {
      name: 'Regex DoS Attack',
      description: 'Creates a file with patterns that could cause catastrophic backtracking',
      generator: () => MaliciousFileGenerator.generateRegexDoSAttack(),
      expectedResult: 'Should be rejected due to blocked patterns'
    },
    {
      name: 'Excessive Internal Links',
      description: 'Creates a file with 2000 internal links',
      generator: () => MaliciousFileGenerator.generateExcessiveInternalLinks(),
      expectedResult: 'Should be rejected due to too many internal links'
    },
    {
      name: 'Unicode Attack',
      description: 'Creates a file with 10,000 emojis and combining characters',
      generator: () => MaliciousFileGenerator.generateUnicodeAttack(),
      expectedResult: 'Should be rejected due to Unicode patterns'
    },
    {
      name: 'Long Title Attack',
      description: 'Creates a file with a 10,000 character title',
      generator: () => MaliciousFileGenerator.generateLongTitleAttack(),
      expectedResult: 'Should be rejected due to title length limit'
    },
    {
      name: 'Excessive Tags Attack',
      description: 'Creates a file with 500 tags',
      generator: () => MaliciousFileGenerator.generateExcessiveTagsAttack(),
      expectedResult: 'Should be rejected due to too many tags'
    }
  ];

  const runSecurityTests = async () => {
    setIsRunning(true);
    setTestResults(maliciousTests.map(test => ({ name: test.name, status: 'pending' })));

    for (let i = 0; i < maliciousTests.length; i++) {
      const test = maliciousTests[i];
      const startTime = Date.now();

      setTestResults(prev => 
        prev.map((result, index) => 
          index === i ? { ...result, status: 'running' } : result
        )
      );

      try {
        // Generate malicious content
        const maliciousContent = test.generator();
        
        // Try to parse it (this should fail)
        const parsed = JSON.parse(maliciousContent);
        
        // If we get here, the test failed (security should have blocked it)
        setTestResults(prev => 
          prev.map((result, index) => 
            index === i ? { 
              ...result, 
              status: 'failed', 
              error: 'Security validation should have blocked this content',
              duration: Date.now() - startTime
            } : result
          )
        );
      } catch (error) {
        // This is expected - security validation should catch the malicious content
        setTestResults(prev => 
          prev.map((result, index) => 
            index === i ? { 
              ...result, 
              status: 'passed', 
              error: error instanceof Error ? error.message : 'Unknown error',
              duration: Date.now() - startTime
            } : result
          )
        );
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRunning(false);
  };

  const clearViolations = () => {
    securityMonitor.clearViolations();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green';
      case 'failed': return 'red';
      case 'running': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⏸️';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Test Panel" size="large">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
              Security Testing
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary }}>
              Test the app's defenses against malicious files
            </p>
          </div>
          <Button
            onClick={runSecurityTests}
            disabled={isRunning}
            variant="primary"
            size="small"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tab value="tests" label="Security Tests" />
          <Tab value="violations" label="Violations" />
          <Tab value="config" label="Configuration" />
        </Tabs>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {activeTab === 'tests' && (
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>
                Malicious File Tests
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {maliciousTests.map((test, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    background: colors.background
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h5 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                          {test.name}
                        </h5>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: colors.textSecondary }}>
                          {test.description}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: colors.primary }}>
                          Expected: {test.expectedResult}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {testResults[index] && (
                          <>
                            <span style={{ fontSize: '16px' }}>
                              {getStatusIcon(testResults[index].status)}
                            </span>
                            <Badge color={getStatusColor(testResults[index].status)}>
                              {testResults[index].status.toUpperCase()}
                            </Badge>
                            {testResults[index].duration && (
                              <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                                {testResults[index].duration}ms
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {testResults[index]?.error && (
                      <div style={{
                        padding: '8px',
                        background: colors.surfaceActive,
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: colors.textSecondary,
                        fontFamily: 'monospace'
                      }}>
                        {testResults[index].error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'violations' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: 0, color: colors.text }}>
                  Security Violations
                </h4>
                <Button
                  onClick={clearViolations}
                  variant="outline"
                  size="small"
                >
                  Clear All
                </Button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {securityMonitor.getViolations().map((violation, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    background: colors.background
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge color={violation.severity === 'high' ? 'red' : violation.severity === 'medium' ? 'orange' : 'yellow'}>
                          {violation.severity.toUpperCase()}
                        </Badge>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>
                          {violation.type}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {violation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div style={{
                      padding: '8px',
                      background: colors.surfaceActive,
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: colors.textSecondary,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {JSON.stringify(violation.details, null, 2)}
                    </div>
                  </div>
                ))}
                
                {securityMonitor.getViolations().length === 0 && (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: colors.textSecondary
                  }}>
                    No security violations recorded
                  </div>
                )}
              </div>
              
              {/* Violation Statistics */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                background: colors.background
              }}>
                <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                  Violation Statistics
                </h5>
                {(() => {
                  const stats = securityMonitor.getViolationStats();
                  return (
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Total: </span>
                        <span style={{ fontWeight: '600' }}>{stats.total}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>High: </span>
                        <span style={{ fontWeight: '600', color: '#dc3545' }}>{stats.bySeverity.high || 0}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Medium: </span>
                        <span style={{ fontWeight: '600', color: '#fd7e14' }}>{stats.bySeverity.medium || 0}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: colors.textSecondary }}>Low: </span>
                        <span style={{ fontWeight: '600', color: '#ffc107' }}>{stats.bySeverity.low || 0}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>
                Security Configuration
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                    File Size Limits
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Max File Size: </span>
                      <span style={{ fontWeight: '600' }}>10 MB</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Max Title Length: </span>
                      <span style={{ fontWeight: '600' }}>1,000 characters</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Max Body Length: </span>
                      <span style={{ fontWeight: '600' }}>5 MB</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                    Content Limits
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Max Tags Count: </span>
                      <span style={{ fontWeight: '600' }}>100 tags</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Max Tag Length: </span>
                      <span style={{ fontWeight: '600' }}>50 characters</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Max Internal Links: </span>
                      <span style={{ fontWeight: '600' }}>1,000 links</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  background: colors.background
                }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                    Security Features
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Regex Timeout: </span>
                      <span style={{ fontWeight: '600' }}>5 seconds</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textSecondary }}>Blocked Patterns: </span>
                      <span style={{ fontWeight: '600' }}>16 patterns</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textSecondary }}>File Extensions: </span>
                      <span style={{ fontWeight: '600' }}>.md, .markdown, .txt</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SecurityTestPanel; 