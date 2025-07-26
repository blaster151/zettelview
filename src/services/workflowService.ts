export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'archived';
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
  boardId: string;
  columnId: string;
  order: number;
  parentTaskId?: string;
  timeTracking: TimeEntry[];
  customFields: Record<string, any>;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignee?: string;
  estimatedHours?: number;
  actualHours?: number;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
  mentions?: string[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  description: string;
  billable: boolean;
}

export interface WorkflowBoard {
  id: string;
  name: string;
  description: string;
  columns: WorkflowColumn[];
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
  members: BoardMember[];
  settings: BoardSettings;
  templates: WorkflowTemplate[];
  archived: boolean;
  parentBoardId?: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface WorkflowColumn {
  id: string;
  name: string;
  status: Task['status'];
  color: string;
  maxTasks?: number;
  description?: string;
  order: number;
  wipLimit?: number;
  autoAssign?: string;
  rules: ColumnRule[];
}

export interface ColumnRule {
  id: string;
  type: 'auto-assign' | 'auto-move' | 'notification' | 'validation';
  condition: string;
  action: string;
  enabled: boolean;
}

export interface BoardMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: Date;
  permissions: string[];
}

export interface BoardSettings {
  allowTaskCreation: boolean;
  allowStatusChanges: boolean;
  requireAssignee: boolean;
  autoArchive: boolean;
  enableTimeTracking: boolean;
  enableComments: boolean;
  enableAttachments: boolean;
  enableSubtasks: boolean;
  enableDependencies: boolean;
  enableCustomFields: boolean;
  defaultAssignee?: string;
  defaultPriority: Task['priority'];
  autoSaveInterval: number;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskOverdue: boolean;
  mentionInComment: boolean;
  boardUpdates: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  columns: WorkflowColumn[];
  defaultSettings: BoardSettings;
  tags: string[];
  category: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  usageCount: number;
}

export interface WorkflowStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByAssignee: Record<string, number>;
  velocity: number;
  burndownData: BurndownPoint[];
}

export interface BurndownPoint {
  date: Date;
  remainingTasks: number;
  completedTasks: number;
}

export interface WorkflowFilter {
  status?: Task['status'][];
  priority?: Task['priority'][];
  assignee?: string[];
  tags?: string[];
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  createdDate?: {
    from?: Date;
    to?: Date;
  };
  search?: string;
}

class WorkflowService {
  private boards: WorkflowBoard[] = [];
  private templates: WorkflowTemplate[] = [];
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.loadFromStorage();
  }

  // Event System
  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.listeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Board Management
  async createBoard(boardData: Partial<WorkflowBoard>): Promise<WorkflowBoard> {
    const board: WorkflowBoard = {
      id: this.generateId(),
      name: boardData.name || 'New Board',
      description: boardData.description || '',
      columns: boardData.columns || this.getDefaultColumns(),
      tasks: boardData.tasks || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      members: boardData.members || [],
      settings: {
        ...this.getDefaultSettings(),
        ...boardData.settings
      },
      templates: boardData.templates || [],
      archived: false,
      tags: boardData.tags || [],
      customFields: boardData.customFields || {}
    };

    this.boards.push(board);
    this.saveToStorage();
    this.emit('boardCreated', board);
    return board;
  }

  async updateBoard(boardId: string, updates: Partial<WorkflowBoard>): Promise<WorkflowBoard> {
    const boardIndex = this.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) {
      throw new Error('Board not found');
    }

    const updatedBoard = {
      ...this.boards[boardIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.boards[boardIndex] = updatedBoard;
    this.saveToStorage();
    this.emit('boardUpdated', updatedBoard);
    return updatedBoard;
  }

  async deleteBoard(boardId: string): Promise<void> {
    const boardIndex = this.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) {
      throw new Error('Board not found');
    }

    this.boards.splice(boardIndex, 1);
    this.saveToStorage();
    this.emit('boardDeleted', boardId);
  }

  async archiveBoard(boardId: string): Promise<WorkflowBoard> {
    return this.updateBoard(boardId, { archived: true });
  }

  async getBoard(boardId: string): Promise<WorkflowBoard | null> {
    return this.boards.find(b => b.id === boardId) || null;
  }

  async getAllBoards(): Promise<WorkflowBoard[]> {
    return this.boards.filter(b => !b.archived);
  }

  async getArchivedBoards(): Promise<WorkflowBoard[]> {
    return this.boards.filter(b => b.archived);
  }

  // Task Management
  async createTask(boardId: string, taskData: Partial<Task>): Promise<Task> {
    const board = await this.getBoard(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const task: Task = {
      id: this.generateId(),
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || board.settings.defaultPriority,
      assignee: taskData.assignee || board.settings.defaultAssignee,
      dueDate: taskData.dueDate,
      tags: taskData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedHours: taskData.estimatedHours,
      actualHours: taskData.actualHours,
      dependencies: taskData.dependencies || [],
      subtasks: taskData.subtasks || [],
      attachments: taskData.attachments || [],
      comments: taskData.comments || [],
      boardId,
      columnId: taskData.columnId || board.columns[0].id,
      order: this.getNextTaskOrder(boardId, taskData.columnId || board.columns[0].id),
      parentTaskId: taskData.parentTaskId,
      timeTracking: taskData.timeTracking || [],
      customFields: taskData.customFields || {}
    };

    board.tasks.push(task);
    board.updatedAt = new Date();
    this.saveToStorage();
    this.emit('taskCreated', task);
    return task;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const board = this.boards.find(b => b.tasks.some(t => t.id === taskId));
    if (!board) {
      throw new Error('Task not found');
    }

    const taskIndex = board.tasks.findIndex(t => t.id === taskId);
    const updatedTask = {
      ...board.tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };

    board.tasks[taskIndex] = updatedTask;
    board.updatedAt = new Date();
    this.saveToStorage();
    this.emit('taskUpdated', updatedTask);
    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<void> {
    const board = this.boards.find(b => b.tasks.some(t => t.id === taskId));
    if (!board) {
      throw new Error('Task not found');
    }

    const taskIndex = board.tasks.findIndex(t => t.id === taskId);
    board.tasks.splice(taskIndex, 1);
    board.updatedAt = new Date();
    this.saveToStorage();
    this.emit('taskDeleted', taskId);
  }

  async moveTask(taskId: string, newColumnId: string, newOrder?: number): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const updates: Partial<Task> = {
      columnId: newColumnId,
      status: this.getStatusFromColumnId(newColumnId)
    };

    if (newOrder !== undefined) {
      updates.order = newOrder;
    }

    return this.updateTask(taskId, updates);
  }

  async getTask(taskId: string): Promise<Task | null> {
    for (const board of this.boards) {
      const task = board.tasks.find(t => t.id === taskId);
      if (task) return task;
    }
    return null;
  }

  async getTasksByBoard(boardId: string, filter?: WorkflowFilter): Promise<Task[]> {
    const board = await this.getBoard(boardId);
    if (!board) return [];

    let tasks = board.tasks;

    if (filter) {
      tasks = this.filterTasks(tasks, filter);
    }

    return tasks.sort((a, b) => a.order - b.order);
  }

  async getTasksByAssignee(assignee: string): Promise<Task[]> {
    const tasks: Task[] = [];
    for (const board of this.boards) {
      tasks.push(...board.tasks.filter(t => t.assignee === assignee));
    }
    return tasks;
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date();
    const tasks: Task[] = [];
    
    for (const board of this.boards) {
      tasks.push(...board.tasks.filter(t => 
        t.dueDate && t.dueDate < now && t.status !== 'done' && t.status !== 'archived'
      ));
    }
    
    return tasks;
  }

  // Subtask Management
  async addSubtask(taskId: string, subtaskData: Partial<Subtask>): Promise<Subtask> {
    const subtask: Subtask = {
      id: this.generateId(),
      title: subtaskData.title || 'New Subtask',
      completed: subtaskData.completed || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignee: subtaskData.assignee,
      estimatedHours: subtaskData.estimatedHours,
      actualHours: subtaskData.actualHours
    };

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.subtasks.push(subtask);
    task.updatedAt = new Date();
    this.saveToStorage();
    this.emit('subtaskAdded', { taskId, subtask });
    return subtask;
  }

  async updateSubtask(taskId: string, subtaskId: string, updates: Partial<Subtask>): Promise<Subtask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId);
    if (subtaskIndex === -1) {
      throw new Error('Subtask not found');
    }

    const updatedSubtask = {
      ...task.subtasks[subtaskIndex],
      ...updates,
      updatedAt: new Date()
    };

    task.subtasks[subtaskIndex] = updatedSubtask;
    task.updatedAt = new Date();
    this.saveToStorage();
    this.emit('subtaskUpdated', { taskId, subtask: updatedSubtask });
    return updatedSubtask;
  }

  // Comment Management
  async addComment(taskId: string, commentData: Partial<TaskComment>): Promise<TaskComment> {
    const comment: TaskComment = {
      id: this.generateId(),
      userId: commentData.userId || 'current-user',
      userName: commentData.userName || 'Current User',
      content: commentData.content || '',
      timestamp: new Date(),
      attachments: commentData.attachments || [],
      mentions: commentData.mentions || []
    };

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.comments.push(comment);
    task.updatedAt = new Date();
    this.saveToStorage();
    this.emit('commentAdded', { taskId, comment });
    return comment;
  }

  // Time Tracking
  async startTimeTracking(taskId: string, userId: string, description: string): Promise<TimeEntry> {
    const timeEntry: TimeEntry = {
      id: this.generateId(),
      userId,
      startTime: new Date(),
      description,
      billable: true
    };

    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.timeTracking.push(timeEntry);
    task.updatedAt = new Date();
    this.saveToStorage();
    this.emit('timeTrackingStarted', { taskId, timeEntry });
    return timeEntry;
  }

  async stopTimeTracking(taskId: string, timeEntryId: string): Promise<TimeEntry> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const timeEntryIndex = task.timeTracking.findIndex(t => t.id === timeEntryId);
    if (timeEntryIndex === -1) {
      throw new Error('Time entry not found');
    }

    task.timeTracking[timeEntryIndex].endTime = new Date();
    task.updatedAt = new Date();
    this.saveToStorage();
    this.emit('timeTrackingStopped', { taskId, timeEntry: task.timeTracking[timeEntryIndex] });
    return task.timeTracking[timeEntryIndex];
  }

  // Analytics and Statistics
  async getBoardStats(boardId: string): Promise<WorkflowStats> {
    const board = await this.getBoard(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    const tasks = board.tasks;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const overdueTasks = tasks.filter(t => 
      t.dueDate && t.dueDate < new Date() && t.status !== 'done' && t.status !== 'archived'
    ).length;

    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tasksByAssignee = tasks.reduce((acc, task) => {
      if (task.assignee) {
        acc[task.assignee] = (acc[task.assignee] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate average completion time
    const completedTaskTimes = tasks
      .filter(t => t.status === 'done')
      .map(t => t.updatedAt.getTime() - t.createdAt.getTime());
    
    const averageCompletionTime = completedTaskTimes.length > 0 
      ? completedTaskTimes.reduce((sum, time) => sum + time, 0) / completedTaskTimes.length 
      : 0;

    // Generate burndown data (last 30 days)
    const burndownData: BurndownPoint[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      
      const tasksCreatedBefore = tasks.filter(t => t.createdAt <= date);
      const tasksCompletedBefore = tasks.filter(t => 
        t.status === 'done' && t.updatedAt <= date
      );

      burndownData.push({
        date,
        remainingTasks: tasksCreatedBefore.length - tasksCompletedBefore.length,
        completedTasks: tasksCompletedBefore.length
      });
    }

    return {
      totalTasks: tasks.length,
      completedTasks,
      overdueTasks,
      averageCompletionTime,
      tasksByStatus,
      tasksByPriority,
      tasksByAssignee,
      velocity: completedTasks / 30, // tasks per day over last 30 days
      burndownData
    };
  }

  // Template Management
  async createTemplate(templateData: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const template: WorkflowTemplate = {
      id: this.generateId(),
      name: templateData.name || 'New Template',
      description: templateData.description || '',
      columns: templateData.columns || this.getDefaultColumns(),
      defaultSettings: templateData.defaultSettings || this.getDefaultSettings(),
      tags: templateData.tags || [],
      category: templateData.category || 'General',
      isPublic: templateData.isPublic || false,
      createdBy: templateData.createdBy || 'current-user',
      createdAt: new Date(),
      usageCount: 0
    };

    this.templates.push(template);
    this.saveToStorage();
    this.emit('templateCreated', template);
    return template;
  }

  async getTemplates(category?: string): Promise<WorkflowTemplate[]> {
    let templates = this.templates;
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    return templates;
  }

  async useTemplate(templateId: string, boardData: Partial<WorkflowBoard>): Promise<WorkflowBoard> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    template.usageCount++;
    this.saveToStorage();

    return this.createBoard({
      ...boardData,
      columns: template.columns,
      settings: template.defaultSettings
    });
  }

  // Utility Methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getDefaultColumns(): WorkflowColumn[] {
    return [
      { id: 'todo', name: 'To Do', status: 'todo', color: '#6c757d', order: 0, rules: [] },
      { id: 'in-progress', name: 'In Progress', status: 'in-progress', color: '#007bff', order: 1, rules: [] },
      { id: 'review', name: 'Review', status: 'review', color: '#ffc107', order: 2, rules: [] },
      { id: 'done', name: 'Done', status: 'done', color: '#28a745', order: 3, rules: [] }
    ];
  }

  private getDefaultSettings(): BoardSettings {
    return {
      allowTaskCreation: true,
      allowStatusChanges: true,
      requireAssignee: false,
      autoArchive: true,
      enableTimeTracking: true,
      enableComments: true,
      enableAttachments: true,
      enableSubtasks: true,
      enableDependencies: true,
      enableCustomFields: false,
      defaultPriority: 'medium',
      autoSaveInterval: 30000,
      notificationSettings: {
        taskAssigned: true,
        taskCompleted: true,
        taskOverdue: true,
        mentionInComment: true,
        boardUpdates: true,
        emailNotifications: false,
        pushNotifications: true
      }
    };
  }

  private getStatusFromColumnId(columnId: string): Task['status'] {
    const column = this.boards
      .flatMap(b => b.columns)
      .find(c => c.id === columnId);
    return column?.status || 'todo';
  }

  private getNextTaskOrder(boardId: string, columnId: string): number {
    const board = this.boards.find(b => b.id === boardId);
    if (!board) return 0;

    const columnTasks = board.tasks.filter(t => t.columnId === columnId);
    if (columnTasks.length === 0) return 0;

    return Math.max(...columnTasks.map(t => t.order)) + 1;
  }

  private filterTasks(tasks: Task[], filter: WorkflowFilter): Task[] {
    return tasks.filter(task => {
      if (filter.status && !filter.status.includes(task.status)) return false;
      if (filter.priority && !filter.priority.includes(task.priority)) return false;
      if (filter.assignee && !filter.assignee.includes(task.assignee || '')) return false;
      if (filter.tags && !filter.tags.some(tag => task.tags.includes(tag))) return false;
      
      if (filter.dueDate) {
        if (filter.dueDate.from && (!task.dueDate || task.dueDate < filter.dueDate.from)) return false;
        if (filter.dueDate.to && (!task.dueDate || task.dueDate > filter.dueDate.to)) return false;
      }
      
      if (filter.createdDate) {
        if (filter.createdDate.from && task.createdAt < filter.createdDate.from) return false;
        if (filter.createdDate.to && task.createdAt > filter.createdDate.to) return false;
      }
      
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(searchLower);
        const matchesDescription = task.description.toLowerCase().includes(searchLower);
        const matchesTags = task.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesTitle && !matchesDescription && !matchesTags) return false;
      }
      
      return true;
    });
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: WorkflowTemplate[] = [
      {
        id: 'kanban-template',
        name: 'Kanban Board',
        description: 'Classic Kanban workflow with To Do, In Progress, Review, and Done columns',
        columns: this.getDefaultColumns(),
        defaultSettings: this.getDefaultSettings(),
        tags: ['kanban', 'agile', 'workflow'],
        category: 'Agile',
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        usageCount: 0
      },
      {
        id: 'scrum-template',
        name: 'Scrum Board',
        description: 'Scrum workflow with Sprint Backlog, In Progress, Testing, and Done',
        columns: [
          { id: 'backlog', name: 'Sprint Backlog', status: 'todo', color: '#6c757d', order: 0, rules: [] },
          { id: 'in-progress', name: 'In Progress', status: 'in-progress', color: '#007bff', order: 1, rules: [] },
          { id: 'testing', name: 'Testing', status: 'review', color: '#ffc107', order: 2, rules: [] },
          { id: 'done', name: 'Done', status: 'done', color: '#28a745', order: 3, rules: [] }
        ],
        defaultSettings: {
          ...this.getDefaultSettings(),
          requireAssignee: true,
          enableTimeTracking: true
        },
        tags: ['scrum', 'agile', 'sprint'],
        category: 'Agile',
        isPublic: true,
        createdBy: 'system',
        createdAt: new Date(),
        usageCount: 0
      }
    ];

    this.templates = defaultTemplates;
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('zettelview-workflows', JSON.stringify({
        boards: this.boards,
        templates: this.templates
      }));
    } catch (error) {
      console.error('Failed to save workflows to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('zettelview-workflows');
      if (stored) {
        const data = JSON.parse(stored);
        this.boards = data.boards || [];
        this.templates = data.templates || this.templates;
      }
    } catch (error) {
      console.error('Failed to load workflows from storage:', error);
    }
  }
}

export const workflowService = new WorkflowService(); 