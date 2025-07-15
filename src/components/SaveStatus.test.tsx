import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SaveStatus from './SaveStatus';

describe('SaveStatus', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders saving state correctly', () => {
    render(<SaveStatus isSaving={true} lastSaved={null} error={null} />);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByText('Saving...').closest('.save-status')).toHaveClass('saving');
  });

  test('renders saved state correctly', () => {
    const lastSaved = new Date();
    render(<SaveStatus isSaving={false} lastSaved={lastSaved} error={null} />);
    
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByText(/Saved/).closest('.save-status')).toHaveClass('saved');
  });

  test('renders error state correctly', () => {
    console.log('🚀 Starting error state test');
    const errorMessage = 'Save failed';
    
    console.log('📝 Rendering SaveStatus component');
    render(
      <SaveStatus 
        isSaving={false} 
        lastSaved={null} 
        error={errorMessage}
        onRetry={mockOnRetry}
      />
    );
    
    console.log('🔍 Checking for error text elements');
    expect(screen.getAllByText('Save failed')).toHaveLength(2); // One in span, one in div
    
    console.log('🔍 Checking for warning icon');
    expect(screen.getByText('⚠️')).toBeInTheDocument();
    
    console.log('🔍 Checking for retry button');
    expect(screen.getByText('Retry')).toBeInTheDocument();
    
    console.log('🔍 Checking for error class');
    expect(screen.getByText('Save failed').closest('.save-status')).toHaveClass('error');
    
    console.log('✅ Error state test completed');
  });

  test('renders unsaved state correctly', () => {
    render(<SaveStatus isSaving={false} lastSaved={null} error={null} />);
    
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    expect(screen.getByText('●')).toBeInTheDocument();
    expect(screen.getByText('Unsaved changes').closest('.save-status')).toHaveClass('unsaved');
  });

  test('calls onRetry when retry button is clicked', () => {
    render(
      <SaveStatus 
        isSaving={false} 
        lastSaved={null} 
        error="Save failed"
        onRetry={mockOnRetry}
      />
    );
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  test('does not show retry button when onRetry is not provided', () => {
    render(
      <SaveStatus 
        isSaving={false} 
        lastSaved={null} 
        error="Save failed"
      />
    );
    
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  test('formats time correctly for recent saves', () => {
    const now = new Date();
    render(<SaveStatus isSaving={false} lastSaved={now} error={null} />);
    
    expect(screen.getByText('Saved Just now')).toBeInTheDocument();
  });

  test('formats time correctly for older saves', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    render(<SaveStatus isSaving={false} lastSaved={oneHourAgo} error={null} />);
    
    expect(screen.getByText('Saved 1 hour ago')).toBeInTheDocument();
  });

  test('formats time correctly for very old saves', () => {
    const oldDate = new Date('2023-01-01');
    render(<SaveStatus isSaving={false} lastSaved={oldDate} error={null} />);
    
    expect(screen.getByText(/Saved \d+\/\d+\/\d+/)).toBeInTheDocument();
  });

  test('prioritizes saving state over other states', () => {
    const lastSaved = new Date();
    const errorMessage = 'Save failed';
    
    render(
      <SaveStatus 
        isSaving={true} 
        lastSaved={lastSaved} 
        error={errorMessage}
        onRetry={mockOnRetry}
      />
    );
    
    // Should show saving state even though other states are provided
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });

  test('prioritizes error state over saved state', () => {
    const lastSaved = new Date();
    const errorMessage = 'Save failed';
    
    render(
      <SaveStatus 
        isSaving={false} 
        lastSaved={lastSaved} 
        error={errorMessage}
        onRetry={mockOnRetry}
      />
    );
    
    // Should show error state even though saved state is provided
    expect(screen.getAllByText('Save failed')).toHaveLength(2); // One in span, one in div
    expect(screen.queryByText(/Saved/)).not.toBeInTheDocument();
  });

  test('shows spinner animation during saving', () => {
    render(<SaveStatus isSaving={true} lastSaved={null} error={null} />);
    
    const spinner = screen.getByText('Saving...').closest('.save-status')?.querySelector('.spinner');
    expect(spinner).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(
      <SaveStatus 
        isSaving={false} 
        lastSaved={null} 
        error="Save failed"
        onRetry={mockOnRetry}
      />
    );
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton.tagName).toBe('BUTTON');
  });
}); 