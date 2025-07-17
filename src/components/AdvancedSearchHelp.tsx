import React, { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { advancedSearchService } from '../services/advancedSearchService';

interface AdvancedSearchHelpProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const AdvancedSearchHelp: React.FC<AdvancedSearchHelpProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'operators' | 'examples' | 'tips'>('operators');

  if (!isOpen) return null;

  const syntaxHelp = advancedSearchService.getSyntaxHelp();

  const operatorExamples = [
    {
      operator: 'tag:',
      description: 'Search notes by tag',
      examples: ['tag:meeting', 'tag:work', 'tag:personal']
    },
    {
      operator: 'title:',
      description: 'Search notes by title',
      examples: ['title:project', 'title:meeting', 'title:idea']
    },
    {
      operator: 'body:',
      description: 'Search notes by body content',
      examples: ['body:important', 'body:todo', 'body:reference']
    },
    {
      operator: 'AND',
      description: 'Find notes matching both conditions',
      examples: ['tag:work AND title:meeting', 'title:project AND body:urgent']
    },
    {
      operator: 'OR',
      description: 'Find notes matching either condition',
      examples: ['tag:personal OR tag:family', 'title:work OR title:project']
    },
    {
      operator: 'NOT',
      description: 'Exclude notes matching condition',
      examples: ['NOT tag:archived', 'NOT title:draft']
    },
    {
      operator: '()',
      description: 'Group conditions for complex queries',
      examples: ['(tag:work OR tag:personal) AND title:urgent']
    },
    {
      operator: '"..."',
      description: 'Search for exact phrase',
      examples: ['"exact phrase"', 'title:"meeting notes"']
    }
  ];

  const tips = [
    'Use quotes for exact phrase matching: "meeting notes"',
    'Combine operators for precise searches: tag:work AND title:meeting',
    'Use parentheses to group complex conditions',
    'NOT operator excludes matching notes from results',
    'Multiple terms without operators are treated as AND',
    'Search is case-insensitive by default',
    'Tag searches match partial tag names',
    'Use OR for broader searches, AND for narrower results'
  ];

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          maxWidth: '600px',
          maxHeight: '80vh',
          width: '90%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: colors.text
          }}>
            Advanced Search Help
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: colors.textSecondary,
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
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`
        }}>
          {[
            { id: 'operators' as const, label: 'Operators' },
            { id: 'examples' as const, label: 'Examples' },
            { id: 'tips' as const, label: 'Tips' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: activeTab === tab.id ? colors.primary : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#fff' : colors.text,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px'
        }}>
          {activeTab === 'operators' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                Search Operators
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {operatorExamples.map((op, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    background: colors.background
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <code style={{
                        background: colors.surfaceActive,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.primary
                      }}>
                        {op.operator}
                      </code>
                      <span style={{
                        marginLeft: '12px',
                        fontSize: '14px',
                        color: colors.text
                      }}>
                        {op.description}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: colors.textSecondary
                    }}>
                      Examples: {op.examples.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'examples' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                Search Examples
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {syntaxHelp.map((example, index) => (
                  <div key={index} style={{
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    background: colors.background
                  }}>
                    <code style={{
                      background: colors.surfaceActive,
                      padding: '6px 10px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: colors.primary,
                      display: 'block',
                      marginBottom: '4px'
                    }}>
                      {example}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: colors.text
              }}>
                Search Tips
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {tips.map((tip, index) => (
                  <li key={index} style={{
                    fontSize: '14px',
                    color: colors.text,
                    lineHeight: '1.5'
                  }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: `1px solid ${colors.border}`,
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: colors.primary,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.primary;
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchHelp; 