import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { useUIStore } from '../../store/uiStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface AISummary {
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  readingTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedTags: string[];
  relatedTopics: string[];
}

interface AISummarizerProps {
  noteId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const AISummarizer: React.FC<AISummarizerProps> = ({ noteId, isOpen, onClose }) => {
  const notes = useNoteStore(state => state.notes);
  const selectedId = useNoteStore(state => state.selectedId);
  const updateNote = useNoteStore(state => state.updateNote);
  const colors = useThemeStore(state => state.colors);
  const showAISummaryPanel = useUIStore(state => state.showAISummaryPanel);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<'summary' | 'analysis' | 'tags' | 'related'>('summary');

  // Get current note
  const currentNoteId = noteId || selectedId;
  const currentNote = notes.find(note => note.id === currentNoteId);

  // AI analysis functions
  const analyzeContent = useCallback(async (content: string, type: string): Promise<any> => {
    // Simulate AI analysis with realistic delays and results
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / delay) * 100, 100);
        setAnalysisProgress(progress);
        
        if (elapsed >= delay) {
          clearInterval(interval);
          resolve(generateMockAnalysis(content, type));
        }
      }, 100);
    });
  }, []);

  const generateMockAnalysis = (content: string, type: string): any => {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const paragraphs = content.split(/\n\s*\n/).length;
    
    const topics = extractTopics(content);
    const sentiment = analyzeSentiment(content);
    const complexity = analyzeComplexity(content);
    
    switch (type) {
      case 'summary':
        return {
          summary: generateSummary(content),
          keyPoints: generateKeyPoints(content),
          topics,
          sentiment,
          readingTime: Math.ceil(words / 200), // 200 words per minute
          complexity,
          suggestedTags: generateTags(content, topics),
          relatedTopics: generateRelatedTopics(topics)
        };
      case 'analysis':
        return {
          wordCount: words,
          sentenceCount: sentences,
          paragraphCount: paragraphs,
          averageSentenceLength: words / sentences,
          readabilityScore: calculateReadability(content),
          topicDistribution: analyzeTopicDistribution(content),
          writingStyle: analyzeWritingStyle(content)
        };
      case 'tags':
        return {
          suggestedTags: generateTags(content, topics),
          confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
          reasoning: generateTagReasoning(content, topics)
        };
      case 'related':
        return {
          relatedNotes: findRelatedNotes(content, notes),
          relatedTopics,
          similarityScores: calculateSimilarityScores(content, notes)
        };
      default:
        return null;
    }
  };

  const extractTopics = (content: string): string[] => {
    const commonTopics = [
      'technology', 'science', 'business', 'health', 'education',
      'politics', 'entertainment', 'sports', 'travel', 'food',
      'art', 'music', 'literature', 'history', 'philosophy'
    ];
    
    const foundTopics = commonTopics.filter(topic => 
      content.toLowerCase().includes(topic)
    );
    
    return foundTopics.length > 0 ? foundTopics : ['general'];
  };

  const analyzeSentiment = (content: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'happy'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'disappointing'];
    
    const positiveCount = positiveWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    const negativeCount = negativeWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  const analyzeComplexity = (content: string): 'simple' | 'moderate' | 'complex' => {
    const avgWordLength = content.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / content.split(/\s+/).length;
    const longWords = content.split(/\s+/).filter(word => word.length > 6).length;
    const totalWords = content.split(/\s+/).length;
    
    if (avgWordLength > 6 || longWords / totalWords > 0.3) return 'complex';
    if (avgWordLength > 5 || longWords / totalWords > 0.2) return 'moderate';
    return 'simple';
  };

  const generateSummary = (content: string): string => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summarySentences = sentences.slice(0, Math.min(3, sentences.length));
    return summarySentences.join('. ') + '.';
  };

  const generateKeyPoints = (content: string): string[] => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, Math.min(5, sentences.length)).map(s => s.trim());
  };

  const generateTags = (content: string, topics: string[]): string[] => {
    const contentWords = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq: Record<string, number> = {};
    
    contentWords.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return [...topWords, ...topics].slice(0, 8);
  };

  const generateRelatedTopics = (topics: string[]): string[] => {
    const topicMap: Record<string, string[]> = {
      'technology': ['programming', 'software', 'hardware', 'AI', 'data'],
      'science': ['research', 'experiments', 'discovery', 'theory'],
      'business': ['strategy', 'marketing', 'finance', 'management'],
      'health': ['fitness', 'nutrition', 'medicine', 'wellness'],
      'education': ['learning', 'teaching', 'curriculum', 'skills']
    };
    
    return topics.flatMap(topic => topicMap[topic] || []).slice(0, 6);
  };

  const calculateReadability = (content: string): number => {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const syllables = content.toLowerCase().replace(/[^a-z]/g, '').length;
    
    // Flesch Reading Ease formula
    return Math.max(0, Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)));
  };

  const analyzeTopicDistribution = (content: string): Record<string, number> => {
    const topics = extractTopics(content);
    const distribution: Record<string, number> = {};
    
    topics.forEach(topic => {
      const regex = new RegExp(topic, 'gi');
      const matches = content.match(regex) || [];
      distribution[topic] = matches.length;
    });
    
    return distribution;
  };

  const analyzeWritingStyle = (content: string): string => {
    const avgSentenceLength = content.split(/\s+/).length / content.split(/[.!?]+/).length;
    const paragraphCount = content.split(/\n\s*\n/).length;
    
    if (avgSentenceLength > 20) return 'formal';
    if (avgSentenceLength < 10) return 'casual';
    if (paragraphCount > 5) return 'detailed';
    return 'balanced';
  };

  const generateTagReasoning = (content: string, topics: string[]): string[] => {
    return topics.map(topic => 
      `"${topic}" appears ${(content.match(new RegExp(topic, 'gi')) || []).length} times in the content`
    );
  };

  const findRelatedNotes = (content: string, allNotes: any[]): any[] => {
    const contentTopics = extractTopics(content);
    const contentWords = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    return allNotes
      .filter(note => note.id !== currentNoteId)
      .map(note => {
        const noteWords = note.body.toLowerCase().match(/\b\w+\b/g) || [];
        const commonWords = contentWords.filter(word => noteWords.includes(word));
        const similarity = commonWords.length / Math.max(contentWords.length, noteWords.length);
        
        return { ...note, similarity };
      })
      .filter(note => note.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  };

  const calculateSimilarityScores = (content: string, allNotes: any[]): Record<string, number> => {
    const scores: Record<string, number> = {};
    
    allNotes.forEach(note => {
      if (note.id !== currentNoteId) {
        const contentWords = content.toLowerCase().match(/\b\w+\b/g) || [];
        const noteWords = note.body.toLowerCase().match(/\b\w+\b/g) || [];
        const commonWords = contentWords.filter(word => noteWords.includes(word));
        scores[note.id] = commonWords.length / Math.max(contentWords.length, noteWords.length);
      }
    });
    
    return scores;
  };

  // Handle analysis
  const handleAnalyze = useCallback(async () => {
    if (!currentNote) return;
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);
    
    try {
      const result = await PerformanceUtils.measureAsync(
        'ai_analysis',
        () => analyzeContent(currentNote.body, analysisType)
      );
      
      if (analysisType === 'summary') {
        setSummary(result);
      }
      
      loggingService.info('AI analysis completed', { 
        noteId: currentNote.id, 
        analysisType,
        result 
      });
    } catch (err) {
      setError('Analysis failed. Please try again.');
      loggingService.error('AI analysis failed', err as Error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [currentNote, analysisType, analyzeContent]);

  // Apply suggested tags
  const handleApplyTags = useCallback(() => {
    if (!currentNote || !summary) return;
    
    const newTags = [...new Set([...currentNote.tags, ...summary.suggestedTags])];
    updateNote(currentNote.id, { tags: newTags });
    
    loggingService.info('Applied AI suggested tags', { 
      noteId: currentNote.id, 
      newTags 
    });
  }, [currentNote, summary, updateNote]);

  // Navigate to related note
  const handleNavigateToNote = useCallback((noteId: string) => {
    // This would be handled by the parent component
    loggingService.info('Navigating to related note', { noteId });
  }, []);

  if (!isOpen || !currentNote) return null;

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
        maxWidth: '800px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>AI Analysis</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close AI analysis panel"
          >
            ×
          </button>
        </div>

        {/* Note Info */}
        <div style={{
          padding: '16px',
          background: colors.surface,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: colors.text }}>
            {currentNote.title}
          </h3>
          <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
            {currentNote.body.length} characters • {currentNote.tags.join(', ')}
          </p>
        </div>

        {/* Analysis Type Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
            Analysis Type:
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { value: 'summary', label: 'Summary', icon: '📝' },
              { value: 'analysis', label: 'Content Analysis', icon: '📊' },
              { value: 'tags', label: 'Auto-tagging', icon: '🏷️' },
              { value: 'related', label: 'Related Notes', icon: '🔗' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setAnalysisType(type.value as any)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${analysisType === type.value ? colors.primary : colors.border}`,
                  borderRadius: '4px',
                  background: analysisType === type.value ? colors.primary : 'transparent',
                  color: analysisType === type.value ? 'white' : colors.text,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analysis Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          style={{
            width: '100%',
            padding: '12px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing ? 0.6 : 1,
            marginBottom: '20px'
          }}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
        </button>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              width: '100%',
              height: '4px',
              background: colors.border,
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${analysisProgress}%`,
                height: '100%',
                background: colors.primary,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ 
              textAlign: 'center', 
              marginTop: '8px', 
              fontSize: '12px', 
              color: colors.textSecondary 
            }}>
              {Math.round(analysisProgress)}% complete
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c33',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Analysis Results */}
        {summary && analysisType === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Summary */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Summary</h4>
              <p style={{ 
                margin: 0, 
                color: colors.text, 
                lineHeight: '1.6',
                background: colors.surface,
                padding: '12px',
                borderRadius: '4px'
              }}>
                {summary.summary}
              </p>
            </div>

            {/* Key Points */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Key Points</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: colors.text }}>
                {summary.keyPoints.map((point, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>{point}</li>
                ))}
              </ul>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div style={{
                padding: '12px',
                background: colors.surface,
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                  {summary.readingTime}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  min read
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                background: colors.surface,
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                  {summary.complexity}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  complexity
                </div>
              </div>
              
              <div style={{
                padding: '12px',
                background: colors.surface,
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                  {summary.sentiment}
                </div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                  sentiment
                </div>
              </div>
            </div>

            {/* Suggested Tags */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h4 style={{ margin: 0, color: colors.text }}>Suggested Tags</h4>
                <button
                  onClick={handleApplyTags}
                  style={{
                    padding: '4px 8px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Apply Tags
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {summary.suggestedTags.map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 8px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: colors.text
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Related Topics */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', color: colors.text }}>Related Topics</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {summary.relatedTopics.map((topic, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 8px',
                      background: colors.surfaceHover,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: colors.textSecondary
                    }}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
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

export default AISummarizer; 