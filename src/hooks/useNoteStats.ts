import { useMemo } from 'react';

interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface StatsData {
  totalNotes: number;
  totalWords: number;
  totalCharacters: number;
  averageWordsPerNote: number;
  averageCharactersPerNote: number;
  totalTags: number;
  uniqueTags: number;
  mostUsedTags: Array<{ tag: string; count: number }>;
  tagDistribution: Record<string, number>;
  notesByMonth: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
  linkDensity: number;
  averageTagsPerNote: number;
  oldestNote: Date | null;
  newestNote: Date | null;
}

export function useNoteStats(notes: Note[]): StatsData {
  return useMemo((): StatsData => {
    if (notes.length === 0) {
      return {
        totalNotes: 0,
        totalWords: 0,
        totalCharacters: 0,
        averageWordsPerNote: 0,
        averageCharactersPerNote: 0,
        totalTags: 0,
        uniqueTags: 0,
        mostUsedTags: [],
        tagDistribution: {},
        notesByMonth: {},
        recentActivity: [],
        linkDensity: 0,
        averageTagsPerNote: 0,
        oldestNote: null,
        newestNote: null
      };
    }

    // Basic counts
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => {
      return sum + note.body.split(/\s+/).filter(word => word.length > 0).length;
    }, 0);
    const totalCharacters = notes.reduce((sum, note) => sum + note.body.length, 0);
    const averageWordsPerNote = Math.round(totalWords / totalNotes);
    const averageCharactersPerNote = Math.round(totalCharacters / totalNotes);

    // Tag analysis
    const allTags = notes.flatMap(note => note.tags);
    const totalTags = allTags.length;
    const uniqueTags = new Set(allTags).size;
    const averageTagsPerNote = Math.round((totalTags / totalNotes) * 10) / 10;

    // Tag distribution
    const tagDistribution: Record<string, number> = {};
    allTags.forEach(tag => {
      tagDistribution[tag] = (tagDistribution[tag] || 0) + 1;
    });

    const mostUsedTags = Object.entries(tagDistribution)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Time analysis
    const notesByMonth: Record<string, number> = {};
    const dates = notes.map(note => new Date(note.createdAt));
    const oldestNote = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestNote = new Date(Math.max(...dates.map(d => d.getTime())));

    notes.forEach(note => {
      const date = new Date(note.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      notesByMonth[monthKey] = (notesByMonth[monthKey] || 0) + 1;
    });

    // Recent activity (last 7 days)
    const recentActivity: Array<{ date: string; count: number }> = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const count = notes.filter(note => {
        const noteDate = new Date(note.updatedAt);
        return noteDate.toISOString().split('T')[0] === dateKey;
      }).length;
      recentActivity.push({ date: dateKey, count });
    }

    // Link density (approximate)
    const totalLinks = notes.reduce((sum, note) => {
      const linkMatches = note.body.match(/\[\[([^\]]+)\]\]/g);
      return sum + (linkMatches ? linkMatches.length : 0);
    }, 0);
    const linkDensity = Math.round((totalLinks / totalNotes) * 100) / 100;

    return {
      totalNotes,
      totalWords,
      totalCharacters,
      averageWordsPerNote,
      averageCharactersPerNote,
      totalTags,
      uniqueTags,
      mostUsedTags,
      tagDistribution,
      notesByMonth,
      recentActivity,
      linkDensity,
      averageTagsPerNote,
      oldestNote,
      newestNote
    };
  }, [notes]);
} 