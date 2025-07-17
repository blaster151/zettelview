import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface ContentAnalysisProps {
  averageWordsPerNote: number;
  averageCharactersPerNote: number;
  averageTagsPerNote: number;
  totalCharacters: number;
}

const ContentAnalysis: React.FC<ContentAnalysisProps> = ({
  averageWordsPerNote,
  averageCharactersPerNote,
  averageTagsPerNote,
  totalCharacters
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
        📝 Content Analysis
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textSecondary }}>Avg Words/Note:</span>
          <span style={{ color: colors.text, fontWeight: 'bold' }}>{averageWordsPerNote}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textSecondary }}>Avg Chars/Note:</span>
          <span style={{ color: colors.text, fontWeight: 'bold' }}>{formatNumber(averageCharactersPerNote)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textSecondary }}>Avg Tags/Note:</span>
          <span style={{ color: colors.text, fontWeight: 'bold' }}>{averageTagsPerNote}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textSecondary }}>Total Characters:</span>
          <span style={{ color: colors.text, fontWeight: 'bold' }}>{formatNumber(totalCharacters)}</span>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalysis; 