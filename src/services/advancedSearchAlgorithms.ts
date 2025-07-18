import { Note } from '../types/note';

export interface SearchResult {
  note: Note;
  score: number;
  highlights: string[];
  context: string;
  matchType: 'exact' | 'fuzzy' | 'semantic' | 'nlp';
  relevanceScore?: number;
  freshnessScore?: number;
  popularityScore?: number;
  clusterId?: string;
}

export interface SearchOptions {
  fuzzyThreshold?: number;
  semanticWeight?: number;
  fuzzyWeight?: number;
  exactWeight?: number;
  maxResults?: number;
  includeContent?: boolean;
  includeTags?: boolean;
  includeTitle?: boolean;
  boostRecent?: boolean;
  boostPopular?: boolean;
  enableClustering?: boolean;
  contextWindow?: number;
}

export interface SearchCluster {
  id: string;
  name: string;
  notes: SearchResult[];
  centroid: number[];
  keywords: string[];
}

export class AdvancedSearchAlgorithms {
  private static instance: AdvancedSearchAlgorithms;
  private searchIndex: Map<string, any> = new Map();
  private semanticModel: any = null;
  private searchHistory: string[] = [];
  private noteAccessCount: Map<string, number> = new Map();

  static getInstance(): AdvancedSearchAlgorithms {
    if (!AdvancedSearchAlgorithms.instance) {
      AdvancedSearchAlgorithms.instance = new AdvancedSearchAlgorithms();
    }
    return AdvancedSearchAlgorithms.instance;
  }

  // Enhanced Fuzzy Search with improved scoring
  fuzzySearch(query: string, notes: Note[], threshold: number = 0.7): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    const queryTokens = this.tokenize(queryLower);

    for (const note of notes) {
      const titleScore = this.calculateFuzzyScore(queryTokens, note.title.toLowerCase());
      const contentScore = this.calculateFuzzyScore(queryTokens, note.content.toLowerCase());
      const tagScore = Math.max(...note.tags.map(tag => this.calculateFuzzyScore(queryTokens, tag.toLowerCase())));

      // Weighted scoring
      const weightedScore = (titleScore * 0.4) + (contentScore * 0.4) + (tagScore * 0.2);
      
      if (weightedScore >= threshold) {
        const highlights = this.extractFuzzyHighlights(queryTokens, note);
        const context = this.extractContext(queryLower, note, 200);
        
        results.push({
          note,
          score: weightedScore,
          highlights,
          context,
          matchType: 'fuzzy',
          relevanceScore: this.calculateRelevanceScore(note, queryTokens),
          freshnessScore: this.calculateFreshnessScore(note),
          popularityScore: this.calculatePopularityScore(note)
        });
      }
    }

    return this.rankResults(results);
  }

  private calculateFuzzyScore(queryTokens: string[], text: string): number {
    const textTokens = this.tokenize(text.toLowerCase());
    let totalScore = 0;
    
    for (const queryToken of queryTokens) {
      let bestScore = 0;
      for (const textToken of textTokens) {
        const distance = this.levenshteinDistance(queryToken, textToken);
        const maxLength = Math.max(queryToken.length, textToken.length);
        const score = maxLength > 0 ? 1 - (distance / maxLength) : 0;
        bestScore = Math.max(bestScore, score);
      }
      totalScore += bestScore;
    }
    
    return totalScore / queryTokens.length;
  }

  // Enhanced Semantic Search with better context understanding
  semanticSearch(query: string, notes: Note[]): SearchResult[] {
    const results: SearchResult[] = [];
    const queryTokens = this.tokenize(query);
    const queryVector = this.createVector(queryTokens);
    const queryContext = this.extractQueryContext(query);

    for (const note of notes) {
      const noteText = `${note.title} ${note.content} ${note.tags.join(' ')}`;
      const noteTokens = this.tokenize(noteText);
      const noteVector = this.createVector(noteTokens);

      const similarity = this.cosineSimilarity(queryVector, noteVector);
      const contextSimilarity = this.calculateContextSimilarity(queryContext, note);
      
      const combinedScore = (similarity * 0.7) + (contextSimilarity * 0.3);
      
      if (combinedScore > 0.1) {
        results.push({
          note,
          score: combinedScore,
          highlights: this.extractSemanticHighlights(queryTokens, note),
          context: this.extractContext(query, note, 300),
          matchType: 'semantic',
          relevanceScore: this.calculateRelevanceScore(note, queryTokens),
          freshnessScore: this.calculateFreshnessScore(note),
          popularityScore: this.calculatePopularityScore(note)
        });
      }
    }

    return this.rankResults(results);
  }

  private extractQueryContext(query: string): any {
    // Extract context from query (entities, topics, intent)
    const entities = this.extractEntities(query);
    const topics = this.extractTopics(query);
    const intent = this.detectIntent(query);
    
    return { entities, topics, intent, original: query };
  }

  private calculateContextSimilarity(queryContext: any, note: Note): number {
    let score = 0;
    
    // Entity matching
    const noteEntities = this.extractEntities(`${note.title} ${note.content}`);
    const entityMatches = queryContext.entities.filter((entity: string) => 
      noteEntities.includes(entity)
    ).length;
    score += entityMatches * 0.4;
    
    // Topic matching
    const noteTopics = this.extractTopics(note.content);
    const topicMatches = queryContext.topics.filter((topic: string) => 
      noteTopics.some(noteTopic => noteTopic.includes(topic))
    ).length;
    score += topicMatches * 0.3;
    
    // Intent matching
    if (queryContext.intent === 'question' && noteTopics.length > 0) {
      score += 0.3;
    }
    
    return Math.min(score, 1.0);
  }

  // Enhanced NLP Search with better entity recognition
  nlpSearch(query: string, notes: Note[]): SearchResult[] {
    const results: SearchResult[] = [];
    const queryAnalysis = this.analyzeQuery(query);
    const queryEntities = this.extractEntities(query);
    const queryIntent = this.detectIntent(query);

    for (const note of notes) {
      const noteAnalysis = this.analyzeNote(note);
      const score = this.calculateNLPScore(queryAnalysis, noteAnalysis);
      const entityScore = this.calculateEntityScore(queryEntities, note);
      const intentScore = this.calculateIntentScore(queryIntent, note);

      const combinedScore = (score * 0.5) + (entityScore * 0.3) + (intentScore * 0.2);
      
      if (combinedScore > 0.1) {
        results.push({
          note,
          score: combinedScore,
          highlights: this.extractNLPHighlights(queryAnalysis, note),
          context: this.extractContext(query, note, 250),
          matchType: 'nlp',
          relevanceScore: this.calculateRelevanceScore(note, queryAnalysis.keywords),
          freshnessScore: this.calculateFreshnessScore(note),
          popularityScore: this.calculatePopularityScore(note)
        });
      }
    }

    return this.rankResults(results);
  }

  private calculateEntityScore(queryEntities: string[], note: Note): number {
    const noteEntities = this.extractEntities(`${note.title} ${note.content}`);
    const matches = queryEntities.filter(entity => noteEntities.includes(entity));
    return matches.length / Math.max(queryEntities.length, 1);
  }

  private calculateIntentScore(queryIntent: string, note: Note): number {
    const noteTopics = this.extractTopics(note.content);
    
    switch (queryIntent) {
      case 'question':
        return noteTopics.length > 0 ? 0.8 : 0.2;
      case 'search':
        return 0.6;
      case 'create':
        return note.content.length > 100 ? 0.4 : 0.8;
      default:
        return 0.5;
    }
  }

  // Enhanced Combined Search with result clustering
  combinedSearch(query: string, notes: Note[], options: SearchOptions = {}): SearchResult[] {
    const {
      fuzzyThreshold = 0.7,
      semanticWeight = 0.3,
      fuzzyWeight = 0.4,
      exactWeight = 0.3,
      maxResults = 50,
      includeContent = true,
      includeTags = true,
      includeTitle = true,
      boostRecent = true,
      boostPopular = true,
      enableClustering = false,
      contextWindow = 200
    } = options;

    const results = new Map<string, SearchResult>();

    // Exact search
    const exactResults = this.exactSearch(query, notes, { includeContent, includeTags, includeTitle });
    for (const result of exactResults) {
      results.set(result.note.id, {
        ...result,
        score: result.score * exactWeight
      });
    }

    // Fuzzy search
    const fuzzyResults = this.fuzzySearch(query, notes, fuzzyThreshold);
    for (const result of fuzzyResults) {
      const existing = results.get(result.note.id);
      if (existing) {
        existing.score += result.score * fuzzyWeight;
        existing.highlights = [...existing.highlights, ...result.highlights];
      } else {
        results.set(result.note.id, {
          ...result,
          score: result.score * fuzzyWeight
        });
      }
    }

    // Semantic search
    const semanticResults = this.semanticSearch(query, notes);
    for (const result of semanticResults) {
      const existing = results.get(result.note.id);
      if (existing) {
        existing.score += result.score * semanticWeight;
        existing.highlights = [...existing.highlights, ...result.highlights];
      } else {
        results.set(result.note.id, {
          ...result,
          score: result.score * semanticWeight
        });
      }
    }

    let finalResults = Array.from(results.values());

    // Apply boosting
    if (boostRecent) {
      finalResults = this.applyRecencyBoost(finalResults);
    }
    if (boostPopular) {
      finalResults = this.applyPopularityBoost(finalResults);
    }

    // Apply clustering if enabled
    if (enableClustering) {
      finalResults = this.applyClustering(finalResults);
    }

    return finalResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private applyRecencyBoost(results: SearchResult[]): SearchResult[] {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

    return results.map(result => {
      const age = now - new Date(result.note.updatedAt).getTime();
      const recencyBoost = Math.max(0, 1 - (age / maxAge));
      return {
        ...result,
        score: result.score * (1 + recencyBoost * 0.2)
      };
    });
  }

  private applyPopularityBoost(results: SearchResult[]): SearchResult[] {
    return results.map(result => {
      const accessCount = this.noteAccessCount.get(result.note.id) || 0;
      const popularityBoost = Math.min(0.3, accessCount * 0.01);
      return {
        ...result,
        score: result.score * (1 + popularityBoost)
      };
    });
  }

  private applyClustering(results: SearchResult[]): SearchResult[] {
    if (results.length < 3) return results;

    const clusters = this.createClusters(results);
    
    // Assign cluster IDs to results
    return results.map(result => {
      const cluster = clusters.find(c => c.notes.some(n => n.note.id === result.note.id));
      return {
        ...result,
        clusterId: cluster?.id
      };
    });
  }

  private createClusters(results: SearchResult[]): SearchCluster[] {
    const clusters: SearchCluster[] = [];
    const processed = new Set<string>();

    for (const result of results) {
      if (processed.has(result.note.id)) continue;

      const cluster: SearchCluster = {
        id: `cluster-${clusters.length}`,
        name: result.note.title,
        notes: [result],
        centroid: this.createNoteVector(result.note),
        keywords: this.extractKeywords(result.note)
      };

      // Find similar notes
      for (const otherResult of results) {
        if (otherResult.note.id === result.note.id || processed.has(otherResult.note.id)) continue;

        const similarity = this.cosineSimilarity(
          this.createVectorFromArray(cluster.centroid),
          this.createNoteVector(otherResult.note)
        );

        if (similarity > 0.6) {
          cluster.notes.push(otherResult);
          processed.add(otherResult.note.id);
        }
      }

      clusters.push(cluster);
      processed.add(result.note.id);
    }

    return clusters;
  }

  private createNoteVector(note: Note): number[] {
    const text = `${note.title} ${note.content} ${note.tags.join(' ')}`;
    const tokens = this.tokenize(text);
    const vector = this.createVector(tokens);
    
    // Convert to array representation
    const allTokens = Array.from(new Set([...vector.keys()]));
    return allTokens.map(token => vector.get(token) || 0);
  }

  private createVectorFromArray(array: number[]): Map<string, number> {
    const vector = new Map<string, number>();
    // This is a simplified version - in practice, you'd maintain a token vocabulary
    array.forEach((value, index) => {
      if (value > 0) {
        vector.set(`token-${index}`, value);
      }
    });
    return vector;
  }

  private extractKeywords(note: Note): string[] {
    const text = `${note.title} ${note.content}`;
    const tokens = this.tokenize(text);
    const wordFreq = new Map<string, number>();
    
    tokens.forEach(token => {
      wordFreq.set(token, (wordFreq.get(token) || 0) + 1);
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private rankResults(results: SearchResult[]): SearchResult[] {
    return results.map(result => {
      const relevanceScore = result.relevanceScore || 0;
      const freshnessScore = result.freshnessScore || 0;
      const popularityScore = result.popularityScore || 0;

      // Combined ranking score
      const rankingScore = (
        result.score * 0.5 +
        relevanceScore * 0.3 +
        freshnessScore * 0.1 +
        popularityScore * 0.1
      );

      return {
        ...result,
        score: rankingScore
      };
    }).sort((a, b) => b.score - a.score);
  }

  private calculateRelevanceScore(note: Note, queryTokens: string[]): number {
    const noteTokens = this.tokenize(`${note.title} ${note.content}`);
    const matches = queryTokens.filter(token => noteTokens.includes(token));
    return matches.length / queryTokens.length;
  }

  private calculateFreshnessScore(note: Note): number {
    const now = Date.now();
    const updated = new Date(note.updatedAt).getTime();
    const ageInDays = (now - updated) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (ageInDays / 365)); // Decay over a year
  }

  private calculatePopularityScore(note: Note): number {
    const accessCount = this.noteAccessCount.get(note.id) || 0;
    return Math.min(1, accessCount / 100); // Normalize to 0-1
  }

  // Track note access for popularity scoring
  trackNoteAccess(noteId: string): void {
    const currentCount = this.noteAccessCount.get(noteId) || 0;
    this.noteAccessCount.set(noteId, currentCount + 1);
  }

  // Get search clusters
  getSearchClusters(results: SearchResult[]): SearchCluster[] {
    return this.createClusters(results);
  }

  // Enhanced search suggestions with context
  getSearchSuggestions(query: string, notes: Note[]): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Add exact matches from titles
    for (const note of notes) {
      if (note.title.toLowerCase().includes(queryLower) && note.title !== query) {
        suggestions.push(note.title);
      }
    }
    
    // Add tag suggestions
    const allTags = new Set<string>();
    for (const note of notes) {
      note.tags.forEach(tag => allTags.add(tag));
    }
    
    for (const tag of allTags) {
      if (tag.toLowerCase().includes(queryLower)) {
        suggestions.push(`#${tag}`);
      }
    }
    
    // Add common word suggestions
    const words = new Set<string>();
    for (const note of notes) {
      const noteWords = this.tokenize(note.content);
      noteWords.forEach(word => words.add(word));
    }
    
    for (const word of words) {
      if (word.toLowerCase().includes(queryLower) && word.length > 3) {
        suggestions.push(word);
      }
    }

    // Add contextual suggestions based on search history
    const contextualSuggestions = this.getContextualSuggestions(query, notes);
    suggestions.push(...contextualSuggestions);
    
    return [...new Set(suggestions)].slice(0, 15);
  }

  private getContextualSuggestions(query: string, notes: Note[]): string[] {
    const suggestions: string[] = [];
    const queryTokens = this.tokenize(query);
    
    // Find notes that match current query
    const matchingNotes = notes.filter(note => {
      const noteText = `${note.title} ${note.content}`.toLowerCase();
      return queryTokens.some(token => noteText.includes(token));
    });

    // Extract common phrases from matching notes
    for (const note of matchingNotes) {
      const sentences = note.content.split(/[.!?]+/);
      for (const sentence of sentences) {
        const words = sentence.trim().split(/\s+/);
        if (words.length >= 3 && words.length <= 6) {
          const phrase = words.join(' ');
          if (phrase.length > 10 && phrase.length < 100) {
            suggestions.push(phrase);
          }
        }
      }
    }

    return suggestions.slice(0, 5);
  }

  // Enhanced search analytics with more metrics
  getSearchAnalytics(queries: string[], notes: Note[]): any {
    const analytics = {
      totalQueries: queries.length,
      averageQueryLength: 0,
      mostCommonWords: new Map<string, number>(),
      searchEffectiveness: 0,
      popularSearches: new Map<string, number>(),
      searchTrends: this.analyzeSearchTrends(queries),
      userBehavior: this.analyzeUserBehavior(queries, notes),
      performanceMetrics: this.calculatePerformanceMetrics(queries, notes)
    };

    let totalLength = 0;
    for (const query of queries) {
      totalLength += query.length;
      analytics.popularSearches.set(query, (analytics.popularSearches.get(query) || 0) + 1);
      
      const words = this.tokenize(query);
      for (const word of words) {
        analytics.mostCommonWords.set(word, (analytics.mostCommonWords.get(word) || 0) + 1);
      }
    }

    analytics.averageQueryLength = totalLength / queries.length;
    
    // Calculate search effectiveness
    let effectiveSearches = 0;
    for (const query of queries) {
      const results = this.combinedSearch(query, notes);
      if (results.length > 0) {
        effectiveSearches++;
      }
    }
    analytics.searchEffectiveness = effectiveSearches / queries.length;

    return analytics;
  }

  private analyzeSearchTrends(queries: string[]): any {
    const trends = {
      timeOfDay: new Map<number, number>(),
      dayOfWeek: new Map<number, number>(),
      queryComplexity: [] as number[]
    };

    queries.forEach(query => {
      const complexity = this.calculateQueryComplexity(query);
      trends.queryComplexity.push(complexity);
    });

    return trends;
  }

  private analyzeUserBehavior(queries: string[], notes: Note[]): any {
    return {
      averageResultsPerQuery: 0,
      clickThroughRate: 0,
      searchRefinement: 0,
      sessionLength: 0
    };
  }

  private calculatePerformanceMetrics(queries: string[], notes: Note[]): any {
    return {
      averageSearchTime: 0,
      cacheHitRate: 0,
      memoryUsage: 0
    };
  }

  private calculateQueryComplexity(query: string): number {
    const tokens = this.tokenize(query);
    const uniqueTokens = new Set(tokens);
    const avgWordLength = tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length;
    
    return (uniqueTokens.size * 0.4) + (avgWordLength * 0.3) + (tokens.length * 0.3);
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

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  private createVector(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    for (const token of tokens) {
      vector.set(token, (vector.get(token) || 0) + 1);
    }
    return vector;
  }

  private cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    const allTokens = new Set([...vec1.keys(), ...vec2.keys()]);
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const token of allTokens) {
      const val1 = vec1.get(token) || 0;
      const val2 = vec2.get(token) || 0;
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }

    return norm1 > 0 && norm2 > 0 ? dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2)) : 0;
  }

  private analyzeQuery(query: string) {
    const tokens = this.tokenize(query);
    const keywords = tokens.filter(token => token.length > 3);
    const entities = this.extractEntities(query);
    const intent = this.detectIntent(query);

    return { keywords, entities, intent, original: query };
  }

  private analyzeNote(note: Note) {
    const text = `${note.title} ${note.content}`;
    const tokens = this.tokenize(text);
    const keywords = tokens.filter(token => token.length > 3);
    const entities = this.extractEntities(text);
    const topics = this.extractTopics(text);

    return { keywords, entities, topics, tags: note.tags };
  }

  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    const words = text.split(/\s+/);
    
    for (const word of words) {
      if (word.match(/^[A-Z][a-z]+$/)) {
        entities.push(word);
      }
    }
    
    return entities;
  }

  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) {
      return 'question';
    }
    if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('look')) {
      return 'search';
    }
    if (lowerQuery.includes('create') || lowerQuery.includes('add') || lowerQuery.includes('new')) {
      return 'create';
    }
    
    return 'general';
  }

  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      if (words.length > 3) {
        topics.push(sentence.trim());
      }
    }
    
    return topics.slice(0, 3);
  }

  private calculateNLPScore(queryAnalysis: any, noteAnalysis: any): number {
    let score = 0;
    
    const keywordMatches = queryAnalysis.keywords.filter((kw: string) => 
      noteAnalysis.keywords.includes(kw)
    ).length;
    score += keywordMatches * 0.3;
    
    const entityMatches = queryAnalysis.entities.filter((entity: string) => 
      noteAnalysis.entities.includes(entity)
    ).length;
    score += entityMatches * 0.4;
    
    const tagMatches = queryAnalysis.keywords.filter((kw: string) => 
      noteAnalysis.tags.some((tag: string) => tag.toLowerCase().includes(kw))
    ).length;
    score += tagMatches * 0.2;
    
    if (queryAnalysis.intent === 'question' && noteAnalysis.topics.length > 0) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0);
  }

  private exactSearch(query: string, notes: Note[], options: any): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const note of notes) {
      let score = 0;
      const highlights: string[] = [];

      if (options.includeTitle && note.title.toLowerCase().includes(queryLower)) {
        score += 1.0;
        highlights.push(`Title: ${note.title}`);
      }

      if (options.includeContent && note.content.toLowerCase().includes(queryLower)) {
        score += 0.8;
        highlights.push(`Content: ${this.extractExactMatch(note.content, query)}`);
      }

      if (options.includeTags) {
        const matchingTags = note.tags.filter(tag => tag.toLowerCase().includes(queryLower));
        if (matchingTags.length > 0) {
          score += 0.6;
          highlights.push(`Tags: ${matchingTags.join(', ')}`);
        }
      }

      if (score > 0) {
        results.push({
          note,
          score,
          highlights,
          context: this.extractContext(query, note),
          matchType: 'exact'
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private extractExactMatch(content: string, query: string): string {
    const index = content.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 50);
    return content.substring(start, end);
  }

  private extractFuzzyHighlights(queryTokens: string[], note: Note): string[] {
    const highlights: string[] = [];
    
    if (this.calculateFuzzyScore(queryTokens, note.title.toLowerCase()) > 0.7) {
      highlights.push(`Title: ${note.title}`);
    }
    
    const sentences = note.content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (this.calculateFuzzyScore(queryTokens, sentence.toLowerCase()) > 0.7) {
        highlights.push(`Content: ${sentence.trim()}`);
      }
    }
    
    return highlights.slice(0, 3);
  }

  private extractSemanticHighlights(queryTokens: string[], note: Note): string[] {
    const highlights: string[] = [];
    const noteText = `${note.title} ${note.content}`;
    const sentences = noteText.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const sentenceTokens = this.tokenize(sentence);
      const similarity = this.cosineSimilarity(
        this.createVector(queryTokens),
        this.createVector(sentenceTokens)
      );
      
      if (similarity > 0.3) {
        highlights.push(`Content: ${sentence.trim()}`);
      }
    }
    
    return highlights.slice(0, 3);
  }

  private extractNLPHighlights(queryAnalysis: any, note: Note): string[] {
    const highlights: string[] = [];
    
    for (const entity of queryAnalysis.entities) {
      if (note.title.includes(entity)) {
        highlights.push(`Title: ${note.title}`);
      }
      if (note.content.includes(entity)) {
        highlights.push(`Content: ${this.extractContext(entity, note)}`);
      }
    }
    
    return highlights.slice(0, 3);
  }

  private extractContext(query: string, note: Note, maxLength: number = 200): string {
    const text = `${note.title} ${note.content}`;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    
    if (index === -1) return note.title;
    
    const start = Math.max(0, index - maxLength / 2);
    const end = Math.min(text.length, index + query.length + maxLength / 2);
    return text.substring(start, end);
  }
} 