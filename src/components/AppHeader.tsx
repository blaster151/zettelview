import React from 'react';
import { ThemeToggle, ErrorBoundary } from './index';
import { useThemeStore } from '../store/themeStore';

interface AppHeaderProps {
  title: string;
  onAISummaryClick: () => void;
  onExportImportClick: () => void;
  onViewModeToggle: () => void;
  viewMode: 'editor' | 'graph';
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onAISummaryClick,
  onExportImportClick,
  onViewModeToggle,
  viewMode
}) => {
  const { colors } = useThemeStore();

  return (
    <div style={{ 
      padding: '12px 24px', 
      borderBottom: `1px solid ${colors.border}`,
      background: colors.surface,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s ease'
    }}>
      <h1 style={{ margin: 0, fontSize: '20px', color: colors.text }}>
        {title}
      </h1>
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <ErrorBoundary>
          <ThemeToggle />
        </ErrorBoundary>
        
        <button
          onClick={onAISummaryClick}
          style={{
            background: colors.primary,
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          AI Summary
        </button>
        
        <button
          onClick={onExportImportClick}
          style={{
            background: colors.secondary,
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Export/Import
        </button>
        
        <button
          onClick={onViewModeToggle}
          style={{
            background: colors.accent,
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {viewMode === 'editor' ? 'Graph View' : 'Editor View'}
        </button>
      </div>
    </div>
  );
};

export default AppHeader; 