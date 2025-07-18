import React, { useState, useEffect, useRef } from 'react';
import { advancedDataVisualizationService, ChartData, AnalyticsData, HeatmapData, NetworkGraphData, TimelineData } from '../services/advancedDataVisualizationService';
import { Note } from '../types/note';

const sampleNotes: Note[] = [
  {
    id: '1',
    title: 'Machine Learning Basics',
    content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without explicit programming. It uses algorithms to identify patterns in data and make predictions.',
    tags: ['AI', 'ML', 'technology', 'data-science'],
    category: 'Technology',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-20T14:20:00')
  },
  {
    id: '2',
    title: 'React Development Notes',
    content: 'React is a JavaScript library for building user interfaces. It uses components, state management, and virtual DOM for efficient rendering. Popular for single-page applications.',
    tags: ['react', 'javascript', 'frontend', 'web-development'],
    category: 'Development',
    createdAt: new Date('2024-01-10T09:15:00'),
    updatedAt: new Date('2024-01-18T16:45:00')
  },
  {
    id: '3',
    title: 'Data Structures and Algorithms',
    content: 'Understanding data structures like arrays, linked lists, trees, and graphs is crucial for efficient algorithm design. Time complexity and space complexity are key concepts.',
    tags: ['algorithms', 'data-structures', 'computer-science', 'programming'],
    category: 'Computer Science',
    createdAt: new Date('2024-01-05T11:00:00'),
    updatedAt: new Date('2024-01-12T13:30:00')
  },
  {
    id: '4',
    title: 'Natural Language Processing',
    content: 'NLP combines computational linguistics with machine learning to enable computers to understand, interpret, and generate human language. Applications include chatbots and translation.',
    tags: ['NLP', 'AI', 'linguistics', 'machine-learning'],
    category: 'Technology',
    createdAt: new Date('2024-01-08T15:20:00'),
    updatedAt: new Date('2024-01-16T10:10:00')
  },
  {
    id: '5',
    title: 'Web Security Best Practices',
    content: 'Implementing proper authentication, authorization, input validation, and encryption is essential for secure web applications. Regular security audits help identify vulnerabilities.',
    tags: ['security', 'web-development', 'authentication', 'encryption'],
    category: 'Security',
    createdAt: new Date('2024-01-12T08:45:00'),
    updatedAt: new Date('2024-01-19T17:30:00')
  },
  {
    id: '6',
    title: 'TypeScript Advanced Features',
    content: 'TypeScript provides advanced type system features including generics, utility types, conditional types, and mapped types. These features enable better type safety and code organization.',
    tags: ['typescript', 'javascript', 'programming', 'type-safety'],
    category: 'Development',
    createdAt: new Date('2024-01-14T12:00:00'),
    updatedAt: new Date('2024-01-21T09:15:00')
  },
  {
    id: '7',
    title: 'Database Design Principles',
    content: 'Good database design involves normalization, proper indexing, relationship modeling, and performance optimization. Understanding ACID properties and transaction management is crucial.',
    tags: ['database', 'sql', 'design', 'performance'],
    category: 'Computer Science',
    createdAt: new Date('2024-01-16T14:30:00'),
    updatedAt: new Date('2024-01-22T11:45:00')
  },
  {
    id: '8',
    title: 'Cloud Computing Fundamentals',
    content: 'Cloud computing provides on-demand access to computing resources. Key concepts include IaaS, PaaS, SaaS, scalability, and cost optimization strategies.',
    tags: ['cloud', 'aws', 'azure', 'infrastructure'],
    category: 'Technology',
    createdAt: new Date('2024-01-18T16:00:00'),
    updatedAt: new Date('2024-01-23T13:20:00')
  }
];

const AdvancedDataVisualizationDemo: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(sampleNotes);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>('category');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [networkData, setNetworkData] = useState<NetworkGraphData | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [activeTab, setActiveTab] = useState<'charts' | 'analytics' | 'advanced' | 'custom'>('charts');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize visualization service
    advancedDataVisualizationService.setNotes(notes);
    
    // Generate initial data
    generateAllVisualizations();
  }, [notes]);

  const generateAllVisualizations = () => {
    setAnalytics(advancedDataVisualizationService.generateAnalyticsData());
    setChartData(advancedDataVisualizationService.generateNotesByCategoryChart());
    setHeatmapData(advancedDataVisualizationService.generateHeatmapData());
    setNetworkData(advancedDataVisualizationService.generateNetworkGraphData());
    setTimelineData(advancedDataVisualizationService.generateTimelineData());
  };

  const updateChartData = (chartType: string) => {
    setSelectedChart(chartType);
    
    switch (chartType) {
      case 'category':
        setChartData(advancedDataVisualizationService.generateNotesByCategoryChart());
        break;
      case 'tag':
        setChartData(advancedDataVisualizationService.generateNotesByTagChart());
        break;
      case 'timeline':
        setChartData(advancedDataVisualizationService.generateNotesOverTimeChart());
        break;
      case 'productivity':
        setChartData(advancedDataVisualizationService.generateProductivityTrendsChart());
        break;
      case 'wordcount':
        setChartData(advancedDataVisualizationService.generateWordCountDistributionChart());
        break;
    }
  };

  const addSampleNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `Sample Note ${notes.length + 1}`,
      content: 'This is a sample note for testing visualizations. It contains some text to demonstrate the word count and content analysis features.',
      tags: ['sample', 'test', 'demo'],
      category: ['Technology', 'Development', 'Computer Science', 'Security'][Math.floor(Math.random() * 4)],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setNotes([...notes, newNote]);
  };

  const clearNotes = () => {
    setNotes([]);
  };

  const getChartType = (chartType: string): string => {
    switch (chartType) {
      case 'category':
      case 'tag':
      case 'wordcount':
        return 'pie';
      case 'timeline':
      case 'productivity':
        return 'line';
      default:
        return 'bar';
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Data Visualization Demo
        </h1>
        <p className="text-gray-600">
          Interactive charts, analytics dashboards, and custom visualizations for note data
        </p>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Notes</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalNotes}</p>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Words</p>
                <p className="text-2xl font-bold text-green-900">{formatNumber(analytics.contentAnalysis.wordCount)}</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Note Length</p>
                <p className="text-2xl font-bold text-purple-900">{Math.round(analytics.averageNoteLength)} words</p>
              </div>
              <div className="text-2xl">📏</div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Reading Time</p>
                <p className="text-2xl font-bold text-orange-900">{formatTime(analytics.contentAnalysis.readingTime)}</p>
              </div>
              <div className="text-2xl">⏱️</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'charts', label: 'Basic Charts', icon: '📊' },
              { id: 'analytics', label: 'Analytics Dashboard', icon: '📈' },
              { id: 'advanced', label: 'Advanced Visualizations', icon: '🎨' },
              { id: 'custom', label: 'Custom Visualizations', icon: '🔧' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Basic Charts Tab */}
          {activeTab === 'charts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Basic Charts</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={addSampleNote}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Sample Note
                  </button>
                  <button
                    onClick={clearNotes}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Clear Notes
                  </button>
                </div>
              </div>

              {/* Chart Type Selector */}
              <div className="flex space-x-2">
                {[
                  { key: 'category', label: 'By Category', icon: '📂' },
                  { key: 'tag', label: 'By Tag', icon: '🏷️' },
                  { key: 'timeline', label: 'Over Time', icon: '📅' },
                  { key: 'productivity', label: 'Productivity', icon: '📈' },
                  { key: 'wordcount', label: 'Word Count', icon: '📝' }
                ].map(chart => (
                  <button
                    key={chart.key}
                    onClick={() => updateChartData(chart.key)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      selectedChart === chart.key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{chart.icon}</span>
                    {chart.label}
                  </button>
                ))}
              </div>

              {/* Chart Display */}
              {chartData && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {chartData.datasets[0].label}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {getChartType(selectedChart).toUpperCase()} Chart
                    </span>
                  </div>
                  
                  <div className="h-64 flex items-center justify-center">
                    <canvas ref={canvasRef} className="max-w-full max-h-full"></canvas>
                  </div>
                  
                  {/* Chart Data Table */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Data Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {chartData.labels.map((label, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm text-gray-600">{label}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {chartData.datasets[0].data[index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Dashboard Tab */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Analysis */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Words:</span>
                      <span className="text-sm font-medium">{formatNumber(analytics.contentAnalysis.wordCount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average per Note:</span>
                      <span className="text-sm font-medium">{Math.round(analytics.contentAnalysis.averageWordsPerNote)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reading Time:</span>
                      <span className="text-sm font-medium">{formatTime(analytics.contentAnalysis.readingTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Most Common Words */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Words</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.contentAnalysis.mostCommonWords)
                      .slice(0, 10)
                      .map(([word, count]) => (
                        <div key={word} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{word}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Notes by Category */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.notesByCategory)
                      .sort(([,a], [,b]) => b - a)
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Most Active Days */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Days</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.mostActiveDays)
                      .sort(([,a], [,b]) => b - a)
                      .map(([day, count]) => (
                        <div key={day} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{day}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Visualizations Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Advanced Visualizations</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Heatmap */}
                {heatmapData && (
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Day/Hour Activity</span>
                        <span>Max: {heatmapData.maxValue}</span>
                      </div>
                      <div className="grid grid-cols-24 gap-1">
                        {heatmapData.data.map((row, i) =>
                          row.map((value, j) => (
                            <div
                              key={`${i}-${j}`}
                              className="w-4 h-4 rounded-sm"
                              style={{
                                backgroundColor: `rgba(59, 130, 246, ${value / heatmapData.maxValue})`
                              }}
                              title={`${heatmapData.yLabels[i]} ${heatmapData.xLabels[j]}: ${value}`}
                            />
                          ))
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>Sunday</span>
                        <span>Saturday</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Network Graph */}
                {networkData && (
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Note Connections</h3>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        {networkData.nodes.length} nodes, {networkData.edges.length} connections
                      </div>
                      <div className="space-y-2">
                        {networkData.nodes.slice(0, 5).map(node => (
                          <div key={node.id} className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: node.color }}
                            />
                            <span className="text-sm text-gray-700">{node.label}</span>
                            <span className="text-xs text-gray-500">({node.group})</span>
                          </div>
                        ))}
                        {networkData.nodes.length > 5 && (
                          <div className="text-xs text-gray-500">
                            +{networkData.nodes.length - 5} more nodes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {timelineData && (
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Note Timeline</h3>
                    <div className="space-y-2">
                      {timelineData.events.slice(0, 5).map(event => (
                        <div key={event.id} className="flex items-center space-x-3">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            <div className="text-xs text-gray-500">
                              {event.date.toLocaleDateString()} - {event.category}
                            </div>
                          </div>
                        </div>
                      ))}
                      {timelineData.events.length > 5 && (
                        <div className="text-xs text-gray-500">
                          +{timelineData.events.length - 5} more events
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Custom Visualizations Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Custom Visualizations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sankey Diagram */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sankey Diagram</h3>
                  <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                    <p className="text-gray-500">Sankey diagram visualization</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Shows flow of data between categories and tags
                  </p>
                </div>

                {/* Treemap */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Treemap</h3>
                  <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                    <p className="text-gray-500">Treemap visualization</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Hierarchical view of notes by category and size
                  </p>
                </div>

                {/* Sunburst Chart */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sunburst Chart</h3>
                  <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                    <p className="text-gray-500">Sunburst chart visualization</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Radial hierarchical view of note structure
                  </p>
                </div>

                {/* Chord Diagram */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chord Diagram</h3>
                  <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
                    <p className="text-gray-500">Chord diagram visualization</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Shows relationships between different note categories
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Data Size
            </label>
            <select
              value={notes.length}
              onChange={(e) => {
                const size = parseInt(e.target.value);
                setNotes(sampleNotes.slice(0, size));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={0}>No notes</option>
              <option value={3}>3 notes</option>
              <option value={5}>5 notes</option>
              <option value={8}>8 notes</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Type
            </label>
            <select
              value={selectedChart}
              onChange={(e) => updateChartData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="category">By Category</option>
              <option value="tag">By Tag</option>
              <option value="timeline">Over Time</option>
              <option value="productivity">Productivity</option>
              <option value="wordcount">Word Count</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateAllVisualizations}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Refresh Visualizations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDataVisualizationDemo; 