import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

// State types
export type ViewMode = 'editor' | 'graph' | 'calendar';

interface UIStore {
  // State
  viewMode: ViewMode;
  showAISummaryPanel: boolean;
  showExportImport: boolean;
  showOnboarding: boolean;
  showHelp: boolean;
  showStats: boolean;
  showTemplateSelector: boolean;
  showSaveAsTemplate: boolean;
  showCollaborationPanel: boolean;
  showPluginManager: boolean;
  showPluginStore: boolean;
  selectedNoteId: string | null;
  
  // Actions
  setViewMode: (viewMode: ViewMode) => void;
  toggleViewMode: () => void;
  openAISummaryPanel: () => void;
  closeAISummaryPanel: () => void;
  openExportImport: () => void;
  closeExportImport: () => void;
  openOnboarding: () => void;
  closeOnboarding: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  openStats: () => void;
  closeStats: () => void;
  openTemplateSelector: () => void;
  closeTemplateSelector: () => void;
  openSaveAsTemplate: () => void;
  closeSaveAsTemplate: () => void;
  openCollaborationPanel: () => void;
  closeCollaborationPanel: () => void;
  openPluginManager: () => void;
  closePluginManager: () => void;
  openPluginStore: () => void;
  closePluginStore: () => void;
  setSelectedNoteId: (noteId: string | null) => void;
  resetModals: () => void;
  closeAllModals: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        viewMode: 'editor',
        showAISummaryPanel: false,
        showExportImport: false,
        showOnboarding: false,
        showHelp: false,
        showStats: false,
        showTemplateSelector: false,
        showSaveAsTemplate: false,
        showCollaborationPanel: false,
        showPluginManager: false,
        showPluginStore: false,
        selectedNoteId: null,
        
        // View mode actions
        setViewMode: (viewMode: ViewMode) => set({ viewMode }),
        
        toggleViewMode: () => set((state) => {
          const modes: ViewMode[] = ['editor', 'graph', 'calendar'];
          const currentIndex = modes.indexOf(state.viewMode);
          const nextIndex = (currentIndex + 1) % modes.length;
          return { viewMode: modes[nextIndex] };
        }),
        
        // Modal actions
        openAISummaryPanel: () => set({
          showAISummaryPanel: true,
          showExportImport: false, // Close other modals
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
        
        closeAISummaryPanel: () => set({ showAISummaryPanel: false }),
        
        openExportImport: () => set({
          showExportImport: true,
          showAISummaryPanel: false, // Close other modals
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
        
        closeExportImport: () => set({ showExportImport: false }),
        
        openOnboarding: () => set({ showOnboarding: true }),
        closeOnboarding: () => set({ showOnboarding: false }),
        
        openHelp: () => set({ showHelp: true }),
        closeHelp: () => set({ showHelp: false }),
        
        openStats: () => set({ showStats: true }),
        closeStats: () => set({ showStats: false }),
        
        openTemplateSelector: () => set({
          showTemplateSelector: true,
          showAISummaryPanel: false, // Close other modals
          showExportImport: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
        
        closeTemplateSelector: () => set({ showTemplateSelector: false }),
        
        openSaveAsTemplate: () => set({
          showSaveAsTemplate: true,
          showAISummaryPanel: false, // Close other modals
          showExportImport: false,
          showTemplateSelector: false,
          showCollaborationPanel: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
        
        closeSaveAsTemplate: () => set({ showSaveAsTemplate: false }),
        
        openCollaborationPanel: () => set({
          showCollaborationPanel: true,
          showAISummaryPanel: false, // Close other modals
          showExportImport: false,
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
        
        closeCollaborationPanel: () => set({ showCollaborationPanel: false }),
        
        openPluginManager: () => set({
          showPluginManager: true,
          showAISummaryPanel: false, // Close other modals
          showExportImport: false,
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginStore: false,
        }),
        
        closePluginManager: () => set({ showPluginManager: false }),
        
        openPluginStore: () => set({
          showPluginStore: true,
          showAISummaryPanel: false, // Close other modals
          showExportImport: false,
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginManager: false,
        }),
        
        closePluginStore: () => set({ showPluginStore: false }),
        
        // Utility actions
        setSelectedNoteId: (noteId: string | null) => set({ selectedNoteId: noteId }),
        
        resetModals: () => set({
          showAISummaryPanel: false,
          showExportImport: false,
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
        
        closeAllModals: () => set({
          showAISummaryPanel: false,
          showExportImport: false,
          showOnboarding: false,
          showHelp: false,
          showStats: false,
          showTemplateSelector: false,
          showSaveAsTemplate: false,
          showCollaborationPanel: false,
          showPluginManager: false,
          showPluginStore: false,
        }),
      }),
      {
        name: 'zettelview-ui',
        partialize: (state) => ({ 
          viewMode: state.viewMode,
          selectedNoteId: state.selectedNoteId
        })
      }
    )
  )
); 