import React, { useState, useEffect } from 'react';
import { noteTemplatesService, NoteTemplate, NoteWorkflow } from '../services/noteTemplatesService';

export const NoteTemplatesDemo: React.FC = () => {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [workflows, setWorkflows] = useState<NoteWorkflow[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, any>>({});
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'templates' | 'workflows' | 'examples'>('overview');
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTemplates(noteTemplatesService.getTemplates());
    setWorkflows(noteTemplatesService.getWorkflows());
  };

  const handleTemplateSelect = (template: NoteTemplate) => {
    setSelectedTemplate(template);
    setTemplateVariables({});
    setGeneratedContent('');
  };

  const handleVariableChange = (variableName: string, value: any) => {
    setTemplateVariables(prev => ({ ...prev, [variableName]: value }));
  };

  const generateContent = () => {
    if (!selectedTemplate) return;

    try {
      const content = noteTemplatesService.generateContent(selectedTemplate.id, templateVariables);
      setGeneratedContent(content);
    } catch (error) {
      alert(`Error generating content: ${error}`);
    }
  };

  const executeWorkflow = async (workflow: NoteWorkflow) => {
    setIsExecutingWorkflow(true);
    try {
      const result = await NoteTemplatesService.executeWorkflow(workflow.id, {
        projectName: 'Demo Project',
        projectManager: 'John Doe',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'Planning'
      });

      if (result.success) {
        alert(`Workflow executed successfully!\nDuration: ${result.duration}ms\nResults: ${result.results.length} steps completed`);
      } else {
        alert(`Workflow failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      alert(`Error executing workflow: ${error}`);
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'business': return '💼';
      case 'project': return '📋';
      case 'personal': return '👤';
      case 'academic': return '🎓';
      case 'creative': return '🎨';
      default: return '📄';
    }
  };

  const getWorkflowIcon = (category: string) => {
    switch (category) {
      case 'project': return '⚡';
      case 'business': return '🏢';
      case 'personal': return '👤';
      default: return '🔄';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Note Templates & Workflows Demo</h1>
        <p className="text-lg text-gray-600">
          Explore powerful templates and automated workflows for efficient note creation
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
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
            onClick={() => setActiveTab('examples')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'examples'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Examples
          </button>
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📄 Templates</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Variable System</h3>
                    <p className="text-sm text-gray-600">
                      Dynamic templates with customizable variables and validation
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Categories & Tags</h3>
                    <p className="text-sm text-gray-600">
                      Organize templates by categories and tags for easy discovery
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xs">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Usage Analytics</h3>
                    <p className="text-sm text-gray-600">
                      Track template usage, ratings, and popular variables
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Workflows</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Multi-Step Automation</h3>
                    <p className="text-sm text-gray-600">
                      Chain multiple actions together for complex note creation processes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Conditional Logic</h3>
                    <p className="text-sm text-gray-600">
                      Add conditions and branching logic to your workflows
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-xs">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Performance Tracking</h3>
                    <p className="text-sm text-gray-600">
                      Monitor workflow success rates and execution times
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                <div className="text-sm text-gray-600">Available Templates</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{workflows.length}</div>
                <div className="text-sm text-gray-600">Active Workflows</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {templates.reduce((sum, t) => sum + t.metadata.usageCount, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Template Uses</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {templates.filter(t => t.metadata.isPublic).length}
                </div>
                <div className="text-sm text-gray-600">Public Templates</div>
              </div>
            </div>
          </div>

          {/* Popular Templates */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates
                .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
                .slice(0, 3)
                .map(template => (
                  <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getTemplateIcon(template.category)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>⭐ {template.metadata.rating}</span>
                      <span>{template.metadata.usageCount} uses</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Templates</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTemplateIcon(template.category)}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {template.variables.length} variables
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">
                            {template.metadata.usageCount} uses
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Template Preview */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Template Preview</h2>
              
              {selectedTemplate ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{selectedTemplate.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</p>
                  </div>

                  {/* Variables Form */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Fill Variables</h4>
                    <div className="space-y-3">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable.name}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {variable.label}
                            {variable.required && <span className="text-red-500"> *</span>}
                          </label>
                          
                          {variable.type === 'text' && (
                            <input
                              type="text"
                              value={templateVariables[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={variable.description}
                            />
                          )}
                          
                          {variable.type === 'number' && (
                            <input
                              type="number"
                              value={templateVariables[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={variable.description}
                            />
                          )}
                          
                          {variable.type === 'date' && (
                            <input
                              type="date"
                              value={templateVariables[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          
                          {variable.type === 'select' && variable.options && (
                            <select
                              value={templateVariables[variable.name] || ''}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select {variable.label}</option>
                              {variable.options.map(option => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {variable.type === 'boolean' && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={templateVariables[variable.name] || false}
                                onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">{variable.description}</span>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={generateContent}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Generate Content
                    </button>
                  </div>

                  {/* Generated Content */}
                  {generatedContent && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Generated Content</h4>
                      <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">{generatedContent}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📄</div>
                  <p>Select a template to preview and test it</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workflow List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Workflows</h2>
              <div className="space-y-4">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <span className="text-2xl">{getWorkflowIcon(workflow.category)}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{workflow.steps.length} steps</span>
                          <span>•</span>
                          <span>{(workflow.metadata.successRate * 100).toFixed(1)}% success</span>
                          <span>•</span>
                          <span>{workflow.metadata.usageCount} executions</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Avg time: {workflow.metadata.averageCompletionTime}ms
                      </div>
                      <button
                        onClick={() => executeWorkflow(workflow)}
                        disabled={isExecutingWorkflow}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isExecutingWorkflow ? 'Executing...' : 'Execute'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Details */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Details</h2>
              
              {workflows.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">How Workflows Work</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Workflows automate complex note creation processes by chaining multiple steps together.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Step Types</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs">T</span>
                        </span>
                        <span><strong>Template:</strong> Apply a template with variables</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-xs">A</span>
                        </span>
                        <span><strong>Action:</strong> Perform automated actions</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 text-xs">C</span>
                        </span>
                        <span><strong>Condition:</strong> Add conditional logic</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-xs">L</span>
                        </span>
                        <span><strong>Loop:</strong> Repeat steps for multiple items</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Example Workflow</h4>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">1</span>
                          <span>Create Project Plan template</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">2</span>
                          <span>Schedule kickoff meeting</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">3</span>
                          <span>Create team directory structure</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">⚡</div>
                  <p>No workflows available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="space-y-6">
          {/* Template Examples */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Template Examples</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Meeting Notes Template</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Variables:</strong> meetingTitle, attendees, agenda, actionItems</p>
                  <p><strong>Use Case:</strong> Standardize meeting documentation</p>
                  <p><strong>Benefits:</strong> Consistent format, easy to scan, action tracking</p>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono">
                  # {{meetingTitle}}<br/>
                  **Attendees:** {{attendees}}<br/>
                  **Agenda:** {{agenda}}<br/>
                  **Action Items:** {{actionItems}}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Project Plan Template</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Variables:</strong> projectName, timeline, resources, risks</p>
                  <p><strong>Use Case:</strong> Project planning and documentation</p>
                  <p><strong>Benefits:</strong> Structured planning, stakeholder alignment</p>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs font-mono">
                  # {{projectName}} - Project Plan<br/>
                  **Timeline:** {{timeline}}<br/>
                  **Resources:** {{resources}}<br/>
                  **Risks:** {{risks}}
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Examples */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Examples</h2>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Project Kickoff Workflow</h3>
                <div className="text-sm text-gray-600 mb-3">
                  Automates the entire project setup process from planning to team organization.
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">1</span>
                    <span>Create project plan using template</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">2</span>
                    <span>Schedule kickoff meeting with stakeholders</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">3</span>
                    <span>Create team directory structure</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Daily Journal Workflow</h3>
                <div className="text-sm text-gray-600 mb-3">
                  Automates daily reflection and planning with mood tracking and goal setting.
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs">1</span>
                    <span>Create daily journal entry with mood tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs">2</span>
                    <span>Set goals for the day</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs">3</span>
                    <span>Schedule evening reflection reminder</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Best Practices</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Template Design</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Use clear, descriptive variable names</li>
                  <li>• Provide helpful descriptions for each variable</li>
                  <li>• Set appropriate validation rules</li>
                  <li>• Keep templates focused and specific</li>
                  <li>• Use consistent formatting and structure</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Workflow Design</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Start with simple workflows and iterate</li>
                  <li>• Include error handling and fallbacks</li>
                  <li>• Test workflows thoroughly before production</li>
                  <li>• Monitor performance and success rates</li>
                  <li>• Document workflow purposes and usage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 