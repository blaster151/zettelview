import React, { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import { AnalyticsService, NoteAnalytics, ContentAnalysis, ProductivityMetrics, TrendAnalysis, ComparativeAnalysis } from '../../services/analyticsService';

interface AdvancedAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ isOpen, onClose }) => {
  const { colors } = useThemeStore();
  const { notes } = useNoteStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<NoteAnalytics | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [productivityMetrics, setProductivityMetrics] = useState<ProductivityMetrics | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [comparativeAnalysis, setComparativeAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize analytics service
  useEffect(() => {
    AnalyticsService.initialize(notes);
  }, [notes]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsData, contentData, productivityData, trendData, comparativeData] = await Promise.all([
        AnalyticsService.getNoteAnalytics(),
        AnalyticsService.getContentAnalysis(),
        AnalyticsService.getProductivityMetrics(),
        AnalyticsService.getTrendAnalysis(),
        AnalyticsService.getComparativeAnalysis()
      ]);
      
      setAnalytics(analyticsData);
      setContentAnalysis(contentData);
      setProductivityMetrics(productivityData);
      setTrendAnalysis(trendData);
      setComparativeAnalysis(comparativeData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, loadAnalytics]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'content', label: 'Content Analysis', icon: '📝' },
    { id: 'productivity', label: 'Productivity', icon: '⚡' },
    { id: 'trends', label: 'Trends', icon: '📈' },
    { id: 'comparison', label: 'Comparison', icon: '🔍' }
  ];

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        maxWidth: '1400px',
        maxHeight: '90vh',
        width: '95%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: colors.surface
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: colors.text,
              margin: 0,
              marginBottom: '4px'
            }}>
              📊 Advanced Analytics Dashboard
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              margin: 0
            }}>
              Deep insights into your note-taking patterns and productivity
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '8px',
              borderRadius: '6px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.surface
        }}>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 16px',
                  background: activeTab === tab.id ? colors.primary : 'transparent',
                  color: activeTab === tab.id ? 'white' : colors.text,
                  border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              color: colors.textSecondary
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading Analytics...</div>
                <div style={{ fontSize: '14px' }}>Analyzing your note patterns and productivity</div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && analytics && (
                <OverviewTab analytics={analytics} colors={colors} />
              )}
              
              {activeTab === 'content' && contentAnalysis && (
                <ContentAnalysisTab analysis={contentAnalysis} colors={colors} />
              )}
              
              {activeTab === 'productivity' && productivityMetrics && (
                <ProductivityTab metrics={productivityMetrics} colors={colors} />
              )}
              
              {activeTab === 'trends' && trendAnalysis && (
                <TrendsTab trends={trendAnalysis} colors={colors} />
              )}
              
              {activeTab === 'comparison' && comparativeAnalysis && (
                <ComparisonTab comparison={comparativeAnalysis} colors={colors} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ analytics: NoteAnalytics; colors: any }> = ({ analytics, colors }) => {
  const metrics = [
    {
      title: 'Total Notes',
      value: analytics.totalNotes,
      icon: '📄',
      color: colors.primary,
      description: 'Total number of notes created'
    },
    {
      title: 'Total Words',
      value: analytics.totalWords.toLocaleString(),
      icon: '📝',
      color: colors.secondary,
      description: 'Total words written across all notes'
    },
    {
      title: 'Productivity Score',
      value: `${analytics.productivityScore}/100`,
      icon: '⚡',
      color: colors.success,
      description: 'Overall productivity rating'
    },
    {
      title: 'Writing Streak',
      value: `${analytics.writingStreak} days`,
      icon: '🔥',
      color: colors.warning,
      description: 'Current consecutive days of writing'
    },
    {
      title: 'Reading Time',
      value: `${analytics.readingTime} min`,
      icon: '📖',
      color: colors.accent,
      description: 'Estimated time to read all notes'
    },
    {
      title: 'Tag Diversity',
      value: `${Math.round(analytics.tagDiversity * 100)}%`,
      icon: '🏷️',
      color: colors.textSecondary,
      description: 'Diversity of tags used'
    }
  ];

  return (
    <div>
      {/* Key Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '32px',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${metric.color}20`,
                borderRadius: '12px'
              }}>
                {metric.icon}
              </div>
              <div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: colors.text,
                  margin: 0,
                  marginBottom: '4px'
                }}>
                  {metric.title}
                </h3>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: metric.color
                }}>
                  {metric.value}
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              margin: 0
            }}>
              {metric.description}
            </p>
          </div>
        ))}
      </div>

      {/* Top Tags and Content Types */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Top Tags */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            🏷️ Top Tags
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analytics.topTags.map((tag, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: colors.background,
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontSize: '14px', color: colors.text }}>
                  {tag.tag}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                    {tag.count} notes
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: colors.primary,
                    fontWeight: 'bold'
                  }}>
                    {Math.round(tag.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Types */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📝 Content Types
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {analytics.contentTypes.map((type, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: colors.background,
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontSize: '14px', color: colors.text }}>
                  {type.type}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                    {type.count} notes
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: colors.secondary,
                    fontWeight: 'bold'
                  }}>
                    {Math.round(type.percentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Analysis Tab Component
const ContentAnalysisTab: React.FC<{ analysis: ContentAnalysis; colors: any }> = ({ analysis, colors }) => {
  return (
    <div>
      {/* Readability and Complexity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📖 Readability Analysis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                Flesch Reading Ease
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: analysis.readabilityScore > 60 ? colors.success : colors.warning
              }}>
                {Math.round(analysis.readabilityScore)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                Vocabulary Richness
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {Math.round(analysis.vocabularyRichness * 100)}%
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                Avg Sentence Length
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.secondary
              }}>
                {Math.round(analysis.averageSentenceLength)} words
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            🎭 Writing Style
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(analysis.writingStyle).map(([style, percentage]) => (
              <div key={style}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: colors.text,
                    textTransform: 'capitalize'
                  }}>
                    {style}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: colors.primary
                  }}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: colors.border,
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: colors.primary,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            😊 Sentiment Analysis
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                Positive
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.success
              }}>
                {Math.round(analysis.sentimentAnalysis.positive)}%
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                Neutral
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.textSecondary
              }}>
                {Math.round(analysis.sentimentAnalysis.neutral)}%
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                Negative
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.warning
              }}>
                {Math.round(analysis.sentimentAnalysis.negative)}%
              </span>
            </div>
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: colors.background,
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.primary,
                textTransform: 'capitalize'
              }}>
                Overall: {analysis.sentimentAnalysis.overall}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Clusters */}
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: '16px'
        }}>
          🎯 Topic Clusters
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {analysis.topicClusters.map((cluster, index) => (
            <div
              key={index}
              style={{
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: colors.text,
                  margin: 0
                }}>
                  {cluster.topic}
                </h4>
                <span style={{
                  fontSize: '12px',
                  color: colors.primary,
                  fontWeight: 'bold'
                }}>
                  {cluster.frequency} notes
                </span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginBottom: '8px'
              }}>
                {cluster.keywords.map((keyword, keywordIndex) => (
                  <span
                    key={keywordIndex}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: colors.primary,
                      color: 'white',
                      borderRadius: '10px'
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                {cluster.notes.slice(0, 3).join(', ')}
                {cluster.notes.length > 3 && '...'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Productivity Tab Component
const ProductivityTab: React.FC<{ metrics: ProductivityMetrics; colors: any }> = ({ metrics, colors }) => {
  return (
    <div>
      {/* Goals and Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            🎯 Daily Goals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: colors.text }}>
                  Notes Created
                </span>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                  {metrics.goals.dailyProgress}/{metrics.goals.dailyGoal}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                background: colors.border,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, (metrics.goals.dailyProgress / metrics.goals.dailyGoal) * 100)}%`,
                  height: '100%',
                  background: colors.success,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              background: colors.background,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {Math.round(metrics.goals.goalCompletionRate)}%
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                Goal Completion Rate
              </div>
            </div>
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            🔥 Streaks
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Current Writing Streak
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.warning
              }}>
                {metrics.streaks.currentWritingStreak} days
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Longest Writing Streak
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.success
              }}>
                {metrics.streaks.longestWritingStreak} days
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Best Day
              </span>
              <span style={{
                fontSize: '14px',
                color: colors.textSecondary
              }}>
                {metrics.streaks.bestDay}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📈 Weekly Progress
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Notes This Week
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {metrics.goals.weeklyProgress}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Monthly Progress
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.secondary
              }}>
                {metrics.goals.monthlyProgress}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Consistency Score
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.accent
              }}>
                {Math.round(metrics.weeklyTrends[0]?.consistencyScore || 0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: '16px'
        }}>
          📅 Daily Activity (Last 7 Days)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {metrics.dailyStats.slice(0, 7).map((stat, index) => (
            <div
              key={index}
              style={{
                background: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary,
                marginBottom: '8px'
              }}>
                {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '4px'
              }}>
                {stat.notesCreated}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                {stat.wordsWritten} words
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Trends Tab Component
const TrendsTab: React.FC<{ trends: TrendAnalysis; colors: any }> = ({ trends, colors }) => {
  return (
    <div>
      {/* Seasonal Patterns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📅 Day of Week Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(trends.seasonalPatterns.dayOfWeek).map(([day, count]) => (
              <div
                key={day}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: colors.background,
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontSize: '14px', color: colors.text }}>
                  {day}
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colors.primary
                }}>
                  {count} notes
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            🕐 Hour of Day Activity
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '8px'
          }}>
            {Object.entries(trends.seasonalPatterns.hourOfDay).map(([hour, count]) => (
              <div
                key={hour}
                style={{
                  textAlign: 'center',
                  padding: '8px',
                  background: colors.background,
                  borderRadius: '6px'
                }}
              >
                <div style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                  marginBottom: '4px'
                }}>
                  {hour}:00
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: colors.primary
                }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📊 Growth Predictions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trends.growthPredictions.slice(0, 7).map((prediction, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: colors.background,
                  borderRadius: '6px'
                }}
              >
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {new Date(prediction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: colors.primary
                  }}>
                    {prediction.predictedNotes}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: colors.textSecondary
                  }}>
                    {prediction.confidence}% conf.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Note Creation Trend */}
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: '16px'
        }}>
          📈 Note Creation Trend (Last 30 Days)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '8px'
        }}>
          {trends.noteCreationTrend.slice(0, 30).map((trend, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                padding: '8px',
                background: colors.background,
                borderRadius: '6px'
              }}
            >
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary,
                marginBottom: '4px'
              }}>
                {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {trend.count}
              </div>
              <div style={{
                fontSize: '10px',
                color: colors.textSecondary
              }}>
                Total: {trend.cumulative}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Comparison Tab Component
const ComparisonTab: React.FC<{ comparison: ComparativeAnalysis; colors: any }> = ({ comparison, colors }) => {
  return (
    <div>
      {/* Period Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📊 Current Period
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Total Notes
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {comparison.periodComparison.current.totalNotes}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Total Words
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.secondary
              }}>
                {comparison.periodComparison.current.totalWords.toLocaleString()}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                Productivity Score
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: colors.success
              }}>
                {comparison.periodComparison.current.productivityScore}/100
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📈 Improvement
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(comparison.periodComparison.improvement).map(([metric, growth]) => (
              <div key={metric}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '14px',
                    color: colors.text,
                    textTransform: 'capitalize'
                  }}>
                    {metric.replace('Growth', '')}
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: growth >= 0 ? colors.success : colors.warning
                  }}>
                    {growth >= 0 ? '+' : ''}{Math.round(growth)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: colors.border,
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(100, Math.abs(growth))}%`,
                    height: '100%',
                    background: growth >= 0 ? colors.success : colors.warning,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            🏆 Benchmark
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: colors.primary
              }}>
                {Math.round(comparison.benchmarkComparison.percentile)}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                Percentile Rank
              </div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                vs Average User
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.accent
              }}>
                {comparison.benchmarkComparison.current.totalNotes > comparison.benchmarkComparison.averageUser.totalNotes ? 'Above' : 'Below'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: colors.text }}>
                vs Personal Best
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: colors.success
              }}>
                {Math.round((comparison.benchmarkComparison.current.productivityScore / comparison.benchmarkComparison.personalBest.productivityScore) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics; 