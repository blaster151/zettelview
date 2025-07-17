import { useState, useCallback, useMemo } from 'react';
import { NoteTemplate, CreateNoteFromTemplateOptions } from '../types/templates';
import { defaultTemplates } from '../data/defaultTemplates';

const TEMPLATES_STORAGE_KEY = 'zettelview_templates';

export function useTemplates() {
  const [templates, setTemplates] = useState<NoteTemplate[]>(() => {
    // Load templates from localStorage or use defaults
    const savedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        return parsed.map((template: any) => ({
          ...template,
          metadata: {
            ...template.metadata,
            created: new Date(template.metadata.created),
            lastUsed: new Date(template.metadata.lastUsed)
          }
        }));
      } catch (error) {
        console.error('Failed to parse saved templates:', error);
        return defaultTemplates;
      }
    }
    return defaultTemplates;
  });

  // Save templates to localStorage whenever they change
  const saveTemplates = useCallback((newTemplates: NoteTemplate[]) => {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(newTemplates));
    setTemplates(newTemplates);
  }, []);

  // Get templates by category
  const templatesByCategory = useMemo(() => {
    const categories = {
      general: templates.filter(t => t.category === 'general'),
      project: templates.filter(t => t.category === 'project'),
      meeting: templates.filter(t => t.category === 'meeting'),
      research: templates.filter(t => t.category === 'research'),
      personal: templates.filter(t => t.category === 'personal'),
      custom: templates.filter(t => t.category === 'custom')
    };
    return categories;
  }, [templates]);

  // Create a new template
  const createTemplate = useCallback((template: Omit<NoteTemplate, 'id' | 'metadata'>) => {
    const newTemplate: NoteTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        created: new Date(),
        lastUsed: new Date(),
        usageCount: 0,
        isDefault: false
      }
    };
    
    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    return newTemplate;
  }, [templates, saveTemplates]);

  // Update an existing template
  const updateTemplate = useCallback((id: string, updates: Partial<NoteTemplate>) => {
    const updatedTemplates = templates.map(template => 
      template.id === id ? { ...template, ...updates } : template
    );
    saveTemplates(updatedTemplates);
  }, [templates, saveTemplates]);

  // Delete a template
  const deleteTemplate = useCallback((id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.metadata.isDefault) {
      throw new Error('Cannot delete default templates');
    }
    
    const updatedTemplates = templates.filter(template => template.id !== id);
    saveTemplates(updatedTemplates);
  }, [templates, saveTemplates]);

  // Create a note from a template
  const createNoteFromTemplate = useCallback((options: CreateNoteFromTemplateOptions) => {
    const template = templates.find(t => t.id === options.templateId);
    if (!template) {
      throw new Error(`Template with id ${options.templateId} not found`);
    }

    // Update template usage statistics
    updateTemplate(template.id, {
      metadata: {
        ...template.metadata,
        lastUsed: new Date(),
        usageCount: template.metadata.usageCount + 1
      }
    });

    // Process template content with placeholders
    let processedContent = template.content;
    
    // Replace basic placeholders
    processedContent = processedContent.replace(/\{\{title\}\}/g, options.title);
    processedContent = processedContent.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    processedContent = processedContent.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
    
    // Replace custom content if provided
    if (options.customContent) {
      processedContent = options.customContent;
    }

    // Combine template tags with custom tags
    const finalTags = [...template.tags];
    if (options.customTags) {
      finalTags.push(...options.customTags.filter(tag => !finalTags.includes(tag)));
    }

    return {
      title: options.title,
      body: processedContent,
      tags: finalTags
    };
  }, [templates, updateTemplate]);

  // Save current note as a template
  const saveNoteAsTemplate = useCallback((note: { title: string; body: string; tags: string[] }) => {
    const template: Omit<NoteTemplate, 'id' | 'metadata'> = {
      name: `${note.title} Template`,
      description: `Template based on note: ${note.title}`,
      category: 'custom',
      content: note.body,
      tags: note.tags
    };
    
    return createTemplate(template);
  }, [createTemplate]);

  return {
    templates,
    templatesByCategory,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createNoteFromTemplate,
    saveNoteAsTemplate
  };
} 