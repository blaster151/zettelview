export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss after this many ms
  timestamp: number;
}

class NotificationService {
  private listeners: ((notifications: Notification[]) => void)[] = [];
  private notifications: Notification[] = [];
  private nextId = 1;

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify listeners of changes
   */
  private notify(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  /**
   * Add a notification
   */
  add(
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ): string {
    const id = `notification-${this.nextId++}`;
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: Date.now()
    };

    this.notifications.push(notification);
    this.notify();

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  /**
   * Remove a notification
   */
  remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.notify();
    }
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = [];
    this.notify();
  }

  /**
   * Get current notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Convenience methods for different notification types
   */
  success(title: string, message: string, duration?: number): string {
    return this.add('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number): string {
    return this.add('error', title, message, duration);
  }

  warning(title: string, message: string, duration?: number): string {
    return this.add('warning', title, message, duration);
  }

  info(title: string, message: string, duration?: number): string {
    return this.add('info', title, message, duration);
  }
}

// Export singleton instance
export const notificationService = new NotificationService(); 