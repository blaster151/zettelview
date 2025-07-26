import React from 'react';
import { useThemeStore } from '../store/themeStore';
import { cn } from '../lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  showText = true,
  text = 'Loading...',
  className = ''
}) => {
  const { colors } = useThemeStore();

  const sizeMap = {
    small: { spinner: 16, text: 12 },
    medium: { spinner: 24, text: 14 },
    large: { spinner: 32, text: 16 }
  };

  const { spinner: spinnerSize, text: textSize } = sizeMap[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      <div
        className="animate-spin rounded-full border-2 border-transparent"
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          borderTopColor: colors.primary,
          borderRightColor: colors.primary
        }}
      />
      {showText && (
        <span 
          className="text-muted-foreground"
          style={{ fontSize: `${textSize}px` }}
        >
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner; 