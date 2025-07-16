import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

interface WelcomeOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  position: 'center' | 'sidebar' | 'editor' | 'graph';
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ZettelView!',
    description: 'Your visual knowledge base for creating and managing interconnected notes. Let\'s take a quick tour to get you started.',
    position: 'center'
  },
  {
    id: 'create-note',
    title: 'Create Your First Note',
    description: 'Type a title in the "New note title" field and click "Create Note" to get started.',
    action: 'Create a note to continue',
    position: 'sidebar'
  },
  {
    id: 'markdown-editor',
    title: 'Rich Markdown Editor',
    description: 'Write your notes in Markdown format. Use headings (#), lists (-), bold (**text**), and more. Preview your changes in real-time.',
    position: 'editor'
  },
  {
    id: 'internal-links',
    title: 'Connect Notes with Internal Links',
    description: 'Use double brackets [[Note Title]] to create links between notes. Click on linked notes to navigate between them.',
    position: 'editor'
  },
  {
    id: 'tags',
    title: 'Organize with Tags',
    description: 'Add tags to your notes for better organization. Use the tag filter in the sidebar to find related notes quickly.',
    position: 'sidebar'
  },
  {
    id: 'search',
    title: 'Powerful Search',
    description: 'Use the enhanced search to find notes by title, content, or tags. Fuzzy matching helps you find notes even with typos.',
    position: 'sidebar'
  },
  {
    id: 'graph-view',
    title: 'Visual Knowledge Graph',
    description: 'Switch to Graph View to see your notes and their connections visually. Drag nodes to rearrange and zoom to explore.',
    position: 'graph'
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Use Ctrl+N for new notes, Ctrl+F to focus search, Ctrl+G to toggle graph view, and Ctrl+Shift+C for the command palette.',
    position: 'center'
  },
  {
    id: 'ai-analysis',
    title: 'AI-Powered Insights',
    description: 'Use the AI button to get summaries, ask questions, and discover insights about your notes.',
    position: 'center'
  },
  {
    id: 'export-import',
    title: 'Backup & Share',
    description: 'Export your notes as JSON or CSV, and import them on other devices. Your data stays local and private.',
    position: 'center'
  }
];

const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onComplete, onSkip }) => {
  const { colors } = useThemeStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const currentTutorialStep = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    setIsVisible(false);
    // Store that user has completed onboarding
    localStorage.setItem('zettelview_onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('zettelview_onboarding_completed', 'true');
    onSkip();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Progress indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: '4px'
          }}>
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: index <= currentStep ? colors.primary : colors.border,
                  transition: 'background 0.2s ease'
                }}
              />
            ))}
          </div>
          <span style={{
            fontSize: '14px',
            color: colors.textSecondary
          }}>
            {currentStep + 1} of {tutorialSteps.length}
          </span>
        </div>

        {/* Step content */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            color: colors.text,
            margin: '0 0 12px 0',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            {currentTutorialStep.title}
          </h2>
          <p style={{
            color: colors.textSecondary,
            margin: 0,
            lineHeight: '1.5',
            fontSize: '16px'
          }}>
            {currentTutorialStep.description}
          </p>
          {currentTutorialStep.action && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: colors.surfaceHover,
              borderRadius: '4px',
              border: `1px solid ${colors.border}`
            }}>
              <span style={{
                color: colors.primary,
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                💡 {currentTutorialStep.action}
              </span>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                ← Previous
              </button>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.textSecondary,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              Skip Tutorial
            </button>
            <button
              onClick={handleNext}
              style={{
                background: colors.primary,
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {isLastStep ? 'Get Started!' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            fontSize: '18px',
            padding: '4px',
            borderRadius: '4px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.surfaceHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="Close tutorial"
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeOnboarding; 