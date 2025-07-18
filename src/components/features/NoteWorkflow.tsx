import React, { useState, useCallback, useMemo } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { useThemeStore } from '../../store/themeStore';
import { loggingService } from '../../services/loggingService';
import { PerformanceUtils } from '../../services/performanceMonitor';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  estimatedHours?: number;
  actualHours?: number;
  dependencies: string[];
  subtasks: Subtask[];
  attachments: string[];
  comments: TaskComment[];
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

interface WorkflowBoard {
  id: string;
  name: string;
  description: string;
  columns: WorkflowColumn[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  members: string[];
  settings: {
    allowTaskCreation: boolean;
    allowStatusChanges: boolean;
    requireAssignee: boolean;
    autoArchive: boolean;
  };
}

interface WorkflowColumn {
  id: string;
  name: string;
  status: Task['status'];
  color: string;
  maxTasks?: number;
  description?: string;
}

interface NoteWorkflowProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoteWorkflow: React.FC<NoteWorkflowProps> = ({ isOpen, onClose }) => {
  const { notes } = useNoteStore();
  const { colors } = useThemeStore();
  
  const [boards, setBoards] = useState<WorkflowBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<WorkflowBoard | null>(null);
  const [activeTab, setActiveTab] = useState<'boards' | 'tasks' | 'analytics' | 'settings'>('boards');
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dragTask, setDragTask] = useState<Task | null>(null);
  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    columns: [
      { id: 'todo', name: 'To Do', status: 'todo' as const, color: '#6c757d' },
      { id: 'in-progress', name: 'In Progress', status: 'in-progress' as const, color: '#007bff' },
      { id: 'review', name: 'Review', status: 'review' as const, color: '#ffc107' },
      { id: 'done', name: 'Done', status: 'done' as const, color: '#28a745' }
    ]
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    assignee: '',
    dueDate: '',
    tags: [] as string[],
    estimatedHours: 0
  });

  // Initialize default boards
  useMemo(() => {
    const defaultBoards: WorkflowBoard[] = [
      {
        id: 'default-board',
        name: 'Project Management',
        description: 'Main project workflow board',
        columns: [
          { id: 'todo', name: 'To Do', status: 'todo', color: '#6c757d' },
          { id: 'in-progress', name: 'In Progress', status: 'in-progress', color: '#007bff' },
          { id: 'review', name: 'Review', status: 'review', color: '#ffc107' },
          { id: 'done', name: 'Done', status: 'done', color: '#28a745' }
        ],
        tasks: [
          {
            id: 'task-1',
            title: 'Design User Interface',
            description: 'Create wireframes and mockups for the new feature',
            status: 'todo',
            priority: 'high',
            assignee: 'John Doe',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            tags: ['design', 'ui/ux'],
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedHours: 16,
            dependencies: [],
            subtasks: [
              { id: 'sub-1', title: 'Create wireframes', completed: false, createdAt: new Date() },
              { id: 'sub-2', title: 'Design mockups', completed: false, createdAt: new Date() },
              { id: 'sub-3', title: 'Get stakeholder approval', completed: false, createdAt: new Date() }
            ],
            attachments: [],
            comments: []
          },
          {
            id: 'task-2',
            title: 'Implement Backend API',
            description: 'Develop RESTful API endpoints for data management',
            status: 'in-progress',
            priority: 'high',
            assignee: 'Jane Smith',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            tags: ['backend', 'api'],
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedHours: 24,
            dependencies: ['task-1'],
            subtasks: [
              { id: 'sub-4', title: 'Set up database schema', completed: true, createdAt: new Date() },
              { id: 'sub-5', title: 'Create API endpoints', completed: false, createdAt: new Date() },
              { id: 'sub-6', title: 'Add authentication', completed: false, createdAt: new Date() }
            ],
            attachments: [],
            comments: []
          },
          {
            id: 'task-3',
            title: 'Write Documentation',
            description: 'Create comprehensive documentation for the project',
            status: 'review',
            priority: 'medium',
            assignee: 'Mike Johnson',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            tags: ['documentation'],
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedHours: 8,
            dependencies: ['task-2'],
            subtasks: [
              { id: 'sub-7', title: 'Write API documentation', completed: true, createdAt: new Date() },
              { id: 'sub-8', title: 'Create user guide', completed: true, createdAt: new Date() }
            ],
            attachments: [],
            comments: []
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        members: ['John Doe', 'Jane Smith', 'Mike Johnson'],
        settings: {
          allowTaskCreation: true,
          allowStatusChanges: true,
          requireAssignee: false,
          autoArchive: true
        }
      }
    ];

    setBoards(defaultBoards);
    setSelectedBoard(defaultBoards[0]);
  }, []);

  // Create new board
  const createBoard = useCallback(() => {
    if (!newBoard.name.trim()) return;

    const board: WorkflowBoard = {
      id: `board-${Date.now()}`,
      name: newBoard.name.trim(),
      description: newBoard.description.trim(),
      columns: newBoard.columns,
      tasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      settings: {
        allowTaskCreation: true,
        allowStatusChanges: true,
        requireAssignee: false,
        autoArchive: true
      }
    };

    setBoards(prev => [...prev, board]);
    setSelectedBoard(board);
    setNewBoard({
      name: '',
      description: '',
      columns: [
        { id: 'todo', name: 'To Do', status: 'todo', color: '#6c757d' },
        { id: 'in-progress', name: 'In Progress', status: 'in-progress', color: '#007bff' },
        { id: 'review', name: 'Review', status: 'review', color: '#ffc107' },
        { id: 'done', name: 'Done', status: 'done', color: '#28a745' }
      ]
    });
    setShowCreateBoard(false);

    loggingService.info('Workflow board created', { boardId: board.id, name: board.name });
  }, [newBoard]);

  // Create new task
  const createTask = useCallback(() => {
    if (!selectedBoard || !newTask.title.trim()) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: 'todo',
      priority: newTask.priority,
      assignee: newTask.assignee || undefined,
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      tags: newTask.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedHours: newTask.estimatedHours || undefined,
      dependencies: [],
      subtasks: [],
      attachments: [],
      comments: []
    };

    setBoards(prev => prev.map(board =>
      board.id === selectedBoard.id
        ? { ...board, tasks: [...board.tasks, task], updatedAt: new Date() }
        : board
    ));

    setSelectedBoard(prev => prev ? {
      ...prev,
      tasks: [...prev.tasks, task],
      updatedAt: new Date()
    } : null);

    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      tags: [],
      estimatedHours: 0
    });
    setShowCreateTask(false);

    loggingService.info('Task created', { taskId: task.id, boardId: selectedBoard.id });
  }, [selectedBoard, newTask]);

  // Update task status
  const updateTaskStatus = useCallback((taskId: string, newStatus: Task['status']) => {
    if (!selectedBoard) return;

    setBoards(prev => prev.map(board =>
      board.id === selectedBoard.id
        ? {
            ...board,
            tasks: board.tasks.map(task =>
              task.id === taskId
                ? { ...task, status: newStatus, updatedAt: new Date() }
                : task
            ),
            updatedAt: new Date()
          }
        : board
    ));

    setSelectedBoard(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      ),
      updatedAt: new Date()
    } : null);

    loggingService.info('Task status updated', { taskId, newStatus });
  }, [selectedBoard]);

  // Delete task
  const deleteTask = useCallback((taskId: string) => {
    if (!selectedBoard) return;

    if (confirm('Are you sure you want to delete this task?')) {
      setBoards(prev => prev.map(board =>
        board.id === selectedBoard.id
          ? {
              ...board,
              tasks: board.tasks.filter(task => task.id !== taskId),
              updatedAt: new Date()
            }
          : board
      ));

      setSelectedBoard(prev => prev ? {
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== taskId),
        updatedAt: new Date()
      } : null);

      loggingService.info('Task deleted', { taskId });
    }
  }, [selectedBoard]);

  // Add subtask
  const addSubtask = useCallback((taskId: string, title: string) => {
    if (!selectedBoard || !title.trim()) return;

    const subtask: Subtask = {
      id: `sub-${Date.now()}`,
      title: title.trim(),
      completed: false,
      createdAt: new Date()
    };

    setBoards(prev => prev.map(board =>
      board.id === selectedBoard.id
        ? {
            ...board,
            tasks: board.tasks.map(task =>
              task.id === taskId
                ? { ...task, subtasks: [...task.subtasks, subtask], updatedAt: new Date() }
                : task
            ),
            updatedAt: new Date()
          }
        : board
    ));

    setSelectedBoard(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? { ...task, subtasks: [...task.subtasks, subtask], updatedAt: new Date() }
          : task
      ),
      updatedAt: new Date()
    } : null);
  }, [selectedBoard]);

  // Toggle subtask completion
  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    if (!selectedBoard) return;

    setBoards(prev => prev.map(board =>
      board.id === selectedBoard.id
        ? {
            ...board,
            tasks: board.tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: task.subtasks.map(subtask =>
                      subtask.id === subtaskId
                        ? { ...subtask, completed: !subtask.completed }
                        : subtask
                    ),
                    updatedAt: new Date()
                  }
                : task
            ),
            updatedAt: new Date()
          }
        : board
    ));

    setSelectedBoard(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
              updatedAt: new Date()
            }
          : task
      ),
      updatedAt: new Date()
    } : null);
  }, [selectedBoard]);

  // Get tasks by status
  const getTasksByStatus = useCallback((status: Task['status']) => {
    return selectedBoard?.tasks.filter(task => task.status === status) || [];
  }, [selectedBoard]);

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

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate progress
  const calculateProgress = (task: Task): number => {
    if (task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(subtask => subtask.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  };

  // Handle drag start
  const handleDragStart = useCallback((task: Task) => {
    setDragTask(task);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, status: Task['status']) => {
    e.preventDefault();
    if (dragTask && dragTask.status !== status) {
      updateTaskStatus(dragTask.id, status);
    }
    setDragTask(null);
  }, [dragTask, updateTaskStatus]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.overlay,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '1400px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: colors.text }}>Note Workflow</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: colors.textSecondary
            }}
            aria-label="Close workflow panel"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: '24px'
        }}>
          {[
            { value: 'boards', label: 'Boards', icon: '📋' },
            { value: 'tasks', label: 'Tasks', icon: '✅' },
            { value: 'analytics', label: 'Analytics', icon: '📊' },
            { value: 'settings', label: 'Settings', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.value ? colors.primary : 'transparent',
                color: activeTab === tab.value ? 'white' : colors.text,
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === tab.value ? `2px solid ${colors.primary}` : 'none'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Boards Tab */}
        {activeTab === 'boards' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: 0, color: colors.text }}>Workflow Boards</h3>
              <button
                onClick={() => setShowCreateBoard(true)}
                style={{
                  padding: '8px 16px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                + New Board
              </button>
            </div>

            {/* Create Board Form */}
            {showCreateBoard && (
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Create New Board</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input
                    type="text"
                    value={newBoard.name}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Board name"
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text
                    }}
                  />
                  <textarea
                    value={newBoard.description}
                    onChange={(e) => setNewBoard(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Board description"
                    rows={3}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      background: colors.background,
                      color: colors.text,
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowCreateBoard(false);
                        setNewBoard({
                          name: '',
                          description: '',
                          columns: [
                            { id: 'todo', name: 'To Do', status: 'todo', color: '#6c757d' },
                            { id: 'in-progress', name: 'In Progress', status: 'in-progress', color: '#007bff' },
                            { id: 'review', name: 'Review', status: 'review', color: '#ffc107' },
                            { id: 'done', name: 'Done', status: 'done', color: '#28a745' }
                          ]
                        });
                      }}
                      style={{
                        padding: '8px 16px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: colors.text
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createBoard}
                      disabled={!newBoard.name.trim()}
                      style={{
                        padding: '8px 16px',
                        background: colors.primary,
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !newBoard.name.trim() ? 'not-allowed' : 'pointer',
                        opacity: !newBoard.name.trim() ? 0.6 : 1
                      }}
                    >
                      Create Board
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Board Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text }}>
                Select Board:
              </label>
              <select
                value={selectedBoard?.id || ''}
                onChange={(e) => {
                  const board = boards.find(b => b.id === e.target.value);
                  setSelectedBoard(board || null);
                }}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  background: colors.background,
                  color: colors.text,
                  minWidth: '200px'
                }}
              >
                {boards.map(board => (
                  <option key={board.id} value={board.id}>
                    {board.name} ({board.tasks.length} tasks)
                  </option>
                ))}
              </select>
            </div>

            {/* Kanban Board */}
            {selectedBoard && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h4 style={{ margin: 0, color: colors.text }}>{selectedBoard.name}</h4>
                    <p style={{ margin: '4px 0 0 0', color: colors.textSecondary, fontSize: '14px' }}>
                      {selectedBoard.description}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateTask(true)}
                    style={{
                      padding: '6px 12px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    + Add Task
                  </button>
                </div>

                {/* Create Task Form */}
                {showCreateTask && (
                  <div style={{
                    padding: '16px',
                    background: colors.surface,
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h5 style={{ margin: '0 0 12px 0', color: colors.text }}>Create New Task</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Task title"
                        style={{
                          padding: '6px 8px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.background,
                          color: colors.text
                        }}
                      />
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as any }))}
                        style={{
                          padding: '6px 8px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.background,
                          color: colors.text
                        }}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Task description"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '4px',
                        background: colors.background,
                        color: colors.text,
                        marginBottom: '12px',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setShowCreateTask(false);
                          setNewTask({
                            title: '',
                            description: '',
                            priority: 'medium',
                            assignee: '',
                            dueDate: '',
                            tags: [],
                            estimatedHours: 0
                          });
                        }}
                        style={{
                          padding: '4px 8px',
                          background: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: colors.text,
                          fontSize: '12px'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createTask}
                        disabled={!newTask.title.trim()}
                        style={{
                          padding: '4px 8px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: !newTask.title.trim() ? 'not-allowed' : 'pointer',
                          opacity: !newTask.title.trim() ? 0.6 : 1,
                          fontSize: '12px'
                        }}
                      >
                        Create Task
                      </button>
                    </div>
                  </div>
                )}

                {/* Kanban Columns */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px',
                  minHeight: '400px'
                }}>
                  {selectedBoard.columns.map(column => {
                    const columnTasks = getTasksByStatus(column.status);
                    return (
                      <div
                        key={column.id}
                        style={{
                          background: colors.surface,
                          borderRadius: '8px',
                          padding: '16px',
                          minHeight: '400px'
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.status)}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          <h5 style={{ 
                            margin: 0, 
                            color: colors.text,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: column.color
                            }} />
                            {column.name}
                          </h5>
                          <span style={{
                            background: colors.primary,
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            {columnTasks.length}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {columnTasks.map(task => (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              style={{
                                background: colors.background,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '6px',
                                padding: '12px',
                                cursor: 'grab',
                                transition: 'transform 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '8px'
                              }}>
                                <h6 style={{ margin: 0, color: colors.text, fontSize: '14px' }}>
                                  {task.title}
                                </h6>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: getPriorityColor(task.priority)
                                }} />
                              </div>
                              
                              {task.description && (
                                <p style={{
                                  margin: '0 0 8px 0',
                                  color: colors.textSecondary,
                                  fontSize: '12px',
                                  lineHeight: '1.4'
                                }}>
                                  {task.description}
                                </p>
                              )}

                              {task.subtasks.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                  <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: colors.border,
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                  }}>
                                    <div style={{
                                      width: `${calculateProgress(task)}%`,
                                      height: '100%',
                                      background: colors.primary,
                                      transition: 'width 0.3s ease'
                                    }} />
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    color: colors.textSecondary,
                                    marginTop: '4px'
                                  }}>
                                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                                  </div>
                                </div>
                              )}

                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                color: colors.textSecondary
                              }}>
                                <div>
                                  {task.assignee && (
                                    <span style={{ marginRight: '8px' }}>
                                      👤 {task.assignee}
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span>
                                      📅 {formatDate(task.dueDate)}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  style={{
                                    padding: '2px 4px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: colors.textSecondary,
                                    fontSize: '12px'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && selectedBoard && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>All Tasks</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedBoard.tasks.map(task => (
                <div key={task.id} style={{
                  padding: '16px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  background: colors.background
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: colors.text }}>{task.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                        <span style={{
                          padding: '2px 6px',
                          background: selectedBoard.columns.find(c => c.status === task.status)?.color || colors.border,
                          color: 'white',
                          borderRadius: '12px'
                        }}>
                          {task.status}
                        </span>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getPriorityColor(task.priority)
                        }} />
                        {task.assignee && <span>👤 {task.assignee}</span>}
                        {task.dueDate && <span>📅 {formatDate(task.dueDate)}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  
                  {task.description && (
                    <p style={{
                      margin: '0 0 12px 0',
                      color: colors.textSecondary,
                      fontSize: '14px'
                    }}>
                      {task.description}
                    </p>
                  )}

                  {task.subtasks.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
                        Subtasks:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {task.subtasks.map(subtask => (
                          <label key={subtask.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}>
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              onChange={() => toggleSubtask(task.id, subtask.id)}
                            />
                            <span style={{
                              color: subtask.completed ? colors.textSecondary : colors.text,
                              textDecoration: subtask.completed ? 'line-through' : 'none'
                            }}>
                              {subtask.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {task.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '2px 6px',
                        background: colors.surface,
                        color: colors.textSecondary,
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && selectedBoard && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Workflow Analytics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {selectedBoard.tasks.length}
                </div>
                <div style={{ color: colors.textSecondary }}>Total Tasks</div>
              </div>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {selectedBoard.tasks.filter(t => t.status === 'done').length}
                </div>
                <div style={{ color: colors.textSecondary }}>Completed</div>
              </div>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {Math.round((selectedBoard.tasks.filter(t => t.status === 'done').length / selectedBoard.tasks.length) * 100) || 0}%
                </div>
                <div style={{ color: colors.textSecondary }}>Completion Rate</div>
              </div>
              
              <div style={{
                padding: '20px',
                background: colors.surface,
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.primary }}>
                  {selectedBoard.tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length}
                </div>
                <div style={{ color: colors.textSecondary }}>High Priority</div>
              </div>
            </div>

            {/* Status Distribution */}
            <div>
              <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Status Distribution</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {selectedBoard.columns.map(column => {
                  const count = getTasksByStatus(column.status).length;
                  const percentage = selectedBoard.tasks.length > 0 
                    ? Math.round((count / selectedBoard.tasks.length) * 100)
                    : 0;
                  
                  return (
                    <div key={column.id} style={{
                      padding: '12px',
                      background: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: column.color }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {column.name} ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && selectedBoard && (
          <div>
            <h3 style={{ margin: '0 0 20px 0', color: colors.text }}>Board Settings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>General Settings</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedBoard.settings.allowTaskCreation}
                      onChange={(e) => {
                        setSelectedBoard(prev => prev ? {
                          ...prev,
                          settings: { ...prev.settings, allowTaskCreation: e.target.checked }
                        } : null);
                      }}
                    />
                    <span style={{ color: colors.text }}>Allow task creation</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedBoard.settings.allowStatusChanges}
                      onChange={(e) => {
                        setSelectedBoard(prev => prev ? {
                          ...prev,
                          settings: { ...prev.settings, allowStatusChanges: e.target.checked }
                        } : null);
                      }}
                    />
                    <span style={{ color: colors.text }}>Allow status changes</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedBoard.settings.requireAssignee}
                      onChange={(e) => {
                        setSelectedBoard(prev => prev ? {
                          ...prev,
                          settings: { ...prev.settings, requireAssignee: e.target.checked }
                        } : null);
                      }}
                    />
                    <span style={{ color: colors.text }}>Require assignee</span>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedBoard.settings.autoArchive}
                      onChange={(e) => {
                        setSelectedBoard(prev => prev ? {
                          ...prev,
                          settings: { ...prev.settings, autoArchive: e.target.checked }
                        } : null);
                      }}
                    />
                    <span style={{ color: colors.text }}>Auto-archive completed tasks</span>
                  </label>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 16px 0', color: colors.text }}>Board Info</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                      Created
                    </div>
                    <div style={{ color: colors.text }}>
                      {formatDate(selectedBoard.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                      Last Updated
                    </div>
                    <div style={{ color: colors.text }}>
                      {formatDate(selectedBoard.updatedAt)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                      Members
                    </div>
                    <div style={{ color: colors.text }}>
                      {selectedBoard.members.length} members
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteWorkflow; 