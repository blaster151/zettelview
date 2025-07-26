import React, { useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';

interface GraphMetric {
  label: string;
  value: number | string;
  description: string;
}

const GraphInsights: React.FC = () => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();

  // Compute graph metrics
  const metrics = useMemo<GraphMetric[]>(() => {
    const totalNotes = notes.length;
    const orphanedNotes = notes.filter(n => n.tags.length === 0);
    const mostTagged = notes.reduce((max, n) => {
      const maxTags = max?.tags?.length || 0;
      const currentTags = n.tags?.length || 0;
      return currentTags > maxTags ? n : max;
    }, notes[0] || null);
    const clusters = 1; // Placeholder for cluster detection
    return [
      { label: 'Total Notes', value: totalNotes, description: 'All notes in your knowledge base.' },
      { label: 'Total Tags', value: notes.reduce((sum, n) => sum + n.tags.length, 0), description: 'Total number of tags across all notes.' },
      { label: 'Orphaned Notes', value: orphanedNotes.length, description: 'Notes with no tags.' },
      { label: 'Most Tagged Note', value: mostTagged?.title || 'N/A', description: 'Note with the most tags.' },
      { label: 'Clusters', value: clusters, description: 'Topic clusters detected in your graph.' }
    ];
  }, [notes]);

  // Recommendations
  const recommendations = useMemo(() => {
    const orphaned = notes.filter(n => n.tags.length === 0);
    return [
      ...(orphaned.length > 0 ? [{
        type: 'link',
        message: `You have ${orphaned.length} orphaned notes. Consider adding tags to them for better organization.`
      }] : []),
      {
        type: 'refactor',
        message: 'Review notes with many tags for possible refactoring or splitting into subtopics.'
      }
    ];
  }, [notes]);

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: 24,
      maxWidth: 700,
      margin: '40px auto',
      minHeight: 400
    }}>
      <h2 style={{ color: colors.text }}>Knowledge Graph Insights</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ border: `1px solid ${colors.border}`, borderRadius: 6, padding: 12, background: colors.surface }}>
            <div style={{ fontWeight: 600, color: colors.text }}>{m.label}: <span style={{ color: colors.primary }}>{m.value}</span></div>
            <div style={{ color: colors.textSecondary, fontSize: 13 }}>{m.description}</div>
          </div>
        ))}
      </div>
      <h3 style={{ color: colors.text }}>Recommendations</h3>
      <ul style={{ color: colors.textSecondary, fontSize: 15 }}>
        {recommendations.map((r, i) => (
          <li key={i}>{r.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default GraphInsights; 