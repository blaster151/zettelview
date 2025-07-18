import React, { useState, useEffect } from 'react';
import { AdvancedSearchService, SearchQuery, SearchResult } from '../services/advancedSearchService';
import { useNoteStore } from '../store/noteStore';

interface AdvancedSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNote: (noteId: string) => void;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  isOpen,
  onClose,
  onSelectNote
}) => {
  const notes = useNoteStore(state => state.notes);
  const [query, setQuery] = useState<SearchQuery>({
    text: '',
    filters: {},
    options: {
      fuzzy: false,
      semantic: false,
      nlp: false,
      caseSensitive: false,
      wholeWord: false
    }
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStats, setSearchStats] = useState<any>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(-1);

  useEffect(() => {
    if (isOpen && notes.length > 0) {
      AdvancedSearchService.initialize(notes);
      setSearchStats(AdvancedSearchService.getSearchStats());
    }
  }, [isOpen, notes]);

  const handleSearch = async () => {
    if (!query.text.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = AdvancedSearchService.search(query);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onSelectNote(result.note.id);
    onClose();
  };

  const handleResultKeyDown = (e: React.KeyboardEvent, result: SearchResult) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleResultClick(result);
    }
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'bg-green-100 text-green-800';
      case 'fuzzy': return 'bg-yellow-100 text-yellow-800';
      case 'semantic': return 'bg-blue-100 text-blue-800';
      case 'nlp': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact': return '✓';
      case 'fuzzy': return '≈';
      case 'semantic': return '🔍';
      case 'nlp': return '🧠';
      default: return '?';
    }
  };

  const formatRelevance = (relevance: number) => {
    return `${Math.round(relevance * 100)}%`;
  };

  const highlightText = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) return text;

    let highlightedText = text;
    const sortedHighlights = [...highlights].sort((a, b) => b.start - a.start);

    sortedHighlights.forEach(highlight => {
      const before = highlightedText.substring(0, highlight.start);
      const match = highlightedText.substring(highlight.start, highlight.end);
      const after = highlightedText.substring(highlight.end);
      highlightedText = `${before}<mark class="bg-yellow-200">${match}</mark>${after}`;
    });

    return highlightedText;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Search</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close advanced search"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Controls */}
        <div className="p-6 border-b bg-gray-50">
          <div className="space-y-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  value={query.text}
                  onChange={(e) => setQuery(prev => ({ ...prev, text: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your search query..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="search-options"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !query.text.trim()}
                  className="absolute right-2 top-2 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Search"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Options */}
            <div id="search-options" className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={query.options.fuzzy}
                  onChange={(e) => setQuery(prev => ({
                    ...prev,
                    options: { ...prev.options, fuzzy: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Fuzzy Search</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={query.options.semantic}
                  onChange={(e) => setQuery(prev => ({
                    ...prev,
                    options: { ...prev.options, semantic: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Semantic Search</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={query.options.nlp}
                  onChange={(e) => setQuery(prev => ({
                    ...prev,
                    options: { ...prev.options, nlp: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">NLP Search</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={query.options.caseSensitive}
                  onChange={(e) => setQuery(prev => ({
                    ...prev,
                    options: { ...prev.options, caseSensitive: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Case Sensitive</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={query.options.wholeWord}
                  onChange={(e) => setQuery(prev => ({
                    ...prev,
                    options: { ...prev.options, wholeWord: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Whole Word</span>
              </label>
            </div>

            {/* Search Stats */}
            {searchStats && (
              <div className="flex space-x-4 text-sm text-gray-600">
                <span>Indexed Words: {searchStats.totalIndexedWords.toLocaleString()}</span>
                <span>Indexed Tags: {searchStats.totalIndexedTags.toLocaleString()}</span>
                <span>Semantic Vectors: {searchStats.semanticVectors.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden">
          {results.length > 0 ? (
            <div className="h-full overflow-y-auto">
              <div className="p-4 border-b bg-gray-50">
                <p className="text-sm text-gray-600">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <div
                    key={`${result.note.id}-${index}`}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      index === selectedResultIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleResultClick(result)}
                    onKeyDown={(e) => handleResultKeyDown(e, result)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select note: ${result.note.title}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {result.note.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(result.matchType)}`}>
                          {getMatchTypeIcon(result.matchType)} {result.matchType}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatRelevance(result.relevance)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div
                        className="text-gray-700 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(result.note.body, result.highlights)
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {result.note.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>Tags:</span>
                            {result.note.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                            {result.note.tags.length > 3 && (
                              <span className="text-xs">+{result.note.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                        <span>{result.metadata.wordCount} words</span>
                        <span>{result.metadata.contentType}</span>
                      </div>
                      <span>{new Date(result.metadata.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : query.text && !isSearching ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500">No results found</p>
                <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-gray-500">Enter a search query to begin</p>
                <p className="text-sm text-gray-400">Use the options above to customize your search</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Press Enter to search</span>
              <span>Use arrow keys to navigate results</span>
              <span>Press Escape to close</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 