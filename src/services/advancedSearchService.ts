import { Note } from '../types/domain';
import { SearchResult } from './searchService';
import { AdvancedQueryParser, SearchOperator, ParsedQuery } from './advancedQueryParser';

export interface AdvancedSearchOptions {
  maxResults?: number;
  includeBody?: boolean;
  caseSensitive?: boolean;
}

export interface AdvancedSearchResult extends SearchResult {
  queryInfo: {
    originalQuery: string;
    parsedQuery: ParsedQuery;
    executionTime: number;
  };
}

class AdvancedSearchService {
  private notes: Note[] = [];

  /**
   * Initialize the service with notes
   */
  initialize(notes: Note[]): void {
    this.notes = notes;
  }

  /**
   * Perform advanced search with query operators
   */
  search(
    query: string,
    options: AdvancedSearchOptions = {}
  ): AdvancedSearchResult[] {
    const startTime = performance.now();
    const { maxResults = 50, includeBody = true, caseSensitive = false } = options;

    if (!query.trim()) {
      return [];
    }

    // Parse the query
    const parsedQuery = AdvancedQueryParser.parse(query);
    if (!parsedQuery.isValid) {
      console.warn('Invalid search query:', parsedQuery.error);
      return [];
    }

    // Execute the parsed query
    const matchingNotes = this.executeQuery(parsedQuery.operators, options);
    
    // Convert to search results
    const results: AdvancedSearchResult[] = matchingNotes.map(note => ({
      noteId: note.id,
      title: note.title,
      body: includeBody ? note.body : '',
      tags: note.tags,
      score: 1.0, // Perfect match for advanced search
      matches: this.generateMatches(note, parsedQuery.operators, includeBody),
      queryInfo: {
        originalQuery: query,
        parsedQuery,
        executionTime: performance.now() - startTime
      }
    }));

    // Sort by relevance and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Execute a parsed query against the notes
   */
  private executeQuery(operators: SearchOperator[], options: AdvancedSearchOptions): Note[] {
    if (operators.length === 0) {
      return this.notes;
    }

    // If there's only one operator, execute it directly
    if (operators.length === 1) {
      return this.executeOperator(operators[0], options);
    }

    // For multiple operators, treat them as AND by default
    let result = this.executeOperator(operators[0], options);
    
    for (let i = 1; i < operators.length; i++) {
      const nextResult = this.executeOperator(operators[i], options);
      result = this.intersectNotes(result, nextResult);
    }

    return result;
  }

  /**
   * Execute a single operator
   */
  private executeOperator(operator: SearchOperator, options: AdvancedSearchOptions): Note[] {
    const { caseSensitive = false } = options;

    switch (operator.type) {
      case 'tag':
        return this.searchByTag(operator.value || '', caseSensitive);
      
      case 'title':
        return this.searchByTitle(operator.value || '', caseSensitive);
      
      case 'body':
        return this.searchByBody(operator.value || '', caseSensitive);
      
      case 'text':
        return this.searchByText(operator.value || '', caseSensitive);
      
      case 'and':
        if (!operator.children || operator.children.length < 2) {
          return [];
        }
        let result = this.executeOperator(operator.children[0], options);
        for (let i = 1; i < operator.children.length; i++) {
          const nextResult = this.executeOperator(operator.children[i], options);
          result = this.intersectNotes(result, nextResult);
        }
        return result;
      
      case 'or':
        if (!operator.children || operator.children.length < 2) {
          return [];
        }
        let orResult: Note[] = [];
        for (const child of operator.children) {
          const childResult = this.executeOperator(child, options);
          orResult = this.unionNotes(orResult, childResult);
        }
        return orResult;
      
      case 'not':
        if (!operator.children || operator.children.length === 0) {
          return this.notes;
        }
        const notResult = this.executeOperator(operator.children[0], options);
        return this.subtractNotes(this.notes, notResult);
      
      case 'group':
        if (!operator.children) {
          return [];
        }
        return this.executeQuery(operator.children, options);
      
      default:
        return [];
    }
  }

  /**
   * Search notes by tag
   */
  private searchByTag(tagQuery: string, caseSensitive: boolean): Note[] {
    const searchTag = caseSensitive ? tagQuery : tagQuery.toLowerCase();
    
    return this.notes.filter(note => {
      return note.tags.some(tag => {
        const noteTag = caseSensitive ? tag : tag.toLowerCase();
        return noteTag.includes(searchTag);
      });
    });
  }

  /**
   * Search notes by title
   */
  private searchByTitle(titleQuery: string, caseSensitive: boolean): Note[] {
    const searchTitle = caseSensitive ? titleQuery : titleQuery.toLowerCase();
    
    return this.notes.filter(note => {
      const noteTitle = caseSensitive ? note.title : note.title.toLowerCase();
      return noteTitle.includes(searchTitle);
    });
  }

  /**
   * Search notes by body content
   */
  private searchByBody(bodyQuery: string, caseSensitive: boolean): Note[] {
    const searchBody = caseSensitive ? bodyQuery : bodyQuery.toLowerCase();
    
    return this.notes.filter(note => {
      const noteBody = caseSensitive ? note.body : note.body.toLowerCase();
      return noteBody.includes(searchBody);
    });
  }

  /**
   * Search notes by text (any field)
   */
  private searchByText(textQuery: string, caseSensitive: boolean): Note[] {
    const searchText = caseSensitive ? textQuery : textQuery.toLowerCase();
    
    return this.notes.filter(note => {
      const title = caseSensitive ? note.title : note.title.toLowerCase();
      const body = caseSensitive ? note.body : note.body.toLowerCase();
      const tags = note.tags.map(tag => caseSensitive ? tag : tag.toLowerCase());
      
      return title.includes(searchText) ||
             body.includes(searchText) ||
             tags.some(tag => tag.includes(searchText));
    });
  }

  /**
   * Intersect two arrays of notes (AND operation)
   */
  private intersectNotes(notes1: Note[], notes2: Note[]): Note[] {
    const noteIds1 = new Set(notes1.map(note => note.id));
    return notes2.filter(note => noteIds1.has(note.id));
  }

  /**
   * Union two arrays of notes (OR operation)
   */
  private unionNotes(notes1: Note[], notes2: Note[]): Note[] {
    const allNotes = [...notes1, ...notes2];
    const seen = new Set<string>();
    return allNotes.filter(note => {
      if (seen.has(note.id)) {
        return false;
      }
      seen.add(note.id);
      return true;
    });
  }

  /**
   * Subtract notes2 from notes1 (NOT operation)
   */
  private subtractNotes(notes1: Note[], notes2: Note[]): Note[] {
    const noteIds2 = new Set(notes2.map(note => note.id));
    return notes1.filter(note => !noteIds2.has(note.id));
  }

  /**
   * Generate match information for search results
   */
  private generateMatches(
    note: Note,
    operators: SearchOperator[],
    includeBody: boolean
  ): SearchResult['matches'] {
    const matches: SearchResult['matches'] = [];

    for (const operator of operators) {
      if (operator.type === 'tag' && operator.value) {
        const matchingTags = note.tags.filter(tag => 
          tag.toLowerCase().includes(operator.value!.toLowerCase())
        );
        if (matchingTags.length > 0) {
          matches.push({
            type: 'tags',
            field: matchingTags.join(', '),
            indices: []
          });
        }
      } else if (operator.type === 'title' && operator.value) {
        if (note.title.toLowerCase().includes(operator.value.toLowerCase())) {
          matches.push({
            type: 'title',
            field: note.title,
            indices: []
          });
        }
      } else if (operator.type === 'body' && operator.value && includeBody) {
        if (note.body.toLowerCase().includes(operator.value.toLowerCase())) {
          matches.push({
            type: 'body',
            field: note.body.substring(0, 100) + '...',
            indices: []
          });
        }
      } else if (operator.type === 'text' && operator.value) {
        // Check all fields for text matches
        if (note.title.toLowerCase().includes(operator.value.toLowerCase())) {
          matches.push({
            type: 'title',
            field: note.title,
            indices: []
          });
        }
        if (includeBody && note.body.toLowerCase().includes(operator.value.toLowerCase())) {
          matches.push({
            type: 'body',
            field: note.body.substring(0, 100) + '...',
            indices: []
          });
        }
      }
    }

    return matches;
  }

  /**
   * Get search suggestions for advanced queries
   */
  getSuggestions(query: string): string[] {
    const availableTags = [...new Set(this.notes.flatMap(note => note.tags))];
    return AdvancedQueryParser.getSuggestions(query, availableTags);
  }

  /**
   * Validate a query string
   */
  validateQuery(query: string): { isValid: boolean; error?: string } {
    return AdvancedQueryParser.validate(query);
  }

  /**
   * Get query syntax help
   */
  getSyntaxHelp(): string[] {
    return [
      'tag:meeting - Search notes with "meeting" tag',
      'title:project - Search notes with "project" in title',
      'body:important - Search notes with "important" in body',
      'tag:work AND title:meeting - Notes with "work" tag AND "meeting" in title',
      'tag:personal OR tag:family - Notes with "personal" OR "family" tag',
      'NOT tag:archived - Notes without "archived" tag',
      '(tag:work OR tag:personal) AND title:urgent - Complex grouping',
      '"exact phrase" - Search for exact phrase'
    ];
  }
}

export const advancedSearchService = new AdvancedSearchService(); 