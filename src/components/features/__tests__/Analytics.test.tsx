import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsService, NoteAnalytics, ContentAnalysis, ProductivityMetrics, TrendAnalysis, ComparativeAnalysis } from '../../../services/analyticsService';
import AdvancedAnalytics from '../AdvancedAnalytics';
import { Note } from '../../../types/domain';

// Mock the stores
jest.mock('../../../store/themeStore', () => ({
  useThemeStore: () => ({
    colors: {
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#000000',
      textSecondary: '#666666',
      primary: '#007bff',
      secondary: '#6c757d',
      accent: '#17a2b8',
      warning: '#ffc107',
      success: '#28a745',
      border: '#dee2e6',
      surfaceHover: '#e9ecef',
      primaryHover: '#0056b3'
    }
  })
}));

jest.mock('../../../store/noteStore', () => ({
  useNoteStore: () => ({
    notes: [
      {
        id: '1',
        title: 'Project Planning',
        body: 'This is a comprehensive project planning note with important deadlines and tasks. We need to ensure all deliverables are completed on time.',
        tags: ['project', 'planning', 'work'],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: '2',
        title: 'Meeting Notes',
        body: 'Notes from the team meeting discussing new features and roadmap. Great collaboration and innovative ideas were shared.',
        tags: ['meeting', 'team', 'features'],
        createdAt: new Date('2024-01-02T14:00:00Z'),
        updatedAt: new Date('2024-01-02T14:00:00Z')
      },
      {
        id: '3',
        title: 'Research Ideas',
        body: 'Collection of research ideas and potential topics for investigation. These concepts show promise for future development.',
        tags: ['research', 'ideas', 'topics'],
        createdAt: new Date('2024-01-03T09:00:00Z'),
        updatedAt: new Date('2024-01-03T09:00:00Z')
      },
      {
        id: '4',
        title: 'Technical Documentation',
        body: 'API documentation and technical specifications for the new system architecture. Includes database schemas and integration points.',
        tags: ['technical', 'documentation', 'api'],
        createdAt: new Date('2024-01-04T16:00:00Z'),
        updatedAt: new Date('2024-01-04T16:00:00Z')
      },
      {
        id: '5',
        title: 'Creative Writing',
        body: 'A beautiful story about innovation and creativity. The narrative explores themes of discovery and imagination.',
        tags: ['creative', 'writing', 'story'],
        createdAt: new Date('2024-01-05T11:00:00Z'),
        updatedAt: new Date('2024-01-05T11:00:00Z')
      }
    ]
  })
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let sampleNotes: Note[];

  beforeEach(() => {
    service = new AnalyticsService();
    sampleNotes = [
      {
        id: '1',
        title: 'Project Planning',
        body: 'This is a comprehensive project planning note with important deadlines and tasks. We need to ensure all deliverables are completed on time.',
        tags: ['project', 'planning', 'work'],
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z')
      },
      {
        id: '2',
        title: 'Meeting Notes',
        body: 'Notes from the team meeting discussing new features and roadmap. Great collaboration and innovative ideas were shared.',
        tags: ['meeting', 'team', 'features'],
        createdAt: new Date('2024-01-02T14:00:00Z'),
        updatedAt: new Date('2024-01-02T14:00:00Z')
      },
      {
        id: '3',
        title: 'Research Ideas',
        body: 'Collection of research ideas and potential topics for investigation. These concepts show promise for future development.',
        tags: ['research', 'ideas', 'topics'],
        createdAt: new Date('2024-01-03T09:00:00Z'),
        updatedAt: new Date('2024-01-03T09:00:00Z')
      }
    ];
    service.initialize(sampleNotes);
  });

  describe('Initialization', () => {
    it('should initialize with notes', () => {
      expect(service).toBeDefined();
    });

    it('should clear cache on initialization', () => {
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('getNoteAnalytics', () => {
    it('should return comprehensive note analytics', () => {
      const analytics = service.getNoteAnalytics();
      
      expect(analytics).toHaveProperty('totalNotes');
      expect(analytics).toHaveProperty('totalWords');
      expect(analytics).toHaveProperty('totalCharacters');
      expect(analytics).toHaveProperty('averageNoteLength');
      expect(analytics).toHaveProperty('averageWordsPerNote');
      expect(analytics).toHaveProperty('noteGrowthRate');
      expect(analytics).toHaveProperty('mostActiveDay');
      expect(analytics).toHaveProperty('mostActiveHour');
      expect(analytics).toHaveProperty('topTags');
      expect(analytics).toHaveProperty('contentTypes');
      expect(analytics).toHaveProperty('productivityScore');
      expect(analytics).toHaveProperty('writingStreak');
      expect(analytics).toHaveProperty('tagDiversity');
      expect(analytics).toHaveProperty('contentComplexity');
      expect(analytics).toHaveProperty('readingTime');
      expect(analytics).toHaveProperty('writingTime');
    });

    it('should calculate correct total notes', () => {
      const analytics = service.getNoteAnalytics();
      expect(analytics.totalNotes).toBe(3);
    });

    it('should calculate correct total words', () => {
      const analytics = service.getNoteAnalytics();
      expect(analytics.totalWords).toBeGreaterThan(0);
    });

    it('should identify top tags', () => {
      const analytics = service.getNoteAnalytics();
      expect(analytics.topTags.length).toBeGreaterThan(0);
      expect(analytics.topTags[0]).toHaveProperty('tag');
      expect(analytics.topTags[0]).toHaveProperty('count');
      expect(analytics.topTags[0]).toHaveProperty('percentage');
    });

    it('should calculate productivity score', () => {
      const analytics = service.getNoteAnalytics();
      expect(analytics.productivityScore).toBeGreaterThanOrEqual(0);
      expect(analytics.productivityScore).toBeLessThanOrEqual(100);
    });

    it('should calculate tag diversity', () => {
      const analytics = service.getNoteAnalytics();
      expect(analytics.tagDiversity).toBeGreaterThan(0);
      expect(analytics.tagDiversity).toBeLessThanOrEqual(1);
    });
  });

  describe('getContentAnalysis', () => {
    it('should return comprehensive content analysis', () => {
      const analysis = service.getContentAnalysis();
      
      expect(analysis).toHaveProperty('vocabularyRichness');
      expect(analysis).toHaveProperty('averageSentenceLength');
      expect(analysis).toHaveProperty('averageParagraphLength');
      expect(analysis).toHaveProperty('readabilityScore');
      expect(analysis).toHaveProperty('sentimentAnalysis');
      expect(analysis).toHaveProperty('topicClusters');
      expect(analysis).toHaveProperty('writingStyle');
      expect(analysis).toHaveProperty('complexityMetrics');
    });

    it('should calculate vocabulary richness', () => {
      const analysis = service.getContentAnalysis();
      expect(analysis.vocabularyRichness).toBeGreaterThan(0);
      expect(analysis.vocabularyRichness).toBeLessThanOrEqual(1);
    });

    it('should calculate readability score', () => {
      const analysis = service.getContentAnalysis();
      expect(analysis.readabilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.readabilityScore).toBeLessThanOrEqual(100);
    });

    it('should perform sentiment analysis', () => {
      const analysis = service.getContentAnalysis();
      expect(analysis.sentimentAnalysis).toHaveProperty('positive');
      expect(analysis.sentimentAnalysis).toHaveProperty('neutral');
      expect(analysis.sentimentAnalysis).toHaveProperty('negative');
      expect(analysis.sentimentAnalysis).toHaveProperty('overall');
      expect(['positive', 'neutral', 'negative']).toContain(analysis.sentimentAnalysis.overall);
    });

    it('should identify topic clusters', () => {
      const analysis = service.getContentAnalysis();
      expect(Array.isArray(analysis.topicClusters)).toBe(true);
      if (analysis.topicClusters.length > 0) {
        expect(analysis.topicClusters[0]).toHaveProperty('topic');
        expect(analysis.topicClusters[0]).toHaveProperty('notes');
        expect(analysis.topicClusters[0]).toHaveProperty('frequency');
        expect(analysis.topicClusters[0]).toHaveProperty('keywords');
      }
    });

    it('should analyze writing style', () => {
      const analysis = service.getContentAnalysis();
      expect(analysis.writingStyle).toHaveProperty('formal');
      expect(analysis.writingStyle).toHaveProperty('casual');
      expect(analysis.writingStyle).toHaveProperty('technical');
      expect(analysis.writingStyle).toHaveProperty('creative');
    });

    it('should calculate complexity metrics', () => {
      const analysis = service.getContentAnalysis();
      expect(analysis.complexityMetrics).toHaveProperty('fleschReadingEase');
      expect(analysis.complexityMetrics).toHaveProperty('fleschKincaidGrade');
      expect(analysis.complexityMetrics).toHaveProperty('gunningFogIndex');
    });
  });

  describe('getProductivityMetrics', () => {
    it('should return comprehensive productivity metrics', () => {
      const metrics = service.getProductivityMetrics();
      
      expect(metrics).toHaveProperty('dailyStats');
      expect(metrics).toHaveProperty('weeklyTrends');
      expect(metrics).toHaveProperty('monthlyInsights');
      expect(metrics).toHaveProperty('streaks');
      expect(metrics).toHaveProperty('goals');
    });

    it('should calculate daily stats', () => {
      const metrics = service.getProductivityMetrics();
      expect(Array.isArray(metrics.dailyStats)).toBe(true);
      if (metrics.dailyStats.length > 0) {
        expect(metrics.dailyStats[0]).toHaveProperty('date');
        expect(metrics.dailyStats[0]).toHaveProperty('notesCreated');
        expect(metrics.dailyStats[0]).toHaveProperty('wordsWritten');
        expect(metrics.dailyStats[0]).toHaveProperty('timeSpent');
        expect(metrics.dailyStats[0]).toHaveProperty('productivityScore');
      }
    });

    it('should calculate weekly trends', () => {
      const metrics = service.getProductivityMetrics();
      expect(Array.isArray(metrics.weeklyTrends)).toBe(true);
      if (metrics.weeklyTrends.length > 0) {
        expect(metrics.weeklyTrends[0]).toHaveProperty('week');
        expect(metrics.weeklyTrends[0]).toHaveProperty('averageNotesPerDay');
        expect(metrics.weeklyTrends[0]).toHaveProperty('averageWordsPerDay');
        expect(metrics.weeklyTrends[0]).toHaveProperty('totalTimeSpent');
        expect(metrics.weeklyTrends[0]).toHaveProperty('consistencyScore');
      }
    });

    it('should calculate streaks', () => {
      const metrics = service.getProductivityMetrics();
      expect(metrics.streaks).toHaveProperty('currentWritingStreak');
      expect(metrics.streaks).toHaveProperty('longestWritingStreak');
      expect(metrics.streaks).toHaveProperty('currentReadingStreak');
      expect(metrics.streaks).toHaveProperty('longestReadingStreak');
      expect(metrics.streaks).toHaveProperty('bestDay');
      expect(metrics.streaks).toHaveProperty('bestWeek');
    });

    it('should calculate goals', () => {
      const metrics = service.getProductivityMetrics();
      expect(metrics.goals).toHaveProperty('dailyGoal');
      expect(metrics.goals).toHaveProperty('weeklyGoal');
      expect(metrics.goals).toHaveProperty('monthlyGoal');
      expect(metrics.goals).toHaveProperty('dailyProgress');
      expect(metrics.goals).toHaveProperty('weeklyProgress');
      expect(metrics.goals).toHaveProperty('monthlyProgress');
      expect(metrics.goals).toHaveProperty('goalCompletionRate');
    });
  });

  describe('getTrendAnalysis', () => {
    it('should return comprehensive trend analysis', () => {
      const trends = service.getTrendAnalysis();
      
      expect(trends).toHaveProperty('noteCreationTrend');
      expect(trends).toHaveProperty('wordCountTrend');
      expect(trends).toHaveProperty('tagUsageTrend');
      expect(trends).toHaveProperty('contentTypeTrend');
      expect(trends).toHaveProperty('productivityTrend');
      expect(trends).toHaveProperty('seasonalPatterns');
      expect(trends).toHaveProperty('growthPredictions');
    });

    it('should calculate note creation trend', () => {
      const trends = service.getTrendAnalysis();
      expect(Array.isArray(trends.noteCreationTrend)).toBe(true);
      if (trends.noteCreationTrend.length > 0) {
        expect(trends.noteCreationTrend[0]).toHaveProperty('date');
        expect(trends.noteCreationTrend[0]).toHaveProperty('count');
        expect(trends.noteCreationTrend[0]).toHaveProperty('cumulative');
      }
    });

    it('should calculate seasonal patterns', () => {
      const trends = service.getTrendAnalysis();
      expect(trends.seasonalPatterns).toHaveProperty('dayOfWeek');
      expect(trends.seasonalPatterns).toHaveProperty('hourOfDay');
      expect(trends.seasonalPatterns).toHaveProperty('monthOfYear');
    });

    it('should calculate growth predictions', () => {
      const trends = service.getTrendAnalysis();
      expect(Array.isArray(trends.growthPredictions)).toBe(true);
      if (trends.growthPredictions.length > 0) {
        expect(trends.growthPredictions[0]).toHaveProperty('date');
        expect(trends.growthPredictions[0]).toHaveProperty('predictedNotes');
        expect(trends.growthPredictions[0]).toHaveProperty('confidence');
      }
    });
  });

  describe('getComparativeAnalysis', () => {
    it('should return comprehensive comparative analysis', () => {
      const comparison = service.getComparativeAnalysis();
      
      expect(comparison).toHaveProperty('periodComparison');
      expect(comparison).toHaveProperty('benchmarkComparison');
    });

    it('should calculate period comparison', () => {
      const comparison = service.getComparativeAnalysis();
      expect(comparison.periodComparison).toHaveProperty('current');
      expect(comparison.periodComparison).toHaveProperty('previous');
      expect(comparison.periodComparison).toHaveProperty('improvement');
    });

    it('should calculate improvement metrics', () => {
      const comparison = service.getComparativeAnalysis();
      expect(comparison.periodComparison.improvement).toHaveProperty('notesGrowth');
      expect(comparison.periodComparison.improvement).toHaveProperty('wordsGrowth');
      expect(comparison.periodComparison.improvement).toHaveProperty('productivityGrowth');
      expect(comparison.periodComparison.improvement).toHaveProperty('tagDiversityGrowth');
    });

    it('should calculate benchmark comparison', () => {
      const comparison = service.getComparativeAnalysis();
      expect(comparison.benchmarkComparison).toHaveProperty('personalBest');
      expect(comparison.benchmarkComparison).toHaveProperty('averageUser');
      expect(comparison.benchmarkComparison).toHaveProperty('percentile');
    });
  });

  describe('Caching', () => {
    it('should cache analytics results', () => {
      service.getNoteAnalytics();
      const stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should return cached results for same query', () => {
      const firstCall = service.getNoteAnalytics();
      const secondCall = service.getNoteAnalytics();
      expect(firstCall).toEqual(secondCall);
    });

    it('should clear cache', () => {
      service.getNoteAnalytics();
      service.clearCache();
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty notes array', () => {
      service.initialize([]);
      const analytics = service.getNoteAnalytics();
      expect(analytics.totalNotes).toBe(0);
      expect(analytics.totalWords).toBe(0);
    });

    it('should handle notes with empty content', () => {
      const emptyNotes = [
        {
          id: '1',
          title: 'Empty Note',
          body: '',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      service.initialize(emptyNotes);
      const analytics = service.getNoteAnalytics();
      expect(analytics.totalWords).toBe(0);
    });

    it('should handle notes with special characters', () => {
      const specialNotes = [
        {
          id: '1',
          title: 'Special Characters',
          body: 'This note has special characters: @#$%^&*()_+-=[]{}|;:,.<>?',
          tags: ['special'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      service.initialize(specialNotes);
      const analytics = service.getNoteAnalytics();
      expect(analytics.totalWords).toBeGreaterThan(0);
    });
  });
});

describe('AdvancedAnalytics Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when open', () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    expect(screen.getByText('📊 Advanced Analytics Dashboard')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<AdvancedAnalytics {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('📊 Advanced Analytics Dashboard')).not.toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    expect(screen.getByText('Loading Analytics...')).toBeInTheDocument();
  });

  it('should display tab navigation', async () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Content Analysis')).toBeInTheDocument();
      expect(screen.getByText('Productivity')).toBeInTheDocument();
      expect(screen.getByText('Trends')).toBeInTheDocument();
      expect(screen.getByText('Comparison')).toBeInTheDocument();
    });
  });

  it('should handle tab switching', async () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Analytics...')).not.toBeInTheDocument();
    });

    const contentTab = screen.getByText('Content Analysis');
    fireEvent.click(contentTab);
    
    // Should show content analysis content
    await waitFor(() => {
      expect(screen.getByText('📖 Readability Analysis')).toBeInTheDocument();
    });
  });

  it('should handle close button', async () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Analytics...')).not.toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /×/ });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should display analytics data when loaded', async () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Analytics...')).not.toBeInTheDocument();
    });

    // Should show overview content
    expect(screen.getByText('Total Notes')).toBeInTheDocument();
    expect(screen.getByText('Total Words')).toBeInTheDocument();
    expect(screen.getByText('Productivity Score')).toBeInTheDocument();
  });

  it('should be accessible', async () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Analytics...')).not.toBeInTheDocument();
    });

    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for tab navigation
    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBeGreaterThan(0);
  });

  it('should handle keyboard navigation', async () => {
    render(<AdvancedAnalytics {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Analytics...')).not.toBeInTheDocument();
    });

    // Test tab navigation
    const tabs = screen.getAllByRole('button');
    if (tabs.length > 1) {
      fireEvent.keyDown(tabs[1], { key: 'Enter' });
      // Should switch to the second tab
    }
  });

  it('should display error handling gracefully', async () => {
    // Mock service to throw error
    jest.spyOn(AnalyticsService, 'getNoteAnalytics').mockRejectedValue(new Error('Test error'));
    
    render(<AdvancedAnalytics {...defaultProps} />);
    
    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.queryByText('Loading Analytics...')).not.toBeInTheDocument();
    });
  });
});

describe('Analytics Integration', () => {
  it('should work with real note data', async () => {
    const { useNoteStore } = require('../../../store/noteStore');
    const notes = useNoteStore().notes;
    
    const service = new AnalyticsService();
    service.initialize(notes);
    
    const analytics = service.getNoteAnalytics();
    const contentAnalysis = service.getContentAnalysis();
    const productivityMetrics = service.getProductivityMetrics();
    const trendAnalysis = service.getTrendAnalysis();
    const comparativeAnalysis = service.getComparativeAnalysis();
    
    // Verify all analytics are generated
    expect(analytics.totalNotes).toBeGreaterThan(0);
    expect(contentAnalysis.vocabularyRichness).toBeGreaterThan(0);
    expect(productivityMetrics.dailyStats.length).toBeGreaterThan(0);
    expect(trendAnalysis.noteCreationTrend.length).toBeGreaterThan(0);
    expect(comparativeAnalysis.periodComparison.current.totalNotes).toBeGreaterThan(0);
  });

  it('should handle performance with large datasets', () => {
    const largeNotes = Array.from({ length: 1000 }, (_, i) => ({
      id: `note-${i}`,
      title: `Note ${i}`,
      body: `This is note ${i} with some content to analyze. It contains multiple sentences and various words for testing purposes.`,
      tags: [`tag-${i % 10}`, `category-${i % 5}`],
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    }));
    
    const service = new AnalyticsService();
    const startTime = Date.now();
    
    service.initialize(largeNotes);
    const analytics = service.getNoteAnalytics();
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // Should process large datasets in reasonable time (< 1 second)
    expect(processingTime).toBeLessThan(1000);
    expect(analytics.totalNotes).toBe(1000);
  });
}); 