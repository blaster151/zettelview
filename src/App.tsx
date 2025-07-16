import React, { useEffect, useState } from 'react';
import './App.css';
import {
  NoteSidebar,
  StoragePermission,
  KeyboardShortcuts,
  AppHeader,
  MainContent,
  ErrorBoundary,
  WelcomeOnboarding,
  HelpPanel
} from './components';
import { useNoteStore } from './store/noteStore';
import { useThemeStore } from './store/themeStore';
import { AppStateProvider, useAppState } from './context/AppStateContext';

// Inner App component that uses the context
const AppContent: React.FC = () => {
  const { selectedId, getNote, initialize } = useNoteStore();
  const { colors } = useThemeStore();
  const { 
    state: { viewMode, showAISummaryPanel, showExportImport, selectedNoteId },
    setViewMode,
    showAISummaryPanel: showAI,
    hideAISummaryPanel: hideAI,
    showExportImport: showExport,
    hideExportImport: hideExport,
    setSelectedNoteId
  } = useAppState();

  // Onboarding and help state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    initialize();
    
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem('zettelview_onboarding_completed');
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [initialize]);

  // Sync selectedNoteId with noteStore's selectedId
  useEffect(() => {
    setSelectedNoteId(selectedId);
  }, [selectedId, setSelectedNoteId]);

  const selectedNote = selectedId ? getNote(selectedId) : null;
  const title = viewMode === 'editor' ? selectedNote?.title || 'ZettelView' : 'Knowledge Graph';

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'editor' ? 'graph' : 'editor');
  };

  const handleNodeClick = (nodeId: string) => {
    setViewMode('editor');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleShowHelp = () => {
    setShowHelp(true);
  };

  const handleCloseHelp = () => {
    setShowHelp(false);
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <KeyboardShortcuts>
        <div 
          className="app-container" 
          style={{ 
            display: 'flex', 
            height: '100vh', 
            flexDirection: 'column',
            background: colors.background,
            color: colors.text,
            transition: 'all 0.2s ease'
          }}
        >
          <ErrorBoundary>
            <StoragePermission />
          </ErrorBoundary>
          
          <div style={{ display: 'flex', flex: 1 }}>
            <ErrorBoundary>
              <NoteSidebar />
            </ErrorBoundary>
            
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <AppHeader
                title={title}
                onAISummaryClick={showAI}
                onExportImportClick={showExport}
                onViewModeToggle={handleViewModeToggle}
                onHelpClick={handleShowHelp}
                viewMode={viewMode}
              />

              <MainContent
                viewMode={viewMode}
                selectedNoteId={selectedNoteId}
                showAISummaryPanel={showAISummaryPanel}
                showExportImport={showExportImport}
                onAISummaryClose={hideAI}
                onExportImportClose={hideExport}
                onNodeClick={handleNodeClick}
              />
            </main>
          </div>
        </div>
      </KeyboardShortcuts>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <WelcomeOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Help Panel */}
      <HelpPanel
        isOpen={showHelp}
        onClose={handleCloseHelp}
      />
    </ErrorBoundary>
  );
};

// Main App component that provides the context
function App() {
  return (
    <AppStateProvider>
      <AppContent />
    </AppStateProvider>
  );
}

export default App;
