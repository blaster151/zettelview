import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useNoteStore } from '../store/noteStore';
import EnhancedSearch from './EnhancedSearch';
import VirtualizedSearchResults from './VirtualizedSearchResults';
import SearchLoadingSpinner from './SearchLoadingSpinner';
import { cn } from '../lib/utils';

interface SearchViewProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const SearchView: React.FC<SearchViewProps> = ({ 
  isOpen = true, 
  onClose, 
  className = '' 
}) => {
  const { colors } = useThemeStore();
  const { notes, selectNote } = useNoteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('zettelview_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (query: string) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('zettelview_search_history', JSON.stringify(newHistory));
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);
    saveSearchHistory(query);

    try {
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Simple search implementation
      const results = notes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.body?.toLowerCase().includes(query.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectNote = (noteId: string) => {
    selectNote(noteId);
    if (onClose) {
      onClose();
    }
  };

  const handleHistoryItemClick = (historyItem: string) => {
    setSearchQuery(historyItem);
    handleSearch(historyItem);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('zettelview_search_history');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn(
      'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4',
      className
    )}>
      <div className="w-full max-w-2xl bg-surface border border-border rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Search Notes</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Close search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <EnhancedSearch
              notes={notes}
              onSearch={handleSearch}
              onSelectNote={handleSelectNote}
              placeholder="Search notes, tags, or content..."
              className="w-full"
            />
            
            {/* Search History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 p-2 hover:bg-accent rounded-md transition-colors"
              title="Search history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-accent rounded-md transition-colors"
                title="Clear search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Search History Dropdown */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-10">
              <div className="p-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Recent Searches</span>
                  <button
                    onClick={clearHistory}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryItemClick(item)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <SearchLoadingSpinner size="large" />
            </div>
          ) : searchQuery ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
                </h3>
              </div>
              
              {searchResults.length > 0 ? (
                <VirtualizedSearchResults
                  results={searchResults}
                  onSelectResult={(result) => handleSelectNote(result.noteId)}
                  selectedIndex={-1}
                  height={400}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  <p>No results found for &quot;{searchQuery}&quot;</p>
                  <p className="text-sm mt-2">Try different keywords or check your spelling</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p>Enter a search term to find notes</p>
              <p className="text-sm mt-2">Search by title, content, or tags</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchView; 