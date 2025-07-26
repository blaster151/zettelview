import React, { useState, useCallback, useMemo } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';
import { useThemeStore } from '../store/themeStore';
import { cn } from '../lib/utils';
import { Task, WorkflowColumn } from '../services/workflowService';

interface WorkflowBoardProps {
  boardId: string;
  className?: string;
  onTaskSelect?: (task: Task) => void;
  onTaskMove?: (taskId: string, newColumnId: string) => void;
  showStats?: boolean;
  compact?: boolean;
}

const WorkflowBoard: React.FC<WorkflowBoardProps> = ({
  boardId,
  className,
  onTaskSelect,
  onTaskMove,
  showStats = true,
  compact = false
}) => {
  const { 
    selectedBoard, 
    tasks, 
    moveTask, 
    isLoading, 
    error,
    stats,
    getBoardStats 
  } = useWorkflow();
  const { colors } = useThemeStore();
  
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState<string | null>(null);

  // Load board stats when component mounts
  React.useEffect(() => {
    if (showStats && boardId) {
      getBoardStats(boardId);
    }
  }, [boardId, showStats, getBoardStats]);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    if (!selectedBoard) return {};
    
    const grouped: Record<string, Task[]> = {};
    selectedBoard.columns.forEach(column => {
      grouped[column.id] = tasks.filter(task => task.columnId === column.id);
    });
    
    return grouped;
  }, [selectedBoard, tasks]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask && draggedTask.columnId !== columnId) {
      try {
        await moveTask(draggedTask.id, columnId);
        onTaskMove?.(draggedTask.id, columnId);
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
    
    setDraggedTask(null);
  }, [draggedTask, moveTask, onTaskMove]);

  // Handle task click
  const handleTaskClick = useCallback((task: Task) => {
    onTaskSelect?.(task);
    setShowTaskDetails(task.id);
  }, [onTaskSelect]);

  // Get priority color
  const getPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return colors.textSecondary;
    }
  };

  // Get status color
  const getStatusColor = (status: Task['status']): string => {
    switch (status) {
      case 'todo': return '#6c757d';
      case 'in-progress': return '#007bff';
      case 'review': return '#ffc107';
      case 'done': return '#28a745';
      case 'archived': return '#6c757d';
      default: return colors.textSecondary;
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Calculate progress
  const calculateProgress = (task: Task): number => {
    if (task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

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
          <div className="text-red-500 mb-2">Error loading board</div>
          <div className="text-sm" style={{ color: colors.textSecondary }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!selectedBoard) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div style={{ color: colors.textSecondary }}>Board not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Board Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.border }}>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
            {selectedBoard.name}
          </h2>
          {selectedBoard.description && (
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              {selectedBoard.description}
            </p>
          )}
        </div>
        
        {showStats && stats && (
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-semibold" style={{ color: colors.text }}>
                {stats.totalTasks}
              </div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold" style={{ color: colors.text }}>
                {stats.completedTasks}
              </div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold" style={{ color: colors.text }}>
                {stats.overdueTasks}
              </div>
              <div className="text-xs" style={{ color: colors.textSecondary }}>Overdue</div>
            </div>
          </div>
        )}
      </div>

      {/* Board Content */}
      <div className="flex-1 flex overflow-x-auto p-4 space-x-4">
        {selectedBoard.columns.map((column) => {
          const columnTasks = tasksByColumn[column.id] || [];
          const isDragOver = dragOverColumn === column.id;
          const isOverLimit = column.wipLimit && columnTasks.length > column.wipLimit;

          return (
            <div
              key={column.id}
              className={cn(
                'flex-shrink-0 w-80 flex flex-col',
                compact ? 'w-64' : 'w-80'
              )}
            >
              {/* Column Header */}
              <div 
                className={cn(
                  'flex items-center justify-between p-3 rounded-t-lg border-b',
                  isDragOver && 'ring-2 ring-blue-500'
                )}
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: column.color + '10'
                }}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-medium" style={{ color: colors.text }}>
                    {column.name}
                  </h3>
                  <span 
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ 
                      backgroundColor: colors.surface,
                      color: colors.textSecondary
                    }}
                  >
                    {columnTasks.length}
                    {column.wipLimit && `/${column.wipLimit}`}
                  </span>
                </div>
                
                {isOverLimit && (
                  <div className="text-xs text-red-500 font-medium">
                    Over Limit
                  </div>
                )}
              </div>

              {/* Column Content */}
              <div
                className={cn(
                  'flex-1 p-2 rounded-b-lg border-2 border-dashed transition-colors',
                  isDragOver ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                )}
                style={{ backgroundColor: colors.surface }}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      compact={compact}
                      isSelected={showTaskDetails === task.id}
                      onDragStart={handleDragStart}
                      onClick={handleTaskClick}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                      formatDate={formatDate}
                      calculateProgress={calculateProgress}
                      colors={colors}
                    />
                  ))}
                  
                  {columnTasks.length === 0 && (
                    <div 
                      className="text-center py-8 text-sm"
                      style={{ color: colors.textSecondary }}
                    >
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  compact: boolean;
  isSelected: boolean;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onClick: (task: Task) => void;
  getPriorityColor: (priority: Task['priority']) => string;
  getStatusColor: (status: Task['status']) => string;
  formatDate: (date: Date) => string;
  calculateProgress: (task: Task) => number;
  colors: any;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  compact,
  isSelected,
  onDragStart,
  onClick,
  getPriorityColor,
  getStatusColor,
  formatDate,
  calculateProgress,
  colors
}) => {
  const progress = calculateProgress(task);
  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== 'done';

  return (
    <div
      draggable
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500',
        isOverdue && 'border-red-300 bg-red-50'
      )}
      style={{ 
        borderColor: colors.border,
        backgroundColor: colors.background
      }}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 
          className={cn(
            'font-medium text-sm leading-tight',
            compact ? 'line-clamp-2' : 'line-clamp-3'
          )}
          style={{ color: colors.text }}
        >
          {task.title}
        </h4>
        
        <div className="flex items-center space-x-1 ml-2">
          {/* Priority Indicator */}
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          />
          
          {/* Subtasks Indicator */}
          {task.subtasks.length > 0 && (
            <div className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: colors.surface }}>
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </div>
          )}
        </div>
      </div>

      {/* Task Description */}
      {!compact && task.description && (
        <p 
          className="text-xs mb-2 line-clamp-2"
          style={{ color: colors.textSecondary }}
        >
          {task.description}
        </p>
      )}

      {/* Progress Bar */}
      {task.subtasks.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: colors.textSecondary }}>Progress</span>
            <span style={{ color: colors.textSecondary }}>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="h-1 rounded-full transition-all"
              style={{ 
                width: `${progress}%`,
                backgroundColor: getStatusColor(task.status)
              }}
            />
          </div>
        </div>
      )}

      {/* Task Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {/* Assignee */}
          {task.assignee && (
            <div 
              className="px-2 py-1 rounded"
              style={{ backgroundColor: colors.surface }}
            >
              {task.assignee}
            </div>
          )}
          
          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <span 
                  key={index}
                  className="px-1 py-0.5 rounded text-xs"
                  style={{ 
                    backgroundColor: colors.primary + '20',
                    color: colors.primary
                  }}
                >
                  {tag}
                </span>
              ))}
              {task.tags.length > 2 && (
                <span style={{ color: colors.textSecondary }}>
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Due Date */}
        {task.dueDate && (
          <div 
            className={cn(
              'text-xs',
              isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'
            )}
          >
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>

      {/* Time Tracking */}
      {task.timeTracking.length > 0 && !compact && (
        <div className="mt-2 pt-2 border-t" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: colors.textSecondary }}>Time</span>
            <span style={{ color: colors.textSecondary }}>
              {task.actualHours || 0}h / {task.estimatedHours || 0}h
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBoard; 