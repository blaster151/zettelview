import { useState, useEffect, useCallback } from 'react';
import { 
  workflowService, 
  WorkflowBoard, 
  Task, 
  Subtask, 
  TaskComment, 
  WorkflowTemplate, 
  WorkflowStats, 
  WorkflowFilter,
  TimeEntry 
} from '../services/workflowService';

export interface UseWorkflowReturn {
  // Boards
  boards: WorkflowBoard[];
  selectedBoard: WorkflowBoard | null;
  createBoard: (boardData: Partial<WorkflowBoard>) => Promise<WorkflowBoard>;
  updateBoard: (boardId: string, updates: Partial<WorkflowBoard>) => Promise<WorkflowBoard>;
  deleteBoard: (boardId: string) => Promise<void>;
  archiveBoard: (boardId: string) => Promise<WorkflowBoard>;
  selectBoard: (boardId: string) => Promise<void>;
  
  // Tasks
  tasks: Task[];
  selectedTask: Task | null;
  createTask: (boardId: string, taskData: Partial<Task>) => Promise<Task>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, newColumnId: string, newOrder?: number) => Promise<Task>;
  selectTask: (taskId: string) => Promise<void>;
  getTasksByBoard: (boardId: string, filter?: WorkflowFilter) => Promise<Task[]>;
  getTasksByAssignee: (assignee: string) => Promise<Task[]>;
  getOverdueTasks: () => Promise<Task[]>;
  
  // Subtasks
  addSubtask: (taskId: string, subtaskData: Partial<Subtask>) => Promise<Subtask>;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => Promise<Subtask>;
  
  // Comments
  addComment: (taskId: string, commentData: Partial<TaskComment>) => Promise<TaskComment>;
  
  // Time Tracking
  startTimeTracking: (taskId: string, userId: string, description: string) => Promise<TimeEntry>;
  stopTimeTracking: (taskId: string, timeEntryId: string) => Promise<TimeEntry>;
  
  // Templates
  templates: WorkflowTemplate[];
  createTemplate: (templateData: Partial<WorkflowTemplate>) => Promise<WorkflowTemplate>;
  getTemplates: (category?: string) => Promise<WorkflowTemplate[]>;
  useTemplate: (templateId: string, boardData: Partial<WorkflowBoard>) => Promise<WorkflowBoard>;
  
  // Analytics
  stats: WorkflowStats | null;
  getBoardStats: (boardId: string) => Promise<WorkflowStats>;
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error Handling
  error: string | null;
  clearError: () => void;
}

export function useWorkflow(): UseWorkflowReturn {
  const [boards, setBoards] = useState<WorkflowBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<WorkflowBoard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [stats, setStats] = useState<WorkflowStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadBoards();
    loadTemplates();
  }, []);

  // Event listeners
  useEffect(() => {
    const handleBoardCreated = (board: WorkflowBoard) => {
      setBoards(prev => [...prev, board]);
    };

    const handleBoardUpdated = (board: WorkflowBoard) => {
      setBoards(prev => prev.map(b => b.id === board.id ? board : b));
      if (selectedBoard?.id === board.id) {
        setSelectedBoard(board);
      }
    };

    const handleBoardDeleted = (boardId: string) => {
      setBoards(prev => prev.filter(b => b.id !== boardId));
      if (selectedBoard?.id === boardId) {
        setSelectedBoard(null);
      }
    };

    const handleTaskCreated = (task: Task) => {
      setTasks(prev => [...prev, task]);
    };

    const handleTaskUpdated = (task: Task) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      if (selectedTask?.id === task.id) {
        setSelectedTask(task);
      }
    };

    const handleTaskDeleted = (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
    };

    const handleTemplateCreated = (template: WorkflowTemplate) => {
      setTemplates(prev => [...prev, template]);
    };

    // Subscribe to events
    workflowService.on('boardCreated', handleBoardCreated);
    workflowService.on('boardUpdated', handleBoardUpdated);
    workflowService.on('boardDeleted', handleBoardDeleted);
    workflowService.on('taskCreated', handleTaskCreated);
    workflowService.on('taskUpdated', handleTaskUpdated);
    workflowService.on('taskDeleted', handleTaskDeleted);
    workflowService.on('templateCreated', handleTemplateCreated);

    return () => {
      workflowService.off('boardCreated', handleBoardCreated);
      workflowService.off('boardUpdated', handleBoardUpdated);
      workflowService.off('boardDeleted', handleBoardDeleted);
      workflowService.off('taskCreated', handleTaskCreated);
      workflowService.off('taskUpdated', handleTaskUpdated);
      workflowService.off('taskDeleted', handleTaskDeleted);
      workflowService.off('templateCreated', handleTemplateCreated);
    };
  }, [selectedBoard, selectedTask]);

  const loadBoards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allBoards = await workflowService.getAllBoards();
      setBoards(allBoards);
      if (allBoards.length > 0 && !selectedBoard) {
        setSelectedBoard(allBoards[0]);
        await loadTasks(allBoards[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBoard]);

  const loadTemplates = useCallback(async () => {
    try {
      const allTemplates = await workflowService.getTemplates();
      setTemplates(allTemplates);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, []);

  const loadTasks = useCallback(async (boardId: string) => {
    try {
      const boardTasks = await workflowService.getTasksByBoard(boardId);
      setTasks(boardTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
  }, []);

  // Board operations
  const createBoard = useCallback(async (boardData: Partial<WorkflowBoard>): Promise<WorkflowBoard> => {
    setIsCreating(true);
    setError(null);
    try {
      const board = await workflowService.createBoard(boardData);
      return board;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateBoard = useCallback(async (boardId: string, updates: Partial<WorkflowBoard>): Promise<WorkflowBoard> => {
    setIsUpdating(true);
    setError(null);
    try {
      const board = await workflowService.updateBoard(boardId, updates);
      return board;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteBoard = useCallback(async (boardId: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      await workflowService.deleteBoard(boardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const archiveBoard = useCallback(async (boardId: string): Promise<WorkflowBoard> => {
    setIsUpdating(true);
    setError(null);
    try {
      const board = await workflowService.archiveBoard(boardId);
      return board;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive board');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const selectBoard = useCallback(async (boardId: string): Promise<void> => {
    try {
      const board = await workflowService.getBoard(boardId);
      if (board) {
        setSelectedBoard(board);
        await loadTasks(boardId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select board');
    }
  }, []);

  // Task operations
  const createTask = useCallback(async (boardId: string, taskData: Partial<Task>): Promise<Task> => {
    setIsCreating(true);
    setError(null);
    try {
      const task = await workflowService.createTask(boardId, taskData);
      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    setIsUpdating(true);
    setError(null);
    try {
      const task = await workflowService.updateTask(taskId, updates);
      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      await workflowService.deleteTask(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, newColumnId: string, newOrder?: number): Promise<Task> => {
    setIsUpdating(true);
    setError(null);
    try {
      const task = await workflowService.moveTask(taskId, newColumnId, newOrder);
      return task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const selectTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      const task = await workflowService.getTask(taskId);
      setSelectedTask(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select task');
    }
  }, []);

  const getTasksByBoard = useCallback(async (boardId: string, filter?: WorkflowFilter): Promise<Task[]> => {
    try {
      return await workflowService.getTasksByBoard(boardId, filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get tasks');
      return [];
    }
  }, []);

  const getTasksByAssignee = useCallback(async (assignee: string): Promise<Task[]> => {
    try {
      return await workflowService.getTasksByAssignee(assignee);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get tasks by assignee');
      return [];
    }
  }, []);

  const getOverdueTasks = useCallback(async (): Promise<Task[]> => {
    try {
      return await workflowService.getOverdueTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get overdue tasks');
      return [];
    }
  }, []);

  // Subtask operations
  const addSubtask = useCallback(async (taskId: string, subtaskData: Partial<Subtask>): Promise<Subtask> => {
    setIsCreating(true);
    setError(null);
    try {
      const subtask = await workflowService.addSubtask(taskId, subtaskData);
      return subtask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subtask');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateSubtask = useCallback(async (taskId: string, subtaskId: string, updates: Partial<Subtask>): Promise<Subtask> => {
    setIsUpdating(true);
    setError(null);
    try {
      const subtask = await workflowService.updateSubtask(taskId, subtaskId, updates);
      return subtask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subtask');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Comment operations
  const addComment = useCallback(async (taskId: string, commentData: Partial<TaskComment>): Promise<TaskComment> => {
    setIsCreating(true);
    setError(null);
    try {
      const comment = await workflowService.addComment(taskId, commentData);
      return comment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Time tracking operations
  const startTimeTracking = useCallback(async (taskId: string, userId: string, description: string): Promise<TimeEntry> => {
    setIsUpdating(true);
    setError(null);
    try {
      const timeEntry = await workflowService.startTimeTracking(taskId, userId, description);
      return timeEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start time tracking');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const stopTimeTracking = useCallback(async (taskId: string, timeEntryId: string): Promise<TimeEntry> => {
    setIsUpdating(true);
    setError(null);
    try {
      const timeEntry = await workflowService.stopTimeTracking(taskId, timeEntryId);
      return timeEntry;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop time tracking');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Template operations
  const createTemplate = useCallback(async (templateData: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> => {
    setIsCreating(true);
    setError(null);
    try {
      const template = await workflowService.createTemplate(templateData);
      return template;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const getTemplates = useCallback(async (category?: string): Promise<WorkflowTemplate[]> => {
    try {
      return await workflowService.getTemplates(category);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get templates');
      return [];
    }
  }, []);

  const useTemplate = useCallback(async (templateId: string, boardData: Partial<WorkflowBoard>): Promise<WorkflowBoard> => {
    setIsCreating(true);
    setError(null);
    try {
      const board = await workflowService.useTemplate(templateId, boardData);
      return board;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to use template');
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, []);

  // Analytics operations
  const getBoardStats = useCallback(async (boardId: string): Promise<WorkflowStats> => {
    setIsLoading(true);
    setError(null);
    try {
      const boardStats = await workflowService.getBoardStats(boardId);
      setStats(boardStats);
      return boardStats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get board stats');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Boards
    boards,
    selectedBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
    selectBoard,
    
    // Tasks
    tasks,
    selectedTask,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    selectTask,
    getTasksByBoard,
    getTasksByAssignee,
    getOverdueTasks,
    
    // Subtasks
    addSubtask,
    updateSubtask,
    
    // Comments
    addComment,
    
    // Time Tracking
    startTimeTracking,
    stopTimeTracking,
    
    // Templates
    templates,
    createTemplate,
    getTemplates,
    useTemplate,
    
    // Analytics
    stats,
    getBoardStats,
    
    // Loading States
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error Handling
    error,
    clearError
  };
} 