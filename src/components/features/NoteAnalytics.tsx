import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface AnalyticsData {
  overview: {
    totalNotes: number;
    totalWords: number;
    totalCharacters: number;
    averageNoteLength: number;
    oldestNote: Date;
    newestNote: Date;
    mostActiveDay: string;
    leastActiveDay: string;
  };
  tags: {
    mostUsed: Array<{ tag: string; count: number }>;
    leastUsed: Array<{ tag: string; count: number }>;
    tagGrowth: Array<{ date: string; count: number }>;
  };
  writing: {
    averageWordsPerDay: number;
    writingStreak: number;
    longestNote: { id: string; title: string; length: number };
    shortestNote: { id: string; title: string; length: number };
    mostEditedNote: { id: string; title: string; edits: number };
    writingPattern: Array<{ hour: number; count: number }>;
  };
  content: {
    mostCommonWords: Array<{ word: string; count: number }>;
    averageReadingTime: number;
    complexityDistribution: Array<{ level: string; count: number }>;
    linkDensity: number;
    tagDensity: number;
  };
  trends: {
    notesPerMonth: Array<{ month: string; count: number }>;
    wordsPerMonth: Array<{ month: string; count: number }>;
    tagsPerMonth: Array<{ month: string; count: number }>;
  };
}

interface NoteAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteAnalytics: React.FC<NoteAnalyticsProps> = ({ isOpen, onClose }) => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tags' | 'writing' | 'content' | 'trends'>('overview');
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week'>('all');

  // Calculate analytics data
  const calculateAnalytics = useCallback(async () => {
    if (notes.length === 0) return;
    
    setIsCalculating(true);
    
    try {
      const data = await PerformanceUtils.measureAsync(
        'analytics_calculation',
        () => generateAnalyticsData(notes, timeRange)
      );
      
      setAnalyticsData(data);
      
      loggingService.info('Analytics calculated', { 
        noteCount: notes.length,
        timeRange 
      });
    } catch (error) {
      loggingService.error('Analytics calculation failed', error as Error);
    } finally {
      setIsCalculating(false);
    }
  }, [notes, timeRange]);

  // Generate analytics data
  const generateAnalyticsData = (allNotes: any[], range: string): AnalyticsData => {
    const now = new Date();
    let filteredNotes = allNotes;
    
    // Filter by time range
    if (range === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredNotes = allNotes.filter(note => new Date(note.createdAt) >= monthAgo);
    } else if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredNotes = allNotes.filter(note => new Date(note.createdAt) >= weekAgo);
    }

    // Overview calculations
    const totalWords = filteredNotes.reduce((sum, note) => 
      sum + note.body.split(/\s+/).length, 0
    );
    const totalCharacters = filteredNotes.reduce((sum, note) => 
      sum + note.body.length, 0
    );
    const averageNoteLength = filteredNotes.length > 0 
      ? totalWords / filteredNotes.length 
      : 0;
    
    const dates = filteredNotes.map(note => new Date(note.createdAt));
    const oldestNote = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const newestNote = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();
    
    // Day of week analysis
    const dayCounts: Record<string, number> = {};
    filteredNotes.forEach(note => {
      const day = new Date(note.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const leastActiveDay = Object.entries(dayCounts).reduce((a, b) => a[1] < b[1] ? a : b)[0];

    // Tag analysis
    const tagCounts: Record<string, number> = {};
    filteredNotes.forEach(note => {
      note.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const mostUsedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
    
    const leastUsedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Writing analysis
    const notesByLength = filteredNotes
      .map(note => ({
        id: note.id,
        title: note.title,
        length: note.body.split(/\s+/).length
      }))
      .sort((a, b) => b.length - a.length);
    
    const longestNote = notesByLength[0];
    const shortestNote = notesByLength[notesByLength.length - 1];
    
    // Calculate writing streak
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const diffDays = Math.floor((sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // Writing pattern by hour
    const hourCounts: Record<number, number> = {};
    filteredNotes.forEach(note => {
      const hour = new Date(note.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const writingPattern = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0
    }));

    // Content analysis
    const allWords = filteredNotes
      .flatMap(note => note.body.toLowerCase().match(/\b\w+\b/g) || [])
      .filter(word => word.length > 3);
    
    const wordCounts: Record<string, number> = {};
    allWords.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    const mostCommonWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // Complexity analysis
    const complexityLevels = filteredNotes.map(note => {
      const avgWordLength = note.body.split(/\s+/).reduce((sum: number, word: string) => sum + word.length, 0) / note.body.split(/\s+/).length;
      if (avgWordLength > 6) return 'complex';
      if (avgWordLength > 5) return 'moderate';
      return 'simple';
    });
    
    const complexityDistribution = [
      { level: 'simple', count: complexityLevels.filter(level => level === 'simple').length },
      { level: 'moderate', count: complexityLevels.filter(level => level === 'moderate').length },
      { level: 'complex', count: complexityLevels.filter(level => level === 'complex').length }
    ];

    // Link and tag density
    const totalLinks = filteredNotes.reduce((sum, note) => 
      sum + (note.body.match(/\[\[([^[\]]+)\]\]/g) || []).length, 0
    );
    const totalTags = filteredNotes.reduce((sum, note) => sum + note.tags.length, 0);
    
    const linkDensity = totalWords > 0 ? totalLinks / totalWords : 0;
    const tagDensity = filteredNotes.length > 0 ? totalTags / filteredNotes.length : 0;

    // Trends analysis
    const monthlyData: Record<string, { notes: number; words: number; tags: number }> = {};
    
    filteredNotes.forEach(note => {
      const month = new Date(note.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = { notes: 0, words: 0, tags: 0 };
      }
      monthlyData[month].notes++;
      monthlyData[month].words += note.body.split(/\s+/).length;
      monthlyData[month].tags += note.tags.length;
    });

    const notesPerMonth = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, data]) => ({ month, count: data.notes }));
    
    const wordsPerMonth = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, data]) => ({ month, count: data.words }));
    
    const tagsPerMonth = Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, data]) => ({ month, count: data.tags }));

    return {
      overview: {
        totalNotes: filteredNotes.length,
        totalWords,
        totalCharacters,
        averageNoteLength: Math.round(averageNoteLength * 100) / 100,
        oldestNote,
        newestNote,
        mostActiveDay,
        leastActiveDay
      },
      tags: {
        mostUsed: mostUsedTags,
        leastUsed: leastUsedTags,
        tagGrowth: [] // Would need historical data for this
      },
      writing: {
        averageWordsPerDay: Math.round(totalWords / Math.max(1, Math.ceil((newestNote.getTime() - oldestNote.getTime()) / (1000 * 60 * 60 * 24))) * 100) / 100,
        writingStreak: maxStreak,
        longestNote,
        shortestNote,
        mostEditedNote: { id: '', title: '', edits: 0 }, // Would need edit history
        writingPattern
      },
      content: {
        mostCommonWords,
        averageReadingTime: Math.ceil(totalWords / 200), // 200 words per minute
        complexityDistribution,
        linkDensity: Math.round(linkDensity * 1000) / 1000,
        tagDensity: Math.round(tagDensity * 100) / 100
      },
      trends: {
        notesPerMonth,
        wordsPerMonth,
        tagsPerMonth
      }
    };
  };

  // Calculate analytics when component mounts or data changes
  useEffect(() => {
    calculateAnalytics();
  }, [calculateAnalytics]);

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>Note Analytics</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close analytics panel"
          >
            ×
          </button>
        </div>

        {/* Time Range Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
            Time Range:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'Last Month' },
              { value: 'week', label: 'Last Week' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value as any)}
                style={{
                  padding: '8px 16px',
                  background: timeRange === range.value ? colors.primary : colors.surface,
                  color: timeRange === range.value ? 'white' : colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '24px'
        }}>
          {[
            { value: 'overview', label: 'Overview', icon: '📊' },
            { value: 'tags', label: 'Tags', icon: '🏷️' },
            { value: 'writing', label: 'Writing', icon: '✍️' },
            { value: 'content', label: 'Content', icon: '📝' },
            { value: 'trends', label: 'Trends', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.value ? colors.primary : 'transparent',
                color: activeTab === tab.value ? 'white' : colors.text,
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.value ? `2px solid ${colors.primary}` : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isCalculating && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: colors.textSecondary
          }}>
            Calculating analytics...
          </div>
        )}

        {/* Analytics Content */}
        {analyticsData && !isCalculating && (
          <div>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: colors.surface,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                    {formatNumber(analyticsData.overview.totalNotes)}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Total Notes</div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: colors.surface,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                    {formatNumber(analyticsData.overview.totalWords)}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Total Words</div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: colors.surface,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                    {analyticsData.overview.averageNoteLength}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Avg Words per Note</div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: colors.surface,
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                    {analyticsData.writing.writingStreak}
                  </div>
                  <div style={{ color: colors.textSecondary }}>Longest Writing Streak</div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: colors.surface,
                  borderRadius: '8px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Date Range</h4>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                    <div>Oldest: {formatDate(analyticsData.overview.oldestNote)}</div>
                    <div>Newest: {formatDate(analyticsData.overview.newestNote)}</div>
                  </div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: colors.surface,
                  borderRadius: '8px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Activity</h4>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                    <div>Most Active: {analyticsData.overview.mostActiveDay}</div>
                    <div>Least Active: {analyticsData.overview.leastActiveDay}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Most Used Tags</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsData.tags.mostUsed.map((tag, index) => (
                      <div key={tag.tag} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: colors.surface,
                        borderRadius: '4px'
                      }}>
                        <span style={{ color: colors.text }}>{tag.tag}</span>
                        <span style={{ 
                          background: colors.primary, 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {tag.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Least Used Tags</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsData.tags.leastUsed.map((tag, index) => (
                      <div key={tag.tag} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: colors.surface,
                        borderRadius: '4px'
                      }}>
                        <span style={{ color: colors.text }}>{tag.tag}</span>
                        <span style={{ 
                          background: colors.textSecondary, 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {tag.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Writing Tab */}
            {activeTab === 'writing' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Writing Statistics</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      padding: '12px',
                      background: colors.surface,
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Average Words per Day</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                        {analyticsData.writing.averageWordsPerDay}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      background: colors.surface,
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Longest Writing Streak</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                        {analyticsData.writing.writingStreak} days
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      background: colors.surface,
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Longest Note</div>
                      <div style={{ fontSize: '16px', color: colors.text }}>
                        {analyticsData.writing.longestNote.title}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {analyticsData.writing.longestNote.length} words
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Writing Pattern by Hour</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '4px'
                  }}>
                    {analyticsData.writing.writingPattern.map((pattern, index) => (
                      <div key={index} style={{
                        padding: '8px',
                        background: colors.surface,
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {pattern.hour}:00
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          color: pattern.count > 0 ? colors.primary : colors.textSecondary 
                        }}>
                          {pattern.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Most Common Words</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsData.content.mostCommonWords.slice(0, 10).map((word, index) => (
                      <div key={word.word} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        background: colors.surface,
                        borderRadius: '4px'
                      }}>
                        <span style={{ color: colors.text }}>{word.word}</span>
                        <span style={{ 
                          background: colors.primary, 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {word.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Content Analysis</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      padding: '12px',
                      background: colors.surface,
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Average Reading Time</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                        {analyticsData.content.averageReadingTime} minutes
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      background: colors.surface,
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Link Density</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                        {analyticsData.content.linkDensity}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '12px',
                      background: colors.surface,
                      borderRadius: '4px'
                    }}>
                      <div style={{ fontSize: '14px', color: colors.textSecondary }}>Tag Density</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                        {analyticsData.content.tagDensity} per note
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trends Tab */}
            {activeTab === 'trends' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Notes per Month</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px'
                  }}>
                    {analyticsData.trends.notesPerMonth.map((trend, index) => (
                      <div key={trend.month} style={{
                        padding: '12px',
                        background: colors.surface,
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {trend.month}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>
                          {trend.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Words per Month</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px'
                  }}>
                    {analyticsData.trends.wordsPerMonth.map((trend, index) => (
                      <div key={trend.month} style={{
                        padding: '12px',
                        background: colors.surface,
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {trend.month}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>
                          {formatNumber(trend.count)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.text
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteAnalytics; 