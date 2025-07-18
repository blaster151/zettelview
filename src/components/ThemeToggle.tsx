import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'button' | 'icon' | 'switch';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'medium',
  variant = 'button'
}) => {
  const { theme, isDark, toggleTheme, setSystemPreference, isSystem } = useThemeStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle theme toggle with smooth transition
  const handleThemeToggle = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Add transition class to body for smooth theme change
    document.body.classList.add('theme-transitioning');
    
    // Toggle theme
    toggleTheme();
    
    // Remove transition class after animation completes
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
      setIsTransitioning(false);
    }, 300);
  };

  // Handle system preference toggle
  const handleSystemToggle = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setSystemPreference(!isSystem);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`theme-toggle-skeleton ${className}`}>
        <div className="skeleton-icon"></div>
      </div>
    );
  }

  // Size classes
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-base',
    large: 'w-12 h-12 text-lg'
  };

  // Icon sizes
  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  // Button variant
  if (variant === 'button') {
    return (
      <div className={`theme-toggle-container ${className}`}>
        <button
          onClick={handleThemeToggle}
          disabled={isTransitioning}
          className={`
            theme-toggle-button
            ${sizeClasses[size]}
            flex items-center justify-center
            rounded-lg border border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            text-gray-700 dark:text-gray-300
            hover:bg-gray-50 dark:hover:bg-gray-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            dark:focus:ring-offset-gray-800
            transition-all duration-200
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          {isDark ? (
            <svg
              className={`${iconSizes[size]} text-yellow-500`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className={`${iconSizes[size]} text-gray-700`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
        
        {showLabel && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {isDark ? 'Light' : 'Dark'} Mode
          </span>
        )}
      </div>
    );
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <button
        onClick={handleThemeToggle}
        disabled={isTransitioning}
        className={`
          theme-toggle-icon
          ${sizeClasses[size]}
          flex items-center justify-center
          text-gray-600 dark:text-gray-300
          hover:text-gray-900 dark:hover:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-800
          transition-all duration-200
          ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
          ${className}
        `}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {isDark ? (
          <svg
            className={`${iconSizes[size]} text-yellow-500`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className={`${iconSizes[size]} text-gray-700`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>
    );
  }

  // Switch variant
  if (variant === 'switch') {
    return (
      <div className={`theme-toggle-switch-container ${className}`}>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isDark}
              onChange={handleThemeToggle}
              disabled={isTransitioning}
              className="sr-only"
              aria-label="Toggle theme"
            />
            <div
              className={`
                theme-toggle-switch
                w-11 h-6
                bg-gray-200 dark:bg-gray-700
                rounded-full
                transition-colors duration-200
                ${isTransitioning ? 'opacity-50' : ''}
              `}
            >
              <div
                className={`
                  theme-toggle-switch-handle
                  w-5 h-5
                  bg-white dark:bg-gray-300
                  rounded-full
                  shadow-md
                  transform transition-transform duration-200
                  ${isDark ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </div>
          </div>
          
          {showLabel && (
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
              {isDark ? 'Dark' : 'Light'} Mode
            </span>
          )}
        </label>
        
        {/* System preference toggle */}
        <button
          onClick={handleSystemToggle}
          disabled={isTransitioning}
          className={`
            ml-2 px-2 py-1
            text-xs
            rounded
            ${isSystem 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }
            hover:bg-blue-200 dark:hover:bg-blue-800
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-colors duration-200
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={isSystem ? 'Using system preference' : 'Use system preference'}
        >
          {isSystem ? 'Auto' : 'Manual'}
        </button>
      </div>
    );
  }

  return null;
};

export default ThemeToggle; 