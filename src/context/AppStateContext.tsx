import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// State types
export type ViewMode = 'editor' | 'graph';

interface AppState {
  viewMode: ViewMode;
  showAISummaryPanel: boolean;
  showExportImport: boolean;
  selectedNoteId: string | null;
}

// Action types
type AppAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SHOW_AI_SUMMARY_PANEL' }
  | { type: 'HIDE_AI_SUMMARY_PANEL' }
  | { type: 'SHOW_EXPORT_IMPORT' }
  | { type: 'HIDE_EXPORT_IMPORT' }
  | { type: 'SET_SELECTED_NOTE_ID'; payload: string | null }
  | { type: 'RESET_MODALS' };

// Initial state
const initialState: AppState = {
  viewMode: 'editor',
  showAISummaryPanel: false,
  showExportImport: false,
  selectedNoteId: null,
};

// Reducer function
function appStateReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      };
    
    case 'SHOW_AI_SUMMARY_PANEL':
      return {
        ...state,
        showAISummaryPanel: true,
        showExportImport: false, // Close other modals
      };
    
    case 'HIDE_AI_SUMMARY_PANEL':
      return {
        ...state,
        showAISummaryPanel: false,
      };
    
    case 'SHOW_EXPORT_IMPORT':
      return {
        ...state,
        showExportImport: true,
        showAISummaryPanel: false, // Close other modals
      };
    
    case 'HIDE_EXPORT_IMPORT':
      return {
        ...state,
        showExportImport: false,
      };
    
    case 'SET_SELECTED_NOTE_ID':
      return {
        ...state,
        selectedNoteId: action.payload,
      };
    
    case 'RESET_MODALS':
      return {
        ...state,
        showAISummaryPanel: false,
        showExportImport: false,
      };
    
    default:
      return state;
  }
}

// Context interface
interface AppStateContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setViewMode: (viewMode: ViewMode) => void;
  showAISummaryPanel: () => void;
  hideAISummaryPanel: () => void;
  showExportImport: () => void;
  hideExportImport: () => void;
  setSelectedNoteId: (noteId: string | null) => void;
  resetModals: () => void;
}

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Provider component
interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);

  // Convenience methods
  const setViewMode = (viewMode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: viewMode });
  };

  const showAISummaryPanel = () => {
    dispatch({ type: 'SHOW_AI_SUMMARY_PANEL' });
  };

  const hideAISummaryPanel = () => {
    dispatch({ type: 'HIDE_AI_SUMMARY_PANEL' });
  };

  const showExportImport = () => {
    dispatch({ type: 'SHOW_EXPORT_IMPORT' });
  };

  const hideExportImport = () => {
    dispatch({ type: 'HIDE_EXPORT_IMPORT' });
  };

  const setSelectedNoteId = (noteId: string | null) => {
    dispatch({ type: 'SET_SELECTED_NOTE_ID', payload: noteId });
  };

  const resetModals = () => {
    dispatch({ type: 'RESET_MODALS' });
  };

  const value: AppStateContextType = {
    state,
    dispatch,
    setViewMode,
    showAISummaryPanel,
    hideAISummaryPanel,
    showExportImport,
    hideExportImport,
    setSelectedNoteId,
    resetModals,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

// Custom hook to use the context
export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}; 