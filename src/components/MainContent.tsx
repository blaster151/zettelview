import React from 'react';
import { 
  AISummaryPanel, 
  ExportImport, 
  EditorView, 
  GraphView, 
  ErrorBoundary 
} from './index';

interface MainContentProps {
  viewMode: 'editor' | 'graph';
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
      ) : (
        <ErrorBoundary>
          <GraphView 
            selectedNodeId={selectedNoteId || undefined}
            onNodeClick={onNodeClick}
          />
        </ErrorBoundary>
      )}
    </ErrorBoundary>
  );
};

export default MainContent; 