import { create } fromzustand';
import[object Object] devtools } from 'zustand/middleware;

// State types
export type ViewMode =editor' | 'graph';

interface UIState {
  // View mode
  viewMode: ViewMode;
  
  // Modal states
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
  
  // Selected note ID (synced with noteStore)
  selectedNoteId: string | null;
}

interface UIActions {
  // View mode actions
  setViewMode: (viewMode: ViewMode) => void;
  toggleViewMode: () => void;
  
  // Modal actions
  showAISummaryPanel: () => void;
  hideAISummaryPanel: () => void;
  showExportImport: () => void;
  hideExportImport: () => void;
  showOnboarding: () => void;
  hideOnboarding: () => void;
  showHelp: () => void;
  hideHelp: () => void;
  showStats: () => void;
  hideStats: () => void;
  showTemplateSelector: () => void;
  hideTemplateSelector: () => void;
  showSaveAsTemplate: () => void;
  hideSaveAsTemplate: () => void;
  showCollaborationPanel: () => void;
  hideCollaborationPanel: () => void;
  showPluginManager: () => void;
  hidePluginManager: () => void;
  showPluginStore: () => void;
  hidePluginStore: () => void;
  
  // Utility actions
  setSelectedNoteId: (noteId: string | null) => void;
  resetModals: () => void;
  closeAllModals: () => void;
}

type UIStore = UIState & UIActions;

// Initial state
const initialState: UIState = {
  viewMode:editor,showAISummaryPanel: false,
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
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ([object Object]   ...initialState,
      
      // View mode actions
      setViewMode: (viewMode: ViewMode) => set({ viewMode }),
      
      toggleViewMode: () => set((state) => ({ 
        viewMode: state.viewMode === editor' ? graph' : editor' 
      })),
      
      // Modal actions
      showAISummaryPanel: () => set((state) => ({
        showAISummaryPanel: true,
        showExportImport: false, // Close other modals
        showTemplateSelector: false,
        showSaveAsTemplate: false,
        showCollaborationPanel: false,
        showPluginManager: false,
        showPluginStore: false,
      })),
      
      hideAISummaryPanel: () => set({ showAISummaryPanel: false }),
      
      showExportImport: () => set((state) => ({
        showExportImport: true,
        showAISummaryPanel: false, // Close other modals
        showTemplateSelector: false,
        showSaveAsTemplate: false,
        showCollaborationPanel: false,
        showPluginManager: false,
        showPluginStore: false,
      })),
      
      hideExportImport: () => set([object Object] showExportImport: false }),
      
      showOnboarding: () => set({ showOnboarding: true }),
      hideOnboarding: () => set({ showOnboarding: false }),
      
      showHelp: () => set({ showHelp: true }),
      hideHelp: () => set({ showHelp: false }),
      
      showStats: () => set({ showStats: true }),
      hideStats: () => set({ showStats: false }),
      
      showTemplateSelector: () => set((state) => ({
        showTemplateSelector: true,
        showAISummaryPanel: false, // Close other modals
        showExportImport: false,
        showSaveAsTemplate: false,
        showCollaborationPanel: false,
        showPluginManager: false,
        showPluginStore: false,
      })),
      
      hideTemplateSelector: () => set({ showTemplateSelector: false }),
      
      showSaveAsTemplate: () => set((state) => ([object Object]        showSaveAsTemplate: true,
        showAISummaryPanel: false, // Close other modals
        showExportImport: false,
        showTemplateSelector: false,
        showCollaborationPanel: false,
        showPluginManager: false,
        showPluginStore: false,
      })),
      
      hideSaveAsTemplate: () => set({ showSaveAsTemplate: false }),
      
      showCollaborationPanel: () => set((state) => ({
        showCollaborationPanel: true,
        showAISummaryPanel: false, // Close other modals
        showExportImport: false,
        showTemplateSelector: false,
        showSaveAsTemplate: false,
        showPluginManager: false,
        showPluginStore: false,
      })),
      
      hideCollaborationPanel: () => set({ showCollaborationPanel: false }),
      
      showPluginManager: () => set((state) => ({
        showPluginManager: true,
        showAISummaryPanel: false, // Close other modals
        showExportImport: false,
        showTemplateSelector: false,
        showSaveAsTemplate: false,
        showCollaborationPanel: false,
        showPluginStore: false,
      })),
      
      hidePluginManager: () => set({ showPluginManager: false }),
      
      showPluginStore: () => set((state) => ({
        showPluginStore: true,
        showAISummaryPanel: false, // Close other modals
        showExportImport: false,
        showTemplateSelector: false,
        showSaveAsTemplate: false,
        showCollaborationPanel: false,
        showPluginManager: false,
      })),
      
      hidePluginStore: () => set({ showPluginStore: false }),
      
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
   [object Object]   name: ui-store',
    }
  )
); 