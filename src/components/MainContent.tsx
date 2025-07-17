import React from 'react';
import { 
  AISummaryPanel, 
  ExportImport, 
  EditorView, 
  GraphView, 
  ErrorBoundary 
} from './index';
import CalendarView from './CalendarView';

interface MainContentProps {
  viewMode: 'editor' | 'graph' | 'calendar';
  selectedNoteId: string | null;
  showAISummaryPanel: boolean;
  showExportImport: boolean;
  onAISummaryClose: () => void;
  onExportImportClose: () => void;
  onNodeClick: (nodeId: string) => void;
}

const MainContent: React.FC<MainContentProps> = ({
  viewMode,
  selectedNoteId,
  showAISummaryPanel,
  showExportImport,
  onAISummaryClose,
  onExportImportClose,
  onNodeClick
}) => {
  return (
    <ErrorBoundary>
      {showAISummaryPanel ? (
        <AISummaryPanel 
          noteId={selectedNoteId!} 
          onClose={onAISummaryClose}
        />
      ) : showExportImport ? (
        <ExportImport 
          onClose={onExportImportClose}
        />
      ) : viewMode === 'editor' ? (
        selectedNoteId ? (
          <EditorView noteId={selectedNoteId} />
        ) : (
          <div style={{ padding: 24, textAlign: 'center' }}>
            Select a note to start editing
          </div>
        )
      ) : viewMode === 'graph' ? (
        <ErrorBoundary>
          <GraphView 
            selectedNodeId={selectedNoteId || undefined}
            onNodeClick={onNodeClick}
          />
        </ErrorBoundary>
      ) : viewMode === 'calendar' ? (
        <ErrorBoundary>
          <CalendarView 
            selectedNoteId={selectedNoteId || undefined}
            onNoteClick={onNodeClick}
          />
        </ErrorBoundary>
      ) : null}
    </ErrorBoundary>
  );
};

export default MainContent; 