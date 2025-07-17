import React, { useState } from 'react';
import { useTemplates } from '../../hooks/useTemplates';
import { useThemeStore } from '../../store/themeStore';

interface SaveAsTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateName: string, templateDescription: string, templateCategory: string) => void;
  currentNote: {
    title: string;
    body: string;
    tags: string[];
  };
}

const SaveAsTemplate: React.FC<SaveAsTemplateProps> = ({
  isOpen,
  onClose,
  onSave,
  currentNote
}) => {
  const { colors } = useThemeStore();
  const [templateName, setTemplateName] = useState(`${currentNote.title} Template`);
  const [templateDescription, setTemplateDescription] = useState(`Template based on note: ${currentNote.title}`);
  const [templateCategory, setTemplateCategory] = useState('custom');

  if (!isOpen) return null;

  const categories = [
    { id: 'general', name: 'General', icon: '📝' },
    { id: 'project', name: 'Project', icon: '📋' },
    { id: 'meeting', name: 'Meeting', icon: '🤝' },
    { id: 'research', name: 'Research', icon: '🔬' },
    { id: 'personal', name: 'Personal', icon: '👤' },
    { id: 'custom', name: 'Custom', icon: '⚙️' }
  ];

  const handleSave = () => {
    if (templateName.trim()) {
      onSave(templateName.trim(), templateDescription.trim(), templateCategory);
      onClose();
    }
  };

  const handleCancel = () => {
    setTemplateName(`${currentNote.title} Template`);
    setTemplateDescription(`Template based on note: ${currentNote.title}`);
    setTemplateCategory('custom');
    onClose();
  };

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
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            color: colors.text,
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            💾 Save as Template
          </h2>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: '20px',
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
            title="Cancel"
            tabIndex={0}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                fontSize: '14px'
              }}
              placeholder="Enter template name"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              Description
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                background: colors.background,
                color: colors.text,
                fontSize: '14px',
                minHeight: '60px',
                resize: 'vertical'
              }}
              placeholder="Describe what this template is for"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Category
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px'
            }}>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setTemplateCategory(category.id)}
                  style={{
                    background: templateCategory === category.id ? colors.primary : colors.background,
                    color: templateCategory === category.id ? 'white' : colors.text,
                    border: `1px solid ${templateCategory === category.id ? colors.primary : colors.border}`,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (templateCategory !== category.id) {
                      e.currentTarget.style.background = colors.surfaceHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (templateCategory !== category.id) {
                      e.currentTarget.style.background = colors.background;
                    }
                  }}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Preview
            </label>
            <div style={{
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: '4px',
              padding: '12px',
              maxHeight: '120px',
              overflow: 'auto'
            }}>
              <div style={{
                color: colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {templateName}
              </div>
              <div style={{
                color: colors.textSecondary,
                fontSize: '12px',
                marginBottom: '8px'
              }}>
                {templateDescription}
              </div>
              <div style={{
                fontSize: '11px',
                color: colors.textSecondary
              }}>
                Content: {currentNote.body.length} characters
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleCancel}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                color: colors.text,
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!templateName.trim()}
              style={{
                background: templateName.trim() ? colors.primary : colors.border,
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: templateName.trim() ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (templateName.trim()) {
                  e.currentTarget.style.background = colors.primaryHover;
                }
              }}
              onMouseLeave={(e) => {
                if (templateName.trim()) {
                  e.currentTarget.style.background = colors.primary;
                }
              }}
            >
              Save Template
            </button>
          </div>
        </div>
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

export default SaveAsTemplate; 