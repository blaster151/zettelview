import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { NoteTemplatesService } from '../noteTemplatesService';
import { NoteTemplate, WorkflowStep, TemplateVariable } from '../../types/templates';

describe('Note Templates Service - Workflow & Security Testing', () => {
  let templatesService: NoteTemplatesService;
  let mockTemplate: NoteTemplate;

  beforeEach(() => {
    templatesService = new NoteTemplatesService();
    
    mockTemplate = {
      id: 'test-template-1',
      name: 'Test Template',
      description: 'A test template',
      category: 'general',
      variables: [
        { name: 'title', type: 'string', required: true, defaultValue: '' },
        { name: 'content', type: 'text', required: true, defaultValue: '' },
        { name: 'tags', type: 'array', required: false, defaultValue: [] }
      ],
      workflow: [
        { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
        { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}' } },
        { id: 'step3', type: 'link_notes', config: { linkTo: '{{relatedNotes}}' } }
      ],
      content: '# {{title}}\n\n{{content}}\n\nTags: {{tags}}',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workflow Step Failures and Recovery', () => {
    test('should handle workflow step failures gracefully', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'invalid_step_type', config: { invalid: 'config' } },
          { id: 'step3', type: 'add_tags', config: { tags: '{{tags}}' } }
        ]
      };

      const variables = {
        title: 'Test Note',
        content: 'Test content',
        tags: ['test', 'example']
      };

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow step failed: step2');
      expect(result.failedStep).toBe('step2');
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).not.toContain('step3');
    });

    test('should implement step retry mechanism', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'network_operation', config: { url: '{{apiUrl}}' } },
          { id: 'step3', type: 'add_tags', config: { tags: '{{tags}}' } }
        ]
      };

      const variables = {
        title: 'Test Note',
        content: 'Test content',
        tags: ['test'],
        apiUrl: 'https://api.example.com'
      };

      // Mock network failure on first attempt
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await templatesService.applyTemplate(template.id, variables, { retryAttempts: 3 });

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).toContain('step2');
      expect(result.completedSteps).toContain('step3');
    });

    test('should handle partial workflow completion', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}' } },
          { id: 'step3', type: 'external_api_call', config: { endpoint: '{{apiEndpoint}}' } }
        ]
      };

      const variables = {
        title: 'Test Note',
        content: 'Test content',
        tags: ['test'],
        apiEndpoint: 'https://api.example.com/notes'
      };

      // Mock external API failure
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('API unavailable'));

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(false);
      expect(result.partialSuccess).toBe(true);
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).toContain('step2');
      expect(result.completedSteps).not.toContain('step3');
      expect(result.rollbackRequired).toBe(false);
    });

    test('should implement workflow rollback on critical failure', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'database_operation', config: { critical: true } },
          { id: 'step3', type: 'add_tags', config: { tags: '{{tags}}' } }
        ]
      };

      const variables = {
        title: 'Test Note',
        content: 'Test content',
        tags: ['test']
      };

      // Mock critical database failure
      vi.spyOn(templatesService, 'executeDatabaseOperation').mockRejectedValue(new Error('Database corruption'));

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(false);
      expect(result.rollbackRequired).toBe(true);
      expect(result.rollbackCompleted).toBe(true);
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).not.toContain('step2');
      expect(result.completedSteps).not.toContain('step3');
    });

    test('should handle workflow timeout scenarios', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'long_running_operation', config: { duration: 60000 } },
          { id: 'step3', type: 'add_tags', config: { tags: '{{tags}}' } }
        ]
      };

      const variables = {
        title: 'Test Note',
        content: 'Test content',
        tags: ['test']
      };

      const result = await templatesService.applyTemplate(template.id, variables, { timeout: 5000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Workflow timeout');
      expect(result.timedOutStep).toBe('step2');
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).not.toContain('step3');
    });
  });

  describe('Variable Injection Attacks', () => {
    test('should prevent script injection in variables', async () => {
      const maliciousVariables = {
        title: '<script>alert("XSS")</script>',
        content: '{{constructor.constructor("alert(\'XSS\')")()}}',
        tags: ['<img src=x onerror=alert(1)>', 'javascript:alert(1)']
      };

      const result = await templatesService.applyTemplate(mockTemplate.id, maliciousVariables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Malicious content detected in variables');
      expect(result.sanitizedVariables).toBeDefined();
      expect(result.sanitizedVariables.title).not.toContain('<script>');
      expect(result.sanitizedVariables.content).not.toContain('constructor');
    });

    test('should prevent template injection attacks', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        content: '{{title}}\n\n{{content}}\n\n{{userInput}}'
      };

      const maliciousVariables = {
        title: 'Normal Title',
        content: 'Normal content',
        userInput: '{{constructor.constructor("return process")().mainModule.require("child_process").execSync("rm -rf /")}}'
      };

      const result = await templatesService.applyTemplate(template.id, maliciousVariables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template injection detected');
      expect(result.blockedVariables).toContain('userInput');
    });

    test('should prevent NoSQL injection in template variables', async () => {
      const maliciousVariables = {
        title: 'Normal Title',
        content: 'Normal content',
        query: '{ "$where": "function() { return true; }" }',
        filter: '{ "username": { "$ne": null } }'
      };

      const result = await templatesService.applyTemplate(mockTemplate.id, maliciousVariables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('NoSQL injection detected');
      expect(result.blockedVariables).toContain('query');
      expect(result.blockedVariables).toContain('filter');
    });

    test('should prevent command injection in workflow steps', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'system_command', config: { command: '{{userCommand}}' } }
        ]
      };

      const maliciousVariables = {
        title: 'Normal Title',
        content: 'Normal content',
        userCommand: 'rm -rf /; echo "hacked"'
      };

      const result = await templatesService.applyTemplate(template.id, maliciousVariables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command injection detected');
      expect(result.blockedVariables).toContain('userCommand');
    });

    test('should prevent path traversal in file operations', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', content: '{{content}}' } },
          { id: 'step2', type: 'file_operation', config: { path: '{{filePath}}' } }
        ]
      };

      const maliciousVariables = {
        title: 'Normal Title',
        content: 'Normal content',
        filePath: '../../../etc/passwd'
      };

      const result = await templatesService.applyTemplate(template.id, maliciousVariables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Path traversal detected');
      expect(result.blockedVariables).toContain('filePath');
    });

    test('should prevent prototype pollution in template variables', async () => {
      const maliciousVariables = {
        title: 'Normal Title',
        content: 'Normal content',
        '__proto__': { isAdmin: true },
        'constructor': { prototype: { isAdmin: true } }
      };

      const result = await templatesService.applyTemplate(mockTemplate.id, maliciousVariables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Prototype pollution detected');
      expect(result.blockedVariables).toContain('__proto__');
      expect(result.blockedVariables).toContain('constructor');
    });
  });

  describe('Circular Workflow Dependencies', () => {
    test('should detect direct circular dependencies', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', dependsOn: 'step3' } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}', dependsOn: 'step1' } },
          { id: 'step3', type: 'link_notes', config: { linkTo: '{{relatedNotes}}', dependsOn: 'step2' } }
        ]
      };

      const result = await templatesService.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Circular dependency detected: step1 -> step3 -> step2 -> step1');
    });

    test('should detect indirect circular dependencies', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', dependsOn: 'step4' } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}', dependsOn: 'step1' } },
          { id: 'step3', type: 'link_notes', config: { linkTo: '{{relatedNotes}}', dependsOn: 'step2' } },
          { id: 'step4', type: 'validate_note', config: { dependsOn: 'step3' } }
        ]
      };

      const result = await templatesService.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Circular dependency detected: step1 -> step4 -> step3 -> step2 -> step1');
    });

    test('should detect self-referencing dependencies', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}', dependsOn: 'step1' } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}' } }
        ]
      };

      const result = await templatesService.validateTemplate(template);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Self-referencing dependency detected: step1');
    });

    test('should handle complex dependency chains', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}' } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}', dependsOn: 'step1' } },
          { id: 'step3', type: 'link_notes', config: { linkTo: '{{relatedNotes}}', dependsOn: 'step1' } },
          { id: 'step4', type: 'validate_note', config: { dependsOn: ['step2', 'step3'] } },
          { id: 'step5', type: 'publish_note', config: { dependsOn: 'step4' } }
        ]
      };

      const result = await templatesService.validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.executionOrder).toEqual(['step1', 'step2', 'step3', 'step4', 'step5']);
    });

    test('should resolve dependency conflicts', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}' } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}', dependsOn: 'step1' } },
          { id: 'step3', type: 'remove_tags', config: { tags: '{{removeTags}}', dependsOn: 'step2' } },
          { id: 'step4', type: 'add_tags', config: { tags: '{{finalTags}}', dependsOn: 'step3' } }
        ]
      };

      const result = await templatesService.validateTemplate(template);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('Potential tag conflict: step2 adds tags, step3 removes tags');
    });
  });

  describe('Performance with Complex Workflows', () => {
    test('should handle large workflow execution efficiently', async () => {
      const largeWorkflow = Array.from({ length: 100 }, (_, i) => ({
        id: `step${i + 1}`,
        type: 'simple_operation',
        config: { data: `{{data${i + 1}}}` },
        dependsOn: i > 0 ? `step${i}` : undefined
      }));

      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: largeWorkflow,
        variables: Array.from({ length: 100 }, (_, i) => ({
          name: `data${i + 1}`,
          type: 'string',
          required: true,
          defaultValue: `value${i + 1}`
        }))
      };

      const variables = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`data${i + 1}`, `value${i + 1}`])
      );

      const startTime = performance.now();
      const result = await templatesService.applyTemplate(template.id, variables);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.completedSteps.length).toBe(100);
    });

    test('should handle parallel workflow execution', async () => {
      const parallelWorkflow = [
        { id: 'step1', type: 'create_note', config: { title: '{{title}}' } },
        { id: 'step2a', type: 'add_tags', config: { tags: '{{tags}}' }, dependsOn: 'step1' },
        { id: 'step2b', type: 'add_metadata', config: { metadata: '{{metadata}}' }, dependsOn: 'step1' },
        { id: 'step2c', type: 'add_links', config: { links: '{{links}}' }, dependsOn: 'step1' },
        { id: 'step3', type: 'validate_note', config: {}, dependsOn: ['step2a', 'step2b', 'step2c'] }
      ];

      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: parallelWorkflow
      };

      const variables = {
        title: 'Test Note',
        tags: ['test', 'parallel'],
        metadata: { author: 'test', category: 'test' },
        links: ['link1', 'link2']
      };

      const startTime = performance.now();
      const result = await templatesService.applyTemplate(template.id, variables);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Parallel execution should be faster
      expect(result.completedSteps).toContain('step2a');
      expect(result.completedSteps).toContain('step2b');
      expect(result.completedSteps).toContain('step2c');
    });

    test('should handle memory usage with complex templates', async () => {
      const complexTemplate: NoteTemplate = {
        ...mockTemplate,
        content: '{{' + '{{'.repeat(1000) + 'title' + '}}'.repeat(1000) + '}}',
        variables: Array.from({ length: 1000 }, (_, i) => ({
          name: `var${i}`,
          type: 'string',
          required: true,
          defaultValue: `default${i}`
        }))
      };

      const variables = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`var${i}`, `value${i}`])
      );

      const initialMemory = performance.memory?.usedJSHeapSize || 0;
      
      const result = await templatesService.applyTemplate(complexTemplate.id, variables);
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      expect(result.success).toBe(true);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });

    test('should handle concurrent template applications', async () => {
      const templates = Array.from({ length: 10 }, (_, i) => ({
        ...mockTemplate,
        id: `template-${i}`,
        name: `Template ${i}`
      }));

      const variables = {
        title: 'Concurrent Test',
        content: 'Test content',
        tags: ['concurrent', 'test']
      };

      const startTime = performance.now();
      
      const results = await Promise.all(
        templates.map(template => templatesService.applyTemplate(template.id, variables))
      );
      
      const endTime = performance.now();

      expect(results.every(r => r.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle workflow caching efficiently', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'expensive_operation', config: { cache: true } },
          { id: 'step2', type: 'add_tags', config: { tags: '{{tags}}' }, dependsOn: 'step1' }
        ]
      };

      const variables = {
        title: 'Cache Test',
        content: 'Test content',
        tags: ['cache', 'test']
      };

      // First execution
      const startTime1 = performance.now();
      const result1 = await templatesService.applyTemplate(template.id, variables);
      const endTime1 = performance.now();
      const time1 = endTime1 - startTime1;

      // Second execution (should use cache)
      const startTime2 = performance.now();
      const result2 = await templatesService.applyTemplate(template.id, variables);
      const endTime2 = performance.now();
      const time2 = endTime2 - startTime2;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(time2).toBeLessThan(time1 * 0.5); // Cached execution should be at least 50% faster
    });
  });

  describe('Template Validation Edge Cases', () => {
    test('should handle deeply nested variable references', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        content: '{{title}}\n\n{{content}}\n\n{{nested1}}\n\n{{nested2}}',
        variables: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'text', required: true },
          { name: 'nested1', type: 'string', required: true },
          { name: 'nested2', type: 'string', required: true }
        ]
      };

      const variables = {
        title: 'Test Title',
        content: 'Test content',
        nested1: '{{title}} - nested reference',
        nested2: '{{content}} - another nested reference'
      };

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(true);
      expect(result.processedContent).toContain('Test Title - nested reference');
      expect(result.processedContent).toContain('Test content - another nested reference');
    });

    test('should handle missing optional variables', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        content: '{{title}}\n\n{{content}}\n\n{{optionalVar}}',
        variables: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'text', required: true },
          { name: 'optionalVar', type: 'string', required: false, defaultValue: 'Default Value' }
        ]
      };

      const variables = {
        title: 'Test Title',
        content: 'Test content'
        // optionalVar is missing
      };

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(true);
      expect(result.processedContent).toContain('Default Value');
    });

    test('should handle variable type validation', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        variables: [
          { name: 'title', type: 'text', required: true },
          { name: 'count', type: 'number', required: true },
          { name: 'tags', type: 'multiselect', required: true, options: ['tag1', 'tag2'] },
          { name: 'metadata', type: 'text', required: true }
        ]
      };

      const invalidVariables = {
        title: 123, // Should be string
        count: 'not a number', // Should be number
        tags: 'not an array', // Should be array
        metadata: 'not an object' // Should be string
      };

      const result = await templatesService.applyTemplate(template.id, invalidVariables);

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('title: Expected string, got number');
      expect(result.validationErrors).toContain('count: Expected number, got string');
      expect(result.validationErrors).toContain('tags: Expected array, got string');
      expect(result.validationErrors).toContain('metadata: Expected string, got string');
    });

    test('should handle template recursion limits', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        content: '{{recursiveVar}}',
        variables: [
          { name: 'title', type: 'string', required: true },
          { name: 'recursiveVar', type: 'string', required: true }
        ]
      };

      const variables = {
        title: 'Test Title',
        recursiveVar: '{{recursiveVar}}' // Self-referencing
      };

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recursion limit exceeded');
    });

    test('should handle template size limits', async () => {
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB content
      
      const template: NoteTemplate = {
        ...mockTemplate,
        content: largeContent,
        variables: [
          { name: 'title', type: 'string', required: true }
        ]
      };

      const variables = {
        title: 'Large Template Test'
      };

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Template size exceeds limit');
    });

    test('should handle special characters in template content', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        content: '{{title}}\n\n{{content}}\n\nSpecial chars: {{&<>"\'}}\n\nUnicode: {{unicode}}',
        variables: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'text', required: true },
          { name: '&<>"\'', type: 'string', required: true },
          { name: 'unicode', type: 'string', required: true }
        ]
      };

      const variables = {
        title: 'Test Title',
        content: 'Test content',
        '&<>"\'': '&<>"\'',
        unicode: '🚀🌟🎉'
      };

      const result = await templatesService.applyTemplate(template.id, variables);

      expect(result.success).toBe(true);
      expect(result.processedContent).toContain('&<>"\'');
      expect(result.processedContent).toContain('🚀🌟🎉');
    });

    test('should handle conditional workflow steps', async () => {
      const template: NoteTemplate = {
        ...mockTemplate,
        workflow: [
          { id: 'step1', type: 'create_note', config: { title: '{{title}}' } },
          { id: 'step2', type: 'conditional_step', config: { condition: '{{addTags}}', action: 'add_tags' } },
          { id: 'step3', type: 'validate_note', config: {} }
        ],
        variables: [
          { name: 'title', type: 'string', required: true },
          { name: 'addTags', type: 'boolean', required: true }
        ]
      };

      // Test with condition true
      const variablesTrue = {
        title: 'Test Title',
        addTags: true
      };

      const resultTrue = await templatesService.applyTemplate(template.id, variablesTrue);
      expect(resultTrue.success).toBe(true);
      expect(resultTrue.completedSteps).toContain('step2');

      // Test with condition false
      const variablesFalse = {
        title: 'Test Title',
        addTags: false
      };

      const resultFalse = await templatesService.applyTemplate(template.id, variablesFalse);
      expect(resultFalse.success).toBe(true);
      expect(resultFalse.completedSteps).not.toContain('step2');
    });
  });
}); 