import React, { useEffect, useState } from 'react';
import { useThemeStore } from './store/themeStore';
import { useNoteStore } from './store/noteStore';
import { useUIStore } from './store/uiStore';
import { useNotificationStore } from './store/notificationStore';

// Import components
import Sidebar from './components/Sidebar';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import LoadingSpinner from './components/LoadingSpinner';
import NotificationPanel from './components/NotificationPanel';
import VirtualizedNoteList from './components/VirtualizedNoteList';
import MarkdownEditor from './components/MarkdownEditor';
import GraphView from './components/features/GraphView';
import CalendarView from './components/CalendarView';
import ErrorBoundary from './components/ErrorBoundary';
import AsyncErrorBoundary from './components/AsyncErrorBoundary';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAStatusIndicator from './components/PWAStatusIndicator';

// Theme flash prevention styles
import './styles/themeFlashPrevention.css';

const App: React.FC = () => {
  const { colors } = useThemeStore();
  const { notes, selectedId, getNote, updateNote } = useNoteStore();
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    viewMode, 
    setViewMode,
    showSearch,
    setShowSearch,
    showSettings,
    setShowSettings,
    isLoading,
    setIsLoading
  } = useUIStore();
  const { notifications } = useNotificationStore();

  // Get selected note
  const selectedNote = selectedId ? getNote(selectedId) : null;

  // Handle note selection
  const handleSelectNote = (noteId: string) => {
    // This would be handled by the store
    console.log('Selected note:', noteId);
  };

  // Handle note changes
  const handleNoteChange = (content: string) => {
    if (selectedNote) {
      updateNote(selectedNote.id, { body: content });
    }
  };

  // Handle sidebar toggle
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle view mode changes
  const handleViewModeChange = (mode: 'editor' | 'graph' | 'calendar') => {
    setViewMode(mode);
  };

  // Handle search
  const handleSearch = () => {
    setShowSearch(true);
  };

  // Handle settings
  const handleSettings = () => {
    setShowSettings(true);
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setIsLoading]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex h-screen">
          {/* Sidebar */}
          <ErrorBoundary>
            <Sidebar 
              isOpen={sidebarOpen}
              onToggle={handleToggleSidebar}
            />
          </ErrorBoundary>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <ErrorBoundary>
              <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center gap-4 px-4">
                  {/* Sidebar Toggle */}
                  <button
                    onClick={handleToggleSidebar}
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  {/* App Title */}
                  <h1 
                    className="text-lg font-semibold"
                    style={{ color: colors.text }}
                  >
                    ZettelView
                  </h1>

                  {/* PWA Status Indicator */}
                  <div className="ml-auto">
                    <PWAStatusIndicator compact={true} />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleViewModeChange('editor')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'editor' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                      style={viewMode === 'editor' ? {} : { color: colors.textSecondary }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleViewModeChange('graph')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'graph' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                      style={viewMode === 'graph' ? {} : { color: colors.textSecondary }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleViewModeChange('calendar')}
                      className={`p-2 rounded-md transition-colors ${
                        viewMode === 'calendar' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-accent hover:text-accent-foreground'
                      }`}
                      style={viewMode === 'calendar' ? {} : { color: colors.textSecondary }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={handleSettings}
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </header>
            </ErrorBoundary>

            {/* Loading Spinner */}
            {isLoading && (
              <ErrorBoundary>
                <LoadingSpinner 
                  size="large"
                  showText={true}
                  text="Loading..."
                />
              </ErrorBoundary>
            )}

            {/* Main Content Area */}
            {!isLoading && (
              <div className="flex-1 flex overflow-hidden">
                {/* Note List */}
                <div className="w-80 border-r flex flex-col" style={{ borderColor: colors.border }}>
                  <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                    <h2 
                      className="text-lg font-semibold mb-2"
                      style={{ color: colors.text }}
                    >
                      Notes ({notes.length})
                    </h2>
                  </div>
                  <div className="flex-1">
                    <VirtualizedNoteList
                      notes={notes}
                      selectedId={selectedId}
                      onSelectNote={handleSelectNote}
                      height={400}
                    />
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col">
                  {viewMode === 'editor' && (
                    <div className="flex-1">
                      {selectedNote ? (
                        <AsyncErrorBoundary>
                          <MarkdownEditor 
                            value={selectedNote.body}
                            onChange={handleNoteChange}
                            autoSave={true}
                          />
                        </AsyncErrorBoundary>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium mb-2">No note selected</h3>
                            <p className="text-sm">Select a note from the list to start editing</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {viewMode === 'graph' && (
                    <div className="flex-1">
                      <AsyncErrorBoundary>
                        <GraphView 
                          selectedNodeId={selectedId ? selectedId : undefined}
                          onNodeClick={handleSelectNote}
                        />
                      </AsyncErrorBoundary>
                    </div>
                  )}

                  {viewMode === 'calendar' && (
                    <div className="flex-1">
                      <AsyncErrorBoundary>
                        <CalendarView 
                          selectedNoteId={selectedId ? selectedId : undefined}
                          onNoteClick={handleSelectNote}
                        />
                      </AsyncErrorBoundary>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Modals */}
        <ErrorBoundary>
          <SearchView 
            isOpen={showSearch}
            onClose={() => setShowSearch(false)}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <SettingsView 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        </ErrorBoundary>

        {/* Notifications */}
        <ErrorBoundary>
          <NotificationPanel notifications={notifications} />
        </ErrorBoundary>

        {/* PWA Install Prompt */}
        <ErrorBoundary>
          <PWAInstallPrompt />
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default App;
