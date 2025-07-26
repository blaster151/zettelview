import React, { useState, useEffect, useMemo } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';
import { useThemeStore } from '../store/themeStore';
import { cn } from '../lib/utils';
import { WorkflowStats, Task } from '../services/workflowService';

interface WorkflowAnalyticsProps {
  boardId: string;
  className?: string;
  showCharts?: boolean;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

const WorkflowAnalytics: React.FC<WorkflowAnalyticsProps> = ({
  boardId,
  className,
  showCharts = true,
  timeRange = '30d'
}) => {
  const { stats, getBoardStats, tasks, isLoading, error } = useWorkflow();
  const { colors } = useThemeStore();
  
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  useEffect(() => {
    if (boardId) {
      getBoardStats(boardId);
    }
  }, [boardId, getBoardStats]);

  // Calculate additional metrics
  const additionalMetrics = useMemo(() => {
    if (!stats || !tasks.length) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentTasks = tasks.filter(task => 
      task.createdAt >= thirtyDaysAgo
    );
    
    const completedTasks = tasks.filter(task => 
      task.status === 'done' && task.updatedAt >= thirtyDaysAgo
    );

    const avgTaskDuration = completedTasks.length > 0 
      ? completedTasks.reduce((sum, task) => {
          const duration = task.updatedAt.getTime() - task.createdAt.getTime();
          return sum + duration;
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const tasksByDay = recentTasks.reduce((acc, task) => {
      const day = task.createdAt.toDateString();
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completionRate = tasks.length > 0 
      ? (stats.completedTasks / tasks.length) * 100 
      : 0;

    const overdueRate = tasks.length > 0 
      ? (stats.overdueTasks / tasks.length) * 100 
      : 0;

    return {
      avgTaskDuration: Math.round(avgTaskDuration * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      overdueRate: Math.round(overdueRate * 10) / 10,
      tasksByDay,
      recentTasksCount: recentTasks.length,
      completedTasksCount: completedTasks.length
    };
  }, [stats, tasks]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!stats) return null;

    switch (selectedMetric) {
      case 'status':
        return {
          labels: Object.keys(stats.tasksByStatus),
          data: Object.values(stats.tasksByStatus),
          colors: ['#6c757d', '#007bff', '#ffc107', '#28a745', '#6c757d']
        };
      
      case 'priority':
        return {
          labels: Object.keys(stats.tasksByPriority),
          data: Object.values(stats.tasksByPriority),
          colors: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
        };
      
      case 'assignee':
        return {
          labels: Object.keys(stats.tasksByAssignee),
          data: Object.values(stats.tasksByAssignee),
          colors: ['#007bff', '#28a745', '#ffc107', '#fd7e14', '#dc3545']
        };
      
      case 'velocity':
        return {
          labels: stats.burndownData.map(point => 
            point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          ),
          data: stats.burndownData.map(point => point.completedTasks),
          colors: ['#28a745']
        };
      
      default:
        return null;
    }
  }, [stats, selectedMetric]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: colors.primary }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading analytics</div>
          <div className="text-sm" style={{ color: colors.textSecondary }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div style={{ color: colors.textSecondary }}>No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
          Workflow Analytics
        </h2>
        
        <div className="flex items-center space-x-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1 rounded border text-sm"
            style={{ 
              borderColor: colors.border,
              backgroundColor: colors.background,
              color: colors.text
            }}
          >
            <option value="overview">Overview</option>
            <option value="status">By Status</option>
            <option value="priority">By Priority</option>
            <option value="assignee">By Assignee</option>
            <option value="velocity">Velocity</option>
          </select>
          
          {showCharts && (
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as any)}
              className="px-3 py-1 rounded border text-sm"
              style={{ 
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.text
              }}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {selectedMetric === 'overview' ? (
          <OverviewMetrics stats={stats} additionalMetrics={additionalMetrics} colors={colors} />
        ) : (
          <ChartView 
            data={chartData} 
            type={chartType} 
            metric={selectedMetric}
            colors={colors}
          />
        )}
      </div>
    </div>
  );
};

// Overview Metrics Component
interface OverviewMetricsProps {
  stats: WorkflowStats;
  additionalMetrics: any;
  colors: any;
}

const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ stats, additionalMetrics, colors }) => {
  const metricCards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      change: '+12%',
      trend: 'up',
      color: '#007bff'
    },
    {
      title: 'Completed',
      value: stats.completedTasks,
      change: '+8%',
      trend: 'up',
      color: '#28a745'
    },
    {
      title: 'Overdue',
      value: stats.overdueTasks,
      change: '-5%',
      trend: 'down',
      color: '#dc3545'
    },
    {
      title: 'Velocity',
      value: `${stats.velocity.toFixed(1)}/day`,
      change: '+15%',
      trend: 'up',
      color: '#ffc107'
    }
  ];

  if (additionalMetrics) {
    metricCards.push(
      {
        title: 'Completion Rate',
        value: `${additionalMetrics.completionRate}%`,
        change: '+3%',
        trend: 'up',
        color: '#28a745'
      },
      {
        title: 'Avg Duration',
        value: `${additionalMetrics.avgTaskDuration} days`,
        change: '-2%',
        trend: 'down',
        color: '#fd7e14'
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <MetricCard key={index} metric={metric} colors={colors} />
        ))}
      </div>

      {/* Burndown Chart */}
      <div className="bg-white rounded-lg border p-4" style={{ borderColor: colors.border }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
          Burndown Chart (Last 30 Days)
        </h3>
        <BurndownChart data={stats.burndownData} colors={colors} />
      </div>

      {/* Task Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: colors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Tasks by Status
          </h3>
          <StatusDistribution data={stats.tasksByStatus} colors={colors} />
        </div>
        
        <div className="bg-white rounded-lg border p-4" style={{ borderColor: colors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Tasks by Priority
          </h3>
          <PriorityDistribution data={stats.tasksByPriority} colors={colors} />
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  metric: {
    title: string;
    value: string | number;
    change: string;
    trend: 'up' | 'down';
    color: string;
  };
  colors: any;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, colors }) => {
  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        borderColor: colors.border,
        backgroundColor: colors.background
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium" style={{ color: colors.textSecondary }}>
          {metric.title}
        </h4>
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: metric.color }}
        />
      </div>
      
      <div className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
        {metric.value}
      </div>
      
      <div className="flex items-center text-xs">
        <span 
          className={metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}
        >
          {metric.change}
        </span>
        <span className="ml-1" style={{ color: colors.textSecondary }}>
          vs last period
        </span>
      </div>
    </div>
  );
};

// Chart View Component
interface ChartViewProps {
  data: any;
  type: 'bar' | 'line' | 'pie';
  metric: string;
  colors: any;
}

const ChartView: React.FC<ChartViewProps> = ({ data, type, metric, colors }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div style={{ color: colors.textSecondary }}>No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4" style={{ borderColor: colors.border }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
        {metric.charAt(0).toUpperCase() + metric.slice(1)} Distribution
      </h3>
      
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2" style={{ color: colors.textSecondary }}>
            📊
          </div>
          <div style={{ color: colors.textSecondary }}>
            Chart visualization would be rendered here
          </div>
          <div className="text-sm mt-2" style={{ color: colors.textSecondary }}>
            {type.toUpperCase()} Chart - {data.labels.length} data points
          </div>
        </div>
      </div>
    </div>
  );
};

// Burndown Chart Component
interface BurndownChartProps {
  data: any[];
  colors: any;
}

const BurndownChart: React.FC<BurndownChartProps> = ({ data, colors }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div style={{ color: colors.textSecondary }}>No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.remainingTasks, d.completedTasks)));
  const chartHeight = 200;

  return (
    <div className="relative h-48">
      <svg className="w-full h-full" viewBox={`0 0 ${data.length * 40} ${chartHeight}`}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent, i) => (
          <line
            key={i}
            x1="0"
            y1={chartHeight - (percent / 100) * chartHeight}
            x2={data.length * 40}
            y2={chartHeight - (percent / 100) * chartHeight}
            stroke={colors.border}
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}
        
        {/* Remaining tasks line */}
        <polyline
          points={data.map((d, i) => 
            `${i * 40 + 20},${chartHeight - (d.remainingTasks / maxValue) * chartHeight}`
          ).join(' ')}
          fill="none"
          stroke="#dc3545"
          strokeWidth="2"
        />
        
        {/* Completed tasks line */}
        <polyline
          points={data.map((d, i) => 
            `${i * 40 + 20},${chartHeight - (d.completedTasks / maxValue) * chartHeight}`
          ).join(' ')}
          fill="none"
          stroke="#28a745"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={i * 40 + 20}
              cy={chartHeight - (d.remainingTasks / maxValue) * chartHeight}
              r="3"
              fill="#dc3545"
            />
            <circle
              cx={i * 40 + 20}
              cy={chartHeight - (d.completedTasks / maxValue) * chartHeight}
              r="3"
              fill="#28a745"
            />
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-4 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm" style={{ color: colors.textSecondary }}>Remaining</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm" style={{ color: colors.textSecondary }}>Completed</span>
        </div>
      </div>
    </div>
  );
};

// Status Distribution Component
interface StatusDistributionProps {
  data: Record<string, number>;
  colors: any;
}

const StatusDistribution: React.FC<StatusDistributionProps> = ({ data, colors }) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([status, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const statusColors = {
          'todo': '#6c757d',
          'in-progress': '#007bff',
          'review': '#ffc107',
          'done': '#28a745',
          'archived': '#6c757d'
        };
        
        return (
          <div key={status} className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: colors.text }}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span style={{ color: colors.textSecondary }}>
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: statusColors[status as keyof typeof statusColors]
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Priority Distribution Component
interface PriorityDistributionProps {
  data: Record<string, number>;
  colors: any;
}

const PriorityDistribution: React.FC<PriorityDistributionProps> = ({ data, colors }) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const priorityColors = {
    'low': '#28a745',
    'medium': '#ffc107',
    'high': '#fd7e14',
    'urgent': '#dc3545'
  };
  
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([priority, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={priority} className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: priorityColors[priority as keyof typeof priorityColors] }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: colors.text }}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
                <span style={{ color: colors.textSecondary }}>
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="h-2 rounded-full transition-all"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: priorityColors[priority as keyof typeof priorityColors]
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WorkflowAnalytics; 