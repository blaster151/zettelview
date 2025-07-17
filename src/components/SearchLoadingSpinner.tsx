import React from 'react';
import { useThemeStore } from '../store/themeStore';

interface SearchLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

const SearchLoadingSpinner: React.FC<SearchLoadingSpinnerProps> = ({
  size = 'medium',
  showText = true,
  className = ''
}) => {
  const { colors } = useThemeStore();

  const sizeMap = {
    small: { spinner: 12, text: 12 },
    medium: { spinner: 16, text: 14 },
    large: { spinner: 20, text: 16 }
  };

  const { spinner: spinnerSize, text: textSize } = sizeMap[size];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: colors.textSecondary,
        fontSize: `${textSize}px`
      }}
    >
      <div
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          border: `2px solid ${colors.border}`,
          borderTop: `2px solid ${colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />
      {showText && <span>Searching...</span>}
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default SearchLoadingSpinner; 