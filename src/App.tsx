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
import NotificationToast from './components/NotificationToast';
import { useNoteStore } from './store/noteStore';
import { useThemeStore } from './store/themeStore';
import { useUIStore } from './store/uiStore';
import { useTemplates } from './hooks/useTemplates';
import { useCollaboration } from './hooks/useCollaboration';
import { NoteTemplate } from './types/templates';

const App: React.FC = () => {
  const { selectedId, getNote, initialize, notes, addNote } = useNoteStore();
  const { colors } = useThemeStore();
  const { createNoteFromTemplate, saveNoteAsTemplate } = useTemplates();
  
  // UI state from Zustand store
  const {
    viewMode,
    showAISummaryPanel,
    showExportImport,
    showOnboarding,
    showHelp,
    showStats,
    showTemplateSelector,
    showSaveAsTemplate,
    showCollaborationPanel,
    showPluginManager,
    showPluginStore,
    selectedNoteId,
    setViewMode,
    showAISummaryPanel: showAI,
    hideAISummaryPanel: hideAI,
    showExportImport: showExport,
    hideExportImport: hideExport,
    showOnboarding: showOnboardingUI,
    hideOnboarding: hideOnboardingUI,
    showHelp: showHelpUI,
    hideHelp: hideHelpUI,
    showStats: showStatsUI,
    hideStats: hideStatsUI,
    showTemplateSelector: showTemplateSelectorUI,
    hideTemplateSelector: hideTemplateSelectorUI,
    showSaveAsTemplate: showSaveAsTemplateUI,
    hideSaveAsTemplate: hideSaveAsTemplateUI,
    showCollaborationPanel: showCollaborationPanelUI,
    hideCollaborationPanel: hideCollaborationPanelUI,
    showPluginManager: showPluginManagerUI,
    hidePluginManager: hidePluginManagerUI,
    showPluginStore: showPluginStoreUI,
    hidePluginStore: hidePluginStoreUI,
    setSelectedNoteId
  } = useUIStore();

  // Collaboration state
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
      showOnboardingUI();
    }
  }, [initialize, showOnboardingUI]);

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
    hideOnboardingUI();
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
        <HelpPanel onClose={hideHelpUI} />
      )}
      
      {showTemplateSelector && (
        <TemplateSelector
          isOpen={showTemplateSelector}
          onClose={hideTemplateSelectorUI}
          onSelectTemplate={handleTemplateSelect}
        />
      )}
      
      {showSaveAsTemplate && selectedNote && (
        <SaveAsTemplate
          isOpen={showSaveAsTemplate}
          onClose={hideSaveAsTemplateUI}
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
          onClose={hideCollaborationPanelUI}
        />
      )}

      {showPluginManager && (
        <PluginManager
          isOpen={showPluginManager}
          onClose={hidePluginManagerUI}
        />
      )}

      {showPluginStore && (
        <PluginStore
          isOpen={showPluginStore}
          onClose={hidePluginStoreUI}
        />
      )}

      <AppHeader
        title={title}
        onViewModeToggle={handleViewModeToggle}
        viewMode={viewMode}
        onShowAI={showAI}
        onShowExport={showExport}
        onShowHelp={showHelpUI}
        onShowStats={showStatsUI}
        onShowTemplates={showTemplateSelectorUI}
        onSaveAsTemplate={showSaveAsTemplateUI}
        onShowCollaboration={showCollaborationPanelUI}
        onShowPluginManager={showPluginManagerUI}
        onShowPluginStore={showPluginStoreUI}
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
            onHideStats={hideStatsUI}
            collaborationState={collaborationState}
          />
        </ErrorBoundary>
      </div>
      <NotificationToast />
    </div>
  );
};

export default App;
