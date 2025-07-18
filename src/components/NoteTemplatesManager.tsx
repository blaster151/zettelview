import React, { useState, useEffect } from 'react';
import { NoteTemplatesService, NoteTemplate, TemplateCategory, NoteWorkflow, TemplateVariable } from '../services/noteTemplatesService';

interface NoteTemplatesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect?: (template: NoteTemplate) => void;
}

export const NoteTemplatesManager: React.FC<NoteTemplatesManagerProps> = ({
  isOpen,
  onClose,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [workflows, setWorkflows] = useState<NoteWorkflow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<NoteWorkflow | null>(null);
  const [activeTab, setActiveTab] = useState<'templates' | 'workflows' | 'categories'>('templates');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [filter, setFilter] = useState({
    category: '',
    search: '',
    isPublic: undefined as boolean | undefined
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = () => {
    const templateFilters: any = {};
    if (filter.category) templateFilters.category = filter.category;
    if (filter.isPublic !== undefined) templateFilters.isPublic = filter.isPublic;

    let filteredTemplates = NoteTemplatesService.getTemplates(templateFilters);
    
    if (filter.search) {
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(filter.search.toLowerCase()) ||
        template.description.toLowerCase().includes(filter.search.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(filter.search.toLowerCase()))
      );
    }

    setTemplates(filteredTemplates);
    setCategories(NoteTemplatesService.getCategories());
    setWorkflows(NoteTemplatesService.getWorkflows());
  };

  const handleCreateTemplate = () => {
    setIsCreating(true);
    setSelectedTemplate(null);
  };

  const handleEditTemplate = (template: NoteTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      NoteTemplatesService.deleteTemplate(templateId);
      loadData();
    }
  };

  const handleTemplateSave = (templateData: Partial<NoteTemplate>) => {
    if (isEditing && selectedTemplate) {
      NoteTemplatesService.updateTemplate(selectedTemplate.id, templateData);
    } else {
      NoteTemplatesService.createTemplate(templateData as Omit<NoteTemplate, 'id' | 'metadata'>);
    }
    
    setIsCreating(false);
    setIsEditing(false);
    setSelectedTemplate(null);
    loadData();
  };

  const handleTemplateSelect = (template: NoteTemplate) => {
    onTemplateSelect?.(template);
    onClose();
  };

  const handleWorkflowExecute = async (workflow: NoteWorkflow) => {
    try {
      const result = await NoteTemplatesService.executeWorkflow(workflow.id);
      if (result.success) {
        alert(`Workflow executed successfully in ${result.duration}ms`);
      } else {
        alert(`Workflow failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      alert(`Error executing workflow: ${error}`);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || '📄';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900">Note Templates & Workflows</h2>
            <span className="text-sm text-gray-500">
              {templates.length} templates, {workflows.length} workflows
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close templates manager"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workflows'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Workflows ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Categories ({categories.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'templates' && (
            <div className="h-full p-6 overflow-y-auto">
              {/* Filters and Actions */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={filter.search}
                    onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filter.category}
                    onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filter.isPublic === undefined ? '' : filter.isPublic.toString()}
                    onChange={(e) => setFilter(prev => ({ 
                      ...prev, 
                      isPublic: e.target.value === '' ? undefined : e.target.value === 'true'
                    }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Templates</option>
                    <option value="true">Public Only</option>
                    <option value="false">Private Only</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Template
                </button>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <div key={template.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: `${getCategoryColor(template.category)}20`,
                                  color: getCategoryColor(template.category)
                                }}
                              >
                                {categories.find(c => c.id === template.category)?.name || template.category}
                              </span>
                              {template.metadata.isPublic && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Public
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-500">⭐ {template.metadata.rating}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{template.metadata.usageCount} uses</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          {template.variables.length} variables
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTemplateSelect(template)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Use
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                  <p className="text-gray-600 mb-4">
                    {filter.search || filter.category || filter.isPublic !== undefined
                      ? 'Try adjusting your filters'
                      : 'Create your first template to get started'
                    }
                  </p>
                  {!filter.search && !filter.category && filter.isPublic === undefined && (
                    <button
                      onClick={handleCreateTemplate}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Create Template
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflows' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
                <button
                  onClick={() => {/* TODO: Create workflow */}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Workflow
                </button>
              </div>

              <div className="space-y-4">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${getCategoryColor(workflow.category)}20`,
                              color: getCategoryColor(workflow.category)
                            }}
                          >
                            {categories.find(c => c.id === workflow.category)?.name || workflow.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {workflow.steps.length} steps
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Success: {(workflow.metadata.successRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">
                          Avg: {workflow.metadata.averageCompletionTime}ms
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {workflow.metadata.usageCount} executions
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleWorkflowExecute(workflow)}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Execute
                        </button>
                        <button
                          onClick={() => setSelectedWorkflow(workflow)}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {workflows.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚡</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create workflows to automate your note creation process
                  </p>
                  <button
                    onClick={() => {/* TODO: Create workflow */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Workflow
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                <button
                  onClick={() => {/* TODO: Create category */}}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <div key={category.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {category.templates.length} templates
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {/* TODO: Edit category */}}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {/* TODO: Delete category */}}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create categories to organize your templates
                  </p>
                  <button
                    onClick={() => {/* TODO: Create category */}}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Create Category
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Editor Modal */}
        {(isCreating || isEditing) && (
          <TemplateEditor
            template={selectedTemplate}
            categories={categories}
            onSave={handleTemplateSave}
            onCancel={() => {
              setIsCreating(false);
              setIsEditing(false);
              setSelectedTemplate(null);
            }}
          />
        )}

        {/* Workflow Viewer Modal */}
        {selectedWorkflow && (
          <WorkflowViewer
            workflow={selectedWorkflow}
            onClose={() => setSelectedWorkflow(null)}
          />
        )}
      </div>
    </div>
  );
};

// Template Editor Component
interface TemplateEditorProps {
  template: NoteTemplate | null;
  categories: TemplateCategory[];
  onSave: (template: Partial<NoteTemplate>) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  categories,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || '',
    tags: template?.tags || [],
    content: template?.content || '',
    variables: template?.variables || []
  });

  const [newTag, setNewTag] = useState('');
  const [newVariable, setNewVariable] = useState<Partial<TemplateVariable>>({});

  const handleSave = () => {
    if (!formData.name || !formData.category) {
      alert('Name and category are required');
      return;
    }

    onSave(formData);
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addVariable = () => {
    if (newVariable.name && newVariable.type) {
      const variable: TemplateVariable = {
        name: newVariable.name,
        type: newVariable.type as any,
        label: newVariable.label || newVariable.name,
        description: newVariable.description || '',
        required: newVariable.required || false,
        options: newVariable.options || []
      };
      
      setFormData(prev => ({ ...prev, variables: [...prev.variables, variable] }));
      setNewVariable({});
    }
  };

  const removeVariable = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      variables: prev.variables.filter((_, i) => i !== index) 
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Create Template'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your template"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Tags</h4>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Variables */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Variables</h4>
              <div className="space-y-4">
                {formData.variables.map((variable, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">{variable.name}</h5>
                      <button
                        onClick={() => removeVariable(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span> {variable.type}
                      </div>
                      <div>
                        <span className="text-gray-600">Required:</span> {variable.required ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="text-gray-600">Label:</span> {variable.label}
                      </div>
                      {variable.options && (
                        <div>
                          <span className="text-gray-600">Options:</span> {variable.options.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Variable Form */}
              <div className="border rounded-lg p-4 mt-4">
                <h5 className="font-medium text-gray-900 mb-3">Add Variable</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Variable name"
                    value={newVariable.name || ''}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newVariable.type || ''}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, type: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select type</option>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-select</option>
                    <option value="boolean">Boolean</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Label"
                    value={newVariable.label || ''}
                    onChange={(e) => setNewVariable(prev => ({ ...prev, label: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newVariable.required || false}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">Required</label>
                  </div>
                </div>
                <button
                  onClick={addVariable}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Variable
                </button>
              </div>
            </div>

            {/* Template Content */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Template Content</h4>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                rows={10}
                placeholder="Enter your template content. Use {{variableName}} for variables."
              />
              <p className="text-sm text-gray-600 mt-2">
                Use {{variableName}} syntax to reference variables in your template.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {template ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Workflow Viewer Component
interface WorkflowViewerProps {
  workflow: NoteWorkflow;
  onClose: () => void;
}

const WorkflowViewer: React.FC<WorkflowViewerProps> = ({ workflow, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">{workflow.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{workflow.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Workflow Steps</h4>
              <div className="space-y-4">
                {workflow.steps.sort((a, b) => a.metadata.order - b.metadata.order).map((step, index) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{step.name}</h5>
                          <span className="text-sm text-gray-500 capitalize">{step.type}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {step.metadata.estimatedTime}s
                      </div>
                    </div>
                    
                    {step.templateId && (
                      <div className="text-sm text-gray-600">
                        Template: {step.templateId}
                      </div>
                    )}
                    
                    {step.action && (
                      <div className="text-sm text-gray-600">
                        Action: {step.action}
                      </div>
                    )}
                    
                    {step.condition && (
                      <div className="text-sm text-gray-600">
                        Condition: {step.condition}
                      </div>
                    )}
                    
                    {step.metadata.isOptional && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs mt-2">
                        Optional
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{workflow.metadata.usageCount}</div>
                  <div className="text-sm text-gray-600">Executions</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {(workflow.metadata.successRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {workflow.metadata.averageCompletionTime}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 