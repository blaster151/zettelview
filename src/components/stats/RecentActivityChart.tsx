import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface RecentActivityChartProps {
  recentActivity: Array<{ date: string; count: number }>;
}

const RecentActivityChart: React.FC<RecentActivityChartProps> = ({ recentActivity }) => {
  const { colors } = useThemeStore();

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '20px',
      gridColumn: '1 / -1'
    }}>
      <h3 style={{
        color: colors.text,
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        📅 Recent Activity (Last 7 Days)
      </h3>
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'end',
        height: '100px'
      }}>
        {recentActivity.map(({ date, count }) => {
          const maxCount = Math.max(...recentActivity.map(d => d.count));
          const height = maxCount > 0 ? (count / maxCount) * 60 : 0;
          const isToday = date === new Date().toISOString().split('T')[0];
          
          return (
            <div key={date} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
              gap: '4px'
            }}>
              <div style={{
                width: '100%',
                height: `${height}px`,
                background: isToday ? colors.primary : colors.surfaceHover,
                borderRadius: '4px 4px 0 0',
                minHeight: count > 0 ? '4px' : '0'
              }}
                title={`${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}: ${count} note${count !== 1 ? 's' : ''}`}
              />
              <div style={{
                fontSize: '10px',
                color: colors.textSecondary,
                textAlign: 'center'
              }}>
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.text,
                fontWeight: 'bold'
              }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivityChart; 