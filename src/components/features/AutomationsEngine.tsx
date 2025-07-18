import React, { useState, useMemo, useCallback } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';

interface Automation {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  lastRun?: Date;
}

interface AutomationTrigger {
  type: 'onCreate' | 'onUpdate' | 'onTag' | 'scheduled' | 'manual';
  config?: any;
}

interface AutomationAction {
  type: 'addTag' | 'removeTag' | 'export' | 'reminder' | 'webhook' | 'custom';
  config: any;
}

const defaultAutomations: Automation[] = [
  {
    id: 'auto-tag-ai',
    name: 'Auto-tag AI Notes',
    description: 'Automatically tag notes containing "AI" with the tag "artificial-intelligence".',
    enabled: true,
    trigger: { type: 'onCreate' },
    actions: [
      { type: 'addTag', config: { tag: 'artificial-intelligence' } }
    ]
  },
  {
    id: 'daily-export',
    name: 'Daily Export',
    description: 'Export all notes to JSON every day at 2am.',
    enabled: false,
    trigger: { type: 'scheduled', config: { cron: '0 2 * * *' } },
    actions: [
      { type: 'export', config: { format: 'json', destination: 'local' } }
    ]
  }
];

const AutomationsEngine: React.FC = () => {
  const { notes, updateNote } = useNoteStore();
  const { colors } = useThemeStore();
  const [automations, setAutomations] = useState<Automation[]>(defaultAutomations);
  const [activeTab, setActiveTab] = useState<'list' | 'builder' | 'history'>('list');
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Run automation (mock)
  const runAutomation = useCallback((automation: Automation) => {
    loggingService.info('Running automation', { automation });
    setHistory(prev => [
      { id: Date.now(), name: automation.name, time: new Date(), status: 'success' },
      ...prev
    ]);
    setAutomations(prev => prev.map(a => a.id === automation.id ? { ...a, lastRun: new Date() } : a));
  }, []);

  // Toggle automation
  const toggleAutomation = useCallback((id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
    loggingService.info('Toggled automation', { id });
  }, []);

  // Add new automation (simplified)
  const addAutomation = useCallback((automation: Automation) => {
    setAutomations(prev => [automation, ...prev]);
    loggingService.info('Added automation', { automation });
  }, []);

  // Automation builder (simplified UI)
  const [builder, setBuilder] = useState<Partial<Automation>>({
    name: '',
    description: '',
    enabled: true,
    trigger: { type: 'onCreate' },
    actions: []
  });

  const handleBuilderChange = (field: string, value: any) => {
    setBuilder(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAction = (action: AutomationAction) => {
    setBuilder(prev => ({ ...prev, actions: [...(prev.actions || []), action] }));
  };

  const handleCreateAutomation = () => {
    if (!builder.name || !builder.trigger || !(builder.actions && builder.actions.length)) return;
    addAutomation({
      id: `auto_${Date.now()}`,
      name: builder.name!,
      description: builder.description || '',
      enabled: builder.enabled ?? true,
      trigger: builder.trigger!,
      actions: builder.actions!,
    });
    setBuilder({ name: '', description: '', enabled: true, trigger: { type: 'onCreate' }, actions: [] });
    setActiveTab('list');
  };

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 24,
      maxWidth: 900,
      margin: '40px auto',
      minHeight: 600
    }}>
      <h2 style={{ color: colors.text }}>Automations & Workflows</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('list')} style={{ background: activeTab === 'list' ? colors.primary : colors.surface, color: activeTab === 'list' ? 'white' : colors.text, border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>Automations</button>
        <button onClick={() => setActiveTab('builder')} style={{ background: activeTab === 'builder' ? colors.primary : colors.surface, color: activeTab === 'builder' ? 'white' : colors.text, border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>Builder</button>
        <button onClick={() => setActiveTab('history')} style={{ background: activeTab === 'history' ? colors.primary : colors.surface, color: activeTab === 'history' ? 'white' : colors.text, border: 'none', borderRadius: 4, padding: '8px 16px', cursor: 'pointer' }}>History</button>
      </div>
      {activeTab === 'list' && (
        <div>
          <h3 style={{ color: colors.text }}>Your Automations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {automations.map(auto => (
              <div key={auto.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 6, padding: 16, background: colors.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: colors.text }}>{auto.name}</div>
                  <div style={{ color: colors.textSecondary, fontSize: 13 }}>{auto.description}</div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    Trigger: <b>{auto.trigger.type}</b> | Actions: <b>{auto.actions.map(a => a.type).join(', ')}</b>
                  </div>
                  {auto.lastRun && <div style={{ fontSize: 12, color: colors.textSecondary }}>Last run: {auto.lastRun.toLocaleString()}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => runAutomation(auto)} style={{ background: colors.primary, color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>Run</button>
                  <button onClick={() => toggleAutomation(auto.id)} style={{ background: auto.enabled ? '#28a745' : '#dc3545', color: 'white', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer' }}>{auto.enabled ? 'Enabled' : 'Disabled'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'builder' && (
        <div>
          <h3 style={{ color: colors.text }}>Create Automation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <input placeholder="Name" value={builder.name} onChange={e => handleBuilderChange('name', e.target.value)} style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 4, background: colors.surface, color: colors.text }} />
            <textarea placeholder="Description" value={builder.description} onChange={e => handleBuilderChange('description', e.target.value)} style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 4, background: colors.surface, color: colors.text }} />
            <div>
              <label style={{ color: colors.text }}>Trigger:</label>
              <select value={builder.trigger?.type} onChange={e => handleBuilderChange('trigger', { type: e.target.value })} style={{ padding: 8, border: `1px solid ${colors.border}`, borderRadius: 4, background: colors.surface, color: colors.text }}>
                <option value="onCreate">On Create</option>
                <option value="onUpdate">On Update</option>
                <option value="onTag">On Tag</option>
                <option value="scheduled">Scheduled</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label style={{ color: colors.text }}>Actions:</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => handleAddAction({ type: 'addTag', config: { tag: 'important' } })} style={{ padding: '6px 12px', background: colors.primary, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Add Tag</button>
                <button onClick={() => handleAddAction({ type: 'export', config: { format: 'json', destination: 'local' } })} style={{ padding: '6px 12px', background: colors.primary, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Export</button>
                <button onClick={() => handleAddAction({ type: 'reminder', config: { time: 'tomorrow' } })} style={{ padding: '6px 12px', background: colors.primary, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Reminder</button>
                <button onClick={() => handleAddAction({ type: 'webhook', config: { url: 'https://example.com' } })} style={{ padding: '6px 12px', background: colors.primary, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Webhook</button>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: colors.textSecondary }}>
                {builder.actions && builder.actions.length > 0 ? builder.actions.map((a, i) => <span key={i}>{a.type}{i < builder.actions.length - 1 ? ', ' : ''}</span>) : 'No actions added.'}
              </div>
            </div>
            <button onClick={handleCreateAutomation} style={{ padding: '10px 20px', background: colors.primary, color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginTop: 12 }}>Create Automation</button>
          </div>
        </div>
      )}
      {activeTab === 'history' && (
        <div>
          <h3 style={{ color: colors.text }}>Automation History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.length === 0 && <div style={{ color: colors.textSecondary }}>No automation runs yet.</div>}
            {history.map(h => (
              <div key={h.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 4, padding: 10, background: colors.surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>{h.name}</b> ran at {h.time.toLocaleString()}
                </div>
                <div style={{ color: h.status === 'success' ? '#28a745' : '#dc3545' }}>{h.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationsEngine; 