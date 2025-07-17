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
  HelpPanel,
  NoteStats,
  TemplateSelector,
  SaveAsTemplate,
  CollaborationPanel,
  PluginManager,
  PluginStore
} from './components';
import { useNoteStore } from './store/noteStore';
import { useThemeStore } from './store/themeStore';
import { useTemplates } from './hooks/useTemplates';
import { useCollaboration } from './hooks/useCollaboration';
import { AppStateProvider, useAppState } from './context/AppStateContext';
import { NoteTemplate } from './types/templates';

// Inner App component that uses the context
const AppContent: React.FC = () => {
  const { selectedId, getNote, initialize, notes, addNote } = useNoteStore();
  const { colors } = useThemeStore();
  const { createNoteFromTemplate, saveNoteAsTemplate } = useTemplates();
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
  const [showStats, setShowStats] = useState(false);

  // Template state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);

  // Collaboration state
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const {
    state: collaborationState,
    isCollaborating,
    onlineUsersCount,
    hasRemoteCursors
  } = useCollaboration(selectedId);

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
    localStorage.setItem('zettelview_onboarding_completed', 'true');
  };

  const handleTemplateSelect = (template: NoteTemplate) => {
    try {
      const newNote = createNoteFromTemplate({
        templateId: template.id,
        title: `New ${template.name}`,
        customTags: []
      });
      
      const addedNote = addNote(newNote.title, newNote.body, newNote.tags);
      setSelectedNoteId(addedNote.id);
      setViewMode('editor');
    } catch (error) {
      console.error('Failed to create note from template:', error);
    }
  };

  const handleSaveAsTemplate = (templateName: string, templateDescription: string, templateCategory: string) => {
    if (selectedNote) {
      try {
        const template = saveNoteAsTemplate({
          title: selectedNote.title,
          body: selectedNote.body,
          tags: selectedNote.tags
        });
        
        // Update the template with user-provided name and description
        // Note: This would require updating the useTemplates hook to support this
        console.log('Template saved:', template);
      } catch (error) {
        console.error('Failed to save template:', error);
      }
    }
  };

  return (
    <div className="App" style={{ background: colors.background, color: colors.text }}>
      <KeyboardShortcuts />
      
      {showOnboarding && (
        <WelcomeOnboarding onComplete={handleOnboardingComplete} />
      )}
      
      {showHelp && (
        <HelpPanel onClose={() => setShowHelp(false)} />
      )}
      
      {showTemplateSelector && (
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          onSelectTemplate={handleTemplateSelect}
        />
      )}
      
      {showSaveAsTemplate && selectedNote && (
        <SaveAsTemplate
          isOpen={showSaveAsTemplate}
          onClose={() => setShowSaveAsTemplate(false)}
          onSave={handleSaveAsTemplate}
          currentNote={{
            title: selectedNote.title,
            body: selectedNote.body,
            tags: selectedNote.tags
          }}
        />
      )}

      {showCollaborationPanel && (
        <CollaborationPanel
          noteId={selectedId}
          isOpen={showCollaborationPanel}
          onClose={() => setShowCollaborationPanel(false)}
        />
      )}

      <AppHeader
        title={title}
        onViewModeToggle={handleViewModeToggle}
        viewMode={viewMode}
        onShowAI={showAI}
        onShowExport={showExport}
        onShowHelp={() => setShowHelp(true)}
        onShowStats={() => setShowStats(true)}
        onShowTemplates={() => setShowTemplateSelector(true)}
        onSaveAsTemplate={() => setShowSaveAsTemplate(true)}
        onShowCollaboration={() => setShowCollaborationPanel(true)}
        hasSelectedNote={!!selectedNote}
        isCollaborating={isCollaborating}
        onlineUsersCount={onlineUsersCount}
        hasRemoteCursors={hasRemoteCursors}
      />

      <div className="main-container">
        <ErrorBoundary>
          <NoteSidebar />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <MainContent
            viewMode={viewMode}
            onNodeClick={handleNodeClick}
            showAISummaryPanel={showAISummaryPanel}
            showExportImport={showExportImport}
            showStats={showStats}
            onHideAI={hideAI}
            onHideExport={hideExport}
            onHideStats={() => setShowStats(false)}
            collaborationState={collaborationState}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

// Main App component that provides the context
function App() {
  const [isPluginManagerOpen, setIsPluginManagerOpen] = useState(false);
  const [isPluginStoreOpen, setIsPluginStoreOpen] = useState(false);

  const handleInstallPlugin = (plugin: any) => {
    // Mock plugin installation
    console.log('Installing plugin:', plugin.name);
    // In a real implementation, this would download and register the plugin
    setIsPluginStoreOpen(false);
  };

  return (
    <AppStateProvider>
      <div className="App" style={{ background: colors.background, color: colors.text }}>
        <KeyboardShortcuts />
        
        {showOnboarding && (
          <WelcomeOnboarding onComplete={handleOnboardingComplete} />
        )}
        
        {showHelp && (
          <HelpPanel onClose={() => setShowHelp(false)} />
        )}
        
        {showTemplateSelector && (
          <TemplateSelector
            isOpen={showTemplateSelector}
            onClose={() => setShowTemplateSelector(false)}
            onSelectTemplate={handleTemplateSelect}
          />
        )}
        
        {showSaveAsTemplate && selectedNote && (
          <SaveAsTemplate
            isOpen={showSaveAsTemplate}
            onClose={() => setShowSaveAsTemplate(false)}
            onSave={handleSaveAsTemplate}
            currentNote={{
              title: selectedNote.title,
              body: selectedNote.body,
              tags: selectedNote.tags
            }}
          />
        )}

        {showCollaborationPanel && (
          <CollaborationPanel
            noteId={selectedId}
            isOpen={showCollaborationPanel}
            onClose={() => setShowCollaborationPanel(false)}
          />
        )}

        <AppHeader
          title={title}
          onViewModeToggle={handleViewModeToggle}
          viewMode={viewMode}
          onShowAI={showAI}
          onShowExport={showExport}
          onShowHelp={() => setShowHelp(true)}
          onShowStats={() => setShowStats(true)}
          onShowTemplates={() => setShowTemplateSelector(true)}
          onSaveAsTemplate={() => setShowSaveAsTemplate(true)}
          onShowCollaboration={() => setShowCollaborationPanel(true)}
          hasSelectedNote={!!selectedNote}
          isCollaborating={isCollaborating}
          onlineUsersCount={onlineUsersCount}
          hasRemoteCursors={hasRemoteCursors}
          onOpenPluginManager={() => setIsPluginManagerOpen(true)}
          onOpenPluginStore={() => setIsPluginStoreOpen(true)}
        />

        <div className="main-container">
          <ErrorBoundary>
            <NoteSidebar />
          </ErrorBoundary>
          
          <ErrorBoundary>
            <MainContent
              viewMode={viewMode}
              onNodeClick={handleNodeClick}
              showAISummaryPanel={showAISummaryPanel}
              showExportImport={showExportImport}
              showStats={showStats}
              onHideAI={hideAI}
              onHideExport={hideExport}
              onHideStats={() => setShowStats(false)}
              collaborationState={collaborationState}
            />
          </ErrorBoundary>
        </div>

        <PluginManager
          isOpen={isPluginManagerOpen}
          onClose={() => setIsPluginManagerOpen(false)}
        />

        <PluginStore
          isOpen={isPluginStoreOpen}
          onClose={() => setIsPluginStoreOpen(false)}
          onInstall={handleInstallPlugin}
        />
      </div>
    </AppStateProvider>
  );
}

export default App;
