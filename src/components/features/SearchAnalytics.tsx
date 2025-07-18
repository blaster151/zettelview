import React, { useMemo } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { SearchHistory, SearchHistoryItem } from '../../services/searchService';

interface SearchAnalyticsProps {
  history?: SearchHistoryItem[];
  style?: React.CSSProperties;
}

const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({ history, style }) => {
  const { colors } = useThemeStore();
  const searchHistory = history || SearchHistory.getHistory();

  // Calculate analytics
  const stats = useMemo(() => {
    if (!searchHistory || searchHistory.length === 0) {
      return {
        total: 0,
        avgResults: 0,
        mostCommon: '',
        mostCommonCount: 0,
        trends: [] as { date: string; count: number }[]
      };
    }
    const total = searchHistory.length;
    const avgResults = Math.round(
      searchHistory.reduce((sum, item) => sum + item.resultCount, 0) / total
    );
    // Most common query
    const freq = new Map<string, number>();
    searchHistory.forEach(item => {
      freq.set(item.query, (freq.get(item.query) || 0) + 1);
    });
    const mostCommonEntry = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0];
    const mostCommon = mostCommonEntry ? mostCommonEntry[0] : '';
    const mostCommonCount = mostCommonEntry ? mostCommonEntry[1] : 0;
    // Trends (last 7 days)
    const trends: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      const count = searchHistory.filter(item =>
        item.timestamp >= dayStart && item.timestamp < dayEnd
      ).length;
      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }
    return { total, avgResults, mostCommon, mostCommonCount, trends };
  }, [searchHistory]);

  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '16px',
      ...style
    }}>
      <h3 style={{ color: colors.text, fontSize: '15px', margin: 0, marginBottom: '12px' }}>
        📊 Search Analytics
      </h3>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div>
          <div style={{ color: colors.primary, fontWeight: 'bold', fontSize: '18px' }}>{stats.total}</div>
          <div style={{ color: colors.textSecondary, fontSize: '12px' }}>Total Searches</div>
        </div>
        <div>
          <div style={{ color: colors.info, fontWeight: 'bold', fontSize: '18px' }}>{stats.avgResults}</div>
          <div style={{ color: colors.textSecondary, fontSize: '12px' }}>Avg Results</div>
        </div>
        <div>
          <div style={{ color: colors.secondary, fontWeight: 'bold', fontSize: '18px' }}>{stats.mostCommonCount}</div>
          <div style={{ color: colors.textSecondary, fontSize: '12px' }}>Most Common</div>
          <div style={{ color: colors.text, fontSize: '12px', fontWeight: 'bold' }}>{stats.mostCommon}</div>
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <div style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '4px' }}>
          Last 7 days activity:
        </div>
        <div style={{ display: 'flex', alignItems: 'end', gap: '4px', height: '40px' }}>
          {stats.trends.map((trend, idx) => {
            const max = Math.max(...stats.trends.map(t => t.count));
            const height = max > 0 ? (trend.count / max) * 32 : 2;
            return (
              <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: `${height}px`,
                  background: colors.primary,
                  borderRadius: '2px 2px 0 0',
                  minHeight: '2px',
                  marginBottom: '2px'
                }} />
                <div style={{ fontSize: '10px', color: colors.textSecondary }}>{trend.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics; 