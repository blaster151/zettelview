import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { useUIStore } from '../../store/uiStore';
import { loggingService } from '../../services/loggingService';

interface TemplateVariable {
  name: string;
  type: 'text' | 'date' | 'select' | 'number';
  label: string;
  defaultValue?: string;
  options?: string[];
  required: boolean;
}

interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: TemplateVariable[];
  tags: string[];
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

interface NoteTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate) => void;
}

const NoteTemplates: React.FC<NoteTemplatesProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const { colors } = useThemeStore();
  const { showTemplatePanel } = useUIStore();
  
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<NoteTemplate>>({
    name: '',
    description: '',
    category: 'general',
    content: '',
    variables: [],
    tags: []
  });

  // Initialize default templates
  useMemo(() => {
    const defaultTemplates: NoteTemplate[] = [
      {
        id: '1',
        name: 'Meeting Notes',
        description: 'Template for meeting notes with action items',
        category: 'work',
        content: `# Meeting Notes: {{meeting_title}}

## Date: {{meeting_date}}
## Attendees: {{attendees}}

## Agenda
- {{agenda_item_1}}
- {{agenda_item_2}}
- {{agenda_item_3}}

## Discussion
{{discussion_notes}}

## Action Items
- [ ] {{action_item_1}} - {{assignee_1}}
- [ ] {{action_item_2}} - {{assignee_2}}

## Next Steps
{{next_steps}}

---
Tags: {{tags}}`,
        variables: [
          { name: 'meeting_title', type: 'text', label: 'Meeting Title', required: true },
          { name: 'meeting_date', type: 'date', label: 'Meeting Date', required: true },
          { name: 'attendees', type: 'text', label: 'Attendees', required: false },
          { name: 'agenda_item_1', type: 'text', label: 'Agenda Item 1', required: false },
          { name: 'agenda_item_2', type: 'text', label: 'Agenda Item 2', required: false },
          { name: 'agenda_item_3', type: 'text', label: 'Agenda Item 3', required: false },
          { name: 'discussion_notes', type: 'text', label: 'Discussion Notes', required: false },
          { name: 'action_item_1', type: 'text', label: 'Action Item 1', required: false },
          { name: 'assignee_1', type: 'text', label: 'Assignee 1', required: false },
          { name: 'action_item_2', type: 'text', label: 'Action Item 2', required: false },
          { name: 'assignee_2', type: 'text', label: 'Assignee 2', required: false },
          { name: 'next_steps', type: 'text', label: 'Next Steps', required: false },
          { name: 'tags', type: 'text', label: 'Tags', required: false }
        ],
        tags: ['meeting', 'work', 'notes'],
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 0
      },
      {
        id: '2',
        name: 'Daily Journal',
        description: 'Template for daily journal entries',
        category: 'personal',
        content: `# Daily Journal - {{date}}

## Weather: {{weather}}
## Mood: {{mood}}

## What I accomplished today:
{{accomplishments}}

## Challenges I faced:
{{challenges}}

## What I learned:
{{learnings}}

## Gratitude:
{{gratitude}}

## Tomorrow's goals:
{{tomorrow_goals}}

---
Tags: {{tags}}`,
        variables: [
          { name: 'date', type: 'date', label: 'Date', required: true },
          { name: 'weather', type: 'text', label: 'Weather', required: false },
          { name: 'mood', type: 'select', label: 'Mood', options: ['Great', 'Good', 'Okay', 'Bad', 'Terrible'], required: false },
          { name: 'accomplishments', type: 'text', label: 'Accomplishments', required: false },
          { name: 'challenges', type: 'text', label: 'Challenges', required: false },
          { name: 'learnings', type: 'text', label: 'What I learned', required: false },
          { name: 'gratitude', type: 'text', label: 'Gratitude', required: false },
          { name: 'tomorrow_goals', type: 'text', label: 'Tomorrow\'s goals', required: false },
          { name: 'tags', type: 'text', label: 'Tags', required: false }
        ],
        tags: ['journal', 'daily', 'personal'],
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 0
      },
      {
        id: '3',
        name: 'Project Plan',
        description: 'Template for project planning and documentation',
        category: 'work',
        content: `# Project: {{project_name}}

## Project Overview
{{project_description}}

## Goals
{{project_goals}}

## Timeline
- Start Date: {{start_date}}
- End Date: {{end_date}}
- Milestones: {{milestones}}

## Team
- Project Manager: {{project_manager}}
- Team Members: {{team_members}}

## Resources
{{resources}}

## Risks & Mitigation
{{risks}}

## Success Criteria
{{success_criteria}}

---
Tags: {{tags}}`,
        variables: [
          { name: 'project_name', type: 'text', label: 'Project Name', required: true },
          { name: 'project_description', type: 'text', label: 'Project Description', required: true },
          { name: 'project_goals', type: 'text', label: 'Project Goals', required: false },
          { name: 'start_date', type: 'date', label: 'Start Date', required: false },
          { name: 'end_date', type: 'date', label: 'End Date', required: false },
          { name: 'milestones', type: 'text', label: 'Key Milestones', required: false },
          { name: 'project_manager', type: 'text', label: 'Project Manager', required: false },
          { name: 'team_members', type: 'text', label: 'Team Members', required: false },
          { name: 'resources', type: 'text', label: 'Resources', required: false },
          { name: 'risks', type: 'text', label: 'Risks & Mitigation', required: false },
          { name: 'success_criteria', type: 'text', label: 'Success Criteria', required: false },
          { name: 'tags', type: 'text', label: 'Tags', required: false }
        ],
        tags: ['project', 'planning', 'work'],
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 0
      },
      {
        id: '4',
        name: 'Book Review',
        description: 'Template for book reviews and reading notes',
        category: 'learning',
        content: `# Book Review: {{book_title}}

## Author: {{author}}
## Genre: {{genre}}
## Rating: {{rating}}/5

## Summary
{{summary}}

## Key Takeaways
{{key_takeaways}}

## Favorite Quotes
{{favorite_quotes}}

## What I liked:
{{liked}}

## What I didn't like:
{{disliked}}

## Would I recommend?
{{recommendation}}

## Related Books
{{related_books}}

---
Tags: {{tags}}`,
        variables: [
          { name: 'book_title', type: 'text', label: 'Book Title', required: true },
          { name: 'author', type: 'text', label: 'Author', required: true },
          { name: 'genre', type: 'text', label: 'Genre', required: false },
          { name: 'rating', type: 'number', label: 'Rating (1-5)', required: false },
          { name: 'summary', type: 'text', label: 'Summary', required: false },
          { name: 'key_takeaways', type: 'text', label: 'Key Takeaways', required: false },
          { name: 'favorite_quotes', type: 'text', label: 'Favorite Quotes', required: false },
          { name: 'liked', type: 'text', label: 'What I liked', required: false },
          { name: 'disliked', type: 'text', label: 'What I didn\'t like', required: false },
          { name: 'recommendation', type: 'text', label: 'Would I recommend?', required: false },
          { name: 'related_books', type: 'text', label: 'Related Books', required: false },
          { name: 'tags', type: 'text', label: 'Tags', required: false }
        ],
        tags: ['book', 'review', 'reading'],
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 0
      },
      {
        id: '5',
        name: 'Recipe',
        description: 'Template for recipe documentation',
        category: 'personal',
        content: `# {{recipe_name}}

## Prep Time: {{prep_time}}
## Cook Time: {{cook_time}}
## Servings: {{servings}}
## Difficulty: {{difficulty}}

## Ingredients
{{ingredients}}

## Instructions
{{instructions}}

## Notes
{{notes}}

## Variations
{{variations}}

---
Tags: {{tags}}`,
        variables: [
          { name: 'recipe_name', type: 'text', label: 'Recipe Name', required: true },
          { name: 'prep_time', type: 'text', label: 'Prep Time', required: false },
          { name: 'cook_time', type: 'text', label: 'Cook Time', required: false },
          { name: 'servings', type: 'number', label: 'Servings', required: false },
          { name: 'difficulty', type: 'select', label: 'Difficulty', options: ['Easy', 'Medium', 'Hard'], required: false },
          { name: 'ingredients', type: 'text', label: 'Ingredients', required: false },
          { name: 'instructions', type: 'text', label: 'Instructions', required: false },
          { name: 'notes', type: 'text', label: 'Notes', required: false },
          { name: 'variations', type: 'text', label: 'Variations', required: false },
          { name: 'tags', type: 'text', label: 'Tags', required: false }
        ],
        tags: ['recipe', 'cooking', 'food'],
        createdAt: new Date(),
        lastUsed: new Date(),
        useCount: 0
      }
    ];

    setTemplates(defaultTemplates);
  }, []);

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [templates, selectedCategory, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(templates.map(t => t.category))];
    return cats;
  }, [templates]);

  // Add variable to template
  const addVariable = useCallback(() => {
    const newVariable: TemplateVariable = {
      name: '',
      type: 'text',
      label: '',
      required: false
    };
    
    setNewTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
    }));
  }, []);

  // Update variable
  const updateVariable = useCallback((index: number, updates: Partial<TemplateVariable>) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables?.map((var_, i) => 
        i === index ? { ...var_, ...updates } : var_
      ) || []
    }));
  }, []);

  // Remove variable
  const removeVariable = useCallback((index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || []
    }));
  }, []);

  // Save template
  const saveTemplate = useCallback(() => {
    if (!newTemplate.name?.trim() || !newTemplate.content?.trim()) {
      alert('Please fill in the template name and content');
      return;
    }

    const template: NoteTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description || '',
      category: newTemplate.category || 'general',
      content: newTemplate.content,
      variables: newTemplate.variables || [],
      tags: newTemplate.tags || [],
      createdAt: editingTemplate?.createdAt || new Date(),
      lastUsed: new Date(),
      useCount: editingTemplate?.useCount || 0
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
    } else {
      setTemplates(prev => [template, ...prev]);
    }

    setNewTemplate({
      name: '',
      description: '',
      category: 'general',
      content: '',
      variables: [],
      tags: []
    });
    setShowCreateForm(false);
    setEditingTemplate(null);

    loggingService.info('Template saved', { 
      templateId: template.id, 
      name: template.name 
    });
  }, [newTemplate, editingTemplate]);

  // Delete template
  const deleteTemplate = useCallback((templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      loggingService.info('Template deleted', { templateId });
    }
  }, []);

  // Edit template
  const editTemplate = useCallback((template: NoteTemplate) => {
    setEditingTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content,
      variables: template.variables,
      tags: template.tags
    });
    setShowCreateForm(true);
  }, []);

  // Use template
  const useTemplate = useCallback((template: NoteTemplate) => {
    // Update usage stats
    setTemplates(prev => prev.map(t => 
      t.id === template.id 
        ? { ...t, lastUsed: new Date(), useCount: t.useCount + 1 }
        : t
    ));

    onSelectTemplate(template);
    onClose();

    loggingService.info('Template used', { 
      templateId: template.id, 
      name: template.name 
    });
  }, [onSelectTemplate, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '1000px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>Note Templates</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: '8px 16px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              + New Template
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: colors.textSecondary
              }}
              aria-label="Close template panel"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.background,
              color: colors.text
            }}
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              background: colors.background,
              color: colors.text
            }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Template Creation/Edit Form */}
        {showCreateForm && (
          <div style={{
            padding: '20px',
            background: colors.surface,
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <input
                type="text"
                value={newTemplate.name || ''}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Template name"
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text
                }}
              />
              
              <select
                value={newTemplate.category || 'general'}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text
                }}
              >
                <option value="general">General</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="learning">Learning</option>
              </select>
            </div>
            
            <textarea
              value={newTemplate.description || ''}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Template description"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                marginBottom: '16px',
                resize: 'vertical'
              }}
            />
            
            <textarea
              value={newTemplate.content || ''}
              onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Template content (use {{variable_name}} for variables)"
              rows={8}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                marginBottom: '16px',
                resize: 'vertical',
                fontFamily: 'monospace'
              }}
            />

            {/* Variables Section */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h4 style={{ margin: 0, color: colors.text }}>Variables</h4>
                <button
                  onClick={addVariable}
                  style={{
                    padding: '4px 8px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Add Variable
                </button>
              </div>
              
              {(newTemplate.variables || []).map((variable, index) => (
                <div key={index} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr auto',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, { name: e.target.value })}
                    placeholder="Variable name"
                    style={{
                      padding: '6px 8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                  />
                  
                  <select
                    value={variable.type}
                    onChange={(e) => updateVariable(index, { type: e.target.value as any })}
                    style={{
                      padding: '6px 8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="number">Number</option>
                  </select>
                  
                  <input
                    type="text"
                    value={variable.label}
                    onChange={(e) => updateVariable(index, { label: e.target.value })}
                    placeholder="Label"
                    style={{
                      padding: '6px 8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      fontSize: '12px'
                    }}
                  />
                  
                  <button
                    onClick={() => removeVariable(index)}
                    style={{
                      padding: '6px 8px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingTemplate(null);
                  setNewTemplate({
                    name: '',
                    description: '',
                    category: 'general',
                    content: '',
                    variables: [],
                    tags: []
                  });
                }}
                style={{
                  padding: '8px 16px',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: colors.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                style={{
                  padding: '8px 16px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        )}

        {/* Templates List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredTemplates.map(template => (
            <div key={template.id} style={{
              padding: '16px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              background: colors.background
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '8px'
              }}>
                <h4 style={{ margin: 0, color: colors.text }}>{template.name}</h4>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => editTemplate(template)}
                    style={{
                      padding: '4px 8px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: colors.text
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    style={{
                      padding: '4px 8px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <p style={{ 
                margin: '0 0 8px 0', 
                color: colors.textSecondary, 
                fontSize: '14px' 
              }}>
                {template.description}
              </p>
              
              <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '2px 6px',
                  background: colors.primary,
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '11px'
                }}>
                  {template.category}
                </span>
                {template.tags.map((tag, index) => (
                  <span key={index} style={{
                    padding: '2px 6px',
                    background: colors.surface,
                    color: colors.textSecondary,
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
              
              <div style={{ 
                fontSize: '12px', 
                color: colors.textSecondary, 
                marginBottom: '12px' 
              }}>
                Used {template.useCount} times • {template.variables.length} variables
              </div>
              
              <button
                onClick={() => useTemplate(template)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && !showCreateForm && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: colors.textSecondary
          }}>
            No templates found. Create your first template!
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteTemplates; 