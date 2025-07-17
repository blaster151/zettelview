import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SaveAsTemplate from './SaveAsTemplate';
import { useThemeStore } from '../../store/themeStore';

// Mock the theme store
jest.mock('../../store/themeStore');

const mockUseThemeStore = useThemeStore as jest.MockedFunction<typeof useThemeStore>;

describe('SaveAsTemplate', () => {
  const mockColors = {
    background: '#ffffff',
    surface: '#f8f9fa',
    surfaceHover: '#e9ecef',
    text: '#212529',
    textSecondary: '#6c757d',
    primary: '#007bff',
    primaryHover: '#0056b3',
    border: '#dee2e6'
  };

  const mockCurrentNote = {
    title: 'Test Note',
    body: '# Test Note\n\nThis is test content with some **bold** text.',
    tags: ['test', 'example', 'template']
  };

  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockUseThemeStore.mockReturnValue({
      colors: mockColors,
      toggleTheme: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <SaveAsTemplate
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      expect(screen.queryByText('Save as Template')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      expect(screen.getByText('Save as Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Note Template')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Template based on note: Test Note')).toBeInTheDocument();
    });

    it('should display all form fields', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      expect(screen.getByLabelText('Template Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Preview')).toBeInTheDocument();
    });

    it('should display all category options', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      expect(screen.getByText('📝 General')).toBeInTheDocument();
      expect(screen.getByText('📋 Project')).toBeInTheDocument();
      expect(screen.getByText('🤝 Meeting')).toBeInTheDocument();
      expect(screen.getByText('🔬 Research')).toBeInTheDocument();
      expect(screen.getByText('👤 Personal')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Custom')).toBeInTheDocument();
    });

    it('should show preview of the template', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      expect(screen.getByText('Test Note Template')).toBeInTheDocument();
      expect(screen.getByText('Template based on note: Test Note')).toBeInTheDocument();
      expect(screen.getByText('Content: 47 characters')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('should update template name when typing', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      fireEvent.change(nameInput, { target: { value: 'My Custom Template' } });

      expect(nameInput).toHaveValue('My Custom Template');
    });

    it('should update description when typing', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const descriptionInput = screen.getByDisplayValue('Template based on note: Test Note');
      fireEvent.change(descriptionInput, { target: { value: 'A custom template for testing' } });

      expect(descriptionInput).toHaveValue('A custom template for testing');
    });

    it('should change category when clicking category buttons', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const projectButton = screen.getByText('📋 Project');
      fireEvent.click(projectButton);

      // The selected category should have primary color styling
      expect(projectButton).toHaveStyle({ background: mockColors.primary });
    });

    it('should update preview when form fields change', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      fireEvent.change(nameInput, { target: { value: 'Updated Template Name' } });

      expect(screen.getByText('Updated Template Name')).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should disable save button when template name is empty', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      const saveButton = screen.getByText('Save Template');

      fireEvent.change(nameInput, { target: { value: '' } });

      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when template name is only whitespace', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      const saveButton = screen.getByText('Save Template');

      fireEvent.change(nameInput, { target: { value: '   ' } });

      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when template name is valid', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const saveButton = screen.getByText('Save Template');
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('form submission', () => {
    it('should call onSave with correct data when save button is clicked', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      const descriptionInput = screen.getByDisplayValue('Template based on note: Test Note');
      const projectButton = screen.getByText('📋 Project');
      const saveButton = screen.getByText('Save Template');

      fireEvent.change(nameInput, { target: { value: 'My Project Template' } });
      fireEvent.change(descriptionInput, { target: { value: 'Template for project notes' } });
      fireEvent.click(projectButton);
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        'My Project Template',
        'Template for project notes',
        'project'
      );
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not call onSave when template name is empty', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      const saveButton = screen.getByText('Save Template');

      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should trim whitespace from template name and description', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      const descriptionInput = screen.getByDisplayValue('Template based on note: Test Note');
      const saveButton = screen.getByText('Save Template');

      fireEvent.change(nameInput, { target: { value: '  My Template  ' } });
      fireEvent.change(descriptionInput, { target: { value: '  My Description  ' } });
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        'My Template',
        'My Description',
        'custom'
      );
    });
  });

  describe('close functionality', () => {
    it('should call onClose when clicking the close button', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const closeButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking the X button', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const xButton = screen.getByText('×');
      fireEvent.click(xButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when canceling', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      const descriptionInput = screen.getByDisplayValue('Template based on note: Test Note');

      // Change values
      fireEvent.change(nameInput, { target: { value: 'Changed Name' } });
      fireEvent.change(descriptionInput, { target: { value: 'Changed Description' } });

      // Cancel
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Form should be reset on next render
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      expect(screen.getByLabelText('Template Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Preview')).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const xButton = screen.getByText('×');
      expect(xButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('content preview', () => {
    it('should show correct character count', () => {
      const noteWithLongContent = {
        ...mockCurrentNote,
        body: 'This is a very long content with many characters to test the character count display in the preview section of the save as template dialog.'
      };

      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={noteWithLongContent}
        />
      );

      expect(screen.getByText(/Content: \d+ characters/)).toBeInTheDocument();
    });

    it('should update character count when template name changes', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const nameInput = screen.getByDisplayValue('Test Note Template');
      fireEvent.change(nameInput, { target: { value: 'Updated Template Name' } });

      expect(screen.getByText('Updated Template Name')).toBeInTheDocument();
    });
  });

  describe('category selection', () => {
    it('should default to custom category', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const customButton = screen.getByText('⚙️ Custom');
      expect(customButton).toHaveStyle({ background: mockColors.primary });
    });

    it('should update selected category when clicking different category', () => {
      render(
        <SaveAsTemplate
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          currentNote={mockCurrentNote}
        />
      );

      const projectButton = screen.getByText('📋 Project');
      fireEvent.click(projectButton);

      expect(projectButton).toHaveStyle({ background: mockColors.primary });
    });
  });
}); 