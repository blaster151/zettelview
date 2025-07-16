import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppStateProvider, useAppState } from './AppStateContext';

// Test component that uses the context
const TestComponent: React.FC = () => {
  const { 
    state, 
    setViewMode, 
    showAISummaryPanel, 
    hideAISummaryPanel,
    showExportImport,
    hideExportImport,
    setSelectedNoteId,
    resetModals
  } = useAppState();

  return (
    <div>
      <div data-testid="view-mode">{state.viewMode}</div>
      <div data-testid="ai-panel">{state.showAISummaryPanel.toString()}</div>
      <div data-testid="export-import">{state.showExportImport.toString()}</div>
      <div data-testid="selected-note">{state.selectedNoteId || 'null'}</div>
      
      <button onClick={() => setViewMode('graph')}>Switch to Graph</button>
      <button onClick={() => setViewMode('editor')}>Switch to Editor</button>
      <button onClick={showAISummaryPanel}>Show AI Panel</button>
      <button onClick={hideAISummaryPanel}>Hide AI Panel</button>
      <button onClick={showExportImport}>Show Export</button>
      <button onClick={hideExportImport}>Hide Export</button>
      <button onClick={() => setSelectedNoteId('note1')}>Select Note 1</button>
      <button onClick={() => setSelectedNoteId(null)}>Clear Selection</button>
      <button onClick={resetModals}>Reset Modals</button>
    </div>
  );
};

describe('AppStateContext', () => {
  test('provides initial state', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('view-mode')).toHaveTextContent('editor');
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('false');
    expect(screen.getByTestId('export-import')).toHaveTextContent('false');
    expect(screen.getByTestId('selected-note')).toHaveTextContent('null');
  });

  test('changes view mode', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('view-mode')).toHaveTextContent('editor');
    
    fireEvent.click(screen.getByText('Switch to Graph'));
    expect(screen.getByTestId('view-mode')).toHaveTextContent('graph');
    
    fireEvent.click(screen.getByText('Switch to Editor'));
    expect(screen.getByTestId('view-mode')).toHaveTextContent('editor');
  });

  test('shows and hides AI summary panel', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('ai-panel')).toHaveTextContent('false');
    
    fireEvent.click(screen.getByText('Show AI Panel'));
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('true');
    
    fireEvent.click(screen.getByText('Hide AI Panel'));
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('false');
  });

  test('shows and hides export import', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('export-import')).toHaveTextContent('false');
    
    fireEvent.click(screen.getByText('Show Export'));
    expect(screen.getByTestId('export-import')).toHaveTextContent('true');
    
    fireEvent.click(screen.getByText('Hide Export'));
    expect(screen.getByTestId('export-import')).toHaveTextContent('false');
  });

  test('sets selected note ID', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    expect(screen.getByTestId('selected-note')).toHaveTextContent('null');
    
    fireEvent.click(screen.getByText('Select Note 1'));
    expect(screen.getByTestId('selected-note')).toHaveTextContent('note1');
    
    fireEvent.click(screen.getByText('Clear Selection'));
    expect(screen.getByTestId('selected-note')).toHaveTextContent('null');
  });

  test('resets all modals', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    // Show both modals
    fireEvent.click(screen.getByText('Show AI Panel'));
    fireEvent.click(screen.getByText('Show Export'));
    
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('true');
    expect(screen.getByTestId('export-import')).toHaveTextContent('true');
    
    // Reset modals
    fireEvent.click(screen.getByText('Reset Modals'));
    
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('false');
    expect(screen.getByTestId('export-import')).toHaveTextContent('false');
  });

  test('closes other modals when opening a new one', () => {
    render(
      <AppStateProvider>
        <TestComponent />
      </AppStateProvider>
    );

    // Show AI panel first
    fireEvent.click(screen.getByText('Show AI Panel'));
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('true');
    
    // Show export import (should close AI panel)
    fireEvent.click(screen.getByText('Show Export'));
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('false');
    expect(screen.getByTestId('export-import')).toHaveTextContent('true');
    
    // Show AI panel again (should close export)
    fireEvent.click(screen.getByText('Show AI Panel'));
    expect(screen.getByTestId('ai-panel')).toHaveTextContent('true');
    expect(screen.getByTestId('export-import')).toHaveTextContent('false');
  });

  test('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppState must be used within an AppStateProvider');
    
    console.error = originalError;
  });
}); 