import { Note } from '../types/note';

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'scatter' | 'bubble' | 'heatmap';
  responsive: boolean;
  maintainAspectRatio: boolean;
  animation: boolean;
  plugins: {
    legend: boolean;
    tooltip: boolean;
    zoom: boolean;
  };
}

export interface AnalyticsData {
  totalNotes: number;
  notesByCategory: { [category: string]: number };
  notesByTag: { [tag: string]: number };
  notesByDate: { [date: string]: number };
  averageNoteLength: number;
  mostActiveDays: { [day: string]: number };
  productivityTrends: { [period: string]: number };
  contentAnalysis: {
    wordCount: number;
    averageWordsPerNote: number;
    mostCommonWords: { [word: string]: number };
    readingTime: number;
  };
  collaborationMetrics: {
    sharedNotes: number;
    activeCollaborators: number;
    editFrequency: { [period: string]: number };
  };
}

export interface HeatmapData {
  data: number[][];
  xLabels: string[];
  yLabels: string[];
  minValue: number;
  maxValue: number;
}

export interface NetworkGraphData {
  nodes: Array<{
    id: string;
    label: string;
    group: string;
    size: number;
    color: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    weight: number;
    color: string;
  }>;
}

export interface TimelineData {
  events: Array<{
    id: string;
    title: string;
    date: Date;
    category: string;
    description: string;
    color: string;
  }>;
}

export class AdvancedDataVisualizationService {
  private notes: Note[] = [];
  private colorPalette = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  setNotes(notes: Note[]) {
    this.notes = notes;
  }

  // Basic Chart Data Generation
  generateNotesByCategoryChart(): ChartData {
    const categoryCount: { [key: string]: number } = {};
    
    this.notes.forEach(note => {
      const category = note.category || 'Uncategorized';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return {
      labels: Object.keys(categoryCount),
      datasets: [{
        label: 'Notes by Category',
        data: Object.values(categoryCount),
        backgroundColor: this.colorPalette.slice(0, Object.keys(categoryCount).length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  generateNotesByTagChart(): ChartData {
    const tagCount: { [key: string]: number } = {};
    
    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // Sort by count and take top 10
    const sortedTags = Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedTags.map(([tag]) => tag),
      datasets: [{
        label: 'Notes by Tag',
        data: sortedTags.map(([, count]) => count),
        backgroundColor: this.colorPalette.slice(0, sortedTags.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  generateNotesOverTimeChart(): ChartData {
    const dateCount: { [key: string]: number } = {};
    
    this.notes.forEach(note => {
      const date = note.createdAt.toISOString().split('T')[0];
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCount).sort();
    const last30Days = sortedDates.slice(-30);

    return {
      labels: last30Days,
      datasets: [{
        label: 'Notes Created',
        data: last30Days.map(date => dateCount[date]),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
  }

  generateProductivityTrendsChart(): ChartData {
    const weeklyData: { [key: string]: number } = {};
    
    this.notes.forEach(note => {
      const weekStart = this.getWeekStart(note.createdAt);
      weeklyData[weekStart] = (weeklyData[weekStart] || 0) + 1;
    });

    const sortedWeeks = Object.keys(weeklyData).sort();
    const last12Weeks = sortedWeeks.slice(-12);

    return {
      labels: last12Weeks.map(week => `Week ${week}`),
      datasets: [{
        label: 'Notes per Week',
        data: last12Weeks.map(week => weeklyData[week]),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4
      }]
    };
  }

  generateWordCountDistributionChart(): ChartData {
    const wordCounts = this.notes.map(note => 
      note.content.split(/\s+/).length
    );

    const ranges = [
      '0-50', '51-100', '101-200', '201-500', '501-1000', '1000+'
    ];

    const distribution = ranges.map(range => {
      const [min, max] = range === '1000+' ? [1000, Infinity] : range.split('-').map(Number);
      return wordCounts.filter(count => count >= min && count <= max).length;
    });

    return {
      labels: ranges,
      datasets: [{
        label: 'Notes by Word Count',
        data: distribution,
        backgroundColor: this.colorPalette.slice(0, ranges.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  // Advanced Visualizations
  generateHeatmapData(): HeatmapData {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);
    
    const data: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));
    
    this.notes.forEach(note => {
      const day = note.createdAt.getDay();
      const hour = note.createdAt.getHours();
      data[day][hour]++;
    });

    const maxValue = Math.max(...data.flat());

    return {
      data,
      xLabels: hoursOfDay.map(h => `${h}:00`),
      yLabels: daysOfWeek,
      minValue: 0,
      maxValue
    };
  }

  generateNetworkGraphData(): NetworkGraphData {
    const nodes: NetworkGraphData['nodes'] = [];
    const edges: NetworkGraphData['edges'] = [];
    const nodeMap = new Map<string, number>();

    // Create nodes for notes
    this.notes.forEach(note => {
      nodes.push({
        id: note.id,
        label: note.title,
        group: note.category,
        size: Math.max(10, note.content.split(/\s+/).length / 10),
        color: this.getColorForCategory(note.category)
      });
      nodeMap.set(note.id, nodes.length - 1);
    });

    // Create edges based on shared tags
    this.notes.forEach(note => {
      note.tags.forEach(tag => {
        const notesWithTag = this.notes.filter(n => 
          n.id !== note.id && n.tags.includes(tag)
        );
        
        notesWithTag.forEach(relatedNote => {
          const edgeId = `${note.id}-${relatedNote.id}`;
          const reverseEdgeId = `${relatedNote.id}-${note.id}`;
          
          if (!edges.find(e => e.from === edgeId || e.from === reverseEdgeId)) {
            edges.push({
              from: note.id,
              to: relatedNote.id,
              weight: 1,
              color: '#94A3B8'
            });
          }
        });
      });
    });

    return { nodes, edges };
  }

  generateTimelineData(): TimelineData {
    const events = this.notes
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map(note => ({
        id: note.id,
        title: note.title,
        date: note.createdAt,
        category: note.category,
        description: note.content.substring(0, 100) + '...',
        color: this.getColorForCategory(note.category)
      }));

    return { events };
  }

  // Analytics Data Generation
  generateAnalyticsData(): AnalyticsData {
    const totalNotes = this.notes.length;
    const notesByCategory: { [category: string]: number } = {};
    const notesByTag: { [tag: string]: number } = {};
    const notesByDate: { [date: string]: number } = {};
    const mostActiveDays: { [day: string]: number } = {};
    const productivityTrends: { [period: string]: number } = {};
    const wordCounts: number[] = [];
    const allWords: string[] = [];

    this.notes.forEach(note => {
      // Category analysis
      const category = note.category || 'Uncategorized';
      notesByCategory[category] = (notesByCategory[category] || 0) + 1;

      // Tag analysis
      note.tags.forEach(tag => {
        notesByTag[tag] = (notesByTag[tag] || 0) + 1;
      });

      // Date analysis
      const date = note.createdAt.toISOString().split('T')[0];
      notesByDate[date] = (notesByDate[date] || 0) + 1;

      // Day of week analysis
      const dayName = note.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
      mostActiveDays[dayName] = (mostActiveDays[dayName] || 0) + 1;

      // Word count analysis
      const words = note.content.split(/\s+/);
      wordCounts.push(words.length);
      allWords.push(...words);

      // Productivity trends (by month)
      const monthKey = note.createdAt.toISOString().slice(0, 7);
      productivityTrends[monthKey] = (productivityTrends[monthKey] || 0) + 1;
    });

    // Word frequency analysis
    const wordFrequency: { [word: string]: number } = {};
    allWords.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      if (cleanWord.length > 2) {
        wordFrequency[cleanWord] = (wordFrequency[cleanWord] || 0) + 1;
      }
    });

    const mostCommonWords = Object.entries(wordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [word, count]) => {
        obj[word] = count;
        return obj;
      }, {} as { [word: string]: number });

    const averageNoteLength = wordCounts.length > 0 ? 
      wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length : 0;

    const totalWords = wordCounts.reduce((a, b) => a + b, 0);
    const readingTime = Math.ceil(totalWords / 200); // Average reading speed

    return {
      totalNotes,
      notesByCategory,
      notesByTag,
      notesByDate,
      averageNoteLength,
      mostActiveDays,
      productivityTrends,
      contentAnalysis: {
        wordCount: totalWords,
        averageWordsPerNote: averageNoteLength,
        mostCommonWords,
        readingTime
      },
      collaborationMetrics: {
        sharedNotes: 0, // Would be calculated from collaboration data
        activeCollaborators: 0, // Would be calculated from collaboration data
        editFrequency: productivityTrends
      }
    };
  }

  // Interactive Chart Configurations
  getChartConfiguration(type: string): VisualizationConfig {
    const baseConfig: VisualizationConfig = {
      type: type as any,
      responsive: true,
      maintainAspectRatio: false,
      animation: true,
      plugins: {
        legend: true,
        tooltip: true,
        zoom: false
      }
    };

    switch (type) {
      case 'line':
        return {
          ...baseConfig,
          plugins: { ...baseConfig.plugins, zoom: true }
        };
      case 'pie':
      case 'doughnut':
        return {
          ...baseConfig,
          plugins: { ...baseConfig.plugins, legend: true }
        };
      case 'heatmap':
        return {
          ...baseConfig,
          plugins: { ...baseConfig.plugins, tooltip: true }
        };
      default:
        return baseConfig;
    }
  }

  // Data Export for External Libraries
  exportForChartJS(chartData: ChartData, type: string) {
    return {
      type,
      data: chartData,
      options: this.getChartJSOptions(type)
    };
  }

  exportForD3(visualizationType: string) {
    switch (visualizationType) {
      case 'network':
        return this.generateNetworkGraphData();
      case 'heatmap':
        return this.generateHeatmapData();
      case 'timeline':
        return this.generateTimelineData();
      default:
        return null;
    }
  }

  // Utility Methods
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  private getColorForCategory(category: string): string {
    const categories = ['Technology', 'Development', 'Computer Science', 'Security', 'General'];
    const index = categories.indexOf(category);
    return this.colorPalette[index % this.colorPalette.length];
  }

  private getChartJSOptions(type: string) {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
        }
      }
    };

    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Count'
              }
            }
          }
        };
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        };
      case 'pie':
      case 'doughnut':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            legend: {
              position: 'right' as const
            }
          }
        };
      default:
        return baseOptions;
    }
  }

  // Real-time Data Updates
  updateVisualizationData(newNotes: Note[]) {
    this.notes = newNotes;
    return {
      categoryChart: this.generateNotesByCategoryChart(),
      tagChart: this.generateNotesByTagChart(),
      timelineChart: this.generateNotesOverTimeChart(),
      productivityChart: this.generateProductivityTrendsChart(),
      wordCountChart: this.generateWordCountDistributionChart(),
      analytics: this.generateAnalyticsData(),
      heatmap: this.generateHeatmapData(),
      network: this.generateNetworkGraphData(),
      timeline: this.generateTimelineData()
    };
  }

  // Custom Visualizations
  generateCustomVisualization(type: string, customData: any) {
    switch (type) {
      case 'sankey':
        return this.generateSankeyData(customData);
      case 'treemap':
        return this.generateTreemapData(customData);
      case 'sunburst':
        return this.generateSunburstData(customData);
      case 'chord':
        return this.generateChordData(customData);
      default:
        return null;
    }
  }

  private generateSankeyData(data: any) {
    // Sankey diagram data structure
    return {
      nodes: data.nodes || [],
      links: data.links || []
    };
  }

  private generateTreemapData(data: any) {
    // Treemap data structure
    return {
      name: 'Notes',
      children: data.children || []
    };
  }

  private generateSunburstData(data: any) {
    // Sunburst chart data structure
    return {
      name: 'Notes',
      children: data.children || []
    };
  }

  private generateChordData(data: any) {
    // Chord diagram data structure
    return {
      matrix: data.matrix || [],
      names: data.names || []
    };
  }
}

export const advancedDataVisualizationService = new AdvancedDataVisualizationService(); 