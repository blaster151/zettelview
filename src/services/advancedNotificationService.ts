import { Note } from '../types/note';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'collaboration' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  groupId?: string;
  userId?: string;
  source?: 'system' | 'user' | 'collaboration' | 'ai';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: Notification['type'];
  title: string;
  message: string;
  priority: Notification['priority'];
  category: string;
  variables: string[];
  isDefault: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    [category: string]: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

export interface NotificationSchedule {
  id: string;
  notification: Omit<Notification, 'id' | 'timestamp'>;
  schedule: {
    type: 'once' | 'recurring' | 'interval';
    datetime?: Date;
    interval?: number; // minutes
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    timeOfDay?: string; // HH:MM
  };
  active: boolean;
}

export interface NotificationGroup {
  id: string;
  title: string;
  notifications: Notification[];
  unreadCount: number;
  timestamp: Date;
  category: string;
}

export class AdvancedNotificationService {
  private notifications: Notification[] = [];
  private templates: NotificationTemplate[] = [];
  private schedules: NotificationSchedule[] = [];
  private preferences: NotificationPreferences = {
    email: true,
    push: true,
    inApp: true,
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {}
  };
  private listeners: Map<string, (notification: Notification) => void> = new Map();
  private scheduledTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.loadPreferences();
    this.startScheduleProcessor();
  }

  // Core Notification Methods
  createNotification(data: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const notification: Notification = {
      ...data,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(notification);
    this.emitNotification(notification);
    this.deliverNotification(notification);
    this.saveNotifications();

    return notification;
  }

  createNotificationFromTemplate(
    templateId: string,
    variables: Record<string, any> = {},
    overrides: Partial<Notification> = {}
  ): Notification {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let title = template.title;
    let message = template.message;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      title = title.replace(regex, String(value));
      message = message.replace(regex, String(value));
    });

    return this.createNotification({
      type: template.type,
      title,
      message,
      priority: template.priority,
      category: template.category,
      ...overrides
    });
  }

  // Quick Notification Methods
  info(title: string, message: string, options: Partial<Notification> = {}): Notification {
    return this.createNotification({
      type: 'info',
      title,
      message,
      priority: 'low',
      category: 'general',
      ...options
    });
  }

  success(title: string, message: string, options: Partial<Notification> = {}): Notification {
    return this.createNotification({
      type: 'success',
      title,
      message,
      priority: 'medium',
      category: 'general',
      ...options
    });
  }

  warning(title: string, message: string, options: Partial<Notification> = {}): Notification {
    return this.createNotification({
      type: 'warning',
      title,
      message,
      priority: 'high',
      category: 'general',
      ...options
    });
  }

  error(title: string, message: string, options: Partial<Notification> = {}): Notification {
    return this.createNotification({
      type: 'error',
      title,
      message,
      priority: 'urgent',
      category: 'general',
      ...options
    });
  }

  reminder(title: string, message: string, options: Partial<Notification> = {}): Notification {
    return this.createNotification({
      type: 'reminder',
      title,
      message,
      priority: 'medium',
      category: 'reminder',
      ...options
    });
  }

  collaboration(title: string, message: string, options: Partial<Notification> = {}): Notification {
    return this.createNotification({
      type: 'collaboration',
      title,
      message,
      priority: 'high',
      category: 'collaboration',
      ...options
    });
  }

  // Note-specific Notifications
  noteCreated(note: Note): Notification {
    return this.createNotificationFromTemplate('note-created', {
      title: note.title,
      category: note.category
    });
  }

  noteUpdated(note: Note): Notification {
    return this.createNotificationFromTemplate('note-updated', {
      title: note.title,
      category: note.category
    });
  }

  noteShared(note: Note, sharedBy: string): Notification {
    return this.createNotificationFromTemplate('note-shared', {
      title: note.title,
      sharedBy,
      category: note.category
    });
  }

  noteCommented(note: Note, commenter: string): Notification {
    return this.createNotificationFromTemplate('note-commented', {
      title: note.title,
      commenter,
      category: note.category
    });
  }

  // Notification Management
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
  }

  deleteNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
  }

  getNotifications(options: {
    unreadOnly?: boolean;
    type?: Notification['type'];
    category?: string;
    limit?: number;
    offset?: number;
  } = {}): Notification[] {
    let filtered = [...this.notifications];

    if (options.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    if (options.type) {
      filtered = filtered.filter(n => n.type === options.type);
    }

    if (options.category) {
      filtered = filtered.filter(n => n.category === options.category);
    }

    if (options.offset) {
      filtered = filtered.slice(options.offset);
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getUnreadCountByCategory(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.notifications
      .filter(n => !n.read)
      .forEach(n => {
        counts[n.category] = (counts[n.category] || 0) + 1;
      });
    return counts;
  }

  // Notification Grouping
  getGroupedNotifications(): NotificationGroup[] {
    const groups = new Map<string, NotificationGroup>();

    this.notifications.forEach(notification => {
      const groupId = notification.groupId || notification.category;
      
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          title: this.getGroupTitle(groupId),
          notifications: [],
          unreadCount: 0,
          timestamp: notification.timestamp,
          category: notification.category
        });
      }

      const group = groups.get(groupId)!;
      group.notifications.push(notification);
      
      if (!notification.read) {
        group.unreadCount++;
      }

      if (notification.timestamp > group.timestamp) {
        group.timestamp = notification.timestamp;
      }
    });

    return Array.from(groups.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Scheduling
  scheduleNotification(
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
    schedule: NotificationSchedule['schedule']
  ): string {
    const scheduleId = this.generateId();
    const notificationSchedule: NotificationSchedule = {
      id: scheduleId,
      notification,
      schedule,
      active: true
    };

    this.schedules.push(notificationSchedule);
    this.scheduleNotificationExecution(notificationSchedule);
    this.saveSchedules();

    return scheduleId;
  }

  cancelScheduledNotification(scheduleId: string): boolean {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.active = false;
      this.clearScheduledTimer(scheduleId);
      this.saveSchedules();
      return true;
    }
    return false;
  }

  // Templates
  getTemplates(): NotificationTemplate[] {
    return [...this.templates];
  }

  addTemplate(template: NotificationTemplate): void {
    this.templates.push(template);
    this.saveTemplates();
  }

  updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): boolean {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.templates[index] = { ...this.templates[index], ...updates };
      this.saveTemplates();
      return true;
    }
    return false;
  }

  deleteTemplate(templateId: string): boolean {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      this.templates.splice(index, 1);
      this.saveTemplates();
      return true;
    }
    return false;
  }

  // Preferences
  updatePreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Event Listeners
  onNotification(callback: (notification: Notification) => void): string {
    const listenerId = this.generateId();
    this.listeners.set(listenerId, callback);
    return listenerId;
  }

  removeListener(listenerId: string): boolean {
    return this.listeners.delete(listenerId);
  }

  // Private Methods
  private emitNotification(notification: Notification): void {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  private deliverNotification(notification: Notification): void {
    // Check quiet hours
    if (this.isInQuietHours()) {
      return;
    }

    // Check category preferences
    const categoryPrefs = this.preferences.categories[notification.category];
    if (categoryPrefs) {
      if (!categoryPrefs.inApp) return;
    }

    // Deliver based on preferences
    if (this.preferences.inApp) {
      this.showInAppNotification(notification);
    }

    if (this.preferences.push && this.isPushSupported()) {
      this.showPushNotification(notification);
    }

    if (this.preferences.sound) {
      this.playNotificationSound(notification);
    }

    if (this.preferences.vibration && this.isVibrationSupported()) {
      this.vibrate(notification);
    }
  }

  private showInAppNotification(notification: Notification): void {
    // This would typically integrate with a UI notification system
    console.log('In-app notification:', notification);
  }

  private showPushNotification(notification: Notification): void {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // This would show a browser push notification
      console.log('Push notification:', notification);
    }
  }

  private playNotificationSound(notification: Notification): void {
    const audio = new Audio();
    
    switch (notification.priority) {
      case 'urgent':
        audio.src = '/sounds/urgent.mp3';
        break;
      case 'high':
        audio.src = '/sounds/high.mp3';
        break;
      default:
        audio.src = '/sounds/default.mp3';
    }

    audio.play().catch(error => {
      console.warn('Could not play notification sound:', error);
    });
  }

  private vibrate(notification: Notification): void {
    if ('vibrate' in navigator) {
      const pattern = notification.priority === 'urgent' ? [200, 100, 200] : [200];
      navigator.vibrate(pattern);
    }
  }

  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const { start, end } = this.preferences.quietHours;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Handles overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= start || currentTime <= end;
    }
  }

  private isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  private isVibrationSupported(): boolean {
    return 'vibrate' in navigator;
  }

  private scheduleNotificationExecution(schedule: NotificationSchedule): void {
    if (!schedule.active) return;

    let delay: number;

    switch (schedule.schedule.type) {
      case 'once':
        if (schedule.schedule.datetime) {
          delay = schedule.schedule.datetime.getTime() - Date.now();
        } else {
          return;
        }
        break;
      case 'interval':
        delay = (schedule.schedule.interval || 60) * 60 * 1000;
        break;
      case 'recurring':
        delay = this.calculateRecurringDelay(schedule.schedule);
        break;
      default:
        return;
    }

    if (delay > 0) {
      const timer = setTimeout(() => {
        this.executeScheduledNotification(schedule);
      }, delay);

      this.scheduledTimers.set(schedule.id, timer);
    }
  }

  private calculateRecurringDelay(schedule: NotificationSchedule['schedule']): number {
    if (!schedule.daysOfWeek || !schedule.timeOfDay) return 0;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    const targetTime = schedule.timeOfDay;

    // Find next occurrence
    for (let i = 0; i < 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (schedule.daysOfWeek.includes(checkDay)) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + i);
        
        const [hours, minutes] = targetTime.split(':').map(Number);
        targetDate.setHours(hours, minutes, 0, 0);

        const delay = targetDate.getTime() - now.getTime();
        if (delay > 0) {
          return delay;
        }
      }
    }

    return 0;
  }

  private executeScheduledNotification(schedule: NotificationSchedule): void {
    if (!schedule.active) return;

    // Create the notification
    this.createNotification(schedule.notification);

    // Reschedule if it's recurring
    if (schedule.schedule.type === 'recurring' || schedule.schedule.type === 'interval') {
      this.scheduleNotificationExecution(schedule);
    }
  }

  private clearScheduledTimer(scheduleId: string): void {
    const timer = this.scheduledTimers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.scheduledTimers.delete(scheduleId);
    }
  }

  private startScheduleProcessor(): void {
    // Process existing schedules
    this.schedules.forEach(schedule => {
      if (schedule.active) {
        this.scheduleNotificationExecution(schedule);
      }
    });
  }

  private getGroupTitle(groupId: string): string {
    const group = this.notifications.find(n => n.groupId === groupId || n.category === groupId);
    if (group?.groupId) {
      return group.groupId;
    }
    return groupId.charAt(0).toUpperCase() + groupId.slice(1);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Persistence
  private saveNotifications(): void {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  private loadNotifications(): void {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      this.notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
      }));
    }
  }

  private saveSchedules(): void {
    localStorage.setItem('notificationSchedules', JSON.stringify(this.schedules));
  }

  private loadSchedules(): void {
    const saved = localStorage.getItem('notificationSchedules');
    if (saved) {
      this.schedules = JSON.parse(saved).map((s: any) => ({
        ...s,
        notification: {
          ...s.notification,
          timestamp: new Date(s.notification.timestamp)
        },
        schedule: {
          ...s.schedule,
          datetime: s.schedule.datetime ? new Date(s.schedule.datetime) : undefined
        }
      }));
    }
  }

  private saveTemplates(): void {
    localStorage.setItem('notificationTemplates', JSON.stringify(this.templates));
  }

  private loadTemplates(): void {
    const saved = localStorage.getItem('notificationTemplates');
    if (saved) {
      this.templates = JSON.parse(saved);
    }
  }

  private savePreferences(): void {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }

  private loadPreferences(): void {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      this.preferences = { ...this.preferences, ...JSON.parse(saved) };
    }
  }

  private initializeDefaultTemplates(): void {
    this.templates = [
      {
        id: 'note-created',
        name: 'Note Created',
        type: 'success',
        title: 'Note Created',
        message: 'Note "{{title}}" was created in {{category}}',
        priority: 'low',
        category: 'notes',
        variables: ['title', 'category'],
        isDefault: true
      },
      {
        id: 'note-updated',
        name: 'Note Updated',
        type: 'info',
        title: 'Note Updated',
        message: 'Note "{{title}}" was updated',
        priority: 'low',
        category: 'notes',
        variables: ['title'],
        isDefault: true
      },
      {
        id: 'note-shared',
        name: 'Note Shared',
        type: 'collaboration',
        title: 'Note Shared',
        message: '{{sharedBy}} shared note "{{title}}" with you',
        priority: 'high',
        category: 'collaboration',
        variables: ['title', 'sharedBy'],
        isDefault: true
      },
      {
        id: 'note-commented',
        name: 'Note Commented',
        type: 'collaboration',
        title: 'New Comment',
        message: '{{commenter}} commented on note "{{title}}"',
        priority: 'medium',
        category: 'collaboration',
        variables: ['title', 'commenter'],
        isDefault: true
      },
      {
        id: 'reminder-due',
        name: 'Reminder Due',
        type: 'reminder',
        title: 'Reminder',
        message: '{{reminderText}}',
        priority: 'high',
        category: 'reminder',
        variables: ['reminderText'],
        isDefault: true
      },
      {
        id: 'system-maintenance',
        name: 'System Maintenance',
        type: 'warning',
        title: 'System Maintenance',
        message: '{{maintenanceMessage}}',
        priority: 'medium',
        category: 'system',
        variables: ['maintenanceMessage'],
        isDefault: true
      }
    ];
  }

  // Cleanup
  cleanup(): void {
    this.scheduledTimers.forEach(timer => clearTimeout(timer));
    this.scheduledTimers.clear();
    this.listeners.clear();
  }
}

export const advancedNotificationService = new AdvancedNotificationService(); 