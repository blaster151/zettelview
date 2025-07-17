import { AdvancedQueryParser, SearchOperator, ParsedQuery } from './advancedQueryParser';

describe('AdvancedQueryParser', () => {
  describe('parse', () => {
    test('should parse empty query', () => {
      const result = AdvancedQueryParser.parse('');
      expect(result.isValid).toBe(true);
      expect(result.operators).toEqual([]);
    });

    test('should parse simple text query', () => {
      const result = AdvancedQueryParser.parse('hello world');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(2);
      expect(result.operators[0]).toEqual({ type: 'text', value: 'hello' });
      expect(result.operators[1]).toEqual({ type: 'text', value: 'world' });
    });

    test('should parse tag operator', () => {
      const result = AdvancedQueryParser.parse('tag:meeting');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({ type: 'tag', value: 'meeting' });
    });

    test('should parse title operator', () => {
      const result = AdvancedQueryParser.parse('title:project');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({ type: 'title', value: 'project' });
    });

    test('should parse body operator', () => {
      const result = AdvancedQueryParser.parse('body:important');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({ type: 'body', value: 'important' });
    });

    test('should parse quoted strings', () => {
      const result = AdvancedQueryParser.parse('"exact phrase"');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({ type: 'text', value: 'exact phrase' });
    });

    test('should parse AND operator', () => {
      const result = AdvancedQueryParser.parse('tag:work AND title:meeting');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({
        type: 'and',
        children: [
          { type: 'tag', value: 'work' },
          { type: 'title', value: 'meeting' }
        ]
      });
    });

    test('should parse OR operator', () => {
      const result = AdvancedQueryParser.parse('tag:personal OR tag:family');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({
        type: 'or',
        children: [
          { type: 'tag', value: 'personal' },
          { type: 'tag', value: 'family' }
        ]
      });
    });

    test('should parse NOT operator', () => {
      const result = AdvancedQueryParser.parse('NOT tag:archived');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({
        type: 'not',
        children: [{ type: 'tag', value: 'archived' }]
      });
    });

    test('should parse grouped expressions', () => {
      const result = AdvancedQueryParser.parse('(tag:work OR tag:personal) AND title:urgent');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({
        type: 'and',
        children: [
          {
            type: 'group',
            children: [
              {
                type: 'or',
                children: [
                  { type: 'tag', value: 'work' },
                  { type: 'tag', value: 'personal' }
                ]
              }
            ]
          },
          { type: 'title', value: 'urgent' }
        ]
      });
    });

    test('should handle complex nested expressions', () => {
      const result = AdvancedQueryParser.parse('tag:work AND (title:meeting OR title:project) AND NOT tag:archived');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0].type).toBe('and');
    });

    test('should handle case insensitive operators', () => {
      const result = AdvancedQueryParser.parse('TAG:work AND title:meeting');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0].type).toBe('and');
    });

    test('should handle whitespace around operators', () => {
      const result = AdvancedQueryParser.parse('tag:work  AND  title:meeting');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0].type).toBe('and');
    });

    test('should handle multiple spaces in tag values', () => {
      const result = AdvancedQueryParser.parse('tag:work meeting');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0]).toEqual({ type: 'tag', value: 'work meeting' });
    });
  });

  describe('validation', () => {
    test('should validate correct queries', () => {
      const validQueries = [
        'tag:work',
        'title:meeting',
        'tag:work AND title:meeting',
        '(tag:work OR tag:personal) AND title:urgent',
        'NOT tag:archived',
        '"exact phrase"'
      ];

      validQueries.forEach(query => {
        const result = AdvancedQueryParser.validate(query);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    test('should reject invalid AND usage', () => {
      const result = AdvancedQueryParser.parse('AND title:meeting');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('AND must have a left operand');
    });

    test('should reject invalid OR usage', () => {
      const result = AdvancedQueryParser.parse('OR title:meeting');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('OR must have a left operand');
    });

    test('should reject invalid NOT usage', () => {
      const result = AdvancedQueryParser.parse('NOT');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('NOT operator must have an operand');
    });

    test('should reject unmatched parentheses', () => {
      const result = AdvancedQueryParser.parse('(tag:work AND title:meeting');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unmatched opening parenthesis');
    });

    test('should reject empty parentheses', () => {
      const result = AdvancedQueryParser.parse('()');
      expect(result.isValid).toBe(true);
      expect(result.operators).toHaveLength(1);
      expect(result.operators[0].type).toBe('group');
    });
  });

  describe('stringify', () => {
    test('should stringify simple operators', () => {
      const operators: SearchOperator[] = [
        { type: 'tag', value: 'work' },
        { type: 'title', value: 'meeting' }
      ];
      const result = AdvancedQueryParser.stringify(operators);
      expect(result).toBe('tag:work title:meeting');
    });

    test('should stringify AND operator', () => {
      const operators: SearchOperator[] = [{
        type: 'and',
        children: [
          { type: 'tag', value: 'work' },
          { type: 'title', value: 'meeting' }
        ]
      }];
      const result = AdvancedQueryParser.stringify(operators);
      expect(result).toBe('tag:work AND title:meeting');
    });

    test('should stringify OR operator', () => {
      const operators: SearchOperator[] = [{
        type: 'or',
        children: [
          { type: 'tag', value: 'personal' },
          { type: 'tag', value: 'family' }
        ]
      }];
      const result = AdvancedQueryParser.stringify(operators);
      expect(result).toBe('tag:personal OR tag:family');
    });

    test('should stringify NOT operator', () => {
      const operators: SearchOperator[] = [{
        type: 'not',
        children: [{ type: 'tag', value: 'archived' }]
      }];
      const result = AdvancedQueryParser.stringify(operators);
      expect(result).toBe('NOT tag:archived');
    });

    test('should stringify grouped expressions', () => {
      const operators: SearchOperator[] = [{
        type: 'and',
        children: [
          {
            type: 'group',
            children: [{
              type: 'or',
              children: [
                { type: 'tag', value: 'work' },
                { type: 'tag', value: 'personal' }
              ]
            }]
          },
          { type: 'title', value: 'urgent' }
        ]
      }];
      const result = AdvancedQueryParser.stringify(operators);
      expect(result).toBe('(tag:work OR tag:personal) AND title:urgent');
    });
  });

  describe('getSuggestions', () => {
    const availableTags = ['work', 'personal', 'family', 'meeting', 'project'];

    test('should suggest operators for empty query', () => {
      const suggestions = AdvancedQueryParser.getSuggestions('', availableTags);
      expect(suggestions).toContain('tag:');
      expect(suggestions).toContain('title:');
      expect(suggestions).toContain('body:');
      expect(suggestions).toContain('AND');
      expect(suggestions).toContain('OR');
      expect(suggestions).toContain('NOT');
    });

    test('should suggest operators after space', () => {
      const suggestions = AdvancedQueryParser.getSuggestions('hello ', availableTags);
      expect(suggestions).toContain('AND');
      expect(suggestions).toContain('OR');
      expect(suggestions).toContain('NOT');
    });

    test('should suggest tags for tag operator', () => {
      const suggestions = AdvancedQueryParser.getSuggestions('tag:w', availableTags);
      expect(suggestions).toContain('tag:work');
      expect(suggestions).toContain('tag:meeting');
    });

    test('should suggest common patterns for title operator', () => {
      const suggestions = AdvancedQueryParser.getSuggestions('title:', availableTags);
      expect(suggestions).toContain('title:meeting');
      expect(suggestions).toContain('title:project');
    });

    test('should suggest common patterns for body operator', () => {
      const suggestions = AdvancedQueryParser.getSuggestions('body:', availableTags);
      expect(suggestions).toContain('body:important');
      expect(suggestions).toContain('body:todo');
    });

    test('should limit suggestions to 5', () => {
      const suggestions = AdvancedQueryParser.getSuggestions('', availableTags);
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });
  });

  describe('validate', () => {
    test('should validate correct queries', () => {
      const validQueries = [
        'tag:work',
        'title:meeting',
        'tag:work AND title:meeting',
        'NOT tag:archived'
      ];

      validQueries.forEach(query => {
        const result = AdvancedQueryParser.validate(query);
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject invalid queries', () => {
      const invalidQueries = [
        'AND title:meeting',
        'OR title:meeting',
        'NOT',
        '(tag:work'
      ];

      invalidQueries.forEach(query => {
        const result = AdvancedQueryParser.validate(query);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
}); 