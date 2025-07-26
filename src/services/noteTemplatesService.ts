import { Note } from '../types/domain';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  variables: TemplateVariable[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    rating: number;
    isPublic: boolean;
    author: string;
    version: string;
  };
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  label: string;
  description: string;
  defaultValue?: any;
  required: boolean;
  options?: string[]; // For select/multiselect types
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templates: string[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'template' | 'action' | 'condition' | 'loop';
  templateId?: string;
  action?: string;
  condition?: string;
  parameters: Record<string, any>;
  nextSteps: string[];
  metadata: {
    order: number;
    isOptional: boolean;
    estimatedTime: number;
  };
}

export interface NoteWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    averageCompletionTime: number;
    successRate: number;
    isActive: boolean;
  };
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'event' | 'condition';
  event?: string;
  schedule?: string;
  condition?: string;
  parameters: Record<string, any>;
}

export interface TemplateUsage {
  id: string;
  templateId: string;
  noteId: string;
  variables: Record<string, any>;
  timestamp: Date;
  duration: number;
  success: boolean;
}

class NoteTemplatesService {
  private templates: Map<string, NoteTemplate> = new Map();
  private categories: Map<string, TemplateCategory> = new Map();
  private workflows: Map<string, NoteWorkflow> = new Map();
  private usage: Map<string, TemplateUsage[]> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.initializeDefaultCategories();
    this.initializeDefaultWorkflows();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: NoteTemplate[] = [
      {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Template for capturing meeting notes with action items',
        category: 'business',
        tags: ['meeting', 'business', 'notes'],
        content: `# {{meetingTitle}}

**Date:** {{meetingDate}}
**Time:** {{meetingTime}}
**Location:** {{meetingLocation}}
**Attendees:** {{attendees}}

## Agenda
{{agenda}}

## Discussion Points
{{discussionPoints}}

## Action Items
{{actionItems}}

## Next Steps
{{nextSteps}}

## Notes
{{additionalNotes}}`,
        variables: [
          {
            name: 'meetingTitle',
            type: 'text',
            label: 'Meeting Title',
            description: 'Title of the meeting',
            required: true,
            validation: { minLength: 3, maxLength: 100 }
          },
          {
            name: 'meetingDate',
            type: 'date',
            label: 'Meeting Date',
            description: 'Date of the meeting',
            required: true
          },
          {
            name: 'meetingTime',
            type: 'text',
            label: 'Meeting Time',
            description: 'Time of the meeting',
            required: true
          },
          {
            name: 'meetingLocation',
            type: 'text',
            label: 'Meeting Location',
            description: 'Location or platform for the meeting',
            required: false
          },
          {
            name: 'attendees',
            type: 'multiselect',
            label: 'Attendees',
            description: 'List of meeting attendees',
            required: true,
            options: []
          },
          {
            name: 'agenda',
            type: 'text',
            label: 'Agenda',
            description: 'Meeting agenda items',
            required: true
          },
          {
            name: 'discussionPoints',
            type: 'text',
            label: 'Discussion Points',
            description: 'Key discussion points from the meeting',
            required: false
          },
          {
            name: 'actionItems',
            type: 'text',
            label: 'Action Items',
            description: 'Action items and assignments',
            required: false
          },
          {
            name: 'nextSteps',
            type: 'text',
            label: 'Next Steps',
            description: 'Next steps and follow-up actions',
            required: false
          },
          {
            name: 'additionalNotes',
            type: 'text',
            label: 'Additional Notes',
            description: 'Any additional notes or observations',
            required: false
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          rating: 4.5,
          isPublic: true,
          author: 'system',
          version: '1.0.0'
        }
      },
      {
        id: 'project-plan',
        name: 'Project Plan',
        description: 'Template for project planning and management',
        category: 'project',
        tags: ['project', 'planning', 'management'],
        content: `# {{projectName}} - Project Plan

**Project Manager:** {{projectManager}}
**Start Date:** {{startDate}}
**End Date:** {{endDate}}
**Status:** {{status}}

## Project Overview
{{projectOverview}}

## Objectives
{{objectives}}

## Scope
{{scope}}

## Timeline
{{timeline}}

## Resources
{{resources}}

## Risks and Mitigation
{{risks}}

## Success Criteria
{{successCriteria}}

## Stakeholders
{{stakeholders}}`,
        variables: [
          {
            name: 'projectName',
            type: 'text',
            label: 'Project Name',
            description: 'Name of the project',
            required: true,
            validation: { minLength: 3, maxLength: 100 }
          },
          {
            name: 'projectManager',
            type: 'text',
            label: 'Project Manager',
            description: 'Name of the project manager',
            required: true
          },
          {
            name: 'startDate',
            type: 'date',
            label: 'Start Date',
            description: 'Project start date',
            required: true
          },
          {
            name: 'endDate',
            type: 'date',
            label: 'End Date',
            description: 'Project end date',
            required: true
          },
          {
            name: 'status',
            type: 'select',
            label: 'Status',
            description: 'Current project status',
            required: true,
            options: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']
          },
          {
            name: 'projectOverview',
            type: 'text',
            label: 'Project Overview',
            description: 'Brief overview of the project',
            required: true
          },
          {
            name: 'objectives',
            type: 'text',
            label: 'Objectives',
            description: 'Project objectives and goals',
            required: true
          },
          {
            name: 'scope',
            type: 'text',
            label: 'Scope',
            description: 'Project scope and deliverables',
            required: true
          },
          {
            name: 'timeline',
            type: 'text',
            label: 'Timeline',
            description: 'Project timeline and milestones',
            required: false
          },
          {
            name: 'resources',
            type: 'text',
            label: 'Resources',
            description: 'Required resources and budget',
            required: false
          },
          {
            name: 'risks',
            type: 'text',
            label: 'Risks and Mitigation',
            description: 'Potential risks and mitigation strategies',
            required: false
          },
          {
            name: 'successCriteria',
            type: 'text',
            label: 'Success Criteria',
            description: 'Criteria for project success',
            required: false
          },
          {
            name: 'stakeholders',
            type: 'text',
            label: 'Stakeholders',
            description: 'Key stakeholders and their roles',
            required: false
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          rating: 4.8,
          isPublic: true,
          author: 'system',
          version: '1.0.0'
        }
      },
      {
        id: 'daily-journal',
        name: 'Daily Journal',
        description: 'Template for daily journaling and reflection',
        category: 'personal',
        tags: ['journal', 'daily', 'reflection'],
        content: `# Daily Journal - {{date}}

## Morning Reflection
**Mood:** {{morningMood}}
**Energy Level:** {{energyLevel}}

{{morningThoughts}}

## Goals for Today
{{todaysGoals}}

## Accomplishments
{{accomplishments}}

## Challenges
{{challenges}}

## Lessons Learned
{{lessonsLearned}}

## Gratitude
{{gratitude}}

## Tomorrow's Focus
{{tomorrowsFocus}}

## Evening Reflection
**Mood:** {{eveningMood}}
**Overall Day Rating:** {{dayRating}}/10

{{eveningThoughts}}`,
        variables: [
          {
            name: 'date',
            type: 'date',
            label: 'Date',
            description: 'Date for the journal entry',
            required: true
          },
          {
            name: 'morningMood',
            type: 'select',
            label: 'Morning Mood',
            description: 'How you feel this morning',
            required: true,
            options: ['Great', 'Good', 'Okay', 'Not Great', 'Terrible']
          },
          {
            name: 'energyLevel',
            type: 'select',
            label: 'Energy Level',
            description: 'Your energy level this morning',
            required: true,
            options: ['High', 'Medium', 'Low']
          },
          {
            name: 'morningThoughts',
            type: 'text',
            label: 'Morning Thoughts',
            description: 'Your thoughts and feelings this morning',
            required: false
          },
          {
            name: 'todaysGoals',
            type: 'text',
            label: "Today's Goals",
            description: 'What you want to accomplish today',
            required: true
          },
          {
            name: 'accomplishments',
            type: 'text',
            label: 'Accomplishments',
            description: 'What you accomplished today',
            required: false
          },
          {
            name: 'challenges',
            type: 'text',
            label: 'Challenges',
            description: 'Challenges you faced today',
            required: false
          },
          {
            name: 'lessonsLearned',
            type: 'text',
            label: 'Lessons Learned',
            description: 'What you learned today',
            required: false
          },
          {
            name: 'gratitude',
            type: 'text',
            label: 'Gratitude',
            description: 'What you are grateful for today',
            required: false
          },
          {
            name: 'tomorrowsFocus',
            type: 'text',
            label: "Tomorrow's Focus",
            description: 'What you want to focus on tomorrow',
            required: false
          },
          {
            name: 'eveningMood',
            type: 'select',
            label: 'Evening Mood',
            description: 'How you feel this evening',
            required: true,
            options: ['Great', 'Good', 'Okay', 'Not Great', 'Terrible']
          },
          {
            name: 'dayRating',
            type: 'number',
            label: 'Day Rating',
            description: 'Rate your day from 1-10',
            required: true,
            validation: { min: 1, max: 10 }
          },
          {
            name: 'eveningThoughts',
            type: 'text',
            label: 'Evening Thoughts',
            description: 'Your thoughts and reflections this evening',
            required: false
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          rating: 4.2,
          isPublic: true,
          author: 'system',
          version: '1.0.0'
        }
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeDefaultCategories(): void {
    const defaultCategories: TemplateCategory[] = [
      {
        id: 'business',
        name: 'Business',
        description: 'Templates for business and professional use',
        icon: '💼',
        color: '#3B82F6',
        templates: ['meeting-notes']
      },
      {
        id: 'project',
        name: 'Project Management',
        description: 'Templates for project planning and management',
        icon: '📋',
        color: '#10B981',
        templates: ['project-plan']
      },
      {
        id: 'personal',
        name: 'Personal',
        description: 'Templates for personal use and reflection',
        icon: '👤',
        color: '#F59E0B',
        templates: ['daily-journal']
      },
      {
        id: 'academic',
        name: 'Academic',
        description: 'Templates for academic and research work',
        icon: '🎓',
        color: '#8B5CF6',
        templates: []
      },
      {
        id: 'creative',
        name: 'Creative',
        description: 'Templates for creative writing and projects',
        icon: '🎨',
        color: '#EC4899',
        templates: []
      }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  private initializeDefaultWorkflows(): void {
    const defaultWorkflows: NoteWorkflow[] = [
      {
        id: 'project-kickoff',
        name: 'Project Kickoff Workflow',
        description: 'Complete workflow for starting a new project',
        category: 'project',
        steps: [
          {
            id: 'step1',
            name: 'Create Project Plan',
            type: 'template',
            templateId: 'project-plan',
            parameters: {},
            nextSteps: ['step2'],
            metadata: {
              order: 1,
              isOptional: false,
              estimatedTime: 30
            }
          },
          {
            id: 'step2',
            name: 'Schedule Kickoff Meeting',
            type: 'action',
            action: 'schedule_meeting',
            parameters: {
              template: 'meeting-notes',
              attendees: '{{projectStakeholders}}',
              duration: 60
            },
            nextSteps: ['step3'],
            metadata: {
              order: 2,
              isOptional: false,
              estimatedTime: 15
            }
          },
          {
            id: 'step3',
            name: 'Create Team Directory',
            type: 'action',
            action: 'create_directory',
            parameters: {
              name: '{{projectName}} Team',
              structure: ['Documents', 'Resources', 'Communication']
            },
            nextSteps: [],
            metadata: {
              order: 3,
              isOptional: true,
              estimatedTime: 10
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            parameters: {}
          }
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          averageCompletionTime: 55,
          successRate: 0.95,
          isActive: true
        }
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  // Template Management
  createTemplate(template: Omit<NoteTemplate, 'id' | 'metadata'>): NoteTemplate {
    const id = this.generateTemplateId();
    const newTemplate: NoteTemplate = {
      ...template,
      id,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        rating: 0,
        isPublic: false,
        author: 'user',
        version: '1.0.0'
      }
    };

    this.templates.set(id, newTemplate);
    this.emitEvent('template_created', newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<NoteTemplate>): NoteTemplate | null {
    const template = this.templates.get(id);
    if (!template) return null;

    const updatedTemplate: NoteTemplate = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        updatedAt: new Date(),
        version: this.incrementVersion(template.metadata.version)
      }
    };

    this.templates.set(id, updatedTemplate);
    this.emitEvent('template_updated', updatedTemplate);
    return updatedTemplate;
  }

  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    this.templates.delete(id);
    this.emitEvent('template_deleted', template);
    return true;
  }

  getTemplate(id: string): NoteTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplates(filters?: {
    category?: string;
    tags?: string[];
    isPublic?: boolean;
    author?: string;
  }): NoteTemplate[] {
    let templates = Array.from(this.templates.values());

    if (filters) {
      if (filters.category) {
        templates = templates.filter(t => t.category === filters.category);
      }
      if (filters.tags) {
        templates = templates.filter(t => 
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
      if (filters.isPublic !== undefined) {
        templates = templates.filter(t => t.metadata.isPublic === filters.isPublic);
      }
      if (filters.author) {
        templates = templates.filter(t => t.metadata.author === filters.author);
      }
    }

    return templates;
  }

  // Template Usage
  useTemplate(templateId: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    // Validate variables
    this.validateTemplateVariables(template, variables);

    // Replace variables in content
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), String(value));
    });

    // Record usage
    this.recordTemplateUsage(templateId, variables);

    return content;
  }

  private validateTemplateVariables(template: NoteTemplate, variables: Record<string, any>): void {
    template.variables.forEach(variable => {
      if (variable.required && !(variable.name in variables)) {
        throw new Error(`Required variable ${variable.name} is missing`);
      }

      if (variable.name in variables) {
        const value = variables[variable.name];
        
        // Type validation
        switch (variable.type) {
          case 'number':
            if (typeof value !== 'number') {
              throw new Error(`Variable ${variable.name} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(`Variable ${variable.name} must be a boolean`);
            }
            break;
          case 'date':
            if (!(value instanceof Date) && (typeof value !== 'string' || isNaN(Date.parse(value)))) {
              throw new Error(`Variable ${variable.name} must be a valid date`);
            }
            break;
        }

        // Validation rules
        if (variable.validation) {
          if (typeof value === 'string') {
            if (variable.validation.minLength && value.length < variable.validation.minLength) {
              throw new Error(`Variable ${variable.name} must be at least ${variable.validation.minLength} characters`);
            }
            if (variable.validation.maxLength && value.length > variable.validation.maxLength) {
              throw new Error(`Variable ${variable.name} must be at most ${variable.validation.maxLength} characters`);
            }
            if (variable.validation.pattern && !new RegExp(variable.validation.pattern).test(value)) {
              throw new Error(`Variable ${variable.name} does not match required pattern`);
            }
          }
          if (typeof value === 'number') {
            if (variable.validation.min !== undefined && value < variable.validation.min) {
              throw new Error(`Variable ${variable.name} must be at least ${variable.validation.min}`);
            }
            if (variable.validation.max !== undefined && value > variable.validation.max) {
              throw new Error(`Variable ${variable.name} must be at most ${variable.validation.max}`);
            }
          }
        }

        // Options validation for select/multiselect
        if (variable.type === 'select' && variable.options) {
          if (!variable.options.includes(value)) {
            throw new Error(`Variable ${variable.name} must be one of: ${variable.options.join(', ')}`);
          }
        }
        if (variable.type === 'multiselect' && variable.options) {
          if (Array.isArray(value)) {
            const invalidValues = value.filter(v => !variable.options!.includes(v));
            if (invalidValues.length > 0) {
              throw new Error(`Variable ${variable.name} contains invalid values: ${invalidValues.join(', ')}`);
            }
          }
        }
      }
    });
  }

  private recordTemplateUsage(templateId: string, variables: Record<string, any>): void {
    const usage: TemplateUsage = {
      id: this.generateUsageId(),
      templateId,
      noteId: 'temp', // Will be updated when note is created
      variables,
      timestamp: new Date(),
      duration: 0, // Will be updated when note is saved
      success: true
    };

    if (!this.usage.has(templateId)) {
      this.usage.set(templateId, []);
    }
    this.usage.get(templateId)!.push(usage);

    // Update template usage count
    const template = this.templates.get(templateId);
    if (template) {
      template.metadata.usageCount++;
      template.metadata.updatedAt = new Date();
    }
  }

  // Workflow Management
  createWorkflow(workflow: Omit<NoteWorkflow, 'id' | 'metadata'>): NoteWorkflow {
    const id = this.generateWorkflowId();
    const newWorkflow: NoteWorkflow = {
      ...workflow,
      id,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        averageCompletionTime: 0,
        successRate: 1.0,
        isActive: true
      }
    };

    this.workflows.set(id, newWorkflow);
    this.emitEvent('workflow_created', newWorkflow);
    return newWorkflow;
  }

  updateWorkflow(id: string, updates: Partial<NoteWorkflow>): NoteWorkflow | null {
    const workflow = this.workflows.get(id);
    if (!workflow) return null;

    const updatedWorkflow: NoteWorkflow = {
      ...workflow,
      ...updates,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date()
      }
    };

    this.workflows.set(id, updatedWorkflow);
    this.emitEvent('workflow_updated', updatedWorkflow);
    return updatedWorkflow;
  }

  deleteWorkflow(id: string): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) return false;

    this.workflows.delete(id);
    this.emitEvent('workflow_deleted', workflow);
    return true;
  }

  getWorkflow(id: string): NoteWorkflow | undefined {
    return this.workflows.get(id);
  }

  getWorkflows(filters?: {
    category?: string;
    isActive?: boolean;
  }): NoteWorkflow[] {
    let workflows = Array.from(this.workflows.values());

    if (filters) {
      if (filters.category) {
        workflows = workflows.filter(w => w.category === filters.category);
      }
      if (filters.isActive !== undefined) {
        workflows = workflows.filter(w => w.metadata.isActive === filters.isActive);
      }
    }

    return workflows;
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, initialVariables: Record<string, any> = {}): Promise<{
    success: boolean;
    results: any[];
    errors: string[];
    duration: number;
  }> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const startTime = Date.now();
    const results: any[] = [];
    const errors: string[] = [];
    let variables = { ...initialVariables };

    try {
      // Execute steps in order
      for (const step of workflow.steps.sort((a, b) => a.metadata.order - b.metadata.order)) {
        try {
          const result = await this.executeWorkflowStep(step, variables);
          results.push(result);
          variables = { ...variables, ...result.output };
        } catch (error) {
          errors.push(`Step ${step.name}: ${error}`);
          if (!step.metadata.isOptional) {
            break;
          }
        }
      }

      const duration = Date.now() - startTime;
      
      // Update workflow statistics
      workflow.metadata.usageCount++;
      workflow.metadata.averageCompletionTime = 
        (workflow.metadata.averageCompletionTime * (workflow.metadata.usageCount - 1) + duration) / workflow.metadata.usageCount;
      workflow.metadata.successRate = 
        (workflow.metadata.successRate * (workflow.metadata.usageCount - 1) + (errors.length === 0 ? 1 : 0)) / workflow.metadata.usageCount;

      return {
        success: errors.length === 0,
        results,
        errors,
        duration
      };
    } catch (error) {
      return {
        success: false,
        results,
        errors: [String(error)],
        duration: Date.now() - startTime
      };
    }
  }

  private async executeWorkflowStep(step: WorkflowStep, variables: Record<string, any>): Promise<{
    stepId: string;
    output: Record<string, any>;
  }> {
    switch (step.type) {
      case 'template':
        if (!step.templateId) throw new Error('Template ID required for template step');
        const content = this.useTemplate(step.templateId, variables);
        return {
          stepId: step.id,
          output: { content, templateId: step.templateId }
        };

      case 'action':
        if (!step.action) throw new Error('Action required for action step');
        const actionResult = await this.executeAction(step.action, step.parameters, variables);
        return {
          stepId: step.id,
          output: actionResult
        };

      case 'condition':
        if (!step.condition) throw new Error('Condition required for condition step');
        const conditionResult = this.evaluateCondition(step.condition, variables);
        return {
          stepId: step.id,
          output: { conditionResult }
        };

      case 'loop':
        const loopResults = await this.executeLoop(step, variables);
        return {
          stepId: step.id,
          output: { loopResults }
        };

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeAction(action: string, parameters: Record<string, any>, variables: Record<string, any>): Promise<Record<string, any>> {
    // Replace variables in parameters
    const resolvedParameters = this.resolveVariables(parameters, variables);

    switch (action) {
      case 'schedule_meeting':
        return {
          meetingScheduled: true,
          meetingId: `meeting_${Date.now()}`,
          ...resolvedParameters
        };

      case 'create_directory':
        return {
          directoryCreated: true,
          directoryId: `dir_${Date.now()}`,
          ...resolvedParameters
        };

      case 'send_notification':
        return {
          notificationSent: true,
          notificationId: `notif_${Date.now()}`,
          ...resolvedParameters
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    // Simple condition evaluation - in a real implementation, use a proper expression parser
    try {
      // Replace variables in condition
      let resolvedCondition = condition;
      Object.entries(variables).forEach(([key, value]) => {
        resolvedCondition = resolvedCondition.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      });

      // Simple boolean evaluation (be careful with this in production)
      return eval(resolvedCondition);
    } catch (error) {
      throw new Error(`Invalid condition: ${condition}`);
    }
  }

  private async executeLoop(step: WorkflowStep, variables: Record<string, any>): Promise<any[]> {
    const results: any[] = [];
    const items = variables[step.parameters.items || 'items'] || [];
    
    for (const item of items) {
      const itemVariables = { ...variables, item };
      const result = await this.executeWorkflowStep(step, itemVariables);
      results.push(result);
    }

    return results;
  }

  private resolveVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      let resolved = obj;
      Object.entries(variables).forEach(([key, value]) => {
        resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      });
      return resolved;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveVariables(item, variables));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const resolved: any = {};
      Object.entries(obj).forEach(([key, value]) => {
        resolved[key] = this.resolveVariables(value, variables);
      });
      return resolved;
    }
    
    return obj;
  }

  // Category Management
  createCategory(category: Omit<TemplateCategory, 'id'>): TemplateCategory {
    const id = this.generateCategoryId();
    const newCategory: TemplateCategory = {
      ...category,
      id
    };

    this.categories.set(id, newCategory);
    this.emitEvent('category_created', newCategory);
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<TemplateCategory>): TemplateCategory | null {
    const category = this.categories.get(id);
    if (!category) return null;

    const updatedCategory: TemplateCategory = {
      ...category,
      ...updates
    };

    this.categories.set(id, updatedCategory);
    this.emitEvent('category_updated', updatedCategory);
    return updatedCategory;
  }

  deleteCategory(id: string): boolean {
    const category = this.categories.get(id);
    if (!category) return false;

    this.categories.delete(id);
    this.emitEvent('category_deleted', category);
    return true;
  }

  getCategory(id: string): TemplateCategory | undefined {
    return this.categories.get(id);
  }

  getCategories(): TemplateCategory[] {
    return Array.from(this.categories.values());
  }

  // Analytics
  getTemplateAnalytics(templateId: string): {
    usageCount: number;
    averageRating: number;
    recentUsage: TemplateUsage[];
    popularVariables: Record<string, number>;
  } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const usages = this.usage.get(templateId) || [];
    const recentUsage = usages.slice(-10).reverse();

    const popularVariables: Record<string, number> = {};
    usages.forEach(usage => {
      Object.keys(usage.variables).forEach(key => {
        popularVariables[key] = (popularVariables[key] || 0) + 1;
      });
    });

    return {
      usageCount: template.metadata.usageCount,
      averageRating: template.metadata.rating,
      recentUsage,
      popularVariables
    };
  }

  getWorkflowAnalytics(workflowId: string): {
    usageCount: number;
    averageCompletionTime: number;
    successRate: number;
    stepSuccessRates: Record<string, number>;
  } | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const stepSuccessRates: Record<string, number> = {};
    workflow.steps.forEach(step => {
      stepSuccessRates[step.id] = 0.95; // Placeholder - would track actual success rates
    });

    return {
      usageCount: workflow.metadata.usageCount,
      averageCompletionTime: workflow.metadata.averageCompletionTime,
      successRate: workflow.metadata.successRate,
      stepSuccessRates
    };
  }

  // Utility Methods
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkflowId(): string {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCategoryId(): string {
    return `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUsageId(): string {
    return `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const patch = parseInt(parts[2]) + 1;
    return `${major}.${minor}.${patch}`;
  }

  // Event System
  onEvent(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  offEvent(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in template event listener for ${eventType}:`, error);
      }
    });
  }

  // Export/Import
  exportTemplates(): string {
    const data = {
      templates: Array.from(this.templates.values()),
      categories: Array.from(this.categories.values()),
      workflows: Array.from(this.workflows.values())
    };
    return JSON.stringify(data, null, 2);
  }

  importTemplates(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.templates) {
        parsed.templates.forEach((template: NoteTemplate) => {
          this.templates.set(template.id, template);
        });
      }
      
      if (parsed.categories) {
        parsed.categories.forEach((category: TemplateCategory) => {
          this.categories.set(category.id, category);
        });
      }
      
      if (parsed.workflows) {
        parsed.workflows.forEach((workflow: NoteWorkflow) => {
          this.workflows.set(workflow.id, workflow);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import templates:', error);
      return false;
    }
  }
}

export const noteTemplatesService = new NoteTemplatesService(); 