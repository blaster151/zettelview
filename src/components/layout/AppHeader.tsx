import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface AppHeaderProps {
  title: string;
  viewMode: 'editor' | 'graph';
  onViewModeToggle: () => void;
  onShowAI: () => void;
  onShowExport: () => void;
  onShowHelp: () => void;
  onShowStats: () => void;
  onShowTemplates: () => void;
  onSaveAsTemplate: () => void;
  onShowCollaboration: () => void;
  hasSelectedNote: boolean;
  isCollaborating: boolean;
  onlineUsersCount: number;
  hasRemoteCursors: boolean;
  onOpenPluginManager?: () => void;
  onOpenPluginStore?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  viewMode,
  onViewModeToggle,
  onShowAI,
  onShowExport,
  onShowHelp,
  onShowStats,
  onShowTemplates,
  onSaveAsTemplate,
  onShowCollaboration,
  hasSelectedNote,
  isCollaborating,
  onlineUsersCount,
  hasRemoteCursors,
  onOpenPluginManager,
  onOpenPluginStore
}) => {
  const { colors } = useThemeStore();

  return (
    <header style={{
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '12px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: 'bold',
          color: colors.text
        }}>
          {title}
        </h1>
        
        <button
          onClick={onViewModeToggle}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
          }}
          title={`Switch to ${viewMode === 'editor' ? 'Graph' : 'Editor'} View`}
        >
          {viewMode === 'editor' ? '📊 Graph' : '✏️ Editor'}
        </button>

        {/* Collaboration indicator */}
        {isCollaborating && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            background: '#4CAF50',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'white',
              animation: 'pulse 2s infinite'
            }} />
            {onlineUsersCount} online
            {hasRemoteCursors && (
              <span style={{ fontSize: '10px' }}>• typing</span>
            )}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <button
          onClick={onShowCollaboration}
          style={{
            background: isCollaborating ? '#4CAF50' : colors.surfaceHover,
            color: isCollaborating ? 'white' : colors.text,
            border: `1px solid ${isCollaborating ? '#4CAF50' : colors.border}`,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (!isCollaborating) {
              e.currentTarget.style.background = colors.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = colors.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isCollaborating) {
              e.currentTarget.style.background = colors.surfaceHover;
              e.currentTarget.style.color = colors.text;
              e.currentTarget.style.borderColor = colors.border;
            }
          }}
          title={`${isCollaborating ? 'Manage' : 'Start'} collaboration (Ctrl+Shift+C)`}
        >
          🤝 {isCollaborating ? 'Collaborating' : 'Collaborate'}
          {isCollaborating && onlineUsersCount > 1 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#FF5722',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {onlineUsersCount - 1}
            </span>
          )}
        </button>

        <button
          onClick={onShowTemplates}
          style={{
            background: colors.surfaceHover,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
            e.currentTarget.style.color = colors.text;
            e.currentTarget.style.borderColor = colors.border;
          }}
          title="Create note from template (Ctrl+T)"
        >
          📋 Templates
        </button>

        {hasSelectedNote && (
          <button
            onClick={onSaveAsTemplate}
            style={{
              background: colors.surfaceHover,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.surfaceHover;
              e.currentTarget.style.color = colors.text;
              e.currentTarget.style.borderColor = colors.border;
            }}
            title="Save current note as template"
          >
            💾 Save as Template
          </button>
        )}

        <button
          onClick={onShowAI}
          style={{
            background: colors.surfaceHover,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
            e.currentTarget.style.color = colors.text;
            e.currentTarget.style.borderColor = colors.border;
          }}
          title="AI Analysis (Ctrl+Shift+A)"
        >
          🤖 AI
        </button>

        <button
          onClick={onShowExport}
          style={{
            background: colors.surfaceHover,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
            e.currentTarget.style.color = colors.text;
            e.currentTarget.style.borderColor = colors.border;
          }}
          title="Export/Import (Ctrl+Shift+E)"
        >
          📤 Export
        </button>

        <button
          onClick={onShowStats}
          style={{
            background: colors.surfaceHover,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
            e.currentTarget.style.color = colors.text;
            e.currentTarget.style.borderColor = colors.border;
          }}
          title="Note Statistics"
        >
          📊 Stats
        </button>

        <button
          onClick={onShowHelp}
          style={{
            background: colors.surfaceHover,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = colors.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
            e.currentTarget.style.color = colors.text;
            e.currentTarget.style.borderColor = colors.border;
          }}
          title="Help & Keyboard Shortcuts"
        >
          ❓ Help
        </button>

        {onOpenPluginManager && (
          <button
            onClick={onOpenPluginManager}
            style={{
              background: colors.surfaceHover,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.surfaceHover;
              e.currentTarget.style.color = colors.text;
              e.currentTarget.style.borderColor = colors.border;
            }}
            title="Plugin Manager (Ctrl+Shift+P)"
          >
            <Icon name="settings" className="w-4 h-4" />
            Plugins
          </button>
        )}

        {onOpenPluginStore && (
          <button
            onClick={onOpenPluginStore}
            style={{
              background: colors.surfaceHover,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primary;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.surfaceHover;
              e.currentTarget.style.color = colors.text;
              e.currentTarget.style.borderColor = colors.border;
            }}
            title="Plugin Store"
          >
            <Icon name="package" className="w-4 h-4" />
            Store
          </button>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </header>
  );
};

export default AppHeader; 