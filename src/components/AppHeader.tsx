import React, { useState } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { PluginManager } from './plugins/PluginManager';
import { PluginStore } from './plugins/PluginStore';
import { ExportImport } from './ExportImport';
import { CollaborationPanel } from './CollaborationPanel';
import { AISummaryPanel } from './AISummaryPanel';
import { GraphView } from './GraphView';
import { CalendarView } from './CalendarView';
import { EnhancedSearch } from './EnhancedSearch';
import { NotificationToast } from './NotificationToast';
import SecurityTestPanel from './SecurityTestPanel';

interface AppHeaderProps {
  onViewChange: (view: string) => void;
  currentView: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onViewChange, currentView }) => {
  const { addNote } = useNoteStore();
  const { colors, toggleTheme } = useThemeStore();
  const [showPluginManager, setShowPluginManager] = useState(false);
  const [showPluginStore, setShowPluginStore] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showGraphView, setShowGraphView] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSecurityTest, setShowSecurityTest] = useState(false);

  const handleCreateNote = async () => {
    const title = prompt('Enter note title:');
    if (title?.trim()) {
      await addNote(title.trim());
    }
  };

  return (
    <header style={{
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      {/* Left side - App title and navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
          color: colors.text
        }}>
          ZettelView
        </h1>

        {/* View mode buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            onClick={() => onViewChange('editor')}
            variant={currentView === 'editor' ? 'primary' : 'outline'}
            size="small"
          >
            <Icon name="edit" size={14} />
            Editor
          </Button>
          <Button
            onClick={() => onViewChange('preview')}
            variant={currentView === 'preview' ? 'primary' : 'outline'}
            size="small"
          >
            <Icon name="eye" size={14} />
            Preview
          </Button>
          <Button
            onClick={() => onViewChange('split')}
            variant={currentView === 'split' ? 'primary' : 'outline'}
            size="small"
          >
            <Icon name="columns" size={14} />
            Split
          </Button>
        </div>
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Create note button */}
        <Button
          onClick={handleCreateNote}
          variant="primary"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="plus" size={14} />
          New Note
        </Button>

        {/* Search button */}
        <Button
          onClick={() => setShowSearch(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="search" size={14} />
          Search
        </Button>

        {/* Graph view button */}
        <Button
          onClick={() => setShowGraphView(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="share" size={14} />
          Graph
        </Button>

        {/* Calendar view button */}
        <Button
          onClick={() => setShowCalendarView(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="calendar" size={14} />
          Calendar
        </Button>

        {/* Security test button */}
        <Button
          onClick={() => setShowSecurityTest(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="shield" size={14} />
          Security
        </Button>

        {/* Plugin manager button */}
        <Button
          onClick={() => setShowPluginManager(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="puzzle" size={14} />
          Plugins
        </Button>

        {/* Plugin store button */}
        <Button
          onClick={() => setShowPluginStore(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="store" size={14} />
          Store
        </Button>

        {/* Export/Import button */}
        <Button
          onClick={() => setShowExportImport(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="download" size={14} />
          Export
        </Button>

        {/* Collaboration button */}
        <Button
          onClick={() => setShowCollaboration(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="users" size={14} />
          Collaborate
        </Button>

        {/* AI Summary button */}
        <Button
          onClick={() => setShowAISummary(true)}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="brain" size={14} />
          AI
        </Button>

        {/* Theme toggle */}
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="small"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="moon" size={14} />
          Theme
        </Button>
      </div>

      {/* Modals */}
      <PluginManager
        isOpen={showPluginManager}
        onClose={() => setShowPluginManager(false)}
      />

      <PluginStore
        isOpen={showPluginStore}
        onClose={() => setShowPluginStore(false)}
      />

      <ExportImport
        isOpen={showExportImport}
        onClose={() => setShowExportImport(false)}
      />

      <CollaborationPanel
        isOpen={showCollaboration}
        onClose={() => setShowCollaboration(false)}
      />

      <AISummaryPanel
        isOpen={showAISummary}
        onClose={() => setShowAISummary(false)}
      />

      <GraphView
        isOpen={showGraphView}
        onClose={() => setShowGraphView(false)}
      />

      <CalendarView
        isOpen={showCalendarView}
        onClose={() => setShowCalendarView(false)}
      />

      <EnhancedSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      <SecurityTestPanel
        isOpen={showSecurityTest}
        onClose={() => setShowSecurityTest(false)}
      />

      <NotificationToast />
    </header>
  );
}; 