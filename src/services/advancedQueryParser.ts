export interface SearchOperator {
  type: 'tag' | 'title' | 'body' | 'text' | 'and' | 'or' | 'not' | 'group';
  value?: string;
  children?: SearchOperator[];
  negated?: boolean;
}

export interface ParsedQuery {
  operators: SearchOperator[];
  originalQuery: string;
  isValid: boolean;
  error?: string;
}

export class AdvancedQueryParser {
  private static readonly OPERATORS = {
    TAG: 'tag:',
    TITLE: 'title:',
    BODY: 'body:',
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT'
  };

  private static readonly REGEX_PATTERNS = {
    // Match operators with their values
    TAG_OPERATOR: /^tag:\s*([^\s()]+(?:\s+[^\s()]+)*)/i,
    TITLE_OPERATOR: /^title:\s*([^\s()]+(?:\s+[^\s()]+)*)/i,
    BODY_OPERATOR: /^body:\s*([^\s()]+(?:\s+[^\s()]+)*)/i,
    // Match logical operators
    LOGICAL_OPERATOR: /^(AND|OR|NOT)\s+/i,
    // Match parentheses
    OPEN_PAREN: /^\(\s*/,
    CLOSE_PAREN: /^\)\s*/,
    // Match quoted strings
    QUOTED_STRING: /^"([^"]*)"\s*/,
    // Match regular text
    TEXT: /^([^\s()]+)\s*/
  };

  /**
   * Parse a search query string into structured operators
   */
  static parse(query: string): ParsedQuery {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return {
        operators: [],
        originalQuery: query,
        isValid: true
      };
    }

    try {
      const operators = this.parseOperators(trimmedQuery);
      return {
        operators,
        originalQuery: query,
        isValid: true
      };
    } catch (error) {
      return {
        operators: [],
        originalQuery: query,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error'
      };
    }
  }

  /**
   * Parse operators from a query string
   */
  private static parseOperators(query: string): SearchOperator[] {
    const operators: SearchOperator[] = [];
    let remainingQuery = query;
    let currentOperator: SearchOperator | null = null;

    while (remainingQuery.trim()) {
      const result = this.parseNextOperator(remainingQuery);
      if (!result) break;

      const { operator, consumed } = result;
      remainingQuery = remainingQuery.substring(consumed);

      if (operator.type === 'and' || operator.type === 'or') {
        // Logical operator - should have left and right operands
        if (operators.length === 0) {
          throw new Error(`Logical operator ${operator.type.toUpperCase()} must have a left operand`);
        }
        
        // Parse the right operand
        const rightOperand = this.parseOperators(remainingQuery);
        if (rightOperand.length === 0) {
          throw new Error(`Logical operator ${operator.type.toUpperCase()} must have a right operand`);
        }

        operator.children = [operators.pop()!, ...rightOperand];
        operators.push(operator);
        
        // Update remaining query (consumed by parseOperators)
        remainingQuery = '';
      } else if (operator.type === 'not') {
        // NOT operator - should have one operand
        const operand = this.parseOperators(remainingQuery);
        if (operand.length === 0) {
          throw new Error('NOT operator must have an operand');
        }

        operator.children = operand;
        operators.push(operator);
        remainingQuery = '';
      } else {
        // Regular operator (tag, title, body, text)
        operators.push(operator);
      }
    }

    return operators;
  }

  /**
   * Parse the next operator from the query string
   */
  private static parseNextOperator(query: string): { operator: SearchOperator; consumed: number } | null {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) return null;

    // Check for parentheses
    if (this.REGEX_PATTERNS.OPEN_PAREN.test(trimmedQuery)) {
      const consumed = trimmedQuery.match(this.REGEX_PATTERNS.OPEN_PAREN)![0].length;
      const remainingQuery = trimmedQuery.substring(consumed);
      
      // Find matching closing parenthesis
      let depth = 1;
      let endIndex = 0;
      
      for (let i = 0; i < remainingQuery.length; i++) {
        if (remainingQuery[i] === '(') depth++;
        else if (remainingQuery[i] === ')') {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (depth !== 0) {
        throw new Error('Unmatched opening parenthesis');
      }

      const groupContent = remainingQuery.substring(0, endIndex);
      const groupOperators = this.parseOperators(groupContent);

      return {
        operator: {
          type: 'group',
          children: groupOperators
        },
        consumed: consumed + endIndex + 1
      };
    }

    // Check for quoted strings
    const quotedMatch = trimmedQuery.match(this.REGEX_PATTERNS.QUOTED_STRING);
    if (quotedMatch) {
      return {
        operator: {
          type: 'text',
          value: quotedMatch[1]
        },
        consumed: quotedMatch[0].length
      };
    }

    // Check for tag operator
    const tagMatch = trimmedQuery.match(this.REGEX_PATTERNS.TAG_OPERATOR);
    if (tagMatch) {
      return {
        operator: {
          type: 'tag',
          value: tagMatch[1]
        },
        consumed: tagMatch[0].length
      };
    }

    // Check for title operator
    const titleMatch = trimmedQuery.match(this.REGEX_PATTERNS.TITLE_OPERATOR);
    if (titleMatch) {
      return {
        operator: {
          type: 'title',
          value: titleMatch[1]
        },
        consumed: titleMatch[0].length
      };
    }

    // Check for body operator
    const bodyMatch = trimmedQuery.match(this.REGEX_PATTERNS.BODY_OPERATOR);
    if (bodyMatch) {
      return {
        operator: {
          type: 'body',
          value: bodyMatch[1]
        },
        consumed: bodyMatch[0].length
      };
    }

    // Check for logical operators
    const logicalMatch = trimmedQuery.match(this.REGEX_PATTERNS.LOGICAL_OPERATOR);
    if (logicalMatch) {
      const operatorType = logicalMatch[1].toLowerCase() as 'and' | 'or' | 'not';
      return {
        operator: {
          type: operatorType
        },
        consumed: logicalMatch[0].length
      };
    }

    // Check for regular text
    const textMatch = trimmedQuery.match(this.REGEX_PATTERNS.TEXT);
    if (textMatch) {
      return {
        operator: {
          type: 'text',
          value: textMatch[1]
        },
        consumed: textMatch[0].length
      };
    }

    return null;
  }

  /**
   * Convert parsed operators back to a query string
   */
  static stringify(operators: SearchOperator[]): string {
    return operators.map(op => this.operatorToString(op)).join(' ');
  }

  /**
   * Convert a single operator to string
   */
  private static operatorToString(operator: SearchOperator): string {
    switch (operator.type) {
      case 'tag':
        return `tag:${operator.value}`;
      case 'title':
        return `title:${operator.value}`;
      case 'body':
        return `body:${operator.value}`;
      case 'text':
        return operator.value || '';
      case 'and':
        if (!operator.children || operator.children.length < 2) {
          return '';
        }
        return operator.children.map(child => this.operatorToString(child)).join(' AND ');
      case 'or':
        if (!operator.children || operator.children.length < 2) {
          return '';
        }
        return operator.children.map(child => this.operatorToString(child)).join(' OR ');
      case 'not':
        if (!operator.children || operator.children.length === 0) {
          return '';
        }
        return `NOT ${this.operatorToString(operator.children[0])}`;
      case 'group':
        if (!operator.children || operator.children.length === 0) {
          return '()';
        }
        return `(${operator.children.map(child => this.operatorToString(child)).join(' ')})`;
      default:
        return '';
    }
  }

  /**
   * Get search suggestions based on the current query
   */
  static getSuggestions(query: string, availableTags: string[]): string[] {
    const suggestions: string[] = [];
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      // Suggest common operators
      suggestions.push('tag:', 'title:', 'body:', 'AND', 'OR', 'NOT');
      return suggestions;
    }

    // If query ends with space, suggest operators
    if (trimmedQuery.endsWith(' ')) {
      suggestions.push('AND', 'OR', 'NOT');
      return suggestions;
    }

    // If query starts with tag:, suggest available tags
    if (trimmedQuery.toLowerCase().startsWith('tag:')) {
      const tagPrefix = trimmedQuery.substring(4).toLowerCase();
      const matchingTags = availableTags.filter(tag => 
        tag.toLowerCase().includes(tagPrefix)
      );
      suggestions.push(...matchingTags.map(tag => `tag:${tag}`));
    }

    // If query starts with title:, suggest common title patterns
    if (trimmedQuery.toLowerCase().startsWith('title:')) {
      suggestions.push('title:meeting', 'title:project', 'title:idea');
    }

    // If query starts with body:, suggest common body patterns
    if (trimmedQuery.toLowerCase().startsWith('body:')) {
      suggestions.push('body:important', 'body:todo', 'body:reference');
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Validate a query string
   */
  static validate(query: string): { isValid: boolean; error?: string } {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      return { isValid: true };
    }

    // Check for standalone NOT operator
    if (trimmedQuery.toUpperCase() === 'NOT') {
      return { 
        isValid: false, 
        error: 'NOT operator must have an operand' 
      };
    }

    try {
      const parsed = this.parse(query);
      return { isValid: parsed.isValid, error: parsed.error };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown validation error' 
      };
    }
  }
} 