import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface OverviewStatsProps {
  totalNotes: number;
  totalWords: number;
  uniqueTags: number;
  linkDensity: number;
}

const OverviewStats: React.FC<OverviewStatsProps> = ({
  totalNotes,
  totalWords,
  uniqueTags,
  linkDensity
}) => {
  const { colors } = useThemeStore();

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

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
        📈 Overview
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
            {formatNumber(totalNotes)}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Total Notes</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
            {formatNumber(totalWords)}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Total Words</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
            {formatNumber(uniqueTags)}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Unique Tags</div>
        </div>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
            {linkDensity}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>Avg Links/Note</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats; 