import React, { useState } from 'react';
import { useNoteStore } from '../store/noteStore';
import { useThemeStore } from '../store/themeStore';
import { useNoteChaining } from '../hooks/useNoteChaining';
import NoteChaining from './features/NoteChaining';
import { noteChainingService } from '../services/noteChainingService';

const NoteChainingDemo: React.FC = () => {
  const { notes, addNote, selectNote } = useNoteStore();
  const colors = useThemeStore(state => state.colors);
  const { createChainedNote, getAllChains, isCreating } = useNoteChaining();
  
  const [showChainingModal, setShowChainingModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [demoNotes, setDemoNotes] = useState<Array<{ id: string; title: string; chainId?: string }>>([]);

  // Create demo notes for demonstration
  const createDemoNotes = () => {
    const demoNote1 = {
      id: 'demo-project-001',
      title: 'Project Planning',
      body: '# Project Planning\n\nThis is a demo project planning note.\n\n## Tasks\n- Task 1\n- Task 2\n- Task 3\n\n## Tags\n#project #planning #demo',
      tags: ['project', 'planning', 'demo'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const demoNote2 = {
      id: 'demo-research-001',
      title: 'Research Notes',
      body: '# Research Notes\n\nResearch findings and insights.\n\n## Key Points\n- Point 1\n- Point 2\n\n## Tags\n#research #insights',
      tags: ['research', 'insights'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    addNote(demoNote1.title, {
      id: demoNote1.id,
      body: demoNote1.body,
      tags: demoNote1.tags
    });

    addNote(demoNote2.title, {
      id: demoNote2.id,
      body: demoNote2.body,
      tags: demoNote2.tags
    });

    setDemoNotes([
      { id: demoNote1.id, title: demoNote1.title },
      { id: demoNote2.id, title: demoNote2.title }
    ]);
  };

  const handleQuickChain = async (noteId: string) => {
    const result = await createChainedNote(noteId, {
      inheritTags: true,
      addBacklink: true,
      sequentialId: true,
      autoTitle: true
    });

    if (result) {
      // Navigate to the new note
      selectNote(result.id);
    }
  };

  const handleShowChainingModal = (noteId: string) => {
    setSelectedNoteId(noteId);
    setShowChainingModal(true);
  };

  const handleNoteCreated = (noteId: string) => {
    selectNote(noteId);
    setShowChainingModal(false);
  };

  const chains = getAllChains();

  return (
    <div style={{ 
      padding: 24, 
      backgroundColor: colors.background,
      color: colors.text,
      maxWidth: 1200,
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 16px 0', color: colors.text }}>
          Automated ID Link Chaining Demo
        </h1>
        <p style={{ margin: '0 0 24px 0', color: colors.textSecondary, fontSize: 16 }}>
          Experience the power of automated note chaining with sequential IDs, tag inheritance, and backlinks.
        </p>
      </div>

      {/* Demo Setup */}
      <div style={{ 
        marginBottom: 32,
        padding: 16,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: colors.text }}>Setup Demo</h3>
        <p style={{ margin: '0 0 16px 0', color: colors.textSecondary }}>
          Create demo notes to test the chaining functionality:
        </p>
        <button
          onClick={createDemoNotes}
          disabled={demoNotes.length > 0}
          style={{
            padding: '8px 16px',
            backgroundColor: colors.primary,
            color: colors.background,
            border: 'none',
            borderRadius: 4,
            cursor: demoNotes.length > 0 ? 'not-allowed' : 'pointer',
            opacity: demoNotes.length > 0 ? 0.6 : 1
          }}
        >
          {demoNotes.length > 0 ? 'Demo Notes Created' : 'Create Demo Notes'}
        </button>
      </div>

      {/* Demo Notes */}
      {demoNotes.length > 0 && (
        <div style={{ 
          marginBottom: 32,
          padding: 16,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Demo Notes</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {demoNotes.map(note => (
              <div key={note.id} style={{
                padding: 12,
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: colors.text }}>{note.title}</h4>
                  <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
                    ID: {note.id}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleQuickChain(note.id)}
                    disabled={isCreating}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: colors.primary,
                      color: colors.background,
                      border: 'none',
                      borderRadius: 4,
                      cursor: isCreating ? 'not-allowed' : 'pointer',
                      fontSize: 12
                    }}
                  >
                    Quick Chain (Ctrl+Shift+N)
                  </button>
                  <button
                    onClick={() => handleShowChainingModal(note.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: 4,
                      color: colors.text,
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    Advanced Chain
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chain Information */}
      {chains.length > 0 && (
        <div style={{ 
          marginBottom: 32,
          padding: 16,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Active Chains</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {chains.map(chain => (
              <div key={chain.chainId} style={{
                padding: 12,
                backgroundColor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: 4
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>
                  Chain: {chain.chainId}
                </h4>
                <p style={{ margin: '0 0 8px 0', color: colors.textSecondary, fontSize: 14 }}>
                  {chain.count} notes in chain
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {chain.notes.map(note => (
                    <span key={note?.id} style={{
                      padding: '2px 6px',
                      backgroundColor: colors.primary,
                      color: colors.background,
                      borderRadius: 12,
                      fontSize: 12
                    }}>
                      {note?.title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div style={{ 
        marginBottom: 32,
        padding: 16,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Chaining Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Sequential ID Generation</h4>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
              Automatically generates sequential IDs (001, 002, 003...) based on parent note patterns.
            </p>
          </div>
          
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Tag Inheritance</h4>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
              New chained notes automatically inherit tags from the parent note.
            </p>
          </div>
          
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Automatic Backlinks</h4>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
              Creates bidirectional links between parent and child notes automatically.
            </p>
          </div>
          
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Keyboard Shortcuts</h4>
            <p style={{ margin: 0, color: colors.textSecondary, fontSize: 14 }}>
              <strong>Ctrl+Shift+N:</strong> Quick chained note<br/>
              <strong>Ctrl+Alt+N:</strong> Quick chained note (no backlink)<br/>
              <strong>Ctrl+Shift+Alt+N:</strong> Timestamp-based chaining
            </p>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div style={{ 
        marginBottom: 32,
        padding: 16,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 8
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: colors.text }}>Usage Examples</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Project Management</h4>
            <p style={{ margin: '0 0 8px 0', color: colors.textSecondary, fontSize: 14 }}>
              Create a project note, then chain related tasks, milestones, and documentation.
            </p>
            <code style={{ 
              backgroundColor: colors.codeBackground,
              color: colors.codeText,
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12
            }}>
              project-001 → project-002 (tasks) → project-003 (milestones)
            </code>
          </div>
          
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Research Workflow</h4>
            <p style={{ margin: '0 0 8px 0', color: colors.textSecondary, fontSize: 14 }}>
              Start with a research question, then chain findings, analysis, and conclusions.
            </p>
            <code style={{ 
              backgroundColor: colors.codeBackground,
              color: colors.codeText,
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12
            }}>
              research-001 → research-002 (findings) → research-003 (analysis)
            </code>
          </div>
          
          <div style={{
            padding: 12,
            backgroundColor: colors.background,
            border: `1px solid ${colors.border}`,
            borderRadius: 4
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: colors.text }}>Writing Process</h4>
            <p style={{ margin: '0 0 8px 0', color: colors.textSecondary, fontSize: 14 }}>
              Begin with an outline, then chain chapters, sections, and revisions.
            </p>
            <code style={{ 
              backgroundColor: colors.codeBackground,
              color: colors.codeText,
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12
            }}>
              book-001 → book-002 (chapter1) → book-003 (chapter2)
            </code>
          </div>
        </div>
      </div>

      {/* Chaining Modal */}
      {showChainingModal && selectedNoteId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.backdrop,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            maxWidth: 600,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <NoteChaining
              parentNoteId={selectedNoteId}
              onNoteCreated={handleNoteCreated}
              onClose={() => setShowChainingModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteChainingDemo; 