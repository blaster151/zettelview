import React from 'react';
import { ThemeToggle, ErrorBoundary } from './index';
import { useThemeStore } from '../store/themeStore';

interface AppHeaderProps {
  title: string;
  onAISummaryClick: () => void;
  onExportImportClick: () => void;
  onViewModeToggle: () => void;
  onHelpClick: () => void;
  onStatsClick: () => void;
  viewMode: 'editor' | 'graph';
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onAISummaryClick,
  onExportImportClick,
  onViewModeToggle,
  onHelpClick,
  onStatsClick,
  viewMode
}) => {
  const { colors } = useThemeStore();

  return (
    <header style={{
      padding: '12px 16px',
      borderBottom: `1px solid ${colors.border}`,
      background: colors.surface,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s ease'
    }}>
      <h1 style={{
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
        color: colors.text
      }}>
        {title}
      </h1>

      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          border: `1px solid ${colors.border}`,
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <button
            onClick={onViewModeToggle}
            style={{
              background: viewMode === 'editor' ? colors.primary : 'transparent',
              color: viewMode === 'editor' ? 'white' : colors.text,
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            Editor
          </button>
          <button
            onClick={onViewModeToggle}
            style={{
              background: viewMode === 'graph' ? colors.primary : 'transparent',
              color: viewMode === 'graph' ? 'white' : colors.text,
              border: 'none',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            Graph View
          </button>
        </div>

        {/* Help Button */}
        <button
          onClick={onHelpClick}
          title="Help & Keyboard Shortcuts"
          style={{
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.text,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          ❓ Help
        </button>

        {/* Stats Button */}
        <button
          onClick={onStatsClick}
          title="Note Statistics & Analytics"
          style={{
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.text,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          📊 Stats
        </button>

        {/* AI Analysis Button */}
        <button
          onClick={onAISummaryClick}
          title="AI Analysis"
          style={{
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.text,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          🤖 AI
        </button>

        {/* Export/Import Button */}
        <button
          onClick={onExportImportClick}
          title="Export/Import Notes"
          style={{
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.text,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          📤 Export
        </button>
      </div>
    </header>
  );
};

export default AppHeader; 