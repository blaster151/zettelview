import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface TagStatsProps {
  mostUsedTags: Array<{ tag: string; count: number }>;
}

const TagStats: React.FC<TagStatsProps> = ({ mostUsedTags }) => {
  const { colors } = useThemeStore();

  return (
    <div style={{
      background: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '20px'
    }}>
      <h3 style={{
        color: colors.text,
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        🏷️ Most Used Tags
      </h3>
      {mostUsedTags.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mostUsedTags.map(({ tag, count }) => (
            <div key={tag} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              background: colors.surfaceHover,
              borderRadius: '4px'
            }}>
              <span style={{ color: colors.text, fontSize: '14px' }}>{tag}</span>
              <span style={{
                background: colors.primary,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
          No tags used yet
        </div>
      )}
    </div>
  );
};

export default TagStats; 