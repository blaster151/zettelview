// Note-related components
export * from './notes';

// UI components
export * from './ui';

// Layout components
export * from './layout';

// Feature components
export * from './features';

// Utility components
export * from './utils';

// Search components
export { default as EnhancedSearch } from './EnhancedSearch';
export { default as SearchLoadingSpinner } from './SearchLoadingSpinner';
export { default as AdvancedSearchHelp } from './AdvancedSearchHelp';

// Virtualized components
export { default as VirtualizedNoteList } from './VirtualizedNoteList';
export { default as VirtualizedSearchResults } from './VirtualizedSearchResults';
export { default as VirtualizedBacklinksList } from './VirtualizedBacklinksList';

// View components
export { default as CalendarView } from './CalendarView';

// Onboarding and Help components
export { default as WelcomeOnboarding } from './WelcomeOnboarding';
export { default as HelpPanel } from './HelpPanel';

// Analytics components
export { default as NoteStats } from './NoteStats';
export * from './stats'; 

// Template components
export * from './templates'; 

// Collaboration components
export * from './collaboration'; 

// Plugin components
export * from './plugins';

// Demo components
export { default as SearchSuggestionsDemo } from './demos/SearchSuggestionsDemo';
export { default as QueryTemplatesDemo } from './demos/QueryTemplatesDemo';
export { default as KeyboardNavigationDemo } from './demos/KeyboardNavigationDemo';
export { default as SearchFeaturesDemo } from './demos/SearchFeaturesDemo';
export { default as AnalyticsDemo } from './demos/AnalyticsDemo';

// Error handling components
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as AsyncErrorBoundary } from './AsyncErrorBoundary';

// Keyboard shortcuts component
export { default as KeyboardShortcuts } from './KeyboardShortcuts'; 