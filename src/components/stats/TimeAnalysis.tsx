import React from 'react';
import { useThemeStore } from '../../store/themeStore';

interface TimeAnalysisProps {
  oldestNote: Date | null;
  newestNote: Date | null;
}

const TimeAnalysis: React.FC<TimeAnalysisProps> = ({ oldestNote, newestNote }) => {
  const { colors } = useThemeStore();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        ⏰ Time Analysis
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {oldestNote && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textSecondary }}>Oldest Note:</span>
            <span style={{ color: colors.text, fontSize: '14px' }}>
              {formatDate(oldestNote)}
            </span>
          </div>
        )}
        {newestNote && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textSecondary }}>Newest Note:</span>
            <span style={{ color: colors.text, fontSize: '14px' }}>
              {formatDate(newestNote)}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: colors.textSecondary }}>Date Range:</span>
          <span style={{ color: colors.text, fontSize: '14px' }}>
            {oldestNote && newestNote ? 
              `${Math.ceil((newestNote.getTime() - oldestNote.getTime()) / (1000 * 60 * 60 * 24))} days` :
              'N/A'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeAnalysis; 