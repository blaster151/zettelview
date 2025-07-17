import React from 'react';
import { useNoteStats } from '../hooks/useNoteStats';
import { useThemeStore } from '../store/themeStore';
import {
  StatsModal,
  OverviewStats,
  ContentAnalysis,
  TagStats,
  TimeAnalysis,
  RecentActivityChart
} from './stats';

interface NoteStatsProps {
  notes: Array<{
    id: string;
    title: string;
    body: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

const NoteStats: React.FC<NoteStatsProps> = ({ notes, isOpen, onClose }) => {
  const stats = useNoteStats(notes);
  const { colors } = useThemeStore();

  const renderEmptyState = () => (
    <div style={{
      textAlign: 'center',
      padding: '40px',
      color: colors.textSecondary
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
      <h3 style={{ margin: '0 0 8px 0', color: colors.text }}>No Notes Yet</h3>
      <p style={{ margin: 0 }}>Create your first note to see statistics and analytics.</p>
    </div>
  );

  const renderStatsContent = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    }}>
      <OverviewStats
        totalNotes={stats.totalNotes}
        totalWords={stats.totalWords}
        uniqueTags={stats.uniqueTags}
        linkDensity={stats.linkDensity}
      />
      
      <ContentAnalysis
        averageWordsPerNote={stats.averageWordsPerNote}
        averageCharactersPerNote={stats.averageCharactersPerNote}
        averageTagsPerNote={stats.averageTagsPerNote}
        totalCharacters={stats.totalCharacters}
      />
      
      <TagStats mostUsedTags={stats.mostUsedTags} />
      
      <TimeAnalysis
        oldestNote={stats.oldestNote}
        newestNote={stats.newestNote}
      />
      
      <RecentActivityChart recentActivity={stats.recentActivity} />
    </div>
  );

  return (
    <StatsModal isOpen={isOpen} onClose={onClose}>
      {notes.length === 0 ? renderEmptyState() : renderStatsContent()}
    </StatsModal>
  );
};

export default NoteStats; 