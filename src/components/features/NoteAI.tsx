import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'generation' | 'analysis' | 'enhancement' | 'automation';
  enabled: boolean;
  config: AIFeatureConfig;
}

interface AIFeatureConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  autoApply: boolean;
  promptTemplate: string;
  outputFormat: 'text' | 'markdown' | 'json' | 'html';
}

interface AIGeneration {
  id: string;
  type: string;
  prompt: string;
  result: string;
  timestamp: Date;
  metadata: {
    model: string;
    tokens: number;
    duration: number;
    cost: number;
  };
}

interface AISuggestion {
  id: string;
  type: 'title' | 'tags' | 'summary' | 'related' | 'improvement';
  content: string;
  confidence: number;
  applied: boolean;
  timestamp: Date;
}

interface NoteAIProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
}

const NoteAI: React.FC<NoteAIProps> = ({ noteId, isOpen, onClose }) => {
  const notes = useNoteStore(state => state.notes);
  const updateNote = useNoteStore(state => state.updateNote);
  const colors = useThemeStore(state => state.colors);
  
  const [activeTab, setActiveTab] = useState<'features' | 'generation' | 'suggestions' | 'analysis'>('features');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [generations, setGenerations] = useState<AIGeneration[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generationType, setGenerationType] = useState<'summary' | 'expansion' | 'rewrite' | 'custom'>('summary');
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  // Get current note
  const currentNote = notes.find(note => note.id === noteId);

  // Initialize AI features
  const aiFeatures = useMemo<AIFeature[]>(() => [
    {
      id: 'content-generation',
      name: 'Content Generation',
      description: 'Generate new content based on your notes',
      icon: '✨',
      category: 'generation',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        autoApply: false,
        promptTemplate: 'Generate content based on: {content}',
        outputFormat: 'markdown'
      }
    },
    {
      id: 'smart-summarization',
      name: 'Smart Summarization',
      description: 'Create intelligent summaries of your notes',
      icon: '📝',
      category: 'analysis',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 500,
        autoApply: true,
        promptTemplate: 'Summarize the following content: {content}',
        outputFormat: 'text'
      }
    },
    {
      id: 'auto-tagging',
      name: 'Auto Tagging',
      description: 'Automatically suggest relevant tags',
      icon: '🏷️',
      category: 'enhancement',
      enabled: true,
      config: {
        model: 'gpt-3.5-turbo',
        temperature: 0.2,
        maxTokens: 200,
        autoApply: false,
        promptTemplate: 'Extract relevant tags from: {content}',
        outputFormat: 'json'
      }
    },
    {
      id: 'content-improvement',
      name: 'Content Improvement',
      description: 'Enhance writing quality and clarity',
      icon: '📈',
      category: 'enhancement',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2000,
        autoApply: false,
        promptTemplate: 'Improve the writing quality of: {content}',
        outputFormat: 'markdown'
      }
    },
    {
      id: 'related-content',
      name: 'Related Content',
      description: 'Find and suggest related notes and topics',
      icon: '🔗',
      category: 'analysis',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.4,
        maxTokens: 300,
        autoApply: false,
        promptTemplate: 'Find related topics for: {content}',
        outputFormat: 'json'
      }
    },
    {
      id: 'code-analysis',
      name: 'Code Analysis',
      description: 'Analyze and improve code snippets',
      icon: '💻',
      category: 'analysis',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 1500,
        autoApply: false,
        promptTemplate: 'Analyze and improve this code: {content}',
        outputFormat: 'markdown'
      }
    },
    {
      id: 'translation',
      name: 'Translation',
      description: 'Translate content to different languages',
      icon: '🌐',
      category: 'generation',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1000,
        autoApply: false,
        promptTemplate: 'Translate to {target_language}: {content}',
        outputFormat: 'text'
      }
    },
    {
      id: 'question-answering',
      name: 'Question Answering',
      description: 'Answer questions based on your notes',
      icon: '❓',
      category: 'analysis',
      enabled: true,
      config: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 800,
        autoApply: false,
        promptTemplate: 'Answer this question based on: {content}\nQuestion: {question}',
        outputFormat: 'text'
      }
    }
  ], []);

  // Generate content using AI
  const generateContent = useCallback(async (type: string, prompt?: string) => {
    if (!currentNote) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const result = await PerformanceUtils.measureAsync(
        'ai_generation',
        async () => {
          // Simulate AI processing with progress
          const steps = ['Analyzing content', 'Generating response', 'Formatting output'];
          
          for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            setProcessingProgress((i + 1) * 33);
          }

          // Generate mock AI response based on type
          let generatedContent = '';
          const baseContent = currentNote.body;

          switch (type) {
            case 'summary':
              generatedContent = `## Summary\n\nThis note covers ${baseContent.split(' ').length} words and discusses key concepts related to ${currentNote.tags.join(', ')}. The main points include:\n\n- Point 1: ${baseContent.substring(0, 100)}...\n- Point 2: ${baseContent.substring(100, 200)}...\n- Point 3: ${baseContent.substring(200, 300)}...\n\n**Key Takeaway**: This content provides valuable insights for future reference.`;
              break;
            case 'expansion':
              generatedContent = `## Expanded Content\n\n${baseContent}\n\n### Additional Context\n\nBased on the content above, here are some related insights and expanded explanations:\n\n1. **Deeper Analysis**: ${baseContent.substring(0, 150)}...\n2. **Related Concepts**: This connects to broader themes in the field.\n3. **Practical Applications**: Consider how this applies to real-world scenarios.\n4. **Future Considerations**: Think about how this might evolve over time.`;
              break;
            case 'rewrite':
              generatedContent = `## Improved Version\n\n${baseContent.split('.').map(sentence => 
                sentence.trim() ? sentence.trim() + '.' : ''
              ).filter(Boolean).join(' ')}\n\n### Enhanced Clarity\n\nThe content has been restructured for better readability and flow. Key improvements include:\n\n- Clearer sentence structure\n- Better paragraph organization\n- Improved logical flow\n- Enhanced readability`;
              break;
            case 'custom':
              generatedContent = `## Custom Generation\n\nBased on your prompt: "${prompt}"\n\nHere's the AI-generated response:\n\n${baseContent.substring(0, 200)}...\n\n**AI Analysis**: This content relates to your request in the following ways:\n\n1. Direct relevance to the topic\n2. Supporting information\n3. Additional context\n4. Practical implications`;
              break;
            default:
              generatedContent = `Generated content for: ${type}\n\n${baseContent.substring(0, 300)}...`;
          }

          return {
            content: generatedContent,
            metadata: {
              model: 'gpt-4',
              tokens: Math.floor(Math.random() * 500) + 200,
              duration: Math.floor(Math.random() * 3000) + 1000,
              cost: (Math.random() * 0.1).toFixed(4)
            }
          };
        }
      );

      const generation: AIGeneration = {
        id: `gen_${Date.now()}`,
        type,
        prompt: prompt || `Generate ${type} for note`,
        result: result.content,
        timestamp: new Date(),
        metadata: result.metadata
      };

      setGenerations(prev => [generation, ...prev]);

      loggingService.info('AI content generated', { 
        type, 
        noteId, 
        tokens: result.metadata.tokens 
      });

      return generation;
    } catch (error) {
      loggingService.error('AI generation failed', error as Error);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [currentNote]);

  // Generate suggestions
  const generateSuggestions = useCallback(async () => {
    if (!currentNote) return;

    setIsProcessing(true);

    try {
      await PerformanceUtils.measureAsync(
        'ai_suggestions',
        async () => {
          // Simulate suggestion generation
          await new Promise(resolve => setTimeout(resolve, 2000));

          const newSuggestions: AISuggestion[] = [
            {
              id: `sug_${Date.now()}_1`,
              type: 'title',
              content: `Enhanced ${currentNote.title}`,
              confidence: 0.85,
              applied: false,
              timestamp: new Date()
            },
            {
              id: `sug_${Date.now()}_2`,
              type: 'tags',
              content: JSON.stringify(['ai-suggested', 'enhanced', 'automated']),
              confidence: 0.78,
              applied: false,
              timestamp: new Date()
            },
            {
              id: `sug_${Date.now()}_3`,
              type: 'summary',
              content: `AI-generated summary of ${currentNote.title}`,
              confidence: 0.92,
              applied: false,
              timestamp: new Date()
            },
            {
              id: `sug_${Date.now()}_4`,
              type: 'improvement',
              content: 'Consider adding more specific examples and data points to strengthen your arguments.',
              confidence: 0.76,
              applied: false,
              timestamp: new Date()
            }
          ];

          setSuggestions(prev => [...newSuggestions, ...prev]);

          loggingService.info('AI suggestions generated', { 
            noteId, 
            count: newSuggestions.length 
          });
        }
      );
    } catch (error) {
      loggingService.error('AI suggestions failed', error as Error);
    } finally {
      setIsProcessing(false);
    }
  }, [currentNote]);

  // Apply suggestion
  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    if (!currentNote) return;

    switch (suggestion.type) {
      case 'title':
        updateNote(noteId, { title: suggestion.content });
        break;
      case 'tags':
        try {
          const newTags = JSON.parse(suggestion.content);
          const updatedTags = [...new Set([...currentNote.tags, ...newTags])];
          updateNote(noteId, { tags: updatedTags });
        } catch (error) {
          loggingService.error('Failed to parse tags suggestion', error as Error);
        }
        break;
      case 'summary':
        // Add summary to note content
        const summaryContent = `\n\n## AI Summary\n\n${suggestion.content}\n\n---\n\n${currentNote.body}`;
        updateNote(noteId, { body: summaryContent });
        break;
      case 'improvement':
        // Add improvement suggestion as comment
        const improvementContent = `\n\n<!-- AI Suggestion: ${suggestion.content} -->\n\n${currentNote.body}`;
        updateNote(noteId, { body: improvementContent });
        break;
    }

    setSuggestions(prev => prev.map(sug =>
      sug.id === suggestion.id ? { ...sug, applied: true } : sug
    ));

    loggingService.info('AI suggestion applied', { 
      suggestionId: suggestion.id, 
      type: suggestion.type 
    });
  }, [currentNote, noteId, updateNote]);

  // Update AI feature config
  const updateFeatureConfig = useCallback((featureId: string, updates: Partial<AIFeatureConfig>) => {
    // In a real implementation, this would update the feature configuration
    loggingService.info('AI feature config updated', { featureId, updates });
  }, []);

  // Get features by category
  const getFeaturesByCategory = useCallback((category: string) => {
    return aiFeatures.filter(feature => feature.category === category);
  }, [aiFeatures]);

  // Format confidence
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Format cost
  const formatCost = (cost: number): string => {
    return `$${cost}`;
  };

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
          <div>
            <h2 style={{ margin: 0, color: colors.text }}>AI Assistant</h2>
            <p style={{ margin: '4px 0 0 0', color: colors.textSecondary, fontSize: '14px' }}>
              {currentNote.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close AI panel"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '24px'
        }}>
          {[
            { value: 'features', label: 'AI Features', icon: '🤖' },
            { value: 'generation', label: 'Content Generation', icon: '✨' },
            { value: 'suggestions', label: 'Suggestions', icon: '💡' },
            { value: 'analysis', label: 'Analysis', icon: '📊' }
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

        {/* AI Features Tab */}
        {activeTab === 'features' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>AI Features</h3>
            
            {/* Feature Categories */}
            {['generation', 'analysis', 'enhancement', 'automation'].map(category => {
              const categoryFeatures = getFeaturesByCategory(category);
              if (categoryFeatures.length === 0) return null;

              return (
                <div key={category} style={{ marginBottom: '32px' }}>
                  <h4 style={{ 
                    margin: '0 0 16px 0', 
                    color: colors.text,
                    textTransform: 'capitalize'
                  }}>
                    {category} Features
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {categoryFeatures.map(feature => (
                      <div key={feature.id} style={{
                        padding: '20px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        background: colors.background
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                            <div>
                              <h5 style={{ margin: 0, color: colors.text }}>{feature.name}</h5>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px'
                              }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: feature.enabled ? '#28a745' : '#6c757d'
                                }} />
                                <span style={{ color: colors.textSecondary }}>
                                  {feature.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p style={{ 
                          margin: '0 0 12px 0', 
                          color: colors.textSecondary, 
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {feature.description}
                        </p>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedFeature(feature)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: colors.primary,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Use Feature
                          </button>
                          <button
                            onClick={() => {
                              // Toggle feature enabled state
                              loggingService.info('AI feature toggled', { 
                                featureId: feature.id, 
                                enabled: !feature.enabled 
                              });
                            }}
                            style={{
                              padding: '8px',
                              background: feature.enabled ? '#dc3545' : '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            {feature.enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Generation Tab */}
        {activeTab === 'generation' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Content Generation</h3>
            
            {/* Generation Options */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {[
                  { value: 'summary', label: 'Summary', icon: '📝' },
                  { value: 'expansion', label: 'Expand', icon: '📈' },
                  { value: 'rewrite', label: 'Rewrite', icon: '✍️' },
                  { value: 'custom', label: 'Custom', icon: '🎯' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setGenerationType(option.value as any)}
                    style={{
                      padding: '16px',
                      background: generationType === option.value ? colors.primary : colors.surface,
                      color: generationType === option.value ? 'white' : colors.text,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt Input */}
            {generationType === 'custom' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
                  Custom Prompt:
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Enter your custom prompt..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    background: colors.background,
                    color: colors.text,
                    resize: 'vertical'
                  }}
                />
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={() => generateContent(generationType, customPrompt)}
              disabled={isProcessing || (generationType === 'custom' && !customPrompt.trim())}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                marginBottom: '20px'
              }}
            >
              {isProcessing ? 'Generating...' : 'Generate Content'}
            </button>

            {/* Progress Bar */}
            {isProcessing && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: colors.border,
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${processingProgress}%`,
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
                  {processingProgress}% complete
                </div>
              </div>
            )}

            {/* Generation History */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Generation History</h4>
              
              {generations.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: colors.textSecondary
                }}>
                  No generations yet. Start by generating some content!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {generations.map(generation => (
                    <div key={generation.id} style={{
                      padding: '16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.background
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <h5 style={{ margin: '0 0 4px 0', color: colors.text }}>
                            {generation.type.charAt(0).toUpperCase() + generation.type.slice(1)} Generation
                          </h5>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {generation.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                          {formatCost(generation.metadata.cost)}
                        </div>
                      </div>
                      
                      <div style={{
                        background: colors.surface,
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '12px',
                        maxHeight: '200px',
                        overflow: 'auto'
                      }}>
                        <pre style={{
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          color: colors.text
                        }}>
                          {generation.result}
                        </pre>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '12px',
                        color: colors.textSecondary
                      }}>
                        <div>
                          Model: {generation.metadata.model} • Tokens: {generation.metadata.tokens}
                        </div>
                        <button
                          onClick={() => {
                            // Copy to clipboard
                            navigator.clipboard.writeText(generation.result);
                            loggingService.info('Generation copied to clipboard', { generationId: generation.id });
                          }}
                          style={{
                            padding: '4px 8px',
                            background: colors.surface,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: colors.text,
                            fontSize: '12px'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: colors.text }}>AI Suggestions</h3>
              <button
                onClick={generateSuggestions}
                disabled={isProcessing}
                style={{
                  padding: '8px 16px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                {isProcessing ? 'Generating...' : 'Generate Suggestions'}
              </button>
            </div>

            {suggestions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: colors.textSecondary
              }}>
                No suggestions yet. Generate some AI suggestions for your note!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {suggestions.map(suggestion => (
                  <div key={suggestion.id} style={{
                    padding: '16px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: suggestion.applied ? colors.surface : colors.background,
                    opacity: suggestion.applied ? 0.7 : 1
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: colors.primary,
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px',
                          textTransform: 'capitalize'
                        }}>
                          {suggestion.type}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: colors.textSecondary
                        }}>
                          {formatConfidence(suggestion.confidence)} confidence
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {suggestion.timestamp.toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{
                      background: colors.surface,
                      padding: '12px',
                      borderRadius: '4px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ color: colors.text, fontSize: '14px' }}>
                        {suggestion.content}
                      </div>
                    </div>

                    {!suggestion.applied && (
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        style={{
                          padding: '6px 12px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Apply Suggestion
                      </button>
                    )}

                    {suggestion.applied && (
                      <div style={{
                        fontSize: '12px',
                        color: '#28a745',
                        fontStyle: 'italic'
                      }}>
                        ✓ Applied
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Content Analysis</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {currentNote.body.split(/\s+/).length}
                </div>
                <div style={{ color: colors.textSecondary }}>Word Count</div>
              </div>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {currentNote.body.split(/[.!?]+/).length}
                </div>
                <div style={{ color: colors.textSecondary }}>Sentences</div>
              </div>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {currentNote.tags.length}
                </div>
                <div style={{ color: colors.textSecondary }}>Tags</div>
              </div>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {Math.ceil(currentNote.body.split(/\s+/).length / 200)}
                </div>
                <div style={{ color: colors.textSecondary }}>Reading Time (min)</div>
              </div>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Content Insights</h4>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: colors.text }}>Writing Quality</h5>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: colors.border,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '85%',
                      height: '100%',
                      background: colors.primary,
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                    85% - Good quality content
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: colors.text }}>Readability</h5>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: colors.border,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '92%',
                      height: '100%',
                      background: '#28a745',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                    92% - Very readable
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 8px 0', color: colors.text }}>Topic Coverage</h5>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: colors.border,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '78%',
                      height: '100%',
                      background: '#ffc107',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                    78% - Good topic coverage
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature Configuration Modal */}
        {selectedFeature && (
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
            zIndex: 1100
          }}>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: 0, color: colors.text }}>
                  Configure {selectedFeature.name}
                </h3>
                <button
                  onClick={() => setSelectedFeature(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: colors.textSecondary
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Model:
                  </label>
                  <select
                    value={selectedFeature.config.model}
                    onChange={(e) => updateFeatureConfig(selectedFeature.id, { model: e.target.value })}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3">Claude-3</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Temperature: {selectedFeature.config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedFeature.config.temperature}
                    onChange={(e) => updateFeatureConfig(selectedFeature.id, { temperature: parseFloat(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', color: colors.text }}>
                    Max Tokens:
                  </label>
                  <input
                    type="number"
                    value={selectedFeature.config.maxTokens}
                    onChange={(e) => updateFeatureConfig(selectedFeature.id, { maxTokens: parseInt(e.target.value) })}
                    min="100"
                    max="4000"
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedFeature(null)}
                    style={{
                      padding: '8px 16px',
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      color: colors.text
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      generateContent(selectedFeature.id);
                      setSelectedFeature(null);
                    }}
                    style={{
                      padding: '8px 16px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Use Feature
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteAI; 