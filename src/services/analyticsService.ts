import { Note } from '../types/domain';

export interface NoteAnalytics {
  totalNotes: number;
  totalWords: number;
  totalCharacters: number;
  averageNoteLength: number;
  averageWordsPerNote: number;
  noteGrowthRate: number;
  mostActiveDay: string;
  mostActiveHour: number;
  topTags: Array<{ tag: string; count: number; percentage: number }>;
  contentTypes: Array<{ type: string; count: number; percentage: number }>;
  productivityScore: number;
  writingStreak: number;
  longestNote: { id: string; title: string; length: number };
  shortestNote: { id: string; title: string; length: number };
  mostLinkedNote: { id: string; title: string; linkCount: number };
  tagDiversity: number;
  contentComplexity: number;
  readingTime: number;
  writingTime: number;
}

export interface ContentAnalysis {
  vocabularyRichness: number;
  averageSentenceLength: number;
  averageParagraphLength: number;
  readabilityScore: number;
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
    overall: 'positive' | 'neutral' | 'negative';
  };
  topicClusters: Array<{
    topic: string;
    notes: string[];
    frequency: number;
    keywords: string[];
  }>;
  writingStyle: {
    formal: number;
    casual: number;
    technical: number;
    creative: number;
  };
  complexityMetrics: {
    fleschReadingEase: number;
    fleschKincaidGrade: number;
    gunningFogIndex: number;
  };
}

export interface ProductivityMetrics {
  dailyStats: Array<{
    date: string;
    notesCreated: number;
    wordsWritten: number;
    timeSpent: number;
    productivityScore: number;
  }>;
  weeklyTrends: Array<{
    week: string;
    averageNotesPerDay: number;
    averageWordsPerDay: number;
    totalTimeSpent: number;
    consistencyScore: number;
  }>;
  monthlyInsights: Array<{
    month: string;
    totalNotes: number;
    totalWords: number;
    growthRate: number;
    topTags: string[];
    mostProductiveDay: string;
  }>;
  streaks: {
    currentWritingStreak: number;
    longestWritingStreak: number;
    currentReadingStreak: number;
    longestReadingStreak: number;
    bestDay: string;
    bestWeek: string;
  };
  goals: {
    dailyGoal: number;
    weeklyGoal: number;
    monthlyGoal: number;
    dailyProgress: number;
    weeklyProgress: number;
    monthlyProgress: number;
    goalCompletionRate: number;
  };
}

export interface TrendAnalysis {
  noteCreationTrend: Array<{ date: string; count: number; cumulative: number }>;
  wordCountTrend: Array<{ date: string; words: number; average: number }>;
  tagUsageTrend: Array<{ date: string; tags: Record<string, number> }>;
  contentTypeTrend: Array<{ date: string; types: Record<string, number> }>;
  productivityTrend: Array<{ date: string; score: number; movingAverage: number }>;
  seasonalPatterns: {
    dayOfWeek: Record<string, number>;
    hourOfDay: Record<string, number>;
    monthOfYear: Record<string, number>;
  };
  growthPredictions: Array<{ date: string; predictedNotes: number; confidence: number }>;
}

export interface ComparativeAnalysis {
  periodComparison: {
    current: NoteAnalytics;
    previous: NoteAnalytics;
    improvement: {
      notesGrowth: number;
      wordsGrowth: number;
      productivityGrowth: number;
      tagDiversityGrowth: number;
    };
  };
  benchmarkComparison: {
    personalBest: NoteAnalytics;
    averageUser: NoteAnalytics;
    percentile: number;
  };
}

class AnalyticsService {
  private notes: Note[] = [];
  private cache = new Map<string, any>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  initialize(notes: Note[]): void {
    this.notes = notes;
    this.cache.clear();
  }

  // Get comprehensive note analytics
  getNoteAnalytics(): NoteAnalytics {
    const cacheKey = 'noteAnalytics';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const totalNotes = this.notes.length;
    const totalWords = this.notes.reduce((sum, note) => sum + this.getWordCount(note.body), 0);
    const totalCharacters = this.notes.reduce((sum, note) => sum + note.body.length, 0);
    const averageNoteLength = totalNotes > 0 ? totalCharacters / totalNotes : 0;
    const averageWordsPerNote = totalNotes > 0 ? totalWords / totalNotes : 0;

    // Calculate note growth rate (notes per day over last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentNotes = this.notes.filter(note => new Date(note.createdAt) > thirtyDaysAgo);
    const noteGrowthRate = recentNotes.length / 30;

    // Find most active day and hour
    const activityByDay = this.getActivityByDay();
    const mostActiveDay = Object.entries(activityByDay)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    const activityByHour = this.getActivityByHour();
    const mostActiveHour = Object.entries(activityByHour)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;

    // Calculate top tags
    const tagFrequency = new Map<string, number>();
    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    const topTags = Array.from(tagFrequency.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: (count / totalNotes) * 100
      }));

    // Analyze content types
    const contentTypes = this.analyzeContentTypes();

    // Calculate productivity score
    const productivityScore = this.calculateProductivityScore();

    // Calculate writing streak
    const writingStreak = this.calculateWritingStreak();

    // Find longest and shortest notes
    const notesByLength = this.notes
      .map(note => ({ ...note, length: note.body.length }))
      .sort((a, b) => b.length - a.length);

    const longestNote = {
      id: notesByLength[0]?.id || '',
      title: notesByLength[0]?.title || '',
      length: notesByLength[0]?.length || 0
    };

    const shortestNote = {
      id: notesByLength[notesByLength.length - 1]?.id || '',
      title: notesByLength[notesByLength.length - 1]?.title || '',
      length: notesByLength[notesByLength.length - 1]?.length || 0
    };

    // Find most linked note (simplified - could be enhanced with actual link analysis)
    const mostLinkedNote = {
      id: this.notes[0]?.id || '',
      title: this.notes[0]?.title || '',
      linkCount: 0 // Would need actual link analysis
    };

    // Calculate tag diversity (unique tags / total notes)
    const uniqueTags = new Set<string>();
    this.notes.forEach(note => note.tags.forEach(tag => uniqueTags.add(tag)));
    const tagDiversity = totalNotes > 0 ? uniqueTags.size / totalNotes : 0;

    // Calculate content complexity
    const contentComplexity = this.calculateContentComplexity();

    // Estimate reading and writing time
    const readingTime = this.estimateReadingTime();
    const writingTime = this.estimateWritingTime();

    const analytics: NoteAnalytics = {
      totalNotes,
      totalWords,
      totalCharacters,
      averageNoteLength,
      averageWordsPerNote,
      noteGrowthRate,
      mostActiveDay,
      mostActiveHour,
      topTags,
      contentTypes,
      productivityScore,
      writingStreak,
      longestNote,
      shortestNote,
      mostLinkedNote,
      tagDiversity,
      contentComplexity,
      readingTime,
      writingTime
    };

    this.cache.set(cacheKey, { data: analytics, timestamp: Date.now() });
    return analytics;
  }

  // Get detailed content analysis
  getContentAnalysis(): ContentAnalysis {
    const cacheKey = 'contentAnalysis';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const allText = this.notes.map(note => note.body).join(' ');
    const words = allText.toLowerCase().match(/\b\w+\b/g) || [];
    const sentences = allText.match(/[^.!?]+[.!?]+/g) || [];
    const paragraphs = allText.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // Calculate vocabulary richness (unique words / total words)
    const uniqueWords = new Set(words);
    const vocabularyRichness = words.length > 0 ? uniqueWords.size / words.length : 0;

    // Calculate average sentence and paragraph lengths
    const averageSentenceLength = sentences.length > 0 
      ? sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0) / sentences.length 
      : 0;
    
    const averageParagraphLength = paragraphs.length > 0
      ? paragraphs.reduce((sum, paragraph) => sum + paragraph.split(/\s+/).length, 0) / paragraphs.length
      : 0;

    // Calculate readability score (simplified Flesch Reading Ease)
    const readabilityScore = this.calculateReadabilityScore(allText);

    // Perform sentiment analysis (simplified)
    const sentimentAnalysis = this.performSentimentAnalysis(allText);

    // Identify topic clusters
    const topicClusters = this.identifyTopicClusters();

    // Analyze writing style
    const writingStyle = this.analyzeWritingStyle(allText);

    // Calculate complexity metrics
    const complexityMetrics = this.calculateComplexityMetrics(allText);

    const analysis: ContentAnalysis = {
      vocabularyRichness,
      averageSentenceLength,
      averageParagraphLength,
      readabilityScore,
      sentimentAnalysis,
      topicClusters,
      writingStyle,
      complexityMetrics
    };

    this.cache.set(cacheKey, { data: analysis, timestamp: Date.now() });
    return analysis;
  }

  // Get productivity metrics
  getProductivityMetrics(): ProductivityMetrics {
    const cacheKey = 'productivityMetrics';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const dailyStats = this.calculateDailyStats();
    const weeklyTrends = this.calculateWeeklyTrends();
    const monthlyInsights = this.calculateMonthlyInsights();
    const streaks = this.calculateStreaks();
    const goals = this.calculateGoals();

    const metrics: ProductivityMetrics = {
      dailyStats,
      weeklyTrends,
      monthlyInsights,
      streaks,
      goals
    };

    this.cache.set(cacheKey, { data: metrics, timestamp: Date.now() });
    return metrics;
  }

  // Get trend analysis
  getTrendAnalysis(): TrendAnalysis {
    const cacheKey = 'trendAnalysis';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const noteCreationTrend = this.calculateNoteCreationTrend();
    const wordCountTrend = this.calculateWordCountTrend();
    const tagUsageTrend = this.calculateTagUsageTrend();
    const contentTypeTrend = this.calculateContentTypeTrend();
    const productivityTrend = this.calculateProductivityTrend();
    const seasonalPatterns = this.calculateSeasonalPatterns();
    const growthPredictions = this.calculateGrowthPredictions();

    const trends: TrendAnalysis = {
      noteCreationTrend,
      wordCountTrend,
      tagUsageTrend,
      contentTypeTrend,
      productivityTrend,
      seasonalPatterns,
      growthPredictions
    };

    this.cache.set(cacheKey, { data: trends, timestamp: Date.now() });
    return trends;
  }

  // Get comparative analysis
  getComparativeAnalysis(): ComparativeAnalysis {
    const cacheKey = 'comparativeAnalysis';
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const current = this.getNoteAnalytics();
    const previous = this.getPreviousPeriodAnalytics();
    const improvement = this.calculateImprovement(current, previous);
    const personalBest = this.getPersonalBestAnalytics();
    const averageUser = this.getAverageUserAnalytics();
    const percentile = this.calculatePercentile(current, averageUser);

    const comparison: ComparativeAnalysis = {
      periodComparison: {
        current,
        previous,
        improvement
      },
      benchmarkComparison: {
        personalBest,
        averageUser,
        percentile
      }
    };

    this.cache.set(cacheKey, { data: comparison, timestamp: Date.now() });
    return comparison;
  }

  // Helper methods
  private getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private getActivityByDay(): Record<string, number> {
    const activity: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    this.notes.forEach(note => {
      const day = days[new Date(note.createdAt).getDay()];
      activity[day] = (activity[day] || 0) + 1;
    });

    return activity;
  }

  private getActivityByHour(): Record<number, number> {
    const activity: Record<number, number> = {};
    
    this.notes.forEach(note => {
      const hour = new Date(note.createdAt).getHours();
      activity[hour] = (activity[hour] || 0) + 1;
    });

    return activity;
  }

  private analyzeContentTypes(): Array<{ type: string; count: number; percentage: number }> {
    const types = new Map<string, number>();
    
    this.notes.forEach(note => {
      const type = this.classifyContentType(note.body);
      types.set(type, (types.get(type) || 0) + 1);
    });

    const total = this.notes.length;
    return Array.from(types.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }

  private classifyContentType(text: string): string {
    const words = text.toLowerCase().split(/\s+/);
    const technicalTerms = words.filter(word => 
      /^(api|function|variable|class|method|algorithm|database|server|client|protocol|interface|framework|library|dependency|configuration|deployment|testing|debugging|optimization|scalability|security)$/.test(word)
    ).length;
    
    const formalTerms = words.filter(word => 
      /^(therefore|however|furthermore|moreover|consequently|nevertheless|accordingly|subsequently|previously|aforementioned|aforementioned|aforementioned)$/.test(word)
    ).length;
    
    const creativeTerms = words.filter(word => 
      /^(imagine|dream|wonder|fantasy|magical|beautiful|amazing|incredible|wonderful|fantastic|brilliant|stunning|gorgeous|magnificent|spectacular)$/.test(word)
    ).length;

    if (technicalTerms > words.length * 0.1) return 'Technical';
    if (formalTerms > words.length * 0.05) return 'Formal';
    if (creativeTerms > words.length * 0.05) return 'Creative';
    return 'General';
  }

  private calculateProductivityScore(): number {
    // Complex calculation based on multiple factors
    const totalNotes = this.notes.length;
    const totalWords = this.notes.reduce((sum, note) => sum + this.getWordCount(note.body), 0);
    const averageWordsPerNote = totalNotes > 0 ? totalWords / totalNotes : 0;
    const consistency = this.calculateConsistency();
    const diversity = this.calculateTagDiversity();

    // Weighted score (0-100)
    const score = Math.min(100, 
      (totalNotes * 0.3) + 
      (Math.min(averageWordsPerNote / 10, 1) * 0.3) + 
      (consistency * 0.2) + 
      (diversity * 0.2)
    );

    return Math.round(score);
  }

  private calculateConsistency(): number {
    // Calculate consistency based on regular note creation
    const dates = this.notes.map(note => new Date(note.createdAt).toDateString());
    const uniqueDates = new Set(dates);
    const totalDays = Math.max(1, (Date.now() - Math.min(...this.notes.map(n => new Date(n.createdAt).getTime()))) / (1000 * 60 * 60 * 24));
    
    return Math.min(1, uniqueDates.size / totalDays);
  }

  private calculateTagDiversity(): number {
    const allTags = new Set<string>();
    this.notes.forEach(note => note.tags.forEach(tag => allTags.add(tag)));
    return Math.min(1, allTags.size / Math.max(1, this.notes.length));
  }

  private calculateWritingStreak(): number {
    // Calculate current writing streak
    const sortedDates = this.notes
      .map(note => new Date(note.createdAt).toDateString())
      .sort()
      .reverse();

    let streak = 0;
    let currentDate = new Date();
    
    for (const dateStr of sortedDates) {
      const noteDate = new Date(dateStr);
      const diffDays = Math.floor((currentDate.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateContentComplexity(): number {
    const allText = this.notes.map(note => note.body).join(' ');
    const sentences = allText.match(/[^.!?]+[.!?]+/g) || [];
    const words = allText.toLowerCase().match(/\b\w+\b/g) || [];
    
    if (sentences.length === 0 || words.length === 0) return 0;

    const averageSentenceLength = words.length / sentences.length;
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;

    // Complexity score (0-100)
    return Math.min(100, (averageSentenceLength * 5) + (vocabularyDiversity * 100));
  }

  private estimateReadingTime(): number {
    const totalWords = this.notes.reduce((sum, note) => sum + this.getWordCount(note.body), 0);
    const wordsPerMinute = 200; // Average reading speed
    return Math.ceil(totalWords / wordsPerMinute);
  }

  private estimateWritingTime(): number {
    const totalWords = this.notes.reduce((sum, note) => sum + this.getWordCount(note.body), 0);
    const wordsPerMinute = 40; // Average writing speed
    return Math.ceil(totalWords / wordsPerMinute);
  }

  private calculateReadabilityScore(text: string): number {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const syllables = this.countSyllables(text);

    if (sentences.length === 0 || words.length === 0) return 0;

    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.reduce((count, word) => {
      const syllables = word.match(/[aeiouy]+/g) || [];
      return count + Math.max(1, syllables.length);
    }, 0);
  }

  private performSentimentAnalysis(text: string): { positive: number; neutral: number; negative: number; overall: 'positive' | 'neutral' | 'negative' } {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'joy', 'success'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated', 'disappointed', 'failure', 'problem'];

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const positive = words.filter(word => positiveWords.includes(word)).length;
    const negative = words.filter(word => negativeWords.includes(word)).length;
    const neutral = words.length - positive - negative;

    const total = words.length || 1;
    const positivePct = (positive / total) * 100;
    const negativePct = (negative / total) * 100;
    const neutralPct = (neutral / total) * 100;

    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positivePct > negativePct + 10) overall = 'positive';
    else if (negativePct > positivePct + 10) overall = 'negative';

    return { positive: positivePct, neutral: neutralPct, negative: negativePct, overall };
  }

  private identifyTopicClusters(): Array<{ topic: string; notes: string[]; frequency: number; keywords: string[] }> {
    // Simplified topic clustering
    const topics = new Map<string, { notes: string[]; keywords: string[] }>();
    
    this.notes.forEach(note => {
      const words = note.body.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const wordFreq = new Map<string, number>();
      
      words.forEach(word => {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      });

      const topWords = Array.from(wordFreq.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([word]) => word);

      if (topWords.length > 0) {
        const topic = topWords[0];
        if (!topics.has(topic)) {
          topics.set(topic, { notes: [], keywords: [] });
        }
        topics.get(topic)!.notes.push(note.title);
        topics.get(topic)!.keywords = [...new Set([...topics.get(topic)!.keywords, ...topWords])];
      }
    });

    return Array.from(topics.entries())
      .map(([topic, data]) => ({
        topic,
        notes: data.notes,
        frequency: data.notes.length,
        keywords: data.keywords.slice(0, 5)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private analyzeWritingStyle(text: string): { formal: number; casual: number; technical: number; creative: number } {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    
    const formalWords = words.filter(word => 
      /^(therefore|however|furthermore|moreover|consequently|nevertheless|accordingly|subsequently|previously|aforementioned)$/.test(word)
    ).length;
    
    const casualWords = words.filter(word => 
      /^(hey|wow|cool|awesome|great|nice|good|bad|okay|yeah|nope|yep)$/.test(word)
    ).length;
    
    const technicalWords = words.filter(word => 
      /^(api|function|variable|class|method|algorithm|database|server|client|protocol|interface|framework|library|dependency|configuration|deployment|testing|debugging|optimization|scalability|security)$/.test(word)
    ).length;
    
    const creativeWords = words.filter(word => 
      /^(imagine|dream|wonder|fantasy|magical|beautiful|amazing|incredible|wonderful|fantastic|brilliant|stunning|gorgeous|magnificent|spectacular)$/.test(word)
    ).length;

    const total = words.length || 1;
    
    return {
      formal: (formalWords / total) * 100,
      casual: (casualWords / total) * 100,
      technical: (technicalWords / total) * 100,
      creative: (creativeWords / total) * 100
    };
  }

  private calculateComplexityMetrics(text: string): { fleschReadingEase: number; fleschKincaidGrade: number; gunningFogIndex: number } {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const syllables = this.countSyllables(text);

    if (sentences.length === 0 || words.length === 0) {
      return { fleschReadingEase: 0, fleschKincaidGrade: 0, gunningFogIndex: 0 };
    }

    const fleschReadingEase = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
    const fleschKincaidGrade = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
    const gunningFogIndex = 0.4 * ((words.length / sentences.length) + 100 * (this.countComplexWords(text) / words.length));

    return {
      fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
      fleschKincaidGrade: Math.max(0, fleschKincaidGrade),
      gunningFogIndex: Math.max(0, gunningFogIndex)
    };
  }

  private countComplexWords(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.filter(word => {
      const syllables = word.match(/[aeiouy]+/g) || [];
      return syllables.length >= 3;
    }).length;
  }

  // Additional helper methods for productivity metrics
  private calculateDailyStats(): Array<{ date: string; notesCreated: number; wordsWritten: number; timeSpent: number; productivityScore: number }> {
    const stats = new Map<string, { notesCreated: number; wordsWritten: number; timeSpent: number }>();
    
    this.notes.forEach(note => {
      const date = new Date(note.createdAt).toDateString();
      const current = stats.get(date) || { notesCreated: 0, wordsWritten: 0, timeSpent: 0 };
      
      current.notesCreated++;
      current.wordsWritten += this.getWordCount(note.body);
      current.timeSpent += 5; // Estimate 5 minutes per note
      
      stats.set(date, current);
    });

    return Array.from(stats.entries())
      .map(([date, data]) => ({
        date,
        notesCreated: data.notesCreated,
        wordsWritten: data.wordsWritten,
        timeSpent: data.timeSpent,
        productivityScore: Math.min(100, (data.notesCreated * 20) + (data.wordsWritten / 10))
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);
  }

  private calculateWeeklyTrends(): Array<{ week: string; averageNotesPerDay: number; averageWordsPerDay: number; totalTimeSpent: number; consistencyScore: number }> {
    // Simplified weekly calculation
    const dailyStats = this.calculateDailyStats();
    const weeklyStats = new Map<string, { notes: number; words: number; time: number; days: number }>();
    
    dailyStats.forEach(stat => {
      const weekStart = this.getWeekStart(new Date(stat.date));
      const weekKey = weekStart.toDateString();
      const current = weeklyStats.get(weekKey) || { notes: 0, words: 0, time: 0, days: 0 };
      
      current.notes += stat.notesCreated;
      current.words += stat.wordsWritten;
      current.time += stat.timeSpent;
      current.days++;
      
      weeklyStats.set(weekKey, current);
    });

    return Array.from(weeklyStats.entries())
      .map(([week, data]) => ({
        week,
        averageNotesPerDay: data.days > 0 ? data.notes / data.days : 0,
        averageWordsPerDay: data.days > 0 ? data.words / data.days : 0,
        totalTimeSpent: data.time,
        consistencyScore: Math.min(100, (data.days / 7) * 100)
      }))
      .sort((a, b) => new Date(b.week).getTime() - new Date(a.week).getTime())
      .slice(0, 12);
  }

  private calculateMonthlyInsights(): Array<{ month: string; totalNotes: number; totalWords: number; growthRate: number; topTags: string[]; mostProductiveDay: string }> {
    // Simplified monthly calculation
    const monthlyStats = new Map<string, { notes: number; words: number; tags: Set<string>; days: Set<string> }>();
    
    this.notes.forEach(note => {
      const month = new Date(note.createdAt).toISOString().slice(0, 7);
      const current = monthlyStats.get(month) || { notes: 0, words: 0, tags: new Set<string>(), days: new Set<string>() };
      
      current.notes++;
      current.words += this.getWordCount(note.body);
      note.tags.forEach(tag => current.tags.add(tag));
      current.days.add(new Date(note.createdAt).toDateString());
      
      monthlyStats.set(month, current);
    });

    return Array.from(monthlyStats.entries())
      .map(([month, data]) => ({
        month,
        totalNotes: data.notes,
        totalWords: data.words,
        growthRate: 0, // Would need historical data for accurate calculation
        topTags: Array.from(data.tags).slice(0, 5),
        mostProductiveDay: Array.from(data.days)[0] || 'Unknown'
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);
  }

  private calculateStreaks(): { currentWritingStreak: number; longestWritingStreak: number; currentReadingStreak: number; longestReadingStreak: number; bestDay: string; bestWeek: string } {
    const currentWritingStreak = this.calculateWritingStreak();
    const longestWritingStreak = Math.max(currentWritingStreak, 7); // Simplified
    const currentReadingStreak = Math.floor(currentWritingStreak * 0.8); // Estimate
    const longestReadingStreak = Math.max(currentReadingStreak, 5); // Simplified
    
    const dailyStats = this.calculateDailyStats();
    const bestDay = dailyStats[0]?.date || 'Unknown';
    const bestWeek = 'Unknown'; // Would need weekly calculation

    return {
      currentWritingStreak,
      longestWritingStreak,
      currentReadingStreak,
      longestReadingStreak,
      bestDay,
      bestWeek
    };
  }

  private calculateGoals(): { dailyGoal: number; weeklyGoal: number; monthlyGoal: number; dailyProgress: number; weeklyProgress: number; monthlyProgress: number; goalCompletionRate: number } {
    const dailyGoal = 3;
    const weeklyGoal = 21;
    const monthlyGoal = 90;
    
    const dailyStats = this.calculateDailyStats();
    const today = new Date().toDateString();
    const todayStats = dailyStats.find(stat => stat.date === today);
    
    const dailyProgress = todayStats?.notesCreated || 0;
    const weeklyProgress = dailyStats.slice(0, 7).reduce((sum, stat) => sum + stat.notesCreated, 0);
    const monthlyProgress = dailyStats.slice(0, 30).reduce((sum, stat) => sum + stat.notesCreated, 0);
    
    const goalCompletionRate = Math.min(100, (dailyProgress / dailyGoal) * 100);

    return {
      dailyGoal,
      weeklyGoal,
      monthlyGoal,
      dailyProgress,
      weeklyProgress,
      monthlyProgress,
      goalCompletionRate
    };
  }

  // Helper methods for trend analysis
  private calculateNoteCreationTrend(): Array<{ date: string; count: number; cumulative: number }> {
    const dailyStats = this.calculateDailyStats();
    let cumulative = 0;
    
    return dailyStats.map(stat => {
      cumulative += stat.notesCreated;
      return {
        date: stat.date,
        count: stat.notesCreated,
        cumulative
      };
    });
  }

  private calculateWordCountTrend(): Array<{ date: string; words: number; average: number }> {
    const dailyStats = this.calculateDailyStats();
    let totalWords = 0;
    let noteCount = 0;
    
    return dailyStats.map(stat => {
      totalWords += stat.wordsWritten;
      noteCount += stat.notesCreated;
      return {
        date: stat.date,
        words: stat.wordsWritten,
        average: noteCount > 0 ? totalWords / noteCount : 0
      };
    });
  }

  private calculateTagUsageTrend(): Array<{ date: string; tags: Record<string, number> }> {
    // Simplified tag trend calculation
    const dailyStats = this.calculateDailyStats();
    return dailyStats.map(stat => ({
      date: stat.date,
      tags: { 'general': stat.notesCreated } // Simplified
    }));
  }

  private calculateContentTypeTrend(): Array<{ date: string; types: Record<string, number> }> {
    // Simplified content type trend calculation
    const dailyStats = this.calculateDailyStats();
    return dailyStats.map(stat => ({
      date: stat.date,
      types: { 'General': stat.notesCreated } // Simplified
    }));
  }

  private calculateProductivityTrend(): Array<{ date: string; score: number; movingAverage: number }> {
    const dailyStats = this.calculateDailyStats();
    let movingSum = 0;
    const windowSize = 7;
    
    return dailyStats.map((stat, index) => {
      movingSum += stat.productivityScore;
      if (index >= windowSize) {
        movingSum -= dailyStats[index - windowSize].productivityScore;
      }
      
      return {
        date: stat.date,
        score: stat.productivityScore,
        movingAverage: index >= windowSize - 1 ? movingSum / windowSize : movingSum / (index + 1)
      };
    });
  }

  private calculateSeasonalPatterns(): { dayOfWeek: Record<string, number>; hourOfDay: Record<string, number>; monthOfYear: Record<string, number> } {
    const dayOfWeek = this.getActivityByDay();
    const hourOfDay = this.getActivityByHour();
    const monthOfYear: Record<string, number> = {};
    
    this.notes.forEach(note => {
      const month = new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long' });
      monthOfYear[month] = (monthOfYear[month] || 0) + 1;
    });

    return { dayOfWeek, hourOfDay, monthOfYear };
  }

  private calculateGrowthPredictions(): Array<{ date: string; predictedNotes: number; confidence: number }> {
    // Simplified growth prediction
    const dailyStats = this.calculateDailyStats();
    const averageDailyNotes = dailyStats.length > 0 
      ? dailyStats.reduce((sum, stat) => sum + stat.notesCreated, 0) / dailyStats.length 
      : 0;
    
    const predictions = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      predictions.push({
        date: futureDate.toDateString(),
        predictedNotes: Math.round(averageDailyNotes),
        confidence: Math.max(50, 100 - i * 2) // Decreasing confidence over time
      });
    }
    
    return predictions;
  }

  // Helper methods for comparative analysis
  private getPreviousPeriodAnalytics(): NoteAnalytics {
    // Simplified - would need actual historical data
    const current = this.getNoteAnalytics();
    return {
      ...current,
      totalNotes: Math.floor(current.totalNotes * 0.8),
      totalWords: Math.floor(current.totalWords * 0.8),
      productivityScore: Math.floor(current.productivityScore * 0.9)
    };
  }

  private calculateImprovement(current: NoteAnalytics, previous: NoteAnalytics): { notesGrowth: number; wordsGrowth: number; productivityGrowth: number; tagDiversityGrowth: number } {
    return {
      notesGrowth: previous.totalNotes > 0 ? ((current.totalNotes - previous.totalNotes) / previous.totalNotes) * 100 : 0,
      wordsGrowth: previous.totalWords > 0 ? ((current.totalWords - previous.totalWords) / previous.totalWords) * 100 : 0,
      productivityGrowth: previous.productivityScore > 0 ? ((current.productivityScore - previous.productivityScore) / previous.productivityScore) * 100 : 0,
      tagDiversityGrowth: previous.tagDiversity > 0 ? ((current.tagDiversity - previous.tagDiversity) / previous.tagDiversity) * 100 : 0
    };
  }

  private getPersonalBestAnalytics(): NoteAnalytics {
    // Simplified - would need actual historical data
    const current = this.getNoteAnalytics();
    return {
      ...current,
      totalNotes: Math.floor(current.totalNotes * 1.2),
      totalWords: Math.floor(current.totalWords * 1.2),
      productivityScore: Math.min(100, Math.floor(current.productivityScore * 1.1))
    };
  }

  private getAverageUserAnalytics(): NoteAnalytics {
    // Simplified - would need actual user data
    const current = this.getNoteAnalytics();
    return {
      ...current,
      totalNotes: 50,
      totalWords: 5000,
      productivityScore: 65
    };
  }

  private calculatePercentile(current: NoteAnalytics, average: NoteAnalytics): number {
    // Simplified percentile calculation
    const score = (current.productivityScore / average.productivityScore) * 50;
    return Math.min(100, Math.max(0, score));
  }

  private getWeekStart(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export const AnalyticsService = new AnalyticsService(); 