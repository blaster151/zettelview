import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useThemeStore } from './stores/themeStore';
import { useNoteStore } from './stores/noteStore';
import { useUIStore } from './stores/uiStore';
import { useNotificationStore } from './stores/notificationStore';

// Import components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NoteEditor from './components/NoteEditor';
import NoteList from './components/NoteList';
import GraphView from './components/features/GraphView';
import CalendarView from './components/features/CalendarView';
import SearchView from './components/features/SearchView';
import SettingsView from './components/features/SettingsView';
import NotificationPanel from './components/NotificationPanel';
import LoadingSpinner from './components/LoadingSpinner';

// Import demo components
import AdvancedSearchAlgorithmsDemo from './components/AdvancedSearchAlgorithmsDemo';
import AdvancedExportImportDemo from './components/AdvancedExportImportDemo';
import SearchHistoryDemo from './components/SearchHistoryDemo';
import AdvancedFiltersDemo from './components/AdvancedFiltersDemo';
import SearchAnalyticsDemo from './components/SearchAnalyticsDemo';
import KeyboardNavigationDemo from './components/KeyboardNavigationDemo';
import QueryTemplatesDemo from './components/QueryTemplatesDemo';
import SearchSuggestionsDemo from './components/SearchSuggestionsDemo';
import AdvancedAnalyticsDemo from './components/AdvancedAnalyticsDemo';
import PluginDemo from './components/PluginDemo';
import MobileOptimizationDemo from './components/MobileOptimizationDemo';
import RealTimeCollaborationDemo from './components/RealTimeCollaborationDemo';
import AdvancedGraphDemo from './components/AdvancedGraphDemo';
import NoteTemplatesDemo from './components/NoteTemplatesDemo';
import OfflineSupportDemo from './components/OfflineSupportDemo';
import AdvancedSecurityDemo from './components/AdvancedSecurityDemo';
import AdvancedBackupDemo from './components/AdvancedBackupDemo';
import PerformanceOptimizationDemo from './components/PerformanceOptimizationDemo';
import AccessibilityDemo from './components/AccessibilityDemo';
import AdvancedDataVisualizationDemo from './components/AdvancedDataVisualizationDemo';
import AdvancedNotificationDemo from './components/AdvancedNotificationDemo';

// Import services
import { PerformanceOptimizationService } from './services/performanceOptimizationService';
import { AccessibilityService } from './services/accessibilityService';

// Theme flash prevention styles
import './styles/themeFlashPrevention.css';

const App: React.FC = () => {
  // Initialize stores early to prevent theme flashes
  const themeStore = useThemeStore();
  const noteStore = useNoteStore();
  const uiStore = useUIStore();
  const notificationStore = useNotificationStore();

  // Initialize theme immediately
  useEffect(() => {
    // Initialize theme store
    themeStore.initializeTheme();
    
    // Initialize other services
    PerformanceOptimizationService.startPerformanceMonitoring();
    AccessibilityService.initialize();
    
    // Set up global error handling
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      notificationStore.addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Application Error',
        message: 'An unexpected error occurred. Please refresh the page.',
        duration: 5000
      });
    });
    
    // Set up unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      notificationStore.addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Network Error',
        message: 'A network request failed. Please check your connection.',
        duration: 5000
      });
    });
  }, [themeStore, notificationStore]);

  // Get theme state
  const { theme, isDark, colors } = themeStore;
  const { selectedNoteId, viewMode } = uiStore;
  const { notes } = noteStore;
  const { notifications } = notificationStore;

  // Apply theme classes to body
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }, [theme, colors]);

  // Show loading spinner while theme is initializing
  if (!theme) {
    return <LoadingSpinner />;
  }

  return (
    <div 
      className={`app theme-${theme}`}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        minHeight: '100vh'
      }}
    >
      <Router>
        <div className="app-container">
          <Header />
          <div className="main-content">
            <Sidebar />
            <main className="content-area">
              <Routes>
                {/* Main Routes */}
                <Route path="/" element={
                  <div className="content-wrapper">
                    <NoteList />
                    {selectedNoteId && <NoteEditor />}
                  </div>
                } />
                
                <Route path="/notes" element={
                  <div className="content-wrapper">
                    <NoteList />
                    {selectedNoteId && <NoteEditor />}
                  </div>
                } />
                
                <Route path="/graph" element={<GraphView />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/search" element={<SearchView />} />
                <Route path="/settings" element={<SettingsView />} />
                
                {/* Demo Routes */}
                <Route path="/demos/search-algorithms" element={<AdvancedSearchAlgorithmsDemo />} />
                <Route path="/demos/export-import" element={<AdvancedExportImportDemo />} />
                <Route path="/demos/search-history" element={<SearchHistoryDemo />} />
                <Route path="/demos/advanced-filters" element={<AdvancedFiltersDemo />} />
                <Route path="/demos/search-analytics" element={<SearchAnalyticsDemo />} />
                <Route path="/demos/keyboard-navigation" element={<KeyboardNavigationDemo />} />
                <Route path="/demos/query-templates" element={<QueryTemplatesDemo />} />
                <Route path="/demos/search-suggestions" element={<SearchSuggestionsDemo />} />
                <Route path="/demos/advanced-analytics" element={<AdvancedAnalyticsDemo />} />
                <Route path="/demos/plugin-system" element={<PluginDemo />} />
                <Route path="/demos/mobile-optimization" element={<MobileOptimizationDemo />} />
                <Route path="/demos/real-time-collaboration" element={<RealTimeCollaborationDemo />} />
                <Route path="/demos/advanced-graph" element={<AdvancedGraphDemo />} />
                <Route path="/demos/note-templates" element={<NoteTemplatesDemo />} />
                <Route path="/demos/offline-support" element={<OfflineSupportDemo />} />
                <Route path="/demos/advanced-security" element={<AdvancedSecurityDemo />} />
                <Route path="/demos/advanced-backup" element={<AdvancedBackupDemo />} />
                <Route path="/demos/performance-optimization" element={<PerformanceOptimizationDemo />} />
                <Route path="/demos/accessibility" element={<AccessibilityDemo />} />
                <Route path="/demos/data-visualization" element={<AdvancedDataVisualizationDemo />} />
                <Route path="/demos/advanced-notifications" element={<AdvancedNotificationDemo />} />
                
                {/* Fallback Route */}
                <Route path="*" element={
                  <div className="content-wrapper">
                    <div className="not-found">
                      <h1>Page Not Found</h1>
                      <p>The page you're looking for doesn't exist.</p>
                    </div>
                  </div>
                } />
              </Routes>
            </main>
          </div>
        </div>
        
        {/* Notification Panel */}
        <NotificationPanel notifications={notifications} />
      </Router>
    </div>
  );
};

export default App;
