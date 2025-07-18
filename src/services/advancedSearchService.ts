import { Note } from '../types/domain';

export interface SearchResult {
  note: Note;
  relevance: number;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'nlp';
  highlights: Array<{
    field: 'title' | 'body' | 'tags';
    text: string;
    start: number;
    end: number;
  }>;
  metadata: {
    wordCount: number;
    tagMatches: string[];
    contentType: string;
    lastModified: Date;
  };
}

export interface SearchQuery {
  text: string;
  filters: {
    tags?: string[];
    dateRange?: { start: Date; end: Date };
    contentType?: string[];
    minWords?: number;
    maxWords?: number;
  };
  options: {
    fuzzy: boolean;
    semantic: boolean;
    nlp: boolean;
    caseSensitive: boolean;
    wholeWord: boolean;
  };
}

export interface SemanticVector {
  id: string;
  vector: number[];
  keywords: string[];
  topics: string[];
}

class AdvancedSearchService {
  private notes: Note[] = [];
  private semanticVectors: Map<string, SemanticVector> = new Map();
  private wordIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private nlpProcessor: NLProcessor;

  constructor() {
    this.nlpProcessor = new NLProcessor();
  }

  initialize(notes: Note[]): void {
    this.notes = notes;
    this.buildIndexes();
    this.generateSemanticVectors();
  }

  // Advanced search with multiple algorithms
  search(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];

    // 1. Exact match search
    if (!query.options.fuzzy && !query.options.semantic && !query.options.nlp) {
      results.push(...this.exactSearch(query));
    }

    // 2. Fuzzy search
    if (query.options.fuzzy) {
      results.push(...this.fuzzySearch(query));
    }

    // 3. Semantic search
    if (query.options.semantic) {
      results.push(...this.semanticSearch(query));
    }

    // 4. NLP-enhanced search
    if (query.options.nlp) {
      results.push(...this.nlpSearch(query));
    }

    // 5. Apply filters
    const filteredResults = this.applyFilters(results, query.filters);

    // 6. Deduplicate and sort by relevance
    return this.deduplicateAndSort(filteredResults);
  }

  // Exact match search
  private exactSearch(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const searchTerms = this.tokenize(query.text, query.options.caseSensitive);

    this.notes.forEach(note => {
      const titleMatches = this.findExactMatches(note.title, searchTerms, query.options);
      const bodyMatches = this.findExactMatches(note.body, searchTerms, query.options);
      const tagMatches = this.findTagMatches(note.tags, searchTerms, query.options);

      if (titleMatches.length > 0 || bodyMatches.length > 0 || tagMatches.length > 0) {
        const relevance = this.calculateExactRelevance(titleMatches, bodyMatches, tagMatches);
        results.push({
          note,
          relevance,
          matchType: 'exact',
          highlights: [...titleMatches, ...bodyMatches, ...tagMatches],
          metadata: this.generateMetadata(note, tagMatches)
        });
      }
    });

    return results;
  }

  // Fuzzy search using Levenshtein distance
  private fuzzySearch(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const searchTerms = this.tokenize(query.text, query.options.caseSensitive);
    const maxDistance = 2; // Maximum edit distance for fuzzy matching

    this.notes.forEach(note => {
      const titleMatches = this.findFuzzyMatches(note.title, searchTerms, maxDistance);
      const bodyMatches = this.findFuzzyMatches(note.body, searchTerms, maxDistance);
      const tagMatches = this.findFuzzyTagMatches(note.tags, searchTerms, maxDistance);

      if (titleMatches.length > 0 || bodyMatches.length > 0 || tagMatches.length > 0) {
        const relevance = this.calculateFuzzyRelevance(titleMatches, bodyMatches, tagMatches, maxDistance);
        results.push({
          note,
          relevance,
          matchType: 'fuzzy',
          highlights: [...titleMatches, ...bodyMatches, ...tagMatches],
          metadata: this.generateMetadata(note, tagMatches)
        });
      }
    });

    return results;
  }

  // Semantic search using vector similarity
  private semanticSearch(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const queryVector = this.nlpProcessor.generateQueryVector(query.text);

    this.notes.forEach(note => {
      const noteVector = this.semanticVectors.get(note.id);
      if (noteVector) {
        const similarity = this.calculateCosineSimilarity(queryVector, noteVector.vector);
        if (similarity > 0.3) { // Threshold for semantic relevance
          const highlights = this.generateSemanticHighlights(note, query.text);
          results.push({
            note,
            relevance: similarity,
            matchType: 'semantic',
            highlights,
            metadata: this.generateMetadata(note, [])
          });
        }
      }
    });

    return results;
  }

  // NLP-enhanced search with natural language understanding
  private nlpSearch(query: SearchQuery): SearchResult[] {
    const results: SearchResult[] = [];
    const nlpQuery = this.nlpProcessor.processQuery(query.text);

    this.notes.forEach(note => {
      const nlpScore = this.calculateNLPScore(note, nlpQuery);
      if (nlpScore > 0.2) { // Threshold for NLP relevance
        const highlights = this.generateNLPHighlights(note, nlpQuery);
        results.push({
          note,
          relevance: nlpScore,
          matchType: 'nlp',
          highlights,
          metadata: this.generateMetadata(note, [])
        });
      }
    });

    return results;
  }

  // Build search indexes for performance
  private buildIndexes(): void {
    this.wordIndex.clear();
    this.tagIndex.clear();

    this.notes.forEach(note => {
      // Index words from title and body
      const words = this.tokenize(`${note.title} ${note.body}`, false);
      words.forEach(word => {
        if (!this.wordIndex.has(word)) {
          this.wordIndex.set(word, new Set());
        }
        this.wordIndex.get(word)!.add(note.id);
      });

      // Index tags
      note.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(note.id);
      });
    });
  }

  // Generate semantic vectors for notes
  private generateSemanticVectors(): void {
    this.semanticVectors.clear();

    this.notes.forEach(note => {
      const vector = this.nlpProcessor.generateNoteVector(note);
      const keywords = this.nlpProcessor.extractKeywords(note.body);
      const topics = this.nlpProcessor.extractTopics(note.body);

      this.semanticVectors.set(note.id, {
        id: note.id,
        vector,
        keywords,
        topics
      });
    });
  }

  // Helper methods
  private tokenize(text: string, caseSensitive: boolean): string[] {
    const processed = caseSensitive ? text : text.toLowerCase();
    return processed
      .match(/\b\w+\b/g) || []
      .filter(word => word.length > 2);
  }

  private findExactMatches(text: string, searchTerms: string[], options: any): any[] {
    const matches: any[] = [];
    const processedText = options.caseSensitive ? text : text.toLowerCase();

    searchTerms.forEach(term => {
      let index = 0;
      while ((index = processedText.indexOf(term, index)) !== -1) {
        matches.push({
          field: 'body',
          text: text.substring(index, index + term.length),
          start: index,
          end: index + term.length
        });
        index += 1;
      }
    });

    return matches;
  }

  private findTagMatches(tags: string[], searchTerms: string[], options: any): any[] {
    const matches: any[] = [];
    const processedTags = options.caseSensitive ? tags : tags.map(tag => tag.toLowerCase());

    searchTerms.forEach(term => {
      processedTags.forEach((tag, index) => {
        if (tag.includes(term)) {
          matches.push({
            field: 'tags',
            text: tags[index],
            start: 0,
            end: tags[index].length
          });
        }
      });
    });

    return matches;
  }

  private findFuzzyMatches(text: string, searchTerms: string[], maxDistance: number): any[] {
    const matches: any[] = [];
    const words = this.tokenize(text, false);

    searchTerms.forEach(term => {
      words.forEach(word => {
        const distance = this.levenshteinDistance(term, word);
        if (distance <= maxDistance && distance < word.length) {
          const index = text.toLowerCase().indexOf(word);
          if (index !== -1) {
            matches.push({
              field: 'body',
              text: text.substring(index, index + word.length),
              start: index,
              end: index + word.length,
              distance
            });
          }
        }
      });
    });

    return matches;
  }

  private findFuzzyTagMatches(tags: string[], searchTerms: string[], maxDistance: number): any[] {
    const matches: any[] = [];

    searchTerms.forEach(term => {
      tags.forEach(tag => {
        const distance = this.levenshteinDistance(term.toLowerCase(), tag.toLowerCase());
        if (distance <= maxDistance && distance < tag.length) {
          matches.push({
            field: 'tags',
            text: tag,
            start: 0,
            end: tag.length,
            distance
          });
        }
      });
    });

    return matches;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateExactRelevance(titleMatches: any[], bodyMatches: any[], tagMatches: any[]): number {
    const titleScore = titleMatches.length * 0.4;
    const bodyScore = bodyMatches.length * 0.3;
    const tagScore = tagMatches.length * 0.3;
    return Math.min(1.0, (titleScore + bodyScore + tagScore) / 10);
  }

  private calculateFuzzyRelevance(titleMatches: any[], bodyMatches: any[], tagMatches: any[], maxDistance: number): number {
    const titleScore = titleMatches.reduce((sum, match) => sum + (1 - match.distance / maxDistance), 0) * 0.4;
    const bodyScore = bodyMatches.reduce((sum, match) => sum + (1 - match.distance / maxDistance), 0) * 0.3;
    const tagScore = tagMatches.reduce((sum, match) => sum + (1 - match.distance / maxDistance), 0) * 0.3;
    return Math.min(1.0, (titleScore + bodyScore + tagScore) / 10);
  }

  private calculateCosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private calculateNLPScore(note: Note, nlpQuery: any): number {
    // Simplified NLP scoring based on query understanding
    const titleScore = this.nlpProcessor.calculateSemanticSimilarity(note.title, nlpQuery.intent) * 0.4;
    const bodyScore = this.nlpProcessor.calculateSemanticSimilarity(note.body, nlpQuery.intent) * 0.4;
    const tagScore = this.nlpProcessor.calculateTagRelevance(note.tags, nlpQuery.entities) * 0.2;
    
    return titleScore + bodyScore + tagScore;
  }

  private generateSemanticHighlights(note: Note, query: string): any[] {
    // Generate highlights based on semantic similarity
    const highlights: any[] = [];
    const keywords = this.nlpProcessor.extractKeywords(query);
    
    keywords.forEach(keyword => {
      const index = note.body.toLowerCase().indexOf(keyword.toLowerCase());
      if (index !== -1) {
        highlights.push({
          field: 'body',
          text: note.body.substring(index, index + keyword.length),
          start: index,
          end: index + keyword.length
        });
      }
    });

    return highlights;
  }

  private generateNLPHighlights(note: Note, nlpQuery: any): any[] {
    // Generate highlights based on NLP understanding
    const highlights: any[] = [];
    
    nlpQuery.entities.forEach((entity: string) => {
      const index = note.body.toLowerCase().indexOf(entity.toLowerCase());
      if (index !== -1) {
        highlights.push({
          field: 'body',
          text: note.body.substring(index, index + entity.length),
          start: index,
          end: index + entity.length
        });
      }
    });

    return highlights;
  }

  private generateMetadata(note: Note, tagMatches: any[]): any {
    return {
      wordCount: this.tokenize(note.body, false).length,
      tagMatches: tagMatches.map(match => match.text),
      contentType: this.classifyContentType(note.body),
      lastModified: note.updatedAt
    };
  }

  private classifyContentType(text: string): string {
    const words = this.tokenize(text, false);
    const technicalTerms = words.filter(word => 
      /^(api|function|variable|class|method|algorithm|database|server|client|protocol|interface|framework|library|dependency|configuration|deployment|testing|debugging|optimization|scalability|security)$/.test(word)
    ).length;
    
    const formalTerms = words.filter(word => 
      /^(therefore|however|furthermore|moreover|consequently|nevertheless|accordingly|subsequently|previously|aforementioned)$/.test(word)
    ).length;
    
    const creativeTerms = words.filter(word => 
      /^(imagine|dream|wonder|fantasy|magical|beautiful|amazing|incredible|wonderful|fantastic|brilliant|stunning|gorgeous|magnificent|spectacular)$/.test(word)
    ).length;

    if (technicalTerms > words.length * 0.1) return 'Technical';
    if (formalTerms > words.length * 0.05) return 'Formal';
    if (creativeTerms > words.length * 0.05) return 'Creative';
    return 'General';
  }

  private applyFilters(results: SearchResult[], filters: any): SearchResult[] {
    return results.filter(result => {
      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag: string) => 
          result.note.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const noteDate = new Date(result.note.updatedAt);
        if (noteDate < filters.dateRange.start || noteDate > filters.dateRange.end) {
          return false;
        }
      }

      // Content type filter
      if (filters.contentType && filters.contentType.length > 0) {
        if (!filters.contentType.includes(result.metadata.contentType)) {
          return false;
        }
      }

      // Word count filter
      if (filters.minWords && result.metadata.wordCount < filters.minWords) {
        return false;
      }
      if (filters.maxWords && result.metadata.wordCount > filters.maxWords) {
        return false;
      }

      return true;
    });
  }

  private deduplicateAndSort(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    const uniqueResults = results.filter(result => {
      const key = result.note.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueResults.sort((a, b) => b.relevance - a.relevance);
  }

  // Public API methods
  getSearchSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const words = this.tokenize(query, false);

    words.forEach(word => {
      // Find similar words in the index
      for (const [indexWord, noteIds] of this.wordIndex.entries()) {
        if (this.levenshteinDistance(word, indexWord) <= 2) {
          suggestions.push(indexWord);
        }
      }
    });

    return [...new Set(suggestions)].slice(0, 10);
  }

  getSearchStats(): { totalIndexedWords: number; totalIndexedTags: number; semanticVectors: number } {
    return {
      totalIndexedWords: this.wordIndex.size,
      totalIndexedTags: this.tagIndex.size,
      semanticVectors: this.semanticVectors.size
    };
  }

  clearIndexes(): void {
    this.wordIndex.clear();
    this.tagIndex.clear();
    this.semanticVectors.clear();
  }
}

// NLP Processor for semantic analysis
class NLProcessor {
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  generateQueryVector(query: string): number[] {
    // Simplified vector generation for query
    const words = this.tokenize(query);
    const vector = new Array(100).fill(0); // 100-dimensional vector
    
    words.forEach((word, index) => {
      if (index < 100) {
        vector[index] = this.calculateWordWeight(word);
      }
    });

    return vector;
  }

  generateNoteVector(note: Note): number[] {
    // Simplified vector generation for note
    const words = this.tokenize(note.body);
    const vector = new Array(100).fill(0);
    
    words.forEach((word, index) => {
      if (index < 100) {
        vector[index] = this.calculateWordWeight(word);
      }
    });

    return vector;
  }

  processQuery(query: string): any {
    // Simplified NLP query processing
    const words = this.tokenize(query);
    const entities = this.extractEntities(words);
    const intent = this.determineIntent(query);

    return {
      original: query,
      tokens: words,
      entities,
      intent,
      keywords: this.extractKeywords(query)
    };
  }

  extractKeywords(text: string): string[] {
    const words = this.tokenize(text);
    return words
      .filter(word => !this.stopWords.has(word) && word.length > 3)
      .slice(0, 10);
  }

  extractTopics(text: string): string[] {
    // Simplified topic extraction
    const words = this.tokenize(text);
    const topicWords = words.filter(word => 
      word.length > 5 && !this.stopWords.has(word)
    );
    return [...new Set(topicWords)].slice(0, 5);
  }

  calculateSemanticSimilarity(text1: string, text2: string): number {
    // Simplified semantic similarity calculation
    const words1 = this.tokenize(text1);
    const words2 = this.tokenize(text2);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]);
    
    return totalWords.size > 0 ? commonWords.length / totalWords.size : 0;
  }

  calculateTagRelevance(tags: string[], entities: string[]): number {
    const matchingTags = tags.filter(tag => 
      entities.some(entity => 
        tag.toLowerCase().includes(entity.toLowerCase()) ||
        entity.toLowerCase().includes(tag.toLowerCase())
      )
    );
    
    return tags.length > 0 ? matchingTags.length / tags.length : 0;
  }

  extractEntities(words: string[]): string[] {
    // Simplified entity extraction
    return words.filter(word => 
      word.length > 3 && 
      !this.stopWords.has(word) &&
      /^[A-Z]/.test(word) // Capitalized words as potential entities
    );
  }

  determineIntent(query: string): string {
    // Simplified intent determination
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) {
      return 'question';
    }
    if (lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('new')) {
      return 'creation';
    }
    if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('look')) {
      return 'search';
    }
    
    return 'general';
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .match(/\b\w+\b/g) || []
      .filter(word => word.length > 2);
  }

  private calculateWordWeight(word: string): number {
    // Simplified word weight calculation
    if (this.stopWords.has(word)) return 0.1;
    if (word.length > 6) return 0.8;
    if (word.length > 4) return 0.6;
    return 0.4;
  }
}

export const AdvancedSearchService = new AdvancedSearchService(); 