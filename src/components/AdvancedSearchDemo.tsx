import React, { useState } from 'react';
import { AdvancedSearchService, SearchQuery, SearchResult } from '../services/advancedSearchService';

const sampleNotes = [
  {
    id: '1',
    title: 'Machine Learning Fundamentals',
    body: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed. It involves algorithms that can identify patterns in data and make predictions or classifications.',
    tags: ['AI', 'ML', 'algorithms', 'data-science'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    title: 'React Component Patterns',
    body: 'React components can be organized using various patterns like Higher-Order Components (HOCs), Render Props, and Custom Hooks. These patterns help create reusable and maintainable code.',
    tags: ['react', 'javascript', 'frontend', 'patterns'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    title: 'Database Optimization Techniques',
    body: 'Database optimization involves indexing strategies, query optimization, and schema design. Proper indexing can dramatically improve query performance and reduce response times.',
    tags: ['database', 'sql', 'performance', 'optimization'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '4',
    title: 'Natural Language Processing Basics',
    body: 'NLP is a field of AI that focuses on the interaction between computers and human language. It includes tasks like text classification, sentiment analysis, and language generation.',
    tags: ['NLP', 'AI', 'text-processing', 'machine-learning'],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '5',
    title: 'Web Security Best Practices',
    body: 'Web security involves protecting web applications from various threats like SQL injection, XSS attacks, and CSRF. Implementing proper authentication and authorization is crucial.',
    tags: ['security', 'web', 'authentication', 'cybersecurity'],
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05')
  }
];

const searchExamples = [
  {
    name: 'Exact Match',
    query: 'machine learning',
    description: 'Find notes containing the exact phrase "machine learning"',
    options: { fuzzy: false, semantic: false, nlp: false, caseSensitive: false, wholeWord: false }
  },
  {
    name: 'Fuzzy Search',
    query: 'mashine lerning',
    description: 'Find notes with similar words despite typos',
    options: { fuzzy: true, semantic: false, nlp: false, caseSensitive: false, wholeWord: false }
  },
  {
    name: 'Semantic Search',
    query: 'artificial intelligence',
    description: 'Find notes related to AI even if they don\'t contain the exact words',
    options: { fuzzy: false, semantic: true, nlp: false, caseSensitive: false, wholeWord: false }
  },
  {
    name: 'NLP Search',
    query: 'How do I optimize database performance?',
    description: 'Understand natural language queries and find relevant notes',
    options: { fuzzy: false, semantic: false, nlp: true, caseSensitive: false, wholeWord: false }
  },
  {
    name: 'Combined Search',
    query: 'react patterns',
    description: 'Use multiple algorithms for comprehensive results',
    options: { fuzzy: true, semantic: true, nlp: false, caseSensitive: false, wholeWord: false }
  }
];

export const AdvancedSearchDemo: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState<'demo' | 'examples' | 'stats'>('demo');

  React.useEffect(() => {
    AdvancedSearchService.initialize(sampleNotes);
    setSearchStats(AdvancedSearchService.getSearchStats());
  }, []);

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

  const handleExampleClick = (example: typeof searchExamples[0]) => {
    setQuery({
      text: example.query,
      filters: {},
      options: example.options
    });
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced Search Algorithms Demo</h1>
        <p className="text-lg text-gray-600">
          Explore fuzzy search, semantic search, and natural language processing capabilities
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('demo')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'demo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Interactive Demo
          </button>
          <button
            onClick={() => setActiveTab('examples')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'examples'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Search Examples
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Algorithm Stats
          </button>
        </nav>
      </div>

      {activeTab === 'demo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Interface */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Interface</h2>
              
              {/* Search Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Query
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={query.text}
                    onChange={(e) => setQuery(prev => ({ ...prev, text: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Enter your search query..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !query.text.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Options */}
              <div className="grid grid-cols-2 gap-4 mb-4">
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
              </div>

              {/* Quick Examples */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Examples</h3>
                <div className="flex flex-wrap gap-2">
                  {['machine learning', 'react', 'database', 'security', 'AI'].map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(prev => ({ ...prev, text: term }))}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results ({results.length})
              </h2>
              
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
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
                      
                      <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                        {result.note.body}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          {result.note.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 rounded">
                              {tag}
                            </span>
                          ))}
                          {result.note.tags.length > 3 && (
                            <span>+{result.note.tags.length - 3} more</span>
                          )}
                        </div>
                        <span>{result.metadata.wordCount} words</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : query.text && !isSearching ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>No results found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>Enter a search query to see results</p>
                </div>
              )}
            </div>
          </div>

          {/* Algorithm Information */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Algorithm Information</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-medium text-gray-900">Exact Match Search</h3>
                  <p className="text-sm text-gray-600">
                    Finds exact text matches in titles, body, and tags. Fastest algorithm with highest precision.
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h3 className="font-medium text-gray-900">Fuzzy Search</h3>
                  <p className="text-sm text-gray-600">
                    Uses Levenshtein distance to find similar words, handling typos and minor variations.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Semantic Search</h3>
                  <p className="text-sm text-gray-600">
                    Uses vector similarity to find conceptually related content, even without exact word matches.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-medium text-gray-900">NLP Search</h3>
                  <p className="text-sm text-gray-600">
                    Processes natural language queries to understand intent and extract relevant entities.
                  </p>
                </div>
              </div>
            </div>

            {/* Sample Data */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Data</h2>
              
              <div className="space-y-3">
                {sampleNotes.map((note, index) => (
                  <div key={note.id} className="border rounded-lg p-3">
                    <h3 className="font-medium text-gray-900 text-sm">{note.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{note.body}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Examples</h2>
            <p className="text-gray-600 mb-6">
              Click on any example to see how different search algorithms work with the same query.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchExamples.map((example, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleExampleClick(example)}
                >
                  <h3 className="font-medium text-gray-900 mb-2">{example.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{example.description}</p>
                  <div className="text-sm font-mono text-blue-600 mb-2">"{example.query}"</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(example.options).map(([key, value]) => (
                      value && (
                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {key}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results for Selected Example */}
          {query.text && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Results for: "{query.text}"
              </h3>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(query.options).map(([key, value]) => (
                    value && (
                      <span key={key} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {key}: {value.toString()}
                      </span>
                    )
                  ))}
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSearching ? 'Searching...' : 'Run Search'}
              </button>

              {results.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Found {results.length} results:</h4>
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{result.note.title}</h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchTypeColor(result.matchType)}`}>
                            {getMatchTypeIcon(result.matchType)} {result.matchType} ({formatRelevance(result.relevance)})
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{result.note.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Algorithm Statistics</h2>
            
            {searchStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{searchStats.totalIndexedWords.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Indexed Words</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{searchStats.totalIndexedTags.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Indexed Tags</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{searchStats.semanticVectors.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Semantic Vectors</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Exact Match Search</span>
                <span className="text-sm text-gray-600">~1ms per query</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Fuzzy Search</span>
                <span className="text-sm text-gray-600">~5-10ms per query</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Semantic Search</span>
                <span className="text-sm text-gray-600">~20-50ms per query</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">NLP Search</span>
                <span className="text-sm text-gray-600">~50-100ms per query</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Algorithm Comparison</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Algorithm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Speed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accuracy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Use Case
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Exact Match
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Very Fast</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">High</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Precise searches</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Fuzzy Search
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Fast</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Medium</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Typo tolerance</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Semantic Search
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Medium</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">High</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Conceptual matching</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      NLP Search
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Slow</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Very High</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Natural language</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 