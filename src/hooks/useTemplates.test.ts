import { renderHook, act } from '@testing-library/react';
import { useTemplates } from './useTemplates';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useTemplates', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load default templates when no saved templates exist', () => {
      const { result } = renderHook(() => useTemplates());
      
      expect(result.current.templates).toHaveLength(6); // 6 default templates
      expect(result.current.templates.some(t => t.id === 'meeting-notes')).toBe(true);
      expect(result.current.templates.some(t => t.id === 'project-plan')).toBe(true);
      expect(result.current.templates.some(t => t.id === 'research-notes')).toBe(true);
    });

    it('should load saved templates from localStorage', () => {
      const savedTemplates = [
        {
          id: 'custom-template',
          name: 'Custom Template',
          description: 'A custom template',
          category: 'custom' as const,
          content: '# Custom Template\n\nContent here',
          tags: ['custom'],
          metadata: {
            created: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            usageCount: 0,
            isDefault: false
          }
        }
      ];
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedTemplates));
      
      const { result } = renderHook(() => useTemplates());
      
      expect(result.current.templates).toHaveLength(7); // 6 defaults + 1 custom
      expect(result.current.templates.some(t => t.id === 'custom-template')).toBe(true);
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useTemplates());
      
      expect(result.current.templates).toHaveLength(6); // Should fall back to defaults
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('template creation', () => {
    it('should create a new template with correct metadata', () => {
      const { result } = renderHook(() => useTemplates());
      
      const newTemplate = {
        name: 'Test Template',
        description: 'A test template',
        category: 'custom' as const,
        content: '# Test\n\nContent',
        tags: ['test']
      };
      
      act(() => {
        result.current.createTemplate(newTemplate);
      });
      
      expect(result.current.templates).toHaveLength(7);
      const createdTemplate = result.current.templates.find(t => t.name === 'Test Template');
      expect(createdTemplate).toBeDefined();
      expect(createdTemplate?.metadata.isDefault).toBe(false);
      expect(createdTemplate?.metadata.usageCount).toBe(0);
      expect(createdTemplate?.id).toMatch(/^template-\d+-\w+$/);
    });

    it('should save templates to localStorage', () => {
      const { result } = renderHook(() => useTemplates());
      
      const newTemplate = {
        name: 'Test Template',
        description: 'A test template',
        category: 'custom' as const,
        content: '# Test\n\nContent',
        tags: ['test']
      };
      
      act(() => {
        result.current.createTemplate(newTemplate);
      });
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zettelview_templates',
        expect.any(String)
      );
      
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(7);
      expect(savedData.some((t: any) => t.name === 'Test Template')).toBe(true);
    });
  });

  describe('template updates', () => {
    it('should update an existing template', () => {
      const { result } = renderHook(() => useTemplates());
      
      const templateId = result.current.templates[0].id;
      const updates = {
        name: 'Updated Template Name',
        description: 'Updated description'
      };
      
      act(() => {
        result.current.updateTemplate(templateId, updates);
      });
      
      const updatedTemplate = result.current.templates.find(t => t.id === templateId);
      expect(updatedTemplate?.name).toBe('Updated Template Name');
      expect(updatedTemplate?.description).toBe('Updated description');
    });

    it('should update template usage statistics', () => {
      const { result } = renderHook(() => useTemplates());
      
      const templateId = result.current.templates[0].id;
      const originalUsageCount = result.current.templates[0].metadata.usageCount;
      
      act(() => {
        result.current.updateTemplate(templateId, {
          metadata: {
            ...result.current.templates[0].metadata,
            usageCount: originalUsageCount + 1,
            lastUsed: new Date()
          }
        });
      });
      
      const updatedTemplate = result.current.templates.find(t => t.id === templateId);
      expect(updatedTemplate?.metadata.usageCount).toBe(originalUsageCount + 1);
    });
  });

  describe('template deletion', () => {
    it('should delete a custom template', () => {
      const { result } = renderHook(() => useTemplates());
      
      // Create a custom template first
      const newTemplate = {
        name: 'Test Template',
        description: 'A test template',
        category: 'custom' as const,
        content: '# Test\n\nContent',
        tags: ['test']
      };
      
      let templateId: string;
      act(() => {
        const created = result.current.createTemplate(newTemplate);
        templateId = created.id;
      });
      
      const initialCount = result.current.templates.length;
      
      act(() => {
        result.current.deleteTemplate(templateId);
      });
      
      expect(result.current.templates).toHaveLength(initialCount - 1);
      expect(result.current.templates.find(t => t.id === templateId)).toBeUndefined();
    });

    it('should not allow deletion of default templates', () => {
      const { result } = renderHook(() => useTemplates());
      
      const defaultTemplate = result.current.templates.find(t => t.metadata.isDefault);
      expect(defaultTemplate).toBeDefined();
      
      expect(() => {
        act(() => {
          result.current.deleteTemplate(defaultTemplate!.id);
        });
      }).toThrow('Cannot delete default templates');
    });
  });

  describe('note creation from template', () => {
    it('should create a note from template with correct content', () => {
      const { result } = renderHook(() => useTemplates());
      
      const template = result.current.templates.find(t => t.id === 'meeting-notes')!;
      
      act(() => {
        const newNote = result.current.createNoteFromTemplate({
          templateId: template.id,
          title: 'Test Meeting',
          customTags: ['test-meeting']
        });
        
        expect(newNote.title).toBe('Test Meeting');
        expect(newNote.body).toContain('# Meeting: Test Meeting');
        expect(newNote.body).toContain('{{date}}');
        expect(newNote.body).toContain('{{time}}');
        expect(newNote.tags).toContain('meeting');
        expect(newNote.tags).toContain('notes');
        expect(newNote.tags).toContain('template');
        expect(newNote.tags).toContain('test-meeting');
      });
    });

    it('should update template usage statistics when creating note', () => {
      const { result } = renderHook(() => useTemplates());
      
      const template = result.current.templates.find(t => t.id === 'meeting-notes')!;
      const originalUsageCount = template.metadata.usageCount;
      
      act(() => {
        result.current.createNoteFromTemplate({
          templateId: template.id,
          title: 'Test Meeting'
        });
      });
      
      const updatedTemplate = result.current.templates.find(t => t.id === template.id);
      expect(updatedTemplate?.metadata.usageCount).toBe(originalUsageCount + 1);
    });

    it('should throw error for non-existent template', () => {
      const { result } = renderHook(() => useTemplates());
      
      expect(() => {
        act(() => {
          result.current.createNoteFromTemplate({
            templateId: 'non-existent-template',
            title: 'Test'
          });
        });
      }).toThrow('Template with id non-existent-template not found');
    });

    it('should use custom content when provided', () => {
      const { result } = renderHook(() => useTemplates());
      
      const template = result.current.templates.find(t => t.id === 'blank-note')!;
      const customContent = '# Custom Content\n\nThis is custom content.';
      
      act(() => {
        const newNote = result.current.createNoteFromTemplate({
          templateId: template.id,
          title: 'Test Note',
          customContent
        });
        
        expect(newNote.body).toBe(customContent);
      });
    });
  });

  describe('saving note as template', () => {
    it('should create template from note data', () => {
      const { result } = renderHook(() => useTemplates());
      
      const noteData = {
        title: 'Test Note',
        body: '# Test Note\n\nThis is test content.',
        tags: ['test', 'example']
      };
      
      act(() => {
        const newTemplate = result.current.saveNoteAsTemplate(noteData);
        
        expect(newTemplate.name).toBe('Test Note Template');
        expect(newTemplate.description).toBe('Template based on note: Test Note');
        expect(newTemplate.category).toBe('custom');
        expect(newTemplate.content).toBe(noteData.body);
        expect(newTemplate.tags).toEqual(noteData.tags);
      });
      
      expect(result.current.templates).toHaveLength(7); // 6 defaults + 1 new
    });
  });

  describe('templates by category', () => {
    it('should group templates by category correctly', () => {
      const { result } = renderHook(() => useTemplates());
      
      expect(result.current.templatesByCategory.general).toHaveLength(1); // blank-note
      expect(result.current.templatesByCategory.meeting).toHaveLength(1); // meeting-notes
      expect(result.current.templatesByCategory.project).toHaveLength(1); // project-plan
      expect(result.current.templatesByCategory.research).toHaveLength(2); // research-notes, book-notes
      expect(result.current.templatesByCategory.personal).toHaveLength(1); // daily-journal
      expect(result.current.templatesByCategory.custom).toHaveLength(0); // empty initially
    });

    it('should update categories when templates are added', () => {
      const { result } = renderHook(() => useTemplates());
      
      act(() => {
        result.current.createTemplate({
          name: 'Custom Template',
          description: 'A custom template',
          category: 'custom',
          content: '# Custom\n\nContent',
          tags: ['custom']
        });
      });
      
      expect(result.current.templatesByCategory.custom).toHaveLength(1);
    });
  });
}); 