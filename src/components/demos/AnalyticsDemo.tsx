import React, { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useNoteStore } from '../../store/noteStore';
import AdvancedAnalytics from '../features/AdvancedAnalytics';
import { AnalyticsService } from '../../services/analyticsService';

const AnalyticsDemo: React.FC = () => {
  const { colors } = useThemeStore();
  const { notes } = useNoteStore();
  
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // Initialize analytics service
  React.useEffect(() => {
    AnalyticsService.initialize(notes);
  }, [notes]);

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Key metrics and insights at a glance',
      icon: '📊',
      color: colors.primary
    },
    {
      id: 'content',
      title: 'Content Analysis',
      description: 'Deep analysis of writing style and readability',
      icon: '📝',
      color: colors.secondary
    },
    {
      id: 'productivity',
      title: 'Productivity Metrics',
      description: 'Track your writing habits and goals',
      icon: '⚡',
      color: colors.success
    },
    {
      id: 'trends',
      title: 'Trend Analysis',
      description: 'Visualize patterns and predict growth',
      icon: '📈',
      color: colors.warning
    },
    {
      id: 'comparison',
      title: 'Comparative Analysis',
      description: 'Compare periods and benchmark performance',
      icon: '🔍',
      color: colors.accent
    }
  ];

  const features = [
    {
      title: 'Comprehensive Analytics',
      description: 'Track total notes, words, productivity scores, and writing streaks with detailed insights',
      icon: '📊',
      examples: ['Total Notes: 150', 'Total Words: 25,000', 'Productivity Score: 85/100', 'Writing Streak: 12 days']
    },
    {
      title: 'Content Intelligence',
      description: 'Analyze writing style, readability, sentiment, and topic clusters automatically',
      icon: '🧠',
      examples: ['Readability Score: 72/100', 'Vocabulary Richness: 45%', 'Sentiment: Positive', '5 Topic Clusters']
    },
    {
      title: 'Productivity Tracking',
      description: 'Monitor daily goals, weekly trends, and monthly insights with progress tracking',
      icon: '🎯',
      examples: ['Daily Goal: 3 notes', 'Weekly Progress: 18/21', 'Consistency Score: 92%', 'Goal Completion: 85%']
    },
    {
      title: 'Trend Visualization',
      description: 'See seasonal patterns, growth predictions, and activity trends over time',
      icon: '📈',
      examples: ['Most Active: Tuesday', 'Peak Hours: 9-11 AM', 'Growth Rate: +15%', '30-day Predictions']
    },
    {
      title: 'Performance Comparison',
      description: 'Compare current performance with previous periods and benchmark against averages',
      icon: '🏆',
      examples: ['Period Growth: +12%', 'Percentile Rank: 85th', 'vs Average: Above', 'Personal Best: 92%']
    },
    {
      title: 'Smart Insights',
      description: 'Get actionable insights and recommendations to improve your note-taking habits',
      icon: '💡',
      examples: ['Writing Time: 45 min', 'Reading Time: 120 min', 'Tag Diversity: 78%', 'Content Complexity: Medium']
    }
  ];

  const sampleData = {
    totalNotes: 150,
    totalWords: 25000,
    productivityScore: 85,
    writingStreak: 12,
    readingTime: 120,
    tagDiversity: 78,
    topTags: [
      { tag: 'project', count: 25, percentage: 16.7 },
      { tag: 'ideas', count: 20, percentage: 13.3 },
      { tag: 'meeting', count: 18, percentage: 12.0 },
      { tag: 'research', count: 15, percentage: 10.0 },
      { tag: 'todo', count: 12, percentage: 8.0 }
    ],
    contentTypes: [
      { type: 'General', count: 60, percentage: 40.0 },
      { type: 'Technical', count: 35, percentage: 23.3 },
      { type: 'Creative', count: 30, percentage: 20.0 },
      { type: 'Formal', count: 25, percentage: 16.7 }
    ]
  };

  return (
    <div style={{
      padding: '24px',
      background: colors.background,
      minHeight: '100vh',
      color: colors.text
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: colors.primary,
            marginBottom: '8px'
          }}>
            📊 Advanced Analytics & Insights Demo
          </h1>
          <p style={{
            fontSize: '18px',
            color: colors.textSecondary,
            lineHeight: '1.5',
            marginBottom: '16px'
          }}>
            Discover deep insights into your note-taking patterns, productivity metrics, and content analysis
          </p>
          <button
            onClick={() => setShowAnalytics(true)}
            style={{
              padding: '12px 24px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            🚀 Launch Analytics Dashboard
          </button>
        </div>

        {/* Features Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          {features.map((feature, index) => (
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
                  background: `${colors.primary}20`,
                  borderRadius: '12px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: colors.text,
                  margin: 0
                }}>
                  {feature.title}
                </h3>
              </div>
              <p style={{
                fontSize: '14px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                marginBottom: '16px'
              }}>
                {feature.description}
              </p>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {feature.examples.map((example, exampleIndex) => (
                  <div
                    key={exampleIndex}
                    style={{
                      fontSize: '12px',
                      color: colors.primary,
                      padding: '4px 8px',
                      background: `${colors.primary}10`,
                      borderRadius: '4px',
                      display: 'inline-block',
                      width: 'fit-content'
                    }}
                  >
                    {example}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sample Data Preview */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📊 Sample Analytics Data
          </h2>
          
          {/* Key Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '4px'
              }}>
                {sampleData.totalNotes}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                Total Notes
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.secondary,
                marginBottom: '4px'
              }}>
                {sampleData.totalWords.toLocaleString()}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                Total Words
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.success,
                marginBottom: '4px'
              }}>
                {sampleData.productivityScore}/100
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                Productivity Score
              </div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: colors.background,
              borderRadius: '8px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: colors.warning,
                marginBottom: '4px'
              }}>
                {sampleData.writingStreak} days
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.textSecondary
              }}>
                Writing Streak
              </div>
            </div>
          </div>

          {/* Top Tags and Content Types */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '12px'
              }}>
                🏷️ Top Tags
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sampleData.topTags.map((tag, index) => (
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
                        {tag.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '12px'
              }}>
                📝 Content Types
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sampleData.contentTypes.map((type, index) => (
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
                        {type.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Sections */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            📋 Analytics Sections
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {sections.map((section) => (
              <div
                key={section.id}
                style={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => {
                  setShowAnalytics(true);
                  setActiveSection(section.id);
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '24px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `${section.color}20`,
                    borderRadius: '8px'
                  }}>
                    {section.icon}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: colors.text,
                    margin: 0
                  }}>
                    {section.title}
                  </h3>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: colors.textSecondary,
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits and Use Cases */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '16px'
          }}>
            💡 Benefits & Use Cases
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '12px'
              }}>
                🎯 Productivity Improvement
              </h3>
              <ul style={{
                fontSize: '14px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                paddingLeft: '20px'
              }}>
                <li>Track writing habits and identify optimal times</li>
                <li>Set and monitor daily/weekly goals</li>
                <li>Maintain writing streaks for motivation</li>
                <li>Analyze productivity patterns</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '12px'
              }}>
                📊 Content Insights
              </h3>
              <ul style={{
                fontSize: '14px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                paddingLeft: '20px'
              }}>
                <li>Understand your writing style and tone</li>
                <li>Improve readability and clarity</li>
                <li>Identify topic clusters and themes</li>
                <li>Track content diversity and balance</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '12px'
              }}>
                📈 Growth Tracking
              </h3>
              <ul style={{
                fontSize: '14px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                paddingLeft: '20px'
              }}>
                <li>Visualize progress over time</li>
                <li>Predict future growth patterns</li>
                <li>Compare performance across periods</li>
                <li>Benchmark against personal bests</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '12px'
              }}>
                🔍 Data-Driven Decisions
              </h3>
              <ul style={{
                fontSize: '14px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                paddingLeft: '20px'
              }}>
                <li>Make informed writing decisions</li>
                <li>Optimize note-taking strategies</li>
                <li>Identify areas for improvement</li>
                <li>Set realistic goals based on data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{
          textAlign: 'center',
          padding: '32px',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: colors.text,
            marginBottom: '12px'
          }}>
            Ready to Explore Your Analytics?
          </h2>
          <p style={{
            fontSize: '16px',
            color: colors.textSecondary,
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            Discover insights about your note-taking patterns, productivity trends, and content analysis
          </p>
          <button
            onClick={() => setShowAnalytics(true)}
            style={{
              padding: '16px 32px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '0 auto',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🚀 Launch Analytics Dashboard
          </button>
        </div>
      </div>

      {/* Analytics Modal */}
      <AdvancedAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  );
};

export default AnalyticsDemo; 