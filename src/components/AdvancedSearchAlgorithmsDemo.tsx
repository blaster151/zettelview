import React, { useState, useEffect } from 'react';
import { AdvancedSearchAlgorithms, SearchResult, SearchOptions, SearchCluster } from '../services/advancedSearchAlgorithms';
import { Note } from '../types/note';

const AdvancedSearchAlgorithmsDemo: React.FC = () => {
  const [searchService] = useState(() => AdvancedSearchAlgorithms.getInstance());
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'combined' | 'fuzzy' | 'semantic' | 'nlp'>('combined');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [clusters, setClusters] = useState<SearchCluster[]>([]);
  const [options, setOptions] = useState<SearchOptions>({
    fuzzyThreshold: 0.7,
    semanticWeight: 0.3,
    fuzzyWeight: 0.4,
    exactWeight: 0.3,
    maxResults: 20,
    includeContent: true,
    includeTags: true,
    includeTitle: true,
    boostRecent: true,
    boostPopular: true,
    enableClustering: true,
    contextWindow: 200
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Sample notes for demonstration
  const sampleNotes: Note[] = [
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions.',
      tags: ['AI', 'ML', 'technology', 'algorithms'],
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      title: 'Neural Networks and Deep Learning',
      content: 'Neural networks are computational models inspired by biological neural networks. Deep learning uses multiple layers of neural networks to process complex patterns in data.',
      tags: ['AI', 'neural-networks', 'deep-learning', 'technology'],
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-25T16:45:00Z'
    },
    {
      id: '3',
      title: 'Data Science Workflow',
      content: 'The data science workflow involves data collection, cleaning, exploration, modeling, and deployment. Each step is crucial for building effective machine learning models.',
      tags: ['data-science', 'workflow', 'ML', 'analytics'],
      createdAt: '2024-01-10T11:20:00Z',
      updatedAt: '2024-01-22T13:15:00Z'
    },
    {
      id: '4',
      title: 'Python for Data Analysis',
      content: 'Python is the most popular programming language for data analysis and machine learning. Libraries like pandas, numpy, and scikit-learn provide powerful tools for data manipulation and modeling.',
      tags: ['python', 'data-analysis', 'programming', 'libraries'],
      createdAt: '2024-01-12T08:30:00Z',
      updatedAt: '2024-01-28T10:20:00Z'
    },
    {
      id: '5',
      title: 'Natural Language Processing',
      content: 'NLP is a branch of AI that focuses on the interaction between computers and human language. It includes tasks like text classification, sentiment analysis, and language generation.',
      tags: ['NLP', 'AI', 'language', 'text-processing'],
      createdAt: '2024-01-14T15:45:00Z',
      updatedAt: '2024-01-26T12:10:00Z'
    },
    {
      id: '6',
      title: 'Computer Vision Applications',
      content: 'Computer vision enables machines to interpret and understand visual information from the world. Applications include image recognition, object detection, and facial recognition.',
      tags: ['computer-vision', 'AI', 'image-processing', 'applications'],
      createdAt: '2024-01-16T13:20:00Z',
      updatedAt: '2024-01-24T09:30:00Z'
    },
    {
      id: '7',
      title: 'Big Data Processing',
      content: 'Big data processing involves handling large volumes of data that cannot be processed using traditional database systems. Technologies like Hadoop and Spark enable distributed processing.',
      tags: ['big-data', 'distributed-computing', 'Hadoop', 'Spark'],
      createdAt: '2024-01-08T16:00:00Z',
      updatedAt: '2024-01-21T11:45:00Z'
    },
    {
      id: '8',
      title: 'Reinforcement Learning',
      content: 'Reinforcement learning is a type of machine learning where an agent learns to make decisions by taking actions in an environment and receiving rewards or penalties.',
      tags: ['reinforcement-learning', 'AI', 'decision-making', 'agents'],
      createdAt: '2024-01-19T14:15:00Z',
      updatedAt: '2024-01-27T15:20:00Z'
    }
  ];

  useEffect(() => {
    // Track some note access for popularity scoring
    searchService.trackNoteAccess('1');
    searchService.trackNoteAccess('1');
    searchService.trackNoteAccess('2');
    searchService.trackNoteAccess('3');
    searchService.trackNoteAccess('4');
  }, [searchService]);

  const performSearch = () => {
    if (!query.trim()) return;

    let searchResults: SearchResult[] = [];
    
    switch (searchType) {
      case 'fuzzy':
        searchResults = searchService.fuzzySearch(query, sampleNotes, options.fuzzyThreshold);
        break;
      case 'semantic':
        searchResults = searchService.semanticSearch(query, sampleNotes);
        break;
      case 'nlp':
        searchResults = searchService.nlpSearch(query, sampleNotes);
        break;
      case 'combined':
      default:
        searchResults = searchService.combinedSearch(query, sampleNotes, options);
        break;
    }

    setResults(searchResults);
    
    // Generate clusters if enabled
    if (options.enableClustering && searchResults.length > 0) {
      const searchClusters = searchService.getSearchClusters(searchResults);
      setClusters(searchClusters);
    } else {
      setClusters([]);
    }

    // Update search history
    setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
    
    // Get suggestions
    const searchSuggestions = searchService.getSearchSuggestions(query, sampleNotes);
    setSuggestions(searchSuggestions);
  };

  const getSearchAnalytics = () => {
    const analytics = searchService.getSearchAnalytics(searchHistory, sampleNotes);
    setAnalytics(analytics);
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim()) {
      const newSuggestions = searchService.getSearchSuggestions(newQuery, sampleNotes);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
  };

  const filterByCluster = (clusterId: string | null) => {
    setSelectedCluster(clusterId);
  };

  const filteredResults = selectedCluster 
    ? results.filter(result => result.clusterId === selectedCluster)
    : results;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Advanced Search Algorithms Demo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Enter your search query..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                />
                <button
                  onClick={performSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Suggestions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 8).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => selectSuggestion(suggestion)}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="combined">Combined Search</option>
                  <option value="fuzzy">Fuzzy Search</option>
                  <option value="semantic">Semantic Search</option>
                  <option value="nlp">NLP Search</option>
                </select>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>

                <button
                  onClick={getSearchAnalytics}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Get Analytics
                </button>
              </div>

              {/* Advanced Options */}
              {showAdvanced && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-gray-900">Advanced Search Options</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fuzzy Threshold: {options.fuzzyThreshold}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={options.fuzzyThreshold}
                        onChange={(e) => setOptions(prev => ({ ...prev, fuzzyThreshold: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Results: {options.maxResults}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="50"
                        step="5"
                        value={options.maxResults}
                        onChange={(e) => setOptions(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weights</label>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-600">Exact: {options.exactWeight}</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={options.exactWeight}
                            onChange={(e) => setOptions(prev => ({ ...prev, exactWeight: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Fuzzy: {options.fuzzyWeight}</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={options.fuzzyWeight}
                            onChange={(e) => setOptions(prev => ({ ...prev, fuzzyWeight: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Semantic: {options.semanticWeight}</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={options.semanticWeight}
                            onChange={(e) => setOptions(prev => ({ ...prev, semanticWeight: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={options.boostRecent}
                          onChange={(e) => setOptions(prev => ({ ...prev, boostRecent: e.target.checked }))}
                          className="mr-2"
                        />
                        Boost Recent Notes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={options.boostPopular}
                          onChange={(e) => setOptions(prev => ({ ...prev, boostPopular: e.target.checked }))}
                          className="mr-2"
                        />
                        Boost Popular Notes
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={options.enableClustering}
                          onChange={(e) => setOptions(prev => ({ ...prev, enableClustering: e.target.checked }))}
                          className="mr-2"
                        />
                        Enable Clustering
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search History */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Search History</h3>
            <div className="space-y-2">
              {searchHistory.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleQueryChange(search)}
                  className="block w-full text-left px-3 py-2 bg-white rounded-md text-sm hover:bg-gray-100 transition-colors"
                >
                  {search}
                </button>
              ))}
              {searchHistory.length === 0 && (
                <p className="text-gray-500 text-sm">No search history yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results and Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Results */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results ({filteredResults.length})
              </h2>
              {selectedCluster && (
                <button
                  onClick={() => filterByCluster(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="space-y-4">
              {filteredResults.map((result, index) => (
                <div key={result.note.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{result.note.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Score: {(result.score * 100).toFixed(1)}%
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.matchType === 'exact' ? 'bg-green-100 text-green-800' :
                        result.matchType === 'fuzzy' ? 'bg-yellow-100 text-yellow-800' :
                        result.matchType === 'semantic' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {result.matchType}
                      </span>
                      {result.clusterId && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Cluster {result.clusterId}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-3">{result.context}</p>

                  {result.highlights.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Highlights:</h4>
                      <div className="space-y-1">
                        {result.highlights.slice(0, 2).map((highlight, idx) => (
                          <div key={idx} className="text-sm bg-yellow-100 p-2 rounded">
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {result.note.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(result.note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Relevance:</span>
                        <span className="ml-1 font-medium">
                          {result.relevanceScore ? (result.relevanceScore * 100).toFixed(0) + '%' : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Freshness:</span>
                        <span className="ml-1 font-medium">
                          {result.freshnessScore ? (result.freshnessScore * 100).toFixed(0) + '%' : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Popularity:</span>
                        <span className="ml-1 font-medium">
                          {result.popularityScore ? (result.popularityScore * 100).toFixed(0) + '%' : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No results found. Try adjusting your search query or options.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clusters */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Result Clusters</h3>
          
          {clusters.length > 0 ? (
            <div className="space-y-3">
              <button
                onClick={() => filterByCluster(null)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCluster === null 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Results ({results.length})
              </button>
              
              {clusters.map(cluster => (
                <button
                  key={cluster.id}
                  onClick={() => filterByCluster(cluster.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCluster === cluster.id 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{cluster.name}</div>
                  <div className="text-sm text-gray-500">
                    {cluster.notes.length} notes
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Keywords: {cluster.keywords.slice(0, 3).join(', ')}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {options.enableClustering ? 'No clusters generated' : 'Clustering disabled'}
            </div>
          )}
        </div>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800">Total Queries</h4>
              <p className="text-2xl font-bold text-blue-900">{analytics.totalQueries}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Avg Query Length</h4>
              <p className="text-2xl font-bold text-green-900">{analytics.averageQueryLength.toFixed(1)}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800">Search Effectiveness</h4>
              <p className="text-2xl font-bold text-yellow-900">{(analytics.searchEffectiveness * 100).toFixed(1)}%</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800">Unique Words</h4>
              <p className="text-2xl font-bold text-purple-900">{analytics.mostCommonWords.size}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Most Common Words</h4>
              <div className="space-y-2">
                {Array.from(analytics.mostCommonWords.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([word, count]) => (
                    <div key={word} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{word}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Popular Searches</h4>
              <div className="space-y-2">
                {Array.from(analytics.popularSearches.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([search, count]) => (
                    <div key={search} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{search}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Data Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Data</h3>
        <p className="text-gray-600 mb-4">
          This demo uses {sampleNotes.length} sample notes about AI, machine learning, and data science topics. 
          Try searching for terms like "machine learning", "neural networks", "data analysis", or "artificial intelligence".
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleNotes.map(note => (
            <div key={note.id} className="bg-white p-3 rounded-lg border">
              <h4 className="font-medium text-sm text-gray-900 mb-1">{note.title}</h4>
              <div className="flex flex-wrap gap-1">
                {note.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchAlgorithmsDemo; 