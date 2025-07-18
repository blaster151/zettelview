import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'productivity' | 'development' | 'communication' | 'storage' | 'ai';
  status: 'available' | 'connected' | 'disconnected' | 'error';
  config: IntegrationConfig;
  lastSync?: Date;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  features: string[];
  webhookUrl?: string;
  apiKey?: string;
}

interface IntegrationConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  syncDirection: 'import' | 'export' | 'bidirectional';
  filters: {
    tags: string[];
    dateRange: { start: Date | null; end: Date | null };
    noteTypes: string[];
  };
  mappings: {
    titleField: string;
    contentField: string;
    tagsField: string;
    dateField: string;
  };
}

interface SyncResult {
  success: boolean;
  imported: number;
  exported: number;
  errors: string[];
  timestamp: Date;
}

interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: Date;
  processed: boolean;
}

interface NoteIntegrationsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteIntegrations: React.FC<NoteIntegrationsProps> = ({ isOpen, onClose }) => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'sync' | 'settings'>('integrations');
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newApiKey, setNewApiKey] = useState('');

  // Initialize default integrations
  useMemo(() => {
    const defaultIntegrations: Integration[] = [
      {
        id: 'github',
        name: 'GitHub',
        description: 'Sync notes with GitHub repositories and issues',
        icon: '🐙',
        category: 'development',
        status: 'available',
        config: {
          enabled: false,
          autoSync: false,
          syncInterval: 60,
          syncDirection: 'bidirectional',
          filters: {
            tags: [],
            dateRange: { start: null, end: null },
            noteTypes: ['issue', 'documentation']
          },
          mappings: {
            titleField: 'title',
            contentField: 'body',
            tagsField: 'labels',
            dateField: 'created_at'
          }
        },
        syncStatus: 'idle',
        features: ['Issue sync', 'Repository docs', 'Pull request comments', 'Wiki pages']
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Import and export notes to/from Notion databases',
        icon: '📝',
        category: 'productivity',
        status: 'available',
        config: {
          enabled: false,
          autoSync: false,
          syncInterval: 30,
          syncDirection: 'bidirectional',
          filters: {
            tags: [],
            dateRange: { start: null, end: null },
            noteTypes: ['page', 'database']
          },
          mappings: {
            titleField: 'Name',
            contentField: 'Content',
            tagsField: 'Tags',
            dateField: 'Created time'
          }
        },
        syncStatus: 'idle',
        features: ['Page sync', 'Database sync', 'Block-level sync', 'Rich text support']
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Send notes to Slack channels and receive messages',
        icon: '💬',
        category: 'communication',
        status: 'available',
        config: {
          enabled: false,
          autoSync: false,
          syncInterval: 15,
          syncDirection: 'export',
          filters: {
            tags: ['slack'],
            dateRange: { start: null, end: null },
            noteTypes: ['message', 'announcement']
          },
          mappings: {
            titleField: 'title',
            contentField: 'text',
            tagsField: 'channels',
            dateField: 'timestamp'
          }
        },
        syncStatus: 'idle',
        features: ['Channel posting', 'Message reactions', 'Thread replies', 'File sharing']
      },
      {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Sync notes with Google Docs and Sheets',
        icon: '☁️',
        category: 'storage',
        status: 'available',
        config: {
          enabled: false,
          autoSync: false,
          syncInterval: 45,
          syncDirection: 'bidirectional',
          filters: {
            tags: [],
            dateRange: { start: null, end: null },
            noteTypes: ['document', 'spreadsheet']
          },
          mappings: {
            titleField: 'name',
            contentField: 'content',
            tagsField: 'labels',
            dateField: 'modifiedTime'
          }
        },
        syncStatus: 'idle',
        features: ['Doc sync', 'Sheet sync', 'Folder organization', 'Version history']
      },
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'AI-powered note enhancement and generation',
        icon: '🤖',
        category: 'ai',
        status: 'available',
        config: {
          enabled: false,
          autoSync: false,
          syncInterval: 0,
          syncDirection: 'import',
          filters: {
            tags: [],
            dateRange: { start: null, end: null },
            noteTypes: ['ai-generated', 'enhanced']
          },
          mappings: {
            titleField: 'title',
            contentField: 'content',
            tagsField: 'tags',
            dateField: 'created_at'
          }
        },
        syncStatus: 'idle',
        features: ['Content generation', 'Summarization', 'Translation', 'Code analysis']
      },
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect with 5000+ apps through Zapier automation',
        icon: '⚡',
        category: 'productivity',
        status: 'available',
        config: {
          enabled: false,
          autoSync: false,
          syncInterval: 0,
          syncDirection: 'bidirectional',
          filters: {
            tags: [],
            dateRange: { start: null, end: null },
            noteTypes: ['automated']
          },
          mappings: {
            titleField: 'title',
            contentField: 'content',
            tagsField: 'tags',
            dateField: 'timestamp'
          }
        },
        syncStatus: 'idle',
        features: ['Webhook triggers', 'Multi-step workflows', 'Conditional logic', 'Scheduling']
      }
    ];

    setIntegrations(defaultIntegrations);
  }, []);

  // Connect integration
  const connectIntegration = useCallback(async (integration: Integration) => {
    setIsConnecting(true);

    try {
      await PerformanceUtils.measureAsync(
        'integration_connect',
        async () => {
          // Simulate connection process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setIntegrations(prev => prev.map(integ =>
            integ.id === integration.id
              ? { ...integ, status: 'connected', lastSync: new Date() }
              : integ
          ));

          loggingService.info('Integration connected', { 
            integrationId: integration.id, 
            name: integration.name 
          });
        }
      );
    } catch (error) {
      loggingService.error('Integration connection failed', error as Error);
      
      setIntegrations(prev => prev.map(integ =>
        integ.id === integration.id
          ? { ...integ, status: 'error' }
          : integ
      ));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect integration
  const disconnectIntegration = useCallback((integration: Integration) => {
    if (confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
      setIntegrations(prev => prev.map(integ =>
        integ.id === integration.id
          ? { ...integ, status: 'disconnected', lastSync: undefined }
          : integ
      ));

      loggingService.info('Integration disconnected', { 
        integrationId: integration.id, 
        name: integration.name 
      });
    }
  }, []);

  // Sync integration
  const syncIntegration = useCallback(async (integration: Integration) => {
    if (integration.status !== 'connected') return;

    setIntegrations(prev => prev.map(integ =>
      integ.id === integration.id
        ? { ...integ, syncStatus: 'syncing' }
        : integ
    ));

    try {
      const result = await PerformanceUtils.measureAsync(
        'integration_sync',
        async () => {
          // Simulate sync process
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const syncResult: SyncResult = {
            success: true,
            imported: Math.floor(Math.random() * 10) + 1,
            exported: Math.floor(Math.random() * 5),
            errors: [],
            timestamp: new Date()
          };

          setSyncResults(prev => [syncResult, ...prev.slice(0, 9)]);

          setIntegrations(prev => prev.map(integ =>
            integ.id === integration.id
              ? { 
                  ...integ, 
                  syncStatus: 'success', 
                  lastSync: new Date() 
                }
              : integ
          ));

          loggingService.info('Integration synced', { 
            integrationId: integration.id,
            result: syncResult 
          });

          return syncResult;
        }
      );
    } catch (error) {
      loggingService.error('Integration sync failed', error as Error);
      
      setIntegrations(prev => prev.map(integ =>
        integ.id === integration.id
          ? { ...integ, syncStatus: 'error' }
          : integ
      ));
    }
  }, []);

  // Update integration config
  const updateIntegrationConfig = useCallback((integrationId: string, updates: Partial<IntegrationConfig>) => {
    setIntegrations(prev => prev.map(integ =>
      integ.id === integrationId
        ? { ...integ, config: { ...integ.config, ...updates } }
        : integ
    ));
  }, []);

  // Add webhook
  const addWebhook = useCallback(() => {
    if (!newWebhookUrl.trim()) return;

    const webhookEvent: WebhookEvent = {
      id: `webhook_${Date.now()}`,
      type: 'note_created',
      source: 'zettelview',
      data: { noteId: 'example', title: 'Example Note' },
      timestamp: new Date(),
      processed: false
    };

    setWebhookEvents(prev => [webhookEvent, ...prev]);
    setNewWebhookUrl('');

    loggingService.info('Webhook added', { webhookUrl: newWebhookUrl });
  }, [newWebhookUrl]);

  // Test webhook
  const testWebhook = useCallback(async (webhookUrl: string) => {
    try {
      await PerformanceUtils.measureAsync(
        'webhook_test',
        async () => {
          // Simulate webhook test
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const testEvent: WebhookEvent = {
            id: `test_${Date.now()}`,
            type: 'test',
            source: 'zettelview',
            data: { message: 'Test webhook from ZettelView' },
            timestamp: new Date(),
            processed: true
          };

          setWebhookEvents(prev => [testEvent, ...prev]);

          loggingService.info('Webhook tested', { webhookUrl });
        }
      );
    } catch (error) {
      loggingService.error('Webhook test failed', error as Error);
    }
  }, []);

  // Get integrations by category
  const getIntegrationsByCategory = useCallback((category: string) => {
    return integrations.filter(integ => integ.category === category);
  }, [integrations]);

  // Get status color
  const getStatusColor = (status: Integration['status']): string => {
    switch (status) {
      case 'connected': return '#28a745';
      case 'disconnected': return '#6c757d';
      case 'error': return '#dc3545';
      default: return colors.textSecondary;
    }
  };

  // Get sync status color
  const getSyncStatusColor = (status: Integration['syncStatus']): string => {
    switch (status) {
      case 'syncing': return '#ffc107';
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      default: return colors.textSecondary;
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

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
        maxWidth: '1200px',
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
          <h2 style={{ margin: 0, color: colors.text }}>Integrations</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close integrations panel"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '24px'
        }}>
          {[
            { value: 'integrations', label: 'Integrations', icon: '🔌' },
            { value: 'webhooks', label: 'Webhooks', icon: '🌐' },
            { value: 'sync', label: 'Sync History', icon: '🔄' },
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

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Available Integrations</h3>
            
            {/* Integration Categories */}
            {['productivity', 'development', 'communication', 'storage', 'ai'].map(category => {
              const categoryIntegrations = getIntegrationsByCategory(category);
              if (categoryIntegrations.length === 0) return null;

              return (
                <div key={category} style={{ marginBottom: '32px' }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    color: colors.text,
                    textTransform: 'capitalize'
                  }}>
                    {category.replace('-', ' ')} Integrations
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {categoryIntegrations.map(integration => (
                      <div key={integration.id} style={{
                        padding: '20px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        background: colors.background
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{integration.icon}</span>
                            <div>
                              <h5 style={{ margin: 0, color: colors.text }}>{integration.name}</h5>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px'
                              }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: getStatusColor(integration.status)
                                }} />
                                <span style={{ color: colors.textSecondary }}>
                                  {integration.status}
                                </span>
                                {integration.syncStatus !== 'idle' && (
                                  <>
                                    <span style={{ color: colors.textSecondary }}>•</span>
                                    <span style={{
                                      color: getSyncStatusColor(integration.syncStatus)
                                    }}>
                                      {integration.syncStatus}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p style={{ 
                          margin: '0 0 12px 0', 
                          color: colors.textSecondary, 
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {integration.description}
                        </p>

                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                            Features:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {integration.features.slice(0, 3).map((feature, index) => (
                              <span key={index} style={{
                                padding: '2px 6px',
                                background: colors.surface,
                                color: colors.textSecondary,
                                borderRadius: '12px',
                                fontSize: '11px'
                              }}>
                                {feature}
                              </span>
                            ))}
                            {integration.features.length > 3 && (
                              <span style={{
                                padding: '2px 6px',
                                background: colors.surface,
                                color: colors.textSecondary,
                                borderRadius: '12px',
                                fontSize: '11px'
                              }}>
                                +{integration.features.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {integration.status === 'available' && (
                            <button
                              onClick={() => connectIntegration(integration)}
                              disabled={isConnecting}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: colors.primary,
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isConnecting ? 'not-allowed' : 'pointer',
                                opacity: isConnecting ? 0.6 : 1
                              }}
                            >
                              {isConnecting ? 'Connecting...' : 'Connect'}
                            </button>
                          )}
                          
                          {integration.status === 'connected' && (
                            <>
                              <button
                                onClick={() => syncIntegration(integration)}
                                disabled={integration.syncStatus === 'syncing'}
                                style={{
                                  flex: 1,
                                  padding: '8px',
                                  background: colors.primary,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: integration.syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                                  opacity: integration.syncStatus === 'syncing' ? 0.6 : 1
                                }}
                              >
                                {integration.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                              </button>
                              <button
                                onClick={() => setSelectedIntegration(integration)}
                                style={{
                                  padding: '8px',
                                  background: colors.surface,
                                  border: `1px solid ${colors.border}`,
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: colors.text
                                }}
                              >
                                ⚙️
                              </button>
                              <button
                                onClick={() => disconnectIntegration(integration)}
                                style={{
                                  padding: '8px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                ×
                              </button>
                            </>
                          )}
                          
                          {integration.status === 'error' && (
                            <button
                              onClick={() => connectIntegration(integration)}
                              style={{
                                flex: 1,
                                padding: '8px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Retry Connection
                            </button>
                          )}
                        </div>

                        {integration.lastSync && (
                          <div style={{
                            fontSize: '11px',
                            color: colors.textSecondary,
                            marginTop: '8px',
                            textAlign: 'center'
                          }}>
                            Last sync: {formatDate(integration.lastSync)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: colors.text }}>Webhooks</h3>
              <button
                onClick={() => setShowConfig(true)}
                style={{
                  padding: '8px 16px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + Add Webhook
              </button>
            </div>

            {/* Add Webhook Form */}
            {showConfig && (
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Add Webhook</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="Enter webhook URL"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                  <button
                    onClick={() => testWebhook(newWebhookUrl)}
                    disabled={!newWebhookUrl.trim()}
                    style={{
                      padding: '8px 16px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: !newWebhookUrl.trim() ? 'not-allowed' : 'pointer',
                      color: colors.text,
                      opacity: !newWebhookUrl.trim() ? 0.6 : 1
                    }}
                  >
                    Test
                  </button>
                  <button
                    onClick={addWebhook}
                    disabled={!newWebhookUrl.trim()}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: !newWebhookUrl.trim() ? 'not-allowed' : 'pointer',
                      opacity: !newWebhookUrl.trim() ? 0.6 : 1
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowConfig(false);
                      setNewWebhookUrl('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: colors.text
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Webhook Events */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Recent Webhook Events</h4>
              
              {webhookEvents.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: colors.textSecondary
                }}>
                  No webhook events yet. Add a webhook to start receiving events.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {webhookEvents.map(event => (
                    <div key={event.id} style={{
                      padding: '16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.background
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', color: colors.text }}>
                            {event.type}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {event.source} • {formatDate(event.timestamp)}
                          </div>
                        </div>
                        <span style={{
                          padding: '2px 6px',
                          background: event.processed ? '#28a745' : '#ffc107',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px'
                        }}>
                          {event.processed ? 'Processed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sync History Tab */}
        {activeTab === 'sync' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Sync History</h3>
            
            {syncResults.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.textSecondary
              }}>
                No sync history available. Connect an integration and start syncing.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {syncResults.map((result, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: colors.background
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: '500', color: colors.text }}>
                        Sync completed
                      </div>
                      <span style={{
                        padding: '2px 6px',
                        background: result.success ? '#28a745' : '#dc3545',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}>
                        {result.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
                      {formatDate(result.timestamp)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                      <span style={{ color: colors.textSecondary }}>
                        Imported: {result.imported}
                      </span>
                      <span style={{ color: colors.textSecondary }}>
                        Exported: {result.exported}
                      </span>
                      {result.errors.length > 0 && (
                        <span style={{ color: '#dc3545' }}>
                          Errors: {result.errors.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Integration Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Global Settings</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ color: colors.text }}>Enable automatic sync</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ color: colors.text }}>Sync on note changes</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" />
                    <span style={{ color: colors.text }}>Sync attachments</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ color: colors.text }}>Log sync activities</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>API Configuration</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      API Key:
                    </label>
                    <input
                      type="password"
                      value={newApiKey}
                      onChange={(e) => setNewApiKey(e.target.value)}
                      placeholder="Enter API key"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                      Webhook Secret:
                    </label>
                    <input
                      type="password"
                      placeholder="Enter webhook secret"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text
                      }}
                    />
                  </div>
                  
                  <button
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integration Configuration Modal */}
        {selectedIntegration && (
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
            zIndex: 1100
          }}>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, color: colors.text }}>
                  Configure {selectedIntegration.name}
                </h3>
                <button
                  onClick={() => setSelectedIntegration(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: colors.textSecondary
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIntegration.config.enabled}
                      onChange={(e) => updateIntegrationConfig(selectedIntegration.id, { enabled: e.target.checked })}
                    />
                    <span style={{ color: colors.text }}>Enable integration</span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIntegration.config.autoSync}
                      onChange={(e) => updateIntegrationConfig(selectedIntegration.id, { autoSync: e.target.checked })}
                    />
                    <span style={{ color: colors.text }}>Auto-sync</span>
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Sync Direction:
                  </label>
                  <select
                    value={selectedIntegration.config.syncDirection}
                    onChange={(e) => updateIntegrationConfig(selectedIntegration.id, { syncDirection: e.target.value as any })}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  >
                    <option value="import">Import only</option>
                    <option value="export">Export only</option>
                    <option value="bidirectional">Bidirectional</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Sync Interval (minutes):
                  </label>
                  <input
                    type="number"
                    value={selectedIntegration.config.syncInterval}
                    onChange={(e) => updateIntegrationConfig(selectedIntegration.id, { syncInterval: parseInt(e.target.value) })}
                    min="5"
                    max="1440"
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedIntegration(null)}
                    style={{
                      padding: '8px 16px',
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
                    onClick={() => setSelectedIntegration(null)}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteIntegrations; 