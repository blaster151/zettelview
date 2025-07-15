import React, { useState, useCallback } from 'react';
import { useNoteStore } from '../store/noteStore';

interface AISummarizerProps {
  noteId?: string;
  onClose?: () => void;
}

interface AIResponse {
  summary?: string;
  answer?: string;
  questions?: string[];
  tags?: string[];
  relatedNotes?: string[];
}

const AISummarizer: React.FC<AISummarizerProps> = ({ noteId, onClose }) => {
  const { getNote, notes } = useNoteStore();
  const [isLoading, setIsLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [mode, setMode] = useState<'summary' | 'question' | 'insights'>('summary');

  const currentNote = noteId ? getNote(noteId) : null;

  // Mock AI service - in a real implementation, this would call an actual AI API
  const mockAIService = {
    async summarize(content: string): Promise<AIResponse> {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const summary = sentences.slice(0, 3).join('. ') + '.';
      
      const questions = [
        'What are the main topics discussed in this note?',
        'How does this relate to other notes in your knowledge base?',
        'What actions or next steps are mentioned?'
      ];

      const tags = content.match(/\b\w{4,}\b/g)?.slice(0, 5) || [];
      
      return {
        summary,
        questions,
        tags: [...new Set(tags)]
      };
    },

    async answerQuestion(content: string, question: string): Promise<AIResponse> {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const answer = `Based on the content, ${question.toLowerCase().includes('what') ? 'the main points are' : 'the answer is'} related to the key concepts discussed in the note. This appears to be connected to the overall theme of the content.`;
      
      return { answer };
    },

    async generateInsights(content: string, allNotes: any[]): Promise<AIResponse> {
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const wordCount = content.split(/\s+/).length;
      const linkCount = (content.match(/\[\[([^\]]+)\]\]/g) || []).length;
      const tagCount = currentNote?.tags.length || 0;
      
      const insights = [
        `This note contains ${wordCount} words and ${linkCount} internal links.`,
        `It has ${tagCount} tags for categorization.`,
        `The content appears to be ${wordCount > 500 ? 'comprehensive' : 'concise'}.`,
        linkCount > 0 ? 'This note is well-connected to other notes in your knowledge base.' : 'Consider adding internal links to connect this note with others.'
      ];

      const relatedNotes = allNotes
        .filter(note => note.id !== noteId)
        .slice(0, 3)
        .map(note => note.title);

      return {
        summary: insights.join(' '),
        relatedNotes
      };
    }
  };

  const handleSummarize = useCallback(async () => {
    if (!currentNote) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      const result = await mockAIService.summarize(currentNote.body);
      setResponse(result);
    } catch (error) {
      console.error('AI summarization failed:', error);
      setResponse({ summary: 'Failed to generate summary. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [currentNote]);

  const handleAskQuestion = useCallback(async () => {
    if (!currentNote || !question.trim()) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      const result = await mockAIService.answerQuestion(currentNote.body, question);
      setResponse(result);
    } catch (error) {
      console.error('AI question answering failed:', error);
      setResponse({ answer: 'Failed to answer question. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [currentNote, question]);

  const handleGenerateInsights = useCallback(async () => {
    if (!currentNote) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      const result = await mockAIService.generateInsights(currentNote.body, notes);
      setResponse(result);
    } catch (error) {
      console.error('AI insights generation failed:', error);
      setResponse({ summary: 'Failed to generate insights. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }, [currentNote, notes]);

  const handleSuggestedQuestion = useCallback((suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
    setMode('question');
  }, []);

  if (!currentNote) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: '#666'
      }}>
        Select a note to analyze with AI
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f8f9fa'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e1e4e8',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#24292e' }}>
            AI Analysis: {currentNote.title}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#586069' }}>
            Get insights, summaries, and answers about your note
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px'
            }}
            aria-label="Close AI analysis"
          >
            ×
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid #e1e4e8',
        background: 'white'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setMode('summary')}
            style={{
              background: mode === 'summary' ? '#007bff' : 'transparent',
              color: mode === 'summary' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Summary
          </button>
          <button
            onClick={() => setMode('question')}
            style={{
              background: mode === 'question' ? '#007bff' : 'transparent',
              color: mode === 'question' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Ask Question
          </button>
          <button
            onClick={() => setMode('insights')}
            style={{
              background: mode === 'insights' ? '#007bff' : 'transparent',
              color: mode === 'insights' ? 'white' : '#007bff',
              border: '1px solid #007bff',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Insights
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {mode === 'summary' && (
          <div>
            <button
              onClick={handleSummarize}
              disabled={isLoading}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Generating Summary...' : 'Generate Summary'}
            </button>

            {response?.summary && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Summary</h3>
                <div style={{
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #e1e4e8',
                  borderRadius: '6px',
                  lineHeight: '1.6'
                }}>
                  {response.summary}
                </div>
              </div>
            )}

            {response?.questions && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Suggested Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {response.questions.map((q, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(q)}
                      style={{
                        background: 'none',
                        border: '1px solid #e1e4e8',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                        color: '#24292e'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {response?.tags && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Suggested Tags</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {response.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        background: '#e3e7ed',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#586069'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'question' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="question-input" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                Ask a question about this note:
              </label>
              <input
                id="question-input"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What are the main points? How does this relate to other topics?"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e1e4e8',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleAskQuestion();
                  }
                }}
              />
            </div>

            <button
              onClick={handleAskQuestion}
              disabled={isLoading || !question.trim()}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: isLoading || !question.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading || !question.trim() ? 0.6 : 1
              }}
            >
              {isLoading ? 'Analyzing...' : 'Ask Question'}
            </button>

            {response?.answer && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Answer</h3>
                <div style={{
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #e1e4e8',
                  borderRadius: '6px',
                  lineHeight: '1.6'
                }}>
                  {response.answer}
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'insights' && (
          <div>
            <button
              onClick={handleGenerateInsights}
              disabled={isLoading}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? 'Generating Insights...' : 'Generate Insights'}
            </button>

            {response?.summary && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Note Analysis</h3>
                <div style={{
                  padding: '16px',
                  background: 'white',
                  border: '1px solid #e1e4e8',
                  borderRadius: '6px',
                  lineHeight: '1.6'
                }}>
                  {response.summary}
                </div>
              </div>
            )}

            {response?.relatedNotes && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#24292e' }}>Related Notes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {response.relatedNotes.map((noteTitle, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid #e1e4e8',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#24292e'
                      }}
                    >
                      {noteTitle}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            color: '#586069'
          }}>
            <div style={{ marginRight: '12px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #e1e4e8',
                borderTop: '2px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
            AI is analyzing your note...
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AISummarizer; 